'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';

// Manual payout mode (server MANUAL_PAYOUTS_ENABLED): no bank API is connected. The operator confirms settlement accounts
// against a bank book copy and records each bank transfer made outside the console. The server applies the usual
// withdrawal checks (Wednesday, balance, verified account) before a request can be recorded.
type Account={id:string;creatorId:string;bank:string;holder:string;lastFour:string;version:number;createdAt:string};
type Withdrawal={id:string;creator_id:string;amount:number;status:string;note:string|null;account_label:string;created_at:string};
const won=(n:number)=>`${n.toLocaleString('ko-KR')}원`;
const day=(v:string)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
const states:Record<string,string>={requested:'접수',processing:'이체 대기'};
const localNow=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,16);};

export function ManualPayouts({canUpdate}:{canUpdate:boolean}){
 const [revision,setRevision]=useState(0),accounts=useData<Account[]>(`/admin/settlement-accounts?r=${revision}`),open=useData<{items:Withdrawal[];total:number}>(`/admin/withdrawals?status=open&r=${revision}`);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[form,setForm]=useState<{id:string;result:'paid'|'rejected';reference:string;reason:string;at:string}|null>(null);
 async function send(path:string,body:object){if(busy)return;setBusy(true);setMessage('');try{const r=await api<{message?:string}>(path,body);setMessage(r?.message||'기록했습니다.');setForm(null);setRevision(n=>n+1);}catch(e){setMessage(e instanceof Error?e.message:'기록하지 못했습니다. 상태를 새로고침해 확인해주세요.');}finally{setBusy(false);}}
 function confirmAccount(a:Account){const reason=window.prompt(`${a.holder} · ${a.bank} ****${a.lastFour}\n통장 사본 등으로 예금주를 확인한 내용을 적어주세요.`);if(reason?.trim())void send(`/admin/settlement-accounts/${a.id}/verify`,{expectedVersion:a.version,reason:reason.trim()});}
 function submit(e:React.FormEvent){e.preventDefault();if(!form)return;const body=form.result==='paid'?{result:'paid',reference:form.reference.trim(),transferredAt:new Date(form.at).toISOString()}:{result:'rejected',reason:form.reason.trim()};void send(`/admin/withdrawals/${form.id}/manual-result`,body);}
 return <section className="manual-payouts"><h2>수동 지급</h2>
  <p className="notice">은행 연동 없이 운영자가 직접 이체합니다. 정산 계좌는 통장 사본으로 예금주를 확인한 뒤 확인 완료로 기록하고, 이체를 마친 출금은 이체 참조번호와 함께 기록합니다. 화요일 23:59(한국 시간)까지 접수된 출금이 매주 수요일에 이체 대기로 전환되며, 수요일이 공휴일이면 다음 영업일에 이체합니다.</p>
  {message&&<p role="status" className="muted">{message}</p>}
  <h3>확인 대기 정산 계좌</h3><State {...accounts}/>
  {accounts.data&&(accounts.data.length?<div className="table-wrap"><table><thead><tr><th>예금주</th><th>은행·끝자리</th><th>크리에이터 ID</th><th>등록일</th><th></th></tr></thead><tbody>{accounts.data.map(a=><tr key={a.id}><td>{a.holder}</td><td>{a.bank} ****{a.lastFour}</td><td>{a.creatorId}</td><td>{day(a.createdAt)}</td><td>{canUpdate&&<button disabled={busy} onClick={()=>confirmAccount(a)}>예금주 확인 완료</button>}</td></tr>)}</tbody></table></div>:<p className="muted">확인 대기 계좌가 없습니다.</p>)}
  <h3>이체할 멤버십 출금</h3><State {...open}/>
  {open.data&&(open.data.items.length?<div className="table-wrap"><table><thead><tr><th>신청일</th><th>크리에이터 ID</th><th>계좌</th><th>금액</th><th>상태</th><th></th></tr></thead><tbody>{open.data.items.map(w=><tr key={w.id}><td>{day(w.created_at)}</td><td>{w.creator_id}</td><td>{w.account_label}</td><td>{won(w.amount)}</td><td>{states[w.status]||w.status}{w.note&&<small> {w.note}</small>}</td><td>{canUpdate&&<><button disabled={busy} onClick={()=>setForm({id:w.id,result:'paid',reference:'',reason:'',at:localNow()})}>이체 완료 기록</button> <button disabled={busy} onClick={()=>setForm({id:w.id,result:'rejected',reference:'',reason:'',at:localNow()})}>반려</button></>}</td></tr>)}</tbody></table></div>:<p className="muted">이체할 출금이 없습니다.</p>)}
  {form&&<form className="filters" onSubmit={submit} aria-label={form.result==='paid'?'이체 완료 기록':'출금 반려'}>
   {form.result==='paid'?<><label>이체 참조번호<input required maxLength={100} value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="은행 이체 거래번호 등"/></label><label>이체 시각<input type="datetime-local" required value={form.at} max={localNow()} onChange={e=>setForm({...form,at:e.target.value})}/></label></>
    :<label>반려 사유<input required maxLength={500} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="예: 예금주 불일치"/></label>}
   <button type="submit" disabled={busy}>{form.result==='paid'?'기록':'반려'}</button><button type="button" onClick={()=>setForm(null)}>취소</button></form>}
 </section>;
}
