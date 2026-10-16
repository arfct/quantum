// Prints an evaluation of a palette JSON (default: palette/euclid-palette.json; pass --base for the
// Tailwind palette in tokens.json): lightness spread per step, APCA text contrast per step, and
// which steps fall out of the sRGB gamut.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STEPS, baseFromTokens, describe } from './palette.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = process.argv[2];
const palette =
  arg === '--base'
    ? describe(baseFromTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'))), 'Tailwind CSS v4.1')
    : JSON.parse(readFileSync(arg ?? join(root, 'palette/euclid-palette.json'), 'utf8'));

const fams = Object.entries(palette.families);
const fmt = (n, w = 6) => String(n).padStart(w);
console.log(`${palette.name}: ${fams.length} families\n`);
console.log('step   L min   L max   spread   Lc white (min…max)   Lc black (min…max)   best text        outside sRGB');
for (const s of STEPS) {
  const sw = fams.map(([, f]) => f.steps[s]).filter(Boolean);
  if (!sw.length) continue;
  const Ls = sw.map((x) => x.oklch.L);
  const w = sw.map((x) => Math.abs(x.text.white));
  const b = sw.map((x) => x.text.black);
  const best = sw.filter((x) => x.text.best === 'white').length;
  const out = sw.filter((x) => !x.srgbInGamut).length;
  console.log(
    `${fmt(s, 4)}  ${fmt(Math.min(...Ls).toFixed(3))}  ${fmt(Math.max(...Ls).toFixed(3))}  ${fmt((Math.max(...Ls) - Math.min(...Ls)).toFixed(3), 7)}   ${fmt(Math.min(...w).toFixed(0), 5)}…${Math.max(...w).toFixed(0).padEnd(12)} ${fmt(Math.min(...b).toFixed(0), 5)}…${Math.max(...b).toFixed(0).padEnd(12)} white ${fmt(best, 2)} / black ${fmt(fams.length - best, 2)}   ${out}`,
  );
}
console.log('\nfamily    λ at 500   band      range over ramp   hue');
for (const [f, fam] of fams) {
  const w = fam.wavelength;
  const nm = w.nm === null ? '–' : `${w.nm}${w.complementary ? 'c' : ''} nm`;
  const range = fam.wavelengthRange ? `${fam.wavelengthRange[0]}–${fam.wavelengthRange[1]}${w.complementary ? 'c' : ''}` : '–';
  console.log(`${f.padEnd(9)} ${nm.padEnd(10)} ${fam.band.padEnd(9)} ${range.padEnd(17)} ${fam.hue.toFixed(0)}`);
}
if (Object.keys(palette.anchors ?? {}).length) {
  console.log('\nanchor   input    step  ΔE      ΔL       ΔC');
  for (const [f, a] of Object.entries(palette.anchors)) console.log(`${f.padEnd(8)} ${a.input}  ${fmt(a.step, 3)}  ${a.fit.deltaE.toFixed(3)}  ${fmt(a.fit.dL.toFixed(3), 7)}  ${fmt(a.fit.dC.toFixed(3), 7)}`);
}
