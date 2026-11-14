'use client';
import {EmptyState} from './EmptyState';
import {useRef,useState} from 'react';
import {useData,State} from './ConsoleData';
import {ConfirmDialog} from './TypedConfirm';
import {ConsoleIcon} from './ConsoleIcon';
type Attempt={status:'succeeded'|'failed'|'in_progress'|'unknown';selectedModel:string|null;selectedProvider:string|null;attemptedModels:string[];currentStage:string;durationMs:number|null;events?:Log[]};
type Log={aiAttempt?:Attempt;id:string;category:string;action:string;level:string;actorId:string|null;actorRole:string|null;ip:string|null;peerIp:string|null;requestId:string|null;jobId:string|null;entityId:string|null;sourceId:string|null;release:string;environment:string;status:number|null;durationMs:number|null;at:string;metadata:Record<string,unknown>};
type Result={items:Log[];total:number;page:number;pageSize:number};
type AiFailure={state:'available'|'expired'|'restricted'|'unavailable';prompt?:string;options?:Record<string,unknown>;stage?:string;provider?:string;providerCode?:string;providerRequestId?:string;providerStatus?:number;errorCode?:string;expiresAt?:string};
type Detail={aiAttempt?:Attempt|null;aiFailure?:AiFailure|null;event:Log;timeline:Log[];hasMore:boolean;delivery:{attempts:number;delivered_at:string|null;available_at:string;last_error_code:string|null}|null};
const categories:Record<string,string>={request:'요청',error:'오류',auth:'인증·권한',admin:'관리자',finance:'결제·출금',mail:'메일',security:'보안',business:'서비스 활동',worker:'배치',client:'브라우저'};
const levels:Record<string,string>={info:'정보',warning:'주의',error:'오류'};
const date=(s:string)=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const initial=()=>({from:today(),to:today(),category:'',level:'',ip:'',requestId:'',actorId:'',entityId:'',jobId:'',action:'',aiAttempts:''});
export function Logs(){
 const [draft,setDraft]=useState(initial),[filters,setFilters]=useState(initial),[page,setPage]=useState(1),[selected,setSelected]=useState<string|null>(null);
 const query=new URLSearchParams(Object.entries(filters).filter(([,v])=>v));query.set('page',String(page));const state=useData<Result>('/admin/logs?'+query);
 function change(key:keyof ReturnType<typeof initial>,value:string){setDraft(v=>({...v,[key]:value,...(key==='action'?{aiAttempts:''}:{})}));}
 return <section>
 <p className="notice">한국 시간 기준 · 최대 366일 · 비밀값은 기록하지 않습니다. 실패한 AI 질문은 별도 암호화하여 30일 보관합니다. 동일 요청·대상·배치 기록은 상세에서 확인할 수 있습니다.</p>
 <form className="filters log-filters" onSubmit={e=>{e.preventDefault();setFilters(draft);setPage(1);setSelected(null);}}>
  <label>시작일<input type="date" value={draft.from} onChange={e=>change('from',e.target.value)} required/></label><label>종료일<input type="date" value={draft.to} onChange={e=>change('to',e.target.value)} required/></label>
  <label>분류<select value={draft.category} onChange={e=>change('category',e.target.value)}><option value="">전체 분류</option>{Object.entries(categories).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
  <label>수준<select value={draft.level} onChange={e=>change('level',e.target.value)}><option value="">전체 수준</option>{Object.entries(levels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
  {([['ip','접속 IP'],['requestId','요청 ID'],['actorId','행위자 ID'],['entityId','대상 ID'],['jobId','배치 실행 ID'],['action','이벤트명']] as const).map(([key,label])=><label key={key}>{label}<input value={draft[key]} maxLength={191} onChange={e=>change(key,e.target.value)} placeholder="정확히 일치"/></label>)}
  <button disabled={!draft.from||!draft.to||draft.from>draft.to}>조회</button><button type="button" onClick={()=>{const next=initial();setDraft(next);setFilters(next);setPage(1);setSelected(null);}}>초기화</button><button type="button" onClick={state.reload}>새로고침</button><button type="button" onClick={()=>{const next={...initial(),aiAttempts:"true"};setDraft(next);setFilters(next);setPage(1);setSelected(null);}}>AI 생성 이력</button><button type="button" onClick={()=>{const next={...initial(),action:"ai-photo.failed"};setDraft(next);setFilters(next);setPage(1);setSelected(null);}}>AI 생성 실패</button>
 </form>
 <State {...state}/>
 {state.data&&<>{state.data.items.length?<div className="table-wrap"><table className="log-table"><thead><tr>{['시각','분류','수준','이벤트','AI 모델·상태','접속 IP','상태','소요','상세'].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{state.data.items.map(row=><tr key={row.id}><td>{date(row.at)}</td><td>{categories[row.category]||row.category}</td><td><span className={'log-level '+row.level}>{levels[row.level]||row.level}</span></td><td><code>{row.action}</code></td><td>{row.aiAttempt?<>{attemptStatus[row.aiAttempt.status]}<br/>{row.aiAttempt.selectedModel||"모델 미선택"}</>:"—"}</td><td>{row.ip||'시스템'}</td><td>{row.status??'—'}</td><td>{row.durationMs===null?'—':row.durationMs+'ms'}</td><td><button onClick={e=>{e.currentTarget.focus({preventScroll:true});setSelected(row.id);}} aria-label={`${row.action} 상세`}>상세</button></td></tr>)}</tbody></table></div>:<EmptyState>조건에 맞는 로그가 없습니다.</EmptyState>}
 <div className="pager"><span>총 {state.data.total.toLocaleString()}건</span><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(state.data.total/state.data.pageSize))}</span><button disabled={page*state.data.pageSize>=state.data.total} onClick={()=>setPage(v=>v+1)}>다음</button></div></>}
 {selected&&<LogDetail id={selected} onClose={()=>setSelected(null)} onSelect={setSelected}/>}
 </section>;
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
 {state.data?.aiAttempt&&<AiAttemptContent attempt={state.data.aiAttempt}/>}
 {state.data?.aiFailure&&<AiFailureContent failure={state.data.aiFailure}/>}
 <dl className="log-properties">{[['시각',date(row.at)],['이벤트',row.action],['수준',levels[row.level]],['환경',row.environment],['배포 버전',row.release],['접속 IP',row.ip],['연결 IP',row.peerIp],['행위자 ID',row.actorId],['행위자 역할',row.actorRole],['요청 ID',row.requestId],['배치 실행 ID',row.jobId],['대상 ID',row.entityId],['로그 ID',row.id]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'없음'}</dd></div>)}</dl>
 <h3>기록 내용</h3><pre className="log-json">{JSON.stringify(row.metadata,null,2)}</pre>
 {state.data?.delivery&&<p className="notice">텔레그램: {state.data.delivery.delivered_at?'접수 확인 '+date(state.data.delivery.delivered_at):'발송 대기'} · 시도 {state.data.delivery.attempts}회{state.data.delivery.last_error_code?' · '+state.data.delivery.last_error_code:''}</p>}
 <h3>관련 기록 타임라인</h3><p className="muted">같은 요청 ID, 대상 ID 또는 배치 실행 ID의 최근 100건입니다.</p><ol className="log-timeline">{state.data?.timeline.map(item=><li key={item.id}><time>{date(item.at)}</time><button onClick={()=>onSelect(item.id)} aria-current={item.id===id?'true':undefined}>{item.action}</button><span>{levels[item.level]} {item.status||''}</span></li>)}</ol>{state.data?.hasMore&&<p className="notice">이전 기록은 대상 ID나 배치 실행 ID와 기간을 지정해 검색해주세요.</p>}
 </>}</div>;
}

function AiFailureContent({failure:f}:{failure:AiFailure}){
 const reasons:Record<string,string>={PROVIDER_ERROR:'이미지 제공사가 요청을 처리하지 못함',PROVIDER_CONNECTION_ERROR:'이미지 제공사 연결 실패',PROVIDER_TIMEOUT:'이미지 생성 응답 시간 초과',MODERATION_UNAVAILABLE:'안전검사 응답을 받지 못함',UNSAFE_INPUT:'입력 사진 또는 요청이 안전검사에서 거절됨',UNSAFE_OUTPUT:'생성 결과가 콘텐츠 정책에서 거절됨',DAILY_LIMIT:'오늘 사용 가능한 횟수 소진',INTERNAL_ERROR:'서버 내부 오류'};
 const stages:Record<string,string>={validation:'요청 검증',source:'원본·참조 사진 처리',quota:'사용 횟수 확인',input:'입력 안전검사',generation:'이미지 생성',provider:'이미지 제공사',output:'결과 안전검사',storage:'결과 저장'};
 return <section aria-label="AI 생성 실패 상세"><h3>AI 생성 실패</h3>{f.state==='available'?<><dl className="log-properties">{[['실패 원인',reasons[f.errorCode||'']||f.errorCode],['실패 단계',stages[f.stage||'']||f.stage],['처리 제공사',f.provider],['실패 원인 코드',f.errorCode],['제공사 오류 코드',f.providerCode],['제공사 요청 ID',f.providerRequestId],['제공사 HTTP 상태',f.providerStatus],['질문 보관 만료',f.expiresAt?date(f.expiresAt):null]].map(([k,v])=><div key={String(k)}><dt>{k}</dt><dd>{v??'없음'}</dd></div>)}</dl><h4>질문 내용</h4><pre className="log-json" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{f.prompt||'입력된 질문 없음'}</pre><h4>선택 옵션</h4><pre className="log-json">{JSON.stringify(f.options,null,2)}</pre><p className="muted">질문은 30일간 보관하며 명백한 연락처·인증키는 숨깁니다. 조회 이력이 기록됩니다.</p></>:<p className="notice">{f.state==='restricted'?'질문 내용을 보려면 회원 조회 권한도 필요합니다.':f.state==='expired'?'질문 보관 기간이 지났거나 상세 기록이 없습니다.':'질문 내용을 불러오지 못했습니다.'}</p>}</section>;
}

const attemptStatus={succeeded:'성공',failed:'실패',in_progress:'처리 중',unknown:'완료 기록 없음'};
function AiAttemptContent({attempt:a}:{attempt:Attempt}){
 const stages:Record<string,string>={validation:'요청 검증',source:'원본·참조 사진 처리',quota:'사용 횟수 확인',input:'입력 안전검사',generation:'이미지 생성',output:'결과 안전검사',storage:'결과 저장'};
 const events=a.events||[],steps=events.filter(e=>e.action==='ai-photo.step.started').sort((x,y)=>Number(x.metadata.attempt)-Number(y.metadata.attempt));
 return <section aria-label="AI 생성 시도 추적"><h3>AI 생성 시도 추적 · {attemptStatus[a.status]}</h3><dl className="log-properties"><div><dt>선택된 생성 모델</dt><dd>{a.selectedProvider||'미선택'} · {a.selectedModel||'미선택'}</dd></div><div><dt>실제 호출 시도 모델</dt><dd>{a.attemptedModels.length?a.attemptedModels.join(', '):'모델 호출 전 종료 또는 대기'}</dd></div><div><dt>마지막 진행 단계</dt><dd>{stages[a.currentStage]||a.currentStage}</dd></div><div><dt>전체 소요 시간</dt><dd>{a.durationMs===null?'미완료':(a.durationMs/1000).toFixed(2)+'초'}</dd></div></dl>{a.status==='unknown'&&<p className="notice">시작 후 10분이 지났으나 완료 기록이 없습니다. 성공이나 실패로 확정할 수 없습니다.</p>}<ol className="log-timeline ai-attempt-timeline">{steps.map(step=>{const end=events.find(e=>e.metadata.attemptId===step.metadata.attemptId&&e.action!=='ai-photo.step.started'),m=step.metadata,r=end?.metadata;return <li key={step.id}><strong>{String(m.attempt)}. {stages[String(m.operation)]||String(m.operation)}{m.source?" · "+String(m.source):""}</strong><span>{String(m.provider)} · 요청 모델: {String(m.model||'모델 호출 없음')}</span><span>결과: {end?(r?.outcome==='blocked'?'정책 거절':end.action.endsWith('succeeded')?'성공':'실패'):'완료 기록 없음'} · {end?.durationMs==null?'—':(end.durationMs/1000).toFixed(2)+'초'}</span>{!!m.model&&<span>응답 모델: {String(r?.responseModel||'제공사 미제공')}</span>}<span>제공사 요청 ID: {String(r?.providerRequestId||'미수신')}</span>{r?.httpStatus!=null&&<span>HTTP {String(r.httpStatus)}</span>}{!!(r?.providerCode||r?.errorCode)&&<span>오류: {String(r.providerCode||r.errorCode)}</span>}{!!r?.targetId&&<span>결과 사진 ID: {String(r.targetId)}</span>}</li>;})}</ol><p className="muted">각 호출을 별도로 기록합니다. 응답 모델이 없는 경우 요청 모델로 대신 확정하지 않습니다.</p></section>;
}
