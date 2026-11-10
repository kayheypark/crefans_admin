// 2026-11-11 user decision: every console dialog uses the shared DialogActions row (right-aligned, gap, cancel first).
// A hand-written action row inside a dialog drifts (the AI photo modal had touching, left-aligned buttons).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../src/components/console'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.tsx'));
test('only DialogActions writes the dialog-actions class',()=>{
 const bad=files.filter(f=>f!=='TypedConfirm.tsx'&&fs.readFileSync(path.join(dir,f),'utf8').includes('dialog-actions'));
 assert.deepEqual(bad,[]);});
test('no plain action row with buttons inside a ConfirmDialog',()=>{
 const bad=[];for(const f of files){const s=fs.readFileSync(path.join(dir,f),'utf8');
  for(const m of s.matchAll(/<ConfirmDialog\b[\s\S]*?<\/ConfirmDialog>/g))if(/<div className="actions">(?:(?!<\/div>)[\s\S])*<button/.test(m[0]))bad.push(f);}
 assert.deepEqual(bad,[]);});
