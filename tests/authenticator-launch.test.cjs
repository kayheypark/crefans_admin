const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/authenticator-launch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);const {authenticatorLink}=loaded.exports;
test('iPhone and desktop-mode iPad get a data-free app launch attempt',()=>{
 assert.equal(authenticatorLink('Mozilla iPhone CriOS'),'googleauthenticator://');
 assert.equal(authenticatorLink('Mozilla Macintosh',5),'googleauthenticator://');
});
test('desktop and Android do not receive an unsupported provisioning intent',()=>{
 for(const ua of ['Mozilla Macintosh','Mozilla Windows','Mozilla Android'])assert.equal(authenticatorLink(ua),null);
});
