// MIT. Behavioural checks for the standalone map's three filter dimensions.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(`${root}/map/map-data.json`, 'utf8'));
const url = process.env.MAP_TEST_URL || pathToFileURL(`${root}/map/index.html`).href;
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function withPage(run, width = 1600) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#map-body .cell-button').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], 'No browser errors during interaction');
  } finally { await context.close(); }
}
async function openFilter(page, name) {
  const details = page.locator(`#${name}-filter`);
  if (await details.getAttribute('open') === null)
    await page.locator(`#${name}-filter-summary`).click();
}
async function setOption(page, name, value, checked = true) {
  await openFilter(page, name);
  const inputs = page.locator(`#${name}-filter input[type=checkbox]`);
  for (let i = 0; i < await inputs.count(); i++) {
    if (await inputs.nth(i).inputValue() === value) {
      await inputs.nth(i).setChecked(checked);
      return;
    }
  }
  throw new Error(`Missing option ${value}`);
}
async function closeFilter(page, name) {
  if (await page.locator(`#${name}-filter`).getAttribute('open') !== null)
    await page.locator(`#${name}-filter-summary`).click();
}
const tools = page => page.locator('#map-head .tool-row th').evaluateAll(nodes => nodes.map(n => n.dataset.tool));
const stages = page => page.locator('#map-body > tr > th').allTextContents();
const cell = (page, tool, stage) => page.locator(`#map-body .cell-button[data-tool="${tool}"][data-stage="${stage}"]`);
const displayedGroups = page => page.locator('#map-head th[data-group]').evaluateAll(nodes => nodes.map(n => n.dataset.group));

// Check actual data/order, rather than only a count or selected visual style.
test('category and stage subsets combine independently and retain the map order', async () => withPage(async page => {
  assert.equal((await tools(page)).length, 56);
  assert.deepEqual(await stages(page), data.stages);
  assert.equal(data.groups[0].label, 'Rule-based algorithms');
  await setOption(page, 'group', 'generative');
  await setOption(page, 'group', 'rule-based');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Data synthesis');
  await setOption(page, 'stage', 'The Search');
  await closeFilter(page, 'stage');
  assert.deepEqual(await tools(page), data.tools.filter(t => ['rule-based', 'generative'].includes(t.groupId)).map(t => t.id));
  assert.deepEqual(await stages(page), ['The Search', 'Data synthesis']);
  assert.deepEqual(await displayedGroups(page), ['rule-based', 'generative']);
  assert.equal(await page.locator('#family-machine-learning').count(), 0);
  await openFilter(page, 'group');
  await page.locator('#show-all-groups').click();
  assert.equal((await tools(page)).length, 56);
  assert.deepEqual(await stages(page), ['The Search', 'Data synthesis']);
  await setOption(page, 'group', 'supervised');
  await setOption(page, 'group', 'unsupervised');
  assert.deepEqual(await displayedGroups(page), ['unsupervised', 'supervised']);
  assert.equal(await page.locator('#family-machine-learning').getAttribute('colspan'), '12');
  await closeFilter(page, 'group');
  await openFilter(page, 'stage');
  await page.locator('#show-all-stages').click();
  assert.deepEqual(await stages(page), data.stages);
  assert.equal((await tools(page)).length, 12);
}));

test('recommendations still match either selected category and preserve split-cell details', async () => withPage(async page => {
  await setOption(page, 'group', 'supervised');
  await setOption(page, 'group', 'generative');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Screening for relevance');
  await closeFilter(page, 'stage');
  await page.locator('[data-rec="acceptable"]').click();
  await page.locator('[data-rec="verification"]').click();
  const screening = 'Screening for relevance';
  assert(!(await cell(page, 'abstrackr', screening).getAttribute('class')).includes('filtered-out'));
  assert(!(await cell(page, 'google-translate', screening).getAttribute('class')).includes('filtered-out'));
  assert((await cell(page, 'gemini', screening).getAttribute('class')).includes('filtered-out'));
  assert.equal(await cell(page, 'abstrackr', screening).getAttribute('data-categories'), 'acceptable,validation');
  await cell(page, 'abstrackr', screening).click();
  assert.match(await page.locator('#drawer-body').innerText(), /Requires validation within the review/);
  await page.locator('#close-drawer').click();
  await cell(page, 'gemini', screening).click();
  assert.match(await page.locator('#drawer-body').innerText(), /does not match the selected recommendations/);
  assert.equal((await tools(page)).length, 27, 'Recommendation selection highlights cells without dropping tool columns');
}));

test('search, zero results, deselecting the last option and reset remain recoverable', async () => withPage(async page => {
  await setOption(page, 'group', 'rule-based');
  await setOption(page, 'group', 'generative');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Data synthesis');
  await setOption(page, 'stage', 'Screening for relevance');
  await closeFilter(page, 'stage');
  await page.locator('#tool-search').fill('gemini');
  assert.deepEqual(await tools(page), ['gemini']);
  assert.deepEqual(await stages(page), ['Screening for relevance', 'Data synthesis']);
  await page.locator('#tool-search').fill('this tool does not exist');
  assert.equal(await page.locator('#empty-state').isVisible(), true);
  await page.locator('#empty-reset').click();
  assert.equal((await tools(page)).length, 56);
  assert.deepEqual(await stages(page), data.stages);
  assert.equal(await page.locator('#tool-search').inputValue(), '');
  await setOption(page, 'group', 'generative');
  await setOption(page, 'group', 'generative', false);
  assert.equal((await tools(page)).length, 56, 'No category selected means all categories');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Data synthesis');
  await setOption(page, 'stage', 'Data synthesis', false);
  assert.deepEqual(await stages(page), data.stages, 'No stage selected means all stages');
  await closeFilter(page, 'stage');
  await page.locator('[data-rec="validation"]').click();
  await page.locator('#reset-filters').click();
  assert.equal(await page.locator('.legend-button[aria-pressed=true]').count(), 0);
  assert.equal(await page.locator('#group-filter input:checked, #stage-filter input:checked').count(), 0);
}));

test('an open cell remains available only while its selected row and column remain visible', async () => withPage(async page => {
  await setOption(page, 'group', 'generative');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Screening for relevance');
  await closeFilter(page, 'stage');
  await cell(page, 'gemini', 'Screening for relevance').click();
  await setOption(page, 'stage', 'Data extraction');
  assert.equal(await page.locator('#details-drawer.open').count(), 1);
  await setOption(page, 'stage', 'Screening for relevance', false);
  assert.equal(await page.locator('#details-drawer.open').count(), 0);
  await closeFilter(page, 'stage');
  await cell(page, 'gemini', 'Data extraction').click();
  await setOption(page, 'group', 'supervised');
  assert.equal(await page.locator('#details-drawer.open').count(), 1);
  await setOption(page, 'group', 'generative', false);
  assert.equal(await page.locator('#details-drawer.open').count(), 0);
  assert.equal(await page.locator('#map-body button[tabindex="0"]').count(), 1);
}));

test('keyboard filtering retains focus, Escape closes the filter first, and grid arrows skip hidden rows', async () => withPage(async page => {
  await page.locator('#group-filter-summary').focus();
  await page.keyboard.press('Enter');
  const first = page.locator('#group-filter input[type=checkbox]').first();
  await first.focus();
  await page.keyboard.press('Space');
  assert.equal(await first.isChecked(), true);
  assert.equal(await first.evaluate(e => e === document.activeElement), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#group-filter').getAttribute('open'), null);
  assert.equal(await page.locator('#group-filter-summary').evaluate(e => e === document.activeElement), true);
  await setOption(page, 'stage', 'The Search');
  await setOption(page, 'stage', 'Data synthesis');
  await closeFilter(page, 'stage');
  await cell(page, 'asysd', 'The Search').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await cell(page, 'asysd', 'Data synthesis').evaluate(e => e === document.activeElement), true);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator(':focus').getAttribute('data-tool'), 'grade-cerqual');
  await page.keyboard.press('Enter');
  await openFilter(page, 'stage');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#stage-filter').getAttribute('open'), null);
  assert.equal(await page.locator('#details-drawer.open').count(), 1, 'First Escape closes filter, not drawer');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#details-drawer.open').count(), 0);
}));

test('long checkbox labels and both filter menus stay within a narrow viewport', async () => withPage(async page => {
  for (const name of ['group', 'stage']) {
    await openFilter(page, name);
    const rects = await page.locator(`#${name}-filter label`).evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent, left: rect.left, right: rect.right, height: rect.height };
    }));
    assert(rects.length >= 4);
    for (const rect of rects) {
      assert(rect.left >= 0 && rect.right <= 390, `Filter label outside mobile viewport: ${JSON.stringify(rect)}`);
      assert(rect.height > 0);
    }
    await closeFilter(page, name);
  }
  await setOption(page, 'group', 'rule-based');
  await setOption(page, 'group', 'generative');
  await closeFilter(page, 'group');
  await setOption(page, 'stage', 'Certainty of evidence assessment');
  await closeFilter(page, 'stage');
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(pageWidth <= 390, `Whole page should not scroll sideways (${pageWidth}px); map scrolling is internal`);
  assert.deepEqual(await stages(page), ['Certainty of evidence assessment']);
}, 390));


test('filtered map frames fit their tables and recover after resizing, drawers and reset', async () => withPage(async page => {
  const resize = async (width, height = 1000) => {
    // The viewport command can return before resize handlers run. Observe the native
    // event after the map's handler so both intermediate and final layouts are tested.
    await page.evaluate(() => {
      window.__mapTestResizeFinished = false;
      window.addEventListener('resize', () => { window.__mapTestResizeFinished = true; }, { once: true });
    });
    await page.setViewportSize({ width, height });
    await page.waitForFunction(() => window.__mapTestResizeFinished, null, { timeout: 5000 });
  };
  const geometry = () => page.evaluate(() => {
    const frame=document.getElementById('map-scroll'),table=document.getElementById('map-table');
    const workspace=document.getElementById('workspace'),style=getComputedStyle(workspace);
    return {frame:frame.clientWidth,table:table.getBoundingClientRect().width,
      available:workspace.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-2,
      scrollWidth:frame.scrollWidth,page:document.documentElement.scrollWidth};
  });
  const full=await geometry();
  for (const groups of [['supervised'],['generative'],['rule-based','unsupervised'],['unsupervised']]) {
    await page.locator('#reset-filters').click();
    for (const group of groups) await setOption(page,'group',group);
    await closeFilter(page,'group');
    const before=await geometry();
    assert(Math.abs(before.frame-Math.min(before.table,before.available))<2,'Frame must end at table edge or available viewport');
    await resize(1450);
    await resize(1600);
    const after=await geometry();
    assert(Math.abs(before.frame-after.frame)<2,'Repeated resize must not shrink the map');
  }
  await page.locator('#reset-filters').click();
  assert(Math.abs((await geometry()).frame-full.frame)<2,'Reset must recover full map width');
  await setOption(page,'group','supervised');
  await closeFilter(page,'group');
  const beforeDrawer=await geometry();
  await cell(page,'abstrackr','Screening for relevance').click();
  await page.locator('#close-drawer').click();
  assert(Math.abs((await geometry()).frame-beforeDrawer.frame)<2,'Closing the drawer must recover available width');
  await resize(390,844);
  await page.locator('#roomier').check();
  const narrow=await geometry();
  assert(narrow.scrollWidth>narrow.frame,'Narrow maps must scroll internally');
  assert(narrow.page<=390,'The whole page must not overflow');
  await page.locator('#tool-search').fill('no matching tool');
  const empty=await geometry();
  assert(Math.abs(empty.frame-empty.available)<2,'The empty state should retain a usable full-width message');
}));
