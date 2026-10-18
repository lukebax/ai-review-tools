# Working on ai-review-tools

Read README.md before editing. This repository is a standalone static map with
public source data, not a place for private source libraries or unrelated files.

- Edit map-data.json and map-template.html; regenerate index.html using python3 build.py.
- Keep all required project files versioned. Do not add hidden/private dependencies
  or blanket ignore rules. Use an operating-system temporary directory for inspection output.
- Preserve the precise RAISE source version, task-specific recommendations, identified
  interpretations and attribution. Inspect successor guidance before changing the source baseline.
- Keep the eight-stage scope and separate outside-stage explanations unless the maintainer
  authorises a scope change. A new third recommendation within one cell requires a reviewed
  visual convention; do not silently omit it or choose one category.
- Balanced is the fresh-load default. Any palette change must update cells, diagonal halves,
  key and detail panels consistently. Keep textual recommendations and keyboard access.
- Use python3 build.py --check, then browser-test affected interactions. Keep local viewing
  self-contained: no runtime network dependency, server requirement or external workspace paths.
- Preserve the MIT software / CC BY 4.0 content distinction and third-party notices, including
  notices embedded in the distributable HTML.
- Do not publish, push, enable Pages or change repository visibility without explicit maintainer
  authorisation. A request to prepare or test locally does not authorise publication.
