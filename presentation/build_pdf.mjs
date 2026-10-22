// MIT. Export and check the complete static deck before either format is published.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { updateSlideFooters, checkSlideFooters } from './slide_structure.mjs';
import { PDFDocument, PDFName } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deckDir = path.join(root, 'presentation');
const pdfName = 'navigating-ai-evidence-synthesis.pdf';
const manifestPath = path.join(deckDir, 'pdf-build.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const normalize = text => text.normalize('NFKC').replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/\s|\u00ad/g, '');

// Script passages belong in the private Word/Markdown review workflow, not this site.
function checkNoPresenterSpeech(html) {
  requireThat(!/<aside\b[^>]*\bclass\s*=\s*["'][^"']*\bnotes\b/i.test(html)
    && !/\b(?:data-notes|data-note|data-spoken-sha256)\s*=/i.test(html)
    && !/approved-script-sha256/i.test(html),
  'Public presentation must not contain presenter notes or script passages.');
}

async function assetFiles(dir) {
  const names = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    requireThat(!entry.isSymbolicLink(), `Asset symlink is not supported: ${p}`);
    if (entry.isDirectory()) names.push(...await assetFiles(p));
    else if (entry.isFile()) names.push(p);
  }
  return names;
}
async function inputsDigest(html) {
  const paths = [path.join(deckDir, 'index.html'), path.join(deckDir, 'build_pdf.mjs'), path.join(deckDir, 'slide_structure.mjs'),
    path.join(root, 'package.json'), path.join(root, 'package-lock.json'),
    ...await assetFiles(path.join(deckDir, 'assets'))].sort();
  const digest = createHash('sha256');
  for (const p of paths) {
    const data = p === path.join(deckDir, 'index.html') && html !== undefined ? Buffer.from(html) : await fs.readFile(p);
    digest.update(path.relative(root, p)).update('\0').update(hash(data)).update('\n');
  }
  return digest.digest('hex');
}
async function versionAssets(html) {
  const matches = [...html.matchAll(/\b(?:src|href)="(assets\/[^"?#]+)(?:\?[^"#]*)?"/g)];
  for (const m of matches) {
    const local = path.resolve(deckDir, m[1]);
    requireThat(local.startsWith(deckDir + path.sep), 'Asset escapes presentation directory');
    const version = hash(await fs.readFile(local)).slice(0, 16);
    html = html.replace(m[0], m[0].replace(/=".*"$/, `="${m[1]}?v=${version}"`));
  }
  return html;
}
function versionPdf(html, pdfHash) {
  const re = new RegExp(`href="${pdfName.replaceAll('.', '\\.')}[^"#]*"`, 'g');
  requireThat([...html.matchAll(re)].length >= 1, 'No PDF download link found');
  return html.replace(re, `href="${pdfName}?v=${pdfHash.slice(0, 16)}"`);
}
async function check() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const html = await fs.readFile(path.join(deckDir, 'index.html'), 'utf8');
  checkSlideFooters(html);
  checkNoPresenterSpeech(html);
  requireThat(manifest.inputSHA256 === await inputsDigest(), 'PDF is out of date: HTML, assets or export dependencies changed. Run npm run build:pdf.');
  const pdfHash = hash(await fs.readFile(path.join(deckDir, pdfName)));
  requireThat(pdfHash === manifest.pdfSHA256, 'PDF bytes do not match the checked export. Run npm run build:pdf.');
  requireThat(await versionAssets(html) === html, 'Stale asset cache versions');
  requireThat(versionPdf(html, pdfHash) === html, 'Stale PDF download cache version');
  console.log(`PDF alignment verified: ${manifest.slides} slides/pages; source and PDF hashes match.`);
}
async function startServer(directory) {
  const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(directory, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
      if (!file.startsWith(directory + path.sep) || !['GET','HEAD'].includes(request.method)) {
        response.writeHead(404).end(); return;
      }
      const bytes = await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
// Logical slide coordinates make screen/print layout comparable at different scales.
async function inspectSlide(page, index) {
  return page.evaluate(index => {
    const slide = document.querySelectorAll('section.slide')[index], box = slide.getBoundingClientRect();
    const sx = 1280 / box.width, sy = 720 / box.height;
    const audience = selector => [...slide.querySelectorAll(selector)];
    const count = document.querySelectorAll('section.slide').length;
    const counters = slide.querySelectorAll('.slide-footer .slide-count');
    if (counters.length !== 1 || counters[0].textContent !== `${index + 1} / ${count}` || getComputedStyle(counters[0]).display === 'none') {
      throw new Error(`Slide ${index + 1}: inaccurate, missing or duplicate footer counter`);
    }
    if ([...document.querySelectorAll('.reveal > .slide-number')].some(e => getComputedStyle(e).display !== 'none')) {
      throw new Error('Duplicate Reveal slide counter is visible');
    }
    if (slide.querySelector('aside.notes,[data-note],[data-notes],[data-spoken-sha256]') || slide.hasAttribute('data-notes')) {
      throw new Error(`Slide ${index + 1}: public presenter notes are not permitted`);
    }
    const elements = audience('h1,h2,h3,p,li,img,svg,.slide-footer');
    const layout = elements.map(e => {
      const b = e.getBoundingClientRect();
      return { tag: e.tagName, x: (b.x - box.x) * sx, y: (b.y - box.y) * sy, w: b.width * sx, h: b.height * sy };
    });
    const text = audience('h1,h2,h3,p,li,figcaption,.slide-footer:not(:has(*)),.slide-footer > *,svg text')
      .map(e => (e.innerText || e.textContent).trim()).filter(Boolean);
    return { text, layout };
  }, index);
}
async function build() {
  const originalDigest = await inputsDigest();
  let html = await versionAssets(updateSlideFooters(await fs.readFile(path.join(deckDir, 'index.html'), 'utf8')));
  checkNoPresenterSpeech(html);
  const temp = await fs.mkdtemp(path.join(tmpdir(), 'ai-review-pdf-'));
  let browser, server;
  try {
    await fs.mkdir(path.join(temp, 'presentation'));
    await fs.cp(path.join(deckDir, 'assets'), path.join(temp, 'presentation/assets'), { recursive: true });
    await fs.writeFile(path.join(temp, 'presentation/index.html'), html);
    server = await startServer(temp);
    const base = server.base;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const problems = [];
    await context.route('**/*', route => {
      if (route.request().url().startsWith(base + '/')) return route.continue();
      problems.push(`External runtime dependency: ${route.request().url()}`);
      return route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.on('pageerror', error => problems.push(error.message));
    page.on('response', response => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`); });
    page.on('requestfailed', request => problems.push(`Failed request: ${request.url()}`));
    const ready = async print => {
      await page.evaluate(async print => {
        await presentationReady;
        if (print) await printReady;
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
      }, print);
    };
    await page.goto(base + '/presentation/');
    await ready(false);
    const count = await page.locator('section.slide').count();
    requireThat(count > 0, 'No slides found');
    requireThat(await page.locator('.fragment,video,audio,iframe,canvas').count() === 0,
      'This static PDF pipeline requires complete static slides; interactive/media states need explicit handling.');
    const screen = [];
    for (let i = 0; i < count; i++) {
      await page.evaluate(i => deck.slide(i), i);
      const slide = await inspectSlide(page, i);
      for (const b of slide.layout) requireThat(b.x >= -1 && b.y >= -1 && b.x + b.w <= 1281 && b.y + b.h <= 721,
        `Slide ${i + 1}: content extends beyond the slide (${b.tag})`);
      screen.push(slide);
    }
    await page.goto(base + '/presentation/?print-pdf');
    await page.emulateMedia({ media: 'print' });
    await ready(true);
    requireThat(await page.locator('.pdf-page').count() === count, 'Print page count differs from slide count');
    for (let i = 0; i < count; i++) {
      const printed = await inspectSlide(page, i);
      requireThat(JSON.stringify(printed.text) === JSON.stringify(screen[i].text), `Slide ${i + 1}: print text differs`);
      requireThat(printed.layout.length === screen[i].layout.length, `Slide ${i + 1}: print elements differ`);
      printed.layout.forEach((box, j) => {
        for (const k of ['x','y','w','h']) requireThat(Math.abs(box[k] - screen[i].layout[j][k]) <= 1.5,
          `Slide ${i + 1}: print layout differs (${box.tag}, ${k})`);
      });
    }
    const raw = await page.pdf({ printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
    requireThat(problems.length === 0, problems.join('\n'));
    const pdf = await PDFDocument.load(raw, { updateMetadata: false });
    requireThat(pdf.getPageCount() === count, 'Exported PDF page count differs');
    for (const p of pdf.getPages()) {
      const { width, height } = p.getSize();
      requireThat(Math.abs(width - 960) < 1 && Math.abs(height - 540) < 1, 'PDF page is not slide-sized 16:9');
    }
    // Avoid a new binary commit caused only by the export clock.
    const info = pdf.context.lookup(pdf.context.trailerInfo.Info);
    info.delete(PDFName.of('CreationDate')); info.delete(PDFName.of('ModDate'));
    delete pdf.context.trailerInfo.ID;
    const bytes = await pdf.save();
    const loading = getDocument({ data: bytes.slice(), useSystemFonts: true });
    const parsed = await loading.promise;
    try {
      for (let i = 0; i < count; i++) {
        const content = await (await parsed.getPage(i + 1)).getTextContent();
        const actual = normalize(content.items.map(item => item.str || '').join(' '));
        for (const expected of screen[i].text) requireThat(actual.includes(normalize(expected)),
          `PDF page ${i + 1} is missing slide text: ${expected.slice(0, 90)}; extracted: ${actual.slice(0, 400)}`);
      }
    } finally { await loading.destroy(); }
    requireThat(originalDigest === await inputsDigest(), 'Source changed during export; nothing was replaced. Run again.');
    const pdfSHA256 = hash(bytes);
    html = versionPdf(html, pdfSHA256);
    const manifest = { inputSHA256: await inputsDigest(html), pdfSHA256, slides: count, pageSize: [960,540], browser: browser.version() };
    await fs.writeFile(path.join(deckDir, pdfName), bytes);
    await fs.writeFile(path.join(deckDir, 'index.html'), html);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Exported and checked ${count} matching HTML slides/PDF pages.`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.server.close(resolve));
    await fs.rm(temp, { recursive: true, force: true });
  }
  await check();
}
const args = process.argv.slice(2);
try {
  requireThat(args.length === 0 || (args.length === 1 && args[0] === '--check'), 'Usage: node presentation/build_pdf.mjs [--check]');
  if (args[0] === '--check') await check(); else await build();
} catch (error) { console.error(error.message); process.exitCode = 1; }
