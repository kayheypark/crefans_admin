import {test,expect,type Page} from '@playwright/test';

// UI-only fixtures: opening/cancelling these dialogs must not change any account.
async function openMembers(page:Page){
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
 await expect(page.locator('.main .table-wrap tbody tr')).toHaveCount(30);
 return mutations;
}

test('table action dialogs cover the viewport above sticky headers and restore scrolling',async({page},info)=>{
 const mutations=await openMembers(page);
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

test('pressing inside and releasing outside keeps the dialog and entered values',async({page},info)=>{
 const mutations=await openMembers(page);
 const trigger=page.getByRole('button',{name:'회원 삭제',exact:true}).first();
 // Keyboard opening gives a known return-focus target, including WebKit's non-focusing mouse buttons.
 await trigger.focus();
 await trigger.press('Enter');
 const dialog=page.getByRole('dialog',{name:'회원 삭제',exact:true});
 const reason=dialog.getByRole('textbox',{name:'삭제 사유'}),phrase=dialog.locator('input');
 await reason.fill('작성 중인 내용은 유지되어야 합니다.');
 await phrase.fill('입력 중');
 await dialog.evaluate(e=>e.scrollTop=0);
 const box=(await dialog.boundingBox())!;
 // Reproduce a real mouse gesture, including the browser-generated ancestor click.
 await page.mouse.move(box.x+6,box.y+6);await page.mouse.down();
 await page.mouse.move(8,8,{steps:8});await page.mouse.up();
 await expect(dialog).toBeVisible();
 await expect(reason).toHaveValue('작성 중인 내용은 유지되어야 합니다.');
 await expect(phrase).toHaveValue('입력 중');
 await page.screenshot({path:info.outputPath('inside-to-outside-preserves-input.png')});
 // Starting outside and releasing inside is not an intentional backdrop click either.
 await page.mouse.move(8,8);await page.mouse.down();
 await page.mouse.move(box.x+6,box.y+6,{steps:8});await page.mouse.up();
 await expect(dialog).toBeVisible();
 await page.mouse.click(8,8,{button:'right'});await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'취소',exact:true}).click();await expect(dialog).toHaveCount(0);
 await expect(trigger).toBeFocused();
 expect(mutations).toEqual([]);
});

test('cancelled or captured pointer releases cannot dismiss the dialog',async({page})=>{
 const mutations=await openMembers(page);
 await page.getByRole('button',{name:'회원 삭제',exact:true}).first().click();
 const dialog=page.getByRole('dialog',{name:'회원 삭제',exact:true}),backdrop=page.locator('.dialog-backdrop');
 const phrase=dialog.locator('input');await phrase.fill('작성 중');
 const box=(await dialog.boundingBox())!;
 const pointer={pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:8,clientY:8};
 // Synthetic events isolate implicit-capture target retargeting, cancellation and pointer identity.
 await backdrop.dispatchEvent('pointerdown',{...pointer,buttons:1});
 await backdrop.dispatchEvent('pointerup',{...pointer,clientX:box.x+box.width/2,clientY:box.y+box.height/2});
 await backdrop.dispatchEvent('click');await expect(dialog).toBeVisible();
 await backdrop.dispatchEvent('pointerdown',{...pointer,buttons:1});
 await backdrop.dispatchEvent('pointercancel',pointer);
 await backdrop.dispatchEvent('click');await expect(dialog).toBeVisible();
 await backdrop.dispatchEvent('pointerdown',{...pointer,buttons:1});
 await backdrop.dispatchEvent('pointerup',{...pointer,pointerId:8});
 await backdrop.dispatchEvent('click');await expect(dialog).toBeVisible();
 await backdrop.dispatchEvent('pointerdown',{...pointer,isPrimary:false,buttons:1});
 await backdrop.dispatchEvent('pointerup',{...pointer,isPrimary:false});
 await backdrop.dispatchEvent('click');await expect(dialog).toBeVisible();
 await expect(phrase).toHaveValue('작성 중');
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 expect(mutations).toEqual([]);
});

test('intentional backdrop touch taps still close and restore scrolling',async({page,hasTouch})=>{
 test.skip(!hasTouch,'Touch-enabled mobile projects only');
 const mutations=await openMembers(page),initialOverflow=await page.evaluate(()=>document.body.style.overflow);
 await page.getByRole('button',{name:'회원 삭제',exact:true}).first().tap();
 const dialog=page.getByRole('dialog',{name:'회원 삭제',exact:true});await expect(dialog).toBeVisible();
 await page.touchscreen.tap(8,8);await expect(dialog).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe(initialOverflow);
 expect(mutations).toEqual([]);
});

test('touch crossing the modal boundary and touch cancellation preserve input',async({page,browserName,hasTouch},info)=>{
 test.skip(!hasTouch||browserName!=='chromium','Native moving touch input uses Chromium CDP');
 const mutations=await openMembers(page);
 await page.getByRole('button',{name:'회원 삭제',exact:true}).first().tap();
 const dialog=page.getByRole('dialog',{name:'회원 삭제',exact:true}),phrase=dialog.locator('input');
 await phrase.fill('모바일 작성 중');await dialog.evaluate(e=>e.scrollTop=0);
 const box=(await dialog.boundingBox())!,session=await page.context().newCDPSession(page);
 // A short crossing stays below the scroll threshold; capture may keep the original event target.
 const inside={x:box.x+2,y:box.y+box.height/2},outside={x:box.x-2,y:inside.y};
 for(const [start,end] of [[inside,outside],[outside,inside]]){
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(dialog).toBeVisible();await expect(phrase).toHaveValue('모바일 작성 중');
 }
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:8,y:8}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await expect(dialog).toBeVisible();await expect(phrase).toHaveValue('모바일 작성 중');
 await page.screenshot({path:info.outputPath('touch-preserves-input.png')});
 await page.touchscreen.tap(8,8);await expect(dialog).toHaveCount(0);
 await session.detach();expect(mutations).toEqual([]);
});
