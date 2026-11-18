const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-18: read-only funnel table on the dashboard (overview.view); 14 KST days × steps, totals and rate against the landing total.
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||require(name),loaded,loaded.exports);
 return loaded.exports;
}
const {FunnelTable,conversion}=load('src/components/console/FunnelStats.tsx',{'./ConsoleData':{useData(){},State(){return null;}},'./TableContent':load('src/components/console/TableContent.tsx',{'./EmptyState':load('src/components/console/EmptyState.tsx')})});
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
 assert.match(console,/section==='overview'\?[^:]*<Overview\/><h2 className="operations-title">AI 사진 체험 유입 \(최근 14일\)<\/h2><FunnelStats\/>/);
});
