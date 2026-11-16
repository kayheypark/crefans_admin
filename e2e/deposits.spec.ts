import {test,expect,type Page} from '@playwright/test';

// 무통장입금 console with every admin API answered by the spec (no server, no real payment or account data).
const hour=3600000;
async function mock(page:Page){
 const errors:string[]=[],posts:{path:string;body:unknown}[]=[],now=Date.now();
 page.on('pageerror',e=>errors.push(e.message));
 const payment={id:'btp-1',kind:'bean',orderId:'charge-1',amount:11000,status:'awaiting',statusLabel:'입금 대기',depositorName:'홍길동',account:null,expiresAt:new Date(now+3*hour+5*60000).toISOString(),confirmedAt:null,cashReceipt:{type:'income',issued:false},memberId:'member-1',receivedAt:null,depositReference:null,confirmedBy:null,cancelReason:null,cashReceiptIssuedAt:null,cashReceiptReference:null,createdAt:new Date(now-hour).toISOString()};
 const confirmed={...payment,id:'btp-2',kind:'ai-shop',orderId:'shop-1',status:'confirmed',statusLabel:'입금 확인',receivedAt:new Date(now-2*hour).toISOString(),depositReference:'메모123',confirmedAt:new Date(now-hour).toISOString(),cashReceipt:{type:'expense',issued:false}};
 const refund={id:'mr-1',kind:'ad',refundId:'r-1',orderId:'ad-1',memberId:'member-2',amount:55000,status:'requested',statusLabel:'환불 이체 대기',bankName:'신한은행',dueAt:new Date(now-hour).toISOString(),completedAt:null,transferReference:null,rejectReason:null,createdAt:new Date(now-5*24*hour).toISOString()};
 await page.route('**/api/v1/admin/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1/admin','');
  const ok=(data:unknown)=>route.fulfill({json:{success:true,data,errorMessage:null,errorCode:null}});
  if(req.method()!=='GET')posts.push({path,body:req.postDataJSON()});
  if(path==='/me')return ok({id:'qa',name:'검증 운영자',role:'ADMIN',permissions:{deposits:{view:true,update:true}}});
  if(path==='/bank-transfer/account'&&req.method()==='GET')return ok(null);
  if(path==='/bank-transfer/account')return ok({...req.postDataJSON(),updatedAt:new Date().toISOString()});
  if(path==='/bank-transfer/payments')return ok({items:url.searchParams.get('status')==='confirmed'?[confirmed]:[payment],total:1,page:1});
  if(path==='/bank-transfer/refunds')return ok([refund]);
  if(path==='/bank-transfer/payments/btp-1/confirm')return route.fulfill({status:400,json:{success:false,data:null,errorMessage:'입금액이 주문 금액과 같을 때만 확인할 수 있어요.',errorCode:'DEPOSIT_AMOUNT_MISMATCH'}});
  if(path==='/bank-transfer/payments/btp-1/cancel')return ok(payment);
  if(path==='/bank-transfer/payments/btp-2/cash-receipt/reveal')return ok({type:'expense',number:'1234567890'});
  if(path==='/bank-transfer/refunds/mr-1/account/reveal')return ok({bankName:'신한은행',accountNumber:'110123456789',holder:'김환불'});
  if(path==='/bank-transfer/refunds/mr-1/reject')return ok({...refund,status:'rejected'});
  return route.fulfill({status:404,json:{success:false,errorMessage:'unexpected '+path}});
 });
 return {errors,posts};
}

test('deposits: account setup, confirm, cancel, cash receipt and refund transfer flows',async({page},info)=>{
 const {errors,posts}=await mock(page);
 await page.goto('/console/deposits');
 await expect(page.getByRole('heading',{level:1,name:'입금 확인'})).toBeVisible();
 await expect(page.locator('nav a[href="/console/deposits"]')).toHaveCount(1);
 await expect(page.getByText('미설정 (무통장입금 주문 불가)')).toBeVisible();

 // 1. Account save goes through a confirmation and sends exactly the typed values.
 const account=page.getByRole('form',{name:'입금 계좌 설정'});
 await account.getByLabel('은행').fill('국민은행');await account.getByLabel('계좌번호').fill('123-456-789012');await account.getByLabel('예금주').fill('크레팬스');await account.getByLabel('무통장입금 사용').check();
 await account.getByRole('button',{name:'저장'}).click();
 const save=page.getByRole('dialog',{name:'입금 계좌 저장'});await expect(save).toContainText('현재: 미설정');
 await save.getByRole('button',{name:'저장'}).click();
 await expect.poll(()=>posts.find(p=>p.path==='/bank-transfer/account')?.body).toEqual({bankName:'국민은행',accountNumber:'123-456-789012',holder:'크레팬스',enabled:true});

 // 2. Awaiting list columns.
 const row=page.getByRole('table',{name:'무통장입금 주문'}).getByRole('row').nth(1);
 await expect(row).toContainText('콩 충전');await expect(row).toContainText('11,000원');await expect(row).toContainText('홍길동');await expect(row).toContainText(/3시간 [45]분 남음/);await expect(row).toContainText('소득공제 · 미발급');

 // 3. Confirm: a different amount is blocked on the page; the server's DEPOSIT_AMOUNT_MISMATCH is shown plainly.
 await row.getByRole('button',{name:'입금 확인'}).click();
 const confirm=page.getByRole('dialog',{name:'입금 확인'});
 await confirm.getByLabel('실제 입금액 (원)').fill('10000');
 await expect(confirm.getByRole('alert')).toContainText('주문 금액(11,000원)과 다릅니다');
 await expect(confirm.getByRole('button',{name:'입금 확인'})).toBeDisabled();
 await confirm.getByLabel('실제 입금액 (원)').fill('11000');
 await confirm.getByLabel('실제 입금 시각 (한국 시간)').fill('2026-11-16T09:30');
 await confirm.getByLabel('거래 메모·참조').fill('메모-1');
 await confirm.getByRole('button',{name:'입금 확인'}).click();
 await expect(confirm.getByRole('alert')).toContainText('구매자에게 연락해 차액을 해결한 뒤 처리하세요');
 expect(posts.find(p=>p.path==='/bank-transfer/payments/btp-1/confirm')?.body).toEqual({amount:11000,receivedAt:'2026-11-16T00:30:00.000Z',reference:'메모-1'});
 await info.attach('confirm-dialog',{body:await page.screenshot(),contentType:'image/png'});
 await confirm.getByRole('button',{name:'닫기'}).click();

 // 4. Cancel needs a reason and the typed phrase.
 await row.getByRole('button',{name:'주문 취소'}).click();
 const cancel=page.getByRole('dialog',{name:'무통장입금 주문 취소'});
 await cancel.getByRole('textbox').last().fill('주문 취소');
 await expect(cancel.getByRole('button',{name:'주문 취소'})).toBeDisabled();
 await cancel.getByLabel('취소 사유').fill('구매자 요청');
 await cancel.getByRole('button',{name:'주문 취소'}).click();
 await expect.poll(()=>posts.find(p=>p.path==='/bank-transfer/payments/btp-1/cancel')?.body).toEqual({reason:'구매자 요청'});

 // 5. Confirmed rows: the number shows only after the click; issuance can be recorded.
 await page.getByLabel('상태').first().selectOption('confirmed');
 const done=page.getByRole('table',{name:'무통장입금 주문'}).getByRole('row').nth(1);
 await expect(done).toContainText('AI 이용권');await expect(done).not.toContainText('1234567890');
 await done.getByRole('button',{name:'번호 보기'}).click();
 await expect(done).toContainText('1234567890');
 await expect(done.getByRole('button',{name:'발급 기록'})).toBeVisible();

 // 6. Refunds: overdue mark, account reveal on click, reject explains the restore.
 const refund=page.getByRole('table',{name:'환불 이체'}).getByRole('row').nth(1);
 await expect(refund).toContainText('광고상품');await expect(refund.locator('.deposit-overdue')).toHaveText(' 기한 지남');await expect(refund).not.toContainText('110123456789');
 await refund.getByRole('button',{name:'계좌 보기'}).click();await expect(refund).toContainText('110123456789');
 await refund.getByRole('button',{name:'반려'}).click();
 const reject=page.getByRole('dialog',{name:'환불 반려'});await expect(reject).toContainText('구매가 환불 신청 전 상태로 돌아갑니다');
 await reject.getByLabel('반려 사유').fill('계좌 오류');await reject.getByRole('button',{name:'반려'}).click();
 await expect.poll(()=>posts.find(p=>p.path==='/bank-transfer/refunds/mr-1/reject')?.body).toEqual({reason:'계좌 오류'});

 await page.screenshot({path:info.outputPath('deposits.png'),fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(overflow).toBeLessThanOrEqual(0);
 expect(errors).toEqual([]);
});

test('view-only operators see lists without actions',async({page})=>{
 const {posts}=await mock(page);
 await page.route('**/api/v1/admin/me',route=>route.fulfill({json:{success:true,data:{id:'qa',name:'조회 운영자',role:'ADMIN',permissions:{deposits:{view:true}}},errorMessage:null,errorCode:null}}));
 await page.goto('/console/deposits');
 await expect(page.getByText('입금 계좌 변경 권한이 없어 조회만 할 수 있습니다.')).toBeVisible();
 await expect(page.getByRole('table',{name:'무통장입금 주문'})).toContainText('홍길동');
 await expect(page.getByRole('button',{name:'입금 확인'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'계좌 보기'})).toHaveCount(0);
 expect(posts).toEqual([]);
});
