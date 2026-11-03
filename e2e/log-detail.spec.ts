import {test,expect,type Page,type Route} from '@playwright/test';

const event=(id:string)=>({id,category:'worker',action:`batch.${id}`,level:'error',actorId:null,actorRole:null,ip:null,peerIp:null,requestId:'qa-request',jobId:'qa-job',entityId:null,sourceId:null,release:'qa-only',environment:'test',status:500,durationMs:120,at:'2026-11-03T00:00:00Z',metadata:{code:'QA_ONLY',description:'검증용 긴 기록 '.repeat(100),trace:'x'.repeat(400)}});
const timeline=Array.from({length:25},(_,i)=>event(`related-${i}`));
const detail=(id:string)=>({event:event(id),timeline:[event(id),...timeline],hasMore:true,delivery:{attempts:2,delivered_at:null,available_at:'2026-11-03T00:00:00Z',last_error_code:'QA_ONLY'}});
const success=(route:Route,data:unknown)=>route.fulfill({json:{success:true,data,errorCode:null,errorMessage:null}});
const modal=(page:Page)=>page.getByRole('dialog',{name:'로그 상세',exact:true});
const close=(page:Page)=>modal(page).getByRole('button',{name:'로그 상세 닫기',exact:true});
const trigger=(page:Page,id='first')=>page.getByRole('button',{name:`batch.${id} 상세`,exact:true});
async function setup(page:Page,respond?:(route:Route,id:string)=>Promise<void>){
 const requests:string[]=[],unexpected:string[]=[],errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/v1/admin/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'){unexpected.push(request.method()+' '+path);return route.fulfill({status:405,json:{success:false}});}
  if(path.endsWith('/me'))return success(route,{id:'qa-operator',name:'검증 운영자',role:'ADMIN',permissions:{logs:{view:true}}});
  if(path==='/api/v1/admin/logs')return success(route,{items:[event('first'),event('second')],total:2,page:1,pageSize:30});
  if(path.startsWith('/api/v1/admin/logs/')){const id=path.split('/').at(-1)!;requests.push(id);return respond?respond(route,id):success(route,detail(id));}
  unexpected.push(path);return route.fulfill({status:404,json:{success:false}});
 });
 await page.goto('/console/logs');await expect(page.locator('.log-table tbody tr')).toHaveCount(2);
 return {requests,verify:()=>{expect(errors).toEqual([]);expect(unexpected).toEqual([]);}};
}

test('detail opens in a viewport modal; only its body scrolls, close/escape/backdrop restore the list',async({page},info)=>{
 const {verify}=await setup(page);await trigger(page).click();await expect(modal(page)).toBeVisible();
 await expect(modal(page).locator('.log-json')).toContainText('QA_ONLY');await expect(close(page)).toBeFocused();
 expect(await page.locator('.dialog-backdrop').evaluate(node=>node.parentElement===document.body)).toBe(true);
 await expect(page.locator('main .log-detail')).toHaveCount(0);
 expect(await page.evaluate(()=>!!document.elementFromPoint(8,8)?.closest('.dialog-backdrop'))).toBe(true);
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 const bounds=(await modal(page).boundingBox())!,viewport=page.viewportSize()!;
 expect(bounds.x).toBeGreaterThanOrEqual(15);expect(bounds.y).toBeGreaterThanOrEqual(15);
 expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width-15);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height-15);
 expect(await modal(page).evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
 const heading=(await modal(page).getByRole('heading',{name:'로그 상세',exact:true}).boundingBox())!,scroll=await page.evaluate(()=>scrollY);
 const body=modal(page).locator('.log-detail');await body.evaluate(node=>node.scrollTop=node.scrollHeight);
 expect(await body.evaluate(node=>node.scrollTop)).toBeGreaterThan(100);
 expect((await modal(page).getByRole('heading',{name:'로그 상세',exact:true}).boundingBox())!.y).toBeCloseTo(heading.y,0);
 expect(await page.evaluate(()=>scrollY)).toBe(scroll);await expect(close(page)).toBeInViewport();
 await body.evaluate(node=>node.scrollTop=0);await page.screenshot({path:info.outputPath('detail-modal.png')});
 await close(page).click();await expect(modal(page)).toHaveCount(0);await expect(trigger(page)).toBeFocused();
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');expect(await page.evaluate(()=>scrollY)).toBe(scroll);
 await trigger(page).click();await page.keyboard.press('Escape');await expect(modal(page)).toHaveCount(0);await expect(trigger(page)).toBeFocused();
 await trigger(page).click();await expect(modal(page)).toBeVisible();await page.mouse.click(8,8);await expect(modal(page)).toHaveCount(0);await expect(trigger(page)).toBeFocused();
 await expect(page.locator('.log-table tbody tr')).toHaveCount(2);verify();
});

test('timeline stays in one modal, resets its scroll, and an abandoned response cannot reopen or replace it',async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 const {verify,requests}=await setup(page,async(route,id)=>{if(id==='related-0')await pending;await success(route,detail(id));});
 await trigger(page).click();await modal(page).getByRole('button',{name:'batch.related-1',exact:true}).click();
 await expect(modal(page).locator('.log-properties')).toContainText('related-1');await expect(modal(page)).toHaveCount(1);
 expect(await modal(page).locator('.log-detail').evaluate(node=>node.scrollTop)).toBe(0);await expect(close(page)).toBeFocused();
 await modal(page).getByRole('button',{name:'batch.related-0',exact:true}).click();
 await expect.poll(()=>requests.includes('related-0')).toBe(true);await expect(modal(page).locator('.log-properties')).toHaveCount(0);
 await expect(modal(page).getByRole('status',{name:'불러오는 중'})).toBeVisible();
 await close(page).click();await trigger(page,'second').click();await expect(modal(page).locator('.log-properties')).toContainText('second');
 const response=page.waitForResponse(r=>r.url().endsWith('/admin/logs/related-0'));release();await response;
 await expect(modal(page)).toHaveCount(1);await expect(modal(page).locator('.log-properties')).toContainText('second');
 await close(page).click();await expect(trigger(page,'second')).toBeFocused();verify();
});

test('failed detail can retry within the modal; keyboard focus remains inside it',async({page,isMobile},info)=>{
 let failing=true;const {verify}=await setup(page,async(route,id)=>{if(failing)return route.fulfill({status:503,json:{success:false,errorCode:'QA_FAILURE',errorMessage:'상세 조회 실패'}});await success(route,detail(id));});
 await trigger(page).click();await expect(modal(page).getByRole('alert')).toContainText('상세 조회 실패');
 await page.screenshot({path:info.outputPath('detail-error.png')});
 if(!isMobile){
  await close(page).focus();await page.keyboard.press('Shift+Tab');await expect(modal(page).getByRole('button',{name:'다시 시도'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(close(page)).toBeFocused();
 }
 failing=false;await modal(page).getByRole('button',{name:'다시 시도'}).click();await expect(modal(page).locator('.log-json')).toContainText('QA_ONLY');
 if(!isMobile){
  await close(page).focus();await page.keyboard.press('Shift+Tab');await expect(modal(page).getByRole('button',{name:'batch.related-24',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(close(page)).toBeFocused();
 }
 await page.emulateMedia({colorScheme:'dark'});await modal(page).locator('.log-detail').evaluate(node=>node.scrollTop=0);
 await page.screenshot({path:info.outputPath('detail-dark.png'),animations:'disabled'});await close(page).click();verify();
});
