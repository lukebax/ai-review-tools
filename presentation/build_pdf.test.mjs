// MIT. The publication gate must reject stale sources and damaged PDFs.
import { test } from 'node:test';
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
    for (const name of ['package.json','package-lock.json','preview.py']) await fs.copyFile(path.join(root,name),path.join(dir,name));
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
    await fs.rm(path.join(dir,'presentation/assets/maps/map-overview.svg'));
    const failed=run(dir,[]);
    assert.notEqual(failed.status,0,'Missing image was accepted');
    for (let i=0;i<names.length;i++) assert.deepEqual(await fs.readFile(path.join(dir,'presentation',names[i])),before[i]);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
