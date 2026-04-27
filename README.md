# Big Keyboard

"Big Keyboard" (working title) is a dependency-free, single-page web app for accessible text entry with minimal precision requirements.

It's intended as a way to prototype different input methods to suit individual needs. I want to keep the barrier to entry as low as possible, and web pages work everywhere with only minor limitations. It can run on any OS on a low-spec laptop, PC, phone or tablet and all of these can attach a USB keyboard, mouse or anything that acts like a mouse, i.e. trackpad or trackball. 

In this project I am also evaluating Cursor for development, so this is almost entirely AI coded. 

## How it works

- **Keyboard mode (desktop)**: use arrow keys to move selection, press `Enter` to commit, `Backspace` to delete.
- **Touchscreen mode**: tap a key to commit immediately; `Delete` removes the last character.
  - On load in touch mode there is **no selected key** and **no preview cursor**.
- **Fullscreen keyboard/mouse/trackball/trackpad mode**: entering fullscreen enables pointer navigation:
  - move the pointer over a key to select it (cursor may be hidden)
  - click or press `Enter` to commit the selected key
  - scrolling is suppressed to keep the keyboard in view

## Controls

- **Clear**: clears all input text.
- **Full Screen**: toggles fullscreen (where supported).
- **Version**: shown on the top bar (currently `v0.1.0`).

## Accessibility Goals

- **No precise targeting:** controls are large, high-contrast, and few in number.
- **No timing pressure:** nothing requires a fast gesture or a hold duration.
- **Touch robustness:** pointer movement/dragging during press is ignored. No long press actions. 
- **Low cognitive load:** one selected character at a time with explicit commit.
- **Readable output:** text display uses large font for short, slow text entry.

## Development 

### Run

Open `index.html` in a browser.
