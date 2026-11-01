import {test,expect,type Page} from '@playwright/test';
// Loading rule (/ux-spinner 2026-11-01) for 활동 분야 관리, measured in the browser with an API stub:
// (`rows` counts table body rows.) Nothing changes for 1s after the request, then a spinner (over rows, or where the table goes); only the response shows rows, empty or error.
type Sample={t:number;e:string;spinner?:string;rows?:number;empty?:boolean;error?:boolean};
const category=(id:string,name:string)=>({id,name,active:true,sortOrder:0,iconUrl:null,customIcon:false});
async function openSettings(page:Page){
 await page.addInitScript(()=>{
  const w=window as unknown as {__log:Sample[]};w.__log=[];const original=window.fetch;
  window.fetch=function(this:unknown,input:RequestInfo|URL,init?:RequestInit){const url=String(input instanceof Request?input.url:input);
   if(url.endsWith('/api/v1/admin/categories')&&(!init?.method||init.method==='GET')){w.__log.push({t:performance.now(),e:'request'});return original.call(this,input,init).then(r=>{w.__log.push({t:performance.now(),e:'response'});return r;});}
   return original.call(this,input,init);} as typeof fetch;
  // Every DOM change inside #categories is recorded, so a one-frame "empty" flash cannot slip between samples.
  new MutationObserver(()=>{const area=document.getElementById('categories');if(!area)return;w.__log.push({t:performance.now(),e:'dom',spinner:area.querySelector('.loading-veil')?'overlay':area.querySelector('.loading-block')?'block':'-',rows:area.querySelectorAll('tbody tr').length,empty:!!area.querySelector('.empty'),error:!!area.querySelector('[role=alert]')});}).observe(document,{subtree:true,childList:true,attributes:true,characterData:true});
 });
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!.replace('admin-','admin3-'));
 await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();await expect(page).toHaveURL('/console');
}
function stub(page:Page,delay:number,answer:{status?:number;json:unknown}){return page.route('**/api/v1/admin/categories',async route=>{if(route.request().method()!=='GET')return route.fallback();await new Promise(r=>setTimeout(r,delay));await route.fulfill({status:answer.status||200,json:answer.json});});}
const log=(page:Page)=>page.evaluate(()=>(window as unknown as {__log:Sample[]}).__log);
/** State at each offset from the last request; `spinnerAt` is when a spinner first appeared; `beforeResponse` folds every DOM state seen before the response. */
function measure(samples:Sample[]){
 const request=samples.filter(s=>s.e==='request').at(-1)!.t,response=samples.find(s=>s.e==='response'&&s.t>=request)!.t,doms=samples.filter(s=>s.e==='dom');
 const before=doms.filter(s=>s.t<request).at(-1),state=(s?:Sample)=>s?{spinner:s.spinner,rows:s.rows,empty:s.empty,error:s.error}:{spinner:'-',rows:0,empty:false,error:false};
 const at=(ms:number)=>state(doms.filter(s=>s.t<=request+ms).at(-1)||before),pre=doms.filter(s=>s.t>=request&&s.t<response),first=pre.find(s=>s.spinner!=='-');
 return{'0ms':at(0),'500ms':at(500),'999ms':at(999),spinnerAt:first?Math.round(first.t-request):null,final:state(doms.at(-1)),beforeResponse:{empty:pre.some(s=>s.empty),error:pre.some(s=>s.error),rowsChanged:pre.some(s=>s.rows!==state(before).rows)}};
}
async function first(page:Page,delay:number,answer:{status?:number;json:unknown},settled:(page:Page)=>Promise<void>){
 await stub(page,delay,answer);await page.goto('about:blank');await page.goto('/console/settings#categories');await settled(page);await page.waitForTimeout(300);return measure(await log(page));
}
const area=(page:Page)=>page.locator('#categories');

test('slow first load: blank for 1s, spinner where the table goes, then rows (no empty flash)',async({page},info)=>{
 await openSettings(page);const m=await first(page,2500,{json:{success:true,data:[category('a','가'),category('b','나')]}},p=>expect(area(p).getByRole('row')).toHaveCount(3));
 await info.attach('slow-first-load',{body:JSON.stringify(m),contentType:'application/json'});console.log('slow-first-load',JSON.stringify(m));
 for(const at of ['0ms','500ms','999ms'] as const)expect(m[at],at).toEqual({spinner:'-',rows:0,empty:false,error:false});
 expect(m.spinnerAt).toBeGreaterThanOrEqual(1000);expect(m.spinnerAt).toBeLessThan(1300);expect(m.beforeResponse).toEqual({empty:false,error:false,rowsChanged:false});
 expect(m.final).toEqual({spinner:'-',rows:2,empty:false,error:false});
});
test('fast, empty and failed answers: no spinner when fast; empty or error only after the response',async({page},info)=>{
 await openSettings(page);
 const fast=await first(page,0,{json:{success:true,data:[category('a','가')]}},p=>expect(area(p).getByRole('row')).toHaveCount(2));console.log('fast',JSON.stringify(fast));
 expect(fast.spinnerAt).toBeNull();expect(fast.beforeResponse.empty).toBe(false);expect(fast.final).toEqual({spinner:'-',rows:1,empty:false,error:false});
 const docs=await log(page);expect(docs.filter(s=>s.e==='dom').some(s=>s.empty),'the empty message never appears for a list with rows').toBe(false);
 await page.unroute('**/api/v1/admin/categories');
 const empty=await first(page,2500,{json:{success:true,data:[]}},p=>expect(area(p).getByText('등록된 활동 분야가 없습니다.')).toBeVisible());console.log('empty',JSON.stringify(empty));
 expect(empty['999ms']).toEqual({spinner:'-',rows:0,empty:false,error:false});expect(empty.spinnerAt).toBeGreaterThanOrEqual(1000);expect(empty.beforeResponse).toEqual({empty:false,error:false,rowsChanged:false});expect(empty.final).toEqual({spinner:'-',rows:0,empty:true,error:false});
 await page.unroute('**/api/v1/admin/categories');
 const failed=await first(page,1500,{status:503,json:{success:false,data:null,errorCode:'TEST',errorMessage:'검증용 조회 실패'}},p=>expect(area(p).getByRole('alert')).toContainText('검증용 조회 실패'));console.log('error',JSON.stringify(failed));
 expect(failed['999ms']).toEqual({spinner:'-',rows:0,empty:false,error:false});expect(failed.beforeResponse).toEqual({empty:false,error:false,rowsChanged:false});expect(failed.final).toEqual({spinner:'-',rows:0,empty:false,error:true});
 await info.attach('fast-empty-error',{body:JSON.stringify({fast,empty,failed}),contentType:'application/json'});
});
test('a slow refresh keeps the rows and dims them with a spinner after 1s',async({page},info)=>{
 await openSettings(page);await stub(page,0,{json:{success:true,data:[category('a','가'),category('b','나')]}});await page.goto('/console/settings#categories');await expect(area(page).getByRole('row')).toHaveCount(3);
 await page.unroute('**/api/v1/admin/categories');await stub(page,2500,{json:{success:true,data:[category('b','나')]}});
 await page.evaluate(()=>{(window as unknown as {__log:Sample[]}).__log=[];});await area(page).getByRole('button',{name:'목록 새로고침'}).click();await expect(area(page).getByRole('row')).toHaveCount(2);await page.waitForTimeout(300);
 const samples=await log(page);const firstDom=samples.find(s=>s.e==='dom');const m=measure([{t:-1,e:'dom',spinner:'-',rows:2,empty:false,error:false},...samples]);console.log('refresh',JSON.stringify(m),JSON.stringify(firstDom));
 await info.attach('refresh',{body:JSON.stringify(m),contentType:'application/json'});
 for(const at of ['0ms','500ms','999ms'] as const)expect(m[at],at).toEqual({spinner:'-',rows:2,empty:false,error:false});
 expect(m.spinnerAt).toBeGreaterThanOrEqual(1000);expect(m.spinnerAt).toBeLessThan(1300);expect(samples.filter(s=>s.e==='dom'&&s.spinner!=='-').every(s=>s.spinner==='overlay'&&s.rows===2)).toBe(true);
 expect(m.final).toEqual({spinner:'-',rows:1,empty:false,error:false});
});
