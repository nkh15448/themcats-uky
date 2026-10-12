// ─────────────────────────────────────────────────────────────
//  Anonymous usage counts, via GoatCounter (themcats.goatcounter.com).
//  Page views are counted automatically; these record clicks and searches
//  as "events", which show up in the dashboard alongside the pages.
//  Does nothing when the counter isn't loaded (local dev, preview builds).
// ─────────────────────────────────────────────────────────────

type GoatCounter = { count: (o: { path: string; title?: string; event?: boolean }) => void };

export function track(path: string, title = path) {
  const gc = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
  gc?.count?.({ path, title, event: true });
}

const FILE = /\.(pdf|apkg|xlsx?|docx?|pptx?|jpe?g|png|zip|ics)$/i;

/** Count a followed link if it's a file download or leaves the site. */
export function trackLink(href: string, title = '') {
  const u = new URL(href, location.href);
  if (FILE.test(u.pathname)) {
    const file = decodeURIComponent(u.pathname.split('/').pop()!);
    track(`download: ${file}`, title || file);
  } else if (u.host !== location.host && u.protocol.startsWith('http')) {
    track(`outbound: ${u.host}${u.pathname}`, title || u.host);
  }
}
