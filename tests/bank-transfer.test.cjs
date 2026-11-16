// 무통장입금 console (2026-11-16): KST time inputs, deadline/overdue marks and the `deposits` menu wiring.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/bank-transfer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);
const {kstInput,kstInputToIso,timeLeft,refundOverdue,KIND_LABELS}=loaded.exports;
const read=f=>fs.readFileSync(f,'utf8');

test('datetime-local values are Korean time regardless of the browser zone',()=>{
 assert.equal(kstInputToIso('2026-11-16T09:30'),'2026-11-16T00:30:00.000Z');
 assert.equal(kstInputToIso('2026-11-17T00:05'),'2026-11-16T15:05:00.000Z');
 assert.equal(kstInput(new Date('2026-11-16T15:05:00Z')),'2026-11-17T00:05');
 assert.equal(kstInputToIso(kstInput(new Date('2026-03-01T12:34:00Z'))),'2026-03-01T12:34:00.000Z');
 // Negative controls: incomplete or impossible values are refused instead of sent.
 for(const bad of ['','2026-11-16','2026-11-16T9:30','2026-02-30T10:00','2026-11-16T24:00'])assert.equal(kstInputToIso(bad),null,bad);
 assert.notEqual(kstInputToIso('2026-11-16T09:30'),'2026-11-16T09:30:00.000Z');
});

test('deposit deadline shows the time left and nothing once passed',()=>{
 const now=Date.parse('2026-11-16T00:00:00Z');
 assert.equal(timeLeft('2026-11-16T03:05:00Z',now),'3시간 5분 남음');
 assert.equal(timeLeft('2026-11-16T00:00:30Z',now),'1분 남음');
 assert.equal(timeLeft('2026-11-16T00:00:00Z',now),null);
 assert.equal(timeLeft('2026-11-15T23:00:00Z',now),null);
});

test('only refunds still waiting past the due time are overdue',()=>{
 const now=Date.parse('2026-11-20T00:00:00Z');
 assert.equal(refundOverdue({status:'requested',dueAt:'2026-11-19T00:00:00Z'},now),true);
 assert.equal(refundOverdue({status:'requested',dueAt:'2026-11-21T00:00:00Z'},now),false);
 assert.equal(refundOverdue({status:'completed',dueAt:'2026-11-19T00:00:00Z'},now),false);
 assert.equal(refundOverdue({status:'rejected',dueAt:'2026-11-19T00:00:00Z'},now),false);
 assert.equal(refundOverdue({status:'requested',dueAt:null},now),false);
});

test('order kinds use the product names operators know',()=>{
 assert.deepEqual(KIND_LABELS,{bean:'콩 충전','ai-shop':'AI 이용권',ad:'광고상품'});
});

test('deposits menu is routed, listed, permission-gated and grantable (view/update only, like server ADMIN_MENUS)',()=>{
 assert.match(read('src/app/console/[[...section]]/page.tsx'),/'deposits'/);
 const consoleSrc=read('src/components/console/Console.tsx');
 assert.match(consoleSrc,/\['deposits','입금 확인'\]/);
 assert.match(consoleSrc,/'shop','deposits'\]\]/);
 assert.match(consoleSrc,/section==='deposits'\?<Deposits canUpdate=\{can\(admin,'deposits','update'\)\}\/>/);
 const row=read('src/components/console/Operators.tsx').match(/\['deposits','입금 확인',\{([^}]*)\}\]/);
 assert.ok(row,'permission editor row');
 assert.deepEqual([...row[1].matchAll(/(\w+):'/g)].map(m=>m[1]),['view','update']);
 assert.match(read('src/components/console/ConsoleIcon.tsx'),/\bdeposits:\[/);
});
