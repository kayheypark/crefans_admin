'use client';
import {useRef,useState} from 'react';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
import {ConfirmDialog} from './TypedConfirm';
import {ConsoleIcon} from './ConsoleIcon';
// 2026-11-20 user request: "AI 체험관리" — each signed-out AI photo trial: uploaded photos (the built-in sample marked as the sample),
// every generation with the presets used and its result photo, and whether a post followed. Server: crefans_server
// src/platform/admin-ai-trials.ts (members.view; prompts need logs.view; every detail and photo opened is audit-logged).
type TrialRow={id:string;startedAt:string;lastActivityAt:string;uploads:number;sampleUploads:number;generated:number;succeeded:number;failed:number;posts:number;claimed:boolean};
type TrialList={items:TrialRow[];page:number;hasMore:boolean};
type Photo={id:string;at:string;deleted:boolean;ready:boolean};
type Generation={at:string;outcome:'succeeded'|'failed';requestId:string|null;errorCode:string|null;resultId:string|null;detail:'available'|'expired';prompt?:string|null;
 options:{mode:string|null;kind:string|null;editKinds:string[]|null;targetGender:string|null;costumes:{id:string;name:string}[];backgroundId:string|null;presets:{kind:string;key:string}[];aspectRatio:string|null;generationMethod:string|null}|null};
type TrialDetail={id:string;startedAt:string;consents:{at:string;version:string|null}[];claimed:{at:string}|null;promptVisible:boolean;
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
 return <section>
  <p className="dashboard-basis">비회원 AI 사진 체험을 시작한 순서(최신 먼저)예요. 상세와 사진을 열면 운영 감사 기록에 남아요. 체험 자료는 원래 보관 기간(미사용 사진 7일·게시물 30일·요청 기록 30일)이 지나면 함께 사라져요.</p>
  <State {...state}/>
  {d&&<TableContent count={d.items.length} pending={state.loading} emptyMessage="체험 기록이 없습니다.">
   <div className="table-wrap"><table aria-label="AI 체험 목록"><thead><tr>{['체험','시작','마지막 활동','올린 사진','생성 성공·실패','결과 사진','게시','가입 연결','상세'].map(v=><th key={v} scope="col">{v}</th>)}</tr></thead>
    <tbody>{d.items.map(r=><tr key={r.id}>
     <td><code title={r.id}>{short(r.id)}</code></td><td>{date(r.startedAt)}</td><td>{date(r.lastActivityAt)}</td>
     <td className="number">{r.uploads}{r.sampleUploads>0&&<small> (샘플 {r.sampleUploads})</small>}</td>
     <td className="number">{r.succeeded} · {r.failed}</td><td className="number">{r.generated}</td>
     <td>{r.posts>0?`게시 ${r.posts}`:'미게시'}</td><td>{r.claimed?'연결됨':'—'}</td>
     <td><button type="button" onClick={()=>setSelected(r.id)}>보기</button></td></tr>)}</tbody></table></div>
  </TableContent>}
  {d&&<div className="pager"><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>이전</button><span>{page}쪽</span><button disabled={!d.hasMore} onClick={()=>setPage(v=>v+1)}>다음</button></div>}
  {selected&&<TrialDialog id={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}

function TrialDialog({id,onClose}:{id:string;onClose:()=>void}){
 const close=useRef<HTMLButtonElement>(null);
 return <ConfirmDialog title={`체험 ${short(id)} 히스토리`} onCancel={onClose} className="log-detail-dialog ai-trial-dialog">
  <button ref={close} type="button" className="log-detail-close" aria-label="체험 히스토리 닫기" autoFocus onClick={onClose}><ConsoleIcon name="close"/></button>
  <TrialContent id={id}/>
 </ConfirmDialog>;
}

function Thumb({trial,media,label,deleted}:{trial:string;media:string;label:string;deleted?:boolean}){
 // eslint-disable-next-line @next/next/no-img-element -- authenticated admin route, not an optimizable public image
 return <figure className="ai-trial-photo">{deleted?<div className="ai-trial-gone">삭제됨</div>:<a href={photoUrl(trial,media)} target="_blank" rel="noopener noreferrer"><img src={photoUrl(trial,media)} alt={label} loading="lazy"/></a>}<figcaption>{label}</figcaption></figure>;
}

function Options({g}:{g:Generation}){
 const o=g.options;if(!o)return <span className="muted">요청 기록 보관 기간(30일)이 지나 옵션을 볼 수 없어요.</span>;
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
 const state=useData<TrialDetail>(`/admin/ai-trials/${encodeURIComponent(id)}`),d=state.data;
 if(!d)return <State {...state}/>;
 const resultDeleted=new Map(d.results.map(r=>[r.id,r.deleted]));
 return <div className="ai-trial-detail">
  <dl className="ai-trial-summary">
   <div><dt>체험 ID</dt><dd><code>{d.id}</code></dd></div>
   <div><dt>동의</dt><dd>{d.consents.map(c=>`${date(c.at)}${c.version?` (${c.version})`:''}`).join(' / ')}</dd></div>
   <div><dt>가입 연결</dt><dd>{d.claimed?date(d.claimed.at):'안 함'}</dd></div>
  </dl>
  <h3>올린 사진 {d.uploads.length}장</h3>
  {d.uploads.length?<div className="ai-trial-photos">{d.uploads.map(u=><Thumb key={u.id} trial={d.id} media={u.id} deleted={u.deleted} label={`${u.sample?'샘플 원본':'직접 올린 사진'} · ${date(u.at)}`}/>)}</div>:<p className="muted">올린 사진이 없어요.</p>}
  <h3>생성 히스토리 {d.generations.length}회 (성공 {d.generations.filter(g=>g.outcome==='succeeded').length})</h3>
  {d.generations.length?<ol className="ai-trial-timeline">{d.generations.map((g,i)=><li key={g.requestId||i} data-outcome={g.outcome}>
   <div className="ai-trial-when"><strong>{i+1}. {g.outcome==='succeeded'?'성공':'실패'}</strong> {date(g.at)}{g.errorCode&&<span className="muted"> · {g.errorCode}</span>}</div>
   <Options g={g}/>
   {d.promptVisible&&g.prompt&&<p className="ai-trial-prompt">{g.prompt}</p>}
   {g.resultId&&<div className="ai-trial-photos"><Thumb trial={d.id} media={g.resultId} deleted={resultDeleted.get(g.resultId)} label="생성 결과"/></div>}
  </li>)}</ol>:<p className="muted">생성 기록이 없어요.</p>}
  {(()=>{const shown=new Set(d.generations.map(g=>g.resultId));const extra=d.results.filter(r=>!shown.has(r.id));return extra.length?<><h3>그 밖의 결과 사진 {extra.length}장</h3><p className="muted">자르기 결과이거나 요청 기록이 지난 생성 결과예요.</p><div className="ai-trial-photos">{extra.map(r=><Thumb key={r.id} trial={d.id} media={r.id} deleted={r.deleted} label={`${r.croppedFrom?'자른 사진':'생성 결과'} · ${date(r.at)}`}/>)}</div></>:null;})()}
  <h3>게시글 {d.posts.length}건</h3>
  {d.posts.length?d.posts.map(p=><article key={p.id} className="ai-trial-post">
   <div className="ai-trial-when"><strong>{p.title||'(제목 없음)'}</strong> {date(p.publishedAt||p.createdAt)} · {p.deleted?'삭제':p.hidden?'운영 숨김':p.public?'공개':'비공개'}</div>
   <p>{p.body}</p>
   <div className="ai-trial-photos">{p.mediaIds.map(m=><Thumb key={m} trial={d.id} media={m} label="게시 사진"/>)}</div>
  </article>):<p className="muted">게시하지 않았어요.</p>}
 </div>;
}
