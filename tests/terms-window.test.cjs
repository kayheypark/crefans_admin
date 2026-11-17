// 2026-11-17 user decision: a special-terms end date applies through that whole KST day (확인서 '종료일까지').
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/terms-window.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);const {dayIso,endIso,endDay,kstDay}=loaded.exports;
test('end date is stored as the next day 00:00 KST and shown back as the chosen day',()=>{
 assert.equal(endIso('2026-11-30'),'2026-11-30T15:00:00.000Z');
 assert.equal(endDay(endIso('2026-11-30')),'2026-11-30');
 const end=new Date(endIso('2026-11-30')),lastMinute=new Date('2026-11-30T23:59:00+09:00'),nextDay=new Date('2026-12-01T00:00:00+09:00');
 assert.ok(lastMinute<end,'the whole end day is still special terms');assert.ok(!(nextDay<end),'the next day is back to base terms');
 assert.equal(dayIso('2026-11-30'),'2026-11-29T15:00:00.000Z');assert.equal(kstDay(dayIso('2026-11-30')),'2026-11-30');
 assert.equal(endIso(''),null);assert.equal(endIso('30/11/2026'),'invalid');assert.equal(endDay(null),'');
});
