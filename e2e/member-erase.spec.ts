import {test,expect} from '@playwright/test';
// Member erase against an API stand-in; the server rules (super admin only, checks, purge) are in server tests/platform-member-erase.test.cjs.
const members=[{id:'member-1',email:'fan@example.test',nickname:'삭제 대상',enabled:true,status:'CONFIRMED',suspended_at:null,suspended_until:null,suspension_reason:null,withdrawn_at:null,purged_at:null,created_at:'2026-10-01T00:00:00Z',creator:null},{id:'member-2',email:'withdrawn-member-2@deleted.invalid',nickname:'탈퇴한 사용자',enabled:false,status:'CONFIRMED',suspended_at:null,suspended_until:null,suspension_reason:null,withdrawn_at:'2026-10-02T00:00:00Z',purged_at:'2026-10-02T00:00:00Z',created_at:'2026-09-01T00:00:00Z',creator:null}];
async function stub(page:any,role:string,mutations:any[]){
 await page.route('**/api/v1/admin/**',async(route:any)=>{const url=new URL(route.request().url()),method=route.request().method();let data:any={};
  if(url.pathname.endsWith('/me'))data={id:'operator',name:'운영',role,permissions:{members:{view:true,update:true}}};
  else if(url.pathname.endsWith('/admin/members'))data={items:members,total:2,page:1,pageSize:20};
  else if(method==='POST'){mutations.push({path:url.pathname,body:route.request().postDataJSON()});data={message:'회원을 삭제했습니다. 같은 이메일로 다시 초대·가입할 수 있습니다.'};}
  await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
}
test('최고 관리자는 사유와 이메일을 그대로 입력해야 회원을 삭제할 수 있다 (API 대역)',async({page},info)=>{
 const mutations:any[]=[];await stub(page,'SUPER_ADMIN',mutations);await page.goto('/console/members');
 await expect(page.getByRole('row',{name:/탈퇴한 사용자/})).toContainText('삭제됨');
 await page.getByRole('row',{name:/삭제 대상/}).getByRole('button',{name:'회원 삭제'}).click();
 const dialog=page.getByRole('dialog',{name:'회원 삭제'}),erase=dialog.getByRole('button',{name:'삭제',exact:true});
 await expect(dialog).toContainText('되돌릴 수 없습니다');await expect(erase).toBeDisabled();
 await dialog.getByRole('textbox').last().fill('fan@example.tes');await expect(erase).toBeDisabled();
 await dialog.getByRole('textbox').last().fill('fan@example.test');await expect(erase).toBeEnabled();
 await erase.click();await expect(dialog.getByRole('alert')).toHaveText('삭제 사유를 입력해주세요.');expect(mutations).toEqual([]);
 await dialog.getByLabel(/삭제 사유/).fill('테스트 계정 정리');await page.screenshot({path:info.outputPath('member-erase-dialog.png')});await erase.click();
 await expect(dialog).toHaveCount(0);
 expect(mutations).toEqual([{path:'/api/v1/admin/members/member-1/erase',body:{reason:'테스트 계정 정리',confirmEmail:'fan@example.test'}}]);
});
test('최고 관리자가 아니면 삭제 열이 없다 (API 대역)',async({page})=>{
 await stub(page,'ADMIN',[]);await page.goto('/console/members');
 await expect(page.getByRole('row',{name:/삭제 대상/})).toBeVisible();await expect(page.getByRole('button',{name:'회원 삭제'})).toHaveCount(0);await expect(page.getByRole('columnheader',{name:'삭제'})).toHaveCount(0);
});
