import {test,expect} from '@playwright/test';
async function logoutViaMyPage(page:import('@playwright/test').Page){await page.locator('.profile-link:visible').click();await expect(page.getByRole('heading',{name:'마이페이지',exact:true})).toBeVisible();await page.getByRole('button',{name:'로그아웃',exact:true}).click();}
// Second seeded super admin for newer tests, keeping each address under the sign-in rate limit.
const SECOND_ADMIN=()=>process.env.ADMIN_E2E_EMAIL!.replace('admin-','admin2-');
async function login(page:import('@playwright/test').Page,email=process.env.ADMIN_E2E_EMAIL!){
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(email);await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();
}
test('operational logs filter real records, expose correlated detail and work on mobile/dark',async({page})=>{
 await login(page);await page.getByRole('link',{name:'운영 로그',exact:true}).click();
 await page.getByLabel('시작일',{exact:true}).fill('2005-05-15');await page.getByLabel('종료일',{exact:true}).fill('2005-05-15');await page.getByLabel('접속 IP',{exact:true}).fill('198.51.100.44');await page.getByRole('button',{name:'조회',exact:true}).click();
 await expect(page.locator('.log-table tbody tr')).toHaveCount(1);await expect(page.locator('.log-table')).toContainText('refund.completed');
 await page.getByRole('button',{name:'refund.completed 상세',exact:true}).click();await expect(page.getByRole('region',{name:'로그 상세'})).toBeVisible();await expect(page.locator('.log-properties')).toContainText('audit-browser-test');await expect(page.locator('.log-timeline li')).toHaveCount(2);await expect(page.locator('.log-timeline')).toContainText('provider.result');await expect(page.locator('.log-json')).toContainText('12000');
 await page.screenshot({path:'test-results/logs-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/logs-mobile.png',fullPage:true});await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:'test-results/logs-dark.png',fullPage:true});
 const me=await page.request.get('/api/v1/admin/me'),correlation=me.headers()['x-request-id'];expect(correlation).toMatch(/^[a-f0-9-]{36}$/);
 await expect.poll(async()=>{const r=await page.request.get('/api/v1/admin/logs?requestId='+correlation),b=await r.json();return b.data.items.some((x:any)=>x.action==='admin.read'&&x.actorRole==='SUPER_ADMIN'&&x.actorId);}).toBe(true);
 const clientReport=page.waitForResponse(r=>r.url().endsWith('/api/v1/admin/client-errors'));await page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{error:new TypeError('PRIVATE_BROWSER_MESSAGE')})));const report=await clientReport;expect(report.ok()).toBe(true);expect(report.request().postData()).not.toContain('PRIVATE_BROWSER_MESSAGE');
 await page.getByLabel('접속 IP',{exact:true}).fill('203.0.113.88');await page.getByRole('button',{name:'조회',exact:true}).click();await expect(page.getByText('조건에 맞는 로그가 없습니다.',{exact:true})).toBeVisible();
 await page.route('**/api/v1/admin/logs?*',r=>r.fulfill({status:503,contentType:'application/json',headers:{'X-Request-ID':'11111111-1111-4111-8111-111111111111'},body:JSON.stringify({success:false,data:null,errorCode:'TEST_FAILURE',errorMessage:'로그 조회 실패'})}));await page.getByRole('button',{name:'새로고침',exact:true}).click();await expect(page.locator('.error[role=alert]')).toContainText('로그 조회 실패');await expect(page.locator('.log-table')).toHaveCount(0);
});
test('anonymous is sent to login, ordinary member is denied',async({page})=>{await page.goto('/console/revenue');await expect(page).toHaveURL(/\/login$/);await login(page,'fan@console-test.invalid');await expect(page.locator('.error[role=alert]')).toContainText('이메일 또는 비밀번호를 확인해주세요');expect((await page.context().cookies()).some(c=>c.name.startsWith('admin_'))).toBe(false);await expect(page).toHaveURL(/\/login$/);});
test('real login, six menus, actual database revenue, period and detail views',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page);await expect(page.getByRole('heading',{name:'대시보드',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'매출·정산',exact:true}).click();await expect(page.getByRole('heading',{name:'매출·정산',exact:true})).toBeVisible();await page.getByLabel('시작일',{exact:true}).fill('2005-05-01');await page.getByLabel('종료일',{exact:true}).fill('2005-05-31');await page.getByRole('button',{name:'조회',exact:true}).click();await expect(page.locator('.metrics')).toContainText('12,000원');await expect(page.locator('tbody')).toContainText('2005-05-15');await expect(page.locator('tbody')).toContainText('1,200원');
 await page.getByRole('button',{name:'크리에이터별',exact:true}).click();await expect(page.locator('tbody')).toContainText('테스트 크리에이터');await page.screenshot({path:'test-results/revenue-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'결제 내역',exact:true}).click();await expect(page.locator('tbody')).toContainText('결제 완료');await page.getByRole('button',{name:'출금 내역',exact:true}).click();await expect(page.getByText('표시할 데이터가 없습니다.',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'회원·크리에이터',exact:true}).click();await page.getByPlaceholder('이메일, 활동명, 회원 ID').fill('fan@console-test.invalid');await page.getByRole('button',{name:'검색',exact:true}).click();await expect(page.locator('tbody')).toContainText('fan@console-test.invalid');
 await page.getByRole('link',{name:'운영 설정',exact:true}).click();await expect(page.getByRole('heading',{name:'금융 정책',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'정책 변경',exact:true})).toBeDisabled();await expect(page.getByRole('heading',{name:'개인정보·운영정책',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'새 문서',exact:true})).toHaveCount(0);await expect(page.locator('select')).toHaveCount(0);
 await page.getByRole('link',{name:'고객지원',exact:true}).click();await expect(page.getByRole('heading',{name:'공지·FAQ',exact:true})).toBeVisible();await expect(page.locator('select option')).toHaveText(['공지사항','FAQ']);
 await logoutViaMyPage(page);await expect(page).toHaveURL(/\/login$/);expect(errors).toEqual([]);
});
test('inquiry reply persists and report resolution is audited, API failure is not a zero fallback',async({page})=>{
 await login(page);await page.getByRole('link',{name:'고객지원',exact:true}).click();const row=page.getByRole('row').filter({hasText:'브라우저 문의'});await row.getByLabel('문의 답변').fill('브라우저 자동 검증 답변');await row.getByRole('button',{name:'답변 저장'}).click();await expect(row).toContainText('답변 완료');const denied=await page.request.post('/api/v1/admin/inquiries/ignored/reply',{headers:{Origin:'https://untrusted.invalid'},data:{reply:'denied'}});expect(denied.status()).toBe(403);await page.reload();await expect(page.getByLabel('문의 답변')).toHaveValue('브라우저 자동 검증 답변');
 await page.getByRole('link',{name:'콘텐츠·신고',exact:true}).click();await page.getByLabel('신고 처리 메모').fill('합성 데이터 검증 완료');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'처리 완료',exact:true}).click();await expect(page.getByLabel('신고 처리 메모')).toHaveCount(0);
 await page.route('**/api/v1/admin/revenue?*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorCode:'TEST_FAILURE',errorMessage:'검증용 API 실패'})}));await page.getByRole('link',{name:'매출·정산',exact:true}).click();await expect(page.locator('.error[role=alert]')).toContainText('검증용 API 실패');await expect(page.locator('.metrics')).toHaveCount(0);
});
test('small viewport preserves navigation and zero data state',async({page})=>{await page.setViewportSize({width:390,height:844});await login(page);await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.getByRole('link',{name:'매출·정산',exact:true}).click();await expect(page.getByLabel('시작일',{exact:true})).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/revenue-mobile.png',fullPage:true});});

test('UBA shell: compact desktop, accessible persistent rail and header profile link',async({page})=>{
 await page.setViewportSize({width:1366,height:700});await login(page);await expect(page.getByRole('button',{name:'사이드바 접기'})).toBeVisible();await expect(page.locator('.sidebar')).toHaveCSS('width','240px');await expect(page.getByRole('img',{name:'console',exact:true})).toHaveAttribute('src','/brand/console-logo.png');await expect(page.locator('.brand-art img')).toHaveJSProperty('naturalWidth',2173);await expect(page.getByRole('heading',{name:'대시보드',exact:true})).toHaveCSS('font-size','20px');await page.evaluate(()=>document.fonts.ready);await expect(page.locator('body')).toHaveCSS('font-family',/Apple SD Gothic Neo/);
 await page.getByRole('button',{name:'사이드바 접기'}).click();await expect(page.locator('.sidebar')).toHaveCSS('width','56px');await expect(page.getByRole('link',{name:'매출·정산',exact:true})).toBeVisible();await page.getByRole('link',{name:'매출·정산',exact:true}).click();await expect(page.locator('.sidebar')).toHaveCSS('width','56px');await page.getByRole('button',{name:'사이드바 펼치기'}).click();await expect(page.locator('.sidebar')).toHaveCSS('width','240px');await expect(page.locator('.page-head .profile-link')).toBeInViewport();await expect(page.locator('.page-head').getByRole('button',{name:'로그아웃'})).toHaveCount(0);await expect(page.locator('.sidebar').getByRole('button',{name:'로그아웃'})).toHaveCount(0);await page.screenshot({path:'test-results/uba-console-desktop.png',fullPage:true});
 await page.setViewportSize({width:1200,height:420});await expect(page.locator('.page-head .profile-link')).toBeInViewport();
});
test('UBA dark theme, local brand/font assets and narrow-screen logout remain usable',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await login(page);await expect(page.locator('body')).toHaveCSS('background-color','rgb(8, 10, 13)');await expect(page.getByRole('img',{name:'console',exact:true})).toBeVisible();await expect(page.locator('.brand-art img')).toHaveCSS('filter','brightness(0) invert(1)');for(const asset of ['/brand/console-logo.png','/fonts/ibm-plex-sans-kr-korean-400-normal.woff2','/fonts/OFL.txt'])expect((await page.request.get(asset)).status()).toBe(200);
 await page.getByRole('link',{name:'매출·정산',exact:true}).click();await page.screenshot({path:'test-results/uba-console-dark.png',fullPage:true});await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await expect(page.locator('.top-profile .profile-link')).toBeVisible();await expect(page.locator('.page-head').getByRole('button',{name:'로그아웃'})).toHaveCount(0);await page.screenshot({path:'test-results/uba-console-mobile-dark.png',fullPage:true});await logoutViaMyPage(page);await expect(page).toHaveURL(/\/login$/);await expect(page.getByRole('img',{name:'console',exact:true})).toBeVisible();await page.screenshot({path:'test-results/console-login-dark.png',fullPage:true});await page.emulateMedia({colorScheme:'light'});await page.screenshot({path:'test-results/console-login-light.png',fullPage:true});
});

test('mobile drawer covers the page, marks the active item and closes across navigation, history and reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await login(page);
 const open=page.getByRole('button',{name:'메뉴 열기',exact:true}),drawer=page.locator('#console-nav'),nav=drawer.getByRole('navigation',{name:'주요 메뉴'});
 await expect(open).toHaveAttribute('aria-expanded','false');await expect(nav).toBeHidden();
 const documentRequests:string[]=[];page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documentRequests.push(r.url());});
 async function choose(label:string,heading:string){
  await open.click();await expect(nav).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>!!document.elementFromPoint(100,300)?.closest('#console-nav'))).toBe(true);expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
  await nav.getByRole('link',{name:label,exact:true}).click();await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded','false');await expect(nav).toBeHidden();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
 }
 async function active(label:string){await open.click();await expect(nav.getByRole('link',{name:label,exact:true})).toHaveAttribute('aria-current','page');await page.keyboard.press('Escape');await expect(nav).toBeHidden();}
 await choose('운영 설정','금융 정책');await active('운영 설정');
 await choose('고객지원','고객지원');await active('고객지원');
 await page.goBack();await expect(page.getByRole('heading',{name:'운영 설정',exact:true})).toBeVisible();await active('운영 설정');
 await page.goForward();await expect(page.getByRole('heading',{name:'고객지원',exact:true})).toBeVisible();await active('고객지원');expect(documentRequests).toEqual([]);
 await open.click();await page.mouse.click(370,400);await expect(nav).toBeHidden();
 await page.reload();await expect(page.getByRole('heading',{name:'고객지원',exact:true})).toBeVisible();await active('고객지원');
 await page.setViewportSize({width:1366,height:768});await expect(page.locator('.sidebar nav')).toBeVisible();await expect(open).toBeHidden();
 await page.setViewportSize({width:390,height:844});await open.click();await page.screenshot({path:'test-results/mobile-nav-drawer.png'});
});

test('dashboard uses real approvals, compares prior day and renders trends on desktop/mobile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page);
 await page.getByLabel('기준일',{exact:true}).fill('2005-05-15');await page.getByRole('button',{name:'조회',exact:true}).click();
 const metrics=page.locator('.dashboard-metrics');await expect(metrics.getByRole('article',{name:'총 구독 결제액',exact:true})).toContainText('12,000원');await expect(metrics.getByRole('article',{name:'신규 구독',exact:true})).toContainText('1건');await expect(metrics).toContainText('전일 0 · 비율 비교 없음');await expect(page.getByText('전일 하루 전체와 비교',{exact:false})).toBeVisible();
 await expect(page.locator('.trend-chart .recharts-line-curve')).toHaveCount(4);
 await page.getByText(/^일별 데이터 ·/).click();await expect(page.locator('.dashboard-data tbody tr')).toHaveCount(30);await expect(page.locator('.dashboard-data tbody tr').last()).toContainText('2005-05-15');
 await page.getByRole('button',{name:'최근 7일',exact:true}).click();await expect(page.locator('.dashboard-data tbody tr')).toHaveCount(7);await expect(page.getByRole('button',{name:'최근 7일',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByText(/^일별 데이터 ·/).click();await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'최근 90일',exact:true}).click();await page.getByText(/^일별 데이터 ·/).click();await expect(page.locator('.dashboard-data tbody tr')).toHaveCount(90);await page.getByText(/^일별 데이터 ·/).click();
 await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:'test-results/dashboard-dark.png',fullPage:true});expect(errors).toEqual([]);
 await page.route('**/api/v1/admin/dashboard?*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorCode:'TEST_FAILURE',errorMessage:'집계 API 실패'})}));await page.getByRole('button',{name:'새로고침',exact:true}).click();await expect(page.locator('.dashboard .error[role=alert]')).toContainText('집계 API 실패');await expect(page.locator('.dashboard-metrics')).toHaveCount(0);await expect(page.locator('.trend-chart')).toHaveCount(0);
});

test('creator badge grant and revoke require confirmation, persist and update the public profile',async({page})=>{
 await login(page,SECOND_ADMIN());await page.getByRole('link',{name:'회원·크리에이터',exact:true}).click();
 await page.getByLabel('회원 검색').fill('creator@console-test.invalid');await page.getByRole('button',{name:'검색',exact:true}).click();
 const row=page.locator('tbody tr').filter({hasText:'creator@console-test.invalid'});
 await expect(row.getByText('미인증',{exact:true})).toBeVisible();
 page.once('dialog',dialog=>dialog.dismiss());await row.getByRole('button',{name:'인증 부여',exact:true}).click();
 await expect(row.getByText('미인증',{exact:true})).toBeVisible();
 // An actual failed HTTP response must not produce a success state.
 await page.route('**/api/v1/admin/creators/*/verification',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorMessage:'검증용 저장 실패',errorCode:'TEST_FAILURE'})}),{times:1});
 page.once('dialog',dialog=>dialog.accept());await row.getByRole('button',{name:'인증 부여',exact:true}).click();await expect(row.getByRole('alert')).toHaveText('검증용 저장 실패');await expect(row.getByText('미인증',{exact:true})).toBeVisible();
 const result=page.waitForResponse(r=>r.url().endsWith('/verification')&&r.request().method()==='PUT');
 page.once('dialog',dialog=>dialog.accept());await row.getByRole('button',{name:'인증 부여',exact:true}).click();const response=await result;expect(response.status()).toBe(200);
 const id=response.url().split('/').at(-2)!;
 await expect(row.getByText('인증됨',{exact:true})).toBeVisible();
 expect((await(await page.request.get('http://127.0.0.1:3013/api/v1/profiles/'+id)).json()).data.isVerified).toBe(true);
 await page.reload();await expect(row.getByText('인증됨',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/creator-verification-admin.png',fullPage:true});
 page.once('dialog',dialog=>dialog.accept());await row.getByRole('button',{name:'인증 해제',exact:true}).click();await expect(row.getByText('미인증',{exact:true})).toBeVisible();
 expect((await(await page.request.get('http://127.0.0.1:3013/api/v1/profiles/'+id)).json()).data.isVerified).toBe(false);
 const logs=await(await page.request.get('/api/v1/admin/logs?entityId='+id+'&action=admin.creator_verification_changed')).json();expect(logs.data.items).toHaveLength(2);
});

test('policy change shows an i tooltip and needs the typed phrase in a dialog before submitting',async({page})=>{
 await login(page,SECOND_ADMIN());await page.waitForURL(/\/console/);await page.goto('/console/settings');
 const info=page.locator('.info-tip button');await expect(info).toBeVisible();await info.hover();await expect(page.getByRole('tooltip')).toHaveText('정책 변경 시 변경 확인 문구를 직접 타이핑해야 합니다.');await expect(page.getByRole('tooltip')).toBeVisible();
 await page.getByLabel('변경 사유').fill('E2E 확인 문구 검사');await page.getByRole('button',{name:'정책 변경',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'금융 정책 변경'});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'취소'})).toBeFocused();
 const submit=dialog.getByRole('button',{name:'정책 변경',exact:true}),phrase=dialog.getByRole('textbox');await expect(dialog.locator('label')).toContainText('계속하려면 정책 변경을 그대로 입력하세요');
 for(const wrong of['정책변경','정책 변경 ','정책'])await phrase.fill(wrong),await expect(submit).toBeDisabled();
 await phrase.fill('정책 변경');await expect(submit).toBeEnabled();await page.screenshot({path:'test-results/policy-confirm-dialog.png'});
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 // The API refuses a change without the phrase even if the dialog is bypassed.
 const r=await page.request.put('/api/v1/admin/financial-policy',{headers:{Origin:'http://127.0.0.1:3003'},data:{expectedVersion:0,platformFeeBps:2000,settlementHoldDays:7,reason:'bypass'}});expect((await r.json()).errorCode).toBe('CONFIRMATION_REQUIRED');
});

test('super admin creates a sub-operator; temporary password forces a change and menus follow the permission table',async({page,browser})=>{
 await login(page,SECOND_ADMIN());await page.waitForURL(/\/console/);await page.locator('.profile-link:visible').click();await expect(page.getByRole('heading',{name:'마이페이지',exact:true})).toBeVisible();await expect(page.getByLabel('운영자 종류')).toHaveValue('최고관리자');
 await page.goto('/console/operators');await page.getByRole('button',{name:'부운영자 추가'}).click();
 const email=`sub-${Date.now()}@operator-e2e.invalid`;await page.getByLabel('이름',{exact:true}).fill('검수 담당');await page.getByLabel('이메일 (로그인 ID)').fill(email);await page.getByLabel('전화번호').fill('010-1234-5678');
 await page.getByLabel('회원·크리에이터 입장(조회)').check();await page.getByLabel('콘텐츠·신고 수정').check();await expect(page.getByLabel('콘텐츠·신고 입장(조회)')).toBeChecked();
 await page.screenshot({path:'test-results/operator-form.png',fullPage:true});await page.getByRole('button',{name:'계정 만들기'}).click();
 const temp=(await page.locator('.temp-password code').textContent())!.trim();expect(temp.length).toBeGreaterThanOrEqual(16);await page.getByRole('button',{name:'확인했습니다'}).click();await expect(page.locator('.temp-password')).toHaveCount(0);
 await expect(page.locator('tbody tr').filter({hasText:email})).toContainText('비밀번호 변경 대기');
 const sub=await (await browser.newContext({baseURL:'http://127.0.0.1:3003'})).newPage();await sub.setViewportSize({width:390,height:844});
 await sub.goto('/login');await sub.getByLabel('이메일',{exact:true}).fill(email);await sub.getByLabel('비밀번호',{exact:true}).fill(temp);await sub.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(sub.getByRole('heading',{level:1,name:'임시 비밀번호 변경'})).toBeVisible();await sub.getByLabel('현재 비밀번호').fill(temp);await sub.getByLabel('새 비밀번호 (10자 이상)').fill('operator-pass-2026');await sub.getByLabel('새 비밀번호 확인').fill('operator-pass-2026');await sub.getByRole('button',{name:'비밀번호 변경'}).click();
 await expect(sub.getByRole('heading',{name:'운영 현황',exact:true})).toBeVisible();await expect(sub.getByRole('heading',{name:'멤버십 지표'})).toHaveCount(0);
 await sub.getByRole('button',{name:'메뉴 열기'}).click();const nav=sub.locator('#console-nav nav');await expect(nav.getByRole('link')).toHaveText(['대시보드','회원·크리에이터','콘텐츠·신고']);await sub.screenshot({path:'test-results/operator-mobile-menu.png'});
 await nav.getByRole('link',{name:'회원·크리에이터'}).click();await expect(sub.getByRole('button',{name:/인증 (부여|해제)/})).toHaveCount(0);
 await sub.goto('/console/revenue');await expect(sub.locator('main [role=alert]')).toContainText('권한이 없습니다');
 expect((await sub.request.get('/api/v1/admin/revenue')).status()).toBe(403);expect((await sub.request.get('/api/v1/admin/operators')).status()).toBe(403);
 await sub.locator('.profile-link:visible').click();await expect(sub.getByLabel('운영자 종류')).toHaveValue('부운영자');await expect(sub.getByRole('table').last()).toContainText('허용');await sub.screenshot({path:'test-results/operator-mypage-mobile.png',fullPage:true});
 page.once('dialog',d=>d.accept());await page.locator('tbody tr').filter({hasText:email}).getByRole('button',{name:'비활성화'}).click();await expect(page.locator('tbody tr').filter({hasText:email}).getByRole('button',{name:'다시 활성화'})).toBeVisible();
 expect((await sub.request.get('/api/v1/admin/me')).status()).toBe(401);await page.screenshot({path:'test-results/operators-desktop.png',fullPage:true});
});

