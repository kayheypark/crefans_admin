'use client';
import {useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {TableContent} from './TableContent';
import {ConsoleIcon} from './ConsoleIcon';
import {ConfirmDialog,DialogActions,useConfirm} from './TypedConfirm';
import {useSnackbar} from './Snackbar';
// 2026-11-21 user request (랜딩 링크 관리): tagged landing links with fixed UTM values, and the visits of each exact UTM
// combination over the last 14/30 days (same counts as 유입 분석). Server: crefans_server src/platform/landing-utm.ts
// (list overview.view; create, name/memo change and archive settings.update, audit-logged).
export type LandingLink={id:string;name:string;landingPath:string;utmSource:string;utmMedium:string;utmCampaign:string;utmContent:string;memo:string;url:string;createdBy:string|null;createdAt:string;archivedAt:string|null;visits:{last14:number;last30:number}|null};
type LinkList={baseUrl:string;paths:string[];links:LandingLink[];notice:string};
export const BASE_URL='https://crefans.com',UTM=/^[A-Za-z0-9_.-]{1,40}$/;
export const PATHS:[string,string][]=[['/service/landing-ai-image-generation','AI 사진 랜딩'],['/','홈']];
export const PRESETS:{label:string;source:string;medium:string}[]=[{label:'X 광고',source:'x',medium:'paid'},{label:'X 게시글',source:'x',medium:'organic'},{label:'당근 광고',source:'daangn',medium:'paid'},{label:'인스타그램',source:'instagram',medium:'organic'}];
type Draft={name:string;landingPath:string;utmSource:string;utmMedium:string;utmCampaign:string;utmContent:string;memo:string};
const blank:Draft={name:'',landingPath:PATHS[0][0],utmSource:'',utmMedium:'',utmCampaign:'',utmContent:'',memo:''};
/** Same URL the server stores: source/medium lowercased, empty utm_content left out. The regex rules out spaces and &=?#. */
export function previewUrl(d:Pick<Draft,'landingPath'|'utmSource'|'utmMedium'|'utmCampaign'|'utmContent'>){
 const q=[['utm_source',d.utmSource.toLowerCase()],['utm_medium',d.utmMedium.toLowerCase()],['utm_campaign',d.utmCampaign],['utm_content',d.utmContent]].filter(([,v])=>v).map(([k,v])=>`${k}=${v}`).join('&');
 return BASE_URL+d.landingPath+(q?'?'+q:'');
}
export function draftErrors(d:Draft){
 const e:Partial<Record<keyof Draft,string>>={};
 if(!d.name.trim())e.name='이름을 입력해주세요.';else if(d.name.trim().length>80)e.name='이름은 80자까지 쓸 수 있어요.';
 for(const [key,label,required] of [['utmSource','utm_source',true],['utmMedium','utm_medium',true],['utmCampaign','utm_campaign',true],['utmContent','utm_content',false]] as const){
  const v=d[key];if(!v){if(required)e[key]=`${label}을(를) 입력해주세요.`;}else if(!UTM.test(v))e[key]='영문·숫자·_ . - 만 40자까지 쓸 수 있어요.';
 }
 if(d.memo.length>500)e.memo='메모는 500자까지 쓸 수 있어요.';
 return e;
}
const date=(v:string)=>new Date(v).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});
const count=(n:number)=>n.toLocaleString('ko-KR');
function CopyButton({url}:{url:string}){
 const snackbar=useSnackbar();
 return <button type="button" onClick={()=>{void navigator.clipboard?.writeText(url).then(()=>snackbar('링크를 복사했습니다.'),()=>snackbar('복사하지 못했습니다. 링크를 직접 선택해 복사해주세요.'));}}>복사</button>;
}
export function LinkTable({links,canEdit,onEdit,onArchive}:{links:LandingLink[];canEdit:boolean;onEdit:(link:LandingLink)=>void;onArchive:(link:LandingLink)=>void}){
 return <div className="table-wrap"><table aria-label="랜딩 링크"><thead><tr><th scope="col">이름</th><th scope="col">링크</th><th className="number" scope="col">최근 14일</th><th className="number" scope="col">최근 30일</th><th scope="col">만든 날</th>{canEdit&&<th scope="col">관리</th>}</tr></thead>
  <tbody>{links.map(l=><tr key={l.id}>
   <td><strong>{l.name}</strong>{l.memo&&<><br/><span className="muted">{l.memo}</span></>}</td>
   <td><code className="landing-link-url">{l.url}</code><div className="actions"><CopyButton url={l.url}/></div></td>
   <td className="number">{l.visits?count(l.visits.last14):'–'}</td><td className="number">{l.visits?count(l.visits.last30):'–'}</td>
   <td>{date(l.createdAt)}{l.createdBy&&<><br/><span className="muted">{l.createdBy}</span></>}{l.archivedAt&&<><br/><span className="muted">보관 {date(l.archivedAt)}</span></>}</td>
   {canEdit&&<td>{l.archivedAt?<span className="muted">보관됨</span>:<div className="actions"><button type="button" onClick={()=>onEdit(l)}>수정</button><button type="button" onClick={()=>onArchive(l)}>보관</button></div>}</td>}
  </tr>)}</tbody></table></div>;
}
function Field({id,label,error,children,hint}:{id:string;label:string;error?:string;hint?:string;children:React.ReactNode}){
 return <div className="field"><label htmlFor={id}>{label}</label>{children}{error?<span id={id+'-help'} className="field-error">{error}</span>:hint?<span id={id+'-help'} className="muted">{hint}</span>:null}</div>;
}
export function LinkForm({initial,onDone,onCancel}:{initial?:LandingLink;onDone:(message:string)=>void;onCancel:()=>void}){
 const editing=!!initial,[d,setD]=useState<Draft>(initial?{name:initial.name,landingPath:initial.landingPath,utmSource:initial.utmSource,utmMedium:initial.utmMedium,utmCampaign:initial.utmCampaign,utmContent:initial.utmContent,memo:initial.memo}:blank);
 const [touched,setTouched]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const errors=draftErrors(d),valid=!Object.keys(errors).length,show=(k:keyof Draft)=>touched||d[k]?errors[k]:undefined,set=(patch:Partial<Draft>)=>{setD({...d,...patch});setError('');};
 const input=(key:keyof Draft,props:React.InputHTMLAttributes<HTMLInputElement>={})=><input id={'landing-link-'+key} value={d[key]} disabled={busy||(editing&&key!=='name')} aria-invalid={!!show(key)} aria-describedby={'landing-link-'+key+'-help'} autoComplete="off" spellCheck={false} onChange={e=>set({[key]:e.target.value.trim()})} {...props}/>;
 async function save(e:React.FormEvent){e.preventDefault();setTouched(true);if(busy||!valid)return;setBusy(true);setError('');
  try{const r=editing?await api<{message:string}>(`/admin/landing-links/${encodeURIComponent(initial!.id)}`,{name:d.name.trim(),memo:d.memo.trim()},'PUT'):await api<{message:string}>('/admin/landing-links',{...d,name:d.name.trim(),memo:d.memo.trim(),utmContent:d.utmContent||undefined});onDone(r.message);}
  catch(e){setError(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}}
 return <ConfirmDialog title={editing?'랜딩 링크 수정':'새 랜딩 링크'} onCancel={()=>{if(!busy)onCancel();}}><form className="editor landing-link-form" onSubmit={save} noValidate>
  <Field id="landing-link-name" label="이름" error={show('name')} hint="운영자가 알아볼 이름이에요. 링크에는 들어가지 않아요.">{<input id="landing-link-name" value={d.name} maxLength={80} disabled={busy} aria-invalid={!!show('name')} aria-describedby="landing-link-name-help" onChange={e=>set({name:e.target.value})}/>}</Field>
  {editing?<p className="muted">UTM 값과 랜딩 페이지는 바꿀 수 없어요(지난 방문 집계와 계속 맞도록). 다른 값이 필요하면 새 링크를 만드세요.</p>:<>
   <Field id="landing-link-landingPath" label="랜딩 페이지" hint={d.landingPath==='/'?'홈 링크는 방문 수를 세지 않아요(방문 집계는 AI 사진 랜딩에서만).':undefined}><select id="landing-link-landingPath" value={d.landingPath} disabled={busy} aria-describedby="landing-link-landingPath-help" onChange={e=>set({landingPath:e.target.value})}>{PATHS.map(([path,label])=><option key={path} value={path}>{label} ({path})</option>)}</select></Field>
   <div className="field"><span className="field-label">자주 쓰는 소스</span><div className="period-pills landing-link-presets" role="group" aria-label="자주 쓰는 소스">{PRESETS.map(p=><button key={p.label} type="button" disabled={busy} aria-pressed={d.utmSource===p.source&&d.utmMedium===p.medium} onClick={()=>set({utmSource:p.source,utmMedium:p.medium})}>{p.label} <small>{p.source}/{p.medium}</small></button>)}</div></div>
  </>}
  <div className="landing-link-utm">
   <Field id="landing-link-utmSource" label="utm_source (필수)" error={show('utmSource')}>{input('utmSource',{placeholder:'x',maxLength:40})}</Field>
   <Field id="landing-link-utmMedium" label="utm_medium (필수)" error={show('utmMedium')}>{input('utmMedium',{placeholder:'paid',maxLength:40})}</Field>
   <Field id="landing-link-utmCampaign" label="utm_campaign (필수)" error={show('utmCampaign')}>{input('utmCampaign',{placeholder:'cosplayer_wanted',maxLength:40})}</Field>
   <Field id="landing-link-utmContent" label="utm_content (선택)" error={show('utmContent')} hint={editing?undefined:'같은 캠페인의 광고를 나눌 때(예: cat, pink).'}>{input('utmContent',{placeholder:'cat',maxLength:40})}</Field>
  </div>
  <Field id="landing-link-memo" label="메모 (선택)" error={show('memo')}><textarea id="landing-link-memo" value={d.memo} maxLength={500} disabled={busy} aria-describedby="landing-link-memo-help" onChange={e=>set({memo:e.target.value})}/></Field>
  <div className="field"><span className="field-label">만들어질 링크</span><code className="landing-link-url" aria-live="polite">{previewUrl(d)}</code><span className="muted">utm_source·utm_medium은 소문자로 저장돼요. 영문·숫자·_ . - 만 쓸 수 있어 띄어쓰기는 들어가지 않아요.</span></div>
  {error&&<p role="alert" className="error">{error}</p>}
  <DialogActions><button type="button" disabled={busy} onClick={onCancel}>취소</button><button className="primary" disabled={busy||(touched&&!valid)}>{busy?'저장 중…':editing?'저장':'링크 만들기'}</button></DialogActions>
 </form></ConfirmDialog>;
}
export function LandingLinks({canEdit}:{canEdit:boolean}){
 const state=useData<LinkList>('/admin/landing-links'),d=state.data,[tab,setTab]=useState<'active'|'archived'>('active'),[editing,setEditing]=useState<LandingLink|'new'|null>(null),snackbar=useSnackbar(),confirmAction=useConfirm();
 const links=d?.links.filter(l=>tab==='active'?!l.archivedAt:!!l.archivedAt)||[];
 async function archive(l:LandingLink){
  if(!await confirmAction({title:'랜딩 링크 보관',message:`'${l.name}' 링크를 보관할까요? 목록의 보관됨 탭으로 옮겨지고 다시 사용 중으로 돌릴 수 없어요. 이미 퍼진 링크는 계속 열리고 방문도 유입 분석에 계속 집계돼요. 같은 UTM 조합으로 새 링크를 만들 수 있어요.`,actionLabel:'보관',danger:true}))return;
  try{const r=await api<{message:string}>(`/admin/landing-links/${encodeURIComponent(l.id)}/archive`,{});snackbar(r.message);state.reload();}
  catch(e){snackbar(e instanceof Error?e.message:'보관하지 못했습니다.');}
 }
 return <div className="landing-links">
  <p className="notice">광고·게시글에 붙일 UTM 링크를 만들고 방문 수를 봅니다. 방문 수는 같은 UTM 조합의 AI 사진 랜딩 방문(유입 분석과 같은 집계)이며 <strong>이 기능을 배포한 뒤부터 집계</strong>됩니다. 홈(/) 링크는 방문을 세지 않습니다.</p>
  <div className="section-head"><div className="tabs" role="group" aria-label="링크 상태">{([['active','사용 중'],['archived','보관됨']] as const).map(([key,label])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}{d&&<> {d.links.filter(l=>key==='active'?!l.archivedAt:!!l.archivedAt).length}</>}</button>)}</div>
   {canEdit&&<button type="button" className="primary" onClick={()=>setEditing('new')}><ConsoleIcon name="plus"/>새 링크</button>}</div>
  {!canEdit&&<p className="muted section-desc">링크를 만들거나 바꾸려면 운영 설정 수정 권한이 필요해요.</p>}
  <State {...state}/>
  {d&&<TableContent count={links.length} pending={state.loading} emptyMessage={tab==='active'?'아직 만든 링크가 없어요.':'보관된 링크가 없어요.'}><LinkTable links={links} canEdit={canEdit} onEdit={setEditing} onArchive={l=>void archive(l)}/></TableContent>}
  {d&&<p className="dashboard-basis">{d.notice} 최근 14일·30일은 오늘을 포함한 한국 시간 기준이에요.</p>}
  {editing&&canEdit&&<LinkForm initial={editing==='new'?undefined:editing} onCancel={()=>setEditing(null)} onDone={m=>{setEditing(null);snackbar(m);state.reload();}}/>}
 </div>;
}
