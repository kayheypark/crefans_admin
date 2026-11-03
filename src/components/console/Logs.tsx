'use client';
import {EmptyState} from './EmptyState';
import {useRef,useState} from 'react';
import {useData,State} from './ConsoleData';
import {ConfirmDialog} from './TypedConfirm';
import {ConsoleIcon} from './ConsoleIcon';
type Log={id:string;category:string;action:string;level:string;actorId:string|null;actorRole:string|null;ip:string|null;peerIp:string|null;requestId:string|null;jobId:string|null;entityId:string|null;sourceId:string|null;release:string;environment:string;status:number|null;durationMs:number|null;at:string;metadata:Record<string,unknown>};
type Result={items:Log[];total:number;page:number;pageSize:number};
type Detail={event:Log;timeline:Log[];hasMore:boolean;delivery:{attempts:number;delivered_at:string|null;available_at:string;last_error_code:string|null}|null};
const categories:Record<string,string>={request:'요청',error:'오류',auth:'인증·권한',admin:'관리자',finance:'결제·출금',mail:'메일',security:'보안',business:'서비스 활동',worker:'배치',client:'브라우저'};
const levels:Record<string,string>={info:'정보',warning:'주의',error:'오류'};
const date=(s:string)=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const initial=()=>({from:today(),to:today(),category:'',level:'',ip:'',requestId:'',actorId:'',entityId:'',jobId:'',action:''});
export function Logs(){
 const [draft,setDraft]=useState(initial),[filters,setFilters]=useState(initial),[page,setPage]=useState(1),[selected,setSelected]=useState<string|null>(null);
 const query=new URLSearchParams(Object.entries(filters).filter(([,v])=>v));query.set('page',String(page));const state=useData<Result>('/admin/logs?'+query);
 function change(key:keyof ReturnType<typeof initial>,value:string){setDraft(v=>({...v,[key]:value}));}
 return <>
 <form className="filters log-filters" onSubmit={e=>{e.preventDefault();setFilters(draft);setPage(1);setSelected(null);}}>
  <label>시작일<input type="date" value={draft.from} onChange={e=>change('from',e.target.value)} required/></label><label>종료일<input type="date" value={draft.to} onChange={e=>change('to',e.target.value)} required/></label>
  <label>분류<select value={draft.category} onChange={e=>change('category',e.target.value)}><option value="">전체 분류</option>{Object.entries(categories).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
  <label>수준<select value={draft.level} onChange={e=>change('level',e.target.value)}><option value="">전체 수준</option>{Object.entries(levels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
  {([['ip','접속 IP'],['requestId','요청 ID'],['actorId','행위자 ID'],['entityId','대상 ID'],['jobId','배치 실행 ID'],['action','이벤트명']] as const).map(([key,label])=><label key={key}>{label}<input value={draft[key]} maxLength={191} onChange={e=>change(key,e.target.value)} placeholder="정확히 일치"/></label>)}
  <button className="primary" disabled={!draft.from||!draft.to||draft.from>draft.to}>조회</button><button type="button" onClick={()=>{const next=initial();setDraft(next);setFilters(next);setPage(1);setSelected(null);}}>초기화</button><button type="button" onClick={state.reload}>새로고침</button>
 </form>
 <p className="notice">한국 시간 기준 · 최대 366일 · 비밀값과 본문은 기록하지 않습니다. 동일 요청·대상·배치 기록은 상세에서 확인할 수 있습니다.</p>
 <State {...state}/>
 {state.data&&<>{state.data.items.length?<div className="table-wrap"><table className="log-table"><thead><tr>{['시각','분류','수준','이벤트','접속 IP','상태','소요','상세'].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{state.data.items.map(row=><tr key={row.id}><td>{date(row.at)}</td><td>{categories[row.category]||row.category}</td><td><span className={'log-level '+row.level}>{levels[row.level]||row.level}</span></td><td><code>{row.action}</code></td><td>{row.ip||'시스템'}</td><td>{row.status??'—'}</td><td>{row.durationMs===null?'—':row.durationMs+'ms'}</td><td><button onClick={e=>{e.currentTarget.focus({preventScroll:true});setSelected(row.id);}} aria-label={`${row.action} 상세`}>상세</button></td></tr>)}</tbody></table></div>:<EmptyState>조건에 맞는 로그가 없습니다.</EmptyState>}
 <div className="pager"><span>총 {state.data.total.toLocaleString()}건</span><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(state.data.total/state.data.pageSize))}</span><button disabled={page*state.data.pageSize>=state.data.total} onClick={()=>setPage(v=>v+1)}>다음</button></div></>}
 {selected&&<LogDetail id={selected} onClose={()=>setSelected(null)} onSelect={setSelected}/>}
 </>;
}
function LogDetail({id,onClose,onSelect}:{id:string;onClose:()=>void;onSelect:(id:string)=>void}){
 const close=useRef<HTMLButtonElement>(null);
 return <ConfirmDialog title="로그 상세" onCancel={onClose} className="log-detail-dialog">
  <button ref={close} type="button" className="log-detail-close" aria-label="로그 상세 닫기" autoFocus onClick={onClose}><ConsoleIcon name="close"/></button>
  <LogDetailContent key={id} id={id} onSelect={next=>{onSelect(next);close.current?.focus({preventScroll:true});}}/>
 </ConfirmDialog>;
}
function LogDetailContent({id,onSelect}:{id:string;onSelect:(id:string)=>void}){
 const state=useData<Detail>('/admin/logs/'+encodeURIComponent(id)),row=state.data?.event;
 return <div className="log-detail" aria-busy={state.loading}><State {...state}/>{row&&<>
 <dl className="log-properties">{[['시각',date(row.at)],['이벤트',row.action],['수준',levels[row.level]],['환경',row.environment],['배포 버전',row.release],['접속 IP',row.ip],['연결 IP',row.peerIp],['행위자 ID',row.actorId],['행위자 역할',row.actorRole],['요청 ID',row.requestId],['배치 실행 ID',row.jobId],['대상 ID',row.entityId],['로그 ID',row.id]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'없음'}</dd></div>)}</dl>
 <h3>기록 내용</h3><pre className="log-json">{JSON.stringify(row.metadata,null,2)}</pre>
 {state.data?.delivery&&<p className="notice">텔레그램: {state.data.delivery.delivered_at?'접수 확인 '+date(state.data.delivery.delivered_at):'발송 대기'} · 시도 {state.data.delivery.attempts}회{state.data.delivery.last_error_code?' · '+state.data.delivery.last_error_code:''}</p>}
 <h3>관련 기록 타임라인</h3><p className="muted">같은 요청 ID, 대상 ID 또는 배치 실행 ID의 최근 100건입니다.</p><ol className="log-timeline">{state.data?.timeline.map(item=><li key={item.id}><time>{date(item.at)}</time><button onClick={()=>onSelect(item.id)} aria-current={item.id===id?'true':undefined}>{item.action}</button><span>{levels[item.level]} {item.status||''}</span></li>)}</ol>{state.data?.hasMore&&<p className="notice">이전 기록은 대상 ID나 배치 실행 ID와 기간을 지정해 검색해주세요.</p>}
 </>}</div>;
}
