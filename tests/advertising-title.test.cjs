const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/advertising-title.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);const {advertisingTitle}=loaded.exports;
test('기간 2배 상품은 총기간을 나누고 기본 상품은 유지한다',()=>{
 for(const total of [2,4,6,14,60])assert.equal(advertisingTitle({name:'주목할 크리에이터 '+total+'일 · 기간 2배',durationDays:total}),`주목할 크리에이터 (${total/2}일+${total/2}일)`);
 for(const name of ['주목할 크리에이터 3일','다른 상품','주목할 크리에이터 3일 · 기간 2배'])assert.equal(advertisingTitle({name,durationDays:3}),name);
 assert.equal(advertisingTitle({name:'주목할 크리에이터(2일+2일)',durationDays:4}),'주목할 크리에이터 (2일+2일)');
});
