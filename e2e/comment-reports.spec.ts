import {test,expect} from '@playwright/test';
// Comment reports against an API stand-in; hiding and its counts are covered by server tests/platform-comment-social.test.cjs.
test('댓글 신고는 댓글 내용을 보여주고, 숨기고 처리 완료하면 숨김과 처리를 차례로 보낸다 (API 대역)',async({page},info)=>{
  const mutations:any[]=[];let reports=[{id:'report-1',target_type:'COMMENT',target_id:'comment-1',reason:'SPAM',description:null,comment:{id:'comment-1',content:'광고 링크 남깁니다',posting_id:'post-1',author_id:'fan-1',hidden:false,is_deleted:false}},{id:'report-2',target_type:'POSTING',target_id:'post-2',reason:'COPYRIGHT',description:'무단 사용'}];
  await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url()),method=route.request().method();let data:any={};
    if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'ADMIN',permissions:{content:{view:true,update:true}}};
    else if(url.pathname.endsWith('/posts'))data={items:[],total:0,page:1};
    else if(url.pathname.endsWith('/reports'))data=reports;
    else if(method==='POST'){mutations.push({path:url.pathname,body:route.request().postDataJSON()});if(url.pathname.endsWith('/resolve'))reports=reports.filter(r=>!url.pathname.includes(r.id));data={message:'완료'};}
    await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});
  page.on('dialog',dialog=>void dialog.accept());
  await page.goto('/console/content');
  const comment=page.getByRole('row',{name:/광고 링크 남깁니다/});await expect(comment).toContainText('댓글');await expect(comment).toContainText('스팸·광고');
  const post=page.getByRole('row',{name:/무단 사용/});await expect(post).toContainText('게시물');await expect(post.getByRole('button',{name:'댓글 숨기고 처리 완료'})).toHaveCount(0);
  const hide=comment.getByRole('button',{name:'댓글 숨기고 처리 완료'});await expect(hide).toBeDisabled();
  await comment.getByLabel('신고 처리 메모').fill('스팸 확인');await expect(hide).toBeDisabled();await expect(post.getByLabel('당사자에게 보일 사유')).toHaveCount(0);await comment.getByLabel('당사자에게 보일 사유').fill('광고성 댓글로 운영정책을 위반했습니다.');await expect(hide).toBeEnabled();await page.screenshot({path:info.outputPath('comment-report-row.png')});
  await hide.click();await expect(page.getByRole('row',{name:/광고 링크 남깁니다/})).toHaveCount(0);
  expect(mutations).toEqual([{path:'/api/v1/admin/comments/comment-1/moderation',body:{hidden:true,reason:'스팸 확인',publicReason:'광고성 댓글로 운영정책을 위반했습니다.'}},{path:'/api/v1/admin/reports/report-1/resolve',body:{status:'RESOLVED',note:'스팸 확인'}}]);
});
