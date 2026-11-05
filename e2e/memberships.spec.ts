import {test,expect,type Page} from '@playwright/test';
// Console memberships·subscriptions (2026-11-06) against an API stand-in; the server enforces the same rules (server tests/platform-admin-console.test.cjs).
const creator={id:'c1',name:'맛집 탐험가',handle:'crefans',active:true};
const plans={items:[{id:'p1',name:'맛집 탐험',level:1,price:10000,billingUnit:'MONTH',billingPeriod:1,trialUnit:'DAY',trialPeriod:0,active:true,deleted:false,version:1,createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-20T00:00:00Z',creator,subscriptions:{current:2,autoRenew:1,cancelled:1,expired:3}}],total:1,page:1,pageSize:20};
const subs={items:[{id:'s1',status:'ONGOING',autoRenew:true,amount:10000,startedAt:'2026-10-01T00:00:00Z',endedAt:'2026-11-01T00:00:00Z',nextBillingDate:'2026-11-01T00:00:00Z',lastPaymentDate:'2026-10-01T00:00:00Z',paymentFailureCount:1,createdAt:'2026-10-01T00:00:00Z',subscriber:{id:'m1',nickname:'하늘',withdrawn:false},membership:{id:'p1',name:'맛집 탐험',level:1},creator},{id:'s2',status:'CANCELLED',autoRenew:false,amount:10000,startedAt:'2026-10-02T00:00:00Z',endedAt:'2026-11-02T00:00:00Z',nextBillingDate:null,lastPaymentDate:null,paymentFailureCount:0,createdAt:'2026-10-02T00:00:00Z',subscriber:{id:'m2',nickname:null,withdrawn:true},membership:{id:'p1',name:'맛집 탐험',level:1},creator}],summary:{current:2,ONGOING:1,CANCELLED:1,EXPIRED:3},total:2,page:1,pageSize:20};
async function fixture(page:Page,permissions:Record<string,Record<string,boolean>>){const calls:string[]=[];
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url());calls.push(route.request().method()+' '+url.pathname+url.search);let data:unknown={};
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'ADMIN',permissions};
  else if(url.pathname.endsWith('/memberships'))data=plans;
  else if(url.pathname.endsWith('/subscriptions'))data=subs;
  else if(url.pathname.endsWith('/overview'))data={members:0,creators:0,posts:0,reports:0,inquiries:0,failedPayments:0,pendingWithdrawals:0,undeliveredEvents:0,jobs:[]};
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});return calls;}
test('멤버십·구독: 매출 조회 권한으로 상품 목록과 구독 현황을 조회만 한다 (API 대역)',async({page},info)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const calls=await fixture(page,{revenue:{view:true}});await page.goto('/console/memberships');
 if(!info.project.name.includes('mobile'))await expect(page.getByRole('link',{name:'멤버십·구독'})).toHaveAttribute('href','/console/memberships');
 const plansTable=page.getByRole('table',{name:'멤버십 상품'});await expect(plansTable).toContainText('맛집 탐험');await expect(plansTable).toContainText('10,000원');await expect(plansTable).toContainText('1개월마다');await expect(plansTable).toContainText('@crefans');await expect(plansTable).toContainText('판매 중');
 await page.getByLabel('상태').selectOption('inactive');await expect.poll(()=>calls.some(c=>c.includes('/admin/memberships?page=1&state=inactive'))).toBe(true);
 await page.getByLabel('검색').fill('맛집');await page.getByRole('button',{name:'검색'}).click();await expect.poll(()=>calls.some(c=>c.includes('state=inactive&search=%EB%A7%9B%EC%A7%91'))).toBe(true);
 await page.getByRole('button',{name:'구독자 보기'}).click();await expect.poll(()=>calls.some(c=>c.includes('/admin/subscriptions?page=1&membershipId=p1'))).toBe(true);
 const subsTable=page.getByRole('table',{name:'구독 현황'});await expect(subsTable).toContainText('하늘');await expect(subsTable).toContainText('자동 갱신');await expect(subsTable).toContainText('해지 예약');await expect(subsTable).toContainText('탈퇴한 회원');await expect(subsTable).toContainText('1회');
 await expect(page.getByText('상품: 맛집 탐험')).toBeVisible();await page.getByLabel('상태').selectOption('EXPIRED');await expect.poll(()=>calls.some(c=>c.includes('status=EXPIRED&membershipId=p1'))).toBe(true);
 await page.getByRole('button',{name:'상품 조건 해제'}).click();await expect.poll(()=>calls.some(c=>c==='GET /api/v1/admin/subscriptions?page=1&status=EXPIRED')).toBe(true);
 expect(calls.filter(c=>!c.startsWith('GET '))).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('subscriptions.png'),fullPage:true});
});
test('멤버십·구독: 매출 조회 권한이 없으면 메뉴와 화면이 열리지 않는다',async({page})=>{const calls=await fixture(page,{overview:{view:true},members:{view:true}});await page.goto('/console/memberships');
 await expect(page.getByText('이 메뉴에 들어갈 권한이 없습니다')).toBeVisible();await expect(page.getByRole('link',{name:'멤버십·구독'})).toHaveCount(0);expect(calls.some(c=>c.includes('/memberships?')||c.includes('/subscriptions'))).toBe(false);
});
