import {test,expect} from '@playwright/test';
// Studio AI photo editor allow-list (2026-11-08): grant with a reason, history, revoke with a reason, mobile layout.
async function login(page:import('@playwright/test').Page){
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!);await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();
}
test('AI photo allow-list: grant, history and revoke with reasons, on desktop and mobile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await login(page);await page.getByRole('link',{name:'AI 사진 편집 허용',exact:true}).click();
 await expect(page).toHaveURL(/\/console\/ai-photo$/);await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();const add=page.getByRole('dialog',{name:'AI 사진 편집 허용'});
 await add.getByLabel('크리에이터 핸들').fill('@Console_Creator');await add.getByLabel('허용 사유').fill('가');await expect(add.getByRole('button',{name:'허용',exact:true})).toBeDisabled();
 await add.getByLabel('허용 사유').fill('코스프레 화보 시범 운영 대상');await add.getByRole('button',{name:'허용',exact:true}).click();
 await expect(page.getByText('@console_creator에게 AI 사진 편집을 허용했습니다.')).toBeVisible();
 const row=page.locator('tbody tr').filter({hasText:'@console_creator'});await expect(row).toContainText('코스프레 화보 시범 운영 대상');await expect(row).toContainText('테스트 크리에이터');
 await page.screenshot({path:'test-results/ai-photo-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();await add.getByLabel('크리에이터 핸들').fill('console_creator');await add.getByLabel('허용 사유').fill('중복 확인');await add.getByRole('button',{name:'허용',exact:true}).click();
 await expect(add.getByRole('alert')).toContainText('이미 허용된 크리에이터입니다.');await add.getByRole('button',{name:'취소',exact:true}).click();
 await row.getByRole('button',{name:'해제',exact:true}).click();const revoke=page.getByRole('dialog',{name:'AI 사진 편집 허용 해제'});
 await expect(revoke.getByRole('button',{name:'해제',exact:true})).toBeDisabled();await revoke.getByLabel('해제 사유').fill('시범 운영 종료');await revoke.getByRole('button',{name:'해제',exact:true}).click();
 await expect(page.getByText('AI 사진 편집 허용을 해제했습니다.')).toBeVisible();await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 // History stays after revoking: grant again to reach the row, then open its history.
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();await add.getByLabel('크리에이터 핸들').fill('console_creator');await add.getByLabel('허용 사유').fill('재허용 확인');await add.getByRole('button',{name:'허용',exact:true}).click();
 await row.getByRole('button',{name:'이력',exact:true}).click();const history=page.getByRole('dialog',{name:'@console_creator 허용 이력'});
 await expect(history.locator('li')).toHaveCount(3);await expect(history.locator('li').nth(1)).toContainText('시범 운영 종료');await history.getByRole('button',{name:'닫기',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(row).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/ai-photo-mobile.png',fullPage:true});
 await row.getByRole('button',{name:'해제',exact:true}).click();await revoke.getByLabel('해제 사유').fill('테스트 정리');await revoke.getByRole('button',{name:'해제',exact:true}).click();await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 expect(errors).toEqual([]);
});
