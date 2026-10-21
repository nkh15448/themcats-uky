// ─────────────────────────────────────────────────────────────
//  Paints the orbit slideshow's (/presentOrbit) art into
//  src/assets/present/orbit/: the multi-orbit rings and their out-of-focus
//  twin, the star flares, sparkles, the painted nebula, a small orbit,
//  the starfield, a haze, and a film-grain tile. Also writes
//  geometry.json, which Deck.astro uses to pin the live star and the
//  travelling sparkle to the baked rings.
//
//    node scripts/bake-orbit.mjs              everything (~20 s)
//    node scripts/bake-orbit.mjs rings flare  just those pieces
//
//  Why bake: the look is blur, glow and grain, and big live blurs, noise
//  masks and blend modes stutter in Firefox. The light is painted here
//  once; the slides only move and fade the finished layers.
//  Started in experiments/halation; uses sharp, which Astro installs.
//
//  Palette sampled from the crewneck mockups:
//    fabric      #0a0c0e / #111318
//    fringe      red #c65b67 · rose #cb6583 · blue #235da8 · cyan #28899c
//    nebula      indigo #332e58 · violet #734d8a · periwinkle #8c91ce
//                lavender #b49fd7 · pink #e1a3c7 · pale core #efe8f6
// ─────────────────────────────────────────────────────────────
import { writeFile } from 'node:fs/promises';
import {
  TAU, clamp, smooth, smoothstep, mix, g, hex, rng, plane, image, addTint, addImage, mapImage,
  perlin, fbm, ridged, worley, blur, blurImage, bilinear, spectrum, aberrate, fringe, resample, FRINGE, stroke, trace, dot,
  tonemap, save, artPath,
} from './lib/paint.mjs';

const want = new Set(process.argv.slice(2));
const run = (name) => want.size === 0 || want.has(name);
const PREVIEW = process.env.PREVIEW === '1';

// ═════════════════════════════════════════════════════════════
//  Orbit rings (the hero): open, slightly spiralling ellipses with a
//  lens fringe that grows toward the edges, and a star riding the outer one.
// ═════════════════════════════════════════════════════════════
export const ORBIT = {
  w: 2200,
  h: 1150,
  cx: 1100,
  cy: 520,
  lens: [1100, 700], // where the "lens" is centred: the fringe grows away from here
  rings: [
    { a: 900, b: 268, tilt: -16, dx: 0, dy: 0, t0: -0.62, t1: TAU - 0.1, grow: 0.045, k: 1.0, s: 1.7 },
    // the traveller rides this one, so it is a true ellipse (no spiral)
    { a: 748, b: 206, tilt: -14, dx: 52, dy: 26, t0: 0.5, t1: TAU + 0.45, grow: 0, k: 0.8, s: 1.55 },
    { a: 548, b: 140, tilt: -12, dx: 118, dy: 44, t0: 1.5, t1: TAU + 0.6, grow: 0.03, k: 0.55, s: 1.4 },
    { a: 985, b: 336, tilt: -18, dx: -40, dy: 4, t0: 1.9, t1: 3.6, grow: 0, k: 0.28, s: 1.25 },
  ],
  starOn: { ring: 0, t: -0.4 },
};

export function ringPoint(r, t, wobble = 0) {
  const sc = 1 + r.grow * ((t - r.t0) / (r.t1 - r.t0));
  const x = r.a * sc * Math.cos(t);
  const y = r.b * sc * Math.sin(t) + wobble;
  const c = Math.cos((r.tilt * Math.PI) / 180);
  const s = Math.sin((r.tilt * Math.PI) / 180);
  return [ORBIT.cx + r.dx + x * c - y * s, ORBIT.cy + r.dy + x * s + y * c];
}
const STAR = ringPoint(ORBIT.rings[ORBIT.starOn.ring], ORBIT.starOn.t);

function ringLight({ w, h }, scale = 1) {
  const L = plane(w, h);
  const n = perlin(11);
  ORBIT.rings.forEach((r, ri) => {
    const pts = trace(
      (t) => {
        const wob = 2.2 * n(t * 2.1, ri * 7.3) * 2;
        const [x, y] = ringPoint(r, t, wob);
        const ends = smoothstep(r.t0, r.t0 + 0.7, t) * (1 - smoothstep(r.t1 - 0.8, r.t1, t));
        const front = 0.5 + 0.5 * Math.sin(t); // lower half of the ellipse is nearer us
        const near = 1 + 1.5 * g(Math.hypot(x - STAR[0], y - STAR[1]), 240);
        const ink = 0.7 + 0.6 * fbm(n, t * 3.3 + ri * 20, ri * 3.1, 3);
        const k = r.k * ends * (0.45 + 0.55 * front) * near * ink;
        return [x * scale, y * scale, k, r.s * scale * (0.9 + 0.25 * front)];
      },
      r.t0,
      r.t1,
      0.45 * scale,
    );
    stroke(L, w, h, pts);
  });
  return L;
}

function texture(w, h, seed, cell = 3) {
  // fine fleece texture the print sits on: ink catches on fibres
  const n = perlin(seed);
  const t = plane(w, h);
  const rnd = rng(seed + 1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) t[y * w + x] = 0.55 * fbm(n, x / cell, y / cell, 2) + 0.45 * rnd();
  return t;
}

async function bakeRings() {
  const { w, h } = ORBIT;
  const L = ringLight({ w, h });
  const tex = texture(w, h, 5, 2.4);
  for (let i = 0; i < L.length; i++) L[i] *= 0.74 + 0.5 * tex[i];

  const [lx, ly] = ORBIT.lens;
  const im = fringe(L, w, h, { cx: lx, cy: ly, scale: 0.0062, shift: [-1.2, -1.6], soft: 2.4, k: 0.85, core: 0.85 });
  addTint(im, blur(L, w, h, 3.5), FRINGE.core, 0.5);

  // Halation: bright lines bleed a warm red into the film around them,
  // and a wider violet veil sits under everything.
  addTint(im, blur(L, w, h, 9), hex('#ff5a5a'), 0.42);
  addTint(im, blur(L, w, h, 30), hex('#8a6cff'), 0.3);
  addTint(im, blur(L, w, h, 80), hex('#6d5ad6'), 0.1);
  await save('rings.webp', tonemap(im, 1.55), { preview: PREVIEW });

  // The same orbit, out of focus with a much stronger fringe: the page
  // cross-fades from this to the sharp one, like a lens pulling focus.
  const s = 0.5;
  const sw = Math.round(w * s);
  const sh = Math.round(h * s);
  const Ls = ringLight({ w: sw, h: sh }, s);
  const soft = blur(Ls, sw, sh, 7);
  const ims = aberrate(soft, sw, sh, { cx: lx * s, cy: ly * s, scale: 0.03, shift: [-3, -2] });
  addTint(ims, blur(Ls, sw, sh, 20), hex('#ff6a6a'), 0.5);
  addTint(ims, blur(Ls, sw, sh, 45), hex('#7d6bff'), 0.5);
  for (const c of ['r', 'g', 'b']) for (let i = 0; i < ims[c].length; i++) ims[c][i] *= 2.4;
  await save('rings-soft.webp', tonemap(ims, 1.2), { quality: 80 });
}

// ═════════════════════════════════════════════════════════════
//  Star flare: a four-point star with a hot core, long fringed rays,
//  faint diagonal spikes, a fan of hairline rays and a halation bloom.
// ═════════════════════════════════════════════════════════════
function flareLight(S, { rays = 1, diag = 1, hairs = 90, seed = 3 } = {}) {
  const c = S / 2;
  const M = plane(S, S);
  const len = (d, a, b) => 1.5 * Math.exp(-d / a) + 0.42 * Math.exp(-d / b);
  const u = S / 1400; // sizes below are for a 1400 px canvas
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x - c) / u;
      const dy = (y - c) / u;
      const r = Math.hypot(dx, dy);
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      let v = 6 * g(r, 5) + 1.8 * g(r, 14) + 0.62 * g(r, 40) + 0.2 * g(r, 110) + 0.06 * g(r, 300);
      v += rays * len(dx < 0 ? ax * 0.9 : ax, 115, 360) * g(dy, 1.5 + 2.2 * Math.exp(-ax / 40) + 0.004 * ax);
      v += rays * len(dy > 0 ? ay * 1.12 : ay, 105, 330) * g(dx, 1.5 + 2.2 * Math.exp(-ay / 40) + 0.004 * ay);
      const p = (dx + dy) / Math.SQRT2;
      const q = (dx - dy) / Math.SQRT2;
      v += diag * 0.17 * (Math.exp(-Math.abs(p) / 72) * g(q, 2.4 + 0.012 * Math.abs(p)) + Math.exp(-Math.abs(q) / 60) * g(p, 2.4 + 0.012 * Math.abs(q)));
      const edge = 1 - smoothstep(0.8 * c, 0.98 * c, Math.max(Math.abs(x - c), Math.abs(y - c)));
      M[y * S + x] = v * edge;
    }
  // Hairline rays: the fibrous starburst around a bright point.
  const rnd = rng(seed);
  for (let i = 0; i < hairs; i++) {
    const a = rnd() * TAU;
    const L = (25 + 150 * rnd() ** 2) * u;
    const k = 0.03 + 0.07 * rnd();
    const pts = trace((t) => [c + Math.cos(a) * t, c + Math.sin(a) * t, k * Math.exp(-t / L) * smoothstep(0, 8 * u, t), 0.55 * u + t * 0.002], 0, L * 4, 0.5);
    stroke(M, S, S, pts);
  }
  return M;
}

async function bakeFlare(name, { S = 1400, violet = false, quality = 86 } = {}) {
  const M = flareLight(S, { hairs: violet ? 140 : 90, seed: violet ? 9 : 3 });
  const u = S / 1400;
  const im = fringe(M, S, S, { cx: S / 2, cy: S / 2, scale: 0.014, shift: [-3.4 * u, -2.8 * u], soft: 2.6 * u, k: 0.75, core: 0.8 });
  const bright = M.map((v) => Math.max(0, v - 0.55));
  const sparkle = texture(S, S, violet ? 21 : 17, 1.6);
  const halo1 = blur(bright, S, S, 18 * u);
  const halo2 = blur(bright, S, S, 64 * u);
  for (let i = 0; i < halo1.length; i++) {
    halo1[i] *= 0.7 + 0.6 * sparkle[i];
    halo2[i] *= 0.85 + 0.3 * sparkle[i];
  }
  if (violet) {
    mapImage(im, (r, gg, b) => [r * 1.0, gg * 0.8, b * 1.06]);
    addTint(im, halo1, hex('#f07ad8'), 0.62);
    addTint(im, halo2, hex('#8f6cff'), 0.4);
  } else {
    mapImage(im, (r, gg, b) => [r * 1.02, gg * 0.98, b * 0.93]);
    addTint(im, halo1, hex('#ff6a5c'), 0.5);
    addTint(im, halo2, hex('#e8c8ff'), 0.12);
  }
  // round falloff so no glow reaches the square canvas edge
  mapImage(im, (r, gg, b, x, y) => {
    const f = 1 - smoothstep(0.62, 0.98, Math.hypot(x - S / 2, y - S / 2) / (S / 2));
    return [r * f, gg * f, b * f];
  });
  await save(name, tonemap(im, 1.35), { quality, preview: PREVIEW });
}

// Small four-point sparkles (the "+ +" under the wordmark, the traveller).
async function bakeSpark(name, tint) {
  const S = 240;
  const c = S / 2;
  const M = plane(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = x - c;
      const dy = y - c;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const r = Math.hypot(dx, dy);
      const arm = (d) => 0.95 * Math.exp(-d / 20) + 0.3 * Math.exp(-d / 62);
      let v = 2.8 * g(r, 1.9) + 0.6 * g(r, 6) + 0.12 * g(r, 20);
      v += arm(ax) * g(dy, 0.75 + 0.004 * ax) + arm(ay) * g(dx, 0.75 + 0.004 * ay);
      M[y * S + x] = v * (1 - smoothstep(0.85 * c, 0.99 * c, Math.max(ax, ay)));
    }
  const im = fringe(M, S, S, { cx: c, cy: c, scale: 0.02, shift: [-1.5, -1.2], soft: 1.4, k: 0.7, core: 0.85 });
  mapImage(im, (r, gg, b) => [r * tint[0], gg * tint[1], b * tint[2]]);
  addTint(im, blur(M.map((v) => Math.max(0, v - 0.4)), S, S, 7), tint[1] < 0.8 ? hex('#ff5fae') : hex('#ff7a6a'), 0.5);
  await save(name, tonemap(im, 1.4), { quality: 90 });
}

// ═════════════════════════════════════════════════════════════
//  The painted nebula: a diagonal band of airbrushed gas, two strands
//  (pink and periwinkle) twisting round each other like a helix, pale
//  where they cross. Finished like a print on fleece: spray stipple at
//  the soft edges, crackle where the ink is thick, fibres showing through.
// ═════════════════════════════════════════════════════════════
export const NEBULA = { w: 2600, h: 1500, cx: 1300, cy: 770, angle: -29, half: 1180 };

const NEB = {
  indigo: hex('#2b2d70'),
  blue: hex('#3f4fd2'),
  violet: hex('#7a48c0'),
  peri: hex('#8a9cff'),
  lav: hex('#cbb2f5'),
  pink: hex('#ff7cc4'),
  rose: hex('#e0459c'),
  core: hex('#f5effb'),
};

function nebulaField() {
  const { cx, cy, angle, half } = NEBULA;
  const ca = Math.cos((angle * Math.PI) / 180);
  const sa = Math.sin((angle * Math.PI) / 180);
  const n1 = perlin(101);
  const n2 = perlin(202);
  const n3 = perlin(303);
  const n4 = perlin(404);
  const n5 = perlin(505);
  const n6 = perlin(606);
  // light at a point in nebula-canvas pixels, before any print texture
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    let u = (dx * ca + dy * sa) / half;
    let v = (-dx * sa + dy * ca) / half;
    // domain warp: billows and a slight S-bend
    const wx = fbm(n1, x / 430, y / 430, 4) - 0.5;
    const wy = fbm(n2, x / 430 + 9.1, y / 430 + 3.7, 4) - 0.5;
    u += 0.12 * wx;
    v += 0.075 * wy + 0.035 * Math.sin(u * 2.4 + 0.5);

    const E = Math.exp(-((u / 0.93) ** 6));
    const Eh = Math.exp(-((u / 1.08) ** 4));
    const phase = TAU * 0.92 * u + 0.35;
    const amp = 0.1 * (0.75 + 0.35 * Math.cos(u * 1.7));
    const vA = amp * Math.sin(phase);
    const vB = -amp * Math.sin(phase + 0.22);
    const wob = fbm(n3, u * 4, v * 9, 3) - 0.5;
    const sA = 0.058 * (1 + 0.9 * wob);
    const sB = 0.05 * (1 - 0.8 * wob);
    const IA = 0.25 + Math.exp(-(((u + 0.3) / 0.45) ** 2));
    const IB = 0.25 + Math.exp(-(((u - 0.28) / 0.48) ** 2));
    const cross = Math.exp(-((vA - vB) ** 2) / 0.0024);

    // brush streaks run along the band; clouds break it into billows
    const streak = fbm(n4, u * 5.5, v * 42, 4);
    const S = clamp(0.35 + 1.2 * (streak - 0.25));
    const S2 = clamp(0.6 + 0.8 * (streak - 0.3));
    const cloud = smoothstep(0.25, 0.8, fbm(n5, x / 360, y / 360, 5));
    const lane = 1 - 0.4 * smoothstep(0.7, 0.98, ridged(n6, u * 3, v * 11, 3)) * g(v, 0.15);

    const mid = (vA + vB) / 2;
    const out = [0, 0, 0];
    const add = (c, k) => {
      out[0] += c[0] * k;
      out[1] += c[1] * k;
      out[2] += c[2] * k;
    };
    add(NEB.indigo, 0.6 * g(v, 0.25) * Eh * (0.1 + 1.1 * cloud));
    add(NEB.blue, 0.42 * g(v - 0.02, 0.16) * E * (0.15 + 1.1 * cloud) * (0.6 + 0.6 * S));
    add(NEB.violet, 0.42 * g(v + 0.012, 0.1) * E * (0.3 + 0.9 * cloud) * S2);
    add(NEB.pink, 1.25 * g(v - vA, sA) * IA * E * S2 * (0.55 + 0.6 * cloud));
    add(NEB.rose, 0.5 * g(v - vA - 0.05, sA * 1.6) * IA * E * cloud);
    add(NEB.peri, 1.05 * g(v - vB, sB) * IB * E * S2 * (0.55 + 0.6 * cloud));
    add(NEB.lav, 0.75 * g(v - mid, 0.03) * cross * E * S2);
    add(NEB.core, 1.0 * g(v - mid, 0.015) * cross * E * S * S);
    // the long pale streak up the upper-right half
    add(NEB.core, 0.9 * g(v - vB + 0.006, 0.018) * smoothstep(0.05, 0.45, u) * (1 - smoothstep(0.62, 0.9, u)) * S);
    for (let c = 0; c < 3; c++) out[c] *= lane;
    return out;
  };
}

/**
 * Print finish, in output pixels: spray stipple (strongest where the paint
 * is thin), squiggly crackle (only where it is thick) and fleece fibres.
 * `zoom` > 1 scales the crackle and fibres up for macro shots.
 */
function printFinish(im, { seed = 1, zoom = 1, crackle = 1 } = {}) {
  const { w, h } = im;
  const rnd = rng(seed);
  const white = plane(w, h).map(() => rnd());
  const fine = blur(white, w, h, 0.55 * zoom);
  const coarse = blur(white.map(() => rnd()), w, h, 1.3 * zoom);
  const nw = perlin(seed + 7);
  const crA = worley(seed + 11, 34 * zoom);
  const crB = worley(seed + 13, 15 * zoom);
  const fab = perlin(seed + 17);
  // blurred noise has a much smaller spread than white noise; normalise it back
  const norm = (a) => {
    let m = 0;
    let s2 = 0;
    for (const v of a) m += v;
    m /= a.length;
    for (const v of a) s2 += (v - m) ** 2;
    const sd = Math.sqrt(s2 / a.length) || 1;
    for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / sd;
  };
  norm(fine);
  norm(coarse);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const rho = Math.max(im.r[i], im.g[i], im.b[i]);
      if (rho < 1e-4) continue;
      const thin = 1 - smoothstep(0.03, 0.5, rho);
      let m = 1 + (0.07 + 0.1 * thin) * fine[i] + 0.11 * coarse[i];
      // spray: where the paint is thin it lands as fine specks
      const speck = smoothstep(1.0, 2.0, 0.6 * fine[i] + 0.8 * coarse[i]);
      m *= mix(1, 0.55 + 2.4 * speck, thin * thin);
      const wx = x + 7 * zoom * nw(x / (16 * zoom), y / (16 * zoom));
      const wy = y + 7 * zoom * nw(x / (16 * zoom) + 40, y / (16 * zoom));
      const thick = smoothstep(0.18, 0.7, rho);
      const cA = 1 - smoothstep(0, 1.3 * zoom, crA(wx, wy));
      const cB = 1 - smoothstep(0, 0.9 * zoom, crB(wx * 1.1, wy * 0.9));
      m *= 1 - crackle * thick * (0.16 * cA + 0.06 * cB);
      m *= 0.86 + 0.28 * fbm(fab, x / (2.6 * zoom), y / (2.2 * zoom), 2);
      im.r[i] *= Math.max(0, m);
      im.g[i] *= Math.max(0, m);
      im.b[i] *= Math.max(0, m);
    }
}

/** Chalky pastel grade: the print never hits pure saturated colour. */
function chalk(im, lift = 0.1) {
  mapImage(im, (r, gg, b) => {
    const l = 0.3 * r + 0.55 * gg + 0.15 * b;
    const k = smoothstep(0.45, 1, l) * 0.22;
    return [mix(r, l, k) + lift * l * 0.9, mix(gg, l, k) + lift * l * 0.85, mix(b, l, k) + lift * l];
  });
}

function nebulaRing(w, h, ox = 0, oy = 0, zoom = 1) {
  // a thin pale orbit drawn round the band, a little more than once
  const L = plane(w, h);
  const { cx, cy, angle, half } = NEBULA;
  const n = perlin(77);
  const rings = [
    { a: 1.0 * half, b: 0.24 * half, tilt: angle - 5, t0: -2.2, t1: TAU - 2.4, grow: 0.06, k: 0.5 },
    { a: 0.82 * half, b: 0.15 * half, tilt: angle - 1, t0: 0.6, t1: 3.9, grow: -0.03, k: 0.3 },
  ];
  for (const r of rings) {
    const c = Math.cos((r.tilt * Math.PI) / 180);
    const s = Math.sin((r.tilt * Math.PI) / 180);
    const pts = trace(
      (t) => {
        const sc = 1 + r.grow * ((t - r.t0) / (r.t1 - r.t0));
        const px = r.a * sc * Math.cos(t);
        const py = r.b * sc * Math.sin(t) + 3 * n(t * 2, r.k * 10);
        const x = cx + px * c - py * s;
        const y = cy + px * s + py * c;
        const ends = smoothstep(r.t0, r.t0 + 0.6, t) * (1 - smoothstep(r.t1 - 0.9, r.t1, t));
        const front = 0.55 + 0.45 * Math.sin(t);
        return [(x - ox) * zoom, (y - oy) * zoom, r.k * ends * front * (0.7 + 0.6 * fbm(n, t * 4, 3, 2)), 1.25 * zoom];
      },
      r.t0,
      r.t1,
      0.45,
    );
    stroke(L, w, h, pts);
  }
  return L;
}
function starDust(L, w, h, { count, seed, inBand = 0.7, ox = 0, oy = 0, zoom = 1 }) {
  const rnd = rng(seed);
  const { cx, cy, angle, half } = NEBULA;
  const ca = Math.cos((angle * Math.PI) / 180);
  const sa = Math.sin((angle * Math.PI) / 180);
  for (let i = 0; i < count; i++) {
    let x;
    let y;
    if (rnd() < inBand) {
      const u = (rnd() * 2 - 1) * 0.95 * half;
      const v = (rnd() + rnd() + rnd() - 1.5) * 0.22 * half;
      x = cx + u * ca - v * sa;
      y = cy + u * sa + v * ca;
    } else {
      x = rnd() * NEBULA.w;
      y = rnd() * NEBULA.h;
    }
    const k = 0.2 + 0.8 * rnd() ** 2.2;
    dot(L, w, h, (x - ox) * zoom, (y - oy) * zoom, (0.55 + 0.6 * rnd()) * Math.sqrt(zoom), k);
  }
}

async function bakeNebula() {
  const { w, h } = NEBULA;
  const field = nebulaField();
  const im = image(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, gg, b] = field(x, y);
      const i = y * w + x;
      im.r[i] = r;
      im.g[i] = gg;
      im.b[i] = b;
    }
  printFinish(im, { seed: 5 });
  // a soft bloom so the bright strands glow into the gas around them
  addImage(im, blurImage(im, 14), 0.22);
  tonemap(im, 1.15);
  chalk(im, 0.05);

  const ring = nebulaRing(w, h);
  addImage(im, tonemap(fringe(ring, w, h, { cx: NEBULA.cx, cy: NEBULA.cy, scale: 0.004, shift: [-1, -1.2], soft: 1.8, k: 0.7, core: 0.8 }), 1.2));
  const dust = plane(w, h);
  starDust(dust, w, h, { count: 520, seed: 31 });
  addTint(im, dust, hex('#f6f1ff'), 0.9);

  // fade out well before the canvas edge
  mapImage(im, (r, gg, b, x, y) => {
    const f = smoothstep(0, 0.07, Math.min(x / w, 1 - x / w)) * smoothstep(0, 0.09, Math.min(y / h, 1 - y / h));
    return [r * f, gg * f, b * f];
  });
  await save('nebula.webp', im, { quality: 76, alphaQuality: 60, preview: PREVIEW });
}

// A single small orbit, reused (and tilted) behind each exam section.
export const MINI = { w: 800, h: 400, a: 330, b: 92 };
async function bakeMini() {
  const { w, h, a, b } = MINI;
  const L = plane(w, h);
  const n = perlin(29);
  const pts = trace((t) => {
    const front = 0.5 + 0.5 * Math.sin(t);
    const k = (0.42 + 0.58 * front) * (0.75 + 0.5 * fbm(n, t * 2.5, 1.3, 3));
    return [w / 2 + a * Math.cos(t), h / 2 + b * Math.sin(t), k, 1.25 + 0.35 * front];
  }, 0, TAU, 0.4);
  stroke(L, w, h, pts);
  const im = fringe(L, w, h, { cx: w / 2, cy: h / 2, scale: 0.008, shift: [-0.6, -0.9], soft: 2, k: 0.85, core: 0.85 });
  addTint(im, blur(L, w, h, 3), FRINGE.core, 0.4);
  addTint(im, blur(L, w, h, 9), hex('#ff5a6a'), 0.35);
  addTint(im, blur(L, w, h, 26), hex('#8a6cff'), 0.3);
  await save('orbit-mini.webp', tonemap(im, 1.5), { quality: 86 });
}

// ═════════════════════════════════════════════════════════════
//  Backdrop: the starfield behind every section, and a soft haze.
// ═════════════════════════════════════════════════════════════
async function bakeStars() {
  const w = 2400;
  const h = 1500;
  const rnd = rng(71);
  const im = image(w, h);
  const tints = [hex('#ffffff'), hex('#dfe6ff'), hex('#ffe6f2'), hex('#fff0e0'), hex('#cfd6ff')];
  const layer = tints.map(() => plane(w, h));
  for (let i = 0; i < 1100; i++) {
    const k = 0.06 + 0.7 * rnd() ** 3.2;
    dot(layer[Math.floor(rnd() * tints.length)], w, h, rnd() * w, rnd() * h, 0.5 + 0.45 * rnd(), k);
  }
  for (let i = 0; i < 70; i++) dot(layer[Math.floor(rnd() * tints.length)], w, h, rnd() * w, rnd() * h, 0.9 + 0.5 * rnd(), 0.5 + 0.5 * rnd());
  layer.forEach((l, i) => addTint(im, l, tints[i]));
  // a few glints with rays and a fringe, like the sparkles on the print
  const glint = plane(w, h);
  for (let i = 0; i < 7; i++) {
    const x = 60 + rnd() * (w - 120);
    const y = 60 + rnd() * (h - 120);
    const L = 4 + rnd() * 7;
    const k = 0.35 + 0.3 * rnd();
    dot(glint, w, h, x, y, 1.1, 1.2 * k);
    for (const [ax, ay] of [[1, 0], [0, 1]])
      stroke(glint, w, h, trace((t) => [x + ax * t, y + ay * t, k * Math.exp(-Math.abs(t) / L), 0.6], -L * 4, L * 4, 0.4));
  }
  addImage(im, fringe(glint, w, h, { cx: w / 2, cy: h / 2, scale: 0, shift: [-0.9, -0.7], soft: 0.9, k: 0.7, core: 0.9 }));
  addImage(im, blurImage(im, 2.5), 0.6);
  await save('stars.webp', tonemap(im, 1.5), { quality: 82, preview: PREVIEW });
}

async function bakeHaze() {
  // very low resolution on purpose: it is all blur, the browser scales it up smoothly
  const w = 960;
  const h = 600;
  const im = image(w, h);
  const n = perlin(88);
  const blob = (cx, cy, rx, ry, rot, tint, k) => {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const p = plane(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const u = (dx * c + dy * s) / rx;
        const v = (-dx * s + dy * c) / ry;
        p[y * w + x] = Math.exp(-(u * u + v * v)) * (0.4 + 0.9 * fbm(n, x / 90, y / 90, 4));
      }
    addTint(im, p, tint, k);
  };
  blob(470, 330, 380, 120, -0.3, hex('#2b2d70'), 0.55);
  blob(560, 290, 240, 70, -0.34, hex('#5a3c9e'), 0.32);
  blob(380, 360, 150, 50, -0.3, hex('#b0458f'), 0.16);
  blob(700, 230, 160, 45, -0.36, hex('#4d6bd8'), 0.14);
  const out = blurImage(im, 18);
  mapImage(out, (r, gg, b, x, y) => {
    const f = smoothstep(0, 0.2, Math.min(x / w, 1 - x / w)) * smoothstep(0, 0.25, Math.min(y / h, 1 - y / h));
    return [r * f, gg * f, b * f];
  });
  await save('haze.webp', tonemap(out, 1.3), { quality: 80 });
}

// ═════════════════════════════════════════════════════════════
//  Surface: a still film-grain tile over the whole page, at low opacity.
// ═════════════════════════════════════════════════════════════
async function bakeSurface() {
  // Static film grain, one tile over the whole screen. Pure per-pixel noise
  // with nothing larger than a couple of pixels, so the repeat can't be seen
  // (an earlier fleece tile had soft mottling, and its 200 px grid showed).
  const T = 384;
  const rnd = rng(14);
  const gr = plane(T, T).map(() => rnd() - 0.5);
  const grS = blur(gr, T, T, 0.55, true);
  let sd = 0;
  for (const v of grS) sd += v * v;
  sd = Math.sqrt(sd / grS.length);
  const px = Buffer.alloc(T * T * 4);
  for (let i = 0; i < T * T; i++) {
    // above 0 a faint light speck, below 0 a faint dark one
    const v = grS[i] / sd / 3;
    const c = v > 0 ? 255 : 0;
    px[i * 4] = c;
    px[i * 4 + 1] = c;
    px[i * 4 + 2] = v > 0 ? 255 : 6;
    px[i * 4 + 3] = Math.round(clamp(v > 0 ? v * 0.12 : -v * 0.16) * 255);
  }
  const { default: sharp } = await import('sharp');
  const info = await sharp(px, { raw: { width: T, height: T, channels: 4 } }).webp({ lossless: true, effort: 6 }).toFile(artPath('grain.webp'));
  console.log(`  ${'grain.webp'.padEnd(24)} ${T}×${T}  ${(info.size / 1024).toFixed(0)} KB`);
}

// ═════════════════════════════════════════════════════════════
console.log('Baking into src/assets/present/orbit/ …');
if (run('rings')) await bakeRings();
if (run('flare')) {
  await bakeFlare('flare.webp');
  await bakeFlare('flare-violet.webp', { violet: true });
}
if (run('spark')) {
  await bakeSpark('spark.webp', [1, 1, 1]);
  await bakeSpark('spark-pink.webp', [1, 0.62, 0.84]);
}
if (run('nebula')) await bakeNebula();
if (run('mini')) await bakeMini();
if (run('stars')) await bakeStars();
if (run('haze')) await bakeHaze();
if (run('surface')) await bakeSurface();
{
  const r1 = (v) => Math.round(v * 10) / 10;
  const geo = { orbit: { ...ORBIT, star: STAR.map(r1) }, mini: MINI };
  await writeFile(artPath('geometry.json'), JSON.stringify(geo, null, 2) + '\n');
}
