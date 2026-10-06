// Geometry for the hero orbit. Shared by the server render and the browser,
// which recomputes it in real pixels whenever the hero is resized.
//
// The orbit is a filled ring rather than a stroke, so its thickness can vary:
// heavier along the top and bottom, hairline at the sides.

export const START_ANGLE = 38; // degrees; where the line starts, ends, and the glint sits

/**
 * A band around the ellipse whose thickness eases with the parametric angle:
 * `thick` at the top and bottom, `thin` at the sides, following sin²θ. Since
 * x = rx·cosθ, the thickness falls off as 1 − (x/rx)², gradually across the
 * whole width rather than all at once near the ends.
 * Built as outer + inner outlines; fill-rule evenodd paints the band.
 */
function ring(cx: number, cy: number, rx: number, ry: number, thin: number, thick: number, steps = 360) {
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + rx * c;
    const y = cy - ry * s;
    // outward normal of the ellipse at t (y axis points down)
    let nx = c / rx;
    let ny = -s / ry;
    const len = Math.hypot(nx, ny);
    nx /= len;
    ny /= len;
    const half = (thin + (thick - thin) * s * s) / 2;
    outer.push(`${(x + nx * half).toFixed(2)} ${(y + ny * half).toFixed(2)}`);
    inner.push(`${(x - nx * half).toFixed(2)} ${(y - ny * half).toFixed(2)}`);
  }
  return `M ${outer.join(' L ')} Z M ${inner.join(' L ')} Z`;
}

export function orbitGeometry(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.492;
  const ry = h * 0.375;
  const thick = Math.min(2.6, Math.max(1.5, w / 600)); // top/bottom, in px
  const thin = 0.45; // sides, in px
  const t = (START_ANGLE * Math.PI) / 180;
  const x1 = cx + rx * Math.cos(t);
  const y1 = cy - ry * Math.sin(t);
  const x2 = cx - rx * Math.cos(t);
  const y2 = cy + ry * Math.sin(t);
  return {
    viewBox: `0 0 ${w} ${h}`,
    cy,
    ring: ring(cx, cy, rx, ry, thin, thick),
    // the centreline, starting and ending at the glint: used as the reveal mask
    line: `M ${x1} ${y1} A ${rx} ${ry} 0 1 1 ${x2} ${y2} A ${rx} ${ry} 0 1 1 ${x1} ${y1}`,
    glint: { left: (x1 / w) * 100, top: (y1 / h) * 100 },
  };
}
