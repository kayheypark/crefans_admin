'use client';
import {useRef,useState,type FormEvent} from 'react';
import {api} from '@/lib/console-api';
import {State,useData} from './ConsoleData';
import {useSnackbar} from './Snackbar';
import {ConfirmDialog} from './TypedConfirm';

type Category={id:string;name:string;active:boolean;sortOrder:number;iconUrl:string|null;customIcon:boolean};
const iconSource=(url:string)=>url.replace(/^\/api\/v1\/categories\//,'/api/v1/admin/categories/');
const previewOrder=['라이프스타일','뷰티','코스프레','피트니스','음악','여행','게임','아트','일상'];
export function Categories({canCreate,canUpdate=false}:{canCreate:boolean;canUpdate?:boolean}){
 const state=useData<Category[]>('/admin/categories'),snackbar=useSnackbar();
 const [name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),submitting=useRef(false);
 const [ordered,setOrdered]=useState<Category[]>([]),[editing,setEditing]=useState<Category|null>(null),[synced,setSynced]=useState<Category[]|null>(null);
 // Loading rule: rows appear in the same render as the response (an effect left one frame of the empty message).
 if(state.data&&state.data!==synced){setSynced(state.data);setOrdered(state.data);}
 const changed=!!state.data&&ordered.some((row,i)=>row.id!==state.data?.[i]?.id);
 async function run(work:()=>Promise<void>){
  if(submitting.current)return;submitting.current=true;setBusy(true);setError('');
  try{await work();}catch(e){setError(e instanceof Error?e.message:'요청을 처리하지 못했습니다.');}
  finally{submitting.current=false;setBusy(false);}
 }
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const value=name.trim();if(!canCreate||!value)return;
  await run(async()=>{await api('/admin/categories',{name:value});setName('');state.reload();snackbar('활동 분야를 추가했습니다.');});
 }
 function move(index:number,delta:number){setOrdered(rows=>{const next=[...rows];[next[index],next[index+delta]]=[next[index+delta],next[index]];return next;});}
 async function saveOrder(){await run(async()=>{await api('/admin/categories/order',{ids:ordered.map(r=>r.id),expectedIds:state.data?.map(r=>r.id)},'PUT');state.reload();snackbar('활동 분야 순서를 저장했습니다.');});}
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!editing)return;await run(async()=>{await api(`/admin/categories/${editing.id}`,{name:editing.name.trim(),active:editing.active},'PUT');setEditing(null);state.reload();snackbar('활동 분야를 저장했습니다.');});}
 async function upload(file:File){
  if(!editing)return;
  if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){setError('PNG·JPG·WebP 이미지(2MB 이하)를 선택해주세요.');return;}
  const body=new FormData();body.append('file',file);
  await run(async()=>{const result=await api<Category>(`/admin/categories/${editing.id}/icon`,body);setEditing(row=>row?{...row,iconUrl:result.iconUrl,customIcon:result.customIcon}:row);state.reload();snackbar('아이콘을 저장했습니다.');});
 }
 async function resetIcon(){if(!editing)return;await run(async()=>{const result=await api<Category>(`/admin/categories/${editing.id}/icon`,undefined,'DELETE');setEditing(row=>row?{...row,iconUrl:result.iconUrl,customIcon:result.customIcon}:row);state.reload();snackbar('기본 아이콘으로 복원했습니다.');});}
 const locked=busy||state.loading||changed;
 return <section aria-labelledby="categories-title" id="categories">
  <div className="section-head"><h2 id="categories-title">활동 분야 관리</h2><button type="button" onClick={()=>{setError('');state.reload();}} disabled={busy||state.loading||!!editing}>목록 새로고침</button></div>
  <p className="muted">저장한 순서와 아이콘은 홈·탐색·프로필에, 분야 순서는 크리에이터 등록·설정에도 반영됩니다.</p>
  {canCreate?<form className="filters category-form" onSubmit={add} aria-label="활동 분야 추가">
   <label>분야 이름<input value={name} onChange={e=>setName(e.target.value)} maxLength={40} required disabled={locked} placeholder="예: 테스트, 일러스트" aria-describedby="category-name-help"/></label>
   <button className="primary" disabled={locked||!name.trim()}>{busy?'처리 중…':'분야 추가'}</button>
  </form>:!canUpdate&&<p className="notice">조회만 가능합니다. 추가는 콘텐츠·신고의 생성 권한, 수정·정렬은 수정 권한이 필요합니다.</p>}
  {canCreate&&<p id="category-name-help" className="muted">40자 이내로 입력해 주세요. 이미 등록된 이름은 추가할 수 없습니다.</p>}
  {error&&!editing&&<p role="alert" className="error">{error}</p>}
  <State {...state}/>
  {canUpdate&&!!state.data?.length&&<div className="category-toolbar">
   <button type="button" disabled={busy||state.loading} onClick={()=>setOrdered(rows=>[...rows].sort((a,b)=>(previewOrder.indexOf(a.name)<0?999:previewOrder.indexOf(a.name))-(previewOrder.indexOf(b.name)<0?999:previewOrder.indexOf(b.name))))}>목업 순서로 정렬</button>
   <button type="button" className="primary" disabled={busy||state.loading||!changed} onClick={()=>void saveOrder()}>순서 저장</button>
   {changed&&<><button type="button" disabled={busy} onClick={()=>setOrdered(state.data!)}>순서 되돌리기</button><span role="status" className="muted">아직 저장하지 않은 순서입니다.</span></>}
  </div>}
  {state.data&&(ordered.length?<div className="table-wrap"><table className="category-table" aria-label="활동 분야 목록"><thead><tr><th>순서</th><th>아이콘</th><th>분야 이름</th><th>상태</th>{canUpdate&&<th>관리</th>}</tr></thead><tbody>{ordered.map((category,index)=><tr key={category.id}>
   <td><div className="category-order"><span>{index+1}</span>{canUpdate&&<><button type="button" aria-label={`${category.name} 위로`} disabled={busy||state.loading||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={`${category.name} 아래로`} disabled={busy||state.loading||index===ordered.length-1} onClick={()=>move(index,1)}>↓</button></>}</div></td>
   <td>{category.iconUrl?<img className="category-icon" src={iconSource(category.iconUrl)} alt={`${category.name} 아이콘`}/>:<span className="muted">없음</span>}</td><td>{category.name}</td><td>{category.active?'사용 중':'미사용'}</td>{canUpdate&&<td><button type="button" disabled={locked} onClick={()=>{setEditing({...category});setError('');}}>편집</button></td>}
  </tr>)}</tbody></table></div>:<p className="empty">등록된 활동 분야가 없습니다.</p>)}
  {editing&&<ConfirmDialog title="활동 분야 편집" onCancel={()=>{if(!busy){setEditing(null);setError('');}}}><form className="editor" onSubmit={save}>
   <label>분야 이름<input required maxLength={40} value={editing.name} disabled={busy} onChange={e=>setEditing({...editing,name:e.target.value})}/></label>
   <label className="check"><input type="checkbox" checked={editing.active} disabled={busy} onChange={e=>setEditing({...editing,active:e.target.checked})}/>사용 중</label>
   <div className="category-icon-preview">{editing.iconUrl?<img src={iconSource(editing.iconUrl)} alt="현재 분야 아이콘"/>:<span>아이콘 없음</span>}</div>
   <label>아이콘 이미지<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/></label>
   <p className="muted">PNG·JPG·WebP, 최대 2MB. 아이콘은 선택 즉시 저장됩니다. 투명 배경의 정사각형 이미지를 권장합니다.</p>
   {editing.customIcon&&<button type="button" disabled={busy} onClick={()=>void resetIcon()}>기본 아이콘으로 복원</button>}
   {error&&<p role="alert" className="error">{error}</p>}
   <div className="actions"><button type="button" disabled={busy} onClick={()=>{setEditing(null);setError('');}}>닫기</button><button className="primary" disabled={busy||!editing.name.trim()}>변경 저장</button></div>
  </form></ConfirmDialog>}
 </section>;
}
