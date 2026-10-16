// Builds palette/explorer.html: the explorer template with the colour maths, the generator, the
// Tailwind base palette and palette/spec.json inlined, so the page needs no network and regenerates
// the palette as the spec is edited.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseFromTokens } from './palette.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const asScript = (file) =>
  readFileSync(join(here, file), 'utf8')
    .replace(/^import[\s\S]*?from '\.\/color\.mjs';\n/m, '')
    .replace(/^export /gm, '');

const base = baseFromTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')));
const spec = readFileSync(join(root, 'palette/spec.json'), 'utf8').trim();
const radix = readFileSync(join(root, 'palette/reference/radix-drift.json'), 'utf8').trim();
const page = readFileSync(join(here, 'explorer.template.html'), 'utf8')
  .replace('/*__COLOR__*/', asScript('color.mjs'))
  .replace('/*__PALETTE__*/', asScript('palette.mjs'))
  .replace('/*__BASE__*/', JSON.stringify(base))
  .replace('/*__SPEC__*/', spec)
  .replace('/*__RADIX__*/', radix);
writeFileSync(join(root, 'palette/explorer.html'), page);
console.log(`explorer: palette/explorer.html (${(page.length / 1024).toFixed(0)} KB)`);
