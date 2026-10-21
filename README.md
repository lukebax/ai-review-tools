# AI in evidence synthesis

Two independent browser tools, created and maintained by Luke Baxter:

- **[Interactive map](https://lukebax.github.io/ai-review-tools/map/)** — Navigating AI in
  Evidence Synthesis, a guide to RAISE’s recommendations. [Map instructions](map/README.md).
- **[Presentation](https://lukebax.github.io/ai-review-tools/presentation/)** —
  a 20-slide presentation, Navigating AI in Evidence Synthesis, with presenter notes, keyboard navigation
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
| `.github/workflows/pages.yml` | Required PDF build/check and combined Pages publication |
| `package.json`, `package-lock.json` | Fixed development-only export dependencies |
| `.nojekyll` | Serve the built site without Jekyll processing |

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
  run `npm run build:pdf` and `npm run check` after slide edits. Publication repeats the
  PDF export automatically. Bundled dependencies retain
  their fixed versions and original licence notices.
- **Landing page:** edit root `index.html`. It has no runtime dependencies.

Keep all required project files versioned. Keep private sources, temporary inspection files
and unrelated material out of this public repository. Use the operating system’s
temporary directory for disposable checks.

## Publish and verify

GitHub Pages uses **GitHub Actions**, through `.github/workflows/pages.yml`. Every push
to `main` exports a fresh presentation PDF, verifies alignment, and publishes the checked
HTML and PDF in one site artifact. A failed build does not replace the live site. The
workflow can also be run manually from Actions; direct branch publishing is disabled.

For requested updates, edit locally, rebuild/check the affected components, then commit
and push to `main`. The workflow saves generated PDF/cache-version/manifest changes back
to Git before deployment, if needed. Once it succeeds, run `git pull --ff-only` to keep the
local copy aligned, and verify the live pages. Do not force-push or rebase generated output
onto different HTML. An explicit local-only request takes precedence over publication.

The root, `/map/` and `/presentation/` URLs are unchanged. The map remains independent of
presentation dependencies at viewing time; the workflow checks its generated HTML and
map excerpts before publication. Source and asset files are fully backed by this repository.
A fresh clone contains the saved PDF, so no build is needed merely to view/download it.

See [presentation maintenance](presentation/README.md) for checks and
[GitHub's workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Licences

- Original interface/build software and technical maintenance documentation:
  **[MIT](LICENSE)**, © 2026 Luke Baxter.
- Original explanatory text, annotations and curated map data:
  **[CC BY 4.0](CONTENT-LICENSE.md)**, including that content inside the map HTML.
- Upstream RAISE material retains its CC BY 4.0 terms and authorship. Bundled libraries and
  other third-party assets retain their respective terms; see [third-party notices](THIRD_PARTY_NOTICES.md).

Software and content licences remain distinct when bundled in one HTML file.
