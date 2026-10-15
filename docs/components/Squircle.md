# Squircle

Three corner presets, ported from arfct/squircle as plain classes. Each draws its corner with CSS `corner-shape` and falls back to a plain rounded rect where the property is unsupported. The consumer provides an element, a fill, and optionally `--squircle-radius`.

| Class | Corner | Where `corner-shape` is supported |
| --- | --- | --- |
| `.rounded-continuous` | The continuous corner every component uses | radius × `squircle-scale` (1.24418), `corner-shape: squircle-shape` (`superellipse(1.39)`) |
| `.rounded-squircle` | A longer, softer corner | radius × 2, `corner-shape: squircle` |
| `.squircle-icon` | The icon mask: a fixed 26% of the side, for square images and tiles | 26% × `squircle-scale`, `corner-shape: squircle-shape` |

- `.rounded-continuous` and `.rounded-squircle` default to `shape-squircle`, 24px. Override per element with `style="--squircle-radius: var(--shape-medium)"`, using the radius token that matches the element.
- Use `.rounded-continuous` for rounded rectangles that sit beside components, so their corners match. Use `.rounded-squircle` only where a softer corner is wanted on its own, such as a large tile or a media frame.
- The components already use the continuous corner with their own radius: buttons, text fields and snackbars at `shape-small`, cards and dialogs at `shape-medium`, the checkbox box at 2px.
- Do not use any of them for pills and circles (chips, FABs, the switch, avatars cut as circles): a superellipse at a full radius is no longer a pill or a circle.
- The scaled radius must fit half the short side. At 24px, `.rounded-continuous` needs a short side of at least 60px and `.rounded-squircle` at least 96px. With a percentage, keep `.rounded-continuous` at or below 40.2% and `.rounded-squircle` at or below 25%. Past that the browser clamps the radius.
- A length radius works on any proportion; a percentage radius gives elliptical corners on a non-square box, so keep `.squircle-icon` and percentage radii on squares.
- `corner-shape` clips the border box, not the content: add `overflow: clip` on the same element when it holds an image or children that reach the edge.
- With `@arfct/quantum/tailwind.css`, the same presets are utilities: `rounded-continuous-<value>`, `rounded-squircle-<value>` and `squircle-icon`. The value is a theme radius (`rounded-continuous-medium`), a length or a percentage (`rounded-squircle-[20px]`).
