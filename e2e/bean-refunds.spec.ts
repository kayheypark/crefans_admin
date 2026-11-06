import {test,expect,type Page} from '@playwright/test';
// Bean console refund action and receivables against an API stand-in; refund terms, PG cancel and receivable rules are covered by crefans_server tests.
async function fixture(page:Page,update=true){const mutations:any[]=[],gets:string[]=[];let receivables=[{id:'rcv-m',creatorId:'creator-1',kind:'membership',sourceId:'pay-1',amount:9900,createdAt:'2026-10-28T03:00:00Z'},{id:'rcv-b',creatorId:'creator-2',kind:'beans',sourceId:'refund-9',amount:4500,createdAt:'2026-10-29T03:00:00Z'}];
 const overview={stock:[],charges:[{id:'charge-paid',memberId:'fan-1',quantity:100,amount:11000,environment:'live',status:'paid',receiptConfirmedAt:'2026-10-20T00:00:00Z'},{id:'charge-failed',memberId:'fan-2',quantity:50,amount:5500,environment:'live',status:'failed',receiptConfirmedAt:null}],tips:[],payouts:[],summary:{chargeGroups:[],payoutGroups:[],tipGroups:[]}};
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method();let data:any={};
  if(method==='GET')gets.push(url.pathname);
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'정산',role:'ADMIN',beanSupport:true,permissions:{beans:{view:true,create:false,update}}};
  else if(url.pathname.endsWith('/beans/overview'))data=overview;
  else if(url.pathname.endsWith('/beans/receivables'))data=receivables;
  else if(method==='POST'){const body=route.request().postDataJSON();mutations.push({path:url.pathname,body});
   if(url.pathname.endsWith('/refund'))data={id:'refund-1',chargeId:'charge-paid',quantity:80,gross:8800,deduction:0,amount:8800,waived:body.waived,status:'done'};
   else if(url.pathname.endsWith('/settle')){receivables=receivables.filter(r=>!url.pathname.includes(r.id));data={message:'미수금을 정산 완료로 표시했습니다.'};}}
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
 return Object.assign(mutations,{gets});}

test('결제 완료 충전만 환불할 수 있고, 사유·회사 귀책 여부·요청 ID를 보내고 결과 금액을 알린다 (API 대역)',async({page},info)=>{const mutations=await fixture(page);const native:string[]=[];page.on('dialog',d=>{native.push(d.message());void d.dismiss();});
 await page.goto('/console/beans');
 const paid=page.getByRole('row').filter({hasText:'charge-paid'}),failed=page.getByRole('row').filter({hasText:'charge-failed'});
 await expect(failed).toContainText('실패');await expect(failed.getByRole('button',{name:'환불',exact:true})).toHaveCount(0);
 await paid.getByRole('button',{name:'환불',exact:true}).click();const dialog=page.getByRole('dialog',{name:'콩 충전 환불',exact:true}),confirmBox=page.getByRole('dialog',{name:'충전 환불',exact:true});await expect(dialog).toContainText('7일이 지나면 10%를 공제');
 const submit=dialog.getByRole('button',{name:'환불',exact:true});await expect(submit).toBeDisabled();
 await dialog.getByLabel('환불 사유').fill('결제 오류로 회사 귀책 환불');await dialog.getByLabel('회사 귀책(7일 이후 10% 공제 면제)').check();await page.screenshot({path:info.outputPath('bean-refund-dialog.png')});
 const before=mutations.gets.filter(p=>p.endsWith('/beans/overview')).length;
 await submit.click();
 // 2026-11-06: 네이티브 confirm 대신 콘솔 자체 확인 다이얼로그를 거친다.
 await expect(confirmBox).toContainText('charge-paid');await expect(confirmBox).toContainText('회사 귀책으로 공제를 면제합니다');await confirmBox.getByRole('button',{name:'환불',exact:true}).click();
 await expect(dialog).toBeHidden();
 expect(native).toEqual([]);expect(mutations).toHaveLength(1);
 expect(mutations[0]).toEqual({path:'/api/v1/admin/beans/charges/charge-paid/refund',body:{requestId:expect.stringMatching(/^[0-9a-f-]{36}$/),waived:true,reason:'결제 오류로 회사 귀책 환불'}});
 await expect(page.locator('.console-snackbar')).toContainText('환불 완료: 80콩 · 8,800원 · 공제 면제');
 await expect.poll(()=>mutations.gets.filter(p=>p.endsWith('/beans/overview')).length).toBeGreaterThan(before);
 await page.screenshot({path:info.outputPath('bean-refund-snackbar.png')});
});

test('미수금은 종류별로 보이고, 콩 미수금만 메모와 함께 정산 완료할 수 있다 (API 대역)',async({page},info)=>{const mutations=await fixture(page);
 await page.goto('/console/beans');
 await expect(page.getByRole('heading',{name:'미수금',exact:true})).toBeVisible();await expect(page.getByText('멤버십 미수금은 이후 정산에서 자동으로 차감됩니다.',{exact:false})).toBeVisible();
 const table=page.locator('table').filter({hasText:'출처 ID'});for(const h of ['크리에이터 ID','종류','출처 ID','금액','발생일'])await expect(table.getByRole('columnheader',{name:h,exact:true})).toBeVisible();
 const m=table.getByRole('row').filter({hasText:'pay-1'}),b=table.getByRole('row').filter({hasText:'refund-9'});
 await expect(m).toContainText('멤버십');await expect(m).toContainText('9,900원');await expect(m).toContainText('자동 차감');await expect(m.getByRole('button',{name:'정산 완료'})).toHaveCount(0);await expect(m.getByLabel('정산 메모')).toHaveCount(0);
 await expect(b).toContainText('콩');await expect(b).toContainText('4,500원');const settle=b.getByRole('button',{name:'정산 완료'});await expect(settle).toBeDisabled();
 await b.getByLabel('정산 메모').fill('크리에이터 계좌 회수 확인');await page.screenshot({path:info.outputPath('receivables.png')});await settle.click();
 await expect(table.getByRole('row').filter({hasText:'refund-9'})).toHaveCount(0);
 expect([...mutations]).toEqual([{path:'/api/v1/admin/beans/receivables/rcv-b/settle',body:{note:'크리에이터 계좌 회수 확인'}}]);
 await expect(page.locator('.console-snackbar')).toContainText('미수금을 정산 완료로 표시했습니다.');
});

test('조회 권한만 있으면 환불·정산 버튼이 없다 (API 대역)',async({page})=>{const mutations=await fixture(page,false);
 await page.goto('/console/beans');await expect(page.getByRole('heading',{name:'미수금',exact:true})).toBeVisible();await expect(page.getByRole('row').filter({hasText:'refund-9'})).toBeVisible();await expect(page.getByRole('row').filter({hasText:'charge-paid'})).toBeVisible();
 await expect(page.getByRole('button',{name:'환불',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'정산 완료'})).toHaveCount(0);expect([...mutations]).toEqual([]);
});
test('환불이 거절되면 다시 시도할 때 새 요청 ID를 쓰고, 처리 중 응답은 완료라고 하지 않는다 (API 대역)',async({page})=>{await fixture(page);const native:string[]=[];page.on('dialog',d=>{native.push(d.message());void d.dismiss();});
 const sent:string[]=[];let reply=0;
 await page.route('**/api/v1/admin/beans/charges/*/refund',async route=>{sent.push(route.request().postDataJSON().requestId);reply++;
  if(reply===1)return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({success:false,data:null,errorMessage:'결제사가 환불을 거절했습니다.',errorCode:'PROVIDER_REJECTED'})});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data:{id:'refund-2',chargeId:'charge-paid',quantity:80,gross:8800,deduction:880,amount:7920,waived:false,status:'processing'},errorMessage:null,errorCode:null})});});
 await page.goto('/console/beans');
 await page.getByRole('row').filter({hasText:'charge-paid'}).getByRole('button',{name:'환불',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'콩 충전 환불',exact:true}),confirmBox=page.getByRole('dialog',{name:'충전 환불',exact:true});await dialog.getByLabel('환불 사유').fill('고객 요청');
 const approve=async()=>{await confirmBox.getByRole('button',{name:'환불',exact:true}).click();};
 await dialog.getByRole('button',{name:'환불',exact:true}).click();await approve();await expect(dialog).toContainText('결제사가 환불을 거절했습니다.');
 await dialog.getByRole('button',{name:'환불',exact:true}).click();await approve();await expect(dialog).toBeHidden();
 expect(native).toEqual([]);
 expect(sent.length).toBe(2);expect(sent[1]).not.toBe(sent[0]);
 const bar=page.locator('.console-snackbar');await expect(bar).toContainText('환불 결과 확인 중');await expect(bar).not.toContainText('환불 완료');
});
