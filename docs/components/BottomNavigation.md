# BottomNavigation

Bottom navigation switches between three to five top-level destinations on mobile. The consumer provides `items` (`{icon, label}`), and `value` with `onChange` (or `defaultValue`).

- 56px tall on `surface-dp08` with `shadow-8`, square corners (`shape-none`).
- Active item: `primary` icon and a 14px label, `aria-current="page"`. Inactive: `text-medium` with 12px labels.
- Always show labels. Not for two destinations (use tabs) or more than five (use a navigation drawer).
