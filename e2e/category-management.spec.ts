import {test,expect} from '@playwright/test';
import path from 'node:path';
test('category order, edit and icon upload persist and reach the public catalog',async({page},info)=>{
 const prefix=`cat-ui-${process.env.ADMIN_E2E_EMAIL!.slice(6,22)}-`,name=prefix+'manage-'+info.project.name,renamed=name+'변경';
 await page.goto('/login');await page.getByLabel('이메일',{exact:true}).fill(process.env.ADMIN_E2E_EMAIL!);await page.getByLabel('비밀번호',{exact:true}).fill(process.env.ADMIN_E2E_PASSWORD!);await page.getByRole('button',{name:'로그인',exact:true}).click();await expect(page).toHaveURL('/console');await page.goto('/console/settings');
 const area=page.locator('#categories');await area.getByLabel('분야 이름').fill(name);await area.getByRole('button',{name:'분야 추가',exact:true}).click();
 const row=area.getByRole('row').filter({hasText:name});await expect(row).toContainText('사용 중');
 await area.getByRole('button',{name:name+' 위로',exact:true}).click();await expect(area.getByRole('status').filter({hasText:'아직 저장하지 않은'})).toBeVisible();await area.getByRole('button',{name:'순서 저장',exact:true}).click();await expect(area.getByRole('button',{name:'순서 저장',exact:true})).toBeDisabled();
 const afterOrder=await area.getByRole('row').allTextContents();await page.reload();await expect(area.getByRole('row').filter({hasText:name})).toBeVisible();expect(await area.getByRole('row').allTextContents()).toEqual(afterOrder);
 await row.getByRole('button',{name:'편집'}).click();const modal=page.getByRole('dialog',{name:'활동 분야 편집'});
 await modal.getByLabel('아이콘 이미지').setInputFiles(path.resolve('public/brand/categories/travel-round-flat-v1.png'));
 const img=modal.getByAltText('현재 분야 아이콘');await expect(img).toHaveAttribute('src',/^\/api\/v1\/admin\/categories\//);const icon=await img.getAttribute('src');await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 await page.screenshot({path:info.outputPath('category-icon-editor.png')});
 await modal.getByLabel('분야 이름',{exact:true}).fill(renamed);await modal.getByRole('button',{name:'변경 저장'}).click();await expect(modal).toHaveCount(0);await expect(area.getByRole('row').filter({hasText:renamed})).toBeVisible();await page.reload();
 const saved=area.getByRole('row').filter({hasText:renamed});await expect(saved.getByRole('img')).toHaveAttribute('src',icon!);
 const response=await page.request.get('http://127.0.0.1:3013/api/v1/bootstrap');const catalog=(await response.json()).data.data;expect(catalog.categories).toContain(renamed);expect(catalog.categoryIcons[renamed]).toBe(icon!.replace('/admin/categories/','/categories/'));
 await saved.getByRole('button',{name:'편집'}).click();await modal.getByLabel('아이콘 이미지').setInputFiles(path.resolve('public/brand/categories/music-round-flat-v1.png'));await expect(img).not.toHaveAttribute('src',icon!);await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 await modal.getByRole('button',{name:'기본 아이콘으로 복원'}).click();await expect(modal.getByText('아이콘 없음')).toBeVisible();await modal.getByRole('checkbox',{name:'사용 중'}).uncheck();await modal.getByRole('button',{name:'변경 저장'}).click();await expect(saved).toContainText('미사용');
 await page.screenshot({path:info.outputPath('category-list.png')});expect((await (await page.request.get('http://127.0.0.1:3013/api/v1/bootstrap')).json()).data.data.categories).not.toContain(renamed);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('preview-order shortcut preserves other categories and reports concurrent save conflicts',async({page})=>{
 let rows=[{id:'art',name:'아트',active:true},{id:'other',name:'추가 분야',active:true},{id:'game',name:'게임',active:false},{id:'life',name:'라이프스타일',active:true}].map((r,i)=>({...r,sortOrder:i,iconUrl:null,customIcon:false})),rejectOnce=true;
 await page.route('**/api/v1/admin/**',async route=>{
  const p=new URL(route.request().url()).pathname;
  if(p.endsWith('/categories/order')){
   const body=route.request().postDataJSON();expect(body.expectedIds).toEqual(['art','other','game','life']);expect(body.ids).toEqual(['life','game','art','other']);
   if(rejectOnce){rejectOnce=false;return route.fulfill({status:409,json:{success:false,data:null,errorCode:'CATEGORY_ORDER_CHANGED',errorMessage:'다른 운영자가 목록을 변경했습니다. 새로고침 후 다시 정렬해주세요.'}});}
   rows=body.ids.map((id:string)=>rows.find(r=>r.id===id));return route.fulfill({json:{success:true,data:rows}});
  }
  const data=p.endsWith('/me')?{id:'qa-operator',name:'QA',role:'MODERATOR',permissions:{content:{view:true,update:true}}}:p.endsWith('/categories')?rows:[];
  return route.fulfill({json:{success:true,data}});
 });
 await page.goto('/console/settings');const area=page.locator('#categories');await area.getByRole('button',{name:'목업 순서로 정렬'}).click();
 await expect(area.locator('tbody tr td:nth-child(3)')).toHaveText(['라이프스타일','게임','아트','추가 분야']);await area.getByRole('button',{name:'순서 저장',exact:true}).click();await expect(area.getByRole('alert')).toContainText('다른 운영자가');await expect(area.getByRole('button',{name:'순서 저장',exact:true})).toBeEnabled();
 await area.getByRole('button',{name:'순서 저장',exact:true}).click();await expect(area.getByRole('button',{name:'순서 저장',exact:true})).toBeDisabled();await expect(area.getByRole('alert')).toHaveCount(0);await expect(area.getByRole('row').filter({hasText:'게임'})).toContainText('미사용');
});
