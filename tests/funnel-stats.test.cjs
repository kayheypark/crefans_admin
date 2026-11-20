const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-18: read-only funnel table on the dashboard (overview.view); 14 KST days × steps, totals and rate against the landing total.
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||require(name),loaded,loaded.exports);
 return loaded.exports;
}
const {FunnelTable,conversion}=load('src/components/console/FunnelStats.tsx',{'./LandingAlertCap':{LandingAlertCap(){return null;}},'./ConsoleData':{useData(){},State(){return null;}},'./TableContent':load('src/components/console/TableContent.tsx',{'./EmptyState':load('src/components/console/EmptyState.tsx')})});
const dates=Array.from({length:14},(_,i)=>`2026-11-${String(5+i).padStart(2,'0')}`);
const day=(last)=>[...Array(13).fill(0),last];
const data={timeZone:'Asia/Seoul',dates,notice:'날짜는 한국 시간 기준이에요.',steps:[
 {key:'landing_view',label:'AI 사진 랜딩 방문',source:'browser',daily:day(1200),total:1200},
 {key:'ai_succeeded_guest',label:'AI 생성 성공(비회원)',source:'server',daily:day(300),total:300},
 {key:'signup_completed',label:'회원가입 완료',source:'server',daily:day(7),total:7}]};
test('the table renders 14 date columns, totals and the rate against the landing total',()=>{
 const html=renderToStaticMarkup(React.createElement(FunnelTable,{data}));
 assert.match(html,/aria-label="AI 사진 체험 유입 단계별 일별 횟수"/);
 assert.equal((html.match(/<th class="number" scope="col">\d\d\/\d\d<\/th>/g)||[]).length,14);assert.match(html,/11\/05/);assert.match(html,/11\/18/);
 assert.match(html,/AI 사진 랜딩 방문<small> \(화면\)<\/small>/);assert.match(html,/<strong>1,200<\/strong><\/td><td class="number">100%<\/td>/);
 assert.match(html,/<strong>300<\/strong><\/td><td class="number">25%<\/td>/);assert.match(html,/<strong>7<\/strong><\/td><td class="number">0\.6%<\/td>/);
 assert.match(html,/날짜는 한국 시간 기준이에요\./);
});
test('no landing visits means no rate instead of a division by zero',()=>{
 assert.equal(conversion(5,0),'–');assert.equal(conversion(0,10),'0%');
 const html=renderToStaticMarkup(React.createElement(FunnelTable,{data:{...data,steps:data.steps.slice(1)}}));assert.doesNotMatch(html,/Infinity|NaN/);
});
test('the dashboard (overview view) shows it read-only from GET /admin/funnel-stats',()=>{
 const source=fs.readFileSync('src/components/console/FunnelStats.tsx','utf8'),console=fs.readFileSync('src/components/console/Console.tsx','utf8');
 assert.match(source,/useData<FunnelData>\('\/admin\/funnel-stats'\)/);assert.doesNotMatch(source,/apiClient|\.post\(|\.put\(|\.delete\(|<button|<form/);
 assert.match(console,/section==='overview'\?[^:]*<Overview\/><h2 className="operations-title">AI 사진 체험 유입 \(최근 14일\)<\/h2><FunnelStats canEditCap=\{can\(admin,'settings','update'\)\}\/>/);
});

// 2026-11-21 user decision: the landing alert daily cap is set below the table — presets 100…1000 plus free input (settings.update).
const cap=load('src/components/console/LandingAlertCap.tsx',{'@/lib/console-api':{api:async()=>({})},'./Snackbar':{useSnackbar:()=>()=>{}}});
const info={value:500,default:500,min:1,max:10000,presets:[100,200,300,400,500,600,700,800,900,1000]};
test('landing alert cap: ten preset buttons, number input and save for settings.update; read-only text otherwise',()=>{
 const html=renderToStaticMarkup(React.createElement(cap.LandingAlertCap,{info,canEdit:true,onSaved(){}}));
 assert.match(html,/랜딩 방문 알림 하루 상한/);assert.match(html,/하루 500건<\/strong> \(기본값\)/);
 const presets=[...html.matchAll(/<button type="button" class="chip" aria-pressed="(true|false)">([\d,]+)개<\/button>/g)];
 assert.deepEqual(presets.map(m=>m[2]),['100','200','300','400','500','600','700','800','900','1,000']);
 assert.deepEqual(presets.filter(m=>m[1]==='true').map(m=>m[2]),['500'],'the current value is pressed');
 assert.match(html,/<input id="landing-alert-cap-input" type="number" inputMode="numeric" min="1" max="10000" step="1" aria-invalid="false" aria-describedby="landing-alert-cap-help" value="500"/);
 assert.match(html,/<button type="submit" class="primary" disabled="">저장<\/button>/,'save is disabled until the value changes');
 const ro=renderToStaticMarkup(React.createElement(cap.LandingAlertCap,{info:{...info,value:300},canEdit:false,onSaved(){}}));
 assert.match(ro,/하루 300건<\/strong>\./);assert.doesNotMatch(ro,/<button|<input|<form/);assert.match(ro,/운영 설정 수정 권한/);
 const source=fs.readFileSync('src/components/console/LandingAlertCap.tsx','utf8'),console=fs.readFileSync('src/components/console/Console.tsx','utf8');
 assert.match(source,/api<\{value:number;message:string\}>\('\/admin\/funnel-stats\/landing-alert-cap',\{cap:value\},'PUT'\)/);
 assert.match(console,/<FunnelStats canEditCap=\{can\(admin,'settings','update'\)\}\/>/);
});
