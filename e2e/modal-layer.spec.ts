import {test,expect} from '@playwright/test';

// UI-only fixtures: opening/cancelling these dialogs must not change any account.
test('table action dialogs cover the viewport above sticky headers and restore scrolling',async({page},info)=>{
 const mutations:string[]=[];
 const members=Array.from({length:30},(_,i)=>({id:`modal-member-${i}`,email:`modal-${i}@example.invalid`,nickname:`검증 회원 ${i+1}`,enabled:true,status:'CONFIRMED',creator:null,created_at:'2026-10-31T00:00:00Z',suspended_at:null,suspended_until:null,withdrawn_at:null,purged_at:null}));
 await page.route('**/api/v1/admin/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET')mutations.push(path);
  const data=path.endsWith('/me')?{id:'modal-operator',name:'검증 운영자',role:'SUPER_ADMIN',permissions:{members:{view:true,update:true}}}
   :path.endsWith('/members')?{items:members,total:30,page:1,pageSize:30}:[];
  await route.fulfill({json:{success:true,data,errorMessage:null,errorCode:null}});
 });
 await page.goto('/console/members');
 const table=page.locator('.main .table-wrap').first(),row=table.locator('tbody tr').nth(5);
 await expect(table.locator('tbody tr')).toHaveCount(30);
 const initialOverflow=await page.evaluate(()=>document.body.style.overflow);
 for(const [button,title] of [['이용 제한','회원 이용 제한'],['회원 삭제','회원 삭제']]){
  await row.getByRole('button',{name:button,exact:true}).click();
  const dialog=page.getByRole('dialog',{name:title,exact:true}),backdrop=page.locator('.dialog-backdrop');
  await expect(dialog).toBeVisible();
  // A full-viewport rectangle alone is insufficient: isolation can still paint it under the app bar.
  expect(await page.evaluate(()=>!!document.elementFromPoint(8,8)?.closest('.dialog-backdrop'))).toBe(true);
  expect(await backdrop.evaluate(e=>e.parentElement===document.body)).toBe(true);
  const bounds=await backdrop.boundingBox(),viewport=page.viewportSize()!;
  expect(bounds!.x).toBeCloseTo(0);expect(bounds!.y).toBeCloseTo(0);
  expect(bounds!.width).toBeCloseTo(viewport.width);expect(bounds!.height).toBeCloseTo(viewport.height);
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
  const before=await table.evaluate(e=>({top:e.scrollTop,left:e.scrollLeft}));
  await dialog.evaluate(e=>e.scrollTop=e.scrollHeight);
  expect(await table.evaluate(e=>({top:e.scrollTop,left:e.scrollLeft}))).toEqual(before);
  await page.screenshot({path:info.outputPath(`${button}-viewport.png`)});
  if(button==='회원 삭제')await expect(dialog.getByRole('button',{name:'삭제',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe(initialOverflow);
  await row.getByRole('button',{name:button,exact:true}).click();await expect(dialog).toBeVisible();
  await page.mouse.click(8,8);await expect(dialog).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe(initialOverflow);
 }
 if(page.viewportSize()!.width<=1079){
  const head=table.locator('thead');await table.evaluate(e=>e.scrollTop=0);
  const top=(await head.boundingBox())!.y;await table.evaluate(e=>e.scrollTop=180);
  await expect.poll(async()=>Math.abs((await head.boundingBox())!.y-top)).toBeLessThan(2);
 }
 expect(mutations).toEqual([]);
});
