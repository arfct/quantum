# Quantum

Artifact's design system. Quantum is inspired by Classic Material Design and named after Material's original codename, Quantum Paper. It takes Classic Material Design's colour roles, elevation and 8dp grid, uses a blue primary, red floating action buttons and a lime accent, and changes four things: text is set in the platform's system UI font, icons are Material Symbols Outlined, the Tailwind CSS palette ships as tokens, and rounded rectangles are drawn with squircle corners.

The rules for using it are in [docs/brand-book.md](docs/brand-book.md); each component has guidelines in [docs/components](docs/components).

## Install

```sh
npm install @arfct/quantum
```

React 18 or later is a peer dependency.

## Use

```tsx
import '@arfct/quantum/quantum.css';
import { Button, Card, TextField } from '@arfct/quantum';

export function Example() {
  return (
    <Card title="Sign in" actions={<Button variant="contained">Continue</Button>}>
      <TextField label="Email" type="email" />
    </Card>
  );
}
```

`quantum.css` contains the tokens and the component styles, and loads the Material Symbols Outlined web font. Set `data-theme="dark"` on `<html>` (or any ancestor) for the dark theme; the default is light.

Every component forwards its ref and passes HTML attributes it does not name through to its underlying element. For `TextField`, `Checkbox` and `Switch` that element is the `<input>`; their `className` and `style` go to the outer wrapper. `Dialog` calls `onClose` on Escape or a click on the scrim; unless `contained`, it also moves focus into itself when it opens and returns focus when it closes.

### Stylesheets

| Import | Contents |
| --- | --- |
| `@arfct/quantum/quantum.css` | Icon font import, tokens and component styles. Use this one unless you need them apart. |
| `@arfct/quantum/tokens.css` | Tokens only: colour, shadow, spacing, radius, opacity and squircle custom properties per theme, and a class per type style (`.headline1` … `.overline`). |
| `@arfct/quantum/components.css` | Component styles only (`q-` classes and the corner presets `.rounded-continuous`, `.rounded-squircle` and `.squircle-icon`); needs `tokens.css`. |
| `@arfct/quantum/tailwind.css` | A Tailwind CSS v4 `@theme` mapping the tokens to utilities, plus the corner preset utilities. |
| `@arfct/quantum/tokens.json` | The token source, for tools. |

### With Tailwind CSS v4

```css
@import "@arfct/quantum/quantum.css";
@import "tailwindcss";
@import "@arfct/quantum/tailwind.css";
```

Import `quantum.css` before `tailwindcss`: it starts with the Material Symbols `@import`, which a stylesheet only honours ahead of every other rule. Imported after `tailwindcss`, the icon font is dropped. Quantum's styles are unlayered, so they still take precedence over Tailwind's layered base styles.

This adds utilities such as `bg-primary-fill`, `text-on-primary-fill`, `text-primary`, `bg-fab`, `bg-surface-dp08`, `text-text-medium`, `border-divider`, `rounded-small`, `rounded-medium`, `rounded-chip`, `shadow-dp2` … `shadow-dp24`, `font-sans`, `font-icons` and `text-headline1` … `text-overline`. The semantic colours resolve through the runtime custom properties, so they follow `data-theme`. Tailwind's own palette already matches the palette tokens (`bg-red-500` and so on). Its default spacing scale is 4px per step, so `p-4` equals `space-16`.

Tailwind's `rounded-*` utilities draw plain circular corners. For the component corner on your own elements use `rounded-continuous-<value>` (`rounded-continuous-medium`, `rounded-continuous-[20px]`); `rounded-squircle-<value>` draws a softer corner and `squircle-icon` the 26% icon mask. Outside Tailwind the same presets are the classes `.rounded-continuous`, `.rounded-squircle` and `.squircle-icon`, sized with `--squircle-radius`. See [docs/components/Squircle.md](docs/components/Squircle.md).

## Develop

Development needs Node 22.22, 24.15 or 26 and later (jsdom requires it); the published package supports Node 20.

```sh
npm install
npm run dev        # example gallery of every component, with a theme switch
npm run typecheck
npm run build      # dist/: tokens.css, tailwind.css, tokens.json, components.css, quantum.css, index.js, index.cjs, index.d.ts, index.d.cts
npm test           # Vitest and Testing Library, in jsdom
npm run check      # typecheck and build; CI runs this and npm test
```

### Layout

```
tokens/tokens.json        the token source of truth
scripts/build-tokens.mjs  tokens.json → dist/tokens.css, dist/tailwind.css, dist/tokens.json
scripts/build-styles.mjs  dist/tokens.css + src/styles/quantum.css → dist/quantum.css
src/components/           React components (one file each)
src/styles/quantum.css    component styles
docs/                     brand book and component guidelines
examples/                 Vite gallery used by npm run dev
palette/                  palette spec, generated palette and the explorer page (npm run palette)
scripts/palette/          colour maths, palette generator, evaluator and explorer build
test/                     component tests (npm test)
```

### Palette tools

`scripts/palette/` holds the tools for revising the colour palette, kept apart from the tokens until a palette is settled. Everything is derived in OKLCH from `palette/spec.json`: a lightness ladder shared by every family (equal APCA contrast steps between a top and a bottom, the mean of the ramps against white and against black, carried on to black past the 850); each family's hue from Tailwind's 500, bent as the ramp leaves it by a smooth function of hue (a four-harmonic Fourier series fitted at build time to Tailwind's measured drift: toward red or blue when shading, toward yellow-green or pink when tinting); relative saturation as one bell over the ladder (chroma as a share of the Display P3 maximum, fitted to Tailwind's mean) times a light and a dark number per family, capped near white so no hue outruns its neighbours; each chromatic step moved to the OKLab L whose luminance equals the neutral's on that row, so APCA contrast is uniform across a row; and the three anchors (Byrne's red, yellow and blue), each of which sets its family's hue and chroma so the ramp passes through the anchor. A family can hold or scale either side of the bend, move its pivot, and scale its chroma toward the dark end; the spec's `note` field describes every key. `palette/reference/radix-drift.json` holds the Radix measurements the explorer plots. Hex and `display-p3` values are gamut-mapped from the OKLCH reference; each family's natural step is the one nearest its gamut cusp.

```sh
npm run palette            # spec.json → palette/euclid-palette.json, euclid-palette.css, euclid-tailwind.css, explorer.html
npm run palette:evaluate   # lightness spread, APCA text contrast and gamut per step; --base for Tailwind
```

`palette/explorer.html` is a self-contained page that shows Tailwind and Euclid side by side, with APCA (Lc) contrast for the chosen text on every step, a lightness-by-step chart with each hue's cusp, and the spec editable in place. Copy the spec out of it into `palette/spec.json` and run `npm run palette` to bring a change into the repo. `palette/euclid-tailwind.css` is the palette as a Tailwind CSS v4 `@theme`: import it after `tailwindcss` and `bg-red-500` and the rest resolve to the Euclid values, hex where the browser has no `oklch()` and OKLCH where it does. `scripts/palette/color.mjs` has the conversions (sRGB, Display P3, OKLab/OKLCH), CSS Color 4 gamut mapping, APCA, dominant wavelength and the hue-sector designations.

### Changing tokens

Edit `tokens/tokens.json`, then run `npm run build`. Never edit the files in `dist/`. Every token carries a `usage` note; keep it current, including the contrast figures for text colours.

## Design system

The source design system lives as a Design System artifact in Claude. This repo was exported from it and is now the source of truth; to update the artifact, re-sync it from this repo rather than editing both.

## License

MIT. See [LICENSE](LICENSE).
