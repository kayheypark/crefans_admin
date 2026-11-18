// 2026-11-18 user decision (별도 권한 + 사유 + 감사): the console asks for a reason before revealing a member's full phone number,
// sends it in a POST body (never the URL), and shows the button to SUPER_ADMIN only. The server enforces all of it again.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../src/components/console'),phone=fs.readFileSync(path.join(dir,'MemberPhone.tsx'),'utf8'),console_=fs.readFileSync(path.join(dir,'Console.tsx'),'utf8');
test('the reveal is a POST with the reason in the body, never in the URL',()=>{
 const call=phone.match(/api<\{phone:string\}>\(([^;]*?)\)\.phone/);assert.ok(call,'reveal call found');
 assert.match(call[1],/`\/admin\/members\/\$\{encodeURIComponent\(id\)\}\/phone`,\{reason:trimmed\},'POST'/);
 assert.doesNotMatch(phone,/phone\?reason|[?&]reason=/);
});
test('a dialog asks for a 5~200 character reason before the request, with the shared action row',()=>{
 assert.match(phone,/PHONE_REASON_MIN=5,PHONE_REASON_MAX=200/);
 assert.match(phone,/<ConfirmDialog title="휴대폰 번호 전체 보기"/);assert.match(phone,/<DialogActions>/);
 assert.match(phone,/if\(busy\|\|!valid\)return;/,'no request without a valid reason');
 assert.match(phone,/disabled=\{busy\|\|!valid\}/);
});
test('the button is shown only when canReveal, and the member list passes SUPER_ADMIN only',()=>{
 assert.match(phone,/\{canReveal&&!full&&<button/);
 assert.match(console_,/<MemberPhone id=\{r\.id\} phone=\{r\.phone\?\?null\} canReveal=\{admin\.role==='SUPER_ADMIN'\}\/>/);
});
