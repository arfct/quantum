# Squircle

`.rounded-squircle` draws a continuous-curvature corner (a squircle) with CSS `corner-shape`, and falls back to a plain rounded rect where the property is unsupported. Ported from arfct/squircle (a Tailwind v4 utility) as a plain class. The consumer provides an element at least 60px on its short side, a fill, and optionally `--squircle-radius`.

- Default radius is `shape-squircle`, 24px, the Quantum Paper corner. Override per element with `style="--squircle-radius: 16px"`; `26%` on a square gives a rounded-tile proportion.
- Where `corner-shape` is supported the radius is scaled by `squircle-scale` (1.24418) and shaped with `squircle-shape` (`superellipse(1.39)`); elsewhere the authored radius is used as a circular corner. At 24px the rendered radius is 29.9px.
- The components already use it with their own radius: buttons, text fields and snackbars at `shape-small`, cards and dialogs at `shape-medium`, the checkbox box at 2px. For your own rounded rectangles add the class and set `--squircle-radius` to the matching token, e.g. `style="--squircle-radius: var(--shape-medium)"`.
- Do not use it for pills and circles (chips, FABs, the switch, avatars cut as circles): a superellipse at a full radius is no longer a pill or a circle.
- A length radius such as 24px works on any proportion; a percentage radius belongs on squares only, because on a non-square box it gives elliptical corners.
- The scaled radius must fit half the short side: at 24px the element needs a short side of at least 60px; with a percentage, keep it at or below 40.2%. Past that the browser clamps and the corners stop matching.
- `corner-shape` clips the border box, not the content: add `overflow: clip` on the same element when it holds an image or children that reach the edge.
- In Tailwind v4 projects, import the original `squircle.css` instead to get `rounded-squircle-[18%]` and the keyword variants.
