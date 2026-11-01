const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/korean.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);const {objectParticle,withParticle,hasFinalConsonant}=loaded.exports;
test('을/를 follows the final consonant of the last Hangul syllable',()=>{
 for(const [word,expected]of[['정책 변경','정책 변경을'],['출금 승인','출금 승인을'],['계정 삭제','계정 삭제를'],['수수료','수수료를'],['환불 처리','환불 처리를'],['탈퇴','탈퇴를'],['정산 완료','정산 완료를'],['지급','지급을']])assert.equal(objectParticle(word),expected,word);
});
test('trailing spaces/punctuation are skipped and digits read as Sino-Korean numbers',()=>{
 assert.equal(objectParticle('정책 변경 '),'정책 변경 을');assert.equal(hasFinalConsonant('정책 변경)'),true);
 for(const [word,expected]of[['1000','1000을'],['20','20을'],['2','2를'],['15','15를'],['3','3을'],['9','9를']])assert.equal(objectParticle(word),expected,word);
});
test('unknown endings show both forms instead of guessing; other particle pairs reuse the same rule',()=>{
 assert.equal(objectParticle('DELETE'),'DELETE을(를)');assert.equal(objectParticle(''),'을(를)');
 assert.equal(withParticle('정책','이','가'),'정책이');assert.equal(withParticle('수수료','이','가'),'수수료가');
 // Negative control: the wrong particle is never produced for these words.
 assert.notEqual(objectParticle('정책 변경'),'정책 변경를');assert.notEqual(objectParticle('수수료'),'수수료을');
});
