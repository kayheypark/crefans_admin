const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-21 user request: 유입 분석 (UTM visitor counts, overview.view) and 랜딩 링크 (tagged links; changes need settings.update).
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||require(name),loaded,loaded.exports);
 return loaded.exports;
}
const tableContent=load('src/components/console/TableContent.tsx',{'./EmptyState':load('src/components/console/EmptyState.tsx')});
const data={'./ConsoleData':{useData(){return{data:null,loading:false,error:'',reload(){}};},State(){return null;}},'./TableContent':tableContent};
const traffic=load('src/components/console/Traffic.tsx',data);
const links=load('src/components/console/LandingLinks.tsx',{...data,'@/lib/console-api':{api:async()=>({})},'./Snackbar':{useSnackbar:()=>()=>{}},'./TypedConfirm':{ConfirmDialog:({children})=>React.createElement('div',null,children),DialogActions:({children})=>React.createElement('div',null,children),useConfirm:()=>async()=>true},'./ConsoleIcon':{ConsoleIcon:()=>null}});
const report={timeZone:'Asia/Seoul',from:'2026-11-22',to:'2026-11-23',days:2,maxDays:92,trackingSince:'2026-11-22',dates:['2026-11-22','2026-11-23'],
 totals:{landingViews:20,recorded:16,withUtm:12,withoutUtm:4},topSource:{source:'x',count:9},
 groups:[{source:'x',medium:'paid',campaign:'cosplayer_wanted',content:'cat',count:6},{source:'daangn',medium:'paid',campaign:'d1',content:'',count:3},{source:'x',medium:'paid',campaign:'cosplayer_wanted',content:'pink',count:2},{source:'x',medium:'organic',campaign:'post',content:'',count:1}],
 noUtm:[{referrerHost:'',count:3},{referrerHost:'t.co',count:1}],daily:[{date:'2026-11-22',landingViews:12,withUtm:8,withoutUtm:2},{date:'2026-11-23',landingViews:8,withUtm:4,withoutUtm:2}],notice:'배포 이후부터 집계돼요.'};

test('유입 분석: summary cards show total, UTM visits with share of landing views, and the top source',()=>{
 const html=renderToStaticMarkup(React.createElement(traffic.TrafficSummary,{data:report}));
 assert.match(html,/총 방문<\/span><strong>16<small>회<\/small><\/strong><small class="previous-value">랜딩 방문 집계 20회/);
 assert.match(html,/UTM 있는 방문<\/span><strong>12<small>회<\/small><\/strong><small class="previous-value">랜딩 방문 대비 60% · UTM 없음 4회/);
 assert.match(html,/상위 소스<\/span><strong>X \(x\)<\/strong><small class="previous-value">9회 · 45%/);
 const none=renderToStaticMarkup(React.createElement(traffic.TrafficSummary,{data:{...report,topSource:null,totals:{landingViews:0,recorded:0,withUtm:0,withoutUtm:0}}}));
 assert.match(none,/상위 소스<\/span><strong>없음/);assert.doesNotMatch(none,/NaN|Infinity/);assert.match(none,/랜딩 방문 대비 –/);
});
test('유입 분석: the table groups source → medium → campaign → content with subtotals and % of landing views',()=>{
 const grouped=traffic.groupBySource(report.groups);
 assert.deepEqual(grouped.map(s=>[s.source,s.count]),[['x',9],['daangn',3]]);
 assert.deepEqual(grouped[0].rows.map(r=>[r.medium,r.campaign,r.content]),[['organic','post',''],['paid','cosplayer_wanted','cat'],['paid','cosplayer_wanted','pink']]);
 const html=renderToStaticMarkup(React.createElement(traffic.UtmTable,{data:report}));
 assert.match(html,/<th scope="rowgroup" colSpan="4">X \(x\) 소계<\/th><td class="number"><strong>9<\/strong><\/td><td class="number">45%<\/td>/);
 assert.match(html,/<th scope="rowgroup" colSpan="4">당근 \(daangn\) 소계<\/th>/);
 assert.match(html,/<td>cosplayer_wanted<\/td><td>cat<\/td><td class="number">6<\/td><td class="number">30%<\/td>/);
 assert.match(html,/<td>d1<\/td><td><span class="muted">없음<\/span><\/td>/,'empty content shows 없음');
 assert.ok(html.indexOf('X (x) 소계')<html.indexOf('당근 (daangn) 소계'),'bigger source first');
 const hosts=renderToStaticMarkup(React.createElement(traffic.NoUtmTable,{data:report}));
 assert.match(hosts,/<td>직접 방문 또는 알 수 없음<\/td><td class="number">3<\/td><td class="number">15%<\/td>/);assert.match(hosts,/<td>t\.co<\/td>/);
 assert.equal(traffic.share(1,0),'–');assert.equal(traffic.sourceLabel('insta_bio'),'insta_bio');assert.equal(traffic.sourceLabel(''),'(소스 없음)');
});
test('유입 분석: reads GET /admin/landing-utm-stats with the KST range, 92-day limit, no-backfill notice, empty states',()=>{
 const source=fs.readFileSync('src/components/console/Traffic.tsx','utf8');
 assert.match(source,/useData<TrafficData>\(`\/admin\/landing-utm-stats\?from=\$\{range\.from\}&to=\$\{range\.to\}`\)/);
 assert.match(source,/MAX_DAYS=92/);assert.match(source,/배포한 뒤부터 집계/);assert.match(source,/<TableContent count=\{d\.groups\.length\}/);assert.match(source,/<State \{\.\.\.state\}\/>/);
 assert.doesNotMatch(source,/apiClient|\.post\(|\.put\(|\.delete\(/,'read-only');
 assert.equal(traffic.shiftDay('2026-03-01',-1),'2026-02-28');assert.equal(traffic.shiftDay('2026-11-23',-13),'2026-11-10');
});

const link={id:'l1',name:'X 고양이',landingPath:'/service/landing-ai-image-generation',utmSource:'x',utmMedium:'paid',utmCampaign:'cosplayer_wanted',utmContent:'cat',memo:'11월',url:'https://crefans.com/service/landing-ai-image-generation?utm_source=x&utm_medium=paid&utm_campaign=cosplayer_wanted&utm_content=cat',createdBy:'운영자',createdAt:'2026-11-21T01:00:00Z',archivedAt:null,visits:{last14:12,last30:30}};
test('랜딩 링크: URL preview matches the server URL; validation rejects spaces, symbols, missing required values',()=>{
 assert.equal(links.previewUrl({landingPath:'/service/landing-ai-image-generation',utmSource:'X',utmMedium:'Paid',utmCampaign:'cosplayer_wanted',utmContent:'cat'}),link.url);
 assert.equal(links.previewUrl({landingPath:'/',utmSource:'daangn',utmMedium:'paid',utmCampaign:'d1',utmContent:''}),'https://crefans.com/?utm_source=daangn&utm_medium=paid&utm_campaign=d1');
 const ok={name:'a',landingPath:'/',utmSource:'x',utmMedium:'paid',utmCampaign:'c',utmContent:'',memo:''};
 assert.deepEqual(links.draftErrors(ok),{});
 assert.deepEqual(Object.keys(links.draftErrors({...ok,name:' ',utmSource:'',utmMedium:'a b',utmCampaign:'a&b',utmContent:'고양이',memo:'m'.repeat(501)})).sort(),['memo','name','utmCampaign','utmContent','utmMedium','utmSource']);
 assert.ok(links.draftErrors({...ok,utmCampaign:'a'.repeat(41)}).utmCampaign);
 assert.deepEqual(links.PRESETS.map(p=>p.source+'/'+p.medium),['x/paid','x/organic','daangn/paid','instagram/organic']);
 assert.deepEqual(links.PATHS.map(p=>p[0]),['/service/landing-ai-image-generation','/']);
});
test('랜딩 링크: table shows name, full URL with copy, 14/30-day visits and date; manage buttons only with settings.update',()=>{
 const home={...link,id:'l2',landingPath:'/',url:'https://crefans.com/?utm_source=x',visits:null},archived={...link,id:'l3',archivedAt:'2026-11-22T01:00:00Z'};
 const html=renderToStaticMarkup(React.createElement(links.LinkTable,{links:[link,home,archived],canEdit:true,onEdit(){},onArchive(){}}));
 assert.match(html,/<strong>X 고양이<\/strong><br\/><span class="muted">11월<\/span>/);
 assert.match(html,/<code class="landing-link-url">https:\/\/crefans\.com\/service\/landing-ai-image-generation\?utm_source=x&amp;utm_medium=paid&amp;utm_campaign=cosplayer_wanted&amp;utm_content=cat<\/code><div class="actions"><button type="button">복사<\/button>/);
 assert.match(html,/<td class="number">12<\/td><td class="number">30<\/td>/);assert.match(html,/<td class="number">–<\/td><td class="number">–<\/td>/,'home links are not counted');
 assert.equal((html.match(/>보관<\/button>/g)||[]).length,2);assert.match(html,/<span class="muted">보관됨<\/span>/);
 const ro=renderToStaticMarkup(React.createElement(links.LinkTable,{links:[link],canEdit:false,onEdit(){},onArchive(){}}));
 assert.doesNotMatch(ro,/>수정<|>보관<|관리<\/th>/);assert.match(ro,/>복사</);
});
test('랜딩 링크: the form shows presets and a live preview; editing locks UTM values',()=>{
 const html=renderToStaticMarkup(React.createElement(links.LinkForm,{onDone(){},onCancel(){}}));
 assert.match(html,/X 광고 <small>x\/paid<\/small>/);assert.match(html,/당근 광고 <small>daangn\/paid<\/small>/);assert.match(html,/인스타그램 <small>instagram\/organic<\/small>/);
 assert.match(html,/만들어질 링크<\/span><code class="landing-link-url" aria-live="polite">https:\/\/crefans\.com\/service\/landing-ai-image-generation<\/code>/);
 assert.match(html,/<option value="\/">홈 \(\/\)<\/option>/);assert.match(html,/링크 만들기/);
 const edit=renderToStaticMarkup(React.createElement(links.LinkForm,{initial:link,onDone(){},onCancel(){}}));
 assert.match(edit,/UTM 값과 랜딩 페이지는 바꿀 수 없어요/);assert.match(edit,/id="landing-link-utmSource"[^>]*disabled=""/);assert.doesNotMatch(edit,/X 광고 <small>/);
});
test('랜딩 링크: API paths, archive confirm, and menus wired in the console with overview view / settings.update edit',()=>{
 const source=fs.readFileSync('src/components/console/LandingLinks.tsx','utf8'),console=fs.readFileSync('src/components/console/Console.tsx','utf8'),page=fs.readFileSync('src/app/console/[[...section]]/page.tsx','utf8');
 assert.match(source,/useData<LinkList>\('\/admin\/landing-links'\)/);assert.match(source,/api<\{message:string\}>\('\/admin\/landing-links',/);
 assert.match(source,/`\/admin\/landing-links\/\$\{encodeURIComponent\(initial!\.id\)\}`,\{name:d\.name\.trim\(\),memo:d\.memo\.trim\(\)\},'PUT'/);
 assert.match(source,/`\/admin\/landing-links\/\$\{encodeURIComponent\(l\.id\)\}\/archive`/);assert.match(source,/confirmAction\(\{title:'랜딩 링크 보관'/);
 assert.match(console,/\['ai-trials','AI 사진 체험 관리'\],\['ai-presets','AI 사진 프리셋'\],\['traffic','유입 분석'\],\['landing-links','랜딩 링크'\]/);
 assert.match(console,/section==='traffic'\|\|section==='landing-links'\?'overview'/);
 assert.match(console,/section==='traffic'\?<Traffic\/>:section==='landing-links'\?<LandingLinks canEdit=\{can\(admin,'settings','update'\)\}\/>/);
 assert.match(page,/'traffic','landing-links'/);
});
