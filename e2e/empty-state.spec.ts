import {test,expect,type Page} from '@playwright/test';

async function mock(page:Page){
 const errors:string[]=[],unexpected:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const list={items:[],total:0,page:1,pageSize:20};
 const data:Record<string,unknown>={
  '/me':{id:'empty-qa',name:'검증 운영자',role:'SUPER_ADMIN',manualPayouts:true,permissions:Object.fromEntries(['members','invites','reserved-handles','referrals','content','advertising','logs','revenue'].map(k=>[k,{view:true}]))},
  '/members':list,'/invites':list,'/reserved-handles':list,'/advertising/products':list,'/logs':list,'/categories':[],
  '/referrals':{...list,enabled:false,summary:{}},
  '/revenue':{summary:{count:0,gross:0,refunds:0,netSales:0,platformFees:0,creatorNet:0},daily:[],creators:list},
  '/payments':list,'/withdrawals':list,'/settlement-accounts':[],
 };
 await page.route('**/api/v1/admin/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1/admin','');
  if(req.method()!=='GET'||!(path in data)){unexpected.push(req.method()+' '+path);await route.fulfill({status:404,json:{success:false}});return;}
  await route.fulfill({json:{success:true,data:data[path],errorMessage:null,errorCode:null}});
 });
 return ()=>{expect(errors).toEqual([]);expect(unexpected).toEqual([]);};
}

test('console list and table empty states use the reference document icon and spacing',async({page},info)=>{
 const verify=await mock(page);
 for(const [route,message] of [
  ['members','내역이 없어요'],['advertising','등록된 광고상품이 없습니다.'],['invites','해당하는 초대가 없습니다.'],
  ['reserved-handles','등록된 예약 핸들이 없습니다.'],['referrals','내역이 없어요'],['logs','조건에 맞는 로그가 없습니다.'],
  ['settings','등록된 활동 분야가 없습니다.'],
 ]){
  await page.goto('/console/'+route);
  const empty=page.locator('.main .empty');await expect(empty).toHaveCount(1);await expect(empty).toContainText(message);
  const icon=empty.locator('svg');await expect(icon).toHaveAttribute('aria-hidden','true');await expect(icon).toBeVisible();
  const dimensions=await empty.evaluate(e=>{
   const css=getComputedStyle(e),icon=e.querySelector('svg')!.getBoundingClientRect(),box=e.getBoundingClientRect(),text=e.querySelector('p')!.getBoundingClientRect();
   return {height:box.height,iconWidth:icon.width,iconHeight:icon.height,center:Math.abs(icon.x+icon.width/2-box.x-box.width/2),gap:text.top-icon.bottom,border:css.borderTopWidth,x:box.x,right:box.right,viewport:innerWidth};
  });
  expect(dimensions.height).toBeGreaterThanOrEqual(160);expect(dimensions.iconWidth).toBe(36);expect(dimensions.iconHeight).toBe(44);
  expect(dimensions.center).toBeLessThan(1);expect(dimensions.gap).toBe(16);expect(dimensions.border).toBe('0px');
  expect(dimensions.x).toBeGreaterThanOrEqual(0);expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
  if(route==='advertising')await expect(page.getByRole('columnheader',{name:'결제금액 (VAT 포함)'})).toBeVisible();
  await empty.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`${route}-empty.png`),fullPage:true});
 }
 verify();
});

test('manual payout empty notices and dark mode use the same shared design',async({page},info)=>{
 const verify=await mock(page);await page.goto('/console/revenue');
 await expect(page.locator('.manual-payouts .empty')).toHaveCount(2);
 await expect(page.locator('.manual-payouts .empty-icon')).toHaveCount(2);
 await expect(page.getByText('확인 대기 계좌가 없습니다.',{exact:true})).toBeVisible();
 await expect(page.getByText('이체할 출금이 없습니다.',{exact:true})).toBeVisible();
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/console/advertising');
 const empty=page.locator('.main .empty');await expect(empty).toBeVisible();
 await expect(empty.locator('.empty-page')).toHaveCSS('fill','rgb(73, 83, 99)');
 await expect(empty.locator('p')).toHaveCSS('color','rgb(182, 190, 201)');
 await page.screenshot({path:info.outputPath('advertising-empty-dark.png'),fullPage:true,animations:'disabled'});
 verify();
});
