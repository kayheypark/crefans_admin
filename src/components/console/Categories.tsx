'use client';
import {useId,useRef,useState,type FormEvent} from 'react';
import {DndContext,KeyboardSensor,PointerSensor,closestCenter,useSensor,useSensors,type DragEndEvent,type KeyboardCoordinateGetter,type PointerSensorProps} from '@dnd-kit/core';
import {SortableContext,arrayMove,sortableKeyboardCoordinates,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
import {restrictToParentElement,restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {CSS} from '@dnd-kit/utilities';
import {api} from '@/lib/console-api';
import {State,useData} from './ConsoleData';
import {useSnackbar} from './Snackbar';
import {ConfirmDialog} from './TypedConfirm';

type Category={id:string;name:string;active:boolean;sortOrder:number;iconUrl:string|null;customIcon:boolean};
const iconSource=(url:string)=>url.replace(/^\/api\/v1\/categories\//,'/api/v1/admin/categories/');
const previewOrder=['라이프스타일','뷰티','코스프레','피트니스','음악','여행','게임','아트','일상'];
// Axis modifiers constrain the row, but auto-scroll uses raw sensor coordinates.
// Lock those too so dragging near a mobile table edge never scrolls it sideways.
class VerticalPointerSensor extends PointerSensor{
 constructor(props:PointerSensorProps){
  let initialX=0;
  super({...props,onStart:point=>{initialX=point.x;props.onStart(point);},onMove:point=>props.onMove({...point,x:initialX})});
 }
}
const verticalCoordinates:KeyboardCoordinateGetter=(event,args)=>{
 if(event.code==='ArrowLeft'||event.code==='ArrowRight'){event.preventDefault();return;}
 return ['ArrowUp','ArrowDown'].includes(event.code)?sortableKeyboardCoordinates(event,args):undefined;
};
const dragInstructions={draggable:'순서 이동 손잡이입니다. 스페이스 또는 엔터로 잡고 위아래 방향키로 이동하세요. 다시 스페이스 또는 엔터로 놓거나 Esc로 취소하세요. 변경 후 순서 저장을 눌러주세요.'};

function CategoryRow({category,index,count,canUpdate,dragDisabled,controlsDisabled,editDisabled,onMove,onEdit}:{category:Category;index:number;count:number;canUpdate:boolean;dragDisabled:boolean;controlsDisabled:boolean;editDisabled:boolean;onMove:(index:number,delta:number)=>void;onEdit:(category:Category)=>void}){
 const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:category.id,disabled:dragDisabled});
 return <tr ref={setNodeRef} className={isDragging?'category-row-dragging':undefined} style={{transform:CSS.Transform.toString(transform),transition}}>
  <td><div className="category-order">{canUpdate&&<button ref={setActivatorNodeRef} type="button" className="category-drag-handle" {...attributes} {...listeners} aria-label={`${category.name} 순서 이동`} aria-roledescription="순서 이동 손잡이" disabled={dragDisabled}>
   <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="8" cy="5" r="1.5"/><circle cx="16" cy="5" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/></svg>
  </button>}<span>{index+1}</span>{canUpdate&&<><button type="button" aria-label={`${category.name} 위로`} disabled={controlsDisabled||index===0} onClick={()=>onMove(index,-1)}>↑</button><button type="button" aria-label={`${category.name} 아래로`} disabled={controlsDisabled||index===count-1} onClick={()=>onMove(index,1)}>↓</button></>}</div></td>
  <td>{category.iconUrl?<img className="category-icon" src={iconSource(category.iconUrl)} alt={`${category.name} 아이콘`}/>:<span className="muted">없음</span>}</td><td>{category.name}</td><td>{category.active?'사용 중':'미사용'}</td>{canUpdate&&<td><button type="button" disabled={editDisabled} onClick={()=>onEdit(category)}>편집</button></td>}
 </tr>;
}

export function Categories({canCreate,canUpdate=false}:{canCreate:boolean;canUpdate?:boolean}){
 const state=useData<Category[]>('/admin/categories'),snackbar=useSnackbar();
 const dragId=useId(),[activeId,setActiveId]=useState<string|null>(null);
 const sensors=useSensors(useSensor(VerticalPointerSensor,{activationConstraint:{distance:{y:8}}}),useSensor(KeyboardSensor,{coordinateGetter:verticalCoordinates,scrollBehavior:'auto'}));
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
 function move(index:number,delta:number){if(!canUpdate||controlsDisabled)return;setOrdered(rows=>index>=0&&index+delta>=0&&index+delta<rows.length?arrayMove(rows,index,index+delta):rows);}
 function finishDrag({active,over}:DragEndEvent){
  setActiveId(null);if(dragDisabled||!over||active.id===over.id)return;
  setOrdered(rows=>{const from=rows.findIndex(row=>row.id===active.id),to=rows.findIndex(row=>row.id===over.id);return from<0||to<0?rows:arrayMove(rows,from,to);});
 }
 async function saveOrder(){await run(async()=>{await api('/admin/categories/order',{ids:ordered.map(r=>r.id),expectedIds:state.data?.map(r=>r.id)},'PUT');state.reload();snackbar('활동 분야 순서를 저장했습니다.');});}
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!editing)return;await run(async()=>{await api(`/admin/categories/${editing.id}`,{name:editing.name.trim(),active:editing.active},'PUT');setEditing(null);state.reload();snackbar('활동 분야를 저장했습니다.');});}
 async function upload(file:File){
  if(!editing)return;
  if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){setError('PNG·JPG·WebP 이미지(2MB 이하)를 선택해주세요.');return;}
  const body=new FormData();body.append('file',file);
  await run(async()=>{const result=await api<Category>(`/admin/categories/${editing.id}/icon`,body);setEditing(row=>row?{...row,iconUrl:result.iconUrl,customIcon:result.customIcon}:row);state.reload();snackbar('아이콘을 저장했습니다.');});
 }
 async function resetIcon(){if(!editing)return;await run(async()=>{const result=await api<Category>(`/admin/categories/${editing.id}/icon`,undefined,'DELETE');setEditing(row=>row?{...row,iconUrl:result.iconUrl,customIcon:result.customIcon}:row);state.reload();snackbar('기본 아이콘으로 복원했습니다.');});}
 const dragDisabled=!canUpdate||busy||state.loading||!!editing;
 const controlsDisabled=busy||state.loading||!!editing||activeId!==null;
 const locked=controlsDisabled||changed;
 const position=(id:string|number)=>ordered.findIndex(row=>row.id===id)+1;
 const categoryName=(id:string|number)=>ordered.find(row=>row.id===id)?.name||'활동 분야';
 return <section aria-labelledby="categories-title" id="categories">
  <div className="section-head"><h2 id="categories-title">활동 분야 관리</h2><button type="button" onClick={()=>{setError('');state.reload();}} disabled={controlsDisabled}>목록 새로고침</button></div>
  <p className="muted">저장한 순서와 아이콘은 홈·탐색·프로필에, 분야 순서는 크리에이터 등록·설정에도 반영됩니다.</p>
  {canCreate?<form className="filters category-form" onSubmit={add} aria-label="활동 분야 추가">
   <label>분야 이름<input value={name} onChange={e=>setName(e.target.value)} maxLength={40} required disabled={locked} placeholder="예: 테스트, 일러스트" aria-describedby="category-name-help"/></label>
   <button className="primary" disabled={locked||!name.trim()}>{busy?'처리 중…':'분야 추가'}</button>
  </form>:!canUpdate&&<p className="notice">조회만 가능합니다. 추가는 콘텐츠·신고의 생성 권한, 수정·정렬은 수정 권한이 필요합니다.</p>}
  {canCreate&&<p id="category-name-help" className="muted">40자 이내로 입력해 주세요. 이미 등록된 이름은 추가할 수 없습니다.</p>}
  {error&&!editing&&<p role="alert" className="error">{error}</p>}
  <State {...state}/>
  {canUpdate&&!!state.data?.length&&<div className="category-toolbar">
   <button type="button" disabled={controlsDisabled} onClick={()=>setOrdered(rows=>[...rows].sort((a,b)=>(previewOrder.indexOf(a.name)<0?999:previewOrder.indexOf(a.name))-(previewOrder.indexOf(b.name)<0?999:previewOrder.indexOf(b.name))))}>목업 순서로 정렬</button>
   <button type="button" className="primary" disabled={controlsDisabled||!changed} onClick={()=>void saveOrder()}>순서 저장</button>
   {changed&&<><button type="button" disabled={controlsDisabled} onClick={()=>setOrdered(state.data!)}>순서 되돌리기</button><span role="status" className="muted">아직 저장하지 않은 순서입니다.</span></>}
  </div>}
  {canUpdate&&!!state.data?.length&&<p className="muted category-drag-help">손잡이를 위아래로 끌거나 화살표 버튼으로 이동한 뒤 순서를 저장해 주세요.</p>}
  {state.data&&(ordered.length?<DndContext id={dragId} sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToParentElement,restrictToVerticalAxis]} onDragStart={({active})=>setActiveId(String(active.id))} onDragEnd={finishDrag} onDragCancel={()=>setActiveId(null)} accessibility={{screenReaderInstructions:dragInstructions,announcements:{
   onDragStart:({active})=>`${categoryName(active.id)} 순서 이동 시작. ${ordered.length}개 중 ${position(active.id)}번째입니다.`,
   onDragOver:({active,over})=>over?`${categoryName(active.id)}, ${position(over.id)}번째 위치입니다.`:undefined,
   onDragEnd:({active,over})=>!over?'순서 이동을 취소했습니다.':active.id===over.id?'순서를 변경하지 않았습니다.':`${categoryName(active.id)} 순서를 ${position(over.id)}번째로 이동했습니다. 순서 저장을 눌러 반영해 주세요.`,
   onDragCancel:()=> '순서 이동을 취소했습니다.'
  }}}><div className="table-wrap"><table className="category-table" aria-label="활동 분야 목록"><thead><tr><th>순서</th><th>아이콘</th><th>분야 이름</th><th>상태</th>{canUpdate&&<th>관리</th>}</tr></thead><SortableContext items={ordered.map(row=>row.id)} strategy={verticalListSortingStrategy}><tbody>{ordered.map((category,index)=><CategoryRow key={category.id} category={category} index={index} count={ordered.length} canUpdate={canUpdate} dragDisabled={dragDisabled} controlsDisabled={controlsDisabled} editDisabled={locked} onMove={move} onEdit={row=>{setEditing({...row});setError('');}}/>)}</tbody></SortableContext></table></div></DndContext>:<p className="empty">등록된 활동 분야가 없습니다.</p>)}
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
