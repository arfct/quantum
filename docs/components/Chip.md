# Chip

Chips are compact elements for choices, filters, and actions. The consumer provides the label, optional leading `icon`, `selected` (for choice and filter chips), and `onClick`.

- 32px tall, `shape-chip` (16px) corners, `body2` label.
- Filter chips show a check when `selected`; set `filter={false}` for choice chips that keep their icon.
- Selected chips tint with `primary` at 12% and set `aria-pressed`.
- `outlined` uses a `divider` border instead of the filled container.
- Show chips in a set; a single chip on its own is usually a button.
