// ─────────────────────────────────────────────────────────────
//  A small painting kit for scripts/bake-orbit.mjs: float images, noise,
//  blur, line splats, chromatic aberration and export.
//  (Grown in experiments/halation; this copy belongs to the site.)
//
//  Images are "light on black": three Float32 planes that add up.
//  toRGBA() turns light into straight-alpha pixels, so a baked layer
//  sits on the dark page exactly as it would have been painted there.
// ─────────────────────────────────────────────────────────────
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoothstep = (a, b, v) => smooth(clamp((v - a) / (b - a)));
export const mix = (a, b, t) => a + (b - a) * t;
export const g = (d, s) => Math.exp(-0.5 * (d / s) ** 2);
export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Images ───────────────────────────────────────────────────
export const plane = (w, h) => new Float32Array(w * h);
export const image = (w, h) => ({ w, h, r: plane(w, h), g: plane(w, h), b: plane(w, h) });

/** dst += src × tint × k, for a mono plane into an image. */
export function addTint(dst, src, tint, k = 1) {
  const [tr, tg, tb] = tint;
  for (let i = 0; i < src.length; i++) {
    const v = src[i] * k;
    if (v === 0) continue;
    dst.r[i] += v * tr;
    dst.g[i] += v * tg;
    dst.b[i] += v * tb;
  }
}

export function addImage(dst, src, k = 1) {
  for (const c of ['r', 'g', 'b']) for (let i = 0; i < dst[c].length; i++) dst[c][i] += src[c][i] * k;
}

export function mapImage(im, fn) {
  const { w, h } = im;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const [r, gg, b] = fn(im.r[i], im.g[i], im.b[i], x, y, i);
      im.r[i] = r;
      im.g[i] = gg;
      im.b[i] = b;
    }
}

// ── Noise ────────────────────────────────────────────────────
/** Gradient noise in about [-0.7, 0.7]. px/py tile it every px × py cells (≤ 256). */
export function perlin(seed) {
  const rnd = rng(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint16Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const GX = new Float32Array(256);
  const GY = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const a = rnd() * TAU;
    GX[i] = Math.cos(a);
    GY[i] = Math.sin(a);
  }
  return (x, y, px = 256, py = 256) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const x0 = ((xi % px) + px) % px;
    const y0 = ((yi % py) + py) % py;
    const x1 = (x0 + 1) % px;
    const y1 = (y0 + 1) % py;
    const h00 = perm[perm[x0] + y0];
    const h10 = perm[perm[x1] + y0];
    const h01 = perm[perm[x0] + y1];
    const h11 = perm[perm[x1] + y1];
    const n00 = GX[h00] * xf + GY[h00] * yf;
    const n10 = GX[h10] * (xf - 1) + GY[h10] * yf;
    const n01 = GX[h01] * xf + GY[h01] * (yf - 1);
    const n11 = GX[h11] * (xf - 1) + GY[h11] * (yf - 1);
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    return mix(mix(n00, n10, u), mix(n01, n11, u), v);
  };
}

/** Fractal noise, remapped to about [0, 1]. */
export function fbm(n, x, y, oct = 5, lac = 2, gain = 0.5, px = 256, py = 256) {
  let s = 0;
  let a = 1;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    s += a * n(x * f, y * f, Math.min(256, px * f), Math.min(256, py * f));
    norm += a;
    a *= gain;
    f *= lac;
  }
  return 0.5 + (s / norm) * 0.9;
}

/** Ridged fractal noise in [0, 1]: thin bright creases, like dust lanes or folds. */
export function ridged(n, x, y, oct = 4) {
  let s = 0;
  let a = 1;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    const r = 1 - Math.abs(n(x * f, y * f) * 1.4);
    s += a * r * r;
    norm += a;
    a *= 0.5;
    f *= 2;
  }
  return s / norm;
}

/** Cellular noise: returns F2 − F1 in pixels (small along cell borders = cracks). */
export function worley(seed, cell) {
  const hash = (ix, iy, k) => {
    let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed + k, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (x, y) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    let f1 = 1e9;
    let f2 = 1e9;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const ix = cx + i;
        const iy = cy + j;
        const fx = (ix + 0.1 + 0.8 * hash(ix, iy, 0)) * cell;
        const fy = (iy + 0.1 + 0.8 * hash(ix, iy, 1)) * cell;
        const d = Math.hypot(x - fx, y - fy);
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
    return f2 - f1;
  };
}

// ── Blur ─────────────────────────────────────────────────────
function boxes(sigma, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  return Array.from({ length: n }, (_, i) => ((i < m ? wl : wl + 2) - 1) / 2);
}

function boxPass(src, dst, w, h, r, horizontal, wrap) {
  const inv = 1 / (2 * r + 1);
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const at = horizontal ? (line, k) => line * w + k : (line, k) => k * w + line;
  for (let line = 0; line < lines; line++) {
    let acc = 0;
    const get = (k) => {
      if (wrap) return src[at(line, ((k % len) + len) % len)];
      return k >= 0 && k < len ? src[at(line, k)] : 0;
    };
    for (let k = -r; k <= r; k++) acc += get(k);
    for (let k = 0; k < len; k++) {
      dst[at(line, k)] = acc * inv;
      acc += get(k + r + 1) - get(k - r);
    }
  }
}

/** Gaussian blur of a plane (three box passes; zero outside unless wrap). */
export function blur(src, w, h, sigma, wrap = false) {
  if (sigma < 0.5) return Float32Array.from(src);
  let a = Float32Array.from(src);
  let b = plane(w, h);
  for (const r of boxes(sigma)) {
    if (r < 1) continue;
    boxPass(a, b, w, h, r, true, wrap);
    boxPass(b, a, w, h, r, false, wrap);
  }
  return a;
}

export function blurImage(im, sigma, wrap = false) {
  return { w: im.w, h: im.h, r: blur(im.r, im.w, im.h, sigma, wrap), g: blur(im.g, im.w, im.h, sigma, wrap), b: blur(im.b, im.w, im.h, sigma, wrap) };
}

// ── Sampling ─────────────────────────────────────────────────
export function bilinear(src, w, h, x, y) {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 0;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const tx = x - x0;
  const ty = y - y0;
  const a = src[y0 * w + x0] * (1 - tx) + src[y0 * w + x1] * tx;
  const b = src[y1 * w + x0] * (1 - tx) + src[y1 * w + x1] * tx;
  return a * (1 - ty) + b * ty;
}

// ── Chromatic aberration ─────────────────────────────────────
// A lens bends red and blue by different amounts, so each colour lands a
// little bigger or smaller (lateral CA) and a little shifted. We render
// the light once in mono, then lay down a spread of tinted copies whose
// tints add up to white: where they overlap the line stays white, at the
// edges it splits into red on one side and blue/cyan on the other.
const ANCHORS = [
  [-1.0, [0.05, 0.2, 0.62]], // blue
  [-0.5, [0.04, 0.34, 0.3]], // cyan
  [0.0, [0.3, 0.3, 0.06]], // warm white
  [0.5, [0.32, 0.11, 0.0]], // red
  [1.0, [0.29, 0.05, 0.13]], // rose
];
export function spectrum(n = 9, anchors = ANCHORS) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = -1 + (2 * k) / (n - 1);
    let j = 0;
    while (j < anchors.length - 2 && t > anchors[j + 1][0]) j++;
    const [t0, c0] = anchors[j];
    const [t1, c1] = anchors[j + 1];
    const u = clamp((t - t0) / (t1 - t0));
    out.push({ t, c: c0.map((v, i) => mix(v, c1[i], u)) });
  }
  const sum = [0, 1, 2].map((i) => out.reduce((a, s) => a + s.c[i], 0));
  for (const s of out) s.c = s.c.map((v, i) => v / sum[i]);
  return out;
}

/** Mono light → colour image with lateral CA about (cx, cy). */
export function aberrate(src, w, h, { cx, cy, scale = 0, shift = [0, 0], spec = spectrum() }) {
  const out = image(w, h);
  for (const { t, c } of spec) {
    const s = 1 + scale * t;
    const ox = shift[0] * t;
    const oy = shift[1] * t;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = bilinear(src, w, h, cx + (x - cx) / s - ox, cy + (y - cy) / s - oy);
        if (v === 0) continue;
        const i = y * w + x;
        out.r[i] += v * c[0];
        out.g[i] += v * c[1];
        out.b[i] += v * c[2];
      }
  }
  return out;
}

/** A plane scaled by s about (cx, cy) and shifted by (ox, oy). */
export function resample(src, w, h, cx, cy, s, ox = 0, oy = 0) {
  const out = plane(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) out[y * w + x] = bilinear(src, w, h, cx + (x - cx) / s - ox, cy + (y - cy) / s - oy);
  return out;
}

export const FRINGE = {
  core: [1, 0.965, 0.92], // warm print white
  red: [1, 0.26, 0.4], // rose-red, #c65b67 pushed to light
  blue: [0.14, 0.42, 1], // #235da8 pushed to light
  cyan: [0.08, 0.62, 0.72], // #28899c
};

/**
 * The look of the mockups: a white core line, with a soft rose copy pushed
 * outward on one side and a blue/cyan copy on the other (a print that is a
 * hair out of register, seen through a lens with lateral CA).
 */
export function fringe(L, w, h, { cx, cy, scale = 0, shift = [0, 0], soft = 2, k = 0.8, core = 1, tints = FRINGE }) {
  const out = image(w, h);
  addTint(out, L, tints.core, core);
  const Ls = blur(L, w, h, soft);
  addTint(out, resample(Ls, w, h, cx, cy, 1 + scale, shift[0], shift[1]), tints.red, k);
  addTint(out, resample(Ls, w, h, cx, cy, 1 - scale, -shift[0], -shift[1]), tints.blue, k);
  addTint(out, resample(Ls, w, h, cx, cy, 1 - scale * 0.45, -shift[0] * 0.45, -shift[1] * 0.45), tints.cyan, k * 0.3);
  return out;
}

// ── Strokes ──────────────────────────────────────────────────
/** Adds a soft line through points [x, y, intensity, sigma?]. Peak height ≈ intensity. */
export function stroke(pl, w, h, pts, sigma = 1.2) {
  for (let p = 0; p < pts.length; p++) {
    const [x, y, k, s0] = pts[p];
    const s = s0 ?? sigma;
    const nx = pts[Math.min(p + 1, pts.length - 1)];
    const pv = pts[Math.max(p - 1, 0)];
    const ds = Math.hypot(nx[0] - pv[0], nx[1] - pv[1]) / (p === 0 || p === pts.length - 1 ? 1 : 2);
    const wgt = (k * ds) / (Math.sqrt(TAU) * s);
    const R = Math.ceil(s * 3.2);
    const inv = 1 / (2 * s * s);
    for (let yy = Math.max(0, Math.floor(y - R)); yy <= Math.min(h - 1, Math.ceil(y + R)); yy++)
      for (let xx = Math.max(0, Math.floor(x - R)); xx <= Math.min(w - 1, Math.ceil(x + R)); xx++) {
        const d2 = (xx - x) ** 2 + (yy - y) ** 2;
        pl[yy * w + xx] += wgt * Math.exp(-d2 * inv);
      }
  }
}

/** Samples a curve f(t) → [x, y, k, sigma?] at roughly `step` px spacing. */
export function trace(f, t0, t1, step = 0.4) {
  const out = [];
  let t = t0;
  let prev = f(t0);
  out.push(prev);
  let dt = (t1 - t0) / 2000;
  while (t < t1) {
    let next = f(Math.min(t1, t + dt));
    const d = Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    if (d > step * 1.5 && dt > 1e-7) {
      dt /= 2;
      continue;
    }
    if (d < step * 0.5) dt *= 1.5;
    t = Math.min(t1, t + dt);
    next = f(t);
    out.push(next);
    prev = next;
  }
  return out;
}

/** A soft round dot (stars, specks). */
export function dot(pl, w, h, x, y, r, k) {
  const R = Math.ceil(r * 4);
  for (let yy = Math.max(0, Math.floor(y - R)); yy <= Math.min(h - 1, y + R); yy++)
    for (let xx = Math.max(0, Math.floor(x - R)); xx <= Math.min(w - 1, x + R); xx++) pl[yy * w + xx] += k * g(Math.hypot(xx - x, yy - y), r);
}

// ── Finishing ────────────────────────────────────────────────
/** Soft shoulder so overlapping light rolls off to white instead of clipping. */
export function tonemap(im, k = 1.4) {
  for (const c of ['r', 'g', 'b']) {
    const a = im[c];
    for (let i = 0; i < a.length; i++) a[i] = 1 - Math.exp(-k * Math.max(0, a[i]));
  }
  return im;
}

/** Light on black → straight-alpha RGBA bytes. */
export function toRGBA(im) {
  const n = im.w * im.h;
  const px = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const r = clamp(im.r[i]);
    const gg = clamp(im.g[i]);
    const b = clamp(im.b[i]);
    const a = Math.max(r, gg, b, 1e-6);
    px[i * 4] = Math.round((r / a) * 255);
    px[i * 4 + 1] = Math.round((gg / a) * 255);
    px[i * 4 + 2] = Math.round((b / a) * 255);
    px[i * 4 + 3] = Math.round(a * 255);
  }
  return px;
}

export function toRGB(im) {
  const n = im.w * im.h;
  const px = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    px[i * 3] = Math.round(clamp(im.r[i]) * 255);
    px[i * 3 + 1] = Math.round(clamp(im.g[i]) * 255);
    px[i * 3 + 2] = Math.round(clamp(im.b[i]) * 255);
  }
  return px;
}

const ART = new URL('../../src/assets/present/orbit/', import.meta.url);
export const artPath = (name) => fileURLToPath(new URL(name, ART));

export async function save(name, im, { alpha = true, quality = 84, alphaQuality = 92, lossless = false, preview = false } = {}) {
  const channels = alpha ? 4 : 3;
  const s = sharp(alpha ? toRGBA(im) : toRGB(im), { raw: { width: im.w, height: im.h, channels } });
  const info = await s.clone().webp({ quality, alphaQuality, effort: 6, lossless, smartSubsample: true }).toFile(artPath(name));
  // Optional flattened PNG over the page colour, for eyeballing a bake.
  if (preview) await s.clone().flatten({ background: '#0a0c0e' }).png().toFile(artPath(name.replace(/\.webp$/, '.preview.png')));
  console.log(`  ${name.padEnd(24)} ${im.w}×${im.h}  ${(info.size / 1024).toFixed(0)} KB`);
}
