'use client';
import {useState} from 'react';
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {useData,State} from './ConsoleData';
type Metrics={newSubscriptions:number;paymentCount:number;gross:number;refunds:number;netSales:number;platformFees:number};
type Point=Metrics&{date:string};
type DashboardData={asOf:string;currentActive:number;period:{date:string;previousDate:string;days:number;from:string;to:string;partial:boolean;cutoff:string};summary:Metrics;previous:Metrics;trend:Point[]};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
const count=(n:number)=>n.toLocaleString('ko-KR');
function Change({value,previous,unit}:{value:number;previous:number;unit:string}){
 const delta=value-previous,pct=previous===0?null:Math.abs(delta)/previous*100;
 return <p className={'metric-change '+(delta>0?'up':delta<0?'down':'')}><span>{delta===0?'변동 없음':`${delta>0?'▲':'▼'} ${count(Math.abs(delta))}${unit}`}</span>{delta!==0&&<span>{pct===null?'전일 0 · 비율 비교 없음':`${pct.toLocaleString('ko-KR',{maximumFractionDigits:1})}%`}</span>}</p>;
}
function Trend({title,rows,money=false}:{title:string;rows:Point[];money?:boolean}){
 const lines=money?[['gross','총 구독 결제액'],['netSales','환불 차감 결제액']]:[['newSubscriptions','신규 구독'],['paymentCount','구독 결제 건수']];
 return <section className="trend-panel"><h2>{title}</h2><div className="trend-chart" role="img" aria-label={title+' 그래프. 정확한 수치는 아래 일별 데이터에서 확인할 수 있습니다.'}><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{top:12,right:12,bottom:0,left:0}} accessibilityLayer>
 <CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5).replace('-','/')} minTickGap={30} tick={{fill:'var(--text-3)',fontSize:11}} tickLine={false} axisLine={false}/>
 <YAxis width={money?64:40} allowDecimals={false} tickFormatter={v=>new Intl.NumberFormat('ko-KR',{notation:'compact',maximumFractionDigits:1}).format(Number(v))} tick={{fill:'var(--text-3)',fontSize:11}} tickLine={false} axisLine={false}/>
 <Tooltip formatter={(v)=>`${count(Number(v))}${money?'원':'건'}`} contentStyle={{background:'var(--surface)',borderColor:'var(--border)',borderRadius:8,color:'var(--text-1)'}}/><Legend wrapperStyle={{fontSize:12}}/>
 {lines.map(([key,label],i)=><Line key={key} type="linear" dataKey={key} name={label} stroke={i?'var(--chart-secondary)':'var(--brand)'} strokeWidth={2} strokeDasharray={i?'5 3':undefined} dot={false} activeDot={{r:4}} isAnimationActive={false}/>)}
 </LineChart></ResponsiveContainer></div></section>;
}
export function Dashboard(){
 const [date,setDate]=useState(today),[days,setDays]=useState('30'),[draft,setDraft]=useState(date),state=useData<DashboardData>(`/admin/dashboard?date=${date}&days=${days}`),d=state.data;
 const cards:[keyof Metrics,string,string][]=[['newSubscriptions','신규 구독','건'],['paymentCount','구독 결제 건수','건'],['gross','총 구독 결제액','원'],['netSales','환불 차감 결제액','원']];
 return <div className="dashboard"><div className="dashboard-tools"><form className="filters" onSubmit={e=>{e.preventDefault();if(draft)setDate(draft);}}><label>기준일<input type="date" value={draft} max={today()} min="2000-01-01" onChange={e=>setDraft(e.target.value)} required/></label><button className="primary" disabled={!draft||draft>today()}>조회</button><button type="button" onClick={state.reload} disabled={state.loading}>새로고침</button></form><div className="period-pills" aria-label="추이 기간">{['7','30','90'].map(n=><button key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>최근 {n}일</button>)}</div></div><State {...state}/>
 {d&&<><div className="dashboard-caption"><p>{d.period.date} · {d.period.partial?`진행 중 · 전일 같은 시각까지 비교 (${new Date(d.period.cutoff).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})})`:'전일 하루 전체와 비교'} · 한국 시간</p><p>현재 기간이 남은 구독 <strong>{count(d.currentActive)}건</strong></p></div>
 <div className="metrics dashboard-metrics">{cards.map(([key,label,unit])=><article key={key} aria-label={label}><span>{label}</span><strong>{count(d.summary[key])}<small>{unit}</small></strong><Change value={d.summary[key]} previous={d.previous[key]} unit={unit}/><small className="previous-value">전일 {count(d.previous[key])}{unit}</small></article>)}</div>
 <div className="dashboard-charts"><Trend title="구독 추이" rows={d.trend}/><Trend title="구독 결제액 추이" rows={d.trend} money/></div>
 <p className="dashboard-basis">신규 구독은 구독별 첫 승인 1건이며, 결제 건수·총액에는 갱신과 이후 환불된 결제도 포함됩니다. 환불 차감액은 현재 원장을 원결제 승인일에 반영합니다. 테스트 결제가 포함될 수 있습니다.</p>
 <details className="dashboard-data"><summary>일별 데이터 · {d.period.from} ~ {d.period.to}</summary><div className="table-wrap"><table><caption className="sr-only">구독 및 결제 일별 추이</caption><thead><tr><th>날짜</th>{cards.map(([key,label])=><th className="number" key={key}>{label}</th>)}</tr></thead><tbody>{d.trend.map(row=><tr key={row.date}><td>{row.date}</td>{cards.map(([key,,unit])=><td className="number" key={key}>{count(row[key])}{unit}</td>)}</tr>)}</tbody></table></div></details>
 <p className="dashboard-updated">최근 갱신 {new Date(d.asOf).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} · 현재 구독 수는 조회 시점 기준, 해지 예약 후 잔여 기간 포함</p></>}
 </div>;
}
