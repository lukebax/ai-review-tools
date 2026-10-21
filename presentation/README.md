# Navigating AI in Evidence Synthesis

A 20-slide HTML draft for a methods-focused workshop talk by Luke Baxter. The
16:9 slides use the companion map’s navy text, restrained blues and off-white
background. Every slide has a complete static state, shared with the PDF.

- [Open the presentation](https://lukebax.github.io/ai-review-tools/presentation/)
- [Download the checked PDF](https://lukebax.github.io/ai-review-tools/presentation/navigating-ai-evidence-synthesis.pdf)
- [Explore the companion map](https://lukebax.github.io/ai-review-tools/map/)

## Open and navigate

Open `index.html` in a modern browser, keeping `assets/` beside it. All required
assets and Reveal.js 6.0.2 are bundled; no internet or installation is needed to
view the local deck. Source and companion-site links require internet.

Left/right arrows move through the slides; Space advances. Home and End jump to
the first and last slides. Move the pointer to reveal navigation arrows and the
toolbar. **Full screen** or F enters full screen when supported; Esc exits it or
opens the slide overview. There are no tabs, hidden builds or live-map dependencies.

For HTTP preview, run `python3 preview.py` from the repository root and open the
printed Presentation URL. The server binds only to this computer; Ctrl+C stops it.

## Save a PDF

**Download PDF** saves the checked, 20-page counterpart with selectable text and
vector diagrams. The file is also linked above and bundled alongside the HTML.
When opened directly from disk, the toolbar instead offers **Open PDF** in a
separate tab; save it from the PDF viewer if needed. Its pages are 960 × 540 points (16:9). It is regenerated after slide changes;
the button downloads that export rather than generating a new version in-browser.

To regenerate using Chrome, open `index.html?print-pdf` through the local preview
server, then Print → Save as PDF. Enable background graphics and disable browser
headers/footers; use no margins and landscape. The print stylesheet defines the
slide-sized pages. Verify 20 pages and inspect all rendered pages before replacing
`navigating-ai-evidence-synthesis.pdf`. A headless Chromium export can use
`preferCSSPageSize: true`, `printBackground: true`, after `window.presentationReady`, `window.printReady`,
`document.fonts.ready` and all images have loaded. Assert that `.pdf-page` contains
20 wrappers before export; Reveal initialization alone does not finish print layout.

## Files and maintenance

- `index.html`: the 20 slide sections, with stable `data-plan-slide` numbers.
- `assets/theme.css`: slide layouts and print styling, independent of the map.
- `assets/deck.js`: Reveal setup, keyboard navigation and full-screen controls.
- `assets/maps/`: vector excerpts derived from the maintained map data.
- `build_visuals.py`: regenerates those excerpts from `../map/map-data.json`,
  preserving actual recommendations, mixed-cell halves, blank cells and row order.
  Run `python3 presentation/build_visuals.py` from the repository root after a
  relevant approved data change. Run `python3 presentation/build_visuals.py --check` to verify the saved assets
  without writing files. The generator also checks cell assignments and colour fidelity.
- `assets/images/site-qr.svg`: QR code for the site home, also printed as a URL
  on the first and last slides.
- `assets/vendor/reveal/`: fixed upstream distribution and MIT licence.
- `navigating-ai-evidence-synthesis.pdf`: the checked distribution/fallback copy.
- `sample/`: the accepted four-page design sample retained as a visual reference.

Update the CSS/JS content-version query in `index.html` when changing those files
(first 12 SHA-256 characters), then regenerate and review the PDF. Check keyboard
navigation, full screen, offline assets, the PDF download and all changed views.
The deck is a draft for review; its content follows the approved talk. The script
and its preparation records stay in the separate private presentation workspace.

## Sources and scope

The talk and map draw on RAISE (Responsible use of AI in Evidence Synthesis), by
James Thomas, Kaitlyn Hair, Anna Noel-Storr and colleagues. The source baseline is
**RAISE 1 and 3 draft v4, 23 September 2026; RAISE 2 draft v4, 25 August 2026**,
with the accompanying v2 supplements. The five suitability questions retain
RAISE 3’s wording; the teaching examples and explanatory diagrams are adaptations.

[RAISE 1](https://osf.io/d5ajy), [RAISE 2](https://osf.io/y26pj),
[RAISE 3](https://osf.io/kd9q5), [official collection](https://doi.org/10.17605/OSF.IO/FWAUD).
Public source links may later resolve to newer revisions. Exact source/implementation
qualifications and further product evidence remain in the [map](../map/README.md).
See [source and licence notices](../THIRD_PARTY_NOTICES.md) for full attribution.

The matrix excerpts use the companion map data current at map release `4afa20f`:
56 tools, eight stages, 131 functions, 96 populated cells and 12 mixed cells.
Family/row highlights are neutral outlines, not changes to recommendations.
The screening queues, model diagrams and overlap example are illustrative;
they do not report measured performance or establish that a stopping procedure
is validated. Each numbered HTML view has an equivalent static PDF page.

Original software is MIT; original explanatory content and adapted RAISE material
are CC BY 4.0. Routine attribution is kept here and in the source notices rather
than repeated across the projected slides.
