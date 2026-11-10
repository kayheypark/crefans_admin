'use client';
// 스튜디오 AI 사진 편집 허용 크리에이터(2026-11-08 사용자 요청). 서버 /api/v1/admin/ai-photo-grants, 권한은 members.view(조회)·members.update(허용·해제).
// 허용·해제는 사유가 필수이며 서버가 이력과 감사 기록을 한 트랜잭션에 남긴다.
import {useState} from 'react';
import {EmptyState} from './EmptyState';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {ConfirmDialog,DialogActions} from './TypedConfirm';
import {useSnackbar} from './Snackbar';

type Grant={creatorId:string;handle:string|null;displayName:string|null;creatorActive:boolean;reason:string;grantedBy:string|null;grantedByName:string|null;createdAt:string};
type Change={id:string;action:'granted'|'revoked';reason:string;changedByName:string|null;createdAt:string};
type Page<T>={items:T[];total:number;page:number;pageSize:number};
const date=(value:string)=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
const validReason=(value:string)=>value.trim().length>=2&&value.trim().length<=500;
function Pager({data,page,onChange,disabled=false}:{data:Page<unknown>;page:number;onChange:(page:number)=>void;disabled?:boolean}){return <div className="pager"><span>총 {data.total.toLocaleString()}명</span><button type="button" disabled={disabled||page<=1} onClick={()=>onChange(page-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(data.total/data.pageSize))}</span><button type="button" disabled={disabled||page*data.pageSize>=data.total} onClick={()=>onChange(page+1)}>다음</button></div>;}
const name=(g:Pick<Grant,'handle'|'displayName'>)=>g.handle?`@${g.handle}`:g.displayName||'알 수 없는 크리에이터';

function History({grant,onClose}:{grant:Grant;onClose:()=>void}){
 const [page,setPage]=useState(1),state=useData<Page<Change>>(`/admin/ai-photo-grants/${encodeURIComponent(grant.creatorId)}/history?page=${page}`);
 return <ConfirmDialog title={`${name(grant)} 허용 이력`} onCancel={onClose}><State {...state}/>{state.data&&<><ol className="handle-history">{state.data.items.map(r=><li key={r.id}><strong>{r.action==='granted'?'허용':'해제'}</strong><p>{r.reason}</p><small className="muted">{date(r.createdAt)} · {r.changedByName||'알 수 없음'}</small></li>)}</ol>{!state.data.items.length&&<EmptyState>변경 이력이 없습니다.</EmptyState>}<Pager data={state.data} page={page} onChange={setPage} disabled={state.loading}/></>}<DialogActions><button type="button" onClick={onClose}>닫기</button></DialogActions></ConfirmDialog>;
}

export function AiPhotoGrants({canUpdate}:{canUpdate:boolean}){
 const [page,setPage]=useState(1),[search,setSearch]=useState(''),[draft,setDraft]=useState('');
 const state=useData<Page<Grant>>(`/admin/ai-photo-grants?page=${page}&search=${encodeURIComponent(search)}`),snackbar=useSnackbar();
 const [adding,setAdding]=useState<{handle:string;reason:string}|null>(null),[revoking,setRevoking]=useState<Grant|null>(null),[history,setHistory]=useState<Grant|null>(null);
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const validHandle=!!adding&&/^@?[a-zA-Z0-9_.]{2,30}$/.test(adding.handle.trim());
 async function grant(e:React.FormEvent){e.preventDefault();if(!adding||busy||!validHandle||!validReason(adding.reason))return;setBusy(true);setError('');
  try{const r=await api<{message:string}>('/admin/ai-photo-grants',{handle:adding.handle.trim(),reason:adding.reason.trim()});setAdding(null);state.reload();snackbar(r.message);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function revoke(e:React.FormEvent){e.preventDefault();if(!revoking||busy||!validReason(reason))return;setBusy(true);setError('');
  try{const r=await api<{message:string}>(`/admin/ai-photo-grants/${encodeURIComponent(revoking.creatorId)}`,{reason:reason.trim()},'DELETE');setRevoking(null);state.reload();snackbar(r.message);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="ai-photo-grants">
  <p className="notice">스튜디오 게시물 작성의 ‘AI로 사진 만들기’(옷·포즈·배경 바꾸기)를 쓸 수 있는 크리에이터입니다. 목록에 있는 크리에이터만 사용할 수 있으며, 허용·해제 사유와 처리자는 이력으로 남습니다.</p>
  <form className="filters" onSubmit={e=>{e.preventDefault();setSearch(draft);setPage(1);}}><label>크리에이터·사유 검색<input value={draft} maxLength={100} placeholder="핸들, 활동명 또는 허용 사유" onChange={e=>setDraft(e.target.value)}/></label><button type="submit">검색</button>{canUpdate&&<button type="button" className="primary toolbar-end" onClick={()=>{setAdding({handle:'',reason:''});setError('');}}>크리에이터 허용</button>}</form>
  <State {...state}/>{state.data&&<>{state.data.items.length?<div className="table-wrap"><table><thead><tr><th>크리에이터</th><th>활동명</th><th>허용 사유</th><th>허용한 운영자</th><th>허용일</th><th>관리</th></tr></thead><tbody>{state.data.items.map(g=><tr key={g.creatorId}><td><strong>{name(g)}</strong>{!g.creatorActive&&<span className="muted"> (비활성)</span>}</td><td>{g.displayName||'없음'}</td><td className="handle-reason">{g.reason}</td><td>{g.grantedByName||'알 수 없음'}</td><td>{date(g.createdAt)}</td><td><div className="actions"><button type="button" onClick={()=>setHistory(g)}>이력</button>{canUpdate&&<button type="button" disabled={state.loading} onClick={()=>{setRevoking(g);setReason('');setError('');}}>해제</button>}</div></td></tr>)}</tbody></table></div>:<EmptyState>{search?'검색 결과가 없습니다.':'아직 허용한 크리에이터가 없습니다.'}</EmptyState>}<Pager data={state.data} page={page} onChange={setPage} disabled={state.loading}/></>}
  {adding&&<ConfirmDialog title="AI 사진 편집 허용" onCancel={()=>{if(!busy)setAdding(null);}}><form className="editor" onSubmit={grant}><label>크리에이터 핸들<input required autoCapitalize="none" autoComplete="off" spellCheck={false} maxLength={31} placeholder="@handle" disabled={busy} value={adding.handle} onChange={e=>setAdding({...adding,handle:e.target.value})}/></label><p className="muted">활성 크리에이터의 핸들을 정확히 입력하세요. 대문자는 소문자로 바뀝니다.</p><label>허용 사유<textarea required maxLength={500} disabled={busy} placeholder="예: 코스프레 화보 시범 운영 대상" value={adding.reason} onChange={e=>setAdding({...adding,reason:e.target.value})}/></label><p className="muted">2~500자. 이력에 그대로 남습니다.</p>{error&&<p role="alert" className="error">{error}</p>}<DialogActions><button type="button" disabled={busy} onClick={()=>setAdding(null)}>취소</button><button type="submit" className="primary" disabled={busy||!validHandle||!validReason(adding.reason)}>{busy?'저장 중…':'허용'}</button></DialogActions></form></ConfirmDialog>}
  {revoking&&<ConfirmDialog title="AI 사진 편집 허용 해제" onCancel={()=>{if(!busy)setRevoking(null);}}><form className="editor" onSubmit={revoke}><p>{name(revoking)}의 AI 사진 편집 허용을 해제합니다. 해제 즉시 새로 만들 수 없고, 이미 게시물에 넣은 사진은 그대로 남습니다.</p><label>해제 사유<textarea required maxLength={500} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<p role="alert" className="error">{error}</p>}<DialogActions><button type="button" disabled={busy} onClick={()=>setRevoking(null)}>취소</button><button type="submit" className="primary" disabled={busy||!validReason(reason)}>{busy?'처리 중…':'해제'}</button></DialogActions></form></ConfirmDialog>}
  {history&&<History grant={history} onClose={()=>setHistory(null)}/>}
 </section>;
}
