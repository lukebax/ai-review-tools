# Evidence-synthesis presentation: design sample

Four representative slides from the approved talk, for reviewing styling and
readability. This is a sample, not the complete 20-view deck.

[Open the sample](https://lukebax.github.io/ai-review-tools/presentation/sample/)
or [download the four-page PDF](https://lukebax.github.io/ai-review-tools/presentation/sample/sample.pdf).

## What is included

| Sample page | Approved visual-plan view | Purpose |
|---|---|---|
| 1 | 4 | Rule-based and unsupervised methods: paired diagrams |
| 2 | 7 | Whole-map overview with four families and eight stages |
| 3 | 14 | Google Translate / Gemini screening-task comparison |
| 4 | 19 | Exact RAISE suitability questions 4–5 and concise applications |

This sample preserves the approved spoken content. It neither adds a live demo
nor changes the map. All teaching content is visible on each static page.

## View and download

Open `index.html` in a modern browser, retaining the complete `presentation/`
directory. Left/right arrows and the on-screen arrows move between slides;
Home returns to the first slide, and Esc opens the overview. Full screen is
available where the browser supports it. The toolbar appears on pointer movement
or keyboard focus. No internet is needed for viewing or the bundled PDF.
External source links require a connection. Direct local-file viewing offers **Open PDF**
in a separate tab; HTTP/Pages offers **Download PDF**.

The **Download PDF** button retrieves the checked `sample.pdf` alongside the HTML.
It contains the same four 16:9 views, with selectable text and vector graphics.
This is a generated counterpart of the HTML, not a separately edited document.
For a fresh PDF after edits, open `index.html?print-pdf` in Chrome, print/save as
PDF with backgrounds, no margins and no browser headers/footers, and replace
`sample.pdf`. For automated export, await `window.sampleReady`, `window.printReady`,
`document.fonts.ready` and loaded images, and assert four `.pdf-page` wrappers.
Check all four rendered pages before publishing an update.

The root `python3 preview.py` server also serves this directory. Append `sample/`
to the Presentation URL it prints; the server chooses a free local port.
The complete 20-slide draft is at [the presentation URL](https://lukebax.github.io/ai-review-tools/presentation/).

## Maintain

- `index.html` contains the four sample slides.
- `assets/sample.css` and `assets/sample.js` supply the sample's style and
  Reveal setup. Update their version queries in the HTML when changing them.
- `assets/map-overview.svg` is generated from the maintained map data by
  `python3 presentation/sample/build_map.py` from the repository root.
  The script also works from other directories. It needs only Python's standard
  library. It preserves tool/stage order, all cell assignments, blank cells and
  mixed-cell halves. Individual tool names are intentionally omitted visually
  from the overview; the companion map provides them. The screening comparison
  labels its selected tools directly.
- `sample.pdf` must be regenerated and checked after any visible change.
- Reveal.js is reused from `../assets/vendor/reveal/`; no new runtime dependency
  is introduced. Its upstream MIT licence is bundled there.

No private source files, absolute workstation paths, or network-loaded fonts
are required. The map component itself does not depend on this sample.

## Sources and attribution

Routine provenance stays here and in preparation notes. Do not add repeated
RAISE source labels, paper links, page references or origin reminders to the
visible slides. The full talk introduces RAISE in its relevant content.

Adapted from the RAISE guidance by James Thomas, Kaitlyn Hair, Anna Noel-Storr
and colleagues, under CC BY 4.0. See the [full project notices](../../THIRD_PARTY_NOTICES.md)
for authorship and licences. Original software is MIT; original explanatory
content is CC BY 4.0.

- Family explanations: RAISE 2 v4 (25 August 2026) and RAISE 3 v4
  (23 September 2026).
- Matrix and task recommendations: the maintained RAISE-based map, including its
  disclosed interpretations and translation-support placements. The sample
  uses the Balanced palette. White means no mapped use, not prohibition.
- Suitability questions: RAISE 3 v4, Section 3, p24. The question wording is
  unchanged. The short applications are explanatory adaptations for prioritised
  screening with early stopping.

[Official RAISE collection](https://doi.org/10.17605/OSF.IO/FWAUD).
These are draft guidance versions, not a claim to cover every later revision.

Use `python3 presentation/sample/build_map.py --check` from the repository root to
verify the saved map visual without modifying it.
