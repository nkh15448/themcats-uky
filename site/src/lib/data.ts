import { getCollection, type CollectionEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import { chapter, chapterSetName } from './kaplan';
import { url } from './url';

export type Meeting = CollectionEntry<'meetings'>;
export type Resource = CollectionEntry<'resources'>;
export type Material = Meeting['data']['materials'][number];

export const SECTIONS = {
  cp: { short: 'C/P', name: 'Chem/Phys' },
  cars: { short: 'CARS', name: 'Critical Analysis & Reasoning' },
  bb: { short: 'B/B', name: 'Bio/Biochem' },
  ps: { short: 'P/S', name: 'Psych/Soc' },
} as const;

export const KIND_LABEL: Record<string, string> = {
  anki: 'Anki deck',
  handout: 'Handout',
  tool: 'Tool',
  course: 'Course',
  book: 'Book',
  community: 'Community',
  slides: 'Slides',
  recording: 'Recording',
  questions: 'Questions',
  link: 'Link',
};

export const MEETING_TYPE = {
  chemistry: { label: 'Chemistry', short: 'Chem', section: 'cp' },
  biology: { label: 'Biology / Biochem', short: 'Bio', section: 'bb' },
  general: { label: 'General', short: 'General', section: undefined },
} as const;

/** Meetings stay "upcoming" through the end of their day in Lexington. */
export function isUpcoming(m: Meeting, now = new Date()) {
  const end = new Date(m.data.date);
  end.setUTCHours(23 + 5, 59);
  return end >= now;
}

export async function meetings() {
  const all = await getCollection('meetings');
  return all.sort((a, b) => +a.data.date - +b.data.date);
}

export const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

export const meetingUrl = (m: Meeting) => url(`/meetings/${m.id}/`);

export const meetingLabel = (m: Meeting) =>
  `${MEETING_TYPE[m.data.type].label} · ${fmtDate(m.data.date, { month: 'short', day: 'numeric' })}`;

/** A material's display name: its own title, or one generated from its chapters. */
export function materialTitle(mat: Material) {
  if (mat.title) return mat.title;
  if (mat.chapters.length === 1) {
    const c = chapter(mat.chapters[0]);
    return `${c.short} — ${c.title}`;
  }
  if (mat.chapters.length) return chapterSetName(mat.chapters);
  return KIND_LABEL[mat.kind];
}

// Keep the hand-curated order of resources.yaml (the loader returns entries sorted by id).
const curated = [...readFileSync('src/content/resources.yaml', 'utf8').matchAll(/^- id: (\S+)/gm)].map((m) => m[1]);

export type LibraryItem = {
  id: string;
  title: string;
  kind: string;
  sections: string[];
  allSections: boolean;
  cost: 'free' | 'paid';
  summary: string;
  details?: string;
  note?: string;
  stats?: string;
  href: string;
  download?: string;
  subject?: string;
  cta?: { label: string; href: string };
  chapters: string[];
  origin: 'library' | 'seminar';
  date?: string;
  meetings: { url: string; label: string }[];
};

/** One flat list of everything searchable: library resources + every seminar material. */
export async function library(): Promise<LibraryItem[]> {
  const [res, mtgs] = await Promise.all([getCollection('resources'), meetings()]);
  res.sort((a, b) => curated.indexOf(a.id) - curated.indexOf(b.id));

  const items: LibraryItem[] = res.map((r) => ({
    id: r.id,
    title: r.data.title,
    kind: r.data.kind,
    sections: r.data.sections ?? ['cp', 'cars', 'bb', 'ps'],
    allSections: !r.data.sections,
    cost: r.data.cost,
    summary: r.data.summary,
    details: r.data.details,
    note: r.data.note,
    stats: r.data.stats,
    href: url(r.data.href),
    download: r.data.download,
    subject: r.data.subject,
    cta: r.data.cta,
    chapters: [],
    origin: 'library',
    meetings: mtgs.filter((m) => m.data.resources.includes(r.id)).map((m) => ({ url: meetingUrl(m), label: meetingLabel(m) })),
  }));

  const seen = new Set<string>();
  for (const m of mtgs) {
    m.data.materials.forEach((mat, i) => {
      // Skip plain links, and the same file attached to more than one meeting.
      if (mat.kind === 'link' || seen.has(mat.href)) return;
      seen.add(mat.href);
      const chapters = mat.chapters.map(chapter);
      const section = MEETING_TYPE[m.data.type].section;
      const books = [...new Set(chapters.map((c) => c.book))];
      const sections = [...new Set(chapters.map((c) => c.section as string | undefined).filter((s): s is string => !!s))];
      items.push({
        id: `${m.id}--${i}`,
        title: m.data.type === 'general' ? `${m.data.title} — ${materialTitle(mat)}` : materialTitle(mat),
        kind: mat.kind,
        sections: sections.length ? sections : section ? [section] : [],
        allSections: false,
        cost: 'free',
        summary:
          m.data.type === 'general'
            ? m.data.summary ?? ''
            : `${KIND_LABEL[mat.kind]} from the ${fmtDate(m.data.date, { month: 'long', day: 'numeric' })} ${MEETING_TYPE[m.data.type].label.toLowerCase()} seminar.`,
        details: chapters.length > 1 ? `Covers ${chapters.map((c) => `${c.short} (${c.title})`).join(', ')}.` : undefined,
        stats: mat.href.endsWith('.pdf') ? 'PDF' : undefined,
        href: url(mat.href),
        subject: books.join(', ') || undefined,
        chapters: mat.chapters,
        origin: 'seminar',
        date: m.data.date.toISOString(),
        meetings: [{ url: meetingUrl(m), label: meetingLabel(m) }],
      });
    });
  }
  return items;
}

/** Parse "6:00 PM" into 24h hours and minutes. */
export function parseTime(t: string) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return { h: 0, min: 0 };
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return { h, min: Number(m[2]) };
}

/** Local start/end as "YYYYMMDDTHHMMSS" (America/New_York), defaulting to a 1h event. */
export function meetingTimes(m: Meeting) {
  const day = m.data.date.toISOString().slice(0, 10).replace(/-/g, '');
  const s = parseTime(m.data.time);
  const e = m.data.end ? parseTime(m.data.end) : { h: s.h + 1, min: s.min };
  const pad = (n: number) => String(n).padStart(2, '0');
  return { start: `${day}T${pad(s.h)}${pad(s.min)}00`, end: `${day}T${pad(e.h)}${pad(e.min)}00` };
}

/** Sessions on the seminar plan (anything with chapters or topics), numbered within their semester. */
export function seminarNumber(m: Meeting, all: Meeting[]) {
  const sem = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth() >= 7 ? 'fall' : 'spring'}`;
  const isSession = (x: Meeting) => x.data.covers.length > 0 || x.data.topics.length > 0;
  if (!isSession(m)) return undefined;
  const list = all.filter((x) => isSession(x) && sem(x.data.date) === sem(m.data.date));
  return { n: list.indexOf(m) + 1, of: list.length };
}

export function googleCalendarUrl(m: Meeting) {
  const { start, end } = meetingTimes(m);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `M-CATS: ${m.data.title}`,
    dates: `${start}/${end}`,
    ctz: 'America/New_York',
    location: m.data.location,
    details: m.data.covers.map((c) => chapterSetName([c])).join(', '),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
