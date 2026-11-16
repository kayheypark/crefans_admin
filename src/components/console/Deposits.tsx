'use client';
import {useEffect,useState} from 'react';
import {api,ApiError} from '@/lib/console-api';
import {CASH_RECEIPT_LABELS,KIND_LABELS,kstInput,kstInputToIso,refundOverdue,timeLeft} from '@/lib/bank-transfer';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
import {ConfirmDialog,DialogActions,TypedConfirmDialog,useConfirm,usePrompt} from './TypedConfirm';
import {useSnackbar} from './Snackbar';

// 무통장입금 (2026-11-16 user decisions, server admin/bank-transfer, permission `deposits` view/update): the operator enters the
// company account, confirms deposits whose amount matches exactly (anything else is settled with the buyer first), records cash
// receipts issued in 홈택스 and transfers refunds within 3 business days. Cash receipt numbers (phone/business) and refund accounts
// are fetched per row on demand (audited on the server), kept only in memory and hidden again after two minutes.
type Account={bankName:string;accountNumber:string;holder:string;enabled:boolean;updatedAt:string};
type Payment={id:string;kind:string;orderId:string;amount:number;status:string;statusLabel:string;depositorName:string;expiresAt:string;confirmedAt:string|null;cashReceipt:{type:string;issued:boolean}|null;memberId:string;receivedAt:string|null;depositReference:string|null;cancelReason:string|null;cashReceiptIssuedAt:string|null;cashReceiptReference:string|null;createdAt:string};
type Refund={id:string;kind:string;refundId:string;orderId:string;memberId:string;amount:number;status:string;statusLabel:string;bankName:string;dueAt:string|null;completedAt:string|null;transferReference:string|null;rejectReason:string|null;createdAt:string};
const PAGE_SIZE=30,HIDE_AFTER_MS=120000,CANCEL_PHRASE='주문 취소';
const won=(n:number)=>`${n.toLocaleString('ko-KR')}원`;
const date=(v:string|null)=>v?new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'없음';
const kind=(k:string)=>KIND_LABELS[k]||k;
const paymentStatuses:[string,string][]=[['awaiting','입금 대기'],['confirmed','입금 확인'],['expired','입금 기한 만료'],['cancelled','주문 취소']];
const refundStatuses:[string,string][]=[['requested','환불 이체 대기'],['completed','환불 완료'],['rejected','환불 반려']];
const message=(e:unknown,fallback:string)=>e instanceof Error?e.message:fallback;
/** Minute clock for deadlines and overdue marks. */
function useNow(){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(t);},[]);return now;}
/** Revealed values vanish two minutes after the last reveal. */
function useRevealed<T>(){const [values,setValues]=useState<Record<string,T>>({});useEffect(()=>{if(!Object.keys(values).length)return;const t=setTimeout(()=>setValues({}),HIDE_AFTER_MS);return()=>clearTimeout(t);},[values]);return [values,setValues] as const;}

export function Deposits({canUpdate}:{canUpdate:boolean}){
 return <div className="deposits"><CompanyAccount canUpdate={canUpdate}/><Payments canUpdate={canUpdate}/><Refunds canUpdate={canUpdate}/></div>;
}

function CompanyAccount({canUpdate}:{canUpdate:boolean}){
 const state=useData<Account|null>('/admin/bank-transfer/account'),confirmAction=useConfirm(),snackbar=useSnackbar();
 const [form,setForm]=useState({bankName:'',accountNumber:'',holder:'',enabled:false}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(state.data)setForm({bankName:state.data.bankName,accountNumber:state.data.accountNumber,holder:state.data.holder,enabled:state.data.enabled});},[state.data]);
 const current=state.data,ready=!state.loading||current!==null;
 const valid=!!form.bankName.trim()&&form.bankName.trim().length<=20&&!!form.holder.trim()&&form.holder.trim().length<=20&&/^[0-9-]{6,30}$/.test(form.accountNumber.trim());
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!valid)return;
  const next=`${form.bankName.trim()} ${form.accountNumber.trim()} (예금주 ${form.holder.trim()}) · ${form.enabled?'사용':'사용 안 함'}`;
  if(!await confirmAction({title:'입금 계좌 저장',message:`현재: ${current?`${current.bankName} ${current.accountNumber} (예금주 ${current.holder}) · ${current.enabled?'사용':'사용 안 함'}`:'미설정'}\n변경: ${next}\n저장하면 새 무통장입금 주문부터 이 계좌가 안내됩니다. 이미 접수된 주문은 주문 당시 안내한 계좌를 그대로 보여 줍니다.${form.enabled?'':'\n사용 안 함으로 저장하면 회원은 무통장입금으로 주문할 수 없습니다.'}`,actionLabel:'저장'}))return;
  setBusy(true);setError('');
  try{await api('/admin/bank-transfer/account',{bankName:form.bankName.trim(),accountNumber:form.accountNumber.trim(),holder:form.holder.trim(),enabled:form.enabled},'PUT');snackbar('입금 계좌를 저장했습니다.');state.reload();}
  catch(e){setError(message(e,'입금 계좌를 저장하지 못했습니다.'));}finally{setBusy(false);}
 }
 return <section><h2>입금 계좌 설정</h2>
  <p className="notice">회원이 무통장입금으로 보낼 회사 계좌입니다. 계좌를 저장하고 &lsquo;사용&rsquo;으로 켜기 전에는 콩 충전·AI 이용권·광고상품의 무통장입금 주문이 막힙니다. 주문 후 24시간 안에 입금이 없으면 주문은 자동 취소됩니다.</p>
  <State {...state}/>
  {ready&&!state.error&&<>
   <p className="muted">현재: {current?<>{current.bankName} {current.accountNumber} (예금주 {current.holder}) · <strong>{current.enabled?'사용 중':'사용 안 함'}</strong> · 마지막 저장 {date(current.updatedAt)}</>:<strong>미설정 (무통장입금 주문 불가)</strong>}</p>
   {canUpdate?<form className="filters" onSubmit={save} aria-label="입금 계좌 설정">
    <label>은행<input required maxLength={20} disabled={busy} value={form.bankName} placeholder="예: 국민은행" onChange={e=>setForm({...form,bankName:e.target.value})}/></label>
    <label>계좌번호<input required inputMode="numeric" maxLength={30} pattern="[0-9\-]{6,30}" disabled={busy} value={form.accountNumber} placeholder="숫자와 - 만" onChange={e=>setForm({...form,accountNumber:e.target.value})}/></label>
    <label>예금주<input required maxLength={20} disabled={busy} value={form.holder} onChange={e=>setForm({...form,holder:e.target.value})}/></label>
    <label className="check"><input type="checkbox" disabled={busy} checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/>무통장입금 사용</label>
    <button className="primary" disabled={busy||!valid}>{busy?'저장 중…':'저장'}</button>
   </form>:<p className="muted">입금 계좌 변경 권한이 없어 조회만 할 수 있습니다.</p>}
   {error&&<p role="alert" className="error">{error}</p>}
  </>}
 </section>;
}

function Payments({canUpdate}:{canUpdate:boolean}){
 const [status,setStatus]=useState('awaiting'),[page,setPage]=useState(1),state=useData<{items:Payment[];total:number;page:number}>(`/admin/bank-transfer/payments?status=${status}&page=${page}`);
 const now=useNow(),snackbar=useSnackbar(),[numbers,setNumbers]=useRevealed<{type:string;number:string}>(),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const [confirming,setConfirming]=useState<Payment|null>(null),[cancelling,setCancelling]=useState<Payment|null>(null),[issuing,setIssuing]=useState<Payment|null>(null);
 async function reveal(p:Payment){if(busy)return;setBusy(p.id);setError('');try{const r=await api<{type:string;number:string}>(`/admin/bank-transfer/payments/${encodeURIComponent(p.id)}/cash-receipt/reveal`,{});setNumbers(n=>({...n,[p.id]:r}));}catch(e){setError(message(e,'현금영수증 번호를 불러오지 못했습니다.'));}finally{setBusy('');}}
 function done(text:string){snackbar(text);setConfirming(null);setCancelling(null);setIssuing(null);state.reload();}
 const items=state.data?.items||[];
 return <section><h2>입금 대기·내역</h2>
  <p className="notice">통장 입금 내역과 주문 금액·입금자명을 대조해 <b>금액이 정확히 같을 때만</b> 입금 확인을 누르세요. 확인하면 콩·이용권이 바로 지급되거나 광고상품을 사용할 수 있게 됩니다. 금액이나 입금자명이 다르면 확인하지 말고 먼저 구매자에게 연락해 해결하세요.</p>
  <div className="filters"><label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>{paymentStatuses.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
  {error&&<p role="alert" className="error">{error}</p>}
  <State {...state}/>
  {state.data&&<TableContent count={items.length} pending={state.loading||!!state.error} emptyMessage={status==='awaiting'?'입금 대기 주문이 없습니다.':'해당 상태의 주문이 없습니다.'}><div className="table-wrap"><table aria-label="무통장입금 주문"><thead><tr><th>주문 종류</th><th>주문 ID</th><th>회원 ID</th><th className="number">금액</th><th>입금자명</th><th>기한</th><th>상태</th><th>현금영수증</th>{canUpdate&&<th>처리</th>}</tr></thead><tbody>{items.map(p=>{const left=timeLeft(p.expiresAt,now),receipt=numbers[p.id];return <tr key={p.id}>
   <td>{kind(p.kind)}</td><td>{p.orderId}</td><td>{p.memberId}</td><td className="number">{won(p.amount)}</td><td>{p.depositorName}</td>
   <td>{date(p.expiresAt)}{p.status==='awaiting'&&<small className={left?undefined:'deposit-overdue'}> {left||'기한 지남 · 자동 취소 대기'}</small>}</td>
   <td>{p.statusLabel}{p.status==='confirmed'&&<small> 입금 {date(p.receivedAt)}{p.depositReference&&` · ${p.depositReference}`}</small>}{p.cancelReason&&<small> {p.cancelReason}</small>}</td>
   <td>{p.cashReceipt?<>{CASH_RECEIPT_LABELS[p.cashReceipt.type]||p.cashReceipt.type} · {p.cashReceipt.issued?'발급 완료':'미발급'}{p.cashReceiptIssuedAt&&<small> {date(p.cashReceiptIssuedAt)}{p.cashReceiptReference&&` · ${p.cashReceiptReference}`}</small>}
    {receipt&&<div className="payout-number"><span>{CASH_RECEIPT_LABELS[receipt.type]||receipt.type}</span><code>{receipt.number}</code></div>}</>:'신청 없음'}</td>
   {canUpdate&&<td><div className="actions">
    {p.status==='awaiting'&&<><button type="button" className="primary" onClick={()=>setConfirming(p)}>입금 확인</button><button type="button" onClick={()=>setCancelling(p)}>주문 취소</button></>}
    {p.status==='confirmed'&&p.cashReceipt&&<>{!receipt&&<button type="button" disabled={!!busy} onClick={()=>void reveal(p)}>{busy===p.id?'불러오는 중':'번호 보기'}</button>}{!p.cashReceipt.issued&&<button type="button" onClick={()=>setIssuing(p)}>발급 기록</button>}</>}
   </div></td>}
  </tr>;})}</tbody></table></div></TableContent>}
  {state.data&&<div className="pager"><span>총 {state.data.total.toLocaleString()}건</span><button disabled={page<=1} onClick={()=>setPage(page-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(state.data.total/PAGE_SIZE))}</span><button disabled={page*PAGE_SIZE>=state.data.total} onClick={()=>setPage(page+1)}>다음</button></div>}
  {canUpdate&&<p className="muted">현금영수증 번호 보기는 홈택스 발급에 필요할 때만 사용하세요. 볼 때마다 기록이 남고 2분 뒤 다시 가려집니다.</p>}
  {confirming&&<ConfirmDeposit payment={confirming} onClose={()=>setConfirming(null)} onDone={()=>done('입금을 확인했습니다.')} onClosed={()=>{setConfirming(null);state.reload();}}/>}
  {cancelling&&<CancelOrder payment={cancelling} onClose={()=>setCancelling(null)} onDone={()=>done('주문을 취소했습니다.')}/>}
  {issuing&&<RecordCashReceipt payment={issuing} onClose={()=>setIssuing(null)} onDone={()=>done('현금영수증 발급을 기록했습니다.')}/>}
 </section>;
}

function ConfirmDeposit({payment,onClose,onDone,onClosed}:{payment:Payment;onClose:()=>void;onDone:()=>void;onClosed:()=>void}){
 const [amount,setAmount]=useState(''),[at,setAt]=useState(()=>kstInput()),[reference,setReference]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[closed,setClosed]=useState(false);
 const entered=amount===''?null:Number(amount),mismatch=entered!==null&&entered!==payment.amount,iso=kstInputToIso(at);
 async function save(e:React.FormEvent){e.preventDefault();if(busy||mismatch||entered===null||!iso||!reference.trim())return;setBusy(true);setError('');
  try{await api(`/admin/bank-transfer/payments/${encodeURIComponent(payment.id)}/confirm`,{amount:entered,receivedAt:iso,reference:reference.trim()});onDone();}
  catch(e){const code=e instanceof ApiError?e.code:'';if(code==='BANK_TRANSFER_CLOSED')setClosed(true);
   setError(code==='DEPOSIT_AMOUNT_MISMATCH'?`입금액이 주문 금액(${won(payment.amount)})과 달라 확인할 수 없습니다. 구매자에게 연락해 차액을 해결한 뒤 처리하세요.`:message(e,'입금을 확인하지 못했습니다.'));}
  finally{setBusy(false);}}
 return <ConfirmDialog title="입금 확인" onCancel={()=>{if(!busy)(closed?onClosed:onClose)();}}><form className="editor" onSubmit={save}>
  <dl className="change-summary"><dt>주문</dt><dd>{kind(payment.kind)} · {payment.orderId}</dd><dt>주문 금액</dt><dd><strong>{won(payment.amount)}</strong></dd><dt>입금자명</dt><dd>{payment.depositorName}</dd><dt>입금 기한</dt><dd>{date(payment.expiresAt)}</dd></dl>
  <p className="muted">통장에 들어온 금액과 입금자명이 위와 같을 때만 확인하세요. 금액이 다르거나 이름이 다르면 확인하지 말고 구매자에게 먼저 연락해 해결하세요(차액 반환·재주문 등). 확인하면 되돌릴 수 없습니다.</p>
  <label>실제 입금액 (원)<input type="number" inputMode="numeric" min="1" step="1" required disabled={busy} value={amount} onChange={e=>setAmount(e.target.value)} aria-invalid={mismatch||undefined}/></label>
  {mismatch&&<p role="alert" className="error">입금액이 주문 금액({won(payment.amount)})과 다릅니다. 금액이 정확히 같을 때만 확인할 수 있어요.</p>}
  <label>실제 입금 시각 (한국 시간)<input type="datetime-local" required disabled={busy} value={at} max={kstInput()} onChange={e=>setAt(e.target.value)}/></label>
  <label>거래 메모·참조<input required maxLength={191} disabled={busy} value={reference} placeholder="통장 거래 메모 또는 거래번호" onChange={e=>setReference(e.target.value)}/></label>
  {error&&<p role="alert" className="error">{error}</p>}
  <DialogActions><button type="button" disabled={busy} onClick={closed?onClosed:onClose}>닫기</button><button className="primary" disabled={busy||closed||entered===null||mismatch||!iso||!reference.trim()}>{busy?'확인 중…':'입금 확인'}</button></DialogActions>
 </form></ConfirmDialog>;
}

// The server takes only the reason; the typed phrase is a console-side guard against a slip on the wrong row.
function CancelOrder({payment,onClose,onDone}:{payment:Payment;onClose:()=>void;onDone:()=>void}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function cancel(){if(busy||!reason.trim())return;setBusy(true);setError('');try{await api(`/admin/bank-transfer/payments/${encodeURIComponent(payment.id)}/cancel`,{reason:reason.trim()});onDone();}catch(e){setError(message(e,'주문을 취소하지 못했습니다.'));}finally{setBusy(false);}}
 return <TypedConfirmDialog title="무통장입금 주문 취소" phrase={CANCEL_PHRASE} actionLabel="주문 취소" busyLabel="취소 중…" busy={busy} confirmDisabled={!reason.trim()} error={error} onCancel={onClose} onConfirm={()=>void cancel()}>
  <dl className="change-summary"><dt>주문</dt><dd>{kind(payment.kind)} · {payment.orderId}</dd><dt>금액</dt><dd>{won(payment.amount)}</dd><dt>입금자명</dt><dd>{payment.depositorName}</dd></dl>
  <p>입금 전 주문만 취소하세요. 이미 입금을 받았다면 취소하지 말고 금액을 확인해 입금 확인하거나 구매자와 반환을 협의하세요. 취소는 되돌릴 수 없습니다.</p>
  <label>취소 사유<textarea required maxLength={200} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 </TypedConfirmDialog>;
}

function RecordCashReceipt({payment,onClose,onDone}:{payment:Payment;onClose:()=>void;onDone:()=>void}){
 const [reference,setReference]=useState(''),[at,setAt]=useState(()=>kstInput()),[busy,setBusy]=useState(false),[error,setError]=useState(''),iso=kstInputToIso(at);
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!iso||!reference.trim())return;setBusy(true);setError('');try{await api(`/admin/bank-transfer/payments/${encodeURIComponent(payment.id)}/cash-receipt`,{reference:reference.trim(),issuedAt:iso});onDone();}catch(e){setError(message(e,'발급 기록을 저장하지 못했습니다.'));}finally{setBusy(false);}}
 return <ConfirmDialog title="현금영수증 발급 기록" onCancel={()=>{if(!busy)onClose();}}><form className="editor" onSubmit={save}>
  <p className="muted">{kind(payment.kind)} · {payment.orderId} · {won(payment.amount)} · {CASH_RECEIPT_LABELS[payment.cashReceipt?.type||'']||''}. 홈택스에서 현금영수증을 발급한 뒤 승인번호와 발급 시각을 기록하세요.</p>
  <label>승인번호·참조<input required maxLength={191} disabled={busy} value={reference} onChange={e=>setReference(e.target.value)}/></label>
  <label>발급 시각 (한국 시간)<input type="datetime-local" required disabled={busy} value={at} max={kstInput()} onChange={e=>setAt(e.target.value)}/></label>
  {error&&<p role="alert" className="error">{error}</p>}
  <DialogActions><button type="button" disabled={busy} onClick={onClose}>닫기</button><button className="primary" disabled={busy||!iso||!reference.trim()}>{busy?'저장 중…':'발급 기록'}</button></DialogActions>
 </form></ConfirmDialog>;
}

function Refunds({canUpdate}:{canUpdate:boolean}){
 const [status,setStatus]=useState('requested'),state=useData<Refund[]>(`/admin/bank-transfer/refunds?status=${status}`),now=useNow(),snackbar=useSnackbar(),askText=usePrompt();
 const [accounts,setAccounts]=useRevealed<{bankName:string;accountNumber:string;holder:string}>(),[busy,setBusy]=useState(''),[error,setError]=useState(''),[completing,setCompleting]=useState<Refund|null>(null);
 async function reveal(r:Refund){if(busy)return;setBusy(r.id);setError('');try{const a=await api<{bankName:string;accountNumber:string;holder:string}>(`/admin/bank-transfer/refunds/${encodeURIComponent(r.id)}/account/reveal`,{});setAccounts(n=>({...n,[r.id]:a}));}catch(e){setError(message(e,'환불 계좌를 불러오지 못했습니다.'));}finally{setBusy('');}}
 async function reject(r:Refund){if(busy)return;const reason=await askText({title:'환불 반려',message:`${kind(r.kind)} · ${r.orderId} · ${won(r.amount)}\n반려하면 환불 요청이 닫히고 구매가 환불 신청 전 상태로 돌아갑니다(콩·이용권·광고상품 복원). 계좌 오류 등으로 이체할 수 없을 때만 사용하고, 구매자에게 사유를 안내하세요.`,label:'반려 사유',maxLength:200,multiline:true,actionLabel:'반려',danger:true});if(!reason)return;
  setBusy(r.id);setError('');try{await api(`/admin/bank-transfer/refunds/${encodeURIComponent(r.id)}/reject`,{reason});snackbar('환불을 반려했습니다.');state.reload();}catch(e){setError(message(e,'환불을 반려하지 못했습니다.'));}finally{setBusy('');}}
 const items=state.data||[];
 return <section><h2>환불 이체</h2>
  <p className="notice">무통장입금 구매의 환불은 회원이 입력한 계좌로 직접 이체합니다. 전자상거래법 제18조에 따라 환불 요청일로부터 <b>3영업일 안에</b> 이체하세요. 이체 기한은 서버가 주말을 빼고 계산하며 공휴일은 반영하지 않습니다. 계좌 보기는 이체할 때만 사용하세요. 볼 때마다 기록이 남고 2분 뒤 다시 가려집니다.</p>
  <div className="filters"><label>상태<select value={status} onChange={e=>setStatus(e.target.value)}>{refundStatuses.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
  {error&&<p role="alert" className="error">{error}</p>}
  <State {...state}/>
  {state.data&&<TableContent count={items.length} pending={state.loading||!!state.error} emptyMessage={status==='requested'?'이체할 환불이 없습니다.':'해당 상태의 환불이 없습니다.'}><div className="table-wrap"><table aria-label="환불 이체"><thead><tr><th>주문 종류</th><th>주문 ID</th><th>회원 ID</th><th className="number">환불액</th><th>환불 계좌</th><th>요청일</th><th>이체 기한</th><th>상태</th>{canUpdate&&<th>처리</th>}</tr></thead><tbody>{items.map(r=>{const overdue=refundOverdue(r,now),a=accounts[r.id];return <tr key={r.id}>
   <td>{kind(r.kind)}</td><td>{r.orderId}</td><td>{r.memberId}</td><td className="number">{won(r.amount)}</td>
   <td>{r.bankName}{a&&<div className="payout-number"><span>{a.bankName} · {a.holder}</span><code>{a.accountNumber}</code></div>}</td>
   <td>{date(r.createdAt)}</td>
   <td>{date(r.dueAt)}{overdue&&<strong className="deposit-overdue"> 기한 지남</strong>}</td>
   <td>{r.statusLabel}{r.status==='completed'&&<small> 이체 {date(r.completedAt)}{r.transferReference&&` · ${r.transferReference}`}</small>}{r.rejectReason&&<small> {r.rejectReason}</small>}</td>
   {canUpdate&&<td>{r.status==='requested'&&<div className="actions">{!a&&<button type="button" disabled={!!busy} onClick={()=>void reveal(r)}>{busy===r.id?'불러오는 중':'계좌 보기'}</button>}<button type="button" className="primary" disabled={!!busy} onClick={()=>setCompleting(r)}>이체 완료 기록</button><button type="button" disabled={!!busy} onClick={()=>void reject(r)}>반려</button></div>}</td>}
  </tr>;})}</tbody></table></div></TableContent>}
  {state.data&&items.length>=100&&<p className="muted">최대 100건까지 표시합니다. 처리 후 새로고침해 나머지를 확인하세요.</p>}
  {completing&&<CompleteRefund refund={completing} onClose={()=>setCompleting(null)} onDone={()=>{snackbar('환불 이체 완료를 기록했습니다.');setCompleting(null);state.reload();}}/>}
 </section>;
}

function CompleteRefund({refund,onClose,onDone}:{refund:Refund;onClose:()=>void;onDone:()=>void}){
 const [reference,setReference]=useState(''),[at,setAt]=useState(()=>kstInput()),[busy,setBusy]=useState(false),[error,setError]=useState(''),iso=kstInputToIso(at);
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!iso||!reference.trim())return;setBusy(true);setError('');try{await api(`/admin/bank-transfer/refunds/${encodeURIComponent(refund.id)}/complete`,{reference:reference.trim(),transferredAt:iso});onDone();}catch(e){setError(message(e,'이체 완료를 기록하지 못했습니다.'));}finally{setBusy(false);}}
 return <ConfirmDialog title="환불 이체 완료 기록" onCancel={()=>{if(!busy)onClose();}}><form className="editor" onSubmit={save}>
  <p className="muted">{kind(refund.kind)} · {refund.orderId} · <strong>{won(refund.amount)}</strong>. 실제로 이체를 마친 뒤에만 기록하세요. 기록하면 환불이 완료되며 되돌릴 수 없습니다.</p>
  <label>이체 참조번호<input required maxLength={191} disabled={busy} value={reference} placeholder="은행 이체 거래번호 등" onChange={e=>setReference(e.target.value)}/></label>
  <label>이체 시각 (한국 시간)<input type="datetime-local" required disabled={busy} value={at} max={kstInput()} onChange={e=>setAt(e.target.value)}/></label>
  {error&&<p role="alert" className="error">{error}</p>}
  <DialogActions><button type="button" disabled={busy} onClick={onClose}>닫기</button><button className="primary" disabled={busy||!iso||!reference.trim()}>{busy?'기록 중…':'이체 완료 기록'}</button></DialogActions>
 </form></ConfirmDialog>;
}
