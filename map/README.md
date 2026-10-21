# Navigating AI in Evidence Synthesis

An independent interactive guide to RAISE’s recommendations on using AI, created and
maintained by Luke Baxter. Based on RAISE 3 draft v4.0 (23 September 2026): 56 tools,
131 functions, 96 populated cells and twelve cells with two recommendations.

[Site overview](../README.md) · [Live map](https://lukebax.github.io/ai-review-tools/map/)

## View the map

**[Open the live interactive map](https://lukebax.github.io/ai-review-tools/map/)**

For a local copy, open **[index.html](index.html)** in Chrome or another modern browser.
It contains the data, styling and interaction code. No installation, server or internet
connection is required to explore the map; outgoing source/tool links require internet.
The complete map and its editable sources live together in `map/`.

Select a cell to read its function-specific explanations, recommendations and sources.
The instruction above the map links to Find a tool and Roomier columns for a closer view;
these controls retain their existing positions below the map.
Recommendations apply to the specified function or workflow, not to every use of a product.
Split cells preserve both recommendations; their diagonal halves do not represent proportions
or confidence. White cells mean no use listed within this map's scope. Recommendation filters
match either category in a split cell. Balanced is the default palette; the optional
colour-blind-friendly switch selects ColorBrewer RdYlBu.

Use arrow keys in the map, Enter/Space to open details and Escape to close them. The layout is
optimised for desktop; narrow views can scroll the map horizontally. The explanations below
the filters start collapsed. Use **Expand all** or **Collapse all**, or open individual headings.
These sections introduce RAISE, the map's sources and adaptations, review stages, technology
families, recommendation meanings, limits and keyboard use. **Is this tool suitable for my
review?** uses RAISE 3's five assessment questions in their original order, with concise
explanations from Section 3 (pp.23–29).

## Edit and rebuild the map

Requirements for editing: **Python 3.9 or newer**, with no third-party Python packages.
The generated map itself needs only a browser.

1. Edit `map/map-data.json` for tool/function content and recommendation definitions.
2. Edit `map/map-template.html` for layout, styles and interaction code.
3. From the repository root, run `python3 map/build.py` to validate and regenerate `map/index.html`.
4. Open the map and check the change. Run `python3 map/build.py --check` to confirm that
   the generated HTML matches its sources without changing any files.
5. Follow the publication instructions below when a release is authorised.

The script also works when called by its path from another directory. It reads the data and
template beside itself in `map/` and writes only `map/index.html`. It does not download
anything or need the private presentation workspace. Do not edit generated `map/index.html`
directly. The build rejects cells containing more than two recommendation categories; review
the display convention before adding such a case.

Publication uses the shared [site workflow](../README.md#publish-and-verify).

## Guidance and interpretation

The source-based map content and outgoing links were checked on 19 October 2026. Some
external sites restrict automated access; a correct link does not guarantee future availability.
Use the exact RAISE versions and qualifications described in the map and
[source notices](../THIRD_PARTY_NOTICES.md). Tool links explain features; they do not establish
validation, endorsement or current availability.

This map paraphrases and reorganises the guidance and identifies editorial interpretation.
Keep appropriate scientific terminology and useful technical distinctions. Brief contextual or
parenthetical explanations support novice readers without replacing precise field terminology.
The suitability questions and cell explanations follow this principle; do not apply a blanket
plain-language replacement pass.
Its four families follow RAISE v4: Rule-based algorithms (symbolic AI), Unsupervised machine
learning, Supervised machine learning, and Generative large language models (LLMs), with
27, 2, 10 and 17 columns respectively. Machine Learning is the visual parent of separate
Unsupervised and Supervised headings. Cell details retain the more specific RAISE Table 2
label alongside the map family.

Carrot2 and SWIFT-Review are the unsupervised examples. STEED and URSE retain RAISE's
supervised assignments and their implementation qualifications. Agentic and conversational
uses sit within the LLM group; these are practical groupings rather than mutually exclusive
technology families. Google Translate and DeepL appear in four derived translation-support
stages and retain their broader source technology label. Their placement does not imply
exclusively LLM-based implementations.

“Writing a manuscript” groups drafting, revisions and plain-language summaries. The synthesis
explanation distinguishes statistical analysis, checked coding assistance and agentic workflows,
while preserving evidence limits and sources. End-to-end review workflows, chatbot interaction
and methods without a named tool are explained outside the matrix. The guide is not an
official RAISE publication or a live product catalogue. Check newer guidance and the intended
review procedure before relying on a recommendation.
