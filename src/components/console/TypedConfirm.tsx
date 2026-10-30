'use client';
import {useEffect,useId,useState} from 'react';
import {objectParticle} from '@/lib/korean';

export function ConfirmDialog({title,onCancel,children}:{title:string;onCancel:()=>void;children:React.ReactNode}){
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onCancel();};const body=document.body.style.overflow;document.body.style.overflow='hidden';window.addEventListener('keydown',key);return()=>{document.body.style.overflow=body;window.removeEventListener('keydown',key);};},[onCancel]);
 return <div className="dialog-backdrop" onClick={e=>{if(e.target===e.currentTarget)onCancel();}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2>{children}</div></div>;
}

/**
 * Confirmation for important actions: the operator must type `phrase` exactly before the action button
 * turns on. Cancel has default focus so Enter never confirms by accident. The server should check the
 * same phrase too; `onConfirm` receives the typed value to send along.
 */
export function TypedConfirmDialog({title,phrase,actionLabel,busyLabel='처리 중…',busy=false,error,onCancel,onConfirm,children}:{title:string;phrase:string;actionLabel:string;busyLabel?:string;busy?:boolean;error?:string;onCancel:()=>void;onConfirm:(typed:string)=>void;children?:React.ReactNode}){
 const [typed,setTyped]=useState(''),help=useId(),matched=typed===phrase;
 const particle=objectParticle(phrase).slice(phrase.length);
 return <ConfirmDialog title={title} onCancel={()=>{if(!busy)onCancel();}}>
  {children}
  <label><span>계속하려면 <strong>{phrase}</strong>{particle} 그대로 입력하세요</span><input value={typed} onChange={e=>setTyped(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-describedby={help}/></label>
  <p id={help} className="muted">띄어쓰기까지 정확히 같아야 버튼이 켜집니다.</p>
  {error&&<p role="alert" className="error">{error}</p>}
  <div className="actions dialog-actions"><button type="button" autoFocus onClick={onCancel} disabled={busy}>취소</button><button type="button" className="primary" disabled={busy||!matched} onClick={()=>{if(matched)onConfirm(typed);}}>{busy?busyLabel:actionLabel}</button></div>
 </ConfirmDialog>;
}
