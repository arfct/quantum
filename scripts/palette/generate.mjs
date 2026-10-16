// Generates the palette from palette/spec.json and the Tailwind base in tokens/tokens.json:
//   palette/euclid-palette.json   every step: oklch, display-p3, sRGB hex, APCA figures, text colour
//   palette/euclid-palette.css    custom properties, hex with an oklch() override where supported
//   palette/euclid-tailwind.css   the same as a Tailwind CSS v4 @theme (--color-red-500 and so on)
// It does not touch tokens/tokens.json; promote a palette by hand once it is settled.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseFromTokens, generate, toCss, toTailwindCss } from './palette.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const specPath = process.argv[2] ?? join(root, 'palette/spec.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const base = baseFromTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')));
const radix = JSON.parse(readFileSync(join(root, 'palette/reference/radix-drift.json'), 'utf8'));
const palette = generate(spec, base, { radix });

writeFileSync(join(root, 'palette/euclid-palette.json'), JSON.stringify(palette, null, 2) + '\n');
writeFileSync(join(root, 'palette/euclid-palette.css'), toCss(palette));
writeFileSync(join(root, 'palette/euclid-tailwind.css'), toTailwindCss(palette));
const clamped = Object.entries(palette.families).flatMap(([f, fam]) => Object.entries(fam.steps).filter(([, s]) => s.clamped).map(([s]) => `${f}-${s}`));
console.log(`palette: ${Object.keys(palette.families).length} families → palette/euclid-palette.json, euclid-palette.css, euclid-tailwind.css`);
if (clamped.length) console.log(`chroma clamped to Display P3 on ${clamped.length} steps: ${clamped.join(', ')}`);
if (palette.chromaCap) console.log(`chroma cap: ${palette.chromaCap.a} · (1 − L)^${palette.chromaCap.p} × ${palette.chromaCap.scale}; capped on ${Object.entries(palette.families).flatMap(([f, fam]) => Object.entries(fam.steps).filter(([, s]) => s.capped).map(([s]) => `${f}-${s}`)).join(', ') || 'no steps'}`);
if (palette.bendFit) console.log(`hue bend: ${palette.bendFit.harmonics} harmonics, rms ${palette.bendFit.shade.rms}° shading / ${palette.bendFit.tint.rms}° tinting`);
for (const [f, a] of Object.entries(palette.anchors)) console.log(`anchor ${f.padEnd(7)} ${a.input} → ${f}-${a.step}  ΔE ${a.fit.deltaE}  ΔL ${a.fit.dL}  ΔC ${a.fit.dC}`);
