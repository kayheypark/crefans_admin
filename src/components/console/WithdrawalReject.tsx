'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {usePrompt} from './TypedConfirm';

// 2026-11-07: a membership withdrawal requested before a refund that left the creator's available balance negative can never be
// paid (server PAYOUT_BALANCE_CHANGED). Shown only for rows the server marks rejectable; the server checks the same condition again.
export function RejectWithdrawal({id,amount,onDone}:{id:string;amount:number;onDone:(message:string)=>void}){
 const ask=usePrompt(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function run(){
  const reason=await ask({title:'출금 신청 반려',message:`환불로 출금 가능 잔액이 부족해진 ${amount.toLocaleString('ko-KR')}원 출금 신청을 반려합니다. 크리에이터에게 반려 알림이 가며, 남은 금액으로 다시 신청할 수 있습니다.`,label:'반려 사유',maxLength:150,actionLabel:'반려',danger:true});
  if(!reason||busy)return;setBusy(true);setError('');
  try{const r=await api<{message?:string}>(`/admin/withdrawals/${id}/reject`,{reason});onDone(r?.message||'출금 신청을 반려했습니다.');}
  catch(e){setError(e instanceof Error?e.message:'반려하지 못했습니다. 새로고침해 상태를 확인해주세요.');}
  finally{setBusy(false);}
 }
 return <><button type="button" className="danger" disabled={busy} onClick={run}>반려</button>{error&&<p role="alert" className="error">{error}</p>}</>;
}
