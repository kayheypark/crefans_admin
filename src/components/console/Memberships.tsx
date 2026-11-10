'use client';
import {useState} from 'react';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
import {ConfirmDialog,TypedConfirmDialog,DialogActions} from './TypedConfirm';
import {useSnackbar} from './Snackbar';
import {api,ApiError} from '@/lib/console-api';

// 2026-11-06 user request: read-only view of every membership plan and subscription (server admin-memberships.ts, revenue.view).
type Creator={id:string;name:string|null;handle:string|null;active:boolean}|null;
type Plan={id:string;name:string;level:number;price:number;billingUnit:string;billingPeriod:number;trialUnit:string;trialPeriod:number;active:boolean;deleted:boolean;createdAt:string;creator:Creator;subscriptions:{current:number;autoRenew:number;cancelled:number;expired:number}};
type Subscription={id:string;status:'ONGOING'|'CANCELLED'|'EXPIRED';amount:number;startedAt:string;endedAt:string|null;nextBillingDate:string|null;paymentFailureCount:number;cancelReason:string|null;cancelledBy:string|null;refundable:{orderId:string;amount:number;paidAt:string|null}|null;subscriber:{id:string;nickname:string|null;withdrawn:boolean};membership:{id:string;name:string;level:number};creator:Creator};
type PlanList={items:Plan[];total:number;page:number;pageSize:number};
type SubscriptionList={items:Subscription[];summary:{current:number;ONGOING:number;CANCELLED:number;EXPIRED:number};total:number;page:number;pageSize:number};
const units:Record<string,string>={DAY:'일',WEEK:'주',MONTH:'개월',YEAR:'년'};
const statusNames:Record<string,string>={ONGOING:'자동 갱신',CANCELLED:'해지 예약',EXPIRED:'만료'};
// Only a subscription whose paid period is still running can be ended early; the server checks the same thing.
const live=(s:Subscription)=>s.status!=='EXPIRED'&&!!s.endedAt&&new Date(s.endedAt)>new Date();
const won=(v:number)=>new Intl.NumberFormat('ko-KR').format(v)+'원';
const day=(v:string|null)=>v?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v)):'-';
const creator=(c:Creator)=>c?<span>{c.name||'이름 없음'}{!c.active&&<small className="muted"> (비활성)</small>}<br/><small className="muted">{c.handle?'@'+c.handle:c.id}</small></span>:'-';
function Pager({page,total,size,onChange}:{page:number;total:number;size:number;onChange:(page:number)=>void}){return <div className="pager"><span>총 {total.toLocaleString('ko-KR')}건</span><button disabled={page<=1} onClick={()=>onChange(page-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(total/size))}</span><button disabled={page*size>=total} onClick={()=>onChange(page+1)}>다음</button></div>;}
function Search({initial,onSubmit,placeholder}:{initial:string;onSubmit:(value:string)=>void;placeholder:string}){const [draft,setDraft]=useState(initial);return <><label>검색<input type="search" maxLength={100} placeholder={placeholder} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onSubmit(draft.trim());}}}/></label><button type="button" onClick={()=>onSubmit(draft.trim())}>검색</button></>;}

export function Memberships({superAdmin}:{superAdmin:boolean}){const [tab,setTab]=useState<'plans'|'subscriptions'>('plans'),[plan,setPlan]=useState<{id:string;name:string}|null>(null);
 return <section className="memberships"><p className="notice">상품 수정은 이 화면에서 하지 않습니다. 구독 현황에서 최고 관리자만 결제 전액 환불 후 종료와 즉시 해지(환불 없음)를 할 수 있습니다. 테스트 결제로 만든 구독도 함께 보입니다.</p>
  <div className="tabs">{([['plans','멤버십 상품'],['subscriptions','구독 현황']] as const).map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>{setTab(key);if(key==='plans')setPlan(null);}}>{label}</button>)}</div>
  {tab==='plans'?<Plans onSubscribers={p=>{setPlan(p);setTab('subscriptions');}}/>:<Subscriptions plan={plan} onClearPlan={()=>setPlan(null)} superAdmin={superAdmin}/>}
 </section>;}

function Plans({onSubscribers}:{onSubscribers:(plan:{id:string;name:string})=>void}){const [page,setPage]=useState(1),[state,setState]=useState(''),[search,setSearch]=useState('');
 const data=useData<PlanList>(`/admin/memberships?page=${page}${state?'&state='+state:''}${search?'&search='+encodeURIComponent(search):''}`);
 return <><p className="muted section-desc">이용 중은 이용기간이 남은 구독(자동 갱신과 해지 예약) 수입니다. 자동 갱신·해지 예약·만료는 저장된 상태별 누적 건수입니다.</p><form className="filters" onSubmit={e=>e.preventDefault()}><label>상태<select value={state} onChange={e=>{setState(e.target.value);setPage(1);}}><option value="">삭제 제외 전체</option><option value="active">판매 중</option><option value="inactive">판매 중지</option><option value="deleted">삭제됨</option></select></label><Search initial={search} placeholder="상품명·크리에이터·핸들" onSubmit={v=>{setSearch(v);setPage(1);}}/></form>
  <State {...data}/>{data.data&&<TableContent count={data.data.items.length} pending={data.loading||!!data.error} emptyMessage="조건에 맞는 멤버십 상품이 없습니다."><div className="table-wrap"><table aria-label="멤버십 상품"><thead><tr><th>상품</th><th>크리에이터</th><th className="number">가격</th><th>결제 주기</th><th>무료 체험</th><th>상태</th><th className="number">이용 중</th><th className="number">자동 갱신</th><th className="number">해지 예약</th><th className="number">만료</th><th>등록일</th><th>구독자</th></tr></thead><tbody>{data.data.items.map(p=><tr key={p.id}><td>{p.name}<br/><small className="muted">Lv.{p.level}</small></td><td>{creator(p.creator)}</td><td className="number">{won(p.price)}</td><td>{p.billingPeriod}{units[p.billingUnit]||p.billingUnit}마다</td><td>{p.trialPeriod?`${p.trialPeriod}${units[p.trialUnit]||p.trialUnit}`:'없음'}</td><td>{p.deleted?'삭제됨':p.active?'판매 중':'판매 중지'}</td><td className="number">{p.subscriptions.current.toLocaleString('ko-KR')}</td><td className="number">{p.subscriptions.autoRenew.toLocaleString('ko-KR')}</td><td className="number">{p.subscriptions.cancelled.toLocaleString('ko-KR')}</td><td className="number">{p.subscriptions.expired.toLocaleString('ko-KR')}</td><td>{day(p.createdAt)}</td><td><button type="button" onClick={()=>onSubscribers({id:p.id,name:p.name})}>구독자 보기</button></td></tr>)}</tbody></table></div></TableContent>}
  {data.data&&<Pager page={page} total={data.data.total} size={data.data.pageSize} onChange={setPage}/>}</>;}

function Subscriptions({plan,onClearPlan,superAdmin}:{plan:{id:string;name:string}|null;onClearPlan:()=>void;superAdmin:boolean}){const [page,setPage]=useState(1),[status,setStatus]=useState(''),[search,setSearch]=useState(''),[target,setTarget]=useState<Subscription|null>(null),[refundTarget,setRefundTarget]=useState<Subscription|null>(null);
 const data=useData<SubscriptionList>(`/admin/subscriptions?page=${page}${status?'&status='+status:''}${plan?'&membershipId='+encodeURIComponent(plan.id):''}${search?'&search='+encodeURIComponent(search):''}`),sum=data.data?.summary;
 return <><form className="filters" onSubmit={e=>e.preventDefault()}><label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">전체</option>{Object.entries(statusNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><Search initial={search} placeholder="구독자 ID·활동명·크리에이터" onSubmit={v=>{setSearch(v);setPage(1);}}/>{plan&&<span className="muted">상품: {plan.name} <button type="button" onClick={()=>{onClearPlan();setPage(1);}}>상품 조건 해제</button></span>}</form>
  {sum&&<div className="metrics"><article><span>이용 중</span><strong>{sum.current.toLocaleString('ko-KR')}<small>건</small></strong></article>{Object.entries(statusNames).map(([key,label])=><article key={key}><span>{label}</span><strong>{(sum[key as keyof typeof sum]||0).toLocaleString('ko-KR')}<small>건</small></strong></article>)}</div>}
  <p className="muted">자동 갱신은 다음 결제일에 청구됩니다. 해지 예약은 이용 종료일까지 이용 후 만료됩니다. 이용 중은 이용 종료일이 지나지 않은 자동 갱신·해지 예약 구독입니다.</p>
  <State {...data}/>{data.data&&<TableContent count={data.data.items.length} pending={data.loading||!!data.error} emptyMessage="조건에 맞는 구독이 없습니다."><div className="table-wrap"><table aria-label="구독 현황"><thead><tr><th>구독자</th><th>상품</th><th>크리에이터</th><th>상태</th><th className="number">금액</th><th>시작일</th><th>이용 종료일</th><th>다음 결제일</th><th className="number">결제 실패</th><th>해지 사유</th>{superAdmin&&<th>관리</th>}</tr></thead><tbody>{data.data.items.map(s=><tr key={s.id}><td>{s.subscriber.nickname||'탈퇴한 회원'}{s.subscriber.withdrawn&&s.subscriber.nickname&&<small className="muted"> (탈퇴)</small>}<br/><small className="muted">{s.subscriber.id}</small></td><td>{s.membership.name}<br/><small className="muted">Lv.{s.membership.level}</small></td><td>{creator(s.creator)}</td><td>{statusNames[s.status]||s.status}</td><td className="number">{won(s.amount)}</td><td>{day(s.startedAt)}</td><td>{day(s.endedAt)}</td><td>{s.status==='ONGOING'?day(s.nextBillingDate):'-'}</td><td className="number">{s.paymentFailureCount?s.paymentFailureCount+'회':'-'}</td><td>{s.cancelReason||'-'}</td>{superAdmin&&<td>{live(s)||s.refundable?<div className="actions">{s.refundable&&<button type="button" className="danger" onClick={()=>setRefundTarget(s)}>환불 후 종료</button>}{live(s)&&<button type="button" className="danger" onClick={()=>setTarget(s)}>즉시 해지</button>}</div>:<span className="muted">—</span>}</td>}</tr>)}</tbody></table></div></TableContent>}
  {data.data&&<Pager page={page} total={data.data.total} size={data.data.pageSize} onChange={setPage}/>}
  {target&&<CancelNow subscription={target} onClose={()=>setTarget(null)} onDone={()=>{setTarget(null);data.reload();}}/>}
  {refundTarget?.refundable&&<RefundNow subscription={refundTarget} refundable={refundTarget.refundable} onClose={()=>setRefundTarget(null)} onDone={()=>{setRefundTarget(null);data.reload();}}/>}</>;}

// 2026-11-06 user decision: ends the paid period right now with no refund and no call to the payment provider.
// SUPER_ADMIN only on the server as well; the reason is required and stored on the subscription.
function CancelNow({subscription,onClose,onDone}:{subscription:Subscription;onClose:()=>void;onDone:()=>void}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),snackbar=useSnackbar(),trimmed=reason.trim();
 const submit=async()=>{
  if(!trimmed||busy)return;
  setBusy(true);setError('');
  try{await api(`/admin/subscriptions/${encodeURIComponent(subscription.id)}/cancel-now`,{reason:trimmed});snackbar('구독을 즉시 해지했습니다.');onDone();}
  catch(e){setError(e instanceof ApiError?e.message:'즉시 해지에 실패했습니다.');}
  finally{setBusy(false);}
 };
 return <ConfirmDialog title="구독 즉시 해지" onCancel={()=>{if(!busy)onClose();}}>
  <p>{subscription.subscriber.nickname||subscription.subscriber.id} 님의 <strong>{subscription.membership.name}</strong> 구독을 지금 끝냅니다.</p>
  <ul className="muted"><li>남은 이용 기간({day(subscription.endedAt)}까지)이 사라지고 유료 콘텐츠 접근이 즉시 막힙니다.</li><li>환불·결제 취소는 하지 않습니다. 환불이 필요하면 [환불 후 종료] 버튼을 쓰세요.</li><li>되돌릴 수 없습니다. 다시 이용하려면 회원이 멤버십에 새로 가입해야 합니다.</li></ul>
  <label><span>해지 사유 (필수)</span><textarea value={reason} maxLength={500} rows={3} onChange={e=>setReason(e.target.value)} placeholder="예: 토스 심사용 계정 정리"/></label>
  {error&&<p role="alert" className="error">{error}</p>}
  <DialogActions><button type="button" autoFocus onClick={onClose} disabled={busy}>취소</button><button type="button" className="danger" disabled={busy||!trimmed} onClick={()=>void submit()}>{busy?'해지 중…':'즉시 해지'}</button></DialogActions>
 </ConfirmDialog>;
}

// 2026-11-06 user decision: SUPER_ADMIN full refund of the latest paid order, which also ends the subscription now.
// The server picks the order, calls the payment provider's cancel and tells the member (app + mail) and the creator.
// Typing the amount is required so a refund is never sent by a stray click; the server checks the same text.
function RefundNow({subscription,refundable,onClose,onDone}:{subscription:Subscription;refundable:{amount:number;paidAt:string|null};onClose:()=>void;onDone:()=>void}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),snackbar=useSnackbar(),trimmed=reason.trim();
 const submit=async(confirmation:string)=>{
  if(!trimmed||busy)return;
  setBusy(true);setError('');
  try{await api(`/admin/subscriptions/${encodeURIComponent(subscription.id)}/refund`,{reason:trimmed,confirmation});snackbar('전액 환불하고 구독을 종료했습니다.');onDone();}
  catch(e){setError(e instanceof ApiError?e.message:'환불에 실패했습니다. 결제 내역에서 결과를 확인한 뒤 다시 시도하세요.');}
  finally{setBusy(false);}
 };
 return <TypedConfirmDialog title="결제 전액 환불 후 구독 종료" phrase={won(refundable.amount)} actionLabel="환불 후 종료" busyLabel="환불 중…" busy={busy} confirmDisabled={!trimmed} error={error} onCancel={onClose} onConfirm={typed=>void submit(typed)}>
  <p>{subscription.subscriber.nickname||subscription.subscriber.id} 님의 <strong>{subscription.membership.name}</strong> 최근 결제({day(refundable.paidAt)}) <strong>{won(refundable.amount)}</strong>을 전액 환불합니다.</p>
  <ul className="muted"><li>결제사에 결제 취소를 요청합니다. 부분 환불은 할 수 없습니다.</li><li>구독은 지금 종료되고 유료 콘텐츠 접근이 즉시 막힙니다.</li><li>회원에게 알림과 메일, 크리에이터에게 정산 알림이 갑니다. 해당 수익은 정산에서 빠지고, 이미 출금됐다면 미수금으로 잡힙니다.</li><li>되돌릴 수 없습니다.</li></ul>
  <label><span>환불 사유 (필수, 회원에게는 보이지 않음)</span><textarea value={reason} maxLength={500} rows={3} onChange={e=>setReason(e.target.value)} placeholder="예: 고객센터 청약철회 요청 (문의 번호)"/></label>
 </TypedConfirmDialog>;
}
