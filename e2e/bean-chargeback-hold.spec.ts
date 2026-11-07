import {test,expect,type Page} from '@playwright/test';
// 2026-11-07: a bean payout drawing on chargeback-frozen beans carries chargebackHold from the server
// (server tests/platform-beans.test.cjs); the console warns before the transfer. API stand-in.
const payout=(id:string,status:string,chargebackHold:boolean)=>({id,creator_id:'creator-1',quantity:1000,gross:100000,fee:20000,net:80000,status,note:'',chargebackHold,sources:{postQuantity:1000,profileQuantity:0,unattributedQuantity:0},funding:{paidQuantity:1000,promotionQuantity:0,unknownQuantity:0}});
async function fixture(page:Page){
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url());let data:any={};
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'정산',role:'SUPER_ADMIN',beanSupport:true,manualPayouts:true,permissions:{beans:{view:true,create:true,update:true}}};
  else if(url.pathname.endsWith('/beans/overview'))data={stock:[],charges:[],tips:[],payouts:[payout('payout-held','processing',true),payout('payout-requested-hold','requested',true),payout('payout-clean','processing',false),payout('payout-paid','paid',false)],summary:{chargeGroups:[],tipGroups:[],payoutGroups:[],payoutFundingGroups:[],tipSourceGroups:[]},promotionToday:{used:0,limit:10000}};
  else if(url.pathname.endsWith('/beans/receivables'))data=[];
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});}
test('콩 출금: 차지백으로 동결된 출처의 접수·처리 중 건에만 경고 (API 대역)',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);await page.goto('/console/beans');
 const row=(id:string)=>page.getByRole('row').filter({hasText:id});
 await expect(row('payout-held').getByRole('note')).toHaveText('차지백 발생 · 이체 전 확인');
 await expect(row('payout-requested-hold').getByRole('note')).toHaveText('차지백 발생 · 이체 전 확인');
 await expect(row('payout-clean')).toContainText('80,000원');await expect(row('payout-clean').getByText('차지백 발생')).toHaveCount(0);
 await expect(row('payout-paid').getByText('차지백 발생')).toHaveCount(0);
 await row('payout-held').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('bean-chargeback-hold.png'),fullPage:true});
 expect(errors).toEqual([]);
});
