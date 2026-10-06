// fzf-style matcher, small enough to ship to the browser.
//
// Every space-separated term must match. In the title a term matches as a
// subsequence ("aad" → "Amino Acids Deck"), scored up for word starts and
// consecutive runs. In the other fields a term must appear as a substring,
// which keeps long descriptions from matching everything.

export type Doc = { title: string; tags?: string; body?: string };
export type Hit = { score: number; ranges: [number, number][] };

const isBoundary = (s: string, i: number) => i === 0 || /[\s\-—_/:(.&,]/.test(s[i - 1]) || (/[a-z]/.test(s[i - 1]) && /[A-Z0-9]/.test(s[i]));

function subsequence(term: string, text: string): { score: number; pos: number[] } | null {
  const t = text.toLowerCase();
  let best: { score: number; pos: number[] } | null = null;
  // Try each occurrence of the first character as a start, keep the best scoring alignment.
  for (let start = t.indexOf(term[0]); start !== -1; start = t.indexOf(term[0], start + 1)) {
    const pos = [start];
    let i = start + 1;
    for (let k = 1; k < term.length; k++) {
      // prefer the next word-start occurrence if it is close; otherwise the next occurrence
      const next = t.indexOf(term[k], i);
      if (next === -1) return best;
      let pick = next;
      for (let j = next; j !== -1 && j - next < 12; j = t.indexOf(term[k], j + 1)) {
        if (isBoundary(text, j)) { pick = j; break; }
        if (j === pos[pos.length - 1] + 1) { pick = j; break; }
      }
      pos.push(pick);
      i = pick + 1;
    }
    let score = 0;
    for (let k = 0; k < pos.length; k++) {
      score += 10;
      if (isBoundary(text, pos[k])) score += 8;
      if (k > 0) {
        const gap = pos[k] - pos[k - 1] - 1;
        if (gap === 0) score += 6;
        else score -= Math.min(gap, 8);
      }
    }
    if (pos[0] === 0) score += 6;
    if (!best || score > best.score) best = { score, pos };
  }
  return best;
}

function toRanges(pos: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of [...new Set(pos)].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && last[1] === p - 1) last[1] = p;
    else out.push([p, p]);
  }
  return out;
}

export function match(query: string, doc: Doc): Hit | null {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return { score: 0, ranges: [] };
  const tags = (doc.tags ?? '').toLowerCase();
  const body = (doc.body ?? '').toLowerCase();
  let score = 0;
  const pos: number[] = [];
  for (const term of terms) {
    const inTitle = subsequence(term, doc.title);
    // A title match must be reasonably tight: reject alignments scattered across the whole title.
    const tight = inTitle && inTitle.score >= term.length * 7;
    if (tight) {
      score += inTitle!.score;
      pos.push(...inTitle!.pos);
    } else if (tags.includes(term)) {
      score += term.length * 6;
    } else if (body.includes(term)) {
      score += term.length * 3;
    } else {
      return null;
    }
  }
  // Shorter titles win ties.
  return { score: score - doc.title.length * 0.05, ranges: toRanges(pos) };
}

export function search<T extends Doc>(query: string, docs: T[]) {
  return docs
    .map((doc) => ({ doc, hit: match(query, doc) }))
    .filter((r): r is { doc: T; hit: Hit } => r.hit !== null)
    .sort((a, b) => b.hit.score - a.hit.score);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function highlight(text: string, ranges: [number, number][]) {
  let out = '';
  let last = 0;
  for (const [a, b] of ranges) {
    out += escapeHtml(text.slice(last, a)) + '<mark>' + escapeHtml(text.slice(a, b + 1)) + '</mark>';
    last = b + 1;
  }
  return out + escapeHtml(text.slice(last));
}

export { escapeHtml };
