import {test,expect} from '@playwright/test';
test('support editors use portals, preserve failed edits, and close after saving',async({page},info)=>{
 let fail=true;const saved:any[]=[];
 await page.route('**/api/v1/admin/**',async route=>{const path=new URL(route.request().url()).pathname;
 if(route.request().method()!=='GET'){if(fail)return route.fulfill({status:500,json:{success:false,errorMessage:'저장 실패'}});saved.push(route.request().postDataJSON());return route.fulfill({json:{success:true,data:{}}});}
 const data=path.endsWith('/me')?{id:'qa',name:'테스트',role:'SUPER_ADMIN',permissions:{support:{view:true,create:true,update:true}}}:path.endsWith('/inquiries')?[{id:'ticket',title:'테스트 문의',message:'문의 내용',reply:'',category:'기타',status:'open'}]:path.endsWith('/documents')?[{id:'doc',kind:'notice',title:'기존 공지',content:{paragraphs:['첫 문단','둘째 문단']},published:false,category:'news',pinned:true}]:{};await route.fulfill({json:{success:true,data}});
 });
 // 2026-11-06: 저장 확인은 콘솔 자체 다이얼로그여야 한다. 네이티브 창은 내장 브라우저에서 차단돼 저장이 조용히 취소되므로 하나라도 뜨면 실패시킨다.
 const native:string[]=[];page.on('dialog',d=>{native.push(d.type()+':'+d.message());void d.dismiss();});
 const confirmBox=page.getByRole('dialog',{name:'초안 저장'});
 await page.goto('/console/support');await expect(page.getByRole('button',{name:'새 문서',exact:true})).toBeVisible();await expect(page.locator('main form.editor')).toHaveCount(0);
 await page.getByRole('button',{name:'새 문서',exact:true}).click();let modal=page.getByRole('dialog').first();await expect(modal).toHaveAccessibleName('문서 등록');expect(await page.locator('.dialog-backdrop').evaluate(x=>x.parentElement===document.body)).toBe(true);await modal.getByLabel('제목',{exact:true}).fill('새 문서');await modal.getByRole('textbox',{name:'본문',exact:true}).fill('새 본문');
 await modal.getByRole('button',{name:'문서 저장'}).click();
 await expect(confirmBox).toBeVisible();await expect(confirmBox).toContainText('서비스에는 표시되지 않습니다');
 // 취소하면 저장 요청이 나가지 않는다.
 await confirmBox.getByRole('button',{name:'취소',exact:true}).click();await expect(confirmBox).toHaveCount(0);await expect(modal).toBeVisible();expect(saved.length).toBe(0);
 await modal.getByRole('button',{name:'문서 저장'}).click();await confirmBox.getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(modal.getByRole('alert')).toHaveText('저장 실패');await expect(modal.getByRole('textbox',{name:'본문',exact:true})).toHaveValue('새 본문');fail=false;await modal.getByRole('button',{name:'문서 저장'}).click();await confirmBox.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(modal).toHaveCount(0);expect(saved[0].content).toEqual({paragraphs:['새 본문']});
 await page.getByRole('button',{name:'편집',exact:true}).click();await expect(modal).toHaveAccessibleName('문서 수정');await expect(modal.getByRole('textbox',{name:'본문',exact:true})).toHaveValue('첫 문단\n\n둘째 문단');await modal.getByLabel('제목',{exact:true}).fill('변경 공지');await page.screenshot({path:info.outputPath('document.png')});expect(await modal.evaluate(x=>x.scrollWidth<=x.clientWidth)).toBe(true);await modal.getByRole('button',{name:'문서 저장'}).click();
 await confirmBox.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(modal).toHaveCount(0);expect(saved[1]).toMatchObject({id:'doc',title:'변경 공지',category:'news',pinned:true});
 await page.getByRole('button',{name:'답변 등록',exact:true}).click();await expect(modal).toHaveAccessibleName('문의 답변 등록');await modal.getByLabel('문의 답변',{exact:true}).fill('답변 내용');await modal.getByRole('button',{name:'취소',exact:true}).click();await expect(modal).toHaveCount(0);expect(saved.length).toBe(2);await page.getByRole('button',{name:'답변 등록',exact:true}).click();await expect(modal.getByLabel('문의 답변',{exact:true})).toHaveValue('');await modal.getByLabel('문의 답변',{exact:true}).fill('답변 내용');await modal.getByRole('button',{name:'답변 저장'}).click();await expect(modal).toHaveCount(0);expect(saved[2]).toEqual({reply:'답변 내용'});
 expect(native).toEqual([]);
});
