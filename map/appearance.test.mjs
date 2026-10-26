// MIT. Appearance is independent of the map's filters and recommendation palette.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Always exercise the distributable file: no web server or network is required.
const url = pathToFileURL(`${root}/map/index.html`).href;
const storageKey = 'ai-review-tools-appearance';
const combinations = [
  { theme: 'light', palette: 'balanced' },
  { theme: 'dark', palette: 'balanced' },
  { theme: 'dark', palette: 'colorbrewer' },
  { theme: 'light', palette: 'colorbrewer' },
];
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function withPage(run, { init, colorScheme = 'dark', viewport = { width: 1600, height: 1000 } } = {}) {
  const context = await browser.newContext({
    viewport, colorScheme, offline: true,
  });
  const page = await context.newPage(), errors = [], network = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url())) network.push(request.url());
  });
  try {
    if (init) await page.addInitScript(init);
    await page.goto(url);
    await page.locator('#map-body .cell-button').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], 'Appearance changes must not cause browser errors');
    assert.deepEqual(network, [], 'The standalone map must not request network assets');
  } finally { await context.close(); }
}

async function assertAppearance(page, expected) {
  assert.deepEqual(await page.locator('html').evaluate(node => ({
    theme: node.dataset.theme, palette: node.dataset.palette,
  })), expected);
  assert.equal(await page.locator('#dark-mode-toggle').isChecked(), expected.theme === 'dark');
  assert.equal(await page.locator('#accessible-palette').isChecked(), expected.palette === 'colorbrewer');
  assert.equal(await page.locator('html').evaluate(node => getComputedStyle(node).colorScheme), expected.theme);
}

async function setAppearance(page, appearance) {
  await page.locator('#dark-mode-toggle').setChecked(appearance.theme === 'dark');
  await page.locator('#accessible-palette').setChecked(appearance.palette === 'colorbrewer');
  await assertAppearance(page, appearance);
}

async function selectFilter(page, name, value) {
  await page.locator(`#${name}-filter-summary`).click();
  const inputs = page.locator(`#${name}-filter input[type=checkbox]`);
  for (let i = 0; i < await inputs.count(); i++) {
    if (await inputs.nth(i).inputValue() === value) {
      await inputs.nth(i).check();
      await page.locator(`#${name}-filter-summary`).click();
      return;
    }
  }
  throw new Error(`Missing ${name} filter: ${value}`);
}

async function stateSnapshot(page) {
  return page.evaluate(() => ({
    search: document.getElementById('tool-search').value,
    roomier: document.getElementById('roomier').checked,
    filters: [...document.querySelectorAll('#group-filter input:checked, #stage-filter input:checked')].map(n => n.value),
    recommendations: [...document.querySelectorAll('.legend-button[aria-pressed=true]')].map(n => n.dataset.rec),
    columns: [...document.querySelectorAll('#map-head .tool-row th')].map(n => n.dataset.tool),
    rows: [...document.querySelectorAll('#map-body > tr > th')].map(n => n.textContent),
    cells: [...document.querySelectorAll('#map-body .cell-button')].map(n => ({
      tool: n.dataset.tool, stage: n.dataset.stage, categories: n.dataset.categories,
      selected: n.getAttribute('aria-pressed'), filtered: n.classList.contains('filtered-out'),
    })),
    drawerOpen: document.getElementById('details-drawer').classList.contains('open'),
    drawerText: document.getElementById('details-drawer').innerText,
    expandedDetails: [...document.querySelectorAll('.scope-details[open], #drawer-body details[open]')].map(n => n.innerText),
    result: document.getElementById('result-count').innerText,
  }));
}

async function checkRecommendationColours(page) {
  const paints = await page.evaluate(() => {
    const legend = Object.fromEntries([...document.querySelectorAll('.legend-button')].map(n => [
      n.dataset.rec, getComputedStyle(n.querySelector('.swatch')).backgroundColor,
    ]));
    const cells = [...document.querySelectorAll('.cell-button[data-categories]:not(.empty)')].map(n => ({
      categories: n.dataset.categories.split(','),
      colours: n.querySelector('svg')
        ? [...n.querySelectorAll('svg rect, svg path')].map(shape => getComputedStyle(shape).fill)
        : [getComputedStyle(n.querySelector('.cell-colour')).backgroundColor],
    }));
    const details = [...document.querySelectorAll('#drawer-summary .recommendation-label')].map(n => ({
      text: n.textContent, colour: getComputedStyle(n).borderLeftColor,
    }));
    const selected = document.querySelector('.cell-button[aria-pressed=true]');
    const caption = [...document.querySelectorAll('.mixed-swatch rect, .mixed-swatch path')].map(n => getComputedStyle(n).fill);
    return { legend, cells, details, selected: selected?.dataset.categories.split(','), caption };
  });
  assert.equal(new Set(Object.values(paints.legend)).size, 5, 'The five recommendation colours remain distinct');
  assert(paints.cells.some(cell => cell.categories.length === 2), 'Exercise a split SVG cell');
  for (const cell of paints.cells) {
    assert.deepEqual(cell.colours, cell.categories.map(id => paints.legend[id]), 'Cells and each SVG half must match the key');
  }
  assert.deepEqual(paints.caption, [paints.legend.verification, paints.legend.exploratory], 'The split-cell explanation uses the active palette');
  assert.deepEqual(paints.details.map(item => item.colour), paints.selected.map(id => paints.legend[id]), 'Open details retain both active recommendation colours');
  return paints.legend;
}

test('a fresh standalone map defaults to light and balanced even when the OS prefers dark', async () => withPage(async page => {
  await assertAppearance(page, combinations[0]);
  assert.equal(await page.locator('#map-head .tool-row th').count(), 56);
  assert.equal(await page.locator('#dark-mode-toggle').getAttribute('role'), 'switch');
  assert.equal(await page.locator('#accessible-palette').getAttribute('role'), 'switch');
}));

test('all four appearance combinations retain search, filters, open details and consistent recommendation colours', async () => withPage(async page => {
  await selectFilter(page, 'group', 'supervised');
  await selectFilter(page, 'stage', 'Screening for relevance');
  await page.locator('#tool-search').fill('abstrackr');
  await page.locator('[data-rec="acceptable"]').click();
  await page.locator('#roomier').check();
  await page.locator('.scope-details > summary').first().click();
  await page.locator('.cell-button[data-tool="abstrackr"]').click();
  const detailDisclosure = page.locator('#drawer-body details > summary').first();
  if (await detailDisclosure.count()) await detailDisclosure.click();
  const before = await stateSnapshot(page), palettes = new Map();
  assert.equal(before.drawerOpen, true);
  assert.deepEqual(before.columns, ['abstrackr']);
  for (const appearance of [...combinations, combinations[0]]) {
    await setAppearance(page, appearance);
    assert.deepEqual(await stateSnapshot(page), before, 'Appearance must preserve the current map and expanded details');
    const colours = await checkRecommendationColours(page);
    if (palettes.has(appearance.palette)) {
      assert.deepEqual(colours, palettes.get(appearance.palette), 'Theme changes must leave the chosen recommendation palette unchanged');
    } else palettes.set(appearance.palette, colours);
  }
  assert.notDeepEqual(palettes.get('balanced'), palettes.get('colorbrewer'), 'The palette switch must visibly change the recommendation colours');
  await setAppearance(page, combinations[2]);
  await page.locator('#close-drawer').click();
  await page.locator('#reset-filters').click();
  assert.equal(await page.locator('#map-head .tool-row th').count(), 56);
  await assertAppearance(page, combinations[2]);
}));

test('both choices persist independently through file reloads', async () => withPage(async page => {
  // Start with a non-default choice so each iteration has an actual user change.
  await setAppearance(page, combinations[2]);
  for (const appearance of combinations) {
    await setAppearance(page, appearance);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), appearance);
    await page.reload();
    await page.locator('#map-body .cell-button').first().waitFor();
    await assertAppearance(page, appearance);
  }
}));

test('malformed or unsupported saved preferences fall back safely and can be replaced', async () => {
  for (const raw of ['{broken', 'null', '[]', '"dark"', '{"theme":"sepia","palette":"unknown"}']) {
    await withPage(async page => {
      await assertAppearance(page, combinations[0]);
      await setAppearance(page, combinations[2]);
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), combinations[2]);
    }, { init: `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(raw)})` });
  }
});

test('blocked storage access, reads or writes never prevent appearance changes or map use', async () => {
  const blocks = [
    () => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }),
    () => Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } }),
    () => Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new DOMException('Full', 'QuotaExceededError'); } }),
  ];
  for (const init of blocks) {
    await withPage(async page => {
      await assertAppearance(page, combinations[0]);
      for (const appearance of combinations) await setAppearance(page, appearance);
      await page.locator('#tool-search').fill('abstrackr');
      await page.locator('.cell-button[data-tool="abstrackr"][data-stage="Screening for relevance"]').click();
      assert.equal(await page.locator('#details-drawer.open').count(), 1);
      await page.locator('#close-drawer').click();
      await page.locator('#reset-filters').click();
      assert.equal(await page.locator('#map-head .tool-row th').count(), 56);
      await page.reload();
      await page.locator('#map-body .cell-button').first().waitFor();
      await assertAppearance(page, combinations[0]);
    }, { init });
  }
});

test('dark appearance switches and modal details remain usable at narrow widths', async () => {
  for (const width of [390, 320]) {
    await withPage(async page => {
      await setAppearance(page, combinations[2]);
      const layout = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        frame: document.getElementById('map-scroll').clientWidth,
        table: document.getElementById('map-scroll').scrollWidth,
        switches: [...document.querySelectorAll('.appearance-switch')].map(node => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        }),
      }));
      assert(layout.page <= width, `${width}px viewport must not have whole-page horizontal overflow`);
      assert(layout.table > layout.frame, 'The map retains its own horizontal scrolling');
      assert.equal(layout.switches.length, 2);
      for (const rect of layout.switches) assert(rect.left >= 0 && rect.right <= width, 'Both appearance labels fit the viewport');
      await page.locator('#tool-search').fill('abstrackr');
      const cell = page.locator('.cell-button[data-tool="abstrackr"][data-stage="Screening for relevance"]');
      for (const close of ['Escape', 'button']) {
        await cell.click();
        const drawer = page.locator('#details-drawer');
        assert.equal(await drawer.getAttribute('role'), 'dialog');
        assert.equal(await drawer.getAttribute('aria-modal'), 'true');
        await page.keyboard.press('Tab');
        assert.equal(await drawer.evaluate(node => node.contains(document.activeElement)), true, 'Keyboard focus remains within the modal');
        assert(await page.evaluate(() => document.documentElement.scrollWidth) <= width);
        if (close === 'Escape') await page.keyboard.press('Escape');
        else await page.locator('#close-drawer').click();
        assert.equal(await page.locator('#details-drawer.open').count(), 0);
        assert.equal(await cell.evaluate(node => node === document.activeElement), true, 'Closing details returns focus to the selected cell');
        await assertAppearance(page, combinations[2]);
      }
    }, { viewport: { width, height: 844 } });
  }
});

test('printing uses light surfaces while preserving a saved dark appearance', async () => withPage(async page => {
  const surfaces = () => page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    colours: ['body', '#tool-search', '.legend-button', '.scope-details', '#map-body > tr > th'].map(selector => {
      const style = getComputedStyle(document.querySelector(selector));
      return { background: style.backgroundColor, text: style.color };
    }),
  }));
  const light = await surfaces();
  await setAppearance(page, combinations[2]);
  await page.reload();
  await page.locator('#map-body .cell-button').first().waitFor();
  await assertAppearance(page, combinations[2]);
  const dark = await surfaces();
  assert.notDeepEqual(dark.colours, light.colours, 'Dark mode changes the visible surfaces');
  await page.emulateMedia({ media: 'print' });
  assert.deepEqual(await surfaces(), light, 'Print uses the same readable light surfaces as the light screen theme');
  assert.equal(await page.locator('#dark-mode-toggle').isChecked(), true);
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), combinations[2]);
  await page.emulateMedia({ media: 'screen' });
  assert.deepEqual(await surfaces(), dark);
  await assertAppearance(page, combinations[2]);
}));

// Sample actual rendered colours, compositing transparent backgrounds through ancestors.
// Ratios enforce readability without fixing any particular light or dark hex values.
async function contrastSamples(page, selectors, focus = false) {
  return page.evaluate(({ selectors, focus }) => {
    const rgba = css => {
      const values = css.match(/[\d.]+/g)?.map(Number);
      if (!values || values.length < 3) throw new Error(`Unrecognised colour: ${css}`);
      return [...values.slice(0, 3), values[3] ?? 1];
    };
    const over = (front, back) => front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3]));
    const background = node => {
      const ancestors = [];
      for (; node; node = node.parentElement) ancestors.unshift(node);
      return ancestors.reduce((back, el) => over(rgba(getComputedStyle(el).backgroundColor), back), [255, 255, 255]);
    };
    const luminance = colour => colour.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((total, v, i) => total + v * [.2126, .7152, .0722][i], 0);
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(node => node.getClientRects().length).map(node => {
      const style = getComputedStyle(node), back = background(focus ? node.parentElement : node);
      const foreground = rgba(focus ? style.outlineColor : style.color), front = over(foreground, back);
      const a = luminance(front), b = luminance(back);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
      return { selector, label: node.textContent.trim().slice(0, 80), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05),
        minimum: focus || large ? 3 : 4.5, outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    }));
  }, { selectors, focus });
}

// Read the cell's paint (including faded SVG halves and hatch stripes), rather
// than comparing a focus token with the surrounding page background.
async function cellFocusSample(cell) {
  return cell.evaluate(node => {
    const rgba = css => {
      const values = css.match(/[\d.]+/g)?.map(Number);
      if (!values || values.length < 3) throw new Error(`Unrecognised colour: ${css}`);
      return [...values.slice(0, 3), values[3] ?? 1];
    };
    const over = (front, back) => front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3]));
    const ancestors = [];
    for (let el = node; el; el = el.parentElement) ancestors.unshift(el);
    const background = ancestors.reduce((back, el) => over(rgba(getComputedStyle(el).backgroundColor), back), [255, 255, 255]);
    const paint = node.querySelector('.cell-colour'), paintStyle = getComputedStyle(paint);
    const shapes = [...paint.querySelectorAll('rect, path')];
    let fills = (shapes.length ? shapes.map(shape => getComputedStyle(shape).fill) : [paintStyle.backgroundColor]).map(css => {
      const colour = rgba(css);
      colour[3] *= Number(paintStyle.opacity);
      return over(colour, background);
    });
    const hatch = getComputedStyle(node.querySelector('.filtered-mark'));
    if (hatch.display !== 'none') {
      const stripes = [...hatch.backgroundImage.matchAll(/rgba?\([^)]*\)/g)].map(match => rgba(match[0]));
      fills = fills.flatMap(fill => [fill, ...stripes.map(stripe => over(stripe, fill))]);
    }
    const style = getComputedStyle(node), rect = node.getBoundingClientRect(), indicators = [];
    const visible = style.visibility === 'visible' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    if (visible && !['none', 'hidden'].includes(style.outlineStyle) && parseFloat(style.outlineWidth) >= 2) {
      indicators.push({ source: 'outline', colour: style.outlineColor, width: style.outlineWidth, position: style.outlineOffset });
    }
    for (const pseudo of ['::before', '::after']) {
      const ring = getComputedStyle(node, pseudo), width = parseFloat(ring.borderTopWidth);
      if (visible && !['none', 'normal'].includes(ring.content) && ring.display !== 'none' && ring.visibility === 'visible'
          && !['none', 'hidden'].includes(ring.borderTopStyle) && width >= 2
          && ['Top', 'Right', 'Bottom', 'Left'].every(side => parseFloat(ring[`border${side}Width`]) >= 2)
          && parseFloat(ring.left) >= 0 && parseFloat(ring.top) >= 0
          && rect.width > parseFloat(ring.left) + parseFloat(ring.right) + 2 * width
          && rect.height > parseFloat(ring.top) + parseFloat(ring.bottom) + 2 * width) {
        indicators.push({ source: pseudo, colour: ring.borderTopColor, width: ring.borderTopWidth,
          position: [ring.top, ring.right, ring.bottom, ring.left].join(' ') });
      }
    }
    const luminance = colour => colour.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((total, v, i) => total + v * [.2126, .7152, .0722][i], 0);
    return { focused: node === document.activeElement, focusVisible: node.matches(':focus-visible'),
      filtered: node.classList.contains('filtered-out'), paintOpacity: Number(paintStyle.opacity),
      indicators: indicators.map(indicator => ({ ...indicator, contrasts: fills.map(fill => {
        const a = luminance(over(rgba(indicator.colour), fill)), b = luminance(fill);
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      }) })) };
  });
}

function assertCellFocus(sample, baseline, label) {
  assert(sample.focused && sample.focusVisible, `${label}: keyboard focus must be on the cell and match :focus-visible`);
  const signature = ({ source, colour, width, position }) => JSON.stringify({ source, colour, width, position });
  const changed = sample.indicators.filter(indicator => !baseline.indicators.some(before => signature(before) === signature(indicator)));
  assert(changed.length, `${label}: focus must add a distinct visible indicator, including on a selected cell`);
  for (let i = 0; i < changed[0].contrasts.length; i++) {
    const ratio = Math.max(...changed.map(indicator => indicator.contrasts[i]));
    assert(ratio >= 3, `${label}: focus contrast against cell paint is ${ratio.toFixed(2)}:1 < 3:1`);
  }
}

test('keyboard cell focus contrasts with every palette colour, split fill, blank and faded cell', async () => withPage(async page => {
  const samples = await page.locator('#map-body .cell-button').evaluateAll(cells => {
    const seen = new Set();
    return cells.flatMap((cell, index) => {
      const categories = cell.dataset.categories;
      if (seen.has(categories)) return [];
      seen.add(categories);
      return [{ index, categories: categories ? categories.split(',') : [] }];
    });
  });
  assert.equal(samples.filter(sample => sample.categories.length === 1).length, 5, 'Exercise every single recommendation colour');
  assert(samples.some(sample => sample.categories.length === 2), 'Exercise both halves of mixed SVG cells');
  assert(samples.some(sample => !sample.categories.length), 'Exercise blank cells');
  const recommendations = await page.locator('.legend-button').evaluateAll(nodes => nodes.map(node => node.dataset.rec));
  for (const appearance of combinations) {
    await setAppearance(page, appearance);
    const first = page.locator('#map-body .cell-button').first();
    const baseline = await cellFocusSample(first);
    await first.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await cellFocusSample(first)).focusVisible, false, 'Arrow navigation removes focus from the previous cell');
    const next = page.locator('#map-body .cell-button').nth(1);
    assertCellFocus(await cellFocusSample(next), baseline, 'ArrowRight destination');
    await page.keyboard.press('ArrowLeft');
    assertCellFocus(await cellFocusSample(first), baseline, 'ArrowLeft destination');
    for (const sample of samples) {
      const cell = page.locator('#map-body .cell-button').nth(sample.index);
      const label = `${appearance.theme}/${appearance.palette} ${sample.categories.join('/') || 'blank'}`;
      for (const faded of [false, true]) {
        const filter = recommendations.find(id => !sample.categories.includes(id));
        if (faded) await page.locator(`.legend-button[data-rec="${filter}"]`).click();
        await page.locator('#tool-search').focus();
        await page.keyboard.press('Tab');
        const before = await cellFocusSample(cell);
        await cell.focus();
        const focused = await cellFocusSample(cell);
        assert.equal(focused.filtered, faded, `${label}: exercise the expected filter state`);
        if (faded && sample.categories.length) assert(focused.paintOpacity < 1, `${label}: test the composited faded fill`);
        assertCellFocus(focused, before, `${label}${faded ? ' faded' : ''}`);
        if (faded) await page.locator('#clear-recommendations').click();
      }
    }
    const cell = page.locator('#map-body .cell-button:not(.empty)').first();
    await cell.focus();
    await page.keyboard.press('Enter');
    assert.equal(await cell.getAttribute('aria-pressed'), 'true');
    const selected = await cellFocusSample(cell);
    await cell.focus();
    assertCellFocus(await cellFocusSample(cell), selected, 'Selected cell');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#details-drawer.open').count(), 0);
    assertCellFocus(await cellFocusSample(cell), baseline, 'Cell restored after Escape');
  }
}));

test('text remains readable in each combination and keyboard switches have a visible focus indicator', async () => withPage(async page => {
  await page.locator('.scope-details > summary').first().click();
  await page.locator('[data-rec="acceptable"]').click();
  await page.locator('.cell-button[data-tool="abstrackr"][data-stage="Screening for relevance"]').click();
  const selectors = ['h1', '.intro', '.map-help', '.appearance-switch', '.control > label', '.control-label',
    '.multi-filter > summary', '.legend-button', '.map-meta', '.map-caption', '.key-note',
    '.group-row th', '.subgroup-row th', '.tool-label span', '#map-body > tr > th',
    '.scope-details > summary', '.scope-details[open] .disclosure-body p',
    '.drawer-kicker', '.drawer-head h2', '.drawer-stage', '.drawer-count',
    '.function-detail h3', '.function-number', '.field h4', '.field-content', '.recommendation-label', '.drawer-source'];
  for (const appearance of combinations) {
    await setAppearance(page, appearance);
    for (const sample of await contrastSamples(page, selectors)) {
      assert(sample.ratio >= sample.minimum, `${appearance.theme}/${appearance.palette} ${sample.selector} ${JSON.stringify(sample.label)}: ${sample.ratio.toFixed(2)}:1 < ${sample.minimum}:1`);
    }
    for (const id of ['dark-mode-toggle', 'accessible-palette']) {
      const control = page.locator(`#${id}`);
      await control.focus();
      await page.keyboard.press('Space');
      assert.equal(await control.evaluate(node => node === document.activeElement), true, 'Switching keeps keyboard focus');
      const [sample] = await contrastSamples(page, [`#${id}`], true);
      assert(sample.outline !== 'none' && sample.width >= 2, 'A focused appearance switch must have a visible outline');
      assert(sample.ratio >= 3, `Focus outline contrast is ${sample.ratio.toFixed(2)}:1`);
      await page.keyboard.press('Space');
      await assertAppearance(page, appearance);
    }
  }
}));
