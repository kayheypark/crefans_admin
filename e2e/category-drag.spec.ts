import {test,expect,type Page,type Route} from '@playwright/test';

const names=['일상','아트','음악','게임','여행','뷰티','코스프레','피트니스','라이프스타일'];
const categories=names.map((name,i)=>({id:`category-${i}`,name,active:true,sortOrder:i,iconUrl:null,customIcon:false}));
const success=(route:Route,data:unknown)=>route.fulfill({json:{success:true,data,errorMessage:null,errorCode:null}});
const rows=(page:Page)=>page.getByRole('table',{name:'활동 분야 목록'}).locator('tbody tr');
const order=(page:Page)=>rows(page).locator('td:nth-child(3)').allTextContents();
const handle=(page:Page,name:string)=>page.getByRole('button',{name:`${name} 순서 이동`,exact:true});

async function setup(page:Page,options:{readonly?:boolean;save?:(r:Route)=>Promise<void>}={}){
 let stored=[...categories];const writes:{ids:string[];expectedIds:string[]}[]=[],unexpected:string[]=[],errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/v1/admin/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path.endsWith('/me'))return success(route,{id:'qa-operator',name:'검증 운영자',role:'ADMIN',permissions:{content:{view:true,create:!options.readonly,update:!options.readonly,delete:false}}});
  if(path.endsWith('/categories')&&request.method()==='GET')return success(route,stored);
  if(path.endsWith('/categories/order')&&request.method()==='PUT'){
   const body=request.postDataJSON();writes.push(body);
   if(options.save)return options.save(route);
   stored=body.ids.map((id:string)=>stored.find(row=>row.id===id)!);return success(route,stored);
  }
  unexpected.push(`${request.method()} ${path}`);return route.fulfill({status:404,json:{success:false}});
 });
 await page.goto('/console/settings#categories');await expect(rows(page)).toHaveCount(categories.length);
 return {writes,verify:()=>{expect(unexpected).toEqual([]);expect(errors).toEqual([]);}};
}
async function beginMouse(page:Page,name:string){
 await handle(page,name).scrollIntoViewIfNeeded();const box=await handle(page,name).boundingBox();
 await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();
 await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2+10,{steps:3});
 await expect(page.locator('.category-row-dragging')).toHaveCount(1);return box!;
}

test('mouse drag stays vertical, saves only on request and persists the complete order',async({page,isMobile},info)=>{
 test.skip(isMobile,'Mouse interaction is checked at desktop size.');const {writes,verify}=await setup(page);
 const before=await rows(page).first().boundingBox();const start=await beginMouse(page,'일상');
 await page.mouse.move(start.x+140,start.y+start.height/2,{steps:5});
 expect((await page.locator('.category-row-dragging').boundingBox())!.x).toBeCloseTo(before!.x,0);
 await page.mouse.up();expect(await order(page)).toEqual(names);expect(writes).toHaveLength(0);
 const box=await beginMouse(page,'일상');const target=await handle(page,'음악').boundingBox();
 await page.mouse.move(box.x+150,target!.y+target!.height/2,{steps:12});
 expect((await page.locator('.category-row-dragging').boundingBox())!.x).toBeCloseTo(before!.x,0);
 await expect(page.getByRole('button',{name:'순서 저장',exact:true})).toBeDisabled();
 await page.screenshot({path:info.outputPath('desktop-dragging.png')});
 await page.mouse.up();await expect.poll(()=>order(page)).toEqual(['아트','음악','일상',...names.slice(3)]);expect(writes).toHaveLength(0);
 await page.getByRole('button',{name:'순서 저장',exact:true}).click({delay:60});
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0]).toEqual({ids:['category-1','category-2','category-0',...categories.slice(3).map(r=>r.id)],expectedIds:categories.map(r=>r.id)});
 await expect(page.getByRole('button',{name:'순서 저장',exact:true})).toBeDisabled();await page.reload();
 await expect.poll(()=>order(page)).toEqual(['아트','음악','일상',...names.slice(3)]);
 await page.screenshot({path:info.outputPath('desktop-saved.png'),fullPage:true});verify();
});

test('keyboard is vertical only, announces positions, cancels and keeps focus; arrows remain a tap alternative',async({page,isMobile})=>{
 test.skip(isMobile,'Keyboard interaction is checked at desktop size.');const {writes,verify}=await setup(page);
 await handle(page,'일상').focus();await page.keyboard.press('Space',{delay:40});await expect(page.locator('.category-row-dragging')).toHaveCount(1);
 await page.keyboard.press('ArrowRight',{delay:40});await page.keyboard.press('ArrowLeft',{delay:40});await page.keyboard.press('Enter',{delay:40});await expect(page.locator('.category-row-dragging')).toHaveCount(0);expect(await order(page)).toEqual(names);
 await handle(page,'일상').focus();await page.keyboard.press('Space',{delay:40});await expect(page.locator('.category-row-dragging')).toHaveCount(1);await page.keyboard.press('ArrowDown',{delay:40});
 await expect(page.locator('[id^=DndLiveRegion]')).toContainText('2번째');await page.keyboard.press('Escape',{delay:40});expect(await order(page)).toEqual(names);
 await expect(handle(page,'일상')).toBeFocused();await expect(page.locator('[id^=DndLiveRegion]')).toContainText('취소');
 await page.keyboard.press('Space',{delay:40});await expect(page.locator('.category-row-dragging')).toHaveCount(1);await page.keyboard.press('ArrowDown',{delay:40});await expect(page.locator('[id^=DndLiveRegion]')).toContainText('2번째');await page.keyboard.press('Enter',{delay:40});
 await expect.poll(()=>order(page)).toEqual(['아트','일상',...names.slice(2)]);await expect(handle(page,'일상')).toBeFocused();
 await expect(page.locator('[id^=DndLiveRegion]')).toContainText('2번째로 이동');
 await page.getByRole('button',{name:'일상 위로',exact:true}).click();expect(await order(page)).toEqual(names);
 await expect(page.getByRole('button',{name:'일상 위로',exact:true})).toBeDisabled();expect(writes).toHaveLength(0);verify();
});

test('mobile Chromium native touch drag locks x, cancels safely and ordinary content still scrolls',async({page,isMobile,browserName},info)=>{
 test.skip(!isMobile||browserName!=='chromium','CDP native touch dispatch is Chromium-only; not a physical iPhone test.');
 const {writes,verify}=await setup(page);const session=await page.context().newCDPSession(page);
 await handle(page,'일상').evaluate(node=>node.scrollIntoView({block:'center'}));
 const box=(await handle(page,'일상').boundingBox())!,target=(await handle(page,'음악').boundingBox())!,rowBox=(await rows(page).first().boundingBox())!;
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+80*i/12,y:y+(target.y+target.height/2-y)*i/12}]});
 await expect(page.locator('.category-row-dragging')).toHaveCount(1);
 expect((await page.locator('.category-row-dragging').boundingBox())!.x).toBeCloseTo(rowBox.x,0);
 await page.screenshot({path:info.outputPath('mobile-touch-dragging.png')});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>order(page)).toEqual(['아트','음악','일상',...names.slice(3)]);expect(writes).toHaveLength(0);
 await handle(page,'아트').evaluate(node=>node.scrollIntoView({block:'center'}));const cancel=(await handle(page,'아트').boundingBox())!;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cancel.x+22,y:cancel.y+22}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cancel.x+22,y:cancel.y+90}]});
 await expect(page.locator('.category-row-dragging')).toHaveCount(1);await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await expect(page.locator('.category-row-dragging')).toHaveCount(0);expect(await order(page)).toEqual(['아트','음악','일상',...names.slice(3)]);
 await page.getByRole('button',{name:'순서 저장',exact:true}).tap();await expect.poll(()=>writes.length).toBe(1);
 await expect(page.getByRole('button',{name:'순서 저장',exact:true})).toBeDisabled();
 // Sample the far edge for several animation frames, including auto-scroll ticks.
 await handle(page,'아트').evaluate(node=>node.scrollIntoView({block:'center'}));const edge=(await handle(page,'아트').boundingBox())!;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:edge.x+22,y:edge.y+22}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:edge.x+22,y:edge.y+34}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:382,y:edge.y+90}]});
 const offsets=await page.locator('.category-table').evaluate(async table=>{const samples:number[]=[];for(let i=0;i<15;i++){await new Promise(requestAnimationFrame);samples.push(table.parentElement!.scrollLeft);}return samples;});
 expect(offsets).toEqual(Array(15).fill(0));await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 const scrollPosition=()=>page.locator('.category-table').evaluate(node=>scrollY+node.parentElement!.scrollTop);
 await handle(page,'아트').evaluate(node=>node.scrollIntoView({block:'center'}));const autoStart=(await handle(page,'아트').boundingBox())!;
 const scrollAtDragStart=await scrollPosition(),bottom=await page.locator('.category-table').evaluate(node=>Math.min(innerHeight,node.parentElement!.getBoundingClientRect().bottom)-12);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:autoStart.x+22,y:autoStart.y+22}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:autoStart.x+22,y:autoStart.y+34}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:autoStart.x+22,y:bottom}]});
 await expect.poll(scrollPosition).toBeGreaterThan(scrollAtDragStart+20);
 await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await handle(page,'아트').evaluate(node=>node.scrollIntoView({block:'center'}));
 const scrollBefore=await scrollPosition(),content=(await rows(page).first().boundingBox())!;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:350,y:content.y+30}]});
 for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350,y:content.y+30+i*20}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(scrollPosition).toBeLessThan(scrollBefore-30);
 expect(await order(page)).toEqual(['아트','음악','일상',...names.slice(3)]);expect(writes).toHaveLength(1);verify();
});

test('touch-sized handles, no page overflow, tap controls and portal editor on mobile',async({page,isMobile},info)=>{
 test.skip(!isMobile,'Mobile layout and tap verification.');const {verify}=await setup(page);
 const style=await handle(page,'일상').evaluate(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height,touch:getComputedStyle(node).touchAction}));
 expect(style.width).toBeGreaterThanOrEqual(44);expect(style.height).toBeGreaterThanOrEqual(44);expect(style.touch).toBe('none');
 expect(await rows(page).first().evaluate(node=>getComputedStyle(node).touchAction)).toBe('auto');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'일상 아래로',exact:true}).tap();await expect.poll(()=>order(page)).toEqual(['아트','일상',...names.slice(2)]);
 await page.getByRole('button',{name:'순서 되돌리기',exact:true}).tap();expect(await order(page)).toEqual(names);
 await rows(page).first().getByRole('button',{name:'편집',exact:true}).tap();await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.locator('#categories [role=dialog]')).toHaveCount(0);await expect(page.getByLabel('아이콘 이미지')).toBeVisible();
 await page.getByRole('button',{name:'닫기',exact:true}).last().tap();
 await page.locator('.category-table').evaluate(node=>node.parentElement!.scrollLeft=0);await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('mobile-layout.png'),fullPage:true});verify();
});

test('pending save locks sorting; conflict retains unsaved order and original expectedIds for retry',async({page})=>{
 let release!:()=>void,attempt=0;const pending=new Promise<void>(resolve=>{release=resolve;});
 const {writes,verify}=await setup(page,{save:async route=>{attempt++;if(attempt===1){await pending;await route.fulfill({status:409,json:{success:false,errorCode:'CATEGORY_ORDER_CONFLICT',errorMessage:'다른 운영자가 순서를 변경했습니다. 목록을 새로고침해 주세요.'}});}else await success(route,[]);}});
 await page.getByRole('button',{name:'일상 아래로',exact:true}).click();await page.getByRole('button',{name:'순서 저장',exact:true}).click();
 await expect(handle(page,'일상')).toBeDisabled();await expect(page.getByRole('button',{name:'아트 아래로',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'목록 새로고침',exact:true})).toBeDisabled();release();
 await expect(page.locator('#categories').getByRole('alert')).toContainText('다른 운영자가');expect(await order(page)).toEqual(['아트','일상',...names.slice(2)]);
 await expect(handle(page,'일상')).toBeEnabled();await page.getByRole('button',{name:'순서 저장',exact:true}).click();await expect.poll(()=>writes.length).toBe(2);
 expect(writes[1]).toEqual(writes[0]);expect(writes[0].expectedIds).toEqual(categories.map(r=>r.id));await expect.poll(()=>order(page)).toEqual(names);verify();
});

test('read-only operators have no drag, move or save actions',async({page})=>{
 const {writes,verify}=await setup(page,{readonly:true});await expect(page.getByText('조회만 가능합니다.',{exact:false})).toBeVisible();
 await expect(page.locator('.category-drag-handle')).toHaveCount(0);await expect(rows(page).getByRole('button')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'순서 저장',exact:true})).toHaveCount(0);expect(writes).toHaveLength(0);verify();
});
