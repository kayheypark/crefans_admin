'use client';
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api,ApiError} from '@/lib/console-api';
import {useDelayedLoading} from '@/lib/useDelayedLoading';
// Loading rule: a new request keeps the previous data and error on screen; only the latest response replaces them (an older one is ignored).
// `loading` is true while a request is in flight; `slow` turns on after one second without a response.
export function useData<T>(path:string|null){const router=useRouter(),[data,setData]=useState<T|null>(null),[loading,setLoading]=useState(!!path),[error,setError]=useState(''),[version,setVersion]=useState(0);const reload=useCallback(()=>setVersion(n=>n+1),[]);
useEffect(()=>{if(!path){setData(null);setLoading(false);setError('');return;}let active=true;setLoading(true);api<T>(path).then(value=>{if(active){setData(value);setError('');}}).catch(e=>{if(active){if(e instanceof ApiError&&e.status===401)router.replace('/login');setData(null);setError(e instanceof Error?e.message:'조회에 실패했습니다.');}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[path,version,router]);const slow=useDelayedLoading(loading);return{data,loading,slow,error,reload};}
// A list with rows gets the spinner over it (dimmed); before the first response or with an empty list it sits where the table goes.
const hasRows=(data:unknown)=>Array.isArray(data)?data.length>0:data&&typeof data==='object'&&Array.isArray((data as {items?:unknown}).items)?(data as {items:unknown[]}).items.length>0:data!=null;
export function State({slow=false,error,reload,data}:{loading:boolean;slow?:boolean;error:string;reload:()=>void;data?:unknown}){return <>{error&&<div role="alert" className="error">{error} <button onClick={reload}>다시 시도</button></div>}{slow&&<div className={hasRows(data)?'loading-veil':'loading-block'} role="status" aria-label="불러오는 중"><span className="loading-spinner" aria-hidden="true"/></div>}</>;}
