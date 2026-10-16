// Palette generator. Everything is derived in OKLCH from a short spec:
//   ladder      one lightness per step, shared by every family: equal APCA contrast steps between a top
//               and a bottom (against white, black or the mean of both), equal OKLab L steps, a curve
//               from top, mid and bottom with a gain (Schlick bias/gain), that curve fitted to the base
//               palette's mean lightness per step ({from: 'base'}), or an explicit list
//   hue         the base (Tailwind) hue at the 500 (or the family's hue), bent as the ramp leaves it by a
//               Fourier series fitted to the measured drift of the reference palettes (bendAt); a family
//               can move the pivot step (bendPivot), set its own ease (bendEase), scale either side (shadeBend, tintBend), add its own
//               degrees at the ends (shadeDrift, tintDrift) and scale chroma toward them (shadeChroma, tintChroma)
//   share       chroma as a share of the P3 gamut: read off the base ramp at each step's lightness, or
//               (chroma: {from: 'bell'}) one fitted bell over the ladder times a light and a dark number
//               per family, fitted to its base ramp
//   hues        'anchors' places the unanchored families between the anchored ones at the base spacing
//   luminance   {equalize: 1} moves each chromatic step to the OKLab L whose luminance matches the neutral's
//   saturation  a multiplier on that share
//   chromaCap   a ceiling on chroma near white, fitted to the base palette's most chromatic tints
//   anchors     a colour a family passes through in hue and lightness: it shifts the family's hue by its
//               difference from the base ramp at that lightness (and scales chroma with keepChroma)
// Hex and display-p3 values are gamut-mapped from the OKLCH reference. The "natural" step of a family
// is the one nearest the gamut cusp: the lightness at which its hue reaches the most chroma.
import {
  apcaContrast,
  bandName,
  deltaEok,
  dominantWavelength,
  formatOklch,
  formatP3,
  hueCode,
  hueLetter,
  maxChroma,
  parseColor,
  spaceToOklch,
  toGamut,
  toHex,
  toP3Hex,
  apcaY,
  luminanceOf,
  wcagLuminance,
  round,
} from './color.mjs';

// The base (Tailwind) palette has 11 steps; Euclid adds the x50s between them.
export const BASE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
export const STEPS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950];
const stepsOf = (steps) => Object.keys(steps).map(Number).sort((a, b) => a - b);
// Position of a step along the ladder, 0 at 050 and 1 at 950.
const tOf = (s) => STEPS.indexOf(s) / (STEPS.length - 1);
export const DEFAULTS = { ladder: { top: 0.975, mid: 0.63, bottom: 0.26, gain: 0.4 }, saturation: 1, bendEase: 1.5, whiteMinLc: 60, textMinLc: 75, hueFormat: 'percent' };
const WHITE = { space: 'srgb', rgb: [1, 1, 1] };
const BLACK = { space: 'srgb', rgb: [0, 0, 0] };
const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const norm = (h) => ((h % 360) + 360) % 360;

// --- ladder ---------------------------------------------------------------------------

// Schlick's bias and gain: bias(t, b) passes through (0.5, b); gain below 0.5 makes an S-curve.
const bias = (t, b) => t / ((1 / b - 2) * (1 - t) + 1);
const gain = (t, g) => (t < 0.5 ? bias(2 * t, g) / 2 : 1 - bias(2 - 2 * t, g) / 2);

// L(t) for t = 0 (050) … 1 (950): top at 0, mid at 0.5, bottom at 1; gain shapes the ends.
export function ladderFrom(spec, base) {
  const fn = ladderFunction(spec, base);
  return Object.fromEntries(STEPS.map((s) => [s, round(fn.at(s), 4)]));
}

// The ladder as a function of step number over 0–1000: the curve (fitted to the base palette, given, or
// interpolated from explicit steps) over 050–950 unchanged, then power eases to white at 0 and black at
// 1000 from the tail step (default 850, so the 900 and 950 take part in the drop) and the mirror before the
// 050: each continues the ladder's slope and adds a power term (exponent dive) that reaches the edge.
export function ladderFunction(spec, base) {
  const dive = spec.ladder?.dive ?? 5;
  const tail = spec.ladder?.tail ?? 850;
  let core, fit = null, top, bottom;
  if (spec.lightness) {
    const pts = STEPS.map((s) => [s, Number(spec.lightness[s])]);
    core = (step) => {
      const i = Math.min(pts.length - 2, Math.max(0, pts.findIndex(([s]) => s > step) - 1));
      const [s0, L0] = pts[i], [s1, L1] = pts[i + 1];
      return L0 + ((L1 - L0) * (step - s0)) / (s1 - s0);
    };
    top = Number(spec.lightness[50]);
    bottom = Number(spec.lightness[950]);
  } else {
    let params;
    if (spec.ladder?.from === 'uniform' || spec.ladder?.from === 'apca') {
      // Perceptual ramps between top and bottom: equal OKLab L steps (equal CIE L* for greys), or equal
      // APCA contrast steps against white (the unclipped SAPC curve, so it inverts everywhere).
      top = spec.ladder.top ?? DEFAULTS.ladder.top;
      bottom = spec.ladder.bottom ?? DEFAULTS.ladder.bottom;
      // APCA's two polarities: dark text on white (Ybg^0.56 − Ytxt^0.57) or light text on black (Ybg^0.65 − Ytxt^0.62).
      // Both written so the value falls as L rises, which the bisection below assumes.
      const onWhite = (L) => ((1 - (L ** 3) ** 0.57) * 1.14 - 0.027) * 100;
      const onBlack = (L) => -(((L ** 3) ** 0.62) * 1.14 - 0.027) * 100;
      const invert = (f) => (lc) => { let lo = 0, hi = 1; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) > lc) lo = m; else hi = m; } return (lo + hi) / 2; };
      const t = (step) => (step - 50) / 900;
      const ramp = (f) => { const inv = invert(f); return (step) => inv(f(top) + (f(bottom) - f(top)) * t(step)); };
      const against = spec.ladder.against ?? 'white';
      // 'both' splits the difference: the mean of the two ramps at each step.
      const apcaRamp = against === 'both' ? ((w, b) => (step) => (w(step) + b(step)) / 2)(ramp(onWhite), ramp(onBlack)) : ramp(against === 'black' ? onBlack : onWhite);
      core = spec.ladder.from === 'uniform' ? (step) => top - (top - bottom) * t(step) : apcaRamp;
    } else if (spec.ladder?.from === 'base' && base) {
      const means = baseLadder(base);
      fit = fitLadder(means);
      params = fit;
      top = curveAt(params, 0);
      bottom = curveAt(params, 1);
    } else {
      params = { ...DEFAULTS.ladder, ...spec.ladder };
      top = params.top;
      bottom = params.bottom;
    }
    if (params && !core) core = (step) => curveAt(params, (step - 50) / 900);
  }
  // The ends continue the ladder's own slope where they leave it (no visible seam), then a power term
  // takes them the rest of the way to black or white.
  const slopeAt = (step) => (core(step + 1) - core(step - 1)) / 2;
  const L50 = core(50), Ltail = core(tail), mTail = Math.min(0, slopeAt(tail)), mHead = Math.min(0, slopeAt(50));
  const tailLen = 1000 - tail;
  const tailFn = (step) => { const u = (step - tail) / tailLen; return Ltail + mTail * (step - tail) - (Ltail + mTail * tailLen) * u ** dive; };
  const headFn = (step) => { const v = (50 - step) / 50; return L50 + mHead * (step - 50) + (1 - L50 + mHead * 50) * v ** dive; };
  const at = (step) => (step < 50 ? headFn(step) : step > tail ? tailFn(step) : core(step));
  return { at, fit, dive, tail, top, bottom: at(950) };
}

// The curve at any position t in [0, 1] (050 → 950).
export const curveAt = ({ top, mid, bottom, gain: g }, t) => top - (top - bottom) * bias(gain(t, g), (top - mid) / (top - bottom));

// The curve's values for a {top, mid, bottom, gain}.
export const curveLadder = ({ top, mid, bottom, gain: g }) => {
  const b = (top - mid) / (top - bottom);
  return Object.fromEntries(STEPS.map((s) => [s, round(top - (top - bottom) * bias(gain(tOf(s), g), b), 4)]));
};

// Fits {top, mid, bottom, gain} to a ladder by least squares: a coarse grid, then a finer one around the best.
export function fitLadder(target) {
  const steps = stepsOf(target);
  const err = (p) => { const c = curveLadder(p); return steps.reduce((e, s) => e + (c[s] - target[s]) ** 2, 0); };
  let best = { top: target[50], mid: target[500], bottom: target[950], gain: 0.5 };
  let bestErr = err(best);
  const search = (span, n) => {
    const around = { ...best };
    for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) for (let c = -n; c <= n; c++) for (let d = -n; d <= n; d++) {
      const p = { top: around.top + (a / n) * span.L, mid: around.mid + (b / n) * span.L, bottom: around.bottom + (c / n) * span.L, gain: around.gain + (d / n) * span.g };
      if (p.gain <= 0.05 || p.gain >= 0.95 || p.top <= p.mid || p.mid <= p.bottom) continue;
      const e = err(p);
      if (e < bestErr) { bestErr = e; best = p; }
    }
  };
  search({ L: 0.03, g: 0.2 }, 6);
  search({ L: 0.006, g: 0.04 }, 6);
  search({ L: 0.001, g: 0.008 }, 4);
  return { top: round(best.top, 4), mid: round(best.mid, 4), bottom: round(best.bottom, 4), gain: round(best.gain, 3), rms: round(Math.sqrt(bestErr / steps.length), 4) };
}

// The base palette's mean lightness per step over its chromatic families (chroma 0.06 or more at the 500).
export function baseLadder(base) {
  const fams = Object.values(base).filter((f) => f[500].C >= 0.06);
  return Object.fromEntries(BASE_STEPS.map((s) => [s, round(fams.reduce((sum, f) => sum + f[s].L, 0) / fams.length, 4)]));
}

// Position of a step along the ramp: 0 at the 500, 1 at the darkest step, -1 at the lightest.
export function rampPosition(ladder, step, pivot = 500) {
  const L = ladder[step];
  const Lp = ladder[pivot];
  if (L < Lp) return (Lp - L) / (Lp - ladder[950]);
  if (L > Lp) return -((L - Lp) / (ladder[50] - Lp));
  return 0;
}

export function nearestStep(ladder, L) {
  return stepsOf(ladder).map((s) => [s, Math.abs(ladder[s] - L)]).sort((a, b) => a[1] - b[1])[0][0];
}

// --- base ramps as curves over lightness --------------------------------------------------

// A family's base (Tailwind) ramp as samples by lightness: hue, and chroma as a share of the gamut
// maximum at that lightness and hue. Hue is unwrapped so it interpolates across 0°.
export function rampCurve(baseFamily) {
  const samples = BASE_STEPS.map((s) => {
    const { L, C, h } = baseFamily[s];
    return { L, h, share: C < 0.005 ? 0 : C / maxChroma(L, h, 'p3'), C };
  }).sort((a, b) => b.L - a.L);
  for (let i = 1; i < samples.length; i++) {
    while (samples[i].h - samples[i - 1].h > 180) samples[i].h -= 360;
    while (samples[i].h - samples[i - 1].h < -180) samples[i].h += 360;
  }
  return samples;
}

// Hue and share of a base ramp at any lightness, interpolated between its steps and held at the ends.
export function sampleRamp(curve, L) {
  if (L >= curve[0].L) return { h: curve[0].h, share: curve[0].share };
  const last = curve[curve.length - 1];
  if (L <= last.L) return { h: last.h, share: last.share };
  const i = curve.findIndex((p) => p.L <= L);
  const a = curve[i - 1];
  const b = curve[i];
  const t = (a.L - L) / (a.L - b.L);
  return { h: a.h + (b.h - a.h) * t, share: a.share + (b.share - a.share) * t };
}

// A base ramp made between two others, step by step: mean lightness and chroma, hue along the shorter arc.
export function mixFamilies(a, b, t = 0.5) {
  const out = {};
  for (const s of BASE_STEPS) {
    const h = a[s].h + wrap180(b[s].h - a[s].h) * t;
    out[s] = { L: a[s].L + (b[s].L - a[s].L) * t, C: a[s].C + (b[s].C - a[s].C) * t, h: norm(h) };
  }
  return out;
}

// The base families in order, with spec families declared `between` two of them inserted after the first.
export function orderedBase(spec, base) {
  const ordered = {};
  for (const [name, fam] of Object.entries(base)) {
    ordered[name] = fam;
    for (const [extra, f] of Object.entries(spec.families ?? {})) {
      if (f.between && f.between[0] === name && base[f.between[0]] && base[f.between[1]]) ordered[extra] = mixFamilies(base[f.between[0]], base[f.between[1]], f.mix ?? 0.5);
    }
  }
  return ordered;
}

// --- hue bend ----------------------------------------------------------------------------
// How far a hue drifts from its 500 by the end of the ramp, as a function of hue: shading bends toward
// red or blue, tinting toward yellow-green or pink. bend(h) = Σ a_n cos(n·h) + b_n sin(n·h), the
// coefficients fitted by least squares at generate time to the measured drift of the reference palettes
// (the base palette's own ramps, and Radix). cfg.coef holds [a1, b1, a2, b2, …]; cfg.scale multiplies.
export function harmonicBasis(h, harmonics) {
  const th = (h * Math.PI) / 180;
  const b = [];
  for (let n = 1; n <= harmonics; n++) b.push(Math.cos(n * th), Math.sin(n * th));
  return b;
}

// Least squares via the normal equations (Gauss-Jordan); small systems only.
export function fitHarmonics(points, harmonics) {
  const n = 2 * harmonics;
  const M = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (const { h, d } of points) {
    const b = harmonicBasis(h, harmonics);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) M[i][j] += b[i] * b[j];
      M[i][n] += b[i] * d;
    }
  }
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r][i] / M[i][i];
      for (let k = i; k <= n; k++) M[r][k] -= f * M[i][k];
    }
  }
  const coef = M.map((row, i) => round(row[n] / row[i], 3));
  const rms = round(Math.sqrt(points.reduce((e, p) => e + (harmonicBasis(p.h, harmonics).reduce((s, v, i) => s + v * coef[i], 0) - p.d) ** 2, 0) / points.length), 2);
  return { coef, rms };
}

// Measured drift of the base palette: hue at the 500 and the change to the 950 (shade) and the 050 (tint).
export function baseDrift(base) {
  const shade = [];
  const tint = [];
  for (const f of Object.values(base)) {
    if (f[500].C < 0.06) continue;
    shade.push({ h: f[500].h, d: wrap180(f[950].h - f[500].h) });
    tint.push({ h: f[500].h, d: wrap180(f[50].h - f[500].h) });
  }
  return { shade, tint };
}

export function bendAt(h, cfg) {
  if (!cfg?.coef) return 0;
  return (cfg.scale ?? 1) * harmonicBasis(h, cfg.coef.length / 2).reduce((s, v, i) => s + v * cfg.coef[i], 0);
}

// --- chroma envelope ----------------------------------------------------------------------
// One curve of relative chroma over the ladder for every family: the base palette's mean share of the
// gamut per step, fitted as a quadratic in t (0 at the 050, 1 at the 950) and scaled so its peak is 1.
// A family's share is then the bell times two numbers of its own, light and dark, fitted by least squares
// to its base ramp on either side of the 500, in place of the ramp's eleven sampled shares.
export function fitChromaBell(base, ladder) {
  const fams = Object.values(base).filter((f) => f[500].C >= 0.06);
  const pts = STEPS.map((s) => ({ t: tOf(s), y: fams.reduce((a, f) => a + sampleRamp(rampCurve(f), ladder[s]).share, 0) / fams.length }));
  const n = 3;
  const M = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (const { t, y } of pts) {
    const row = [1, t, t * t];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) M[r][c] += row[r] * row[c];
      M[r][n] += row[r] * y;
    }
  }
  for (let i = 0; i < n; i++) for (let r = 0; r < n; r++) {
    if (r === i) continue;
    const f = M[r][i] / M[i][i];
    for (let k = i; k <= n; k++) M[r][k] -= f * M[i][k];
  }
  const c = M.map((row, i) => row[n] / row[i]);
  let peak = 0;
  for (let t = 0; t <= 1; t += 0.01) peak = Math.max(peak, c[0] + c[1] * t + c[2] * t * t);
  return { c: c.map((v) => round(v / peak, 4)) };
}
export const bellAt = (bell, step) => { const t = tOf(step); return bell.c[0] + bell.c[1] * t + bell.c[2] * t * t; };

// A family's light and dark share against the bell: least squares over the steps from the 050 to the 500
// and from the 500 to the 950.
export function fitEnvelope(curve, ladder, bell) {
  const fit = (steps) => {
    let num = 0, den = 0;
    for (const s of steps) { const b = bellAt(bell, s); num += sampleRamp(curve, ladder[s]).share * b; den += b * b; }
    return round(num / den, 3);
  };
  return { light: fit(STEPS.filter((s) => s <= 500)), dark: fit(STEPS.filter((s) => s >= 500)) };
}

// --- chroma ceiling -----------------------------------------------------------------------
// The most chroma a tint may carry, as a function of its lightness: cap(L) = a · (1 − L)^p, fitted by
// log-linear least squares to the base palette's most chromatic family at each step from the 050 to the
// 400. Without it the share model lets a hue with a wide gamut near white (yellow) take far more chroma
// than its neighbours at the same step, which reads as darker. Below the 400 the curve is above any
// ramp, so it only binds near white.
export function fitChromaCap(base) {
  const chrom = Object.values(base).filter((f) => f[500].C >= 0.06);
  const pts = BASE_STEPS.filter((s) => s <= 400).map((s) => ({ x: Math.log(1 - chrom.reduce((a, f) => a + f[s].L, 0) / chrom.length), y: Math.log(Math.max(...chrom.map((f) => f[s].C))) }));
  const n = pts.length;
  const mx = pts.reduce((a, pt) => a + pt.x, 0) / n, my = pts.reduce((a, pt) => a + pt.y, 0) / n;
  const p = pts.reduce((a, pt) => a + (pt.x - mx) * (pt.y - my), 0) / pts.reduce((a, pt) => a + (pt.x - mx) ** 2, 0);
  return { a: round(Math.exp(my - p * mx), 3), p: round(p, 3) };
}
export const chromaCapAt = (cap, L) => (cap ? (cap.scale ?? 1) * cap.a * (1 - L) ** cap.p : Infinity);

// The spec's chroma cap resolved: fitted to the base palette ({from: 'base'}), or a and p given outright.
export function chromaCapFrom(spec, base) {
  if (!spec.chromaCap) return null;
  const fit = spec.chromaCap.from === 'base' ? fitChromaCap(base) : { a: spec.chromaCap.a, p: spec.chromaCap.p };
  return { ...fit, scale: spec.chromaCap.scale ?? 1 };
}

// --- equal luminance ----------------------------------------------------------------------
// OKLab L credits saturated blues and violets with lightness their luminance does not have, so a row of
// equal L is not a row of equal luminance, and APCA (which reads luminance) differs across it. With
// luminance: {equalize: amount} each chromatic step takes the OKLab L at which its luminance equals the
// neutral's at that step (the ladder's L with no chroma), moved the given share of the way from the
// ladder's L (0: equal OKLab L; 1: equal luminance). chromaAt gives the step's chroma at any L, since
// chroma changes with L and luminance with chroma. Luminance rises with L, so bisection.
export function equalizeL(L0, hue, chromaAt, amount) {
  if (!amount) return L0;
  const target = luminanceOf({ L: L0, C: 0, h: 0 });
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (luminanceOf({ L: m, C: chromaAt(m), h: hue }) < target) lo = m; else hi = m;
  }
  return L0 + ((lo + hi) / 2 - L0) * amount;
}
// The step whose neutral luminance is nearest a colour's: where rows are equal in luminance, the step it sits on.
export function nearestStepByLuminance(ladder, lch) {
  const y = luminanceOf(lch);
  return stepsOf(ladder).map((s) => [s, Math.abs(luminanceOf({ L: ladder[s], C: 0, h: 0 }) - y)]).sort((a, b) => a[1] - b[1])[0][0];
}

// --- gamut cusp ---------------------------------------------------------------------------

// Lightness and chroma of the most chromatic colour of a hue in a space (coarse scan, then refined).
export function cusp(h, space = 'p3') {
  let best = { L: 0.5, C: 0 };
  const scan = (from, to, stepSize) => {
    for (let L = from; L <= to + 1e-9; L += stepSize) {
      const C = maxChroma(L, h, space);
      if (C > best.C) best = { L, C };
    }
  };
  scan(0.2, 0.98, 0.02);
  scan(Math.max(0.05, best.L - 0.02), Math.min(0.99, best.L + 0.02), 0.002);
  return { L: round(best.L, 3), C: round(best.C, 4) };
}

// --- alpha blends -------------------------------------------------------------------------
// Each step as one saturated colour at an alpha over white (lighter than the family's pivot) or black
// (darker), the way an alpha scale is used. The source is the pivot step's lightness and chroma at the
// step's own hue, so it follows the bend; the alpha matches the step's luminance in sRGB, where browsers
// composite, and deltaE says how far the blend sits from the true step.
export function alphaBlend(target, source, over) {
  const bg = over === 'white' ? 1 : 0;
  const blendAt = (alpha) => ({ space: 'srgb', rgb: source.rgb.map((c) => bg + (c - bg) * alpha) });
  // Luminance first: the alpha at which the blend's luminance equals the step's (luminance moves one way
  // with alpha, so bisection). The hue is the source's, which tracks the step; chroma falls where it must.
  const y = wcagLuminance(target);
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    const ym = wcagLuminance(blendAt(m));
    if ((over === 'white') === (ym > y)) lo = m; else hi = m;
  }
  const alpha = (lo + hi) / 2;
  const blended = blendAt(alpha);
  return { over, source: toHex(source), alpha: round(alpha, 3), hex: toHex(blended), deltaE: round(deltaEok(spaceToOklch(target), spaceToOklch(blended)), 4) };
}
function alphaSteps(steps, pivot) {
  const p = steps[pivot].oklch;
  for (const s of stepsOf(steps)) {
    const over = s < pivot ? 'white' : 'black';
    const source = toGamut({ L: p.L, C: p.C, h: steps[s].oklch.h }, 'srgb');
    steps[s].alpha = s === pivot ? { over: 'white', source: steps[s].hex, alpha: 1, hex: steps[s].hex, deltaE: 0 } : alphaBlend(toGamut(steps[s].oklch, 'srgb'), source, over);
  }
}

// --- swatches ---------------------------------------------------------------------------

// White (or the light tint) is used whenever it clears `whiteMin` Lc, even if black contrasts more.
function textFor(swatch, whiteMin) {
  const white = apcaContrast(WHITE, swatch.srgb);
  const black = apcaContrast(BLACK, swatch.srgb);
  const best = Math.abs(white) >= whiteMin ? 'white' : Math.abs(black) >= Math.abs(white) ? 'black' : 'white';
  return { white: round(white, 1), black: round(black, 1), best, bestLc: round(Math.abs(best === 'white' ? white : black), 1) };
}

export function makeSwatch(lch, whiteMin = DEFAULTS.whiteMinLc) {
  const p3 = toGamut(lch, 'p3');
  const srgb = toGamut(lch, 'srgb');
  const swatch = {
    oklch: { L: round(lch.L, 4), C: round(lch.C, 4), h: round(lch.h, 2) },
    css: formatOklch(lch),
    p3: formatP3(p3),
    p3hex: toP3Hex(p3),
    hex: toHex(srgb),
    srgbInGamut: Math.abs(spaceToOklch(srgb).C - lch.C) < 0.002,
    Y: round(apcaY(p3), 4),
    p3rgb: p3.rgb.map((v) => round(Math.min(1, Math.max(0, v)), 4)),
    wavelength: dominantWavelength(lch),
    srgb,
  };
  swatch.text = textFor(swatch, whiteMin);
  delete swatch.srgb;
  return swatch;
}

// Tinted ink for a step: the family step nearest the background that still meets `minLc`, lighter
// steps first, with white and black as the ends of the ramp. When nothing passes, the strongest
// candidate is used and flagged.
function trackTint(steps, s, minLc) {
  const bg = { space: 'p3', rgb: steps[s].p3rgb };
  const L0 = steps[s].oklch.L;
  const candidates = [
    { ink: 'white', L: 1, hex: '#FFFFFF', p3: 'color(display-p3 1 1 1)', rgb: [1, 1, 1] },
    { ink: 'black', L: 0, hex: '#000000', p3: 'color(display-p3 0 0 0)', rgb: [0, 0, 0] },
    ...stepsOf(steps).filter((t) => t !== s).map((t) => ({ ink: String(t), L: steps[t].oklch.L, hex: steps[t].hex, p3: steps[t].p3, rgb: steps[t].p3rgb })),
  ].map((c) => ({ ...c, lc: round(apcaContrast({ space: 'p3', rgb: c.rgb }, bg), 1) }));
  const passing = candidates.filter((c) => Math.abs(c.lc) >= minLc);
  const light = passing.filter((c) => c.L > L0).sort((a, b) => a.L - b.L)[0];
  const dark = passing.filter((c) => c.L < L0).sort((a, b) => b.L - a.L)[0];
  const pick = light ?? dark ?? candidates.sort((a, b) => Math.abs(b.lc) - Math.abs(a.lc))[0];
  return { ink: pick.ink, hex: pick.hex, p3: pick.p3, lc: pick.lc, passes: Math.abs(pick.lc) >= minLc };
}

function finishFamily(steps, hue500, ladder, opts, naturalStep) {
  const present = stepsOf(steps);
  for (const s of present) {
    const bg = { space: 'p3', rgb: steps[s].p3rgb };
    steps[s].text.dark = round(apcaContrast({ space: 'p3', rgb: steps[950].p3rgb }, bg), 1);
    steps[s].text.light = round(apcaContrast({ space: 'p3', rgb: steps[50].p3rgb }, bg), 1);
    steps[s].text.tint = trackTint(steps, s, opts.textMin);
  }
  const code = hueLetter(steps[500].oklch.h, steps[500].oklch.C) + hueCode(steps[500].oklch.h, opts.hueFormat, opts.hueRounding);
  for (const s of present) steps[s].id = `${code}.${String(s).padStart(3, '0')}`;
  const w500 = steps[500].wavelength;
  const nms = present.map((s) => steps[s].wavelength).filter((w) => w.nm !== null && w.complementary === w500.complementary).map((w) => w.nm);
  const peak = cusp(hue500, 'p3');
  const natural = { ...peak, step: naturalStep ?? nearestStep(ladder, peak.L), cuspStep: nearestStep(ladder, peak.L) };
  // The pivot is the family's most chromatic step: a pale cusp step (lime, chartreuse) cannot reach the darks over black.
  const alphaPivot = code.startsWith('N') ? 500 : present.reduce((best, s) => (steps[s].oklch.C > steps[best].oklch.C ? s : best), present[0]);
  alphaSteps(steps, alphaPivot);
  return {
    code,
    natural,
    alphaPivot,
    wavelength: w500,
    band: (w500.purity !== null && w500.purity < 0.05 ? 'near-neutral ' : '') + bandName(w500.nm, w500.complementary),
    wavelengthRange: nms.length ? [Math.min(...nms), Math.max(...nms)] : null,
  };
}

// --- generate ---------------------------------------------------------------------------

export function generate(spec, base, reference = {}) {
  const ladder = ladderFrom(spec, base);
  const opts = {
    whiteMin: spec.whiteMinLc ?? DEFAULTS.whiteMinLc,
    textMin: spec.textMinLc ?? DEFAULTS.textMinLc,
    hueFormat: spec.hueFormat ?? DEFAULTS.hueFormat,
    hueRounding: spec.hueRounding ?? 10,
  };
  const saturation = spec.saturation ?? DEFAULTS.saturation;
  const chromaCap = chromaCapFrom(spec, base);
  // The bend: harmonics fitted to the measured drift of the chosen references (the base palette by default).
  let bendCfg = null;
  let bendFit = null;
  if (spec.hueBend?.harmonics) {
    const own = baseDrift(base);
    const radix = reference.radix?.scales ? Object.values(reference.radix.scales) : [];
    const use = spec.hueBend.reference ?? ['base'];
    const pts = (key) => [...(use.includes('base') ? own[key] : []), ...(use.includes('radix') ? radix.map((r) => ({ h: r.hue9, d: r[key] })) : [])];
    const shade = fitHarmonics(pts('shade'), spec.hueBend.harmonics);
    const tint = fitHarmonics(pts('tint'), spec.hueBend.harmonics);
    bendFit = { harmonics: spec.hueBend.harmonics, scale: spec.hueBend.scale ?? 1, shade, tint };
    // hueBend.shade and hueBend.tint are the default side multipliers, which a family's shadeBend and tintBend replace.
    bendCfg = { shade: { coef: shade.coef, scale: bendFit.scale }, tint: { coef: tint.coef, scale: bendFit.scale } };
  }
  // Hue offset of a step from the family's pivot (the 500 unless bendPivot says otherwise): the shade bend
  // below it, the tint bend above it, scaled by distance and by the family's shadeBend and tintBend.
  // The offset grows as |pos|^ease, so the ramp leaves the pivot without a corner (ease above 1 gives zero
  // slope there) and reaches the full bend at the ends. shadeDrift and tintDrift add degrees of the
  // family's own at the ends, eased the same way.
  const ease = spec.hueBend?.ease ?? DEFAULTS.bendEase;
  const offsetAt = (hue, s, fam = {}) => {
    const pos = rampPosition(ladder, s, fam.bendPivot ? Number(fam.bendPivot) : 500);
    const amount = Math.abs(pos) ** (fam.bendEase ?? ease);
    if (pos >= 0) return ((bendCfg ? bendAt(hue, bendCfg.shade) : 0) * (fam.shadeBend ?? spec.hueBend?.shade ?? 1) + Number(fam.shadeDrift ?? 0)) * amount;
    return ((bendCfg ? bendAt(hue, bendCfg.tint) : 0) * (fam.tintBend ?? spec.hueBend?.tint ?? 1) + Number(fam.tintDrift ?? 0)) * amount;
  };
  // Chroma scaled toward the ends of the ramp: shadeChroma is the multiplier reached at the 950, tintChroma at the 050.
  const chromaScaleAt = (s, fam = {}) => {
    const pos = rampPosition(ladder, s, fam.bendPivot ? Number(fam.bendPivot) : 500);
    const end = pos >= 0 ? Number(fam.shadeChroma ?? 1) : Number(fam.tintChroma ?? 1);
    return 1 + (end - 1) * Math.abs(pos);
  };
  const bell = spec.chroma?.from === 'bell' ? fitChromaBell(base, ladder) : null;
  const equalize = Number(spec.luminance?.equalize ?? 0);
  const ordered = orderedBase(spec, base);
  // Pass one: each family's pivot hue (the base ramp's 500, given outright, shifted by hand, or set so the
  // ramp passes through the anchor's hue at its step) and its share of the gamut by step.
  const prep = {};
  for (const [name, baseFamily] of Object.entries(ordered)) {
    const fam = spec.families?.[name] ?? {};
    const curve = rampCurve(baseFamily);
    const envelope = bell ? fitEnvelope(curve, ladder, bell) : null;
    const shareAt = (s) => {
      if (!envelope) return sampleRamp(curve, ladder[s]).share;
      const pos = Math.max(0, rampPosition(ladder, s));
      return bellAt(bell, s) * (envelope.light + (envelope.dark - envelope.light) * pos);
    };
    let hue = norm((fam.hue ?? baseFamily[500].h) + Number(fam.hueShift ?? 0));
    let anchor = null;
    if (fam.anchor) {
      const a = parseColor(fam.anchor);
      const step = fam.anchorStep && fam.anchorStep !== 'auto' ? Number(fam.anchorStep) : equalize ? nearestStepByLuminance(ladder, a) : nearestStep(ladder, a.L);
      // The offset at the anchor's step depends on the pivot hue; a few passes settle it.
      hue = a.h;
      for (let i = 0; i < 4; i++) hue = norm(a.h - offsetAt(hue, step, fam));
      anchor = { input: fam.anchor, lch: a, step };
    }
    prep[name] = { fam, curve, envelope, shareAt, hue, anchor, placed: !!(fam.anchor || fam.hue != null) };
  }
  // Hues from the anchors: a family with neither anchor nor hue of its own sits between the nearest anchored
  // families (in base hue order) at the base palette's proportional spacing, so the anchors stretch the
  // whole circle rather than moving three families alone. hueShift still applies on top.
  if (spec.hues === 'anchors') {
    const chromatic = Object.keys(prep).filter((n) => ordered[n][500].C >= 0.06).sort((a, b) => ordered[a][500].h - ordered[b][500].h);
    const anchored = chromatic.filter((n) => prep[n].anchor);
    if (anchored.length >= 2) for (const n of chromatic) {
      if (prep[n].placed) continue;
      const h0 = ordered[n][500].h;
      let prev = anchored[anchored.length - 1], next = anchored[0];
      for (const a of anchored) { if (ordered[a][500].h <= h0) prev = a; }
      for (const a of [...anchored].reverse()) { if (ordered[a][500].h > h0) next = a; }
      const baseSpan = norm(ordered[next][500].h - ordered[prev][500].h) || 360;
      const u = norm(h0 - ordered[prev][500].h) / baseSpan;
      const span = baseSpan + wrap180(norm(prep[next].hue - prep[prev].hue) - baseSpan);
      prep[n].hue = norm(prep[prev].hue + span * u + Number(prep[n].fam.hueShift ?? 0));
    }
  }
  const families = {};
  const anchors = {};
  for (const [name, baseFamily] of Object.entries(ordered)) {
    const { fam, envelope, shareAt, anchor } = prep[name];
    const hue = prep[name].hue;
    let scale = (fam.chroma ?? 1) * saturation;
    // keepChroma scales the family so the anchor's step carries the anchor's chroma.
    if (anchor && fam.keepChroma && shareAt(anchor.step) > 0) scale *= anchor.lch.C / maxChroma(anchor.lch.L, anchor.lch.h, 'p3') / shareAt(anchor.step);
    const shift = wrap180(hue - baseFamily[500].h);
    const steps = {};
    let share500 = 0;
    const familyLadder = {};
    for (const s of STEPS) {
      const h = norm(hue + offsetAt(hue, s, fam));
      const share = shareAt(s) * scale * chromaScaleAt(s, fam);
      if (s === 500) share500 = share;
      const chromaAt = (L) => Math.min(share * maxChroma(L, h, 'p3'), maxChroma(L, h, 'p3'), chromaCapAt(chromaCap, L));
      const L = equalizeL(ladder[s], h, chromaAt, equalize);
      familyLadder[s] = L;
      const wanted = share * maxChroma(L, h, 'p3');
      const cap = chromaCapAt(chromaCap, L);
      const C = chromaAt(L);
      steps[s] = makeSwatch({ L, C, h }, opts.whiteMin);
      steps[s].clamped = share > 1;
      steps[s].capped = wanted > cap;
    }
    const hue500 = steps[500].oklch.h;
    const info = finishFamily(steps, hue500, familyLadder, opts, fam.naturalStep ? Number(fam.naturalStep) : undefined);
    if (anchor) {
      const at = steps[anchor.step].oklch;
      anchor.fit = { deltaE: round(deltaEok(anchor.lch, at), 4), dL: round(at.L - anchor.lch.L, 4), dC: round(at.C - anchor.lch.C, 4) };
      anchors[name] = { input: anchor.input, lch: { L: round(anchor.lch.L, 4), C: round(anchor.lch.C, 4), h: round(anchor.lch.h, 2) }, step: anchor.step, fit: anchor.fit };
    }
    families[name] = { hue: round(hue500, 2), hueShift: round(shift, 1), saturation: round(share500, 3), chromaScale: round(scale, 4), envelope, bend: round(wrap180(steps[950].oklch.h - hue500), 1), peakChroma: round(Math.max(...STEPS.map((s) => steps[s].oklch.C)), 4), ...info, steps };
  }
  const ladderFit = ladderFunction(spec, base).fit;
  return { name: spec.name, ladder, ladderFit, bend: bendCfg, bendFit, saturation, chromaCap, bell, equalize, families, anchors };
}

// --- continuous field ---------------------------------------------------------------------
// The same model evaluated at any hue and any step number 0–1000 (white to black): lightness from the
// ladder function, hue bent by the bend function, chroma as the share interpolated between the two
// families nearest in hue, applied to the P3 maximum at that lightness and hue.
export function fieldModel(spec, base, reference = {}) {
  const palette = generate(spec, base, reference);
  const ladder = palette.ladder;
  const fn = ladderFunction(spec, base);
  const ordered = orderedBase(spec, base);
  // Each family's share by step, as generated (its steps' chroma over the gamut maximum), held past the ends.
  const fams = Object.keys(ordered)
    .filter((n) => ordered[n][500].C >= 0.06)
    .map((n) => {
      const f = palette.families[n];
      const pts = STEPS.map((s) => ({ s, share: f.steps[s].oklch.C / maxChroma(f.steps[s].oklch.L, f.steps[s].oklch.h, 'p3') }));
      const share = (step) => {
        if (step <= 50) return pts[0].share;
        if (step >= 950) return pts[pts.length - 1].share;
        const i = pts.findIndex((p) => p.s > step);
        const a = pts[i - 1], b = pts[i];
        return a.share + ((b.share - a.share) * (step - a.s)) / (b.s - a.s);
      };
      return { name: n, hue: f.hue, share };
    })
    .sort((a, b) => a.hue - b.hue);
  const shareAt = (h, step) => {
    const hue = norm(h);
    let i = fams.findIndex((f) => f.hue > hue);
    const next = i === -1 ? fams[0] : fams[i];
    const prev = i === -1 ? fams[fams.length - 1] : i === 0 ? fams[fams.length - 1] : fams[i - 1];
    const span = norm(next.hue - prev.hue) || 360;
    const u = norm(hue - prev.hue) / span;
    const a = prev.share(step), b = next.share(step);
    return a + (b - a) * u;
  };
  const bend = palette.bend;
  const lightnessAtStep = (step) => Math.min(1, Math.max(0, fn.at(step)));
  const colorAtStep = (h, step) => {
    const L = lightnessAtStep(step);
    const t = (step - 50) / 900;
    const pos = Math.max(-1, Math.min(1, (t - 0.5) / 0.5));
    const amount = Math.abs(pos) ** (spec.hueBend?.ease ?? DEFAULTS.bendEase);
    const offset = !bend ? 0 : pos >= 0 ? bendAt(h, bend.shade) * amount : bendAt(h, bend.tint) * amount;
    const hue = norm(h + offset);
    const share = shareAt(h, step);
    const chromaAt = (l) => Math.min(share * maxChroma(l, hue, 'p3'), maxChroma(l, hue, 'p3'), chromaCapAt(palette.chromaCap, l));
    const Leq = equalizeL(L, hue, chromaAt, palette.equalize);
    return { L: Leq, C: chromaAt(Leq), h: hue };
  };
  return { palette, lightnessAtStep, shareAt, colorAtStep, families: fams.map((f) => ({ name: f.name, hue: f.hue })) };
}

// Reads a base palette out of the token file's Tailwind tokens: {red: {50: {L,C,h}, …}, …}.
export function baseFromTokens(tokens) {
  const base = {};
  for (const t of tokens.color.tokens) {
    const m = t.name.match(/^([a-z]+)-(\d+)$/);
    if (!m || !BASE_STEPS.includes(Number(m[2]))) continue;
    (base[m[1]] ??= {})[m[2]] = parseColor(t.value);
  }
  return base;
}

// Wraps a base palette (already in OKLCH) in the shape generate() produces, for side-by-side evaluation.
export function describe(base, name) {
  const families = {};
  const ladder = Object.fromEntries(BASE_STEPS.map((s) => [s, round(Object.values(base).reduce((sum, f) => sum + f[s].L, 0) / Object.keys(base).length, 4)]));
  const opts = { whiteMin: DEFAULTS.whiteMinLc, textMin: DEFAULTS.textMinLc, hueFormat: DEFAULTS.hueFormat, hueRounding: 10 };
  for (const [fam, steps] of Object.entries(base)) {
    const out = {};
    for (const s of BASE_STEPS) out[s] = makeSwatch(steps[s]);
    const info = finishFamily(out, steps[500].h, Object.fromEntries(BASE_STEPS.map((s) => [s, steps[s].L])), opts);
    const sat = BASE_STEPS.map((s) => steps[s].C / maxChroma(steps[s].L, steps[s].h, 'p3'));
    families[fam] = { hue: round(steps[500].h, 2), saturation: round(sat.reduce((a, b) => a + b) / sat.length, 3), bend: round(wrap180(steps[950].h - steps[500].h), 1), peakChroma: round(Math.max(...BASE_STEPS.map((s) => steps[s].C)), 4), ...info, steps: out };
  }
  return { name, ladder, families, anchors: {} };
}

// CSS: sRGB hex for every engine, then the OKLCH reference where supported (browsers map it to the display's gamut).
export function toCss(palette, selector = ':root') {
  const lines = [`/* ${palette.name}: generated by scripts/palette/generate.mjs from palette/spec.json. */`, `${selector} {`];
  const ok = [];
  for (const [fam, f] of Object.entries(palette.families)) {
    for (const s of stepsOf(f.steps)) {
      lines.push(`  --${fam}-${s}: ${f.steps[s].hex};`);
      ok.push(`    --${fam}-${s}: ${f.steps[s].css};`);
    }
  }
  lines.push('}', '@supports (color: oklch(0 0 0)) {', `  ${selector} {`, ...ok, '  }', '}');
  return lines.join('\n') + '\n';
}

// A Tailwind CSS v4 theme for the palette: `@theme inline` points each --color-* at a runtime custom
// property, so the hex value serves browsers without oklch() and the OKLCH one overrides it where
// it is supported. Import after tailwindcss; Tailwind's own palette entries of the same name are replaced.
export function toTailwindCss(palette) {
  const lines = [`/* ${palette.name}: Tailwind CSS v4 theme, generated by scripts/palette/generate.mjs from palette/spec.json. Import after tailwindcss. */`, '@theme inline {'];
  for (const [fam, f] of Object.entries(palette.families)) for (const s of stepsOf(f.steps)) lines.push(`  --color-${fam}-${s}: var(--${fam}-${s});`);
  lines.push('}');
  return lines.join('\n') + '\n' + toCss(palette).replace(/^\/\*.*\*\/\n/, '');
}

