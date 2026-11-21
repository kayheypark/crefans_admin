import {test,expect} from '@playwright/test';
// 2026-11-21 유입 분석·랜딩 링크: menus, filters, empty states, link creation with a preset and live preview, archive, mobile layout.
async function login(page:import('@playwright/test').Page){
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!);await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();
}
test('유입 분석 and 랜딩 링크: view, create with preset, archive, desktop and mobile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await login(page);await page.getByRole('link',{name:'유입 분석',exact:true}).click();
 await expect(page).toHaveURL(/\/console\/traffic$/);await expect(page.getByRole('heading',{level:1,name:'유입 분석'})).toBeVisible();
 await expect(page.getByText('배포한 뒤부터 집계',{exact:false}).first()).toBeVisible();
 await expect(page.getByRole('heading',{name:'UTM별 방문'})).toBeVisible();await expect(page.getByRole('heading',{name:'일별 방문'})).toBeVisible();
 await page.getByRole('button',{name:'최근 30일',exact:true}).click();await expect(page.getByText(/· 30일 · 한국 시간/)).toBeVisible();
 await page.screenshot({path:'test-results/traffic-desktop.png',fullPage:true});

 const campaign='e2e_'+Date.now().toString(36);
 await page.getByRole('link',{name:'랜딩 링크',exact:true}).click();await expect(page).toHaveURL(/\/console\/landing-links$/);
 await page.getByRole('button',{name:'새 링크'}).click();const form=page.getByRole('dialog',{name:'새 랜딩 링크'});
 await form.getByLabel('이름',{exact:true}).fill('E2E X 광고');await form.getByRole('button',{name:/X 광고/}).click();
 await form.getByLabel('utm_campaign (필수)').fill(campaign);await form.getByLabel('utm_content (선택)').fill('cat');
 const url=`https://crefans.com/service/landing-ai-image-generation?utm_source=x&utm_medium=paid&utm_campaign=${campaign}&utm_content=cat`;
 await expect(form.locator('code.landing-link-url')).toHaveText(url);
 await form.getByLabel('utm_content (선택)').fill('c a t');await expect(form.getByText('영문·숫자·_ . - 만 40자까지 쓸 수 있어요.')).toBeVisible();await form.getByLabel('utm_content (선택)').fill('cat');
 await page.screenshot({path:'test-results/landing-link-form.png'});
 await form.getByRole('button',{name:'링크 만들기',exact:true}).click();await expect(page.getByText('링크를 만들었어요.')).toBeVisible();
 const row=page.locator('tbody tr').filter({hasText:'E2E X 광고'});await expect(row).toContainText(url);await expect(row.locator('td.number').first()).toHaveText('0');
 await page.getByRole('button',{name:'새 링크'}).click();await form.getByLabel('이름',{exact:true}).fill('중복');await form.getByRole('button',{name:/X 광고/}).click();await form.getByLabel('utm_campaign (필수)').fill(campaign);await form.getByLabel('utm_content (선택)').fill('cat');
 await form.getByRole('button',{name:'링크 만들기',exact:true}).click();await expect(form.getByRole('alert')).toContainText('같은 UTM 조합의 링크가 이미 있어요.');await form.getByRole('button',{name:'취소',exact:true}).click();
 await page.screenshot({path:'test-results/landing-links-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(row).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/landing-links-mobile.png',fullPage:true});
 await row.getByRole('button',{name:'보관',exact:true}).click();const confirm=page.getByRole('dialog',{name:'랜딩 링크 보관'});await confirm.getByRole('button',{name:'보관',exact:true}).click();
 await expect(page.getByText('링크를 보관했어요.')).toBeVisible();await expect(row).toHaveCount(0);
 await page.getByRole('button',{name:/보관됨/}).click();await expect(row).toContainText('보관됨');
 await page.goto('/console/traffic');await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/traffic-mobile.png',fullPage:true});
 expect(errors).toEqual([]);
});
