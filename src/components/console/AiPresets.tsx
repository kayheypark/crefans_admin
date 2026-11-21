'use client';
import {useEffect,useMemo,useState} from 'react';
import {EmptyState} from './EmptyState';
import {ConfirmDialog,DialogActions} from './TypedConfirm';
import {useSnackbar} from './Snackbar';

// 2026-11-21 user request: see every AI photo preset by category — image, label, prompt — and, for costumes, whether the
// Coupang Partners link is connected. The catalog is code in crefans_front, served as JSON at /api/ai-photo-catalog.
// Read-only: changing a preset is a code change in crefans_front (lib/crefans/ai-photo-*.ts).
export type CatalogItem={id:string;category:string;title:string;detail?:string;prompt:string;image:string;shopUrl?:string|null};
export type CatalogGroup={key:string;label:string;categories:{value:string;label:string}[];items:CatalogItem[]};
type LinkFilter='all'|'linked'|'unlinked';

/** The service site that serves the catalog and images for this console host. */
export function frontOrigin(host:string){
 if(host==='admin.crefans.com')return 'https://crefans.com';
 if(host==='admin-dev.crefans.com')return 'https://www-dev.crefans.com';
 return 'http://127.0.0.1:3000';
}
export function filterItems(group:CatalogGroup|undefined,category:string,query:string,link:LinkFilter){
 if(!group)return[];
 const q=query.trim().toLowerCase();
 return group.items.filter(it=>(category==='all'||it.category===category)&&(!q||[it.title,it.detail||'',it.prompt,it.id].some(v=>v.toLowerCase().includes(q)))
  &&(group.key!=='costume'||link==='all'||(link==='linked')===!!it.shopUrl));
}

export function AiPresets(){
 const [groups,setGroups]=useState<CatalogGroup[]|null>(null),[error,setError]=useState(''),[origin,setOrigin]=useState('');
 const [groupKey,setGroupKey]=useState('costume'),[category,setCategory]=useState('all'),[query,setQuery]=useState(''),[link,setLink]=useState<LinkFilter>('all');
 const [open,setOpen]=useState<CatalogItem|null>(null);
 useEffect(()=>{const o=frontOrigin(location.hostname);setOrigin(o);
  fetch(o+'/api/ai-photo-catalog').then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}).then(d=>setGroups(d.groups)).catch(()=>setError('프리셋 목록을 불러오지 못했어요. 서비스 사이트 상태를 확인해 주세요.'));},[]);
 const group=groups?.find(g=>g.key===groupKey),items=useMemo(()=>filterItems(group,category,query,link),[group,category,query,link]);
 const linked=group?.key==='costume'?group.items.filter(it=>it.shopUrl).length:0;
 const catLabel=(v:string)=>group?.categories.find(c=>c.value===v)?.label||'';
 return <section className="ai-presets">
  <div className="section-head"><h2>AI 사진 프리셋</h2>{groups&&<span className="muted">총 {groups.reduce((n,g)=>n+g.items.length,0).toLocaleString('ko-KR')}개 · 보기 전용(수정은 서비스 코드 변경)</span>}</div>
  {error&&<p className="error" role="alert">{error}</p>}
  {!groups&&!error&&<p className="muted" aria-live="polite">불러오는 중…</p>}
  {groups&&<>
   <div className="period-pills ai-presets-groups" role="group" aria-label="프리셋 종류">{groups.map(g=><button key={g.key} type="button" aria-pressed={g.key===groupKey} onClick={()=>{setGroupKey(g.key);setCategory('all');setLink('all');}}>{g.label}<span className="ai-presets-count">{g.items.length}</span></button>)}</div>
   <div className="filters ai-presets-filters">
    {group&&group.categories.length>0&&<label>분류<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">전체</option>{group.categories.map(c=><option key={c.value} value={c.value}>{c.label} ({group.items.filter(it=>it.category===c.value).length})</option>)}</select></label>}
    {group?.key==='costume'&&<label>쿠팡 링크<select value={link} onChange={e=>setLink(e.target.value as LinkFilter)}><option value="all">전체</option><option value="linked">연결됨</option><option value="unlinked">미연결</option></select></label>}
    <label className="ai-presets-search">검색<input type="search" value={query} placeholder="라벨·설명·프롬프트" onChange={e=>setQuery(e.target.value)}/></label>
   </div>
   {group?.key==='costume'&&<p className="ai-presets-linkstat"><span className="ai-presets-badge" data-on={linked===group.items.length}>{linked===group.items.length?'전체 연결':'일부 미연결'}</span> 쿠팡 파트너스 링크 {linked}/{group.items.length}개 연결 · 결과 화면의 「쿠팡에서 보기」로 열립니다</p>}
   <p className="muted" aria-live="polite">{items.length.toLocaleString('ko-KR')}개 표시</p>
   {items.length?<ul className="ai-presets-grid" data-kind={groupKey}>{items.map(it=><li key={it.id}><button type="button" className="ai-presets-card" onClick={()=>setOpen(it)} aria-label={`${it.title} 자세히 보기`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- public service image on another origin */}
    <img src={origin+it.image} alt="" loading="lazy"/>
    <span className="ai-presets-title">{it.title}</span>
    <span className="ai-presets-meta">{[catLabel(it.category),it.detail].filter(Boolean).join(' · ')||' '}</span>
    {group?.key==='costume'&&<span className="ai-presets-badge" data-on={!!it.shopUrl}>{it.shopUrl?'쿠팡 연결됨':'미연결'}</span>}
   </button></li>)}</ul>:<EmptyState/>}
  </>}
  {open&&<PresetDialog item={open} origin={origin} category={catLabel(open.category)} costume={groupKey==='costume'} onClose={()=>setOpen(null)}/>}
 </section>;
}

function PresetDialog({item,origin,category,costume,onClose}:{item:CatalogItem;origin:string;category:string;costume:boolean;onClose:()=>void}){
 const snackbar=useSnackbar();
 const copy=(text:string,label:string)=>{navigator.clipboard?.writeText(text).then(()=>snackbar(`${label} 복사했습니다.`),()=>snackbar('복사하지 못했습니다.'));};
 return <ConfirmDialog title={item.title} onCancel={onClose} className="ai-presets-dialog">
  <div className="ai-presets-detail">
   {/* eslint-disable-next-line @next/next/no-img-element -- public service image on another origin */}
   <img src={origin+item.image} alt={item.title}/>
   <dl>
    <dt>분류</dt><dd>{category||'없음'}{item.detail?` · ${item.detail}`:''}</dd>
    <dt>ID</dt><dd><code>{item.id}</code></dd>
    <dt>프롬프트</dt><dd className="ai-presets-prompt">{item.prompt}</dd>
    {costume&&<><dt>쿠팡 링크</dt><dd>{item.shopUrl?<a href={item.shopUrl} target="_blank" rel="noopener noreferrer">{item.shopUrl}</a>:<span className="muted">미연결 — 일반 쿠팡 검색으로 열림</span>}</dd></>}
   </dl>
  </div>
  <DialogActions><button type="button" onClick={()=>copy(item.prompt,'프롬프트를')}>프롬프트 복사</button>{item.shopUrl&&<button type="button" onClick={()=>copy(item.shopUrl!,'링크를')}>링크 복사</button>}<button type="button" className="primary" onClick={onClose}>닫기</button></DialogActions>
 </ConfirmDialog>;
}
