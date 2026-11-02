const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const path='src/components/console/TableContent.tsx';
const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const loaded={exports:{}};new Function('require','module','exports',code)(require,loaded,loaded.exports);
const {TableContent}=loaded.exports;
const render=props=>renderToStaticMarkup(React.createElement(TableContent,{emptyMessage:'출금 내역이 없습니다.',children:React.createElement('table',null,React.createElement('tbody',null,React.createElement('tr',null,React.createElement('td',null,'기존 내역')))),...props}));
test('empty tables show the shared no-data style only after completion',()=>{
 assert.equal(render({count:0}),'<p class="empty">출금 내역이 없습니다.</p>');
 assert.equal(render({count:0,pending:true}),'');
 for(const pending of [true,false]){const html=render({count:1,pending});assert.match(html,/<table>/);assert.match(html,/기존 내역/);assert.doesNotMatch(html,/없습니다/);}
});
test('every table in the beans page has an explicit empty-state boundary and accessible name',()=>{
 const file='src/components/console/Beans.tsx',source=fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),labels=[];
 function visit(node){
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(sf)==='table'){
   let parent=node.parent;while(parent&&!(ts.isJsxElement(parent)&&parent.openingElement.tagName.getText(sf)==='TableContent'))parent=parent.parent;
   assert.ok(parent,`Missing empty-state boundary at ${node.pos}`);
   const attrs=parent.openingElement.attributes.properties;for(const name of ['count','pending','emptyMessage'])assert.ok(attrs.some(a=>a.name?.getText(sf)===name));
   const label=node.openingElement.attributes.properties.find(a=>a.name?.getText(sf)==='aria-label');assert.ok(label);labels.push(label.initializer.text);
  }
  ts.forEachChild(node,visit);
 }
 visit(sf);assert.deepEqual(labels,['미수금','충전 집계','후원 유형별 사용량','출금 집계','출금 재원별 집계','충전 주문·입금 대사','후원 이동 내역','콩 출금 신청','회원 지갑 이동 내역']);
});
