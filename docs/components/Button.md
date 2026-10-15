# Button

Buttons trigger an action; choose the variant by emphasis. The consumer provides the label (a verb, rendered in caps by the `button` style), an optional leading `icon`, and `onClick`.

- **contained** — high emphasis, `primary-fill` (saturated blue in both themes) with `on-primary-fill` (white) text, `shadow-2` rising to `shadow-8` when pressed. One per surface, for the primary action.
- **outlined** — medium emphasis, `divider` border, `primary` label.
- **text** (default) — low emphasis: dialog and card actions, snackbars.
- 36px tall, `shape-small` corners, 64px minimum width. Keep a 48px touch target around it.
- Disabled buttons drop to `text-disabled` and `disabled-fill`; do not hide the reason, explain nearby.
