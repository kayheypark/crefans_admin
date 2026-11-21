const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(n=>deps[n]||require(n),m,m.exports);return m.exports;}
const stub=()=>null,m=load('src/components/console/AiPresets.tsx',{'./EmptyState':{EmptyState:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./Snackbar':{useSnackbar:()=>()=>{}}});
// 2026-11-21: console preset screen reads the service catalog; costumes show whether the Coupang link is connected.
test('console host picks the matching service site',()=>{
 assert.equal(m.frontOrigin('admin.crefans.com'),'https://crefans.com');assert.equal(m.frontOrigin('admin-dev.crefans.com'),'https://www-dev.crefans.com');assert.equal(m.frontOrigin('127.0.0.1'),'http://127.0.0.1:3000');
});
test('filters by category, search text and link state',()=>{
 const g={key:'costume',label:'코스튬',categories:[{value:'nikke',label:'니케'},{value:'general',label:'일반'}],items:[
  {id:'a',category:'nikke',title:'라피 전술복',prompt:'전술 코트',image:'/a.webp',shopUrl:'https://link.coupang.com/a/x'},
  {id:'b',category:'general',title:'리본 메이드',prompt:'메이드 코스튬',image:'/b.webp',shopUrl:null}]};
 assert.deepEqual(m.filterItems(g,'all','','all').map(i=>i.id),['a','b']);
 assert.deepEqual(m.filterItems(g,'nikke','','all').map(i=>i.id),['a']);
 assert.deepEqual(m.filterItems(g,'all','메이드','all').map(i=>i.id),['b'],'prompt/title search');
 assert.deepEqual(m.filterItems(g,'all','','linked').map(i=>i.id),['a']);assert.deepEqual(m.filterItems(g,'all','','unlinked').map(i=>i.id),['b']);
 assert.deepEqual(m.filterItems({...g,key:'pose'},'all','','linked').map(i=>i.id),['a','b'],'link filter only for costumes');
 assert.deepEqual(m.filterItems(undefined,'all','','all'),[]);
});
