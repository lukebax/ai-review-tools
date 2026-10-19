# HTML presentation prototype

Four test slides explore one accepted visual direction: the map’s navy text,
soft blues, off-white background and system font, on a fixed 1280 × 720 (16:9)
canvas. This is a format experiment, not a draft of the evidence-synthesis talk.

[Open the published prototype](https://lukebax.github.io/ai-review-tools/presentation/).

## Open locally

Open `index.html` in Chrome or another modern browser. Keep the `assets/` folder
beside it. Reveal.js 6.0.2, the styles, code and photograph are bundled: basic
viewing and interaction need no internet, installation or build step.

For a local HTTP preview, run from the repository root:

```sh
python3 preview.py
```

Open the printed Presentation URL. The server binds only to this computer.
Ctrl+C stops it. The printed map URL serves the unchanged map at `/map/`.

## Try it

- Left/right arrows move through the four slides. Space also advances.
- Move the pointer to bring the navigation arrows and toolbar into view.
- The Full screen button appears when supported; F is also a Reveal.js shortcut.
- Esc opens the slide overview (or exits full screen first).
- Slide 3 has three tabs: click one, or Tab to the tab row and use left/right.
  While a tab has focus, arrows change that tab rather than the slide. Tab away
  before using slide navigation again.

## Save a PDF

Choose **Export PDF**, then **Download PDF**. This saves four 16:9 pages directly
on your computer. Each page is a high-resolution slide image, so its text is not
separately selectable. All three tab explanations appear on slide 3.

For selectable text, use the alternative **Print / Save PDF** button in Chrome.
Choose Save as PDF, landscape, no margins, background graphics on and browser
headers/footers off. Some embedded browser previews cannot expose that print
window; the direct Download PDF route avoids it.

**Back to slides** returns to the deck. Export is static and entirely local;
nothing is uploaded. html2canvas 1.4.1 and jsPDF 4.2.1 are bundled with their MIT
licences under assets/vendor/ for direct export.

## Files and scope

- `index.html`: test slide content; do not put real talk content here by default.
- `assets/theme.css`: map-derived presentation styling, independent of the map.
- `assets/deck.js`: Reveal setup, tab demo and export controls. Its script URL carries
  a content-version query so browsers load the released code. When changing this file,
  update the query in `index.html` to the first 12 characters of its SHA-256 hash.
- `assets/vendor/reveal/`: fixed upstream version and original MIT licence.
- `assets/images/earth.jpg`: NASA Apollo 17 image; see `assets/IMAGE-CREDIT.md`.
- `../preview.py`: shared optional Python 3.9+ local preview helper.

Current status: approved for publication as a format prototype. The map lives separately
at `map/index.html` and `/map/`; the root landing page links to both components.
Further development of real talk content requires a separate instruction.
