// MIT. Capture the actual standalone map for the presentation, including its tool names and key.
import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,'..');
const out=path.join(here,'assets/maps'), manifestPath=path.join(out,'captures.json');
const captureAppearance={theme:'light',palette:'balanced'};
const views=[
 {file:'map-overview.png',groups:[]},
 {file:'map-rule-unsupervised.png',groups:['rule-based','unsupervised']},
 {file:'map-supervised.png',groups:['supervised']},
 {file:'map-llm.png',groups:['generative']}
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash=hash(await fs.readFile(path.join(root,'map/index.html')));
const builderHash=hash(await fs.readFile(fileURLToPath(import.meta.url)));
async function check(){
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 assert.equal(manifest.sourceSHA256,sourceHash,'Map captures are stale: run npm run build:map-images.');
 assert.equal(manifest.builderSHA256,builderHash,'Map capture settings changed: run npm run build:map-images.');
 assert.deepEqual(manifest.images.map(({file,groups})=>({file,groups})),views);
 for(const image of manifest.images)assert.equal(hash(await fs.readFile(path.join(out,image.file))),image.sha256,`Changed map image: ${image.file}`);
 console.log('Four actual-map captures match the map source and their recorded files.');
}
if(process.argv.includes('--check')) {await check();process.exit(0);}

const data=JSON.parse(await fs.readFile(path.join(root,'map/map-data.json'),'utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:2,colorScheme:'light'});
 // The presentation keeps its approved light appearance, independent of viewer preferences.
 await page.addInitScript(appearance=>localStorage.setItem('ai-review-tools-appearance',JSON.stringify(appearance)),captureAppearance);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const images=[];
 for(const view of views){
  await page.goto(pathToFileURL(path.join(root,'map/index.html')).href);
  await page.locator('#map-body .cell-button').first().waitFor();
  assert.deepEqual(await page.evaluate(()=>({theme:document.documentElement.dataset.theme,palette:document.documentElement.dataset.palette})),captureAppearance);
  if(view.groups.length){
   await page.locator('#group-filter-summary').click();
   for(const group of view.groups)await page.locator(`#group-filter input[value="${group}"]`).check();
   await page.keyboard.press('Escape');
  }
  await page.mouse.move(0,0);
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);document.activeElement?.blur();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const shown=await page.locator('#map-head .tool-row th').evaluateAll(nodes=>nodes.map(n=>n.dataset.tool));
  const expected=data.tools.filter(t=>!view.groups.length||view.groups.includes(t.groupId));
  assert.deepEqual(shown,expected.map(t=>t.id));
  assert.deepEqual(await page.locator('#map-body > tr > th').allTextContents(),data.stages);
  const cells=await page.locator('#map-body .cell-button').evaluateAll(nodes=>nodes.map(n=>({tool:n.dataset.tool,stage:n.dataset.stage,categories:n.dataset.categories,filtered:n.classList.contains('filtered-out')})));
  assert.equal(cells.length,expected.length*data.stages.length);
  for(const cell of cells){
   const recs=[...new Set(expected.find(t=>t.id===cell.tool).functions.filter(f=>f.stage===cell.stage).map(f=>f.recommendation))];
   recs.sort((a,b)=>data.recommendations.findIndex(r=>r.id===a)-data.recommendations.findIndex(r=>r.id===b));
   assert.equal(cell.categories,recs.join(','));assert.equal(cell.filtered,false);
  }
  const clip=await page.evaluate(()=>{
   const map=document.getElementById('map-scroll');
   if(map.scrollWidth>map.clientWidth+2)throw new Error('Capture would omit map columns');
   const rects=[map,...document.querySelectorAll('#recommendation-key legend,#recommendation-filters button')].map(e=>e.getBoundingClientRect());
   const left=Math.floor(Math.min(...rects.map(r=>r.left))),top=Math.floor(rects[0].top);
   return {x:left,y:top,width:Math.ceil(Math.max(...rects.map(r=>r.right)))-left,height:Math.ceil(Math.max(...rects.map(r=>r.bottom)))-top};
  });
  const png=await page.screenshot({clip,animations:'disabled'});
  await fs.writeFile(path.join(out,view.file),png);
  images.push({...view,width:clip.width*2,height:clip.height*2,sha256:hash(png),tools:shown.length,stages:data.stages.length});
  console.log(`${view.file}: actual map, ${shown.length} tools, all ${data.stages.length} stages, ${clip.width*2} × ${clip.height*2}`);
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(manifestPath,JSON.stringify({sourceSHA256:sourceHash,builderSHA256:builderHash,browser:browser.version(),images},null,2)+'\n');
}finally{await browser.close();}
await check();
