import {test,expect,type Page} from '@playwright/test';
// 2026-11-06: 콩 출금 "이체 완료 기록"·"반려"는 window.prompt 대신 콘솔 자체 입력 다이얼로그를 쓴다.
// 내장 브라우저는 네이티브 창을 막아 prompt() 가 null 을 돌려주므로 기록이 조용히 취소됐다. API 대역 기준.
async function fixture(page:Page){const mutations:{path:string;body:any}[]=[];
 const payout=(id:string,status:string)=>({id,creator_id:'creator-1',quantity:1000,gross:100000,fee:20000,net:80000,status,note:'',sources:{postQuantity:1000,profileQuantity:0,unattributedQuantity:0},funding:{paidQuantity:1000,promotionQuantity:0,unknownQuantity:0}});
 await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method();let data:any={};
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'정산',role:'SUPER_ADMIN',beanSupport:true,manualPayouts:true,permissions:{beans:{view:true,create:true,update:true}}};
  else if(url.pathname.endsWith('/beans/overview'))data={stock:[],charges:[],tips:[],payouts:[payout('payout-processing','processing'),payout('payout-requested','requested')],summary:{chargeGroups:[],tipGroups:[],payoutGroups:[],payoutFundingGroups:[],tipSourceGroups:[]},promotionToday:{used:0,limit:10000}};
  else if(url.pathname.endsWith('/beans/receivables'))data=[];
  else if(method==='POST'){mutations.push({path:url.pathname,body:route.request().postDataJSON()});data={message:'처리했습니다.'};}
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
 return mutations;}

test('출금 이체 완료 기록과 반려는 콘솔 입력 다이얼로그로 받고, 빈 값·취소는 보내지 않는다 (API 대역)',async({page},info)=>{
 const mutations=await fixture(page),native:string[]=[];page.on('dialog',d=>{native.push(d.type()+':'+d.message());void d.dismiss();});
 await page.goto('/console/beans');
 const processing=page.getByRole('row').filter({hasText:'payout-processing'}),requested=page.getByRole('row').filter({hasText:'payout-requested'});

 // 이체 완료 기록: 취소하면 아무것도 보내지 않는다.
 await processing.getByRole('button',{name:'이체 완료 기록',exact:true}).click();
 const transfer=page.getByRole('dialog',{name:'이체 완료 기록',exact:true}),record=transfer.getByRole('button',{name:'이체 완료 기록',exact:true});
 await expect(transfer).toContainText('80,000원');await expect(transfer).toContainText('되돌릴 수 없으니');
 await expect(transfer.getByLabel('은행 이체 참조번호')).toBeFocused();
 await expect(record).toBeDisabled();await transfer.getByLabel('은행 이체 참조번호').fill('   ');await expect(record).toBeDisabled();
 await transfer.getByRole('button',{name:'취소',exact:true}).click();await expect(transfer).toHaveCount(0);expect(mutations).toEqual([]);

 // 다시 열면 이전 입력이 남아 있지 않고, 앞뒤 공백을 지운 값을 보낸다.
 await processing.getByRole('button',{name:'이체 완료 기록',exact:true}).click();
 await expect(transfer.getByLabel('은행 이체 참조번호')).toHaveValue('');
 await transfer.getByLabel('은행 이체 참조번호').fill('  BANK-REF-001 ');await page.screenshot({path:info.outputPath('payout-transfer-prompt.png')});
 await transfer.getByLabel('은행 이체 참조번호').press('Enter');await expect(transfer).toHaveCount(0);
 await expect.poll(()=>mutations.length).toBe(1);
 expect(mutations[0]).toEqual({path:'/api/v1/admin/beans/withdrawals/payout-processing/manual-result',body:{result:'paid',reference:'BANK-REF-001'}});

 // 반려: 위험 동작이라 빨간 버튼, Esc 로 닫으면 보내지 않는다.
 await requested.getByRole('button',{name:'반려',exact:true}).click();
 const reject=page.getByRole('dialog',{name:'출금 반려',exact:true});
 await expect(reject.getByRole('button',{name:'반려',exact:true})).toHaveClass(/danger/);
 await page.keyboard.press('Escape');await expect(reject).toHaveCount(0);expect(mutations).toHaveLength(1);
 await requested.getByRole('button',{name:'반려',exact:true}).click();
 await reject.getByLabel('반려 사유').fill('계좌 예금주 불일치');await reject.getByRole('button',{name:'반려',exact:true}).click();
 await expect.poll(()=>mutations.length).toBe(2);
 expect(mutations[1]).toEqual({path:'/api/v1/admin/beans/withdrawals/payout-requested/reject',body:{reason:'계좌 예금주 불일치'}});
 expect(native).toEqual([]);
});
