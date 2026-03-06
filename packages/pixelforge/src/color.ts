// ═══════════════════════════════════════════
// COLOR UTILITIES — hex manipulation
// Pure functions, zero dependencies
// ═══════════════════════════════════════════

/** Parse hex (#RRGGBB) to [r, g, b] components */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert [r, g, b] to hex string */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Lighten a hex color by percent (0-100) */
export function lighten(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * (percent / 100))),
    Math.min(255, Math.round(g + (255 - g) * (percent / 100))),
    Math.min(255, Math.round(b + (255 - b) * (percent / 100))),
  );
}

/** Darken a hex color by percent (0-100) */
export function darken(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.max(0, Math.round(r * (1 - percent / 100))),
    Math.max(0, Math.round(g * (1 - percent / 100))),
    Math.max(0, Math.round(b * (1 - percent / 100))),
  );
}

/** Shift hue by degrees (HSL-based rotation) */
export function shiftHue(hex: string, degrees: number): string {
  const [r, g, b] = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }

  h = ((h * 360 + degrees) % 360) / 360;
  if (h < 0) h += 1;

  if (s === 0) {
    const v = Math.round(l * 255);
    return rgbToHex(v, v, v);
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return rgbToHex(
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  );
}
