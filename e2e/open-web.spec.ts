import {test,expect,type Page} from '@playwright/test';
// 2026-11-11 '웹 열기': opens the service in a new tab from the console header, left of the profile (API stand-in).
async function fixture(page:Page){await page.route('**/api/v1/admin/**',async route=>{const url=new URL(route.request().url());let data:unknown={};
 if(url.pathname.endsWith('/me'))data={id:'operator',name:'검수',role:'SUPER_ADMIN',permissions:{}};
 else if(url.pathname.endsWith('/overview'))data={members:0,creators:0,posts:0,reports:0,inquiries:0,failedPayments:0,pendingWithdrawals:0,undeliveredEvents:0,jobs:[]};
 await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data,errorMessage:null,errorCode:null})});});}
for(const [name,size] of [['pc',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const)
test(`웹 열기: ${name} 헤더에 하나만 보이고 프로필 왼쪽, 새 탭으로 서비스 (API 대역)`,async({page},info)=>{
 await page.setViewportSize(size);await fixture(page);await page.goto('/console');
 const link=page.getByRole('link',{name:'웹 열기',exact:true}).filter({visible:true});await expect(link).toHaveCount(1);
 await expect(link).toHaveAttribute('href','https://crefans.com/service/feed');await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel',/noopener/);
 const profile=page.getByRole('link',{name:/^마이페이지/}).filter({visible:true});const [a,b]=[await link.boundingBox(),await profile.boundingBox()];
 expect(a!.x+a!.width).toBeLessThanOrEqual(b!.x);expect(Math.abs((a!.y+a!.height/2)-(b!.y+b!.height/2))).toBeLessThan(4);
 await page.screenshot({path:info.outputPath(`${name}.png`)});
});
