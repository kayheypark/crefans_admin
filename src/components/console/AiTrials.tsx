'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {ConsoleIcon} from './ConsoleIcon';
import {useData,State} from './ConsoleData';
import {ConfirmDialog,DialogActions} from './TypedConfirm';
import {EmptyState} from './EmptyState';
// 2026-11-20 user request: "AI 체험관리" — each signed-out AI photo trial: uploaded photos (the built-in sample marked as the sample),
// every generation with the presets used and its result photo, and whether a post followed. Server: crefans_server
// src/platform/admin-ai-trials.ts (members.view; prompts need logs.view; every detail and photo opened is audit-logged).
type TrialRow={id:string;startedAt:string;lastActivityAt:string;uploads:number;sampleUploads:number;generated:number;succeeded:number;failed:number;posts:number;claimed:boolean;entry:string|null};
type TrialList={items:TrialRow[];total:number;page:number;pageSize:number};
type Photo={id:string;at:string;deleted:boolean;ready:boolean};
type Generation={at:string;outcome:'succeeded'|'failed';requestId:string|null;errorCode:string|null;resultId:string|null;detail:'available'|'expired';prompt?:string|null;
 options:{mode:string|null;kind:string|null;editKinds:string[]|null;targetGender:string|null;costumes:{id:string;name:string}[];backgroundId:string|null;presets:{kind:string;key:string}[];aspectRatio:string|null;generationMethod:string|null}|null};
type TrialDetail={id:string;startedAt:string;consents:{at:string;version:string|null}[];claimed:{at:string}|null;promptVisible:boolean;replays?:{sessionId:string;at:string;url:string}[];entry?:{label:string;landingPath:string|null;at:string}|null;
 uploads:(Photo&{sample:boolean;results:string[]})[];results:(Photo&{sourceId:string|null;croppedFrom:string|null})[];generations:Generation[];
 posts:{id:string;title:string;body:string;status:string;public:boolean;deleted:boolean;hidden:boolean;publishedAt:string|null;createdAt:string;mediaIds:string[]}[]};
const date=(v:string|null)=>v?new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'없음';
const short=(id:string)=>id.slice(6,14);
const kinds:Record<string,string>={makeup:'메이크업',expression:'표정',pose:'포즈',camera:'구도',lens:'렌즈',body:'신체',background:'배경',outfit:'의상'};
const methods:Record<string,string>={fast:'빠른 생성',precise:'정밀 생성'};
const photoUrl=(trial:string,media:string)=>`/api/v1/admin/ai-trials/${encodeURIComponent(trial)}/media/${encodeURIComponent(media)}`;

export function AiTrials(){
 const [page,setPage]=useState(1),[selected,setSelected]=useState<string|null>(null);
 const state=useData<TrialList>(`/admin/ai-trials?page=${page}`),d=state.data;
 return <section className="ai-trials">
  <p className="notice">로그인하지 않은 방문자의 AI 사진 체험입니다. 체험을 시작한 순서로 보이며, 히스토리에서 올린 사진·생성 기록·결과 사진·게시글을 확인할 수 있습니다. 히스토리와 사진을 열면 운영 감사 기록에 남고, 유입은 체험에 동의할 때의 첫 방문 기준이며 2026-11-20 이후 체험부터 기록됩니다. 체험 자료는 원래 보관 기간(미사용 사진 7일·게시물 30일·요청 기록 30일)이 지나면 함께 사라집니다.</p>
  <State {...state}/>{d&&<>{d.items.length?<div className="table-wrap"><table><thead><tr><th>체험</th><th>시작</th><th>유입</th><th>마지막 활동</th><th>올린 사진</th><th>생성 성공·실패</th><th>결과 사진</th><th>게시</th><th>가입 연결</th><th>관리</th></tr></thead>
   <tbody>{d.items.map(r=><tr key={r.id}>
    <td><strong title={r.id}>{short(r.id)}</strong></td><td>{date(r.startedAt)}</td><td className="ai-trial-entry">{r.entry||'기록 없음'}</td><td>{date(r.lastActivityAt)}</td>
    <td>{r.uploads}장{r.sampleUploads>0&&<small className="muted"> 샘플 {r.sampleUploads}</small>}</td>
    <td>{r.succeeded}회 · {r.failed}회</td><td>{r.generated}장</td>
    <td>{r.posts>0?`${r.posts}건`:'미게시'}</td><td>{r.claimed?'연결됨':'없음'}</td>
    <td><div className="actions"><button type="button" onClick={()=>setSelected(r.id)}>히스토리</button></div></td></tr>)}</tbody></table></div>:<EmptyState>아직 체험 기록이 없습니다.</EmptyState>}
   <div className="pager"><span>총 {d.total.toLocaleString()}건</span><button type="button" disabled={state.loading||page<=1} onClick={()=>setPage(v=>v-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(d.total/d.pageSize))}</span><button type="button" disabled={state.loading||page*d.pageSize>=d.total} onClick={()=>setPage(v=>v+1)}>다음</button></div></>}
  {selected&&<ConfirmDialog title={`체험 ${short(selected)} 히스토리`} onCancel={()=>setSelected(null)} className="ai-trial-dialog"><button type="button" className="log-detail-close" aria-label="체험 히스토리 닫기" onClick={()=>setSelected(null)}><ConsoleIcon name="close"/></button><TrialContent id={selected}/><DialogActions><button type="button" onClick={()=>setSelected(null)}>닫기</button></DialogActions></ConfirmDialog>}
 </section>;
}

// 2026-11-20 user request: tapping a photo opens it full screen over the history dialog (it used to open a new tab).
type Viewer={url:string;label:string};
const ViewerContext=createContext<(photo:Viewer)=>void>(()=>{});
function Thumb({trial,media,label,deleted}:{trial:string;media:string;label:string;deleted?:boolean}){
 const open=useContext(ViewerContext),url=photoUrl(trial,media);
 // eslint-disable-next-line @next/next/no-img-element -- authenticated admin route, not an optimizable public image
 return <figure className="ai-trial-photo">{deleted?<div className="ai-trial-gone">삭제됨</div>:<button type="button" className="ai-trial-thumb" aria-label={`${label} 크게 보기`} onClick={()=>open({url,label})}><img src={url} alt={label} loading="lazy"/></button>}<figcaption>{label}</figcaption></figure>;
}
function PhotoViewer({photo,onClose}:{photo:Viewer;onClose:()=>void}){
 const close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{close.current?.focus({preventScroll:true});
  // Window capture runs before the dialog's own Escape handler, so Esc closes only the photo.
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}};
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[onClose]);
 // eslint-disable-next-line @next/next/no-img-element -- authenticated admin route
 return <div className="ai-trial-viewer" role="dialog" aria-modal="true" aria-label={photo.label} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><button ref={close} type="button" className="ai-trial-viewer-close" aria-label="사진 닫기" onClick={onClose}><ConsoleIcon name="close"/></button><img src={photo.url} alt={photo.label}/><p>{photo.label}</p></div>;
}

function Options({g}:{g:Generation}){
 const o=g.options;if(!o)return <span className="muted">요청 기록 보관 기간(30일)이 지나 옵션을 볼 수 없습니다.</span>;
 const items:[string,string][]=[];
 if(o.costumes.length)items.push(['의상',o.costumes.map(c=>c.name).join(', ')]);
 if(o.backgroundId)items.push(['배경 ID',o.backgroundId]);
 for(const p of o.presets.filter(p=>p.kind!=='outfit'&&!(p.kind==='background'&&/^[0-9a-f]{6}$/.test(p.key))))items.push([kinds[p.kind]||p.kind,p.key]);
 if(o.editKinds?.length)items.push(['편집 항목',o.editKinds.join(', ')]);
 if(o.targetGender)items.push(['성별',o.targetGender]);
 if(o.generationMethod)items.push(['생성 방식',methods[o.generationMethod]||o.generationMethod]);
 if(o.aspectRatio)items.push(['비율',o.aspectRatio]);
 return items.length?<dl className="ai-trial-options">{items.map(([k,v],i)=><div key={k+i}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>:<span className="muted">고른 프리셋 없음</span>;
}

function TrialContent({id}:{id:string}){
 const [viewer,setViewer]=useState<Viewer|null>(null);
 const state=useData<TrialDetail>(`/admin/ai-trials/${encodeURIComponent(id)}`),d=state.data;
 if(!d)return <State {...state}/>;
 const resultDeleted=new Map(d.results.map(r=>[r.id,r.deleted]));
 return <ViewerContext.Provider value={setViewer}><div className="ai-trial-detail">
  <dl className="ai-trial-summary">
   <div><dt>체험 ID</dt><dd><code>{d.id}</code></dd></div>
   <div><dt>동의</dt><dd>{d.consents.map(c=>`${date(c.at)}${c.version?` (${c.version})`:''}`).join(' / ')}</dd></div>
   <div><dt>유입 경로</dt><dd>{d.entry?<>{d.entry.label}{d.entry.landingPath&&<span className="muted"> · 첫 페이지 /{d.entry.landingPath.replace(/:/g,'/')}</span>}</>:'기록 없음(유입 기록 전 체험)'}</dd></div>
   <div><dt>가입 연결</dt><dd>{d.claimed?date(d.claimed.at):'안 함'}</dd></div>
   <div><dt>리플레이</dt><dd>{d.replays?.length?<span className="ai-trial-replays">{d.replays.map((r,i)=><a key={r.sessionId} href={r.url} target="_blank" rel="noopener noreferrer" title={r.sessionId}>PostHog {i+1} · {date(r.at)}</a>)}</span>:'연결된 리플레이 없음'}</dd></div>
  </dl>
  <h3>올린 사진 {d.uploads.length}장</h3>
  {d.uploads.length?<div className="ai-trial-photos">{d.uploads.map(u=><Thumb key={u.id} trial={d.id} media={u.id} deleted={u.deleted} label={`${u.sample?'샘플 원본':'직접 올린 사진'} · ${date(u.at)}`}/>)}</div>:<EmptyState>올린 사진이 없습니다.</EmptyState>}
  <h3>생성 히스토리 {d.generations.length}회 (성공 {d.generations.filter(g=>g.outcome==='succeeded').length})</h3>
  {d.generations.length?<ol className="ai-trial-timeline">{d.generations.map((g,i)=><li key={g.requestId||i} data-outcome={g.outcome}>
   <div className="ai-trial-when"><strong>{i+1}. {g.outcome==='succeeded'?'성공':'실패'}</strong> {date(g.at)}{g.errorCode&&<span className="muted"> · {g.errorCode}</span>}</div>
   <Options g={g}/>
   {d.promptVisible&&g.prompt&&<p className="ai-trial-prompt">{g.prompt}</p>}
   {g.resultId&&<div className="ai-trial-photos"><Thumb trial={d.id} media={g.resultId} deleted={resultDeleted.get(g.resultId)} label="생성 결과"/></div>}
  </li>)}</ol>:<EmptyState>생성 기록이 없습니다.</EmptyState>}
  {(()=>{const shown=new Set(d.generations.map(g=>g.resultId));const extra=d.results.filter(r=>!shown.has(r.id));return extra.length?<><h3>그 밖의 결과 사진 {extra.length}장</h3><p className="muted">자르기 결과이거나 요청 기록이 지난 생성 결과입니다.</p><div className="ai-trial-photos">{extra.map(r=><Thumb key={r.id} trial={d.id} media={r.id} deleted={r.deleted} label={`${r.croppedFrom?'자른 사진':'생성 결과'} · ${date(r.at)}`}/>)}</div></>:null;})()}
  <h3>게시글 {d.posts.length}건</h3>
  {d.posts.length?d.posts.map(p=><article key={p.id} className="ai-trial-post">
   <div className="ai-trial-when"><strong>{p.title||'(제목 없음)'}</strong> {date(p.publishedAt||p.createdAt)} · {p.deleted?'삭제':p.hidden?'운영 숨김':p.public?'공개':'비공개'}</div>
   <p>{p.body}</p>
   <div className="ai-trial-photos">{p.mediaIds.map(m=><Thumb key={m} trial={d.id} media={m} label="게시 사진"/>)}</div>
  </article>):<EmptyState>게시하지 않았습니다.</EmptyState>}
 </div>{viewer&&<PhotoViewer photo={viewer} onClose={()=>setViewer(null)}/>}</ViewerContext.Provider>;
}
