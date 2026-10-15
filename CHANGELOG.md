# Changelog

All notable changes to `@arfct/quantum` are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

First release.

### Added

- Tokens from `tokens/tokens.json`: Classic Material Design colour roles for light and dark themes, with a blue primary (Tailwind `blue-600`; `blue-300` as text in dark, while filled buttons keep `blue-600` with white text through `primary-fill`), red floating action buttons (`fab`: `red-600` with a white icon in both themes) and a chartreuse accent (Lime A400 from the original Material Design palette), the Tailwind CSS v4.1 palette, spacing, radius, elevation shadows, state opacities, squircle corner settings and the thirteen-style type scale in the system UI font.
- Stylesheets: `quantum.css` (icon font, tokens and components), `tokens.css`, `components.css`, a Tailwind CSS v4 theme in `tailwind.css`, and `tokens.json`.
- React components: `Icon`, `Button`, `Fab`, `Card`, `TextField`, `Chip`, `Checkbox`, `Switch`, `BottomNavigation`, `Dialog` and `Snackbar`. Each forwards its ref and passes unnamed HTML attributes through to its underlying element.
- Continuous corners through CSS `corner-shape` on every component, and the arfct/squircle corner presets for other elements: `.rounded-continuous`, `.rounded-squircle` (a softer corner) and `.squircle-icon` (the 26% icon mask), also as Tailwind utilities in `tailwind.css`.
- Material Symbols Outlined icons, loaded as a web font.
- A modal `Dialog` moves focus into itself when it opens, closes on Escape, and returns focus when it closes.
- The brand book and per-component guidelines in `docs/`.
