const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-21 user request: AI 체험관리 shows the AI photo reviews (stars, choice, words, reward) next to the trial list.
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||require(name),loaded,loaded.exports);return loaded.exports;
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
