// Builds the token outputs from tokens/tokens.json (the single source of truth):
//   dist/tokens.css    CSS custom properties per theme, plus one class per type style
//   dist/tailwind.css  a Tailwind CSS v4 @theme that maps utilities onto those properties
//   dist/tokens.json   a copy for tools
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const out = join(root, 'dist');
mkdirSync(out, { recursive: true });

const themes = tokens.color.themes.map((t) => t.id);
const [first, ...rest] = themes;
const valueFor = (token, theme) => {
  const v = token.value;
  if (typeof v === 'string') return theme === first ? v : undefined;
  return v[theme];
};
const resolve = (v) => (/^\{.+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);
const decl = (name, value) => `  --${name}: ${resolve(String(value))};`;

// Families shaped {tokens:[…]} other than color and shadow go into the theme-independent :root block.
const extraFamilies = Object.keys(tokens).filter(
  (k) => !['name', 'version', 'color', 'type', 'shadow'].includes(k) && Array.isArray(tokens[k]?.tokens),
);

const css = [`/* ${tokens.name} — generated from tokens.json */`];
css.push(
  `:root, [data-theme="${first}"] {\n` +
    [
      ...tokens.color.tokens.map((t) => decl(t.name, valueFor(t, first))),
      ...(tokens.shadow?.tokens ?? []).map((t) => decl(t.name, valueFor(t, first))),
    ].join('\n') +
    '\n}',
);
for (const theme of rest) {
  const lines = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])]
    .filter((t) => typeof t.value === 'object' && t.value[theme] !== undefined)
    .map((t) => decl(t.name, t.value[theme]));
  css.push(`[data-theme="${theme}"] {\n${lines.join('\n')}\n}`);
}
css.push(
  ':root {\n' +
    [
      ...extraFamilies.flatMap((f) => tokens[f].tokens.map((t) => decl(t.name, t.value))),
      ...Object.entries(tokens.type.families).map(([k, v]) => `  --font-${k}: ${v};`),
    ].join('\n') +
    '\n}',
);
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    css.push(
      `.${s.name} { font-family: var(--font-${s.family ?? group.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight}; letter-spacing: ${s.letterSpacing}; }`,
    );
  }
}
writeFileSync(join(out, 'tokens.css'), css.join('\n') + '\n');

// Tailwind v4: `@theme inline` makes utilities reference the runtime custom properties, so
// bg-primary follows data-theme. Tailwind's own palette already matches the palette tokens,
// so only the Quantum-specific names are mapped here.
const paletteHue = /^(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d+$|^(black|white)$/;
const tw = [
  `/* ${tokens.name} — Tailwind CSS v4 theme, generated from tokens.json. Import after tailwindcss and dist/tokens.css. */`,
  '@theme inline {',
];
for (const t of tokens.color.tokens) if (!paletteHue.test(t.name)) tw.push(`  --color-${t.name}: var(--${t.name});`);
// shape-squircle is left out: .rounded-squircle is the squircle class in quantum.css, not a plain radius.
for (const t of tokens.radius?.tokens ?? [])
  if (t.name !== 'shape-squircle') tw.push(`  --radius-${t.name.replace(/^shape-/, '')}: var(--${t.name});`);
for (const t of tokens.shadow?.tokens ?? []) tw.push(`  --shadow-${t.name.replace(/^shadow-/, 'dp')}: var(--${t.name});`);
for (const [k, v] of Object.entries(tokens.type.families)) tw.push(`  --font-${k}: ${v};`);
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    tw.push(`  --text-${s.name}: ${s.fontSize};`);
    tw.push(`  --text-${s.name}--line-height: ${s.lineHeight};`);
    tw.push(`  --text-${s.name}--letter-spacing: ${s.letterSpacing};`);
    tw.push(`  --text-${s.name}--font-weight: ${s.fontWeight};`);
  }
}
tw.push('}');
// Corner presets from arfct/squircle as Tailwind utilities; they read --squircle-scale and --squircle-shape from tokens.css.
tw.push(`
@utility rounded-continuous-* {
  --rounded-radius: --value(--radius-*, [length], [percentage], [*]);
  border-radius: var(--rounded-radius);
  @supports (corner-shape: superellipse(1)) {
    border-radius: calc(var(--rounded-radius) * var(--squircle-scale));
    corner-shape: var(--squircle-shape);
  }
}

@utility rounded-squircle-* {
  --rounded-radius: --value(--radius-*, [length], [percentage], [*]);
  border-radius: var(--rounded-radius);
  @supports (corner-shape: squircle) {
    corner-shape: squircle;
    border-radius: calc(var(--rounded-radius) * 2);
  }
}

@utility squircle-icon {
  border-radius: 26%;
  @supports (corner-shape: superellipse(1)) {
    border-radius: calc(26% * var(--squircle-scale));
    corner-shape: var(--squircle-shape);
  }
}`);
writeFileSync(join(out, 'tailwind.css'), tw.join('\n') + '\n');

writeFileSync(join(out, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
console.log(`tokens: ${tokens.color.tokens.length} colors, ${themes.length} themes → dist/tokens.css, dist/tailwind.css`);
