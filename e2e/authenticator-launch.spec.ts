import {test,expect} from '@playwright/test';
test('app fallback preserves OTP and recovery entry',async({page},info)=>{
 let attempts=0;
 await page.route('**/api/v1/admin/auth/login',async route=>{
  attempts++;const data=route.request().postDataJSON();
  await route.fulfill({status:401,json:{success:false,errorCode:data.code?'TOTP_INVALID':'TOTP_REQUIRED',errorMessage:data.code?'코드를 확인해 주세요.':'2차 인증 필요'}});
 });
 await page.goto('/login');
 await page.getByLabel('이메일').fill('test@example.invalid');await page.getByLabel('비밀번호').fill('test-only-password');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(page.getByRole('heading',{name:'2차 인증',exact:true})).toBeVisible();
 const link=page.getByRole('link',{name:'Google Authenticator 열기'});
 if(info.project.name==='iphone')await expect(link).toHaveAttribute('href','googleauthenticator://');else await expect(link).toHaveCount(0);
 await page.getByLabel('인증 코드',{exact:true}).fill('123456');
 await expect(page.locator('main').getByRole('alert')).toHaveText('코드를 확인해 주세요.');expect(attempts).toBe(2);
 await page.getByRole('button',{name:'복구 코드 사용',exact:true}).click();await expect(link).toHaveCount(0);await expect(page.getByLabel('복구 코드',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'인증 앱 코드 사용',exact:true}).click();await expect(page.getByLabel('인증 코드',{exact:true})).toHaveValue('123456');expect(attempts).toBe(2);
});
