import {test,expect} from '@playwright/test';
// Manual payout panel (2026-10-31). Runs only with ADMIN_E2E_MANUAL_PAYOUTS=1, which starts the console API with
// MANUAL_PAYOUTS_ENABLED and seeds one unverified account and one processing withdrawal (tests/admin-console-server.cjs).
test.skip(!process.env.ADMIN_E2E_MANUAL_PAYOUTS,'manual payout mode only');
test('operator confirms the account holder and records a transfer made outside the console',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const shot=async(name:string)=>{const file=info.outputPath(name+'.png');await page.screenshot({path:file,fullPage:true});await info.attach(name,{path:file,contentType:'image/png'});};
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!.replace('admin-','admin2-'));
 await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(page).toHaveURL('/console');await page.goto('/console/revenue');
 const panel=page.locator('section.manual-payouts');await expect(panel.getByRole('heading',{name:'수동 지급'})).toBeVisible();
 const account=panel.getByRole('row').filter({hasText:'수동 지급 예금주'});await expect(account).toContainText('****4321');
 const withdrawal=panel.getByRole('row').filter({hasText:'123,400원'});await expect(withdrawal).toContainText('이체 대기');
 await panel.scrollIntoViewIfNeeded();await shot('01-queue');
 page.once('dialog',d=>d.accept('통장 사본 예금주 일치 확인'));await account.getByRole('button',{name:'예금주 확인 완료'}).click();
 await expect(panel.getByRole('status')).toHaveText('계좌 확인을 기록했습니다.');await expect(account).toHaveCount(0);await shot('02-account-confirmed');
 await withdrawal.getByRole('button',{name:'이체 완료 기록'}).click();const form=panel.getByRole('form',{name:'이체 완료 기록'});
 await expect(form.getByRole('button',{name:'기록',exact:true})).toBeVisible();await form.getByRole('button',{name:'기록',exact:true}).click();
 await expect(form.getByLabel('이체 참조번호')).toBeFocused();// required reference blocks an empty record
 await form.getByLabel('이체 참조번호').fill('QA-BANK-REF-1');await shot('03-transfer-form');await form.getByRole('button',{name:'기록',exact:true}).click();
 await expect(panel.getByRole('status')).toHaveText('이체 완료를 기록했습니다.');await expect(withdrawal).toHaveCount(0);await shot('04-recorded');// other suites may leave open requests in the shared test DB, so check the row is gone rather than an empty list
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
