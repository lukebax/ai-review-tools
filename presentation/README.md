# Navigating AI in Evidence Synthesis

A 21-slide HTML presentation for a methods-focused workshop talk by Luke Baxter. The
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

The content is organised into four parts, shown by a small footer label: **Foundations**
(slides 2–8), **Mapping the landscape** (9–13), **Why recommendations differ between uses**
(14–17), and **Assessing suitability for your review** (18–20). Opening and closing remain
outside those parts. One bottom-right counter numbers all 21 slides in both HTML and PDF.

For HTTP preview, run `python3 preview.py` from the repository root and open the
printed Presentation URL. The server binds only to this computer; Ctrl+C stops it.

## Presenter notes

Choose **Presenter notes** in the toolbar, or press **S**, to open a separate presenter
window. It shows the current and next slides, a timer and the exact approved script
passage for the current slide. No written pointing cues are included.
Use the window's **Layout** menu to change the arrangement; the first opening uses Wide,
with slide previews above the notes. Longer passages scroll, and each new slide starts
at the beginning of its notes. Arrow keys in either window advance the presentation.

Keep this window on the laptop and the audience window on the projector using extended
displays, or share only the audience window in a video call. The audience slides and
downloaded PDF contain no notes. Notes embedded in this public website are accessible
to anyone who opens Speaker View; they are not confidential.

Speaker View works on Pages and through `python3 preview.py` locally, including without
internet access. Opening the HTML directly from disk still shows the audience deck, but
the notes button explains how to use Pages or the local preview server. Allow pop-ups
for this site if the presenter window does not open.

The approved Delivery Script remains the spoken authority. Derive its passages using
the accepted visual-plan boundaries, without hand-editing a second copy of the speech:

```sh
python3 presentation/sync_notes.py /path/to/delivery-script.md
python3 presentation/sync_notes.py /path/to/delivery-script.md --check
npm run build:pdf
npm run check
```

Run these from the repository root. The source script is needed only when updating or
checking notes against that authority; viewing and publication use the bundled notes.
The exporter checks each slide's approved passage fingerprint and their combined order,
requires notes to stay hidden on screen and in print, and checks that speech does not
leak into the PDF. Changes to script structure require a reviewed boundary update.

## Save a PDF

**Download PDF** saves the checked counterpart of the published slides, with selectable
slide text, vector diagrams and high-resolution captures of the actual map. Each slide becomes one 16:9 PDF page. When opened directly
from disk, the toolbar offers **Open PDF** instead; save from the PDF viewer if needed.
The button downloads an already generated file, with a versioned URL to avoid stale caching.

Every publication to Pages refreshes the actual-map captures, then exports the PDF from the same HTML and assets,
checks it, saves the generated files in Git, then publishes both formats together. A failed
export/check stops publication and leaves the previous published site in place. A source
change during the build stops that run; generated files are never rebased onto newer slides.
Downloaded files and already-open browser tabs remain snapshots; reopen/download after updates.

For local editing, use Node.js 24+ and the committed dependency lockfile:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run build:pdf
npm run check
npm test
```

The builder waits for fonts, images and Reveal's print-ready event. It checks slide/page
counts, actual-order footer numbering, part labels, 16:9 dimensions, slide text on each PDF page, missing resources, overflow and
screen/print geometry. `--check` rejects any changed HTML, asset, export code/dependency
or PDF that no longer matches `pdf-build.json`. The tests deliberately introduce stale
sources, a damaged PDF, missing images and print-only hidden graphics to test those gates.

Publishing uses macOS 15 and pinned Chromium to retain the current system-font styling.
The website itself still needs only a browser; these are development dependencies.
Substantive visual edits still need visual review and rehearsal—the automated checks
prevent version drift and common export defects, not every possible design problem.

## Files and maintenance

- `index.html`: the 21 slide sections, with current `data-plan-slide` numbers.
- `slide_structure.mjs`: agreed part boundaries and automatic footer labels/numbering; the PDF builder regenerates them from actual slide order, including footers with a link.
- `assets/theme.css`: slide layouts and print styling, independent of the map.
- `assets/deck.js`: Reveal setup, navigation, full-screen and presenter-window controls.
- `sync_notes.py`: derives exact current script passages for all 21 slides.
- `assets/maps/`: four actual-map PNG captures, their source manifest and two explanatory SVG excerpts.
- `capture_maps.mjs`: captures the maintained map with all or selected AI categories, including
  native tool labels, all eight stages and the recommendation key. `npm run build:map-images`
  refreshes the captures; `npm run build:pdf` runs it automatically. Its `--check` verifies
  source/capture fingerprints. The capture step also checks tool order and cell recommendations.
- `build_visuals.py`: regenerates the screening comparison and stage-pattern excerpts from `../map/map-data.json`,
  preserving actual recommendations, mixed-cell halves, blank cells and row order.
  Run `python3 presentation/build_visuals.py` from the repository root after a
  relevant approved data change. Run `python3 presentation/build_visuals.py --check` to verify the saved assets
  without writing files. The generator also checks cell assignments and colour fidelity.
- `assets/images/site-qr.svg`: QR code for the site home, also printed as a URL
  on the first and last slides.
- `assets/vendor/reveal/`: fixed upstream distribution and MIT licence.
- `navigating-ai-evidence-synthesis.pdf`: the checked distribution/fallback copy.
- `build_pdf.mjs` and `build_pdf.test.mjs`: export, alignment checks and regression tests.
- `pdf-build.json`: compact fingerprints connecting the checked PDF to its exact inputs.

The PDF builder updates slide footers and asset/PDF cache versions automatically. After editing, run
`npm run build:pdf` and review the changed views. Push the source changes to `main`; the
Pages workflow repeats the export/checks and commits generated outputs if they differ.
After it succeeds, run `git pull --ff-only` to receive that generated commit locally.
The content follows the approved talk. The canonical Delivery Script
and its preparation records stay in the separate private presentation workspace; its
approved spoken passages are also included in the public presenter notes.

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

The map captures and excerpts follow the maintained companion map:
56 tools, eight stages, 131 functions, 96 populated cells and 12 mixed cells.
The complete overview preserves all tool names; reading each name at projection distance
is not required for the talk. The filtered views retain the map’s native proportions.
Family/row highlights are neutral outlines, not changes to recommendations.
The screening queues, model diagrams and overlap example are illustrative;
they do not report measured performance or establish that a stopping procedure
is validated. Each numbered HTML view has an equivalent static PDF page.

Original software is MIT; original explanatory content and adapted RAISE material
are CC BY 4.0. Routine attribution is kept here and in the source notices rather
than repeated across the projected slides.
