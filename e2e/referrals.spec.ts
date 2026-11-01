import {test,expect,type Page} from '@playwright/test';
// Console referral management (2026-11-01) against an API stand-in; the server enforces the same rules (server tests/platform-referrals.test.cjs).
async function fixture(page:Page,permissions:Record<string,Record<string,boolean>>){const calls:{method:string;path:string;query:string;body:any}[]=[];let enabled=false;
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method(),body=method==='GET'?null:route.request().postDataJSON();calls.push({method,path:url.pathname,query:url.search,body});let data:any={};
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'ADMIN',permissions};
  else if(url.pathname.endsWith('/referrals/settings')){enabled=body.enabled;data={enabled,message:enabled?'친구 초대 보상을 켰습니다.':'친구 초대 보상을 껐습니다.'};}
  else if(url.pathname.endsWith('/referrals'))data={enabled,summary:{pending:{count:1,beans:0},qualified:{count:0,beans:0},granted:{count:1,beans:100},clawed_back:{count:0,beans:0},capped:{count:0,beans:0}},items:[{id:'r1',referrer:{id:'m1',nickname:'하늘',email:'sky@example.invalid'},member:{id:'m2',nickname:'바다',email:'sea@example.invalid'},status:'granted',rewardQuantity:100,source:'bean_charge',dueAt:null,rewardedAt:'2026-11-01T00:00:00Z',clawedBackAt:null,createdAt:'2026-10-20T00:00:00Z'}],total:1,page:1,pageSize:20};
  else if(url.pathname.endsWith('/referral'))data={code:'00000000-0000-4000-8000-000000000001',link:'https://crefans.com/service/signup?ref=00000000-0000-4000-8000-000000000001',enabled,memberActive:true};
  else if(url.pathname.endsWith('/members'))data={items:[{id:'m1',nickname:'하늘',email:'sky@example.invalid',creator:null,enabled:true,status:'CONFIRMED',created_at:'2026-10-29T00:00:00Z'}],total:1,page:1};
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});return calls;}
const full={referrals:{view:true,create:true,update:true},members:{view:true}};
test('레퍼럴 관리: 스위치를 확인 후 켜고, 목록과 상태 집계를 본다 (API 대역)',async({page},info)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const calls=await fixture(page,full);await page.goto('/console/referrals');
 const mobile=await page.getByRole('button',{name:'메뉴 열기',exact:true}).isVisible();if(mobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
 await expect(page.getByRole('navigation',{name:'주요 메뉴'}).getByRole('link',{name:/레퍼럴 관리/})).toBeVisible();
 if(mobile)await page.getByRole('button',{name:'메뉴 닫기',exact:true}).click();
 await expect(page.getByText('친구 초대 보상: 꺼짐')).toBeVisible();await expect(page.getByRole('cell',{name:/바다/})).toBeVisible();await expect(page.getByRole('cell',{name:'지급 완료'})).toBeVisible();
 await page.getByRole('button',{name:'켜기',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog).toContainText('약관·처리방침 개정본 시행 후에 켜세요');await page.screenshot({path:info.outputPath('referral-confirm.png')});await dialog.getByRole('button',{name:'켜기',exact:true}).click();
 await expect(page.getByText('친구 초대 보상: 켜짐')).toBeVisible();expect(calls.find(c=>c.method==='PUT')?.body).toEqual({enabled:true});
 await page.getByLabel('상태').selectOption('granted');await expect.poll(()=>calls.some(c=>c.path.endsWith('/referrals')&&c.query.includes('status=granted'))).toBe(true);
 if(await page.getByRole('button',{name:'알림 닫기'}).isVisible()){await page.getByRole('button',{name:'알림 닫기'}).click();await expect(page.locator('.console-snackbar')).toHaveCount(0);}
 await page.screenshot({path:info.outputPath('referrals.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);});
test('회원 목록: 회원 구분 필터와 회원별 레퍼럴 링크 생성 (API 대역)',async({page},info)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const calls=await fixture(page,full);await page.goto('/console/members');
 await page.getByLabel('회원 구분').selectOption('creator');await expect.poll(()=>calls.some(c=>c.path.endsWith('/members')&&c.query.includes('type=creator'))).toBe(true);
 await page.getByRole('button',{name:'레퍼럴 링크 생성',exact:true}).click();await expect(page.getByLabel('레퍼럴 링크')).toHaveValue(/\/service\/signup\?ref=/);await expect(page.getByText('스위치가 꺼져 있어 아직 가입에 쓰이지 않습니다.')).toBeVisible();
 expect(calls.some(c=>c.method==='POST'&&c.path.endsWith('/members/m1/referral'))).toBe(true);await page.screenshot({path:info.outputPath('members-referral.png'),fullPage:true});expect(errors).toEqual([]);});
test('권한이 없으면 레퍼럴 링크 열과 스위치 버튼이 없다 (API 대역)',async({page})=>{await fixture(page,{referrals:{view:true},members:{view:true}});await page.goto('/console/referrals');await expect(page.getByText('친구 초대 보상: 꺼짐')).toBeVisible();await expect(page.getByRole('button',{name:'켜기',exact:true})).toHaveCount(0);await page.goto('/console/members');await expect(page.getByRole('cell',{name:/sky@example/})).toBeVisible();await expect(page.getByRole('button',{name:'레퍼럴 링크 생성'})).toHaveCount(0);});

test('레퍼럴 링크 복사: 성공은 하단 스낵바, 비활성 안내 보존·실패는 인라인 (API 대역)',async({page},info)=>{
 await fixture(page,full);await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{if((window as any).denyCopy)throw new Error('denied');(window as any).copiedLink=value;}}});});
 await page.goto('/console/members');await page.getByRole('button',{name:'레퍼럴 링크 생성',exact:true}).click();const input=page.getByLabel('레퍼럴 링크'),copy=page.getByRole('button',{name:'복사',exact:true});await expect(input).toBeVisible();
 await copy.click();const snack=page.locator('.console-snackbar[data-state="open"]');await expect(snack).toContainText('레퍼럴 링크를 복사했습니다.');await expect(snack).toHaveCSS('position','fixed');expect(await page.evaluate(()=>(window as any).copiedLink)).toBe(await input.inputValue());await expect(page.getByText('스위치가 꺼져 있어 아직 가입에 쓰이지 않습니다.')).toBeVisible();await expect(snack).toHaveCSS('opacity','1');await page.screenshot({path:info.outputPath('referral-copy.png')});
 await page.getByRole('button',{name:'알림 닫기'}).click();await expect(snack).toHaveCount(0);await copy.click();await expect(snack).toBeVisible();await expect(snack).toHaveCount(0,{timeout:6000});
 await page.evaluate(()=>{(window as any).denyCopy=true;});await copy.click();await expect(page.locator('.referral-link').getByRole('alert')).toContainText('복사하지 못했습니다.');await expect(snack).toHaveCount(0);
});
