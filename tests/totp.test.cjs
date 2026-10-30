const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/totp.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);const {graceDaysLeft,groupSecret}=loaded.exports;
test('grace days follow the Korean calendar and end at the deadline',()=>{
 const now=Date.parse('2026-10-30T10:00:00+09:00');
 assert.equal(graceDaysLeft('2026-11-06T10:00:00+09:00',now),7);
 assert.equal(graceDaysLeft('2026-10-31T00:30:00+09:00',now),1,'past KST midnight is tomorrow even within 24h');
 assert.equal(graceDaysLeft('2026-10-30T23:59:00+09:00',now),0);
 assert.equal(graceDaysLeft('2026-10-30T09:59:00+09:00',now),null);
 assert.equal(graceDaysLeft('2026-10-30T10:00:00+09:00',now),null);
});
test('secret is grouped in 4-character blocks',()=>{assert.equal(groupSecret('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCD'),'ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567 ABCD');assert.equal(groupSecret('ABCDEF'),'ABCD EF');});
