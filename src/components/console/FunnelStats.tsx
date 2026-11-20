'use client';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
import {LandingAlertCap,type LandingAlertCapInfo} from './LandingAlertCap';
// 2026-11-18 user decision ("방법 1 서버 집계"): read-only AI photo trial funnel, last 14 KST days × steps.
// The server stores only day/step/count, so the rate is a ratio of step totals, not people moving from one step to the next.
export type FunnelStep={key:string;label:string;source:'browser'|'server';daily:number[];total:number};
export type FunnelData={timeZone:string;dates:string[];steps:FunnelStep[];notice:string;landingAlertCap?:LandingAlertCapInfo};
const count=(n:number)=>n.toLocaleString('ko-KR');
export function conversion(total:number,landing:number){return landing>0?`${(total/landing*100).toLocaleString('ko-KR',{maximumFractionDigits:1})}%`:'–';}
export function FunnelTable({data}:{data:FunnelData}){
 const landing=data.steps.find(step=>step.key==='landing_view')?.total||0;
 return <><div className="table-wrap"><table aria-label="AI 사진 체험 유입 단계별 일별 횟수"><thead><tr><th>단계</th>{data.dates.map(d=><th className="number" key={d} scope="col">{d.slice(5).replace('-','/')}</th>)}<th className="number" scope="col">14일 합계</th><th className="number" scope="col">랜딩 대비</th></tr></thead>
 <tbody>{data.steps.map(step=><tr key={step.key}><th scope="row">{step.label}{step.source==='browser'&&<small> (화면)</small>}</th>{step.daily.map((n,i)=><td className="number" key={data.dates[i]}>{count(n)}</td>)}<td className="number"><strong>{count(step.total)}</strong></td><td className="number">{conversion(step.total,landing)}</td></tr>)}</tbody></table></div>
 <p className="dashboard-basis">{data.notice} 랜딩 대비는 14일 합계끼리 나눈 값이에요.</p></>;
}
export function FunnelStats({canEditCap=false}:{canEditCap?:boolean}){
 const state=useData<FunnelData>('/admin/funnel-stats'),d=state.data;
 return <><State {...state}/>{d&&<TableContent count={d.steps.length} pending={state.loading} emptyMessage="집계할 단계가 없습니다."><FunnelTable data={d}/></TableContent>}
  {d?.landingAlertCap&&<LandingAlertCap key={d.landingAlertCap.value} info={d.landingAlertCap} canEdit={canEditCap} onSaved={state.reload}/>}</>;
}
