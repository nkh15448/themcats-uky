// Checks a built site (dist/) for broken internal links and files.
//   node scripts/check-links.mjs [base]        e.g. node scripts/check-links.mjs /themcats-preview
// Every internal href/src/srcset, CSS url(), and path inside embedded JSON must
// resolve to a file in dist/. With a base, paths missing the base are flagged too.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const BASE = (process.argv[2] ?? '').replace(/\/$/, '');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (['.html', '.css'].includes(extname(p))) files.push(p);
  }
})(DIST);

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"');
const problems = new Map();
const note = (file, msg) => {
  const k = `${msg}`;
  problems.set(k, [...(problems.get(k) ?? []), file.replace(DIST, '')]);
};

function check(file, raw) {
  let ref = decode(raw).trim();
  if (!ref.startsWith('/') || ref.startsWith('//')) return; // external, relative, data:, mailto:, #...
  if (BASE && !(ref === BASE || ref.startsWith(BASE + '/'))) return note(file, `missing base: ${ref}`);
  let path = ref.slice(BASE.length).split(/[?#]/)[0];
  try { path = decodeURI(path); } catch {}
  if (path === '' || path.endsWith('/')) path += 'index.html';
  if (!existsSync(join(DIST, path))) note(file, `not found: ${ref}`);
}

let count = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const refs = [];
  if (file.endsWith('.html')) {
    for (const m of text.matchAll(/\s(?:href|src|poster|data-src)="([^"]*)"/g)) refs.push(m[1]);
    for (const m of text.matchAll(/\ssrcset="([^"]*)"/g)) refs.push(...m[1].split(',').map((x) => x.trim().split(/\s+/)[0]));
    // paths inside embedded JSON (search index, meeting data, gallery)
    for (const m of text.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
      for (const j of m[1].matchAll(/"(\/[^"]*)"/g)) refs.push(j[1]);
    }
  }
  for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refs.push(m[1]);
  for (const r of refs) { count++; check(file, r); }
}

if (problems.size) {
  console.log(`✗ ${problems.size} problem(s) across ${count} references:\n`);
  for (const [msg, where] of problems) console.log(`  ${msg}\n      in ${[...new Set(where)].slice(0, 4).join(', ')}${where.length > 4 ? ', …' : ''}`);
  process.exit(1);
}
console.log(`✓ ${count} references in ${files.length} files, all resolve${BASE ? ` under ${BASE}` : ''}.`);
