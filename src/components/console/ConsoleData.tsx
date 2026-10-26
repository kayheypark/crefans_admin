'use client';
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api,ApiError} from '@/lib/console-api';
export function useData<T>(path:string|null){const router=useRouter(),[data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[version,setVersion]=useState(0);const reload=useCallback(()=>setVersion(n=>n+1),[]);
useEffect(()=>{if(!path){setData(null);setLoading(false);setError('');return;}let active=true;setLoading(true);setError('');setData(null);api<T>(path).then(value=>{if(active)setData(value);}).catch(e=>{if(active){if(e instanceof ApiError&&e.status===401)router.replace('/login');setError(e instanceof Error?e.message:'조회에 실패했습니다.');}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[path,version,router]);return{data,loading,error,reload};}
export function State({loading,error,reload}:{loading:boolean;error:string;reload:()=>void}){return loading?<p role="status">불러오는 중…</p>:error?<div role="alert" className="error">{error} <button onClick={reload}>다시 시도</button></div>:null;}
