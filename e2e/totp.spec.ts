import {test,expect,type Page} from '@playwright/test';
// Operator TOTP screens against an API stand-in; the server rules are covered by crefans_server admin TOTP tests.
const ok=(data:unknown)=>({status:200,contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});
const fail=(status:number,errorCode:string,errorMessage:string)=>({status,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorMessage,errorCode})});
const profile={id:'operator',name:'검수',email:'op@console-test.invalid',phone:'',role:'ADMIN',isActive:true,mustChangePassword:false,lastLogin:null,createdAt:'2026-10-01T00:00:00Z',permissions:{}};
async function fixture(page:Page,totp:{enabled:boolean;graceUntil:string|null;recoveryCodesLeft:number},handle:(path:string,body:any)=>any=()=>undefined){const calls:{path:string;body:any}[]=[],external:string[]=[];
 page.on('request',r=>{if(!/^https?:\/\/127\.0\.0\.1:/.test(r.url())&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.route('**/api/v1/admin/**',async route=>{const path=new URL(route.request().url()).pathname.replace('/api/v1',''),body=route.request().postDataJSON?.()??null;calls.push({path,body});const custom=handle(path,body);if(custom)return route.fulfill(custom);
  if(path==='/admin/me')return route.fulfill(ok({id:'operator',name:'검수',role:'ADMIN',permissions:{overview:{view:true}},totp}));if(path==='/admin/me/profile')return route.fulfill(ok(profile));if(path==='/admin/overview')return route.fulfill(ok({members:0,creators:0,posts:0,reports:0,inquiries:0,failedPayments:0,pendingWithdrawals:0,undeliveredEvents:0,jobs:[]}));return route.fulfill(ok({}));});
 return {calls,external};}
const future=(days:number)=>new Date(Date.now()+days*86400000).toISOString();
test('2차 인증 운영자는 비밀번호 다음 단계에서 6자리 코드를 입력한다 (API 대역)',async({page},info)=>{
 const {calls}=await fixture(page,{enabled:true,graceUntil:null,recoveryCodesLeft:8},(path,body)=>path!=='/admin/auth/login'?undefined:!body.code&&!body.recoveryCode?fail(401,'TOTP_REQUIRED','2차 인증 코드를 입력해주세요.'):body.code==='000000'?fail(401,'TOTP_INVALID','인증 코드가 올바르지 않습니다.'):ok({message:'ok'}));
 await page.goto('/login');await page.getByLabel('이메일').fill('op@console-test.invalid');await page.getByLabel('비밀번호').fill('password-1234');await page.getByRole('button',{name:'로그인',exact:true}).click();
 const code=page.getByLabel('인증 코드');await expect(code).toBeVisible();await expect(page.getByRole('heading',{name:'2차 인증'})).toBeVisible();
 await expect(code).toHaveAttribute('inputmode','numeric');await expect(code).toHaveAttribute('autocomplete','one-time-code');await expect(code).toHaveAttribute('maxlength','6');
 await expect(page.getByRole('button',{name:'인증하고 로그인',exact:true})).toBeDisabled();await code.fill('000000');await expect(page.locator('.login [role=alert]')).toContainText('인증 코드가 올바르지 않습니다.');
 await page.screenshot({path:info.outputPath('login-code.png')});
 await code.fill('123456');await expect(page).toHaveURL(/\/console$/);
 expect(calls.filter(c=>c.path==='/admin/auth/login').map(c=>c.body)).toEqual([{email:'op@console-test.invalid',password:'password-1234'},{email:'op@console-test.invalid',password:'password-1234',code:'000000'},{email:'op@console-test.invalid',password:'password-1234',code:'123456'}]);
 await expect(page.locator('.totp-banner')).toHaveCount(0);});
test('복구 코드 사용으로 바꾸면 복구 코드로 다시 보내고, 시도 초과는 안내한다 (API 대역)',async({page})=>{let tries=0;
 const {calls}=await fixture(page,{enabled:true,graceUntil:null,recoveryCodesLeft:7},(path,body)=>path!=='/admin/auth/login'?undefined:!body.code&&!body.recoveryCode?fail(401,'TOTP_REQUIRED','2차 인증 코드를 입력해주세요.'):++tries===1?fail(429,'TOO_MANY_REQUESTS','잠시 후 다시 시도해주세요.'):ok({message:'ok'}));
 await page.goto('/login');await page.getByLabel('이메일').fill('op@console-test.invalid');await page.getByLabel('비밀번호').fill('password-1234');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByRole('button',{name:'복구 코드 사용'}).click();await expect(page.getByLabel('인증 코드')).toHaveCount(0);await page.getByLabel('복구 코드').fill('abcde-12345');await page.getByRole('button',{name:'인증하고 로그인',exact:true}).click();
 await expect(page.locator('.login [role=alert]')).toContainText('인증 시도가 너무 많습니다.');await page.getByRole('button',{name:'인증하고 로그인',exact:true}).click();await expect(page).toHaveURL(/\/console$/);
 expect(calls.filter(c=>c.path==='/admin/auth/login').map(c=>c.body).slice(1)).toEqual([{email:'op@console-test.invalid',password:'password-1234',recoveryCode:'abcde-12345'},{email:'op@console-test.invalid',password:'password-1234',recoveryCode:'abcde-12345'}]);});
test('마이페이지에서 설정 키로 등록하고 복구 코드를 한 번 보여 준다 (API 대역)',async({page,context},info)=>{await context.grantPermissions(['clipboard-read','clipboard-write']);
 const totp={enabled:false,graceUntil:future(5) as string|null,recoveryCodesLeft:0},codes=['aaaaa-11111','bbbbb-22222','ccccc-33333','ddddd-44444','eeeee-55555','fffff-66666','ggggg-77777','hhhhh-88888'];
 const {calls,external}=await fixture(page,totp,(path,body)=>path==='/admin/me/totp/setup'?{...ok({secret:'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',otpauthUri:'otpauth://totp/crefans%20%EC%BD%98%EC%86%94%3Aop%40console-test.invalid?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=crefans&algorithm=SHA1&digits=6&period=30'}),status:201}:path==='/admin/me/totp/enable'?(body.code==='111111'?fail(401,'TOTP_INVALID','인증 코드가 올바르지 않습니다.'):(Object.assign(totp,{enabled:true,graceUntil:null,recoveryCodesLeft:8}),{...ok({message:'2차 인증을 켰습니다.',recoveryCodes:codes}),status:201})):undefined);
 await page.goto('/console/me');const section=page.locator('#totp');await expect(section).toContainText('Google Authenticator');await expect(section).toContainText('안전성 확보조치 기준');
 await section.getByRole('button',{name:'등록 시작'}).click();await expect(section.getByLabel('설정 키')).toHaveText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP');await expect(section).toContainText('otpauth://totp/crefans');
 const input=section.getByLabel('인증 코드 6자리');await expect(input).toHaveAttribute('autocomplete','one-time-code');await input.fill('111111');await section.getByRole('button',{name:'인증하고 켜기'}).click();await expect(section.getByRole('alert')).toContainText('인증 코드가 올바르지 않습니다.');
 await input.fill('123456');await section.getByRole('button',{name:'인증하고 켜기'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.locator('.recovery-codes li')).toHaveCount(8);await expect(dialog).toContainText('지금 한 번만 보여 드립니다.');await expect(dialog).toContainText('hhhhh-88888');
 await dialog.getByRole('button',{name:'복구 코드 복사'}).click();await expect(page.locator('.console-snackbar')).toContainText('복구 코드를 복사했습니다.');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(codes.join('\n'));
 await page.screenshot({path:info.outputPath('recovery-codes.png')});
 await page.keyboard.press('Escape');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'닫기'})).toBeDisabled();
 await dialog.getByLabel('복구 코드를 안전한 곳에 보관했습니다.').check();await dialog.getByRole('button',{name:'닫기'}).click();await expect(dialog).toBeHidden();
 await expect(section).toContainText('사용 중');await expect(section).toContainText('남은 복구 코드 8개');await expect(page.locator('.totp-banner')).toHaveCount(0);await expect(page.getByText('aaaaa-11111')).toHaveCount(0);
 expect(calls.filter(c=>c.path.startsWith('/admin/me/totp')).map(c=>c.body)).toEqual([{},{code:'111111'},{code:'123456'}]);expect(external).toEqual([]);});
test('미등록 운영자에게 남은 일수 배너와 마이페이지 링크를 보여 준다 (API 대역)',async({page},info)=>{await fixture(page,{enabled:false,graceUntil:future(3),recoveryCodesLeft:0});
 await page.goto('/console');const banner=page.locator('.totp-banner');await expect(banner).toContainText('3일 안에 2차 인증을 등록해야 합니다');await expect(banner).toContainText('한국 시간');await page.screenshot({path:info.outputPath('grace-banner.png')});
 await banner.getByRole('link',{name:'2차 인증 등록하기'}).click();await expect(page).toHaveURL(/\/console\/me#totp$/);await expect(page.locator('#totp').getByRole('button',{name:'등록 시작'})).toBeVisible();});
test('유예가 끝나 TOTP_ENROLLMENT_REQUIRED를 받으면 마이페이지 2차 인증으로 보낸다 (API 대역)',async({page},info)=>{const message='2차 인증(OTP)을 등록해야 콘솔을 쓸 수 있습니다.';
 await fixture(page,{enabled:false,graceUntil:new Date(Date.now()-3600000).toISOString(),recoveryCodesLeft:0},path=>path==='/admin/overview'?fail(403,'TOTP_ENROLLMENT_REQUIRED',message):undefined);
 await page.goto('/console');await expect(page).toHaveURL(/\/console\/me#totp$/);await expect(page.locator('.console-snackbar')).toContainText(message);await expect(page.locator('.totp-banner')).toContainText(message);await expect(page.locator('#totp').getByRole('button',{name:'등록 시작'})).toBeVisible();await page.screenshot({path:info.outputPath('enrollment-required.png')});});

test('붙여넣기는 유효한 6자리만 한 번 자동 제출하고 실패 후 재시도한다',async({page},info)=>{
 let attempts:string[]=[];
 await fixture(page,{enabled:true,graceUntil:null,recoveryCodesLeft:8});
 await page.route('**/api/v1/admin/auth/login',async route=>{const body=route.request().postDataJSON();if(!body.code)return route.fulfill(fail(401,'TOTP_REQUIRED','2차 인증 필요'));attempts.push(body.code);await new Promise(r=>setTimeout(r,250));return route.fulfill(body.code==='123456'?ok({message:'ok'}):fail(401,'TOTP_INVALID','인증 코드가 올바르지 않습니다.'));});
 await page.goto('/login');await page.getByLabel('이메일').fill('op@console-test.invalid');await page.getByLabel('비밀번호').fill('password-1234');await page.getByRole('button',{name:'로그인',exact:true}).click();
 const input=page.getByLabel('인증 코드');await expect(input).toBeVisible();
 const paste=async(text:string,count=1)=>input.evaluate((el,{text,count})=>{for(let i=0;i<count;i++){const data=new DataTransfer();data.setData('text/plain',text);el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));}},{text,count});
 for(const bad of ['12345','1234567','12a3456','']){await paste(bad);await expect(page.locator('.login [role=alert]')).toContainText('숫자 6자리');}
 expect(attempts).toEqual([]);
 await input.fill('00000');expect(attempts).toEqual([]);
 await paste('000 000',2);await expect(page.locator('.login [role=alert]')).toContainText('올바르지 않습니다');expect(attempts).toEqual(['000000']);
 await paste('000000');await expect.poll(()=>attempts.length).toBe(2);await expect(page.locator('.login [role=alert]')).toContainText('올바르지 않습니다');
 await page.screenshot({path:info.outputPath('otp-error.png')});
 await input.fill('');await expect(page.locator('.login [role=alert]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('otp-design.png')});
 await paste(' 123 456\n');await expect(page).toHaveURL(/\/console$/);expect(attempts).toEqual(['000000','000000','123456']);
});

 test('기본 입력창 선택·직접 입력 완료 자동제출·같은 코드 자동반복 방지',async({page},info)=>{
 const attempts:string[]=[];
 await fixture(page,{enabled:true,graceUntil:null,recoveryCodesLeft:8});
 await page.route('**/api/v1/admin/auth/login',async r=>{const b=r.request().postDataJSON();if(!b.code)return r.fulfill(fail(401,'TOTP_REQUIRED','인증 필요'));attempts.push(b.code);await new Promise(done=>setTimeout(done,200));return r.fulfill(b.code==='123456'?ok({}):fail(401,'TOTP_INVALID','인증 코드가 올바르지 않습니다.'));});
 await page.goto('/login');await page.getByLabel('이메일').fill('op@console-test.invalid');await page.getByLabel('비밀번호').fill('test-password');await page.getByRole('button',{name:'로그인',exact:true}).click();const input=page.getByLabel('인증 코드');await expect(input).toBeVisible();await input.click();await expect(input).toBeFocused();
 expect(await input.evaluate(e=>({opacity:getComputedStyle(e).opacity,userSelect:getComputedStyle(e).userSelect,type:(e as HTMLInputElement).type}))).toEqual({opacity:'1',userSelect:'text',type:'text'});
 await input.pressSequentially('00000');expect(attempts).toEqual([]);await input.pressSequentially('0');await expect(page.locator('.login [role=alert]')).toContainText('올바르지');expect(attempts).toEqual(['000000']);
 await input.evaluate(e=>{(e as HTMLInputElement).select();});expect(await input.evaluate(e=>(e as HTMLInputElement).selectionEnd)).toBe(6);
 await input.evaluate(e=>e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:'000000'})));expect(attempts).toEqual(['000000']);
 await page.getByRole('button',{name:'인증하고 로그인'}).click();await expect.poll(()=>attempts.length).toBe(2);await expect(page.locator('.login [role=alert]')).toContainText('올바르지');
 await input.fill('');await page.screenshot({path:info.outputPath('native-otp.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await input.fill('123456');await expect(page).toHaveURL(/\/console$/);expect(attempts).toEqual(['000000','000000','123456']);
 });
