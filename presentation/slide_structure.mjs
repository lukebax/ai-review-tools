// MIT. The part boundaries are editorial; footer numbers always follow actual order.
export const PARTS = [
  { start: 'slide-2', title: 'Foundations' },
  { start: 'map-overview', title: 'Mapping the landscape' },
  { start: 'prioritised-screening', title: 'Why recommendations differ between uses' },
  { start: 'suitability-purpose-data', title: 'Assessing suitability for your review' },
];

export function updateSlideFooters(html) {
  const sections = [...html.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>[\s\S]*?<\/section>/g)];
  if (!sections.length) throw new Error('No slide sections found for footer numbering');
  let part = 0, seenParts = 0;
  const replacements = sections.map((match, index) => {
    const id = match[0].match(/^<section\b[^>]*\bid="([^"]+)"/)?.[1];
    const starts = PARTS.findIndex(p => p.start === id);
    if (starts !== -1) {
      if (starts !== seenParts++) throw new Error('Presentation part boundaries are missing, duplicated or out of order');
      part = starts + 1;
    }
    if (id === 'choosing-a-suitable-use') part = 0;
    const footers = [...match[0].matchAll(/<footer\b[^>]*class="[^"]*\bslide-footer\b[^"]*"[^>]*>[\s\S]*?<\/footer>/g)];
    if (footers.length !== 1) throw new Error(`Slide ${index + 1}: expected one footer`);
    const links = footers[0][0].match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || [];
    if (links.length > 1) throw new Error(`Slide ${index + 1}: unexpected footer links`);
    const label = part ? `<span class="part-label" data-part="${part}">${part} · ${PARTS[part - 1].title}</span>` : '';
    const footer = `<footer class="slide-footer${links.length ? ' with-link' : ''}">${label}${links.join('')}<span class="slide-count">${index + 1} / ${sections.length}</span></footer>`;
    return match[0].replace(footers[0][0], footer);
  });
  if (seenParts !== PARTS.length) throw new Error('Missing presentation part boundary');
  let index = 0;
  return html.replace(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>[\s\S]*?<\/section>/g, () => replacements[index++]);
}

export function checkSlideFooters(html) {
  if (updateSlideFooters(html) !== html) throw new Error('Slide footers do not match actual order and part labels. Run npm run build:pdf.');
}
