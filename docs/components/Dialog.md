# Dialog

Dialogs interrupt to ask for a decision or show critical information. The consumer provides `title`, body `children`, `actions` (text Buttons, dismissive first, confirming last), `open`, and `onClose`. `contained` renders it in flow, for documentation and previews.

- 280–560px wide on `surface-dp24` with `shadow-24`, `shape-medium` corners, over a `scrim`.
- Title in `headline6`; body in `body1` at `text-medium`; 24px side padding.
- Use `role="alertdialog"` for confirmations that block work. Write the title as a question and the actions as verbs ("Discard", not "OK").
