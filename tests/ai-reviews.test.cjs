const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-21 user request: AI 체험관리 shows the AI photo reviews (stars, choice, words, reward) next to the trial list.
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||(name==='@/lib/console-api'?{api:async()=>({})}:require(name)),loaded,loaded.exports);return loaded.exports;
}
const stub=()=>null;let urls=[];
const data={items:[{id:'1',guest:true,userId:'guest:'+'a'.repeat(40),nickname:null,rating:2,sentiment:'bad',comment:'얼굴이 달라요',rewardHearts:0,rewardTickets:0.5,createdAt:'2026-11-21T08:00:00Z'},
 {id:'2',guest:false,userId:'m1',nickname:'민지',rating:5,sentiment:'good',comment:'',rewardHearts:20,rewardTickets:0,createdAt:'2026-11-21T07:00:00Z'}],total:2,page:1,pageSize:30,summary:{count:2,averageRating:3.5,bySentiment:{good:1,bad:1,unsure:0}}};
const m=load('src/components/console/AiTrials.tsx',{'./ConsoleIcon':{ConsoleIcon:stub},'./ConsoleData':{useData(url){urls.push(url);return url.startsWith('/admin/ai-photo-reviews')?{data}:{}},State:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./EmptyState':{EmptyState:stub}});
test('stars are whole 1–5',()=>{assert.equal(m.stars(1),'★☆☆☆☆');assert.equal(m.stars(5),'★★★★★');});
test('the menu opens on the trial list with a 리뷰 switch',()=>{
 urls=[];const html=renderToStaticMarkup(React.createElement(m.AiTrials));
 assert.match(html,/체험 기록/);assert.match(html,/>리뷰</);assert.ok(urls.some(u=>u.startsWith('/admin/ai-trials?')));assert.ok(!urls.some(u=>u.startsWith('/admin/ai-photo-reviews')));
});
test('review list: average, choice counts, member nickname vs visitor id, words and reward',()=>{
 const src=fs.readFileSync('src/components/console/AiTrials.tsx','utf8');
 assert.match(src,/useState<'trials'\|'reviews'>\('trials'\)/);
 // Render the review view directly by flipping the initial state.
 const flipped=load('src/components/console/AiTrials.tsx',{'./ConsoleIcon':{ConsoleIcon:stub},'./ConsoleData':{useData(url){urls.push(url);return url.startsWith('/admin/ai-photo-reviews')?{data}:{}},State:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./EmptyState':{EmptyState:stub},react:{...React,useState:(v)=>React.useState(v==='trials'?'reviews':v)}});
 urls=[];const html=renderToStaticMarkup(React.createElement(flipped.AiTrials));
 assert.ok(urls.includes('/admin/ai-photo-reviews?page=1'));
 assert.match(html,/평균 3\.5/);assert.match(html,/좋아요 1 · 별로예요 1 · 잘 모르겠어요 0/);
 assert.match(html,/비회원 aaaaaaaa/);assert.match(html,/민지/);assert.match(html,/얼굴이 달라요/);assert.match(html,/이용권 0\.5장/);assert.match(html,/하트 20개/);
 assert.match(html,/aria-label="별 2개"/);
});
// 2026-11-22 user request: the trial list is searchable by the trial id or a PostHog session/visitor number (server validates the value).
test('trial list: search box sends q only after a search and resets to page 1',()=>{
 const deps={'./ConsoleIcon':{ConsoleIcon:stub},'./ConsoleData':{useData(url){urls.push(url);return {}},State:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./EmptyState':{EmptyState:stub}};
 urls=[];const html=renderToStaticMarkup(React.createElement(load('src/components/console/AiTrials.tsx',deps).AiTrials));
 assert.match(html,/type="search"/);assert.match(html,/PostHog 세션·방문자 번호/);assert.ok(urls.includes('/admin/ai-trials?page=1'),urls.join());
 const src=fs.readFileSync('src/components/console/AiTrials.tsx','utf8'),visitor='01a1fed7-cf73-70dd-a3cc-d7fa51441651';
 fs.writeFileSync('.ai-trials-search.tmp.tsx',src.replace("[search,setSearch]=useState('')",`[search,setSearch]=useState('${visitor}')`));
 try{urls=[];renderToStaticMarkup(React.createElement(load('.ai-trials-search.tmp.tsx',deps).AiTrials));}finally{fs.unlinkSync('.ai-trials-search.tmp.tsx');}
 assert.ok(urls.includes('/admin/ai-trials?page=1&q='+visitor),urls.join());
 assert.match(src,/const find=\(value:string\)=>\{setSearch\(value\.trim\(\)\);setPage\(1\);\};/);
});
// 2026-11-22 user request: per-operator stars on trials and an "only starred" filter.
test('trial list: star toggle posts to the favorite API, starred filter sends favorites=1',()=>{
 const src=fs.readFileSync('src/components/console/AiTrials.tsx','utf8');
 assert.match(src,/await api\(`\/admin\/ai-trials\/\$\{encodeURIComponent\(id\)\}\/favorite`,\{favorite:!on\}\);onChange\(\);/);
 assert.match(src,/\.\.\.\(starred\?\{favorites:'1'\}:\{\}\)/);
 assert.match(src,/<td><Star id=\{r\.id\} on=\{!!r\.favorite\} onChange=\{state\.reload\}\/>/);
 assert.match(src,/<dd><Star id=\{d\.id\} on=\{!!d\.favorite\} onChange=\{state\.reload\}\/>/);
 const deps={'./ConsoleIcon':{ConsoleIcon:stub},'./ConsoleData':{useData(url){urls.push(url);return url.startsWith('/admin/ai-trials?')?{data:{items:[{id:'guest:'+'b'.repeat(40),favorite:true,startedAt:'2026-11-22T00:00:00Z',lastActivityAt:'2026-11-22T00:00:00Z',uploads:1,sampleUploads:0,generated:1,succeeded:1,failed:0,posts:0,claimed:false}],total:1,page:1,pageSize:30}}:{}},State:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./EmptyState':{EmptyState:stub},'@/lib/console-api':{api:async()=>({})}};
 urls=[];const html=renderToStaticMarkup(React.createElement(load('src/components/console/AiTrials.tsx',deps).AiTrials));
 assert.match(html,/aria-pressed="true"[^>]*aria-label="즐겨찾기 해제"/);assert.match(html,/☆ 즐겨찾기만/);
});
