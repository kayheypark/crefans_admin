'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
// Same snackbar as the service app (crefans_front components/ui/Toast.tsx): bottom center, 4s countdown bar, × to close, top layer above dialogs.
const duration=4000,exitMs=120;
/** Reusable transient feedback; errors stay alongside the form. */
export function Snackbar({message,onClose}:{message:string;onClose:()=>void}){
 const [present,setPresent]=useState(!!message),[lastMessage,setLastMessage]=useState(message),[mounted,setMounted]=useState(false);
 const close=useRef(onClose),surface=useRef<HTMLDivElement>(null);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{if(message){setLastMessage(message);setPresent(true);return;}const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const timer=setTimeout(()=>setPresent(false),reduced?0:exitMs);return()=>clearTimeout(timer);},[message]);
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>close.current(),duration);return()=>clearTimeout(timer);},[message]);
 useEffect(()=>{const node=surface.current;if(!node||!present||typeof node.showPopover!=='function')return;node.setAttribute('popover','manual');node.showPopover();return()=>{if(node.isConnected&&node.matches(':popover-open'))node.hidePopover();};},[present]);
 if(!present)return null;
 const content=<div className="console-snackbar-region" role="status" aria-live="polite" aria-atomic="true"><div ref={surface} className="console-snackbar" data-state={message?'open':'closing'}><span>{message||lastMessage}</span><button type="button" aria-label="알림 닫기" disabled={!message} onClick={onClose}>×</button>{message&&<div key={message} className="console-snackbar-progress" aria-hidden="true" style={{animationDuration:`${duration}ms`}}/>}</div></div>;
 return mounted?createPortal(content,document.body):content;
}
// One console-wide snackbar, so a message survives the list reload that follows an action (the row that raised it may remount).
const SnackbarContext=createContext<((message:string)=>void)|null>(null);
export function SnackbarProvider({children}:{children:ReactNode}){
 const [notice,setNotice]=useState({message:'',id:0});
 const show=useCallback((message:string)=>setNotice(current=>({message,id:current.id+1})),[]);
 return <SnackbarContext.Provider value={show}>{children}<Snackbar key={notice.id} message={notice.message} onClose={()=>setNotice(current=>({...current,message:''}))}/></SnackbarContext.Provider>;
}
export function useSnackbar(){const show=useContext(SnackbarContext);if(!show)throw new Error('useSnackbar needs SnackbarProvider');return show;}
