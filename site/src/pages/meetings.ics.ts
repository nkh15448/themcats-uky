// Calendar feed: subscribe once in Google/Apple Calendar and new seminars appear automatically.
import type { APIRoute } from 'astro';
import { meetings, meetingTimes, meetingUrl, materialTitle } from '../lib/data';
import { chapter } from '../lib/kaplan';

import { url } from '../lib/url';

// Absolute links for calendar apps: the configured site plus any base path.
const abs = (path: string) => new URL(url(path), import.meta.env.SITE ?? 'https://themcats.org').href;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
// Lines longer than 75 octets must be folded.
const fold = (line: string) => line.match(/.{1,73}/g)!.join('\r\n ');

export const GET: APIRoute = async () => {
  const all = await meetings();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events = all.flatMap((m) => {
    const { start, end } = meetingTimes(m);
    const chapters = m.data.covers.map((c) => `${chapter(c).short}: ${chapter(c).title}`);
    const body = [
      ...chapters,
      ...m.data.topics,
      ...m.data.materials.map((x) => `${materialTitle(x)}: ${x.href.startsWith('/') ? encodeURI(abs(x.href)) : x.href}`),
      abs(`/meetings/${m.id}/`),
    ].join('\n');
    const summary = m.data.covers.length
      ? `M-CATS ${m.data.type === 'chemistry' ? 'Chem' : 'Bio'}: ${m.data.covers.map((c) => chapter(c).abbr).join(', ')}`
      : `M-CATS: ${m.data.title}`;
    return [
      'BEGIN:VEVENT',
      `UID:${m.id}@themcats.org`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/New_York:${start}`,
      `DTEND;TZID=America/New_York:${end}`,
      `SUMMARY:${esc(summary)}`,
      `LOCATION:${esc(m.data.location)}`,
      `DESCRIPTION:${esc(body)}`,
      `URL:${abs(`/meetings/${m.id}/`)}`,
      'END:VEVENT',
    ];
  });
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The M-CATS//Seminars//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:The M-CATS',
    'X-WR-TIMEZONE:America/New_York',
    'BEGIN:VTIMEZONE',
    'TZID:America/New_York',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
