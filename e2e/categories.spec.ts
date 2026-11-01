import {test,expect,type Page} from '@playwright/test';
const prefix=()=>`cat-ui-${process.env.ADMIN_E2E_EMAIL!.slice(6,22)}-`;
async function openSettings(page:Page){
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!.replace('admin-','admin3-'));
 await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(page).toHaveURL('/console');await page.goto('/console/settings#categories');await expect(page.getByRole('heading',{name:'활동 분야 관리'})).toBeVisible();
}
test('real category addition persists, rejects duplicates and reaches creator choices on desktop/mobile',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await openSettings(page);
 const area=page.locator('#categories'),input=area.getByLabel('분야 이름'),button=area.getByRole('button',{name:'분야 추가',exact:true}),name=prefix()+info.project.name+'-desktop';
 await expect(button).toBeDisabled();await input.fill('   ');await expect(button).toBeDisabled();await input.fill(name);await button.click();
 await expect(area.getByRole('row').filter({hasText:name})).toContainText('사용 중');await expect(input).toHaveValue('');
 await page.reload();await expect(area.getByRole('row').filter({hasText:name})).toHaveCount(1);
 await input.fill(name);await button.click();await expect(area.getByRole('alert')).toContainText('이미 등록된 분야');await expect(input).toHaveValue(name);await expect(area.getByRole('row').filter({hasText:name})).toHaveCount(1);
 await page.screenshot({path:'test-results/categories-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});const mobile=prefix()+info.project.name.slice(0,1)+'가'.repeat(15);expect(mobile.length).toBe(40);
 await input.fill(mobile);await button.click();await expect(area.getByRole('row').filter({hasText:mobile})).toContainText('사용 중');await expect(area.getByRole('alert')).toHaveCount(0);
 await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await expect(input).toHaveAttribute('maxlength','40');
 await expect(page.locator('.nav-drawer')).toHaveCSS('visibility','hidden');await expect.poll(()=>page.locator('.nav-drawer').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
 await page.screenshot({path:'test-results/categories-mobile.png',fullPage:true});
 const bootstrap=await page.request.get('http://127.0.0.1:3013/api/v1/bootstrap');expect(bootstrap.ok()).toBe(true);expect((await bootstrap.json()).data.data.categories).toEqual(expect.arrayContaining([name,mobile]));expect(errors).toEqual([]);
});
test('category form retains input on failure and distinguishes failed, empty and read-only lists',async({page})=>{
 await openSettings(page);const area=page.locator('#categories');
 await page.route('**/api/v1/admin/categories',async route=>{
  if(route.request().method()==='POST')return route.fulfill({status:503,json:{success:false,data:null,errorCode:'TEST_FAILURE',errorMessage:'검증용 저장 실패'}});
  return route.fulfill({json:{success:true,data:[]}});
 });
 await area.getByRole('button',{name:'목록 새로고침'}).click();await expect(area.getByText('등록된 활동 분야가 없습니다.')).toBeVisible();
 await area.getByLabel('분야 이름').fill('실패 시 유지');await area.getByRole('button',{name:'분야 추가',exact:true}).click();await expect(area.getByRole('alert')).toContainText('검증용 저장 실패');await expect(area.getByLabel('분야 이름')).toHaveValue('실패 시 유지');
 await page.unroute('**/api/v1/admin/categories');await page.route('**/api/v1/admin/categories',route=>route.fulfill({status:503,json:{success:false,data:null,errorCode:'TEST_FAILURE',errorMessage:'검증용 조회 실패'}}));
 await area.getByRole('button',{name:'목록 새로고침'}).click();await expect(area.getByRole('alert').filter({hasText:'검증용 조회 실패'})).toBeVisible();await expect(area.getByText('등록된 활동 분야가 없습니다.')).toHaveCount(0);
 await page.unroute('**/api/v1/admin/categories');await area.getByRole('button',{name:'다시 시도'}).click();await expect(area.getByRole('table')).toBeVisible();
 // UI permission projection only; real server authorization is covered in platform-admin-console.test.cjs.
 await page.route('**/api/v1/admin/me',async route=>{const response=await route.fetch(),body=await response.json();body.data.permissions={content:{view:true}};await route.fulfill({response,json:body});});
 await page.reload();await expect(area.getByText('조회만 가능합니다.',{exact:false})).toBeVisible();await expect(area.getByRole('form')).toHaveCount(0);await expect(page.getByRole('heading',{name:'금융 정책',exact:true})).toHaveCount(0);
 if((page.viewportSize()?.width||1280)<=1079)await page.getByRole('button',{name:'메뉴 열기'}).click();
 await expect(page.getByRole('link',{name:'운영 설정',exact:true})).toBeVisible();await expect(area.getByRole('table')).toBeVisible();
});
