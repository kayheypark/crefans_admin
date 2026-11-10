import {test,expect,type Page} from '@playwright/test';
// Weekly payout list (2026-11-10) against an API stand-in. The server computes amounts and totals and audits each reveal
// (server tests/platform-manual-payouts.test.cjs). This checks the console shows them and fetches a number only on demand.
const account={id:'acc-1',bank:'국민',holder:'김크리',lastFour:'5678',verified:true,hasNumber:true,changed:false};
const due={items:[
 {id:'w-1',kind:'membership',creatorId:'c-1',creatorName:'김크리',handle:'kimcre',amount:70000,status:'processing',note:null,test:false,createdAt:'2026-11-03T01:00:00Z',account},
 {id:'b-1',kind:'bean',creatorId:'c-1',creatorName:'김크리',handle:'kimcre',amount:30000,status:'processing',note:null,test:false,createdAt:'2026-11-04T01:00:00Z',account},
 {id:'b-2',kind:'bean',creatorId:'c-2',creatorName:'테스트',handle:null,amount:5000,status:'requested',note:null,test:true,createdAt:'2026-11-04T02:00:00Z',account:{...account,id:'acc-2',lastFour:'0000'}}],
 creators:[{creatorId:'c-1',creatorName:'김크리',handle:'kimcre',count:2,amount:100000}],totals:{count:2,amount:100000,creators:1,testCount:1},beans:true,truncated:false};
async function fixture(page:Page,permissions:Record<string,Record<string,boolean>>){
 const calls:string[]=[];
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method();calls.push(method+' '+url.pathname);let data:unknown={};
  if(url.pathname.endsWith('/reveal'))data={id:'acc-1',bank:'국민',holder:'김크리',accountNumber:'110123455678',version:1};
  else if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'ADMIN',permissions,manualPayouts:true,beanSupport:true};
  else if(url.pathname.endsWith('/payouts/due'))data=due;
  else if(url.pathname.endsWith('/revenue'))data={summary:{count:0,gross:0,refunds:0,netSales:0,platformFees:0,creatorNet:0},daily:[],creators:{items:[],total:0}};
  else if(url.pathname.endsWith('/payments')||url.pathname.endsWith('/withdrawals'))data={items:[],total:0,page:1,pageSize:20};
  else if(url.pathname.endsWith('/settlement-accounts'))data=[];
  else if(url.pathname.endsWith('/overview'))data={members:0,creators:0,posts:0,reports:0,inquiries:0,failedPayments:0,pendingWithdrawals:0,undeliveredEvents:0,jobs:[]};
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
 return calls;}

test('지급 목록: 총액·크리에이터별 합계·출금별 상세, 계좌번호는 누를 때만 조회 (API 대역)',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const calls=await fixture(page,{revenue:{view:true,create:true}});await page.goto('/console/revenue');
 const panel=page.locator('section.payout-list');
 await expect(panel.getByLabel('지급 합계')).toContainText('100,000원');await expect(panel.getByLabel('지급 합계')).toContainText('1명');
 await expect(panel).toContainText('테스트 환경 콩 출금 1건');
 await expect(panel.getByRole('row').filter({hasText:'70,000원'})).toContainText('국민 · 김크리 · ****5678');
 expect(calls.some(c=>c.endsWith('/reveal'))).toBe(false);await expect(panel).not.toContainText('110123455678');
 await panel.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('01-list.png'),fullPage:true});
 const test=panel.getByRole('row').filter({hasText:'5,000원'});await expect(test.getByRole('button',{name:'계좌번호 보기'})).toHaveCount(0);
 await panel.getByRole('row').filter({hasText:'70,000원'}).getByRole('button',{name:'계좌번호 보기'}).click();
 await expect(panel.getByRole('row').filter({hasText:'70,000원'})).toContainText('110123455678');
 expect(calls.filter(c=>c.endsWith('/reveal'))).toEqual(['POST /api/v1/admin/settlement-accounts/acc-1/reveal']);
 await page.screenshot({path:info.outputPath('02-revealed.png'),fullPage:true});expect(errors).toEqual([]);
});
test('지급 목록: 조회 권한만 있으면 계좌번호 보기 버튼이 없다 (API 대역)',async({page})=>{
 const calls=await fixture(page,{revenue:{view:true}});await page.goto('/console/revenue');
 await expect(page.locator('section.payout-list').getByLabel('지급 합계')).toContainText('100,000원');
 await expect(page.getByRole('button',{name:'계좌번호 보기'})).toHaveCount(0);expect(calls.filter(c=>!c.startsWith('GET '))).toEqual([]);
});
