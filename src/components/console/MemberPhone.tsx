'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';

type Phone={masked:string|null;kept:boolean}|null;
// 2026-11-17 user decision: the member list shows the checked phone number masked; the full number is fetched only on request
// (each reveal is audited on the server) and is not kept after the row is closed. Numbers checked before 2026-11-17 were never kept.
export function MemberPhone({id,phone}:{id:string;phone:Phone}){
 const [full,setFull]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!phone)return <span className="muted">미확인</span>;
 if(!phone.kept)return <span className="muted" title="2026-11-17 전에 확인한 번호는 보관하지 않습니다">확인됨(번호 미보관)</span>;
 async function reveal(){if(busy)return;setBusy(true);setError('');try{setFull((await api<{phone:string}>(`/admin/members/${encodeURIComponent(id)}/phone`)).phone);}catch(e){setError(e instanceof Error?e.message:'번호를 불러오지 못했습니다.');}finally{setBusy(false);}}
 return <div className="actions"><span>{full||phone.masked}</span>{!full&&<button type="button" disabled={busy} onClick={()=>void reveal()}>{busy?'확인 중…':'전체 보기'}</button>}{error&&<span role="alert" className="error">{error}</span>}</div>;
}
