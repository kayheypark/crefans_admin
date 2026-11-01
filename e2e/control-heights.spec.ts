import {test,expect,type Page} from '@playwright/test';
// Inputs and buttons that share a row must have one standard height on the dashboard and every 운영 관리 menu.
const sections=['/console','/console/members','/console/invites','/console/content','/console/advertising'];
// Each run signs in with its own seeded admin to stay under the per-address sign-in limit.
async function login(page:Page,email:string){await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(email);await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();await expect(page).toHaveURL(/\/console/);}
async function mismatches(page:Page){return page.evaluate(()=>{
 const visible=(e:Element)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&!e.closest('.sidebar,.nav-drawer,.dialog-backdrop,.pager,.tabs,.page-head')||!!e.closest('.dialog');};
 const scope=document.querySelector('.dialog')||document.querySelector('main')!;
 const fields=[...scope.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select')].filter(visible);
 const buttons=[...scope.querySelectorAll('button')].filter(visible);const out:string[]=[];
 for(const f of fields){const a=f.getBoundingClientRect();for(const b of buttons){const c=b.getBoundingClientRect();
  if(Math.abs((a.top+a.bottom)/2-(c.top+c.bottom)/2)<12&&Math.abs(a.height-c.height)>0.5)out.push(`${(f.getAttribute('aria-label')||f.closest('label')?.textContent||f.tagName).trim().slice(0,20)} ${a.height}px ↔ ${b.textContent!.trim().slice(0,12)} ${c.height}px`);}}
 return [...new Set(out)];});}
// The phone run is a touch device: 16px touch text and the 44px touch control height apply there.
for(const width of [1280,390])test.describe(width===390?'touch phone':'desktop',()=>{if(width===390)test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test(`same-row inputs and buttons share one height (${width}px)`,async({page})=>{if(width===1280)await page.setViewportSize({width,height:900});
 // One pending report so the content page shows its memo input beside the action buttons.
 await page.route('**/api/v1/admin/reports',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data:[{id:'report-1',target_type:'POST',target_id:'post-1',reason:'SPAM',description:'검증'}],errorMessage:null,errorCode:null})}));
 await login(page,process.env.ADMIN_E2E_EMAIL!.replace('admin-',width===1280?'admin3-':'admin4-'));const report:Record<string,string[]>={};
 for(const path of sections){await page.goto(path);await page.waitForLoadState('networkidle');report[path]=await mismatches(page);}
 await page.goto('/console/content');await expect(page.getByLabel('신고 처리 메모')).toBeVisible();report['content report row']=await mismatches(page);
 await page.goto('/console/invites');await page.getByRole('button',{name:'초대 등록',exact:true}).click();report['invites dialog']=await mismatches(page);await page.keyboard.press('Escape');
 await page.goto('/console/members');await page.waitForLoadState('networkidle');const terms=page.getByRole('button',{name:'조건 보기',exact:true}).first();if(await terms.count()){await terms.click();await page.getByRole('dialog').getByLabel('멤버십 판매 수수료율 (%)',{exact:true}).waitFor();report['member terms dialog']=await mismatches(page);}
 console.log(width,JSON.stringify(report));expect(Object.values(report).flat()).toEqual([]);});});
