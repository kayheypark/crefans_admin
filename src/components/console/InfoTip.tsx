'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {ConsoleIcon} from './ConsoleIcon';

/**
 * Information icon with a tooltip. Hover and keyboard focus show it on PC; a tap toggles it on touch
 * devices, where Safari does not focus buttons. Each instance has its own id, so many can share a page.
 */
export function InfoTip({text,label='안내',below=false}:{text:string;label?:string;below?:boolean}){
 const id=useId(),[open,setOpen]=useState(false),ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{if(!open)return;const close=(e:Event)=>{if(e instanceof KeyboardEvent?e.key==='Escape':!ref.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);document.addEventListener('keydown',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',close);};},[open]);
 return <span ref={ref} className={below?'info-tip below':'info-tip'} data-open={open||undefined}><button type="button" aria-label={label} aria-describedby={id} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><ConsoleIcon name="info"/></button><span role="tooltip" id={id}>{text}</span></span>;
}
