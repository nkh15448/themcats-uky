// Every internal link and file path goes through url(), so the site works both
// at the root of a domain (themcats.org) and under a sub-path (a GitHub Pages
// preview such as /themcats-preview/). External links pass through untouched.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return BASE + path;
}

/** The current page path without the base, e.g. "/resources/". */
export function stripBase(pathname: string) {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}
