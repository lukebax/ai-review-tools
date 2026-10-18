# AI tools across review stages

An independent interactive guide to named tool uses and recommendations in
**RAISE 3 draft v4.0 (23 September 2026)**. Created and maintained by Luke Baxter.
It contains 56 named tools/features/resources across eight review stages, with
133 function records in 98 populated cells. Twelve cells have two recommendations.
InfraNodus has a separate explanation outside the eight-stage map.

## View the map

Open **[index.html](index.html)** in Chrome or another modern browser. It contains
the data, styling and interaction code. No installation, server or internet
connection is required to explore the map; outgoing source/tool links require internet.

Select a cell to read its full function-specific explanations. Recommendation
filters match either category in mixed cells and preserve both colours. Balanced
is the default palette; the optional colour-blind-friendly switch selects ColorBrewer
RdYlBu. Empty cells remain white. Use arrow keys in the map, Enter/Space to open
details and Escape to close them. The layout is optimised for desktop; narrow views
can scroll the map horizontally.

## Edit and rebuild

Requirements for editing: **Python 3.9 or newer**, with no third-party packages.
The generated HTML itself needs only a browser.

1. Edit `map-data.json` for the public tool/function content and recommendation definitions.
2. Edit `map-template.html` for the layout, styles and interaction code.
3. Run `python3 build.py` from this directory to validate the data and regenerate `index.html`.
4. Open the HTML and check the change. Run `python3 build.py --check` to verify the
   finished HTML matches the sources without changing any files.
5. Commit the changed sources and regenerated HTML together when ready.

The script also works when called by its path from another directory. It reads
only this project's data/template and writes only this project's `index.html`.
It does not download anything or need a separate workspace. Do not edit the
generated HTML directly. The build rejects cells containing more than two
recommendation categories: review the display convention before adding such a case.

## Project files and recovery

| Files | Purpose |
|---|---|
| `index.html` | Complete map ready to open or serve |
| `map-data.json`, `map-template.html`, `build.py` | Editable sources and standard-library build |
| `README.md`, `AGENTS.md` | Use, maintenance and contribution guidance |
| `LICENSE`, `CONTENT-LICENSE.md`, `THIRD_PARTY_NOTICES.md`, `LICENSES/` | Scoped licences and source acknowledgements |
| `.nojekyll` | Disable Jekyll processing for a future static Pages deployment |

All required project files are versioned. There are no private/local-only source
dependencies, downloaded PDF libraries or ignored project files. Temporary inspection
files should be kept outside the project.

A fresh clone or source ZIP contains the complete map and editable sources. Rebuild
with `python3 build.py` and check with `python3 build.py --check`. A clone also has
Git history and a remote connection; a ZIP contains only the files. Viewing requires
neither Python nor Git.

## Guidance and interpretation

The sources were checked on 18 October 2026. Use the exact RAISE versions and
qualifications described in the map and [source notices](THIRD_PARTY_NOTICES.md).
RAISE recommendations apply to specified functions and workflows, not whole products.
White cells mean no listed use within this map's scope. Diagonal halves distinguish
recommendations for different functions/workflows, not proportions or certainty.

This map paraphrases and reorganises the guidance, combines display categories,
and identifies editorial interpretation. Google Translate and DeepL appear in five
derived translation-support stages and retain their broader source technology label
in their details. “Writing a manuscript” covers drafting, revisions and plain-language
summaries. End-to-end review workflows and chatbot interaction are explained outside
the matrix. The guide is not an official RAISE publication or a live product catalogue.
Check new guidance versions and the intended review procedure before relying on a
recommendation. Official documentation explains features; it does not prove validation.

## Optional GitHub Pages publication

For a future authorised publication, use a public repository's **Settings → Pages →
Deploy from a branch → main → /(root)**. The finished `index.html` is the website.
The Python script is for local editing; this setup does not run it on GitHub.

After editing sources, regenerate and inspect the HTML, then commit and push the
updated files to the publishing branch. Pages automatically deploys that branch;
the public URL updates after a successful deployment. Pushing source changes without
regenerating `index.html` does not update the displayed map. Local commits alone do
not publish anything. See [GitHub's Pages instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Licences

- Original interface/build software and technical maintenance documentation:
  **[MIT](LICENSE)**, © 2026 Luke Baxter.
- Original explanatory text, annotations and curated map data:
  **[CC BY 4.0](CONTENT-LICENSE.md)**, including that content inside the HTML.
- Upstream RAISE material retains its CC BY 4.0 terms and authorship. ColorBrewer
  material retains its notices and Apache 2.0 terms. See [third-party notices](THIRD_PARTY_NOTICES.md).

These scopes remain separate when software and content are bundled together.
