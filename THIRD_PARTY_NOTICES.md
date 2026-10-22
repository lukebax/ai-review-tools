# Source and third-party notices

## RAISE

RAISE means Responsible use of AI in Evidence Synthesis. This is an independent
adaptation of guidance by James Thomas, Kaitlyn Hair, Anna Noel-Storr and colleagues;
full authorship is listed in [RAISE 1](https://osf.io/d5ajy).

- [RAISE 1](https://osf.io/d5ajy): draft v4, 23 September 2026.
- [RAISE 2](https://osf.io/y26pj): draft v4, 25 August 2026.
- [RAISE 3](https://osf.io/kd9q5): draft v4, 23 September 2026.
- [Responsible handover form](https://osf.io/249du) and
  [worked example](https://osf.io/98nkx): accompanying v2 supplements.
- [Official collection](https://doi.org/10.17605/OSF.IO/FWAUD).

The source material is CC BY 4.0. Preserve source authorship, licence links and
adaptation notices. Source PDFs are not bundled. Public source URLs may later
resolve to newer revisions; the map states the exact version used. The Table 2
snapshot-month inconsistency is disclosed in the map. Editorial interpretations
and derived translation-support placements are identified in its explanations.

## ColorBrewer

This product includes colour specifications and designs developed by Cynthia Brewer.
Palette credit: Cynthia Brewer, Mark Harrower and The Pennsylvania State University.
The optional palette is the five-colour
[RdYlBu scheme](https://colorbrewer2.org/#type=diverging&scheme=RdYlBu&n=5), reversed
to associate blue with Acceptable for use and red with Not acceptable for use.
Only those five colour values are used; no ColorBrewer JavaScript is imported.

The [official ColorBrewer repository](https://github.com/axismaps/colorbrewer)
provides an Apache 2.0 [licence](https://github.com/axismaps/colorbrewer/blob/master/LICENCE.txt).
A copy is included in [LICENSES/Apache-2.0.txt](LICENSES/Apache-2.0.txt), and the
standalone HTML retains the notice and licence text. These terms concern the
upstream ColorBrewer material, not the original map code or explanatory content.

## Tool and evidence references

Official tool documentation and primary publications are linked in the function
details to support descriptions and qualifications. Linked works and tool names
retain their owners' rights. A tool link is not a validation claim or endorsement.

## Presentation

The `presentation/` deck bundles [Reveal.js](https://revealjs.com/)
version **6.0.2**, by Hakim El Hattab and contributors, under the MIT licence.
The required distribution files, including the speaker-notes plugin, are unmodified; the upstream licence and version
record are in `presentation/assets/vendor/reveal/`. No CDN is required.

The diagrams and QR asset are original generated graphics. The closing-slide
`navigation-map.png` illustration was generated with OpenAI image generation on
23 October 2026. It depicts a playful conceptual treasure map, not actual geography or
evidence, and contains no third-party artwork. Map excerpts derive
from this repository’s maintained data and retain the RAISE attribution above.
The presentation’s [source note](presentation/README.md#sources-and-scope)
identifies the exact guidance versions and explains the adaptations. The PDF
reproduces the same explanatory content and is covered by the same content licence.

## Development-only PDF export tools

The publication tooling uses Playwright (Apache 2.0), pdf-lib (MIT), and PDF.js/pdfjs-dist
(Apache 2.0), with exact versions in `package-lock.json`. Their installed packages retain
upstream notices. These tools are build dependencies, not browser runtime dependencies;
`node_modules/` is excluded from Git and the published site.

## Opening-slide logos

The University of Oxford and Department of Paediatrics logos are reproduced unchanged
from the [department's official website](https://www.paediatrics.ox.ac.uk/), retrieved
22 October 2026 ([Oxford artwork](https://www.paediatrics.ox.ac.uk/++branding++/secondary-logo),
[Paediatrics artwork](https://www.paediatrics.ox.ac.uk/++branding++/primary-logo)).
Use follows the [Oxford brand guidance](https://www.ox.ac.uk/about/the-university/brand/guidelines).
The MESISIG logo was supplied in the preceding symposium presentation, “AI in evidence
synthesis: Setting the scene”, by Aidan Cashin and Michael Ferraro (slide 1); its original
PNG is reproduced unchanged. These marks identify the presenter's affiliation and workshop.
They retain their owners' rights and are excluded from this project's MIT and CC BY licences.
