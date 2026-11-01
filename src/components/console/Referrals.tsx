'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {ConfirmDialog} from './TypedConfirm';
import {useSnackbar} from './Snackbar';
import {ConsoleIcon} from './ConsoleIcon';

// Friend invite (referral) management, server admin-referrals.ts (2026-11-01): the on/off switch, the referral list,
// and a link button any member row can use. Rewards: direct inviter only, 100 withdrawable beans 7 days after the
// invitee's first live payment, at most 10 per inviter per KST month.
type Person={id:string;nickname:string;email:string};
type Referral={id:string;referrer:Person;member:Person;status:string;rewardQuantity:number;source:string|null;dueAt:string|null;rewardedAt:string|null;clawedBackAt:string|null;createdAt:string};
type List={enabled:boolean;summary:Record<string,{count:number;beans:number}>;items:Referral[];total:number;page:number;pageSize:number};
const statusNames:Record<string,string>={pending:'첫 결제 전',qualified:'확정 대기(7일)',granted:'지급 완료',clawed_back:'회수',capped:'월 상한 초과',forfeited:'소멸'};
const sources:Record<string,string>={checkout:'멤버십',bean_charge:'콩 충전'};
const day=(v:string|null)=>v?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v)):'-';
const person=(p:Person)=><span>{p.nickname}<br/><small className="muted">{p.email||p.id}</small></span>;

export function Referrals({canUpdate}:{canUpdate:boolean}){
 const [status,setStatus]=useState(''),[page,setPage]=useState(1),state=useData<List>(`/admin/referrals?page=${page}${status?'&status='+status:''}`);
 const [confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const enabled=state.data?.enabled===true,snackbar=useSnackbar();
 async function toggle(){if(busy)return;setBusy(true);setMessage('');try{const r=await api<{message:string}>('/admin/referrals/settings',{enabled:!enabled},'PUT');snackbar(r.message);setConfirming(false);state.reload();}catch(e){setMessage(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}}
 return <section className="referrals"><h2>초대 및 보상 현황</h2>
  <p className="referral-intro">친구 초대 현황과 보상 지급 상태를 한곳에서 확인하세요.</p>
  <div className="referral-policy"><div className="referral-policy-heading"><span className="referral-symbol"><ConsoleIcon name="referrals"/></span><div><h3>친구 초대 보상</h3><p>첫 실결제 후 7일 · 추천인당 월 최대 10건</p></div><span className={`referral-status ${enabled?'is-granted':'is-pending'}`}>{!state.data?'확인 중':enabled?'운영 중':'중지'}</span></div>
   <p>직접 초대한 친구의 첫 실결제가 7일 동안 환불되지 않으면, 추천인에게 후원에만 쓸 수 있는 프로모션콩 100개(출금 불가)를 지급합니다. 일부라도 환불되면 남은 보상을 회수하고(이미 후원에 쓴 몫은 회사 부담), 지급 시점에 비활성인 추천인은 소멸 처리하며 테스트 결제는 지급하지 않습니다.</p>
   {state.data&&<div className="referral-switch"><strong>친구 초대 보상: {enabled?'켜짐':'꺼짐'}</strong>{canUpdate&&<button className={enabled?'':'primary'} type="button" disabled={busy||state.loading} onClick={()=>setConfirming(true)}>{enabled?'끄기':'켜기'}</button>}</div>}
  </div>
  {message&&<p role="alert" className="error">{message}</p>}
  {confirming&&<ConfirmDialog title={enabled?'친구 초대 보상을 끌까요?':'친구 초대 보상을 켤까요?'} onCancel={()=>{if(!busy)setConfirming(false);}}>{enabled?<p>새 초대 가입과 새 보상 자격이 멈춥니다. 이미 확정 대기 중인 보상도 지급되지 않습니다.</p>:<p>레퍼럴 링크로 운영자 초대 없이 가입할 수 있게 되고, 첫 실결제 7일 뒤 출금 가능한 콩이 지급됩니다. 약관·처리방침 개정본 시행 후에 켜세요.</p>}<div className="actions"><button type="button" disabled={busy} onClick={()=>setConfirming(false)}>취소</button><button type="button" disabled={busy} onClick={()=>void toggle()}>{enabled?'끄기':'켜기'}</button></div></ConfirmDialog>}
  {state.data&&<div className="metrics referral-metrics">{Object.entries(statusNames).map(([key,label])=><article key={key}><span>{label}</span><strong>{(state.data!.summary[key]?.count||0).toLocaleString('ko-KR')}<small>건</small></strong></article>)}</div>}
  <form className="filters referral-filters" onSubmit={e=>e.preventDefault()}><label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">전체</option>{Object.entries(statusNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><span className="muted">총 {(state.data?.total||0).toLocaleString('ko-KR')}건</span></form>
  <State {...state}/>
  {state.data&&(state.data.items.length?<div className="table-wrap"><table><thead><tr><th>추천인</th><th>초대받은 회원</th><th>상태</th><th>결제</th><th className="number">보상</th><th>확정 예정일</th><th>지급일</th><th>가입일</th></tr></thead><tbody>{state.data.items.map(r=><tr key={r.id}><td>{person(r.referrer)}</td><td>{person(r.member)}</td><td><span className={`referral-status is-${r.status}`}>{statusNames[r.status]||r.status}</span></td><td>{r.source?sources[r.source]||r.source:'-'}</td><td className="number">{r.rewardQuantity?`${r.rewardQuantity}콩`:'-'}</td><td>{day(r.dueAt)}</td><td>{day(r.rewardedAt)}</td><td>{day(r.createdAt)}</td></tr>)}</tbody></table></div>:<p className="empty">표시할 데이터가 없습니다.</p>)}
  {state.data&&<div className="pager"><span>총 {state.data.total.toLocaleString()}건</span><button disabled={page<=1} onClick={()=>setPage(page-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(state.data.total/state.data.pageSize))}</span><button disabled={page*state.data.pageSize>=state.data.total} onClick={()=>setPage(page+1)}>다음</button></div>}
 </section>;
}

/** Member list action: creates (or shows) the member's referral link, for fans and creators alike. */
export function ReferralLinkButton({memberId}:{memberId:string}){
 const [link,setLink]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[copying,setCopying]=useState(false),[error,setError]=useState(''),snackbar=useSnackbar();
 async function create(){if(busy)return;setBusy(true);setNote('');try{const r=await api<{link:string;enabled:boolean;memberActive:boolean}>(`/admin/members/${encodeURIComponent(memberId)}/referral`,{});setLink(r.link);setNote(!r.enabled?'스위치가 꺼져 있어 아직 가입에 쓰이지 않습니다.':!r.memberActive?'비활성 회원의 링크는 가입에 쓰이지 않습니다.':'');}catch(e){setNote(e instanceof Error?e.message:'링크를 만들지 못했습니다.');}finally{setBusy(false);}}
 async function copy(){if(!link||copying)return;setCopying(true);setError('');try{await navigator.clipboard.writeText(link);snackbar('레퍼럴 링크를 복사했습니다.');}catch{setError('복사하지 못했습니다. 링크를 직접 선택해 복사해주세요.');}finally{setCopying(false);}}
 return <div className="referral-link">{link?<div className="referral-link-controls"><input readOnly value={link} aria-label="레퍼럴 링크" onFocus={e=>e.currentTarget.select()}/><button type="button" disabled={copying} onClick={()=>void copy()}>{copying?'복사 중…':'복사'}</button></div>:<button type="button" disabled={busy} onClick={()=>void create()}>{busy?'만드는 중…':'레퍼럴 링크 생성'}</button>}{note&&<small className="muted">{note}</small>}{error&&<small role="alert" className="error">{error}</small>}</div>;
}
