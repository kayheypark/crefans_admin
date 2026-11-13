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
 // 2026-11-11: dialog buttons come from the shared DialogActions row (right-aligned, 8px gap, cancel then action).
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();const cancel=add.getByRole('button',{name:'취소',exact:true}),ok=add.getByRole('button',{name:'허용',exact:true});
 const [c,o,d]=[await cancel.boundingBox(),await ok.boundingBox(),await add.boundingBox()];expect(c&&o&&d).toBeTruthy();
 expect(o!.x-(c!.x+c!.width)).toBeGreaterThanOrEqual(7.5);expect(Math.abs(c!.y-o!.y)).toBeLessThan(1);expect(d!.x+d!.width-(o!.x+o!.width)).toBeLessThan(40);
 await page.screenshot({path:'test-results/ai-photo-mobile-dialog.png'});await cancel.click();
 await row.getByRole('button',{name:'해제',exact:true}).click();await revoke.getByLabel('해제 사유').fill('테스트 정리');await revoke.getByRole('button',{name:'해제',exact:true}).click();await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 expect(errors).toEqual([]);
});

// 2026-11-13: today's usage column, per-creator reset (off while unused) and typed-confirm reset of everyone.
test('AI photo usage: shows today count, per-creator reset is off when unused, reset-all needs reason and phrase',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await login(page);await page.getByRole('link',{name:'AI 사진 편집 허용',exact:true}).click();await expect(page).toHaveURL(/\/console\/ai-photo$/);
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();const add=page.getByRole('dialog',{name:'AI 사진 편집 허용'});
 await add.getByLabel('크리에이터 핸들').fill('console_creator');await add.getByLabel('허용 사유').fill('횟수 초기화 확인');await add.getByRole('button',{name:'허용',exact:true}).click();
 const row=page.locator('tbody tr').filter({hasText:'@console_creator'});await expect(row).toContainText(/0\/\d+회/);
 await expect(row.getByRole('button',{name:'횟수 초기화',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'오늘 횟수 전체 초기화',exact:true}).click();const all=page.getByRole('dialog',{name:'오늘 사용 횟수 전체 초기화'});
 const go=all.getByRole('button',{name:'전체 초기화',exact:true});await all.getByLabel(/그대로 입력하세요/).fill('전체 초기화');await expect(go).toBeDisabled();
 await all.getByLabel('초기화 사유').fill('점검 후 전체 복구');await expect(go).toBeEnabled();await page.screenshot({path:'test-results/ai-photo-reset-all.png'});await go.click();
 await expect(page.getByText('오늘 사용한 크리에이터가 없어 초기화할 것이 없습니다.')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(row).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/ai-photo-usage-mobile.png',fullPage:true});
 await row.getByRole('button',{name:'해제',exact:true}).click();const revoke=page.getByRole('dialog',{name:'AI 사진 편집 허용 해제'});await revoke.getByLabel('해제 사유').fill('테스트 정리');await revoke.getByRole('button',{name:'해제',exact:true}).click();await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 expect(errors).toEqual([]);
});

// 2026-11-13: storable reset tickets — grant with quantity and reason, see count and expiry, revoke remaining with a reason.
test('AI photo reset tickets: grant, list, revoke and history from the console',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await login(page);await page.getByRole('link',{name:'AI 사진 편집 허용',exact:true}).click();await expect(page).toHaveURL(/\/console\/ai-photo$/);
 await page.getByRole('button',{name:'크리에이터 허용',exact:true}).click();const add=page.getByRole('dialog',{name:'AI 사진 편집 허용'});
 await add.getByLabel('크리에이터 핸들').fill('console_creator');await add.getByLabel('허용 사유').fill('리셋권 확인');await add.getByRole('button',{name:'허용',exact:true}).click();
 const row=page.locator('tbody tr').filter({hasText:'@console_creator'});await expect(row).toContainText('0장');
 await row.getByRole('button',{name:'리셋권',exact:true}).click();const dlg=page.getByRole('dialog',{name:'@console_creator 리셋권'});
 await expect(dlg.getByText('지급한 리셋권이 없습니다.')).toBeVisible();
 await dlg.getByLabel('지급 수량(장)').fill('3');await expect(dlg.getByRole('button',{name:'3장 지급',exact:true})).toBeDisabled();
 await dlg.getByLabel('지급 사유').fill('화보 촬영 지원');await dlg.getByRole('button',{name:'3장 지급',exact:true}).click();
 await expect(page.getByText(/리셋권 3장을 지급했습니다/)).toBeVisible();await expect(dlg).toContainText('사용 가능 3장');await expect(dlg.locator('tbody tr').first()).toContainText('3/3장');
 await page.screenshot({path:'test-results/ai-photo-tickets.png'});
 await dlg.getByRole('button',{name:'회수',exact:true}).click();await expect(dlg.getByRole('button',{name:'회수',exact:true}).last()).toBeDisabled();
 await dlg.getByLabel('회수 사유').fill('지원 종료');await dlg.locator('form').getByRole('button',{name:'회수',exact:true}).click();
 await expect(page.getByText('남은 리셋권 3장을 회수했습니다.')).toBeVisible();await expect(dlg).toContainText('사용 가능 0장');await expect(dlg.locator('tbody tr').first()).toContainText('회수');
 await dlg.getByRole('button',{name:'닫기',exact:true}).click();await expect(row).toContainText('0장');
 await row.getByRole('button',{name:'이력',exact:true}).click();const history=page.getByRole('dialog',{name:'@console_creator 허용 이력'});
 await expect(history.locator('li').nth(0)).toContainText('리셋권 회수');await expect(history.locator('li').nth(1)).toContainText('리셋권 지급');await history.getByRole('button',{name:'닫기',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.reload();await row.getByRole('button',{name:'리셋권',exact:true}).click();await expect(dlg).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'test-results/ai-photo-tickets-mobile.png'});await dlg.getByRole('button',{name:'닫기',exact:true}).click();
 await row.getByRole('button',{name:'해제',exact:true}).click();const revoke=page.getByRole('dialog',{name:'AI 사진 편집 허용 해제'});await revoke.getByLabel('해제 사유').fill('테스트 정리');await revoke.getByRole('button',{name:'해제',exact:true}).click();await expect(page.getByText('아직 허용한 크리에이터가 없습니다.')).toBeVisible();
 expect(errors).toEqual([]);
});
