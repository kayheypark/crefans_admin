'use client';
import {createContext,useCallback,useContext,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {objectParticle} from '@/lib/korean';

// Dialogs can stack (a confirmation on top of an editor), so Escape and the focus trap must apply to the topmost one only.
const openDialogs:symbol[]=[];

export function ConfirmDialog({title,onCancel,children,className=''}:{title:string;onCancel:()=>void;children:React.ReactNode;className?:string}){
 const [mounted,setMounted]=useState(false),dialog=useRef<HTMLDivElement>(null),titleId=useId(),token=useRef<symbol>(undefined as unknown as symbol);
 if(!token.current)token.current=Symbol('dialog');
 const backdropPress=useRef<{pointerId:number;releasedOutside:boolean}|null>(null);
 useEffect(()=>{const trigger=document.activeElement as HTMLElement|null;setMounted(true);return()=>{if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[]);
 useEffect(()=>{if(mounted&&!dialog.current?.contains(document.activeElement))dialog.current?.focus({preventScroll:true});},[mounted]);
 useEffect(()=>{
  const mine=token.current;openDialogs.push(mine);
  const key=(e:KeyboardEvent)=>{
   if(openDialogs[openDialogs.length-1]!==mine)return;
   if(e.key==='Escape'){e.preventDefault();onCancel();}
   if(e.key!=='Tab'||!dialog.current)return;
   const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')).filter(node=>node.tabIndex>=0&&!node.matches(':disabled')&&node.getClientRects().length>0);
   const first=items[0],last=items[items.length-1],active=document.activeElement;
   if(!first){e.preventDefault();dialog.current.focus();}
   else if(!dialog.current.contains(active)||active===dialog.current||(e.shiftKey?active===first:active===last)){e.preventDefault();(e.shiftKey?last:first).focus();}
  };
  const body=document.body.style.overflow;document.body.style.overflow='hidden';window.addEventListener('keydown',key);
  return()=>{const at=openDialogs.lastIndexOf(mine);if(at>=0)openDialogs.splice(at,1);document.body.style.overflow=openDialogs.length?'hidden':body;window.removeEventListener('keydown',key);};
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

/**
 * Yes/no confirmation and single-value input in the console's own dialog, replacing window.confirm and
 * window.prompt (2026-11-06). Native dialogs are blocked in some embedded browsers, where confirm() silently
 * returns false and prompt() returns null, so the action is dropped without a word.
 * Confirm keeps default focus on Cancel so Enter never confirms by accident; a prompt focuses its field and the
 * action stays off until something non-blank is typed. Actions that need a typed phrase use TypedConfirmDialog.
 */
export type ConfirmRequest={title:string;message?:ReactNode;actionLabel?:string;cancelLabel?:string;danger?:boolean};
export type PromptRequest=ConfirmRequest&{label:string;placeholder?:string;maxLength?:number;multiline?:boolean};
type Ask=(request:ConfirmRequest&Partial<PromptRequest>,input:boolean)=>Promise<string|null>;
const ConfirmContext=createContext<Ask|null>(null);

function ConfirmBody({request,input,onSettle}:{request:ConfirmRequest&Partial<PromptRequest>;input:boolean;onSettle:(value:string|null)=>void}){
 const [value,setValue]=useState(''),fieldId=useId(),ready=!input||!!value.trim();
 const lines=typeof request.message==='string'?request.message.split('\n').filter(line=>line.trim()).map((line,index)=><p key={index}>{line}</p>):request.message;
 return <form className="editor" onSubmit={e=>{e.preventDefault();if(ready)onSettle(input?value.trim():'');}}>
  {lines}
  {input&&<label htmlFor={fieldId}><span>{request.label}</span>{request.multiline
   ?<textarea id={fieldId} autoFocus value={value} maxLength={request.maxLength} placeholder={request.placeholder} onChange={e=>setValue(e.target.value)}/>
   :<input id={fieldId} autoFocus value={value} maxLength={request.maxLength} placeholder={request.placeholder} autoComplete="off" onChange={e=>setValue(e.target.value)}/>}</label>}
  <div className="actions dialog-actions">
   <button type="button" autoFocus={!input} onClick={()=>onSettle(null)}>{request.cancelLabel||'취소'}</button>
   <button type="submit" className={request.danger?'danger':'primary'} disabled={!ready}>{request.actionLabel||'확인'}</button>
  </div>
 </form>;
}

export function ConfirmProvider({children}:{children:ReactNode}){
 const [pending,setPending]=useState<{request:ConfirmRequest&Partial<PromptRequest>;input:boolean;id:number}|null>(null);
 const resolve=useRef<((value:string|null)=>void)|null>(null),nextId=useRef(0);
 const settle=useCallback((value:string|null)=>{const done=resolve.current;resolve.current=null;setPending(null);done?.(value);},[]);
 // A request arriving while another is open answers the older one "cancel" instead of losing its promise.
 const ask=useCallback<Ask>((request,input)=>{resolve.current?.(null);return new Promise<string|null>(done=>{resolve.current=done;setPending({request,input,id:nextId.current++});});},[]);
 useEffect(()=>()=>{resolve.current?.(null);resolve.current=null;},[]);
 return <ConfirmContext.Provider value={ask}>{children}
  {pending&&<ConfirmDialog key={pending.id} title={pending.request.title} onCancel={()=>settle(null)}><ConfirmBody request={pending.request} input={pending.input} onSettle={settle}/></ConfirmDialog>}
 </ConfirmContext.Provider>;
}

function useAsk(){const ask=useContext(ConfirmContext);if(!ask)throw new Error('useConfirm/usePrompt needs ConfirmProvider');return ask;}
/** Resolves true when the operator confirms. */
export function useConfirm(){const ask=useAsk();return useCallback((request:ConfirmRequest)=>ask(request,false).then(value=>value!==null),[ask]);}
/** Resolves the trimmed, non-blank text, or null when cancelled. */
export function usePrompt(){const ask=useAsk();return useCallback((request:PromptRequest)=>ask(request,true),[ask]);}
