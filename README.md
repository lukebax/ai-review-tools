# Navigating AI in Evidence Synthesis

An interactive map and accompanying presentation by **Dr Luke Baxter**, exploring AI tools
across the systematic-review workflow and the conditions for using them responsibly.

- **[Interactive map](https://lukebax.github.io/ai-review-tools/map/)** — tools, tasks and
  use recommendations, with filters, cell details and explanatory guidance.
- **[Presentation](https://lukebax.github.io/ai-review-tools/presentation/)** — 22 slides
  with keyboard navigation, presenter view and a
  [matching PDF](https://lukebax.github.io/ai-review-tools/presentation/navigating-ai-evidence-synthesis.pdf).

The **[site home](https://lukebax.github.io/ai-review-tools/)** links to both components.

The map is an independent adaptation of **RAISE 3 Table 2**, with supporting explanations
from the wider RAISE guidance. The source baseline is **RAISE v4**; exact versions,
adaptations and licences are described in the [map guide](map/README.md) and
[source notices](THIRD_PARTY_NOTICES.md). Recommendations concern particular uses, not
blanket approval of a product.

## View locally

Download the repository ZIP or clone it, keep the folders together, and open `index.html`
in a modern browser. No build or internet connection is needed to view the map,
audience slides or saved PDF. Outgoing links require internet access.

For presenter view and local HTTP preview, run from the repository root:

```sh
python3 preview.py
```

Open one of the printed URLs. The server runs only on your computer; stop it with Ctrl+C.
See the [map instructions](map/README.md) and [presentation instructions](presentation/README.md)
for navigation, filtering and PDF use.

## Repository structure

| Path | Purpose |
|---|---|
| `index.html` | Landing page linking to the map and presentation |
| `map/` | Editable data/template, generated standalone HTML and map tests |
| `presentation/` | Slides, bundled assets, checked PDF, export tools and tests |
| `preview.py` | Optional local preview server; Python 3.9+ |
| `package.json`, `package-lock.json` | Fixed development dependencies for checks and PDF export |
| `.github/workflows/pages.yml` | Build, verify and publish HTML and PDF together |
| `AGENTS.md` | Maintenance rules |
| `LICENSE`, `CONTENT-LICENSE.md`, `THIRD_PARTY_NOTICES.md`, `LICENSES/` | Licences and attribution |

All viewing assets and build inputs are versioned here. The Delivery Script, Word review
copy and original source library stay in the separate private presentation workspace;
they are not public-site dependencies. Presenter view contains slide previews, a timer
and navigation, without the private script.

## Maintain and publish

Edit the source files described in each component's README. After changing map data,
regenerate both the standalone map and its explanatory slide excerpts:

```sh
python3 map/build.py
python3 presentation/build_visuals.py
```

With the [presentation development dependencies](presentation/README.md#edit-and-check)
installed, finish an update with:

```sh
npm run build:pdf
npm run check
npm test
```

Review affected browser views and PDF pages, then commit and push to `main`. GitHub Actions
refreshes the map captures, generates the PDF from the same slides and assets, checks
alignment, and publishes the checked site. A failed check leaves the previous site live.
The workflow saves generated files back to Git; after it succeeds, run `git pull --ff-only`
and verify Pages. Keep build outputs together with the sources that produced them.

## Licences

- Original software and maintenance documentation: **[MIT](LICENSE)**.
- Original explanatory content and curated map data: **[CC BY 4.0](CONTENT-LICENSE.md)**.
- RAISE material, bundled libraries and third-party assets retain their own attribution
  and terms; see [source and licence notices](THIRD_PARTY_NOTICES.md).
