'use client';
import {EmptyState} from './EmptyState';
import {Fragment,useId,useState} from 'react';
import {Snackbar} from './Snackbar';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {ConfirmDialog,TypedConfirmDialog,DialogActions} from './TypedConfirm';
import {InfoTip} from './InfoTip';
import {dayIso,endDay,endIso,kstDay} from '@/lib/terms-window';

// Server signup-invites.ts: null keeps the platform default; fee values are basis points.
// 2026-11-17 (signed contract Schedule A, 8(3)): a separate 콩 minimum and an optional special-term window (KST dates, server ISO).
export type Terms={platformFeeBps:number|null;settlementHoldDays:number|null;beanWithdrawalFeeBps:number|null;minimumWithdrawalKrw:number|null;minimumWithdrawalBeans:number|null;specialStartsAt?:string|null;specialEndsAt?:string|null};
type Invite={id:string;email:string;memo:string;terms:Terms;status:'active'|'used'|'revoked';memberId:string|null;usedAt:string|null;version:number;createdAt:string};
type NumKey=Exclude<keyof Terms,'specialStartsAt'|'specialEndsAt'>;
type Form={fee:string;hold:string;beanFee:string;min:string;minBeans:string;startsAt:string;endsAt:string};
const POLICY_PHRASE='정책 변경';
const emptyTerms:Terms={platformFeeBps:null,settlementHoldDays:null,beanWithdrawalFeeBps:null,minimumWithdrawalKrw:null,minimumWithdrawalBeans:null,specialStartsAt:null,specialEndsAt:null};
const toForm=(t:Terms):Form=>({fee:t.platformFeeBps===null?'':String(t.platformFeeBps/100),hold:t.settlementHoldDays===null?'':String(t.settlementHoldDays),beanFee:t.beanWithdrawalFeeBps===null?'':String(t.beanWithdrawalFeeBps/100),min:t.minimumWithdrawalKrw===null?'':String(t.minimumWithdrawalKrw),minBeans:t.minimumWithdrawalBeans==null?'':String(t.minimumWithdrawalBeans),startsAt:kstDay(t.specialStartsAt),endsAt:endDay(t.specialEndsAt)});
const percent=(v:string)=>v===''?null:/^\d+(\.\d{1,2})?$/.test(v)&&Number(v)<=100?Math.round(Number(v)*100):NaN;
const whole=(v:string,max:number,step=1)=>v===''?null:/^\d+$/.test(v)&&Number(v)<=max&&Number(v)%step===0?Number(v):NaN;
function toTerms(f:Form):Terms|null{const t={platformFeeBps:percent(f.fee),settlementHoldDays:whole(f.hold,365),beanWithdrawalFeeBps:percent(f.beanFee),minimumWithdrawalKrw:whole(f.min,100000000,100),minimumWithdrawalBeans:whole(f.minBeans,1000000)},s=dayIso(f.startsAt),e=endIso(f.endsAt);
 if(Object.values(t).some(v=>Number.isNaN(v))||t.minimumWithdrawalKrw===0||t.minimumWithdrawalBeans===0||s==='invalid'||e==='invalid'||(s&&e&&f.endsAt<f.startsAt))return null;return{...t,specialStartsAt:s,specialEndsAt:e};}
const sameTerms=(a:Terms,b:Terms)=>(Object.keys(emptyTerms) as (keyof Terms)[]).every(k=>(a[k]??null)===(b[k]??null));
const won=(n:number)=>n.toLocaleString('ko-KR')+'원';
function termText(t:Terms,d?:Terms|null){const v=(k:NumKey,f:(n:number)=>string)=>t[k]===null?(d&&d[k]!==null?`기본 ${f(d[k]!)}`:d?'기본값(미설정)':'기본값'):f(t[k]!);return [['멤버십 판매 수수료',v('platformFeeBps',n=>n/100+'%')],['정산 보류',v('settlementHoldDays',n=>n+'일')],['콩 출금 수수료',v('beanWithdrawalFeeBps',n=>n/100+'%')],['최소 출금(멤버십)',v('minimumWithdrawalKrw',won)],['최소 출금(콩)',v('minimumWithdrawalBeans',n=>n.toLocaleString('ko-KR')+'콩')],['우대 기간',t.specialStartsAt||t.specialEndsAt?`${kstDay(t.specialStartsAt)||'즉시'} ~ ${endDay(t.specialEndsAt)||'종료일 없음'}`:'기간 없음']] as const;}
export function TermsSummary({terms,defaults}:{terms:Terms;defaults?:Terms|null}){return sameTerms(terms,emptyTerms)?<span className="muted">기본 조건</span>:<small>{termText(terms,defaults).map(([l,v])=>`${l} ${v}`).join(' · ')}</small>;}
// Label with an information tip beside it (outside <label>, so the tip button never takes the input's label).
function Field({label,tip,children}:{label:string;tip:string;children:(id:string)=>React.ReactNode}){const id=useId();return <div className="field"><div className="field-label"><label htmlFor={id}>{label}</label><InfoTip text={tip} label={`${label} 안내`} below/></div>{children(id)}</div>;}
// Exact rules from server signup-invites.ts / financial-policy.ts / bean-ledger.ts; `now` is the current platform value.
function termTips(d?:Terms|null){const now=(k:NumKey,f:(n:number)=>string)=>d&&d[k]!==null?`(현재 ${f(d[k]!)})`:'';return{
 fee:`팬이 이 크리에이터의 멤버십을 결제할 때 플랫폼이 가져가는 비율입니다. 결제 금액 × 비율(원 미만 버림)이 수수료이고 나머지가 크리에이터 수익입니다. 0~100%, 소수 둘째 자리까지 입력합니다. 비우면 운영 설정의 금융 정책 값${now('platformFeeBps',n=>n/100+'%')}을 따릅니다. 새로 시작하는 구독부터 적용되고, 정기결제 갱신은 처음 결제한 때의 조건을 유지합니다.`,
 hold:`멤버십 결제 후 수익이 출금 가능해지기까지 기다리는 일수입니다. 0~365일. 비우면 운영 설정의 금융 정책 값${now('settlementHoldDays',n=>n+'일')}을 따릅니다. 새로 시작하는 구독부터 적용됩니다. 콩 후원(후원 후 7일 보류)에는 적용되지 않습니다.`,
 beanFee:`후원받은 콩을 현금으로 출금할 때 떼는 비율입니다. 콩 1개 = 100원으로 계산한 금액 × 비율(원 미만 버림)을 뺀 금액이 지급됩니다. 0~100%, 소수 둘째 자리까지 입력합니다. 비우면 기본값${now('beanWithdrawalFeeBps',n=>n/100+'%')}을 따릅니다. 출금을 신청하는 시점의 값이 적용됩니다.`,
 min:`멤버십 수익을 한 번에 신청할 수 있는 최소 출금 금액(수수료 차감 전)입니다. 콩 출금 최소는 아래 칸에서 따로 정합니다(계약 별지 A). 100원 단위로 100원~1억 원까지 입력합니다. 비우면 기본값${now('minimumWithdrawalKrw',won)}을 따릅니다. 출금을 신청하는 시점의 값이 적용됩니다.`,
 minBeans:`후원받은 콩을 한 번에 출금 신청할 수 있는 최소 콩 수(수수료 차감 전)입니다. 1~1,000,000콩. 비우면 기본값${now('minimumWithdrawalBeans',n=>n.toLocaleString('ko-KR')+'콩')}을 따릅니다(계약 별지 A의 후원 최소 신청 금액).`,
 window:`이 크리에이터의 개별 조건이 적용되는 기간(한국 시간 0시 기준)입니다. 종료일 하루 끝까지 적용하고, 시작일 전과 종료일 다음 날부터는 기본 조건으로 돌아갑니다(계약 제8조③). 둘 다 비우면 기간 없이 계속 적용됩니다.`};}
function TermsFields({form,setForm,disabled,defaults,window=false}:{form:Form;setForm:(f:Form)=>void;disabled:boolean;defaults?:Terms|null;window?:boolean}){
 const hint=(k:NumKey,f:(n:number)=>string)=>defaults&&defaults[k]!==null?`비우면 기본 ${f(defaults[k]!)}`:'비우면 플랫폼 기본값',tips=termTips(defaults);
 return <fieldset className="editor"><legend>수수료·출금 조건</legend>
  {defaults&&<p className="muted">현재 시스템 기본값: {termText(emptyTerms,defaults).map(([l,v])=>`${l} ${v.replace(/^기본 /,'')}`).join(' · ')}</p>}
  <Field label="멤버십 판매 수수료율 (%)" tip={tips.fee}>{id=><input id={id} type="number" min="0" max="100" step="0.01" placeholder={hint('platformFeeBps',n=>n/100+'%')} disabled={disabled} value={form.fee} onChange={e=>setForm({...form,fee:e.target.value})}/>}</Field>
  <Field label="정산 보류 기간 (일)" tip={tips.hold}>{id=><input id={id} type="number" min="0" max="365" step="1" placeholder={hint('settlementHoldDays',n=>n+'일')} disabled={disabled} value={form.hold} onChange={e=>setForm({...form,hold:e.target.value})}/>}</Field>
  <Field label="콩 출금 수수료율 (%)" tip={tips.beanFee}>{id=><input id={id} type="number" min="0" max="100" step="0.01" placeholder={hint('beanWithdrawalFeeBps',n=>n/100+'%')} disabled={disabled} value={form.beanFee} onChange={e=>setForm({...form,beanFee:e.target.value})}/>}</Field>
  <Field label="최소 출금 금액 (원, 100원 단위)" tip={tips.min}>{id=><input id={id} type="number" min="100" max="100000000" step="100" placeholder={hint('minimumWithdrawalKrw',won)} disabled={disabled} value={form.min} onChange={e=>setForm({...form,min:e.target.value})}/>}</Field>
  <Field label="최소 출금 콩 (콩)" tip={tips.minBeans}>{id=><input id={id} type="number" min="1" max="1000000" step="1" placeholder={hint('minimumWithdrawalBeans',n=>n.toLocaleString('ko-KR')+'콩')} disabled={disabled} value={form.minBeans} onChange={e=>setForm({...form,minBeans:e.target.value})}/>}</Field>
  {window&&<Field label="우대 적용 기간 (시작일 ~ 종료일)" tip={tips.window}>{id=><div className="date-range"><input id={id} type="date" disabled={disabled} value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})} aria-label="우대 시작일"/><span aria-hidden="true">~</span><input type="date" disabled={disabled} value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value})} aria-label="우대 종료일"/></div>}</Field>}
  {disabled&&<p className="notice">수수료·출금 조건은 운영 설정 변경 권한이 있는 운영자만 바꿀 수 있습니다.</p>}
 </fieldset>;
}
function TermsChange({before,after,defaults}:{before:Terms;after:Terms;defaults?:Terms|null}){const a=termText(before,defaults),b=termText(after,defaults);return <><p>이후 새로 시작하는 구독 결제와 새 출금 신청부터 적용됩니다. 이미 결제된 내역과 진행 중인 정기결제 조건은 바뀌지 않습니다.</p><dl className="change-summary">{a.map(([label,value],i)=><Fragment key={label}><dt>{label}</dt><dd>{value} → <strong>{b[i][1]}</strong></dd></Fragment>)}</dl></>;}

export function Invites({canCreate,canUpdate,canDelete,canTerms}:{canCreate:boolean;canUpdate:boolean;canDelete:boolean;canTerms:boolean}){
 const [page,setPage]=useState(1),[status,setStatus]=useState('active'),[search,setSearch]=useState(''),[draft,setDraft]=useState('');
 const state=useData<{items:Invite[];total:number;defaults?:Terms}>(`/admin/invites?page=${page}&status=${status}&search=${encodeURIComponent(search)}`);
 const [edit,setEdit]=useState<{invite:Invite|null;email:string;memo:string;form:Form}|null>(null),[confirming,setConfirming]=useState(false),[remove,setRemove]=useState<Invite|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const terms=edit?toTerms(edit.form):null,before=edit?.invite?.terms||emptyTerms,termsChanged=!!terms&&!sameTerms(before,terms),termsEdited=!!edit&&JSON.stringify(edit.form)!==JSON.stringify(toForm(before));
 const valid=!!edit&&!!terms&&(!!edit.invite||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.email.trim()));
 function open(invite:Invite|null){setEdit({invite,email:invite?.email||'',memo:invite?.memo||'',form:toForm(invite?.terms||emptyTerms)});setError('');setConfirming(false);}
 async function save(confirmation?:string){if(!edit||!terms||busy)return;setBusy(true);setError('');try{const id=edit.invite?.id;await api('/admin/invites'+(id?'/'+id:''),{...(id?{expectedVersion:edit.invite!.version}:{email:edit.email.trim()}),memo:edit.memo,...terms,...(confirmation?{confirmation}:{})},id?'PUT':'POST');setEdit(null);setConfirming(false);setNotice('초대를 저장했습니다.');state.reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function submit(e:React.FormEvent){e.preventDefault();if(!valid)return;if(termsChanged){setError('');setConfirming(true);}else void save();}
 async function revoke(){if(!remove||busy)return;setBusy(true);setError('');try{await api('/admin/invites/'+remove.id,{expectedVersion:remove.version},'DELETE');setRemove(null);setNotice('초대를 취소했습니다.');state.reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const labels={active:'초대 중',used:'가입 완료',revoked:'취소됨'};
 return <section><p className="notice">베타 기간에는 초대된 이메일만 가입 인증 코드를 받을 수 있습니다. 개별 수수료·출금 조건은 가입하면 해당 회원에게 그대로 적용됩니다.</p>
  <form className="filters" onSubmit={e=>{e.preventDefault();setPage(1);setSearch(draft);}}><label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>검색<input placeholder="이메일, 메모" maxLength={191} value={draft} onChange={e=>setDraft(e.target.value)}/></label><button>검색</button>{canCreate&&<button type="button" className="primary toolbar-end" onClick={()=>open(null)}>초대 등록</button>}</form>
  <State {...state}/>{state.data&&<><div className="table-wrap"><table><thead><tr><th>이메일</th><th>메모</th><th>수수료·출금 조건</th><th>상태</th><th>관리</th></tr></thead><tbody>{state.data.items.map(i=><tr key={i.id}><td>{i.email}</td><td>{i.memo||'—'}</td><td><TermsSummary terms={i.terms} defaults={state.data!.defaults}/></td><td>{labels[i.status]}{i.status==='used'&&<small>회원·크리에이터 메뉴에서 조건 변경</small>}</td><td>{i.status==='active'&&<>{canUpdate&&<button onClick={()=>open(i)}>수정</button>}{canDelete&&<button onClick={()=>{setRemove(i);setError('');}}>초대 취소</button>}</>}</td></tr>)}</tbody></table>{!state.data.items.length&&<EmptyState>해당하는 초대가 없습니다.</EmptyState>}</div><div className="pager"><span>총 {state.data.total}건</span><button disabled={page<=1||busy} onClick={()=>setPage(n=>n-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(state.data.total/20))}</span><button disabled={page*20>=state.data.total||busy} onClick={()=>setPage(n=>n+1)}>다음</button></div></>}
  <Snackbar message={notice} onClose={()=>setNotice('')}/>
  {edit&&!confirming&&<ConfirmDialog title={edit.invite?'초대 수정':'초대 등록'} onCancel={()=>{if(!busy)setEdit(null);}}><form className="editor" onSubmit={submit}>
   <Field label="이메일" tip="초대할 사람이 가입할 때 쓸 이메일입니다. 베타 기간에는 초대 목록에 있는 이메일만 가입 인증 코드를 받을 수 있습니다. 대소문자는 구분하지 않습니다. 등록한 뒤에는 바꿀 수 없으니, 잘못 넣었다면 초대를 취소하고 다시 등록하세요. 이미 가입한 이메일은 초대할 수 없으며 회원·크리에이터 메뉴에서 조건을 설정합니다.">{id=><input id={id} type="email" required readOnly={!!edit.invite} maxLength={191} value={edit.email} onChange={e=>setEdit({...edit,email:e.target.value})}/>}</Field>
   <Field label="메모" tip="운영자만 보는 메모입니다(최대 100자). 회원에게는 보이지 않으며, 초대 목록에서 이메일과 함께 검색할 수 있습니다.">{id=><input id={id} maxLength={100} placeholder="예: 크리에이터 활동명, 협의 내용" value={edit.memo} onChange={e=>setEdit({...edit,memo:e.target.value})}/>}</Field>
   <TermsFields form={edit.form} setForm={form=>setEdit({...edit,form})} disabled={!canTerms} defaults={state.data?.defaults}/>
   {!terms&&<p className="error" role="alert">수수료율은 0~100%(소수 둘째 자리), 보류 기간은 0~365일, 최소 출금 금액은 100원 단위, 최소 출금 콩은 1콩 이상, 우대 종료일은 시작일 뒤로 입력해주세요.</p>}
   {error&&<p className="error" role="alert">{error}</p>}
   <DialogActions><button type="button" disabled={busy} onClick={()=>setEdit(null)}>취소</button><button className="primary" disabled={busy||!valid}>{termsEdited?'조건 확인':'저장'}</button></DialogActions>
  </form></ConfirmDialog>}
  {edit&&confirming&&terms&&<TypedConfirmDialog title="개별 수수료·출금 조건 확인" phrase={POLICY_PHRASE} actionLabel="저장" busyLabel="저장 중…" busy={busy} error={error} onCancel={()=>setConfirming(false)} onConfirm={typed=>void save(typed)}><p><strong>{edit.email}</strong></p><TermsChange before={before} after={terms} defaults={state.data?.defaults}/></TypedConfirmDialog>}
  {remove&&<ConfirmDialog title="초대 취소" onCancel={()=>{if(!busy)setRemove(null);}}><p>{remove.email} 초대를 취소할까요? 이 이메일은 가입 인증 코드를 받을 수 없게 됩니다. 같은 이메일로 다시 초대할 수 있습니다.</p>{error&&<p className="error" role="alert">{error}</p>}<DialogActions><button disabled={busy} onClick={()=>setRemove(null)}>닫기</button><button className="primary" disabled={busy} onClick={()=>void revoke()}>초대 취소</button></DialogActions></ConfirmDialog>}
 </section>;
}

type Change={version:number;terms:Terms;source:'admin'|'invite'|'backfill';changedBy:string|null;changedByName:string|null;reason:string;createdAt:string};
const sources={admin:'운영자 변경',invite:'초대 조건 적용',backfill:'이력 기능 이전 설정'};
const at=(v:string)=>new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
// Server keeps every saved version (creator_financial_term_changes); newest first.
function TermsHistory({history,defaults}:{history:Change[];defaults:Terms}){return <section className="terms-history"><h3>변경 이력</h3>{history.length?<div className="table-wrap"><table><thead><tr><th>일시</th><th>조건</th><th>변경자·출처</th><th>사유</th></tr></thead><tbody>{history.map(h=><tr key={h.version}><td>{at(h.createdAt)}<small>버전 {h.version}</small></td><td><TermsSummary terms={h.terms} defaults={defaults}/></td><td>{h.changedByName||h.changedBy||'—'}<small>{sources[h.source]}</small></td><td>{h.reason||'—'}</td></tr>)}</tbody></table></div>:<EmptyState>아직 개별 조건 변경 이력이 없습니다.</EmptyState>}</section>;}
// Members table cell: a creator's own terms, edited with the same typed confirmation as the platform policy.
export function MemberTerms({memberId,name,canEdit}:{memberId:string;name:string;canEdit:boolean}){
 const [open,setOpen]=useState(false),state=useData<{terms:Terms;version:number;defaults:Terms;history:Change[]}>(open?`/admin/members/${encodeURIComponent(memberId)}/terms`:null),[form,setForm]=useState<Form|null>(null),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[reason,setReason]=useState('');
 const current=state.data?.terms,f=form||(current?toForm(current):null),terms=f?toTerms(f):null,changed=!!terms&&!!current&&!sameTerms(current,terms);
 function close(){if(busy)return;setOpen(false);setForm(null);setConfirming(false);setError('');setReason('');}
 async function save(confirmation:string){if(!terms||!state.data)return;setBusy(true);setError('');try{await api(`/admin/members/${encodeURIComponent(memberId)}/terms`,{...terms,expectedVersion:state.data.version,confirmation,reason},'PUT');setConfirming(false);setOpen(false);setForm(null);setReason('');setNotice('수수료·출금 조건을 저장했습니다.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><button type="button" onClick={()=>{setOpen(true);setError('');}}>조건 보기</button><Snackbar message={notice} onClose={()=>setNotice('')}/>
  {open&&!confirming&&<ConfirmDialog title={`${name} 수수료·출금 조건`} onCancel={close}><State {...state}/>{state.data&&f&&<form className="editor" onSubmit={e=>{e.preventDefault();if(changed&&reason.trim()){setError('');setConfirming(true);}}}>
   <p className="muted">현재: <TermsSummary terms={state.data.terms} defaults={state.data.defaults}/></p>
   <TermsFields form={f} setForm={setForm} disabled={!canEdit} defaults={state.data.defaults} window/>
   {!terms&&<p className="error" role="alert">수수료율은 0~100%(소수 둘째 자리), 보류 기간은 0~365일, 최소 출금 금액은 100원 단위, 최소 출금 콩은 1콩 이상, 우대 종료일은 시작일 뒤로 입력해주세요.</p>}
   {canEdit&&<label>변경 사유<textarea required maxLength={500} placeholder="예: 2026-10 개별 계약 체결" value={reason} onChange={e=>setReason(e.target.value)}/></label>}
   {error&&<p className="error" role="alert">{error}</p>}
   <DialogActions><button type="button" onClick={close}>닫기</button>{canEdit&&<button className="primary" disabled={!changed||!reason.trim()}>조건 확인</button>}</DialogActions>
   <TermsHistory history={state.data.history} defaults={state.data.defaults}/>
  </form>}</ConfirmDialog>}
  {open&&confirming&&terms&&current&&<TypedConfirmDialog title="개별 수수료·출금 조건 변경" phrase={POLICY_PHRASE} actionLabel="저장" busyLabel="저장 중…" busy={busy} error={error} onCancel={()=>setConfirming(false)} onConfirm={typed=>void save(typed)}><p><strong>{name}</strong></p><TermsChange before={current} after={terms} defaults={state.data?.defaults}/><p>변경 사유: {reason}</p></TypedConfirmDialog>}
 </>;
}
