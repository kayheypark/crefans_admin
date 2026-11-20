'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useSnackbar} from './Snackbar';
export type LandingAlertCapInfo={value:number;default:number;min:number;max:number;presets:number[]};
const count=(n:number)=>n.toLocaleString('ko-KR');
// 2026-11-21 user decision: the daily cap of 랜딩 방문 Telegram alerts is set here — presets 100…1000 plus free input
// (server funnel-stats.ts updateLandingAlertCap, settings.update). Everyone who sees the dashboard sees the current value.
export function LandingAlertCap({info,canEdit,onSaved}:{info:LandingAlertCapInfo;canEdit:boolean;onSaved:()=>void}){
 const snackbar=useSnackbar(),[draft,setDraft]=useState(String(info.value)),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const value=Number(draft),valid=/^\d+$/.test(draft)&&value>=info.min&&value<=info.max,changed=valid&&value!==info.value;
 async function save(){if(busy||!changed)return;setBusy(true);setMessage('');try{const r=await api<{value:number;message:string}>('/admin/funnel-stats/landing-alert-cap',{cap:value},'PUT');snackbar(r.message);onSaved();}catch(e){setMessage(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}}
 return <section className="landing-alert-cap" aria-labelledby="landing-alert-cap-title">
  <h3 id="landing-alert-cap-title">랜딩 방문 알림 하루 상한</h3>
  <p className="dashboard-basis">한국 시간 하루 동안 랜딩 방문 텔레그램 알림을 이 건수까지 받고, 넘으면 상한 안내 1번 뒤에는 집계만 해요. 지금 <strong>하루 {count(info.value)}건</strong>{info.value===info.default?' (기본값)':''}.</p>
  {canEdit?<>
   <div className="cap-presets" role="group" aria-label="상한 빠른 선택">{info.presets.map(n=><button key={n} type="button" className="chip" aria-pressed={value===n} disabled={busy} onClick={()=>{setDraft(String(n));setMessage('');}}>{count(n)}개</button>)}</div>
   <form className="cap-form" onSubmit={e=>{e.preventDefault();void save();}}>
    <label htmlFor="landing-alert-cap-input">직접 입력</label>
    <input id="landing-alert-cap-input" type="number" inputMode="numeric" min={info.min} max={info.max} step={1} value={draft} disabled={busy} aria-invalid={!valid} aria-describedby="landing-alert-cap-help" onChange={e=>{setDraft(e.target.value.trim());setMessage('');}}/>
    <span>건</span>
    <button type="submit" className="primary" disabled={busy||!changed}>{busy?'저장 중…':'저장'}</button>
   </form>
   <p id="landing-alert-cap-help" className={valid?'hint':'error'}>{valid?`${count(info.min)}~${count(info.max)} 사이 정수로 저장돼요.`:`${count(info.min)}~${count(info.max)} 사이 정수로 입력해주세요.`}</p>
   {message&&<p role="alert" className="error">{message}</p>}
  </>:<p className="hint">상한을 바꾸려면 운영 설정 수정 권한이 필요해요.</p>}
 </section>;
}
