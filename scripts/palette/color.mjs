// Colour maths for the palette tools: sRGB and Display P3 in and out of OKLab/OKLCH,
// CSS Color 4 gamut mapping, OKLab ΔE and APCA contrast. No dependencies, so the
// same file is inlined into the palette explorer page.

// --- transfer functions ---------------------------------------------------------

export const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// --- matrices -------------------------------------------------------------------

const mul = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

const LSRGB_TO_LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const LMS_TO_OKLAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
const OKLAB_TO_LMS = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
];
const LMS_TO_LSRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];
const LSRGB_TO_XYZ = [
  [0.4123907993, 0.3575843394, 0.1804807884],
  [0.2126390059, 0.7151686788, 0.0721923154],
  [0.0193308187, 0.1191947798, 0.9505321522],
];
const XYZ_TO_LSRGB = [
  [3.2409699419, -1.5373831776, -0.4986107603],
  [-0.9692436363, 1.8759675015, 0.0415550574],
  [0.0556300797, -0.2039769589, 1.0569715142],
];
const LP3_TO_XYZ = [
  [0.4865709486, 0.2656676932, 0.1982172852],
  [0.2289745641, 0.6917385218, 0.0792869141],
  [0, 0.0451133819, 1.0439443689],
];
const XYZ_TO_LP3 = [
  [2.4934969119, -0.9313836179, -0.4027107845],
  [-0.8294889696, 1.7626640603, 0.0236246858],
  [0.0358458302, -0.0761723893, 0.956884524],
];

// --- OKLab / OKLCH ----------------------------------------------------------------

export function linearSrgbToOklab(rgb) {
  const lms = mul(LSRGB_TO_LMS, rgb).map(Math.cbrt);
  const [L, a, b] = mul(LMS_TO_OKLAB, lms);
  return { L, a, b };
}

export function oklabToLinearSrgb({ L, a, b }) {
  const lms = mul(OKLAB_TO_LMS, [L, a, b]).map((v) => v ** 3);
  return mul(LMS_TO_LSRGB, lms);
}

export function oklabToOklch({ L, a, b }) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h: C < 1e-7 ? 0 : h };
}

export function oklchToOklab({ L, C, h }) {
  const rad = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

// --- spaces -----------------------------------------------------------------------
// A colour in a display space is {space: 'srgb'|'p3', rgb: [r,g,b]} with gamma-encoded 0–1 channels.

export function toLinearRgb({ space, rgb }) {
  return { space, rgb: rgb.map(toLinear) };
}

export function oklchToSpace(lch, space) {
  const lsrgb = oklabToLinearSrgb(oklchToOklab(lch));
  const lin = space === 'p3' ? mul(XYZ_TO_LP3, mul(LSRGB_TO_XYZ, lsrgb)) : lsrgb;
  return { space, rgb: lin.map(toGamma) };
}

export function spaceToOklch({ space, rgb }) {
  const lin = rgb.map(toLinear);
  const lsrgb = space === 'p3' ? mul(XYZ_TO_LSRGB, mul(LP3_TO_XYZ, lin)) : lin;
  return oklabToOklch(linearSrgbToOklab(lsrgb));
}

const EPS = 1e-6;
export const inGamut = (color) => color.rgb.every((c) => c >= -EPS && c <= 1 + EPS);
export const clip = (color) => ({ space: color.space, rgb: color.rgb.map((c) => Math.min(1, Math.max(0, c))) });

export function deltaEok(a, b) {
  const x = oklchToOklab(a);
  const y = oklchToOklab(b);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

// CSS Color 4 gamut mapping: lower chroma until the clipped colour is within a just-noticeable
// difference (ΔEOK 0.02) of the candidate. Lightness and hue are kept.
export function toGamut(lch, space) {
  if (lch.L >= 1) return { space, rgb: [1, 1, 1] };
  if (lch.L <= 0) return { space, rgb: [0, 0, 0] };
  const direct = oklchToSpace(lch, space);
  if (inGamut(direct)) return direct;
  const JND = 0.02;
  let min = 0;
  let max = lch.C;
  let minInGamut = true;
  let current = direct;
  while (max - min > 1e-4) {
    const C = (min + max) / 2;
    const candidate = { ...lch, C };
    current = oklchToSpace(candidate, space);
    if (minInGamut && inGamut(current)) {
      min = C;
      continue;
    }
    const clipped = clip(current);
    const dE = deltaEok(spaceToOklch(clipped), candidate);
    if (dE < JND) {
      if (JND - dE < 1e-4) return clipped;
      minInGamut = false;
      min = C;
    } else {
      max = C;
    }
  }
  return clip(current);
}

// Largest chroma at this lightness and hue that fits the space; used to shape ramps.
export function maxChroma(L, h, space, limit = 0.5) {
  let lo = 0;
  let hi = limit;
  while (hi - lo > 1e-4) {
    const C = (lo + hi) / 2;
    if (inGamut(oklchToSpace({ L, C, h }, space))) lo = C;
    else hi = C;
  }
  return lo;
}

// --- parsing and formatting ---------------------------------------------------------

export function parseHex(hex) {
  const s = hex.replace('#', '');
  const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  return { space: 'srgb', rgb };
}

export function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`not an oklch() colour: ${str}`);
  return { L: m[2] ? +m[1] / 100 : +m[1], C: +m[3], h: +m[4] };
}

export function parseColor(str) {
  if (str.startsWith('#')) return spaceToOklch(parseHex(str));
  if (str.startsWith('oklch')) return parseOklch(str);
  const p3 = str.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (p3) return spaceToOklch({ space: 'p3', rgb: [+p3[1], +p3[2], +p3[3]] });
  throw new Error(`unsupported colour: ${str}`);
}

const to255 = (c) => Math.round(Math.min(1, Math.max(0, c)) * 255);
export const toHex = ({ rgb }) => '#' + rgb.map((c) => to255(c).toString(16).padStart(2, '0')).join('').toUpperCase();
export const round = (v, d) => Number(v.toFixed(d));
export const formatOklch = ({ L, C, h }) => `oklch(${round(L, 4)} ${round(C, 4)} ${round(h, 2)})`;
export const formatP3 = ({ rgb }) => `color(display-p3 ${rgb.map((c) => round(Math.min(1, Math.max(0, c)), 4)).join(' ')})`;

// --- dominant wavelength ------------------------------------------------------------

// CIE 1931 2° spectral locus in xy chromaticity, 380–700 nm at 10 nm.
const LOCUS = [
  [380, 0.1741, 0.005], [390, 0.1738, 0.0049], [400, 0.1733, 0.0048], [410, 0.1726, 0.0048], [420, 0.1714, 0.0051],
  [430, 0.1689, 0.0069], [440, 0.1644, 0.0109], [450, 0.1566, 0.0177], [460, 0.144, 0.0297], [470, 0.1241, 0.0578],
  [480, 0.0913, 0.1327], [490, 0.0454, 0.295], [500, 0.0082, 0.5384], [510, 0.0139, 0.7502], [520, 0.0743, 0.8338],
  [530, 0.1547, 0.8059], [540, 0.2296, 0.7543], [550, 0.3016, 0.6923], [560, 0.3731, 0.6245], [570, 0.4441, 0.5547],
  [580, 0.5125, 0.4866], [590, 0.5752, 0.4242], [600, 0.627, 0.3725], [610, 0.6658, 0.334], [620, 0.6915, 0.3083],
  [630, 0.7079, 0.292], [640, 0.719, 0.2809], [650, 0.726, 0.274], [660, 0.73, 0.27], [670, 0.732, 0.268],
  [680, 0.7334, 0.2666], [690, 0.7344, 0.2656], [700, 0.7347, 0.2653],
];
const D65_XY = [0.3127, 0.329];

export function oklchToXy(lch) {
  const [X, Y, Z] = mul(LSRGB_TO_XYZ, oklabToLinearSrgb(oklchToOklab(lch)));
  const sum = X + Y + Z;
  return sum > 0 ? [X / sum, Y / sum] : D65_XY;
}

// Intersects the ray from the white point through xy with the locus; returns {nm, t} for the
// first segment hit in the given direction (t is the ray parameter at the locus).
function hitLocus(xy, direction) {
  const [wx, wy] = D65_XY;
  const dx = (xy[0] - wx) * direction;
  const dy = (xy[1] - wy) * direction;
  for (let i = 0; i < LOCUS.length - 1; i++) {
    const [nm0, x0, y0] = LOCUS[i];
    const [nm1, x1, y1] = LOCUS[i + 1];
    const ex = x1 - x0;
    const ey = y1 - y0;
    const det = dx * ey - dy * ex;
    if (Math.abs(det) < 1e-12) continue;
    const t = ((x0 - wx) * ey - (y0 - wy) * ex) / det;
    const u = ((x0 - wx) * dy - (y0 - wy) * dx) / det;
    if (t > 0 && u >= 0 && u <= 1) return { nm: nm0 + u * (nm1 - nm0), t };
  }
  return null;
}

// Dominant wavelength (nm) and excitation purity of a colour. Purples have no dominant wavelength;
// they get the complementary one, flagged `complementary: true` (written 560c by convention).
export function dominantWavelength(lch) {
  const xy = oklchToXy(lch);
  const dist = Math.hypot(xy[0] - D65_XY[0], xy[1] - D65_XY[1]);
  if (dist < 1e-4) return { nm: null, purity: 0, complementary: false };
  const hit = hitLocus(xy, 1);
  if (hit) return { nm: round(hit.nm, 0), purity: round(Math.min(1, 1 / hit.t), 3), complementary: false };
  const comp = hitLocus(xy, -1);
  return { nm: comp ? round(comp.nm, 0) : null, purity: null, complementary: true };
}

// Conventional spectral bands, for naming a wavelength.
export const SPECTRAL_BANDS = [
  [380, 450, 'violet'], [450, 485, 'blue'], [485, 500, 'cyan'], [500, 565, 'green'],
  [565, 590, 'yellow'], [590, 625, 'orange'], [625, 700, 'red'],
];
export const bandName = (nm, complementary) => {
  if (nm === null) return 'achromatic';
  if (complementary) return 'purple';
  const band = SPECTRAL_BANDS.find(([lo, hi]) => nm >= lo && nm < hi);
  return band ? band[2] : nm < 380 ? 'violet' : 'red';
};
export const formatWavelength = ({ nm, complementary }) => (nm === null ? '–' : `${nm}${complementary ? 'c' : ''} nm`);

// --- hue sectors ----------------------------------------------------------------------

// Euclid's hue sectors in OKLCH, set so the Tailwind family hues at the 500 fall in the sector that
// matches their name. A family whose 500 has chroma under 0.06 is N (neutral).
export const HUE_SECTORS = [
  [45, 'R'], [60, 'O'], [110, 'Y'], [200, 'G'], [285, 'B'], [345, 'P'], [360, 'R'],
];
export function hueLetter(h, C) {
  if (C < 0.06) return 'n';
  const hue = ((h % 360) + 360) % 360;
  return HUE_SECTORS.find(([end]) => hue < end)[1].toLowerCase();
}
// Designation: sector letter in lower case, the family's hue at its natural step, then the step: p86.300.
// hueFormat 'percent' writes the hue as hundredths of the circle, 00–99 (3.6° each);
// 'degrees' writes it rounded to `rounding` degrees as three digits, 000–350.
export function hueCode(hue500, format = 'percent', rounding = 10) {
  const hue = ((hue500 % 360) + 360) % 360;
  if (format === 'degrees') return String((Math.round(hue / rounding) * rounding) % 360).padStart(3, '0');
  return String(Math.round(hue / 3.6) % 100).padStart(2, '0');
}

// Display P3 channels as 8-bit hex. CSS has no hex form for P3 (only color(display-p3 r g b)); this is
// the informal notation design tools show, and it is not a valid CSS colour.
export const toP3Hex = ({ rgb }) => '#' + rgb.map((c) => to255(c).toString(16).padStart(2, '0')).join('').toUpperCase();

// --- luminance and APCA -------------------------------------------------------------

// APCA 0.0.98G-4g (W3 version). Y is computed from the colour's own space; the Display P3
// coefficients are the ones published with apca-w3.
const APCA = {
  srgb: { r: 0.2126729, g: 0.7151522, b: 0.072175 },
  p3: { r: 0.228982959480578, g: 0.691749262585238, b: 0.0792677779341829 },
  trc: 2.4,
  blkThrs: 0.022,
  blkClmp: 1.414,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  scale: 1.14,
  loClip: 0.1,
  offset: 0.027,
  deltaYmin: 0.0005,
};

export function apcaY({ space, rgb }) {
  const k = APCA[space];
  const [r, g, b] = rgb.map((c) => Math.min(1, Math.max(0, c)) ** APCA.trc);
  return k.r * r + k.g * g + k.b * b;
}

const softClamp = (Y) => (Y > APCA.blkThrs ? Y : Y + (APCA.blkThrs - Y) ** APCA.blkClmp);

// Lc: positive for dark text on a light background, negative for light text on dark. |Lc| is the contrast.
export function apcaContrast(text, bg) {
  const Ytxt = softClamp(apcaY(text));
  const Ybg = softClamp(apcaY(bg));
  if (Math.abs(Ybg - Ytxt) < APCA.deltaYmin) return 0;
  let sapc;
  if (Ybg > Ytxt) {
    sapc = (Ybg ** APCA.normBG - Ytxt ** APCA.normTXT) * APCA.scale;
    return sapc < APCA.loClip ? 0 : (sapc - APCA.offset) * 100;
  }
  sapc = (Ybg ** APCA.revBG - Ytxt ** APCA.revTXT) * APCA.scale;
  return sapc > -APCA.loClip ? 0 : (sapc + APCA.offset) * 100;
}

// WCAG 2 relative luminance and ratio, for comparison with the APCA figures.
// Relative luminance (CIE Y) of an OKLCH colour, from its linear sRGB coordinates, inside the gamut or not.
export function luminanceOf(lch) {
  const [r, g, b] = oklabToLinearSrgb(oklchToOklab(lch));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagLuminance({ space, rgb }) {
  const lin = rgb.map(toLinear);
  const lsrgb = space === 'p3' ? mul(XYZ_TO_LSRGB, mul(LP3_TO_XYZ, lin)) : lin;
  return 0.2126 * lsrgb[0] + 0.7152 * lsrgb[1] + 0.0722 * lsrgb[2];
}

export function wcagRatio(a, b) {
  const [hi, lo] = [wcagLuminance(a), wcagLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// APCA's published minimums (Lc) by use, from the APCA readme's "font lookup" guidance.
export const APCA_LEVELS = [
  { lc: 90, use: 'preferred body text' },
  { lc: 75, use: 'body text minimum' },
  { lc: 60, use: 'large or bold text; headlines, labels' },
  { lc: 45, use: 'large headlines, non-text, 36px+' },
  { lc: 30, use: 'spot text, disabled, placeholders' },
  { lc: 15, use: 'invisible to many; decorative only' },
];
