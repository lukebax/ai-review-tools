// MIT. The publication gate must reject stale sources and damaged PDFs.
import { test } from 'node:test';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { updateSlideFooters, checkSlideFooters, PARTS } from './slide_structure.mjs';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (directory, args = ['--check']) => spawnSync(process.execPath,
  [path.join(directory, 'presentation/build_pdf.mjs'), ...args], { encoding: 'utf8', timeout: 90000 });

test('the current pair passes, and stale/corrupt copies are rejected', async () => {
  const initial = run(root);
  assert.equal(initial.status, 0, initial.stderr);
  // Keep the temporary package beside dependencies only via an explicit symlink.
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'pdf-alignment-test-'));
  try {
    await fs.cp(path.join(root, 'presentation'), path.join(dir, 'presentation'), { recursive: true });
    for (const name of ['package.json','package-lock.json']) await fs.copyFile(path.join(root,name),path.join(dir,name));
    await fs.symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
    assert.equal(run(dir).status, 0);
    for (const [name, change, reason] of [
      ['presentation/index.html', text => text.replace('Navigating AI in Evidence Synthesis','Changed presentation title'), 'HTML'],
      ['presentation/assets/theme.css', text => text + '\n/* changed styling */', 'CSS'],
      ['presentation/assets/images/site-qr.svg', text => text + '\n', 'image'],
      ['presentation/navigating-ai-evidence-synthesis.pdf', () => 'damaged PDF', 'PDF']
    ]) {
      const p=path.join(dir,name), original=await fs.readFile(p);
      await fs.writeFile(p,change(original.toString()));
      assert.notEqual(run(dir).status,0,`${reason} change passed unexpectedly`);
      await fs.writeFile(p,original);
    }
    // A failed export must not replace the existing HTML, PDF or provenance manifest.
    const names=['index.html','navigating-ai-evidence-synthesis.pdf','pdf-build.json'];
    const before=await Promise.all(names.map(n=>fs.readFile(path.join(dir,'presentation',n))));
    const cssPath=path.join(dir,'presentation/assets/theme.css');
    const css=await fs.readFile(cssPath);
    await fs.appendFile(cssPath,'\n@media print { section.slide img { display:none!important } }');
    const hidden=run(dir,[]);
    assert.notEqual(hidden.status,0,'Print-only missing graphics were accepted');
    assert.match(hidden.stderr,/print layout differs/);
    for (let i=0;i<names.length;i++) assert.deepEqual(await fs.readFile(path.join(dir,'presentation',names[i])),before[i]);
    await fs.writeFile(cssPath,css);
    // Presenter notes must remain hidden even if slide styling is changed later.
    await fs.appendFile(cssPath,'\n@media print { aside.notes { display:block!important } }');
    const leaked=run(dir,[]);
    assert.notEqual(leaked.status,0,'Visible presenter notes were accepted');
    assert.match(leaked.stderr,/presenter notes missing or visible/);
    for (let i=0;i<names.length;i++) assert.deepEqual(await fs.readFile(path.join(dir,'presentation',names[i])),before[i]);
    await fs.writeFile(cssPath,css);
    const htmlPath=path.join(dir,'presentation/index.html');
    const sourceHtml=await fs.readFile(htmlPath,'utf8');
    assert(sourceHtml.includes('broad landscape'));
    await fs.writeFile(htmlPath,sourceHtml.replace('broad landscape','altered approved speech'));
    const altered=run(dir,[]);
    assert.notEqual(altered.status,0,'An independently changed script passage was accepted');
    assert.match(altered.stderr,/presenter script differs from the approved passage/);
    for (let i=1;i<names.length;i++) assert.deepEqual(await fs.readFile(path.join(dir,'presentation',names[i])),before[i]);
    await fs.writeFile(htmlPath,sourceHtml);
    await fs.rm(path.join(dir,'presentation/assets/maps/map-overview.png'));
    const failed=run(dir,[]);
    assert.notEqual(failed.status,0,'Missing image was accepted');
    for (let i=0;i<names.length;i++) assert.deepEqual(await fs.readFile(path.join(dir,'presentation',names[i])),before[i]);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});


test('presenter controls sync slides and reset long notes without exposing speech', async () => {
  const server=createServer(async (request,response)=>{
    try {
      const pathname=new URL(request.url,'http://localhost').pathname;
      const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
      assert(file.startsWith(root+path.sep));
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
      response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:1200,height:800}});
    const errors=[];
    context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
    const page=await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/presentation/`);
    await page.evaluate(()=>presentationReady);
    const footers=await page.locator('section.slide .slide-footer').allTextContents();
    assert.deepEqual(footers.map(text=>text.match(/\d+\s*\/\s*\d+/)?.[0]),
      footers.map((_,index)=>`${index+1} / ${footers.length}`),'Footer numbers must follow actual order, including link-bearing footers');
    assert.equal(await page.locator('.reveal > .slide-number:visible').count(),0,'Only the footer counter should be visible');
    const labels=await page.locator('section.slide').evaluateAll(slides=>slides.map(slide=>slide.querySelector('.part-label')?.textContent || ''));
    assert.deepEqual(labels,['',...Array(7).fill(`1 · ${PARTS[0].title}`),...Array(5).fill(`2 · ${PARTS[1].title}`),...Array(4).fill(`3 · ${PARTS[2].title}`),...Array(3).fill(`4 · ${PARTS[3].title}`),''],'Each content slide needs its agreed part label');
    let opening=page.waitForEvent('popup');
    await page.keyboard.press('s');
    const notes=await opening;
    await notes.waitForSelector('.speaker-controls-notes [data-note="speech"]');
    await page.evaluate(()=>deck.slide(deck.getIndices(document.getElementById('verification-validation')).h));
    await notes.waitForFunction(()=>document.querySelector('.speaker-controls-notes .value').innerText.startsWith('Slide 8 ·'));
    await notes.evaluate(()=>document.getElementById('speaker-controls').scrollTop=99999);
    assert(await notes.evaluate(()=>document.getElementById('speaker-controls').scrollTop)>0);
    // This forwards a synthetic key event into the slide iframe.
    await notes.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>deck.getCurrentSlide().id==='map-overview');
    await notes.waitForFunction(()=>document.querySelector('.speaker-controls-notes .value').innerText.startsWith('Slide 9 ·'));
    assert.equal(await notes.evaluate(()=>document.getElementById('speaker-controls').scrollTop),0);
    assert.equal(await page.locator('aside.notes:visible').count(),0);
    await page.evaluate(()=>deck.slide(deck.getIndices(document.getElementById('screening-tasks')).h));
    await notes.waitForFunction(()=>document.querySelector('.speaker-controls-notes .value').innerText.startsWith('Slide 15 ·'));
    assert.equal(await notes.locator('.speaker-controls-notes [data-note="speech"]').count(),4);
    assert.equal(await page.locator('aside.notes [data-note="cue"]').count(),0);
    assert.equal(await notes.frameLocator('#current-slide iframe').locator('.toolbar').isVisible(),false);
    await notes.close();
    opening=page.waitForEvent('popup');
    await page.getByRole('button',{name:'Presenter notes',exact:true}).click();
    const reopened=await opening;
    await reopened.waitForSelector('.speaker-controls-notes [data-note="speech"]');
    await reopened.close();
    assert.deepEqual(errors,[]);
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});


test('footer generation repairs the linked-map variant and follows reordered sections', async () => {
  const html=await fs.readFile(path.join(root,'presentation/index.html'),'utf8');
  checkSlideFooters(html);
  const stale=html.replace(/(<section[^>]*id="map-overview"[\s\S]*?<span class="slide-count">)9 \/ 21/, '$1'+'7 / 21');
  assert.notEqual(stale,html,'The regression fixture must corrupt the linked overview footer');
  assert.throws(()=>checkSlideFooters(stale),/Slide footers do not match/);
  assert.equal(updateSlideFooters(stale),html,'Generation must repair the original counter defect');
  const sections=[...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
  const moved=html.replace(sections.slice(9,11).join('\n'),sections.slice(9,11).reverse().join('\n'));
  assert.notEqual(moved,html);
  const repaired=updateSlideFooters(moved);
  checkSlideFooters(repaired);
  const reordered=[...repaired.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
  assert.match(reordered[9],/id="map-supervised"/);
  assert.match(reordered[9],/<span class="slide-count">10 \/ 21<\/span>/);
  assert.match(reordered[10],/id="map-rule-unsupervised"/);
  assert.match(reordered[10],/<span class="slide-count">11 \/ 21<\/span>/);
  assert.match(reordered[8],/<a[^>]*href="https:\/\/lukebax.github.io\/ai-review-tools\//,'The map footer link must survive generation');
});
