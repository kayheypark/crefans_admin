import {test,expect,type Page} from '@playwright/test';
// Membership withdrawal reject (2026-11-07) against an API stand-in. The server marks rejectable rows and checks the same
// condition again on POST /admin/withdrawals/:id/reject (server tests/platform-manual-payouts.test.cjs, platform-payment-lifecycle.test.cjs).
const row=(id:string,amount:number,status:string,rejectable:boolean)=>({id,creator_id:'creator-'+id,amount,status,note:null,account_label:'테스트은행 · •••• 1234',created_at:'2026-11-03T01:00:00Z',updated_at:'2026-11-03T01:00:00Z',rejectable});
const items=[row('w-neg',90000,'requested',true),row('w-ok',50000,'requested',false),row('w-run',70000,'processing',false)];
async function fixture(page:Page,permissions:Record<string,Record<string,boolean>>,options:{manual?:boolean;fail?:{status:number;code:string;message:string}}={}){
 const calls:string[]=[],bodies:string[]=[];let rejected=false;
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method();calls.push(method+' '+url.pathname+url.search);let data:unknown={};
  if(url.pathname.endsWith('/reject')){bodies.push(route.request().postData()||'');
   if(options.fail)return route.fulfill({status:options.fail.status,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorMessage:options.fail.message,errorCode:options.fail.code})});
   rejected=true;data={message:'출금 신청을 반려했습니다.'};}
  else if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'ADMIN',permissions,manualPayouts:!!options.manual};
  else if(url.pathname.endsWith('/revenue'))data={summary:{count:0,gross:0,refunds:0,netSales:0,platformFees:0,creatorNet:0},daily:[],creators:{items:[],total:0}};
  else if(url.pathname.endsWith('/payments'))data={items:[],total:0,page:1,pageSize:20};
  else if(url.pathname.endsWith('/withdrawals'))data={items:items.map(w=>w.id==='w-neg'&&rejected?{...w,status:'rejected',rejectable:false}:w).filter(w=>url.searchParams.get('status')!=='open'||['requested','processing'].includes(w.status)),total:3,page:1,pageSize:20};
  else if(url.pathname.endsWith('/settlement-accounts'))data=[];
  else if(url.pathname.endsWith('/overview'))data={members:0,creators:0,posts:0,reports:0,inquiries:0,failedPayments:0,pendingWithdrawals:0,undeliveredEvents:0,jobs:[]};
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
 return{calls,bodies};}
async function openWithdrawals(page:Page){await page.goto('/console/revenue');await page.getByRole('button',{name:'출금 내역'}).click();}
const tableRow=(page:Page,id:string)=>page.getByRole('row').filter({hasText:id});

test('출금 내역: 서버가 반려 가능으로 표시한 접수 건에만 반려 버튼, 사유 입력 후 반려 (API 대역)',async({page},info)=>{
 const errors:string[]=[],native:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{native.push(d.message());void d.dismiss();});
 const {calls,bodies}=await fixture(page,{revenue:{view:true,create:true}});await openWithdrawals(page);
 await expect(tableRow(page,'w-neg')).toContainText('90,000원');
 await expect(tableRow(page,'w-neg').getByRole('button',{name:'반려'})).toHaveCount(1);
 await expect(tableRow(page,'w-ok').getByRole('button',{name:'반려'})).toHaveCount(0);
 await expect(tableRow(page,'w-run').getByRole('button',{name:'반려'})).toHaveCount(0);
 await page.screenshot({path:info.outputPath('01-list.png'),fullPage:true});
 await tableRow(page,'w-neg').getByRole('button',{name:'반려'}).click();
 const dialog=page.getByRole('dialog',{name:'출금 신청 반려'}),confirm=dialog.getByRole('button',{name:'반려',exact:true});
 await expect(dialog).toContainText('90,000원');await expect(confirm).toBeDisabled();
 await expect(dialog.getByLabel('반려 사유')).toHaveAttribute('maxlength','150');
 await dialog.getByLabel('반려 사유').fill('환불로 출금 가능 잔액 부족');await page.screenshot({path:info.outputPath('02-dialog.png'),fullPage:true});await confirm.click();
 await expect(page.getByRole('status').filter({hasText:'출금 신청을 반려했습니다.'})).toBeVisible();
 expect(bodies).toEqual([JSON.stringify({reason:'환불로 출금 가능 잔액 부족'})]);expect(calls).toContain('POST /api/v1/admin/withdrawals/w-neg/reject');
 await expect(tableRow(page,'w-neg').getByRole('button',{name:'반려'})).toHaveCount(0);
 await page.screenshot({path:info.outputPath('03-rejected.png'),fullPage:true});
 expect(native).toEqual([]);expect(errors).toEqual([]);
});
test('출금 내역: 조회 권한만 있으면 반려 버튼이 없다 (API 대역)',async({page})=>{
 const {calls}=await fixture(page,{revenue:{view:true}});await openWithdrawals(page);await expect(tableRow(page,'w-neg')).toContainText('90,000원');
 await expect(page.getByRole('button',{name:'반려'})).toHaveCount(0);expect(calls.filter(c=>!c.startsWith('GET '))).toEqual([]);
});
test('출금 내역: 서버가 거절하면 그 행에 오류를 보이고 목록은 그대로 (API 대역)',async({page},info)=>{
 const {calls}=await fixture(page,{revenue:{view:true,create:true}},{fail:{status:409,code:'WITHDRAWAL_NOT_BLOCKED',message:'출금 가능 잔액이 부족해진 신청만 반려할 수 있습니다.'}});await openWithdrawals(page);
 await tableRow(page,'w-neg').getByRole('button',{name:'반려'}).click();const dialog=page.getByRole('dialog',{name:'출금 신청 반려'});await dialog.getByLabel('반려 사유').fill('확인');await dialog.getByRole('button',{name:'반려',exact:true}).click();
 await expect(tableRow(page,'w-neg').getByRole('alert')).toHaveText(/출금 가능 잔액이 부족해진 신청만 반려할 수 있습니다/);
 await expect(page.getByRole('status').filter({hasText:'반려했습니다'})).toHaveCount(0);expect(calls.filter(c=>c.startsWith('POST'))).toHaveLength(1);
 await page.screenshot({path:info.outputPath('04-error.png'),fullPage:true});
});
test('수동 지급: 반려 가능 건은 새 반려만, 나머지는 기존 이체 기록·반려 (API 대역)',async({page},info)=>{
 const {calls}=await fixture(page,{revenue:{view:true,create:true}},{manual:true});await page.goto('/console/revenue');
 const panel=page.locator('section.manual-payouts'),neg=panel.getByRole('row').filter({hasText:'90,000원'}),ok=panel.getByRole('row').filter({hasText:'50,000원'});
 await expect(neg).toContainText('환불로 잔액 부족');await expect(neg.getByRole('button',{name:'이체 완료 기록'})).toHaveCount(0);await expect(neg.getByRole('button',{name:'반려'})).toHaveCount(1);
 await expect(ok.getByRole('button',{name:'이체 완료 기록'})).toHaveCount(1);await expect(ok).not.toContainText('환불로 잔액 부족');
 await panel.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('05-manual.png'),fullPage:true});
 await neg.getByRole('button',{name:'반려'}).click();const dialog=page.getByRole('dialog',{name:'출금 신청 반려'});await dialog.getByLabel('반려 사유').fill('환불로 잔액 부족');await dialog.getByRole('button',{name:'반려',exact:true}).click();
 await expect(panel.getByRole('status')).toHaveText('출금 신청을 반려했습니다.');expect(calls).toContain('POST /api/v1/admin/withdrawals/w-neg/reject');expect(calls.some(c=>c.includes('manual-result'))).toBe(false);
});
