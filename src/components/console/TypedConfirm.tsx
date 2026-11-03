'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {objectParticle} from '@/lib/korean';

export function ConfirmDialog({title,onCancel,children,className=''}:{title:string;onCancel:()=>void;children:React.ReactNode;className?:string}){
 const [mounted,setMounted]=useState(false),dialog=useRef<HTMLDivElement>(null),titleId=useId();
 const backdropPress=useRef<{pointerId:number;releasedOutside:boolean}|null>(null);
 useEffect(()=>{const trigger=document.activeElement as HTMLElement|null;setMounted(true);return()=>{if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[]);
 useEffect(()=>{if(mounted&&!dialog.current?.contains(document.activeElement))dialog.current?.focus({preventScroll:true});},[mounted]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();onCancel();}
   if(e.key!=='Tab'||!dialog.current)return;
   const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')).filter(node=>node.tabIndex>=0&&!node.matches(':disabled')&&node.getClientRects().length>0);
   const first=items[0],last=items[items.length-1],active=document.activeElement;
   if(!first){e.preventDefault();dialog.current.focus();}
   else if(!dialog.current.contains(active)||active===dialog.current||(e.shiftKey?active===first:active===last)){e.preventDefault();(e.shiftKey?last:first).focus();}
  };
  const body=document.body.style.overflow;document.body.style.overflow='hidden';window.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=body;window.removeEventListener('keydown',key);};
 },[onCancel]);
 // Table scroll containers isolate their layers; render the modal outside them.
 return mounted?createPortal(<div className="dialog-backdrop"
  onPointerDownCapture={e=>{backdropPress.current=e.isPrimary&&e.button===0&&e.target===e.currentTarget?{pointerId:e.pointerId,releasedOutside:false}:null;}}
  onPointerUpCapture={e=>{
   const press=backdropPress.current;
   // Touch can retain the initial target through implicit pointer capture; check the actual release location.
   if(press&&press.pointerId===e.pointerId)press.releasedOutside=document.elementFromPoint(e.clientX,e.clientY)===e.currentTarget;
   else backdropPress.current=null;
  }}
  onPointerCancelCapture={()=>{backdropPress.current=null;}}
  onClick={e=>{const dismiss=backdropPress.current?.releasedOutside&&e.target===e.currentTarget;backdropPress.current=null;if(dismiss)onCancel();}}
 ><div ref={dialog} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><h2 id={titleId}>{title}</h2>{children}</div></div>,document.body):null;
}

/**
 * Confirmation for important actions: the operator must type `phrase` exactly before the action button
 * turns on. Cancel has default focus so Enter never confirms by accident. The server should check the
 * same phrase too; `onConfirm` receives the typed value to send along.
 */
export function TypedConfirmDialog({title,phrase,actionLabel,busyLabel='처리 중…',busy=false,confirmDisabled=false,error,onCancel,onConfirm,children}:{title:string;phrase:string;actionLabel:string;busyLabel?:string;busy?:boolean;confirmDisabled?:boolean;error?:string;onCancel:()=>void;onConfirm:(typed:string)=>void;children?:React.ReactNode}){
 const [typed,setTyped]=useState(''),help=useId(),matched=typed===phrase;
 const particle=objectParticle(phrase).slice(phrase.length);
 return <ConfirmDialog title={title} onCancel={()=>{if(!busy)onCancel();}}>
  {children}
  <label><span>계속하려면 <strong>{phrase}</strong>{particle} 그대로 입력하세요</span><input value={typed} onChange={e=>setTyped(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-describedby={help}/></label>
  <p id={help} className="muted">띄어쓰기까지 정확히 같아야 버튼이 켜집니다.</p>
  {error&&<p role="alert" className="error">{error}</p>}
  <div className="actions dialog-actions"><button type="button" autoFocus onClick={onCancel} disabled={busy}>취소</button><button type="button" className="primary" disabled={busy||confirmDisabled||!matched} onClick={()=>{if(matched&&!busy&&!confirmDisabled)onConfirm(typed);}}>{busy?busyLabel:actionLabel}</button></div>
 </ConfirmDialog>;
}
