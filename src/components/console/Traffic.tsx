'use client';
import {useState} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
// 2026-11-21 user request (유입 분석): AI photo landing visits per UTM combination for a KST date range (server crefans_server
// src/platform/landing-utm.ts landingUtmStats, overview.view). Aggregate counts only; counting starts at deploy (no backfill).
export type UtmGroup={source:string;medium:string;campaign:string;content:string;count:number};
export type TrafficData={timeZone:string;from:string;to:string;days:number;maxDays:number;trackingSince:string|null;dates:string[];
 totals:{landingViews:number;recorded:number;withUtm:number;withoutUtm:number};topSource:{source:string;count:number}|null;
 groups:UtmGroup[];noUtm:{referrerHost:string;count:number}[];daily:{date:string;landingViews:number;withUtm:number;withoutUtm:number}[];notice:string};
const MAX_DAYS=92,count=(n:number)=>n.toLocaleString('ko-KR');
// Readable names for the sources used in links (same as the server's Telegram alert, plus result-share links).
const SOURCE_NAMES:Record<string,string>={x:'X',daangn:'당근',instagram:'인스타그램',crefans_share:'결과 공유'};
export const sourceLabel=(s:string)=>!s?'(소스 없음)':SOURCE_NAMES[s]?`${SOURCE_NAMES[s]} (${s})`:s;
export function share(n:number,total:number){return total>0?`${(n/total*100).toLocaleString('ko-KR',{maximumFractionDigits:1})}%`:'–';}
export const kstToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
export const shiftDay=(day:string,delta:number)=>new Date(Date.parse(day+'T00:00:00Z')+delta*86400000).toISOString().slice(0,10);
const span=(from:string,to:string)=>Math.round((Date.parse(to)-Date.parse(from))/86400000)+1;
/** Source → medium → campaign → content: one subtotal row per source, its combinations below (most visits first). */
export function groupBySource(groups:UtmGroup[]){
 const map=new Map<string,{source:string;count:number;rows:UtmGroup[]}>();
 for(const g of groups){const s=map.get(g.source)||{source:g.source,count:0,rows:[]};s.count+=g.count;s.rows.push(g);map.set(g.source,s);}
 const order=(a:UtmGroup,b:UtmGroup)=>a.medium.localeCompare(b.medium)||a.campaign.localeCompare(b.campaign)||b.count-a.count||a.content.localeCompare(b.content);
 return Array.from(map.values()).sort((a,b)=>b.count-a.count).map(s=>({...s,rows:s.rows.sort(order)}));
}
const empty=(v:string)=>v||<span className="muted">없음</span>;
export function UtmTable({data}:{data:TrafficData}){
 const base=data.totals.landingViews||data.totals.recorded;
 return <div className="table-wrap"><table aria-label="UTM별 방문 수"><thead><tr><th scope="col">소스</th><th scope="col">매체</th><th scope="col">캠페인</th><th scope="col">콘텐츠</th><th className="number" scope="col">방문</th><th className="number" scope="col">비율</th></tr></thead>
  {groupBySource(data.groups).map(s=><tbody key={s.source}><tr className="utm-subtotal"><th scope="rowgroup" colSpan={4}>{sourceLabel(s.source)} 소계</th><td className="number"><strong>{count(s.count)}</strong></td><td className="number">{share(s.count,base)}</td></tr>
   {s.rows.map(g=><tr key={[g.medium,g.campaign,g.content].join('|')}><td/><td>{empty(g.medium)}</td><td>{empty(g.campaign)}</td><td>{empty(g.content)}</td><td className="number">{count(g.count)}</td><td className="number">{share(g.count,base)}</td></tr>)}</tbody>)}
 </table></div>;
}
export function NoUtmTable({data}:{data:TrafficData}){
 const base=data.totals.landingViews||data.totals.recorded;
 return <div className="table-wrap"><table aria-label="UTM 없는 방문의 유입 호스트"><thead><tr><th scope="col">유입 호스트</th><th className="number" scope="col">방문</th><th className="number" scope="col">비율</th></tr></thead>
  <tbody>{data.noUtm.map(h=><tr key={h.referrerHost}><td>{h.referrerHost||'직접 방문 또는 알 수 없음'}</td><td className="number">{count(h.count)}</td><td className="number">{share(h.count,base)}</td></tr>)}</tbody></table></div>;
}
export function TrafficSummary({data}:{data:TrafficData}){
 const t=data.totals,base=t.landingViews||t.recorded;
 return <div className="metrics">
  <article aria-label="총 방문"><span>총 방문</span><strong>{count(t.recorded)}<small>회</small></strong><small className="previous-value">랜딩 방문 집계 {count(t.landingViews)}회</small></article>
  <article aria-label="UTM 있는 방문"><span>UTM 있는 방문</span><strong>{count(t.withUtm)}<small>회</small></strong><small className="previous-value">랜딩 방문 대비 {share(t.withUtm,base)} · UTM 없음 {count(t.withoutUtm)}회</small></article>
  <article aria-label="상위 소스"><span>상위 소스</span><strong>{data.topSource?sourceLabel(data.topSource.source):'없음'}</strong><small className="previous-value">{data.topSource?`${count(data.topSource.count)}회 · ${share(data.topSource.count,base)}`:'UTM 있는 방문이 아직 없어요'}</small></article>
 </div>;
}
function DailyChart({data}:{data:TrafficData}){
 return <section className="trend-panel"><h2>일별 방문</h2><div className="trend-chart" role="img" aria-label="일별 방문 그래프(UTM 있음·없음). 정확한 수치는 아래 표에서 확인할 수 있습니다."><ResponsiveContainer width="100%" height="100%"><BarChart data={data.daily} margin={{top:12,right:12,bottom:0,left:0}} accessibilityLayer>
  <CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5).replace('-','/')} minTickGap={20} tick={{fill:'var(--text-3)',fontSize:11}} tickLine={false} axisLine={false}/>
  <YAxis width={40} allowDecimals={false} tickFormatter={v=>new Intl.NumberFormat('ko-KR',{notation:'compact',maximumFractionDigits:1}).format(Number(v))} tick={{fill:'var(--text-3)',fontSize:11}} tickLine={false} axisLine={false}/>
  <Tooltip formatter={v=>`${count(Number(v))}회`} labelFormatter={v=>String(v)} contentStyle={{background:'var(--surface)',borderColor:'var(--border)',borderRadius:8,color:'var(--text-1)'}}/><Legend wrapperStyle={{fontSize:12}}/>
  <Bar dataKey="withUtm" name="UTM 있음" stackId="v" fill="var(--brand)" isAnimationActive={false}/><Bar dataKey="withoutUtm" name="UTM 없음" stackId="v" fill="var(--chart-secondary)" isAnimationActive={false}/>
 </BarChart></ResponsiveContainer></div></section>;
}
export function Traffic(){
 const today=kstToday(),initial={from:shiftDay(today,-13),to:today},[draft,setDraft]=useState(initial),[range,setRange]=useState(initial);
 const days=span(draft.from||today,draft.to||today),valid=!!draft.from&&!!draft.to&&draft.from<=draft.to&&draft.to<=today&&days<=MAX_DAYS;
 const state=useData<TrafficData>(`/admin/landing-utm-stats?from=${range.from}&to=${range.to}`),d=state.data;
 const quick=(n:number)=>{const next={from:shiftDay(today,-(n-1)),to:today};setDraft(next);setRange(next);};
 return <div className="traffic">
  <p className="notice">AI 사진 랜딩 방문을 UTM(utm_source·utm_medium·utm_campaign·utm_content)별로 셉니다. <strong>이 기능을 배포한 뒤부터 집계</strong>되며 이전 방문은 소급하지 않습니다. 날짜·UTM·유입 호스트별 횟수만 저장하고 IP·회원·쿠키는 저장하지 않습니다.</p>
  <div className="dashboard-tools"><form className="filters" onSubmit={e=>{e.preventDefault();if(valid)setRange(draft);}}><label>시작일<input type="date" required value={draft.from} max={draft.to||today} onChange={e=>setDraft({...draft,from:e.target.value})}/></label><label>종료일<input type="date" required min={draft.from} max={today} value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></label><button className="primary" disabled={!valid}>조회</button><span className="muted">최대 {MAX_DAYS}일 · 한국 시간</span></form>
   <div className="period-pills" aria-label="빠른 기간 선택">{[7,14,30,90].map(n=><button key={n} type="button" aria-pressed={range.to===today&&span(range.from,range.to)===n} onClick={()=>quick(n)}>최근 {n}일</button>)}</div></div>
  {!valid&&draft.from&&draft.to&&<p role="alert" className="error">{draft.from>draft.to?'시작일이 종료일보다 늦어요.':draft.to>today?'오늘 이후 날짜는 볼 수 없어요.':`기간은 최대 ${MAX_DAYS}일까지 볼 수 있어요.`}</p>}
  <State {...state}/>
  {d&&<>
   <div className="dashboard-caption"><p>{d.from} ~ {d.to} · {d.days}일 · 한국 시간</p><p>{d.trackingSince?`집계 시작 ${d.trackingSince}`:'아직 집계된 방문이 없어요'}</p></div>
   <TrafficSummary data={d}/>
   <DailyChart data={d}/>
   <section><h2>UTM별 방문</h2><TableContent count={d.groups.length} pending={state.loading} emptyMessage="이 기간에 UTM이 붙은 방문이 없어요."><UtmTable data={d}/></TableContent></section>
   <section><h2>UTM 없는 방문</h2><p className="muted section-desc">직접 입력·북마크·UTM 없는 공유 링크 등. 외부 페이지에서 왔으면 그 호스트 이름만 보여요.</p><TableContent count={d.noUtm.length} pending={state.loading} emptyMessage="이 기간에 UTM 없는 방문이 없어요."><NoUtmTable data={d}/></TableContent></section>
   <p className="dashboard-basis">{d.notice} 비율은 같은 기간 랜딩 방문 집계(집계 시작일 이후) 대비예요.</p>
  </>}
 </div>;
}
