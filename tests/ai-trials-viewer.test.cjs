const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
// 2026-11-21 user request: the history's full-screen photo moves to the previous/next photo by swipe, sideways scroll, ←/→ or buttons.
function load(path,dependencies={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>dependencies[name]||require(name),loaded,loaded.exports);return loaded.exports;
}
const stub=()=>null;
const m=load('src/components/console/AiTrials.tsx',{'./ConsoleIcon':{ConsoleIcon:stub},'./ConsoleData':{useData(){return{}},State:stub},'./TypedConfirm':{ConfirmDialog:stub,DialogActions:stub},'./EmptyState':{EmptyState:stub},'./TableContent':{TableContent:stub},'@/lib/console-api':{api:async()=>({})}});
test('swipe and sideways scroll: at least the threshold and mostly horizontal; left swipe / right scroll = next',()=>{
 assert.equal(m.swipeStep(-60,5),1);assert.equal(m.swipeStep(60,5),-1);assert.equal(m.swipeStep(-49,0),0,'short swipe ignored');assert.equal(m.swipeStep(-60,80),0,'vertical scroll ignored');
 assert.equal(m.wheelStep(45,3),1);assert.equal(m.wheelStep(-45,3),-1);assert.equal(m.wheelStep(20,0),0);assert.equal(m.wheelStep(45,90),0);
});
test('photos in history order, each once, deleted ones skipped',()=>{
 const d={id:'guest:abc',uploads:[{id:'u1',at:'2026-11-21T00:00:00Z',sample:false,results:[]},{id:'u2',at:'2026-11-21T00:00:00Z',sample:true,results:[],deleted:true}],
  results:[{id:'r1',at:'2026-11-21T00:01:00Z',sourceId:'u1',croppedFrom:null},{id:'r2',at:'2026-11-21T00:02:00Z',sourceId:'u1',croppedFrom:'r1'}],
  generations:[{resultId:'r1'},{resultId:null}],posts:[{mediaIds:['r1','r2','u1']}]};
 assert.deepEqual(m.trialPhotos(d).map(p=>p.media),['u1','r1','r2']);
});
test('viewer shows position, prev/next buttons and disables them at the ends; one photo has no buttons',()=>{
 const photos=['a','b','c'].map(x=>({media:x,url:'/'+x,label:'사진 '+x}));
 const first=renderToStaticMarkup(React.createElement(m.PhotoViewer,{photos,index:0,onIndex(){},onClose(){}}));
 assert.match(first,/1 \/ 3/);assert.match(first,/aria-label="이전 사진" disabled=""/);assert.doesNotMatch(first,/aria-label="다음 사진" disabled/);assert.match(first,/src="\/a"/);
 const last=renderToStaticMarkup(React.createElement(m.PhotoViewer,{photos,index:2,onIndex(){},onClose(){}}));
 assert.match(last,/3 \/ 3/);assert.match(last,/aria-label="다음 사진" disabled=""/);
 const single=renderToStaticMarkup(React.createElement(m.PhotoViewer,{photos:photos.slice(0,1),index:0,onIndex(){},onClose(){}}));
 assert.doesNotMatch(single,/이전 사진|다음 사진|1 \/ 1/);
});
