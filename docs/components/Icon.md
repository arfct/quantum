# Icon

Renders a Material Symbols Outlined glyph by ligature name (`name="favorite"`). The consumer provides the symbol name (snake_case, as listed under the Outlined style in the Material Symbols catalogue) and an accessible label on the surrounding control; the icon itself is `aria-hidden`.

- Outlined (`fill` off) is the default. Set `fill` for the active or selected state of the same symbol: the current bottom-navigation item, a toggled favourite. Do not mix filled and outlined icons as unrelated decoration.
- Sizes: 24px default; 18px inside buttons and chips (optical size 20); 36, 40 and 48 for emphasis. `size` also sets the optical-size axis.
- Weight 400 matches Regular body text. Use `weight={500}` beside Medium labels only when the icon looks light next to them; never below 300.
- Grade is 0 in light theme and -25 in dark theme (set by the stylesheet), which offsets the glow of light-on-dark strokes.
- Colour comes from CSS `color`: `text-medium` for inactive icons, `primary` for active ones, `text-disabled` when disabled.
- Do not use an icon alone to convey meaning in body text; pair it with a label.
