// ─────────────────────────────────────────────────────────────
//  Paints the space slideshow's (/presentSpace) backgrounds into images:
//  the nebula, the planet horizon and the starfield.
//
//  Live blurs, noise masks and blend modes this size stutter in some
//  browsers (Firefox especially), so the slides show these baked images
//  and only move and fade them. Rerun after tweaking a number here:
//
//    node scripts/bake-space.mjs
//
//  Writes src/assets/present/nebula.webp, horizon.webp and stars.webp.
//  Uses sharp, which Astro already installs.
// ─────────────────────────────────────────────────────────────
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = (name) => fileURLToPath(new URL(`../src/assets/present/${name}`, import.meta.url));

let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const g = (d, s) => Math.exp(-0.5 * (d / s) ** 2);
const rgb = (r, gg, b) => [r / 255, gg / 255, b / 255];

/** Fractal value noise in [0, 1]. cx × cy cells at the first octave, doubling after. */
function fractal(w, h, cx, cy, octaves) {
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    const nx = cx << o;
    const ny = cy << o;
    const grid = Float32Array.from({ length: (nx + 2) * (ny + 2) }, rand);
    layers.push({ nx, ny, grid, w: 0.5 ** o });
  }
  const norm = layers.reduce((a, l) => a + l.w, 0);
  return (x, y) => {
    let sum = 0;
    for (const { nx, ny, grid, w: wt } of layers) {
      const fx = (x / w) * nx;
      const fy = (y / h) * ny;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const at = (i, j) => grid[j * (nx + 2) + i];
      const top = at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx;
      const bot = at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx;
      sum += (top * (1 - ty) + bot * ty) * wt;
    }
    return sum / norm;
  };
}

/** Light on black → straight-alpha RGBA, so it composites over the dark page the same way. */
function toRGBA(w, h, light) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = light[i * 3];
    const gg = light[i * 3 + 1];
    const b = light[i * 3 + 2];
    const a = Math.max(r, gg, b, 1e-6);
    px[i * 4] = Math.round(clamp(r / a) * 255);
    px[i * 4 + 1] = Math.round(clamp(gg / a) * 255);
    px[i * 4 + 2] = Math.round(clamp(b / a) * 255);
    px[i * 4 + 3] = Math.round(clamp(a) * 255);
  }
  return px;
}

// ── Nebula: a horizontal band; the slide rotates it ───────────────
{
  const W = 2000;
  const H = 900;
  const INDIGO = rgb(111, 134, 242);
  const VIOLET = rgb(160, 140, 246);
  const ROSE = rgb(229, 143, 196);
  const BLUE = rgb(156, 193, 234);
  const CORE = rgb(255, 232, 246);

  const clouds = fractal(W, H, 4, 4, 5); // where the gas is
  const streaks = fractal(W, H, 6, 18, 4); // fine lengthwise texture
  const along = (u, c, w) => Math.exp(-(((u - c) / w) ** 4));
  const light = new Float32Array(W * H * 3);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = (x - W / 2) / (W / 2);
      const v = y - (H / 2 + 18 * Math.sin(u * 2.2));
      const m = smooth(clamp((clouds(x, y) - 0.34) / 0.32));
      const s = clamp(0.55 + 0.9 * (streaks(x, y) - 0.5), 0.2, 1.2);
      const lane = 1 - 0.7 * g(v - 62, 16) * along(u, 0, 0.6) * (0.6 + 0.4 * s);
      const ends = along(u, 0, 0.72); // fade out well before the image edge
      const layers = [
        [INDIGO, 0.5 * g(v, 150)],
        [VIOLET, 0.7 * g(v + 26, 85) * along(u, -0.05, 0.6)],
        [BLUE, 0.7 * g(v + 70, 40) * along(u, -0.25, 0.42)],
        [ROSE, 1.9 * g(v - 16, 50) * along(u, 0.2, 0.45)],
      ];
      const core = 0.5 * g(v, 9) * along(u, 0.03, 0.34) * (0.55 + 0.5 * s);
      const hot = 0.4 * g(x - W / 2, 120) * g(v, 55);
      const lit = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        let gas = 0;
        for (const [col, k] of layers) gas += col[c] * k;
        const total = (gas * m * s * lane + CORE[c] * core + hot) * ends;
        lit[c] = 1 - Math.exp(-1.45 * total);
      }
      // Push the colour: the site's pastels read as grey once blurred this much.
      const lum = (lit[0] + lit[1] + lit[2]) / 3;
      for (let c = 0; c < 3; c++) light[(y * W + x) * 3 + c] = clamp(lum + (lit[c] - lum) * 1.9);
    }
  }

  // Star dust, denser along the spine.
  for (let i = 0; i < 110; i++) {
    const sx = 150 + rand() * (W - 300);
    const sy = H / 2 + (rand() + rand() + rand() - 1.5) * 260;
    const r = 0.7 + rand() * (rand() < 0.12 ? 1.4 : 0.6);
    const k = 0.45 + rand() * 0.55;
    for (let y = Math.floor(sy - 4); y <= sy + 4; y++) {
      for (let x = Math.floor(sx - 4); x <= sx + 4; x++) {
        const i3 = (y * W + x) * 3;
        const add = k * g(Math.hypot(x - sx, y - sy), r);
        for (let c = 0; c < 3; c++) light[i3 + c] = Math.min(1, light[i3 + c] + add);
      }
    }
  }

  await sharp(toRGBA(W, H, light), { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out('nebula.webp'));
}

// ── Horizon: the planet's rim and atmosphere, stage y 830 → 1080 ──
{
  const W = 1920;
  const H = 250;
  const TOP = 830;
  const R = 1800;
  const CX = 960;
  const CY = 972 + R;
  const BODY = rgb(6, 6, 9);
  const NAVY = rgb(28, 37, 71);
  const RIM = rgb(205, 220, 255);
  const AIR = [rgb(150, 175, 255), rgb(111, 134, 242), rgb(160, 140, 246)];
  const px = Buffer.alloc(W * H * 4);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - CX, y + TOP - CY) - R; // < 0 inside the planet
      const inside = clamp(0.5 - d); // antialiased edge
      const near = g(x - CX, 700);
      const air = (0.35 + 0.65 * g(x - CX, 520)) * smooth(clamp(y / 70)); // fades to nothing at the image's top edge
      const out = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const body = BODY[c] + NAVY[c] * Math.exp(Math.min(0, d) / 18) * near;
        const rim = RIM[c] * 0.95 * g(d, 0.9) * (0.5 + 0.5 * near);
        const glow =
          d > -1 ? (AIR[0][c] * 0.75 * Math.exp(-d / 7) + AIR[1][c] * 0.5 * Math.exp(-d / 32) + AIR[2][c] * 0.3 * Math.exp(-d / 95)) * air : 0;
        out[c] = body * inside + rim + glow * (1 - inside);
      }
      const a = clamp(Math.max(inside, ...out));
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(clamp(out[c] / Math.max(a, 1e-6)) * 255);
      px[i + 3] = Math.round(a * 255);
    }
  }

  await sharp(px, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(out('horizon.webp'));
}

// ── Starfield: the backdrop behind every slide, a little larger than the
//    stage so it can drift from slide to slide without showing an edge ──
{
  const W = 2100;
  const H = 1200;
  const light = new Float32Array(W * H * 3);
  const TINTS = [rgb(255, 255, 255), rgb(205, 220, 255), rgb(255, 228, 240), rgb(255, 240, 220)];
  const dot = (sx, sy, r, k, tint, rays = 0) => {
    const reach = Math.ceil(Math.max(r * 4, rays));
    for (let y = Math.max(0, Math.floor(sy - reach)); y <= Math.min(H - 1, sy + reach); y++) {
      for (let x = Math.max(0, Math.floor(sx - reach)); x <= Math.min(W - 1, sx + reach); x++) {
        const dx = x - sx;
        const dy = y - sy;
        let add = k * g(Math.hypot(dx, dy), r);
        // a four-point glint on the brightest few
        if (rays) add += 0.55 * k * (g(dy, 0.6) * Math.exp(-Math.abs(dx) / (rays / 3)) + g(dx, 0.6) * Math.exp(-Math.abs(dy) / (rays / 3)));
        const i3 = (y * W + x) * 3;
        for (let c = 0; c < 3; c++) light[i3 + c] = Math.min(1, light[i3 + c] + add * tint[c]);
      }
    }
  };
  for (let i = 0; i < 520; i++) {
    const k = 0.12 + 0.88 * rand() ** 3; // mostly faint
    dot(rand() * W, rand() * H, 0.55 + rand() * 0.6, k, TINTS[Math.floor(rand() * TINTS.length)]);
  }
  for (let i = 0; i < 9; i++) dot(rand() * W, rand() * H, 1.1, 0.95, TINTS[i % 2], 14 + rand() * 16);

  await sharp(toRGBA(W, H, light), { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(out('stars.webp'));
}

console.log('Wrote nebula.webp, horizon.webp and stars.webp');
