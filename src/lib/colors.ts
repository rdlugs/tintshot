// colors.ts — read an image's palette and turn it into a pleasing background.
//
// This is Tintshot's signature feature: instead of making you fish through
// gradient swatches, it samples the screenshot itself and proposes a background
// built from the image's own colors. The approach is deliberately simple and
// hackable — a good place to tinker.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Gradient {
  from: string; // hex
  to: string; // hex
  angle: number; // degrees
}

/**
 * Sample the dominant colors of an image by downscaling it and bucketing
 * pixels into a coarse color histogram. Downscaling first means we look at a
 * few thousand pixels instead of millions — fast, and good enough for a mood.
 */
export function dominantColors(source: HTMLImageElement | HTMLCanvasElement, count = 5): Rgb[] {
  const sample = document.createElement("canvas");
  const size = 64; // small on purpose
  sample.width = size;
  sample.height = size;
  const ctx = sample.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 125) continue; // skip transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize each channel to 5 bits so near-identical colors group together.
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const ranked = [...buckets.values()]
    .map((b) => ({
      count: b.count,
      color: {
        r: Math.round(b.r / b.count),
        g: Math.round(b.g / b.count),
        b: Math.round(b.b / b.count),
      },
    }))
    // Downrank near-white and near-black — backgrounds and pure text rarely make
    // an interesting gradient. We want the image's *character* colors.
    .map((b) => ({ ...b, score: b.count * characterWeight(b.color) }))
    .sort((a, b) => b.score - a.score)
    .map((b) => b.color);

  return ranked.slice(0, count);
}

/** Weight a color by how "characterful" it is: penalize very light, dark, or gray. */
function characterWeight(c: Rgb): number {
  const { s, l } = rgbToHsl(c);
  const notGray = 0.2 + s; // saturated colors score higher
  const midTone = 1 - Math.abs(l - 0.5) * 1.4; // mid lightness scores higher
  return Math.max(0.05, notGray * Math.max(0.1, midTone));
}

/**
 * Build a background gradient from the sampled palette. We take the strongest
 * character color, deepen it a little for richness, and pair it with a second
 * hue for movement — falling back to an analogous shade if the image is
 * basically monochrome.
 */
export function gradientFromImage(source: HTMLImageElement | HTMLCanvasElement): Gradient {
  const palette = dominantColors(source, 5);
  const base = palette[0] ?? { r: 90, g: 100, b: 160 };

  const baseHsl = rgbToHsl(base);
  const from = hslToHex({
    h: baseHsl.h,
    s: clamp(baseHsl.s + 0.1, 0.35, 0.85),
    l: clamp(baseHsl.l, 0.28, 0.5),
  });

  // Look for a second color that's meaningfully different in hue.
  let partner = palette.find((c) => hueDistance(rgbToHsl(c).h, baseHsl.h) > 25);
  if (!partner) {
    // Monochrome image: rotate the hue a touch for a subtle two-tone.
    partner = hslToRgb({ h: (baseHsl.h + 35) % 360, s: baseHsl.s, l: baseHsl.l });
  }
  const partnerHsl = rgbToHsl(partner);
  const to = hslToHex({
    h: partnerHsl.h,
    s: clamp(partnerHsl.s + 0.1, 0.35, 0.85),
    l: clamp(partnerHsl.l - 0.1, 0.2, 0.45),
  });

  return { from, to, angle: 135 };
}

// --- small color-space helpers ---------------------------------------------

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): Rgb {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function hslToHex(hsl: { h: number; s: number; l: number }): string {
  return rgbToHex(hslToRgb(hsl));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
