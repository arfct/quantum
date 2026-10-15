# Snackbar

Snackbars report the result of an action at the bottom of the screen, one at a time. The consumer provides `message`, an optional single `action` with `onAction`, and `open`.

- `snackbar-surface` with `on-snackbar` text in `body2`; the action uses `snackbar-action`. `shape-small` corners, `shadow-6`.
- 344px minimum width, 48px minimum height. Dismiss after 4–10 seconds; do not auto-dismiss if it holds the only way to undo.
- One line of text where possible; no icons; never for critical errors (use a dialog).
