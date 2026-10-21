# AI in evidence synthesis

Two independent browser tools, created and maintained by Luke Baxter:

- **[Interactive map](https://lukebax.github.io/ai-review-tools/map/)** — Navigating AI in
  Evidence Synthesis, a guide to RAISE’s recommendations. [Map instructions](map/README.md).
- **[Presentation](https://lukebax.github.io/ai-review-tools/presentation/)** —
  a 20-slide presentation, Navigating AI in Evidence Synthesis, with keyboard navigation
  and a [checked PDF](https://lukebax.github.io/ai-review-tools/presentation/navigating-ai-evidence-synthesis.pdf).
  [Presentation instructions](presentation/README.md).


The **[site home](https://lukebax.github.io/ai-review-tools/)** links to both components.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Small landing page linking to the map and presentation |
| `map/` | Complete map: data, template, build script, generated HTML and instructions |
| `presentation/` | Complete presentation: HTML, vector visuals, checked PDF, bundled dependencies and instructions |
| `preview.py` | Optional local preview server for the whole site |
| `AGENTS.md` | Maintenance rules |
| `LICENSE`, `CONTENT-LICENSE.md`, `THIRD_PARTY_NOTICES.md`, `LICENSES/` | Scoped licences and attribution |
| `.nojekyll` | Static GitHub Pages publishing without Jekyll processing |

Each component owns its assets and works independently. Neither depends on the private
presentation workspace. The map’s generated HTML is self-contained; the presentation’s
required files are bundled in its own folder. A fresh clone or source ZIP contains everything
needed to view both. A clone also includes Git history and the remote connection.

## Preview locally

Open root `index.html` in a modern browser and choose a component. You can also open
`map/index.html` or `presentation/index.html` directly. Keep the presentation’s assets with it.

For local HTTP preview, run from the repository root:

```sh
python3 preview.py
```

Open one of the printed URLs. The server binds only to this computer and does not publish
anything. Stop it with Ctrl+C. Python 3.9+ is required for the preview helper and map build;
viewing the HTML needs only a browser. Browsing and PDF download use bundled assets;
outgoing source links require internet. See the [PDF instructions](presentation/README.md#save-a-pdf).

## Edit

- **Map:** edit `map/map-data.json` or `map/map-template.html`, then run
  `python3 map/build.py` and `python3 map/build.py --check`. The generated output is
  `map/index.html`; do not edit it directly. See the [map guide](map/README.md).
- **Presentation:** edit its HTML, `assets/theme.css` and `assets/deck.js`. No build step
  is needed for the HTML. Regenerate derived map visuals when their data changes and
  regenerate/check the distributed PDF after slide edits. Bundled dependencies retain
  their fixed versions and original licence notices.
- **Landing page:** edit root `index.html`. It has no runtime dependencies.

Keep all required project files versioned. Keep private sources, temporary inspection files
and unrelated material out of this public repository. Use the operating system’s
temporary directory for disposable checks.

## Publish and verify

GitHub Pages is configured as **Deploy from a branch → main → /(root)**. It serves the
landing page at the site root and each component at `/map/` or `/presentation/`. These paths
are an organisational choice; the user permits changing URLs when that improves the layout.

For requested updates, edit locally, rebuild the map if relevant, check the affected pages,
then commit and push the complete change to `main`. Verify the Pages deployment and live
pages before handing them back for review. Explicit local-only instructions take precedence.
Committing without pushing does not publish. GitHub does not run the Python map build.

Verify the root links, map search/cell details/guidance, and presentation navigation/image/PDF
as relevant to the change. Keep source-specific checks in the component instructions.
See [GitHub’s publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Licences

- Original interface/build software and technical maintenance documentation:
  **[MIT](LICENSE)**, © 2026 Luke Baxter.
- Original explanatory text, annotations and curated map data:
  **[CC BY 4.0](CONTENT-LICENSE.md)**, including that content inside the map HTML.
- Upstream RAISE material retains its CC BY 4.0 terms and authorship. Bundled libraries and
  other third-party assets retain their respective terms; see [third-party notices](THIRD_PARTY_NOTICES.md).

Software and content licences remain distinct when bundled in one HTML file.
