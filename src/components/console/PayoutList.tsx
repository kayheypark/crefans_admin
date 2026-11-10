'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {EmptyState} from './EmptyState';
import {useSnackbar} from './Snackbar';
import {withParticle} from '@/lib/korean';

// Weekly payout worklist for manual bank transfers (2026-11-10). Amounts come from the server: membership withdrawals are
// already net of the platform fee and bean payouts use their net. The full account number is fetched per account on demand
// (audited on the server), kept only in this component's memory and hidden again after a short time.
type Account={id:string;bank?:string;holder?:string;lastFour?:string;verified?:boolean;hasNumber?:boolean;changed?:boolean;missing?:boolean};
type Item={id:string;kind:'membership'|'bean';creatorId:string;creatorName:string;handle:string|null;amount:number;status:string;note:string|null;test:boolean;createdAt:string;account:Account};
type Group={creatorId:string;creatorName:string;handle:string|null;count:number;amount:number};
type Due={items:Item[];creators:Group[];totals:{count:number;amount:number;creators:number;testCount:number};beans:boolean;truncated:boolean};
const won=(n:number)=>`${n.toLocaleString('ko-KR')}원`;
const day=(v:string)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit'}).format(new Date(v));
const states:Record<string,string>={requested:'접수',processing:'이체 대기'};
const HIDE_AFTER_MS=120000;
const who=(i:{creatorName:string;handle:string|null;creatorId:string})=><>{i.creatorName||i.creatorId}{i.handle&&<small className="muted"> @{i.handle}</small>}</>;

export function PayoutList({canReveal}:{canReveal:boolean}){
 const due=useData<Due>('/admin/payouts/due'),snackbar=useSnackbar(),[numbers,setNumbers]=useState<Record<string,string>>({}),[busy,setBusy]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!Object.keys(numbers).length)return;const t=setTimeout(()=>setNumbers({}),HIDE_AFTER_MS);return()=>clearTimeout(t);},[numbers]);
 async function reveal(a:Account){if(busy)return;setBusy(a.id);setError('');try{const r=await api<{accountNumber:string}>(`/admin/settlement-accounts/${a.id}/reveal`,{});setNumbers(n=>({...n,[a.id]:r.accountNumber}));}catch(e){setError(e instanceof Error?e.message:'계좌번호를 불러오지 못했습니다.');}finally{setBusy('');}}
 async function copy(text:string,label:string){try{await navigator.clipboard.writeText(text);snackbar(`${withParticle(label,'을','를')} 복사했습니다.`);}catch{setError('복사하지 못했습니다. 직접 옮겨 적어 주세요.');}}
 const d=due.data;
 return <section className="payout-list"><h2>이번 주 지급 목록</h2>
  <p className="notice">크리에이터가 신청한 출금 중 아직 이체하지 않은 건입니다. 금액은 수수료를 뺀 <b>실제 이체할 금액</b>입니다. 계좌번호 보기는 이체할 때만 사용하세요. 볼 때마다 기록이 남고 2분 뒤 다시 가려집니다. 이체한 뒤에는 아래 &lsquo;이체할 멤버십 출금&rsquo;{d?.beans&&<>과 콩 화면</>}에서 이체 완료를 기록하세요.</p>
  {error&&<p role="alert" className="error">{error}</p>}
  <State {...due}/>
  {d&&<>
   <div className="payout-summary" aria-label="지급 합계"><div><span className="muted">이체할 총액</span><strong>{won(d.totals.amount)}</strong></div><div><span className="muted">크리에이터</span><strong>{d.totals.creators}명</strong></div><div><span className="muted">출금 건수</span><strong>{d.totals.count}건</strong></div></div>
   {d.totals.testCount>0&&<p className="muted">테스트 환경 콩 출금 {d.totals.testCount}건은 실제로 이체하지 않으므로 합계에서 뺐습니다.</p>}
   {d.truncated&&<p role="alert" className="error">건수가 많아 일부만 표시했습니다. 처리 후 새로고침해 나머지를 확인하세요.</p>}
   {d.creators.length?<><h3>크리에이터별 합계</h3><div className="table-wrap"><table><thead><tr><th>크리에이터</th><th>건수</th><th>이체할 금액</th></tr></thead><tbody>{d.creators.map(g=><tr key={g.creatorId}><td>{who(g)}</td><td>{g.count}건</td><td>{won(g.amount)}</td></tr>)}</tbody></table></div></>:null}
   <h3>출금별 상세</h3>
   {d.items.length?<div className="table-wrap"><table><thead><tr><th>크리에이터</th><th>종류</th><th>이체할 금액</th><th>입금 계좌</th><th>상태</th><th>신청일</th></tr></thead><tbody>{d.items.map(i=>{const a=i.account,n=numbers[a.id];return <tr key={i.kind+i.id} className={i.test?'muted':undefined}>
    <td>{who(i)}</td><td>{i.kind==='membership'?'멤버십':'콩'}{i.test&&<small> (테스트)</small>}</td><td>{won(i.amount)}</td>
    <td>{a.missing?<span className="error">계좌 정보 없음</span>:<>{a.bank} · {a.holder} · ****{a.lastFour}{!a.verified&&<small className="error"> 예금주 미확인</small>}{a.changed&&<small className="error"> 신청 후 계좌 변경됨</small>}
     {n?<div className="payout-number"><code>{n}</code> <button type="button" onClick={()=>copy(n,'계좌번호')}>번호 복사</button> <button type="button" onClick={()=>copy(String(i.amount),'금액')}>금액 복사</button></div>
      :canReveal&&a.hasNumber&&!i.test&&<div><button type="button" disabled={!!busy} onClick={()=>reveal(a)}>{busy===a.id?'불러오는 중':'계좌번호 보기'}</button></div>}</>}</td>
    <td>{states[i.status]||i.status}{i.note&&<small> {i.note}</small>}</td><td>{day(i.createdAt)}</td></tr>;})}</tbody></table></div>:<EmptyState>이체할 출금이 없습니다.</EmptyState>}
  </>}
 </section>;
}
