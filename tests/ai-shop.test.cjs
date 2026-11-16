// AI 이용권 상품 (2026-11-16): 1회 단가 원가 하한 98원·정수, 구독형 30일 고정이 저장 가능 조건에 연결되는지.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/ai-shop.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);
const {unitPriceCheck,MIN_UNIT_PRICE,SUBSCRIPTION_DAYS,KIND_LABELS}=loaded.exports;
const products=fs.readFileSync('src/components/console/ShopProducts.tsx','utf8');

test('unit price is amount/quantity with the 98 won floor and whole-won rule',()=>{
 assert.equal(MIN_UNIT_PRICE,98);
 assert.deepEqual(unitPriceCheck(9800,100),{unitPrice:98,warning:null});
 assert.deepEqual(unitPriceCheck(10000,10),{unitPrice:1000,warning:null});
 assert.match(unitPriceCheck(9700,100).warning,/98원/);
 assert.match(unitPriceCheck(1000,3).warning,/정수/);
 assert.deepEqual(unitPriceCheck(0,10),{unitPrice:null,warning:null});
 assert.deepEqual(unitPriceCheck(1000,0),{unitPrice:null,warning:null});
});

test('kind labels match the server contract',()=>{
 assert.deepEqual(KIND_LABELS,{pack:'AI 이용권 횟수형',subscription:'AI 이용권 구독형'});
 assert.equal(SUBSCRIPTION_DAYS,30);
});

test('save is disabled by the same rules and 98 is defined only once',()=>{
 const valid=products.match(/const valid=[^;]+;/)[0];
 assert.match(valid,/!unitPriceCheck\(edit\.amount,edit\.quantity\)\.warning/);
 assert.match(valid,/edit\.kind!=='subscription'\|\|edit\.validityDays===SUBSCRIPTION_DAYS/);
 assert.match(products,/type="submit" className="primary" disabled=\{!valid\|\|busy\}/);
 assert.match(products,/disabled=\{busy\|\|edit\.kind==='subscription'\}/);
 assert.doesNotMatch(products,/\b98\b/);
});
