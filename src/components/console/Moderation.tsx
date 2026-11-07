'use client';
import {EmptyState} from './EmptyState';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {ConfirmDialog,TypedConfirmDialog} from './TypedConfirm';
import {useSnackbar} from './Snackbar';

// Terms §8 operator actions. The server checks permission and records every action with its reason.
type Entry={action:string;reason:string|null;publicReason?:string|null;until:string|null;actorType?:'admin'|'creator';actorName?:string|null;adminName:string|null;createdAt:string};
const labels:Record<string,string>={'post.hidden':'숨김','post.unhidden':'숨김 해제','post.unpublished':'미공개 전환 (공개→미공개)','post.republished':'다시 공개 (미공개→공개)','post.reviewed':'검수 완료','member.suspended':'이용 제한','member.unsuspended':'제한 해제','member.erased':'회원 삭제'};
const at=(v:string)=>new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
const day=(v:string)=>new Date(v).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});
function History({path}:{path:string}){const state=useData<Entry[]>(path);return <section className="terms-history"><h3>조치 이력</h3><State {...state}/>{state.data&&(state.data.length?<div className="table-wrap"><table><thead><tr><th>일시</th><th>조치</th><th>처리자</th><th>내부 사유</th><th>당사자 안내 사유</th></tr></thead><tbody>{state.data.map((h,i)=><tr key={i}><td>{at(h.createdAt)}</td><td>{labels[h.action]||h.action}{h.action==='member.suspended'&&<small>{h.until?day(h.until)+'까지':'무기한'}</small>}</td><td>{h.actorType==='creator'?`크리에이터 · ${h.actorName||'탈퇴한 회원'}`:h.actorName||h.adminName||'—'}</td><td>{h.reason||'—'}</td><td>{h.publicReason||'—'}</td></tr>)}</tbody></table></div>:<EmptyState>조치 이력이 없습니다.</EmptyState>)}</section>;}

// reason stays internal; publicReason reaches the affected member by app notice and email (server rejects an empty one).
function Reasons({reason,setReason,publicReason,setPublicReason,placeholder,publicPlaceholder}:{reason:string;setReason:(v:string)=>void;publicReason:string;setPublicReason:(v:string)=>void;placeholder:string;publicPlaceholder:string}){return <>
 <label>당사자에게 보일 사유<small className="muted">앱 알림과 이메일로 당사자에게 전달됩니다.</small><textarea required maxLength={500} placeholder={publicPlaceholder} value={publicReason} onChange={e=>setPublicReason(e.target.value)}/></label>
 <label>조치 사유<small className="muted">내부 기록용, 당사자에게 보이지 않음</small><textarea required maxLength={500} placeholder={placeholder} value={reason} onChange={e=>setReason(e.target.value)}/></label>
</>;}
export type ModeratedPost={id:string;title:string;hidden_at:string|null;hidden_reason:string|null};
export type SuspendableMember={id:string;nickname:string;suspended_at:string|null;suspended_until:string|null;suspension_reason:string|null};
export function PostModeration({post,canEdit,reload}:{post:ModeratedPost;canEdit:boolean;reload:()=>void}){
 const [open,setOpen]=useState(false),[reason,setReason]=useState(''),[publicReason,setPublicReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),notify=useSnackbar();const hidden=!!post.hidden_at;
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!reason.trim()||!publicReason.trim())return;setBusy(true);setError('');try{const r=await api<{message:string}>(`/admin/posts/${encodeURIComponent(post.id)}/moderation`,{hidden:!hidden,reason,publicReason});setOpen(false);setReason('');setPublicReason('');notify(r.message);reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="actions"><span>{hidden?'운영자 숨김':'정상'}</span><button type="button" onClick={()=>{setOpen(true);setError('');}}>{canEdit?(hidden?'숨김 해제':'숨기기'):'이력'}</button>
  {open&&<ConfirmDialog title={canEdit?(hidden?'게시물 숨김 해제':'게시물 숨기기'):'게시물 조치 이력'} onCancel={()=>{if(!busy)setOpen(false);}}>
   <p><strong>{post.title}</strong></p>
   {canEdit&&<form className="editor" onSubmit={save}>
    <p className="muted">{hidden?`현재 숨김 사유: ${post.hidden_reason||'—'}`:'숨기면 작성자 본인 외에는 피드·프로필·상세·댓글·후원·미디어에서 볼 수 없습니다. 작성자는 스튜디오에서 숨김 상태를 봅니다.'}</p>
    <Reasons reason={reason} setReason={setReason} publicReason={publicReason} setPublicReason={setPublicReason} placeholder="예: 신고 확인 — 저작권 침해" publicPlaceholder={hidden?'예: 소명이 확인되어 게시물 숨김을 해제했습니다.':'예: 저작권 침해 신고가 확인되어 게시물을 숨겼습니다.'}/>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="actions dialog-actions"><button type="button" disabled={busy} onClick={()=>setOpen(false)}>닫기</button><button className="primary" disabled={busy||!reason.trim()||!publicReason.trim()}>{hidden?'숨김 해제':'숨기기'}</button></div>
   </form>}
   <History path={`/admin/posts/${encodeURIComponent(post.id)}/moderation`}/>
   {!canEdit&&<div className="actions dialog-actions"><button type="button" onClick={()=>setOpen(false)}>닫기</button></div>}
  </ConfirmDialog>}
 </div>;
}

export type VisiblePost={id:string;title:string;is_public:boolean;hidden_at:string|null};
// Creator unpublish (2026-11-07): the same state the author switches in the studio. Operators need a reason; the author is not notified.
// Operator hiding stays a separate column/action above; either one keeps the post from everyone but its author.
export function PostVisibility({post,canEdit,reload}:{post:VisiblePost;canEdit:boolean;reload:()=>void}){
 const [open,setOpen]=useState(false),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),notify=useSnackbar();const unpublished=!post.is_public;
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!reason.trim())return;setBusy(true);setError('');try{const r=await api<{message:string}>(`/admin/posts/${encodeURIComponent(post.id)}/visibility`,{public:unpublished,reason});setOpen(false);setReason('');notify(r.message);reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="actions"><span>{unpublished?'미공개':'공개'}</span><button type="button" onClick={()=>{setOpen(true);setError('');}}>{canEdit?(unpublished?'공개로 전환':'미공개로 전환'):'공개 이력'}</button>
  {open&&<ConfirmDialog title={canEdit?(unpublished?'게시물 공개로 전환':'게시물 미공개로 전환'):'게시물 처리 이력'} onCancel={()=>{if(!busy)setOpen(false);}}>
   <p><strong>{post.title}</strong></p>
   {canEdit&&<form className="editor" onSubmit={save}>
    <p className="muted">{unpublished?'공개로 바꾸면 미공개 전 공개 범위 그대로 다시 보입니다.':'미공개로 바꾸면 작성자 본인 외에는 피드·프로필·검색·상세·댓글·좋아요·후원·미디어에서 볼 수 없습니다. 데이터는 지워지지 않습니다.'} 크리에이터에게 알림을 보내지 않으며, 크리에이터도 스튜디오에서 다시 바꿀 수 있습니다.{post.hidden_at?' 이 게시물은 운영자 숨김 상태라 공개로 바꿔도 숨김을 해제하기 전까지 보이지 않습니다.':''}</p>
    <label>변경 사유<small className="muted">내부 기록용, 크리에이터에게 보이지 않음</small><textarea required maxLength={500} placeholder="예: 신고 검토 중 임시 미공개" value={reason} onChange={e=>setReason(e.target.value)}/></label>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="actions dialog-actions"><button type="button" disabled={busy} onClick={()=>setOpen(false)}>닫기</button><button className="primary" disabled={busy||!reason.trim()}>{busy?'처리 중…':unpublished?'공개로 전환':'미공개로 전환'}</button></div>
   </form>}
   <History path={`/admin/posts/${encodeURIComponent(post.id)}/moderation`}/>
   {!canEdit&&<div className="actions dialog-actions"><button type="button" onClick={()=>setOpen(false)}>닫기</button></div>}
  </ConfirmDialog>}
 </div>;
}

export type ReviewablePost={id:string;reviewed_at:string|null;hidden_at:string|null};
// Beta post-publication review: one click marks a post as checked; hiding counts as a review too.
export function PostReview({post,canEdit,reload}:{post:ReviewablePost;canEdit:boolean;reload:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(post.reviewed_at||post.hidden_at)return <span>검수 완료</span>;
 async function review(){if(busy)return;setBusy(true);setError('');try{await api(`/admin/posts/${encodeURIComponent(post.id)}/review`,{});reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="actions"><span>미검수</span>{canEdit&&<button type="button" disabled={busy} onClick={()=>void review()}>{busy?'저장 중…':'검수 완료'}</button>}{error&&<span role="alert" className="error">{error}</span>}</div>;
}
export type ErasableMember={id:string;email:string;nickname:string;withdrawn_at:string|null;purged_at:string|null};
// SUPER_ADMIN only. The server refuses while subscriptions, beans, earnings or receivables are left, and checks the typed email.
export function MemberErase({member,reload}:{member:ErasableMember;reload:()=>void}){
 const [open,setOpen]=useState(false),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),notify=useSnackbar();
 if(member.purged_at)return <span>삭제됨</span>;
 async function erase(confirmEmail:string){if(busy)return;if(!reason.trim()){setError('삭제 사유를 입력해주세요.');return;}setBusy(true);setError('');try{const r=await api<{message:string}>(`/admin/members/${encodeURIComponent(member.id)}/erase`,{reason,confirmEmail});setOpen(false);setReason('');notify(r.message);reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="actions">{member.withdrawn_at&&<span>탈퇴 · 파기 대기</span>}<button type="button" onClick={()=>{setOpen(true);setError('');}}>회원 삭제</button>
  {open&&<TypedConfirmDialog title="회원 삭제" phrase={member.email} actionLabel="삭제" busyLabel="삭제 중…" busy={busy} error={error} onCancel={()=>setOpen(false)} onConfirm={typed=>void erase(typed)}>
   <p><strong>{member.nickname}</strong></p>
   <p className="muted">30일 유예 없이 바로 파기합니다. 이메일·이름·프로필·게시물·본인확인 값이 지워지고 되돌릴 수 없습니다. 댓글·메시지는 &lsquo;탈퇴한 사용자&rsquo;로 남고, 결제·정산 기록은 법정 보관을 위해 회원 번호로 남습니다. 같은 이메일로 바로 다시 초대·가입할 수 있습니다.</p>
   <p className="muted">자동 갱신 구독, 남은 콩, 남은 수익, 진행 중 출금, 미수금, 판매 중 멤버십이 있으면 삭제되지 않습니다.</p>
   <label>삭제 사유<small className="muted">내부 기록용</small><textarea required maxLength={500} placeholder="예: 테스트 계정 정리, 본인 요청" value={reason} onChange={e=>setReason(e.target.value)}/></label>
  </TypedConfirmDialog>}
 </div>;
}
export function MemberSuspension({member,canEdit,reload}:{member:SuspendableMember;canEdit:boolean;reload:()=>void}){
 const active=!!member.suspended_at&&(!member.suspended_until||new Date(member.suspended_until)>new Date());
 const [open,setOpen]=useState(false),[days,setDays]=useState('7'),[reason,setReason]=useState(''),[publicReason,setPublicReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),notify=useSnackbar();
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!reason.trim()||!publicReason.trim())return;setBusy(true);setError('');try{const r=await api<{message:string}>(`/admin/members/${encodeURIComponent(member.id)}/suspension`,active?{suspended:false,reason,publicReason}:{suspended:true,days:days==='none'?null:Number(days),reason,publicReason});setOpen(false);setReason('');setPublicReason('');notify(r.message);reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="actions"><span>{active?(member.suspended_until?`제한 중 · ${day(member.suspended_until)}까지`:'제한 중 · 무기한'):'정상'}</span><button type="button" onClick={()=>{setOpen(true);setError('');}}>{canEdit?(active?'제한 해제':'이용 제한'):'이력'}</button>
  {open&&<ConfirmDialog title={canEdit?(active?'이용 제한 해제':'회원 이용 제한'):'이용 제한 이력'} onCancel={()=>{if(!busy)setOpen(false);}}>
   <p><strong>{member.nickname}</strong></p>
   {canEdit&&<form className="editor" onSubmit={save}>
    {active?<p className="muted">현재 사유: {member.suspension_reason||'—'}</p>:<><p className="muted">제한하면 로그인 세션이 바로 끊기고, 기간 동안 로그인할 수 없습니다. 게시물은 그대로이니 필요하면 콘텐츠·신고 메뉴에서 따로 숨기세요.</p>
     <label>제한 기간<select value={days} onChange={e=>setDays(e.target.value)}><option value="7">7일</option><option value="30">30일</option><option value="none">무기한(해제할 때까지)</option></select></label></>}
    <Reasons reason={reason} setReason={setReason} publicReason={publicReason} setPublicReason={setPublicReason} placeholder="예: 반복 스팸 신고 확인" publicPlaceholder={active?'예: 소명이 확인되어 이용 제한을 해제했습니다.':'예: 반복적인 스팸 게시로 운영정책을 위반했습니다.'}/>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="actions dialog-actions"><button type="button" disabled={busy} onClick={()=>setOpen(false)}>닫기</button><button className="primary" disabled={busy||!reason.trim()||!publicReason.trim()}>{active?'제한 해제':'이용 제한'}</button></div>
   </form>}
   <History path={`/admin/members/${encodeURIComponent(member.id)}/suspension`}/>
   {!canEdit&&<div className="actions dialog-actions"><button type="button" onClick={()=>setOpen(false)}>닫기</button></div>}
  </ConfirmDialog>}
 </div>;
}
