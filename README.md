# Accessible Character Input Prototype

This is a small, dependency-free web prototype for users who cannot reliably use a standard keyboard or precise pointer movement.

## Key Interaction Model

- Move through characters one step at a time with `Previous` and `Next`.
- Press `Commit Character` to add the currently selected character.
- `Commit Space`, `Delete Last`, and `Clear All` are explicit actions.
- Every action is tap/release based. Drag motions do not trigger actions.
- There are no time limits or long-press requirements.

## Why This Fits The Accessibility Goal

- **No precise targeting:** controls are large, high-contrast, and few in number.
- **No timing pressure:** nothing requires a fast gesture or a hold duration.
- **Touch robustness:** pointer movement during press is treated as a drag and ignored.
- **Low cognitive load:** one selected character at a time with explicit commit.
- **Readable output:** text display uses large font for short, slow text entry.

## Run

Open `index.html` in a browser.
