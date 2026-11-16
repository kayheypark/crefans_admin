'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useConfirm} from './TypedConfirm';

// 2026-11-17 user decision (signed partnership contract article 12(2)): if no agreement is reached within 30 days after the
// partnership ends, the confirmed unsettled revenue is paid in full to the registered account. This starts that payout; the
// operator then reveals the account, transfers and records the result in the manual payout list. The server re-checks everything.
type State={endedAt:string|null;dueAt:string|null;amount:number;pending:number;account:{bank:string;lastFour:string}|null;blocker:string|null;message:string|null};
const won=(n:number)=>n.toLocaleString('ko-KR')+'원',day=(iso:string|null)=>iso?new Date(new Date(iso).getTime()+9*3600000).toISOString().slice(0,10):'-';
export function ClosingPayout({creatorId,name}:{creatorId:string;name:string}){
 const confirmAction=useConfirm(),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[error,setError]=useState('');
 async function run(){
  if(busy)return;setBusy(true);setError('');setNote('');
  try{
   const s=await api<State>(`/admin/creators/${encodeURIComponent(creatorId)}/closing-payout`);
   if(s.blocker){setNote(s.message||'지금은 종료 정산을 지급할 수 없습니다.');return;}
   if(!await confirmAction({title:'종료 정산 지급',message:`${name}님은 ${day(s.endedAt)}에 파트너 계약이 종료되어 30일 협의 기간이 지났습니다(계약 제12조). 확정된 미정산 멤버십 수익 ${won(s.amount)}을 ${s.account?`${s.account.bank} ****${s.account.lastFour}`:'등록 계좌'}로 지급합니다.${s.pending>0?` 아직 보류 중인 ${won(s.pending)}은 확정 후 따로 지급합니다.`:''} 시작하면 크리에이터에게 알림이 가고, 수동 지급 목록에서 계좌를 확인해 이체한 뒤 참조번호를 기록하세요.`,actionLabel:'지급 시작'}))return;
   const r=await api<{message?:string}>(`/admin/creators/${encodeURIComponent(creatorId)}/closing-payout`,{expectedAmount:s.amount});
   setNote(r?.message||'종료 정산 지급을 시작했습니다.');
  }catch(e){setError(e instanceof Error?e.message:'종료 정산 상태를 확인하지 못했습니다.');}
  finally{setBusy(false);}
 }
 return <><button type="button" disabled={busy} onClick={()=>void run()}>{busy?'확인 중…':'종료 정산 지급'}</button>{note&&<span className="muted">{note}</span>}{error&&<span role="alert" className="error">{error}</span>}</>;
}
