import {test,expect,type Page,type Route} from '@playwright/test';

const labels=['충전 집계','후원 유형별 사용량','출금 집계','출금 재원별 집계','충전 주문·입금 대사','후원 이동 내역','콩 출금 신청','미수금','회원 지갑 이동 내역'];
const messages=['충전 집계 내역이 없습니다.','후원 유형별 사용 내역이 없습니다.','출금 집계 내역이 없습니다.','출금 재원별 집계 내역이 없습니다.','충전 주문이 없습니다.','후원 이동 내역이 없습니다.','콩 출금 신청 내역이 없습니다.','미수금이 없습니다.','콩 이동 내역이 없습니다.'];
const emptyOverview=()=>({promotionToday:{used:0,limit:10000},stock:[{id:'qa-stock',bucket:'stock',balance:'100000000'}],charges:[] as object[],tips:[] as object[],payouts:[] as object[],summary:{chargeGroups:[] as object[],payoutGroups:[] as object[],tipGroups:[] as object[],tipSourceGroups:[] as object[]|undefined,payoutFundingGroups:[] as object[]|undefined}});
const emptyWallet=()=>({accounts:[{bucket:'paid',balance:'0'}],entries:[] as object[],sourceLots:[]});
const charge={id:'qa-charge',memberId:'qa-member',quantity:10,amount:1100,environment:'test',status:'paid',receiptConfirmedAt:'2026-11-02T00:00:00Z'};
const entry={id:'qa-entry',created_at:'2026-11-02T00:00:00Z',delta:'10',movement_id:'qa-movement',movement:{kind:'tip',reason:'검증용 후원'}};
const success=(route:Route,data:unknown)=>route.fulfill({json:{success:true,data,errorMessage:null,errorCode:null}});
const failure=(route:Route)=>route.fulfill({status:503,json:{success:false,errorMessage:'조회에 실패했습니다. 잠시 후 다시 시도해주세요.',errorCode:'QA_UNAVAILABLE'}});

async function mock(page:Page,options:{overview?:(r:Route)=>Promise<void>;wallet?:(r:Route)=>Promise<void>;receivables?:object[];readonly?:boolean}={}){
 const unexpected:string[]=[],errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/v1/admin/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()!=='GET'){unexpected.push(`${req.method()} ${url.pathname}`);await route.fulfill({status:405,json:{success:false}});return;}
  if(url.pathname.endsWith('/me'))return success(route,{id:'qa-operator',name:'검증 운영자',role:options.readonly?'ADMIN':'SUPER_ADMIN',beanSupport:true,permissions:{beans:{view:true,create:!options.readonly,update:!options.readonly,delete:false}}});
  if(url.pathname.endsWith('/beans/overview'))return options.overview?options.overview(route):success(route,emptyOverview());
  if(url.pathname.endsWith('/beans/receivables'))return success(route,options.receivables||[]);
  if(url.pathname.includes('/beans/wallets/'))return options.wallet?options.wallet(route):success(route,emptyWallet());
  unexpected.push(url.pathname);await route.fulfill({status:404,json:{success:false}});
 });
 return ()=>{expect(unexpected).toEqual([]);expect(errors).toEqual([]);};
}
async function wallet(page:Page){await page.getByRole('textbox',{name:'조회할 회원 ID'}).fill('qa-member');await page.getByRole('button',{name:'지갑 조회',exact:true}).click();}

test('all nine successful empty tables use centered, viewport-wide no-data notices',async({page},info)=>{
 const verify=await mock(page);await page.goto('/console/beans');await wallet(page);
 for(const message of messages)await expect(page.getByText(message,{exact:true})).toBeVisible();
 await expect(page.locator('.bean-console table')).toHaveCount(0);
 const notices=page.locator('.bean-console .empty');await expect(notices).toHaveCount(9);
 const geometry=await notices.evaluateAll(nodes=>nodes.map(n=>({align:getComputedStyle(n).textAlign,x:n.getBoundingClientRect().x,right:n.getBoundingClientRect().right,width:innerWidth})));
 for(const item of geometry){expect(item.align).toBe('center');expect(item.x).toBeGreaterThanOrEqual(0);expect(item.right).toBeLessThanOrEqual(item.width);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath('all-empty.png'),fullPage:true});verify();
});

test('populated tables preserve values, zero aggregates, actions and table structure',async({page},info)=>{
 const overview=emptyOverview();overview.charges=[charge];overview.tips=[{id:'qa-tip',sender_id:'qa-member',creator_id:'qa-creator',sourceType:'profile',paid_quantity:10,promotion_quantity:0}];
 overview.payouts=[{id:'qa-payout',creator_id:'qa-creator',quantity:1000,gross:100000,fee:20000,net:80000,status:'paid',note:null,sources:{postQuantity:0,profileQuantity:1000,unattributedQuantity:0},funding:{paidQuantity:1000,promotionQuantity:0,unknownQuantity:0}}];
 overview.summary={chargeGroups:[{environment:'test',status:'paid',_count:1,_sum:{amount:1100,quantity:10}}],payoutGroups:[{environment:'test',status:'paid',_sum:{gross:100000,fee:20000,net:80000}}],tipGroups:[],tipSourceGroups:[{environment:'test',sourceType:'profile',quantity:0}],payoutFundingGroups:[{environment:'test',status:'paid',source:'paid',quantity:1000,gross:100000,fee:20000,net:80000}]};
 const verify=await mock(page,{overview:r=>success(r,overview),wallet:r=>success(r,{...emptyWallet(),entries:[entry]}),receivables:[{id:'qa-receivable',creatorId:'qa-creator',kind:'beans',sourceId:'qa-source',amount:1000,createdAt:'2026-11-02T00:00:00Z'}]});
 await page.goto('/console/beans');await wallet(page);
 for(const label of labels)await expect(page.getByRole('table',{name:label,exact:true})).toBeVisible();
 await expect(page.locator('.bean-console .empty')).toHaveCount(0);
 await expect(page.getByRole('table',{name:'후원 유형별 사용량',exact:true}).getByRole('cell',{name:'0콩',exact:true})).toHaveCount(6);
 await expect(page.getByRole('table',{name:'충전 집계',exact:true})).toContainText('1,100원');
 await expect(page.getByRole('button',{name:'환불',exact:true})).toBeVisible();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath('populated.png'),fullPage:true});verify();
});

test('unavailable aggregates and read-only permissions are not mistaken for empty records',async({page})=>{
 const overview=emptyOverview();delete overview.summary.tipSourceGroups;delete overview.summary.payoutFundingGroups;
 const verify=await mock(page,{overview:r=>success(r,overview),readonly:true});await page.goto('/console/beans');
 await expect(page.getByText('후원 유형별 집계 정보를 확인할 수 없습니다.',{exact:true})).toBeVisible();
 await expect(page.getByText('출금 재원 집계를 확인할 수 없습니다.',{exact:true})).toBeVisible();
 await expect(page.getByText(messages[1],{exact:true})).toHaveCount(0);await expect(page.getByText(messages[3],{exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'프로모션콩 지급',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'지갑 조회',exact:true})).toHaveCount(0);verify();
});

test('pending requests and failures do not report no data; retries can show empty data',async({page},info)=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let retry=false;
 const verify=await mock(page,{overview:async r=>{if(!retry){await pending;await failure(r);}else await success(r,emptyOverview());},wallet:failure});
 await page.goto('/console/beans');await expect(page.getByRole('status',{name:'불러오는 중'}).locator('.loading-spinner')).toBeVisible();
 await expect(page.getByText(messages[0],{exact:true})).toHaveCount(0);release();
 await expect(page.locator('.bean-console [role=alert]')).toContainText('조회에 실패했습니다.');
 await expect(page.getByText(messages[0],{exact:true})).toHaveCount(0);
 retry=true;await page.getByRole('button',{name:'다시 시도',exact:true}).click();await expect(page.getByText(messages[0],{exact:true})).toBeVisible();
 await wallet(page);await expect(page.locator('.bean-console [role=alert]')).toContainText('조회에 실패했습니다.');
 await expect(page.getByText(messages[8],{exact:true})).toHaveCount(0);
 await page.screenshot({path:info.outputPath('wallet-error.png'),fullPage:true});verify();
});

test('page refresh retains old rows and empty later pages have specific notices',async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});const overview=emptyOverview();overview.charges=Array.from({length:20},(_,i)=>({...charge,id:`qa-charge-${i}`}));
 const verify=await mock(page,{overview:async r=>{if(new URL(r.request().url()).searchParams.get('page')==='2'){await pending;await success(r,emptyOverview());}else await success(r,overview);},wallet:r=>success(r,{...emptyWallet(),entries:new URL(r.request().url()).searchParams.get('page')==='2'?[]:Array.from({length:20},(_,i)=>({...entry,id:`qa-entry-${i}`}))})});
 await page.goto('/console/beans');const table=page.getByRole('table',{name:'충전 주문·입금 대사',exact:true});await expect(table.locator('tbody tr')).toHaveCount(20);
 await page.getByRole('button',{name:'다음',exact:true}).click();await expect(page.getByRole('status',{name:'불러오는 중'}).locator('.loading-spinner')).toBeVisible();await expect(table.locator('tbody tr')).toHaveCount(20);release();
 for(const message of ['현재 페이지에 충전 주문이 없습니다.','현재 페이지에 후원 이동 내역이 없습니다.','현재 페이지에 콩 출금 신청 내역이 없습니다.'])await expect(page.getByText(message,{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'이전',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'다음',exact:true})).toBeDisabled();
 await wallet(page);await expect(page.getByRole('table',{name:'회원 지갑 이동 내역',exact:true}).locator('tbody tr')).toHaveCount(20);
 await page.getByRole('button',{name:'다음 이력',exact:true}).click();await expect(page.getByText('현재 페이지에 콩 이동 내역이 없습니다.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'이전 이력',exact:true})).toBeEnabled();verify();
});
