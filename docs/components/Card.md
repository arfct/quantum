# Card

Cards hold content and actions about a single subject. The consumer provides `title`, optional `subtitle`, body `children`, optional `media` (true for a placeholder, or an image element) and `actions` (usually two text Buttons).

- Elevated by default: `surface-dp01` with `shadow-1`, `shape-medium` corners. `outlined` swaps the shadow for a `divider` border on `surface`.
- Title in `headline6`, subtitle in `subtitle2` at `text-medium`, body in `body2` at `text-medium`.
- 16px padding; actions sit in an 8px-padded row.
- Do not nest cards or put more than two primary actions in one.
