# Quantum brand book

Quantum is inspired by Classic Material Design and named after Material's original codename, Quantum Paper. It takes Classic Material Design's bold primary colour on white paper surfaces, depth expressed through elevation, and the 8dp grid; it sets text in the platform's system UI font and icons in Material Symbols Outlined. Build interfaces from the tokens and components below; do not mix in Material 3 tonal palettes or shapes.

## Principles

- Surfaces are sheets of material. Each sits at an elevation, shown by its shadow (`shadow-*`) and, in dark theme, by a lighter surface (`surface-dp*`).
- Colour is functional: `primary` for key actions and selection, `fab` for the floating action button, `secondary` for accents and selection controls, `error` for errors. Everything else is neutral.
- Motion explains a change of state; it is quick and never decorative.
- Everything aligns to the 8dp grid; small elements and type baselines to 4dp.

## Content

- Sentence case for titles, labels and messages ("Discard draft?"). Buttons and overlines are rendered in caps by their type styles; write their labels in sentence case in code.
- Button labels are verbs that name the result: "Save", "Discard", "Undo". Avoid "OK" and "Yes/No".
- Address the user as "you"; keep messages short and specific ("Photo archived", not "Success!"). No emoji.

## Colour

- Page background `background`; containers `surface`, raised per their elevation with the matching `surface-dpNN` token (identical white in light theme, progressively lighter grey in dark).
- Text is ink at an emphasis: `text-high` for primary text, `text-medium` for secondary text and inactive icons, `text-disabled` for disabled states. Never set text in pure `on-surface`.
- Text and icons on a coloured fill use its `on-` token: `on-primary-fill`, `on-fab`, `on-secondary`, `on-error`.
- The brand colours are blue, red and lime. Filled controls use `primary-fill`, the palette's `blue-600`, with white text (`on-primary-fill`) in both themes; `primary` is the same blue as text, outlines and selection; `fab` is `red-600` with a white icon (`on-fab`) in both themes, used only for the floating action button; `secondary` is chartreuse, Lime A400 (#c6ff00) from the original Material Design palette, with black text.
- `fab` is red but is not an error colour: errors use `error`, and the FAB is never used for destructive actions.
- `secondary` (chartreuse) is a fill only in light theme: it fails as text on white (1.2:1).
- Hairlines and outlined-component borders are `divider`; the outlined text field uses `outline`.
- Fills stay saturated in dark theme: contained buttons and FABs keep `blue-600` and `red-600` with white text. Colour used as text or lines is lightened so it reads on dark surfaces: `primary` becomes `blue-300` (10.3:1 on `background`) and `error` #cf6679.
- Interaction is shown with state layers: `on-surface` (or the fill's `on-` token on fills) at `state-hover`, `state-focus`, `state-pressed`, `state-selected`, `state-dragged`.

## Tailwind palette

The full Tailwind CSS v4.1 colour palette ships as tokens, `--<hue>-<step>`: hues `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`; steps `50`, `100`–`900`, `950`; plus `black` and `white`. Values are Tailwind's own `oklch()` colours and are the same in both themes.

- Use the palette for things the semantic roles do not cover: chart series, illustration, category tags, avatars, and extended status hues (`amber-*` for warnings, `sky-*` for information).
- Never use a palette step in place of a semantic role: buttons, surfaces, text, dividers and errors stay on `primary`, `surface-*`, `text-*`, `divider` and `error`, so the dark theme keeps working.
- Palette steps do not change with the theme. On a dark surface pick a different step (a 300–400 instead of a 600–700) or pair the step with its own fill.
- Each token's note gives its contrast on white and on #121212. As text on white, every hue meets 4.5:1 at 700 and darker; at 600 only red, rose, pink, fuchsia, purple, violet, indigo, blue and the five greys do. On #121212, every step 400 and lighter meets 4.5:1.
- Tinted chips and tags: a 100 fill with 800 text in light theme; a 900 or 950 fill with 200 text in dark.

## Type

One family, the system UI font (`--font-sans`: `system-ui`, then Segoe UI, Roboto, Helvetica Neue, Arial), in the thirteen-style Material scale: `headline1`–`headline6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`.

- Body copy `body1`; dense UI and secondary lines `body2`; helper text `caption`.
- App bar, card and dialog titles `headline6`.
- `button` and `overline` are uppercase with wide tracking (1.25px and 1.5px); apply `text-transform: uppercase`.
- Use Light (300) only at `headline1` and `headline2` sizes. Some system fonts have no Light weight and render these at Regular; that is acceptable.
- No web font is loaded for text: do not add Roboto or another family on top of the stack.

## Shape and elevation

- Small components (buttons, text fields, snackbars) `shape-small`; medium (cards, dialogs, menus) `shape-medium`; large (sheets, drawers, app bars) `shape-none`. Chips `shape-chip`, FABs `shape-full`.
- Corners are squircles. Every rounded rectangle keeps its radius token but is drawn with a continuous-curvature corner through CSS `corner-shape` (radius × `squircle-scale`, `squircle-shape`), falling back to a plain rounded rect where unsupported. The components do this already; on your own elements add `.rounded-squircle` and set `--squircle-radius` to the radius token (default `shape-squircle`, 24px). Pills and circles (`shape-chip`, `shape-full`) stay round.
- Resting elevations: card 1, contained button 2, app bar 4, FAB and snackbar 6, bottom navigation and menu 8, drawer 16, dialog 24. Pressed states rise: contained button to 8, FAB to 12.

## Layout

- Spacing steps: `space-4`, `space-8`, `space-12`, `space-16`, `space-24`, `space-32`, `space-48`, `space-64`.
- Screen margins and gutters: 16dp on phones, 24dp on tablets and desktop.
- Touch targets are at least 48 × 48dp (`space-48`), even when the visible control is smaller.

## Motion

Motion values are not tokens here; use these:

- Standard easing `cubic-bezier(0.4, 0, 0.2, 1)` for movement within the screen; deceleration `cubic-bezier(0, 0, 0.2, 1)` for elements entering; acceleration `cubic-bezier(0.4, 0, 1, 1)` for elements leaving; sharp `cubic-bezier(0.4, 0, 0.6, 1)` for elements that may return.
- Durations: 100–150ms for small changes (selection controls, ripples), 200–250ms for entering and exiting components, up to 300ms for full-screen transitions on mobile.

## Iconography

Material Symbols, Outlined style, loaded as a variable ligature web font (`--font-icons`) and rendered with the `Icon` component (`name="favorite"`). Use only the Outlined style; do not mix in Rounded or Sharp symbols or the older Material Icons font.

- Names are the snake_case symbol names from the Material Symbols catalogue, Outlined style.
- Size: 24px by default, 18px inside buttons and chips, 36–48px for emphasis. The optical-size axis follows the size.
- Fill: outlined (`FILL` 0) at rest; the filled form (`fill`, `FILL` 1) marks the active or selected state of the same symbol, as on the current bottom-navigation item.
- Weight 400 (matching Regular body text) and grade 0; dark theme lowers grade to -25 so light strokes do not look heavier on dark surfaces.
- Colour icons with `text-medium` when inactive, `primary` when active, `text-disabled` when disabled; on fills use the matching `on-` token.

No logo ships with this system yet; set the name Quantum in plain type.

## Components

Components are React modules exported from `@arfct/quantum` and need React 18 or later: `Icon`, `Button`, `Fab`, `Card`, `TextField`, `Chip`, `Checkbox`, `Switch`, `BottomNavigation`, `Dialog`, `Snackbar`. `@arfct/quantum/quantum.css` loads Material Symbols Outlined and styles every component with the tokens; class names are prefixed `q-` (icon axes are the `--q-icon-*` custom properties).

- At most one contained Button per surface and one Fab per screen.
- Dialog actions and card actions are text Buttons.

## Accessibility

- `text-high` and `text-medium` meet 4.5:1 on `background` and every `surface-dpNN` in both themes; `primary` and `error` meet 4.5:1 as text on `surface` in both themes.
- Known gaps kept from the Classic Material Design spec: the outlined text field's rest border (`outline`, 2.7:1 on white); dark `error` on `filled-field` (4.2:1, an error label inside a dark filled field).
- Keyboard focus: the Material focus overlay (`state-focus`, 12%) plus a solid 2px `primary` outline offset 2px on `:focus-visible`. That outline is an addition to Classic Material Design, which relies on the overlay alone; it is 5.3:1 on `surface` in light theme and 10.3:1 in dark.
- Errors are stated in helper text, not only by colour. Selected chips set `aria-pressed`; switches use `role="switch"`; the active navigation item sets `aria-current`.
