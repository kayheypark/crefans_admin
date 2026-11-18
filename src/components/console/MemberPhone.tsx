'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {ConfirmDialog,DialogActions} from './TypedConfirm';

type Phone={masked:string|null;kept:boolean}|null;
// 2026-11-17 user decision: the member list shows the checked phone number masked; the full number is fetched only on request
// and is not kept after the row is closed. Numbers checked before 2026-11-17 were never kept.
// 2026-11-18 user decision (별도 권한 + 사유 + 감사): only SUPER_ADMIN sees the button; the reason (5~200자) goes in the POST body,
// never the URL. The server checks the role and the reason again and audits each reveal.
export const PHONE_REASON_MIN=5,PHONE_REASON_MAX=200;
export function MemberPhone({id,phone,canReveal}:{id:string;phone:Phone;canReveal:boolean}){
 const [full,setFull]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[asking,setAsking]=useState(false),[reason,setReason]=useState('');
 if(!phone)return <span className="muted">미확인</span>;
 if(!phone.kept)return <span className="muted" title="2026-11-17 전에 확인한 번호는 보관하지 않습니다">확인됨(번호 미보관)</span>;
 const trimmed=reason.trim(),valid=trimmed.length>=PHONE_REASON_MIN&&trimmed.length<=PHONE_REASON_MAX;
 async function reveal(e:React.FormEvent){e.preventDefault();if(busy||!valid)return;setBusy(true);setError('');try{setFull((await api<{phone:string}>(`/admin/members/${encodeURIComponent(id)}/phone`,{reason:trimmed},'POST')).phone);setAsking(false);setReason('');}catch(err){setError(err instanceof Error?err.message:'번호를 불러오지 못했습니다.');}finally{setBusy(false);}}
 const close=()=>{if(!busy){setAsking(false);setReason('');setError('');}};
 return <div className="actions"><span>{full||phone.masked}</span>{canReveal&&!full&&<button type="button" onClick={()=>{setError('');setAsking(true);}}>전체 보기</button>}
  {asking&&<ConfirmDialog title="휴대폰 번호 전체 보기" onCancel={close}><form className="editor" onSubmit={e=>void reveal(e)}><p className="muted">열람 사유와 처리자·시각이 감사 기록에 남습니다. 번호는 업무에 필요한 경우에만 확인해주세요.</p><label>열람 사유 ({PHONE_REASON_MIN}~{PHONE_REASON_MAX}자)<textarea required autoFocus minLength={PHONE_REASON_MIN} maxLength={PHONE_REASON_MAX} placeholder="예: 회원 본인 요청 문의에 회신하기 위해" value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<p className="error" role="alert">{error}</p>}<DialogActions><button type="button" disabled={busy} onClick={close}>취소</button><button className="primary" disabled={busy||!valid}>{busy?'확인 중…':'번호 보기'}</button></DialogActions></form></ConfirmDialog>}
 </div>;
}
