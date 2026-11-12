---
title: Quantum
date: 2026-10
status: beta
category: system
tags: [web, design]
url: https://github.com/arfct/quantum
links:
  source: https://github.com/arfct/quantum
media:
  - src: gallery.png
    caption: The top of the example gallery in the light theme, with the icons, the blue buttons and the red floating action buttons
    alt: A white page headed Quantum with two rows of outlined and filled icons, a row of blue buttons, three red round and pill-shaped buttons and the top of a card
  - src: gallery-dark.png
    caption: Text fields, chips, checkboxes and switches in the dark theme, where the lime accent marks what is switched on
    alt: A near-black page with three text fields, four chips, a row of checkboxes and a row of switches, the checked box and the on switch in bright lime
  - src: euclid-explorer.png
    caption: The Euclid palette in its explorer page, each family a row from step 050 to 950, with stars at Byrne's red, yellow and blue
    alt: A grid of color swatches, one hue per row from red through purple and nineteen steps from pale to dark, with small dots and stars on some swatches and one blue swatch enlarged
unconfirmed: [date, status]
---

Quantum, Artifact's design system, is named after Quantum Paper, the original codename of Material Design. From Classic Material Design it keeps the color roles, elevation and 8dp grid, with a blue primary, red floating action buttons and a lime accent taken from the original Material palette. It departs from Material in four places: text is set in the platform's system UI font, icons are Material Symbols Outlined, the Tailwind CSS palette ships as tokens, and rounded rectangles take their corners from Squircle.

The package holds the tokens as CSS custom properties in a light theme and a dark one, a Tailwind CSS v4 theme and eleven React components, which the first two images show in the repository's example gallery. A brand book and a guideline for each component are kept beside them.

The third image is from the tools for Euclid, a revision of the palette that stays apart from the tokens until it is settled. Euclid is derived in OKLCH from one spec file, on a single lightness ladder shared by every color family, so that APCA contrast is uniform across a row, and its red, amber and sky ramps are made to pass through Byrne's red, yellow and blue. An explorer page sets the Tailwind and Euclid palettes side by side with the contrast of each step. Quantum is at version 0.1.0, which has not been published to npm.

TypeScript, React, CSS. 2026.
