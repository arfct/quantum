// Assembles dist/quantum.css: the icon font import, the generated tokens, then the component styles.
// dist/components.css holds the component styles alone, for apps that ship tokens.css separately.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const components = readFileSync(join(root, 'src/styles/quantum.css'), 'utf8');
const tokens = readFileSync(join(root, 'dist/tokens.css'), 'utf8');

// @import must come first in a stylesheet, so lift it out of the component styles.
const imports = components.match(/^@import[^\n]*\n/gm) ?? [];
const body = imports.reduce((s, line) => s.replace(line, ''), components).trimStart();

writeFileSync(join(root, 'dist/components.css'), components);
writeFileSync(join(root, 'dist/quantum.css'), imports.join('') + '\n' + tokens + '\n' + body);
console.log('styles: dist/quantum.css, dist/components.css');
