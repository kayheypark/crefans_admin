'use client';
import {useEffect} from 'react';
import {reportBrowserError} from '@/lib/browser-errors';
export default function ConsoleError({error,reset}:{error:Error;reset:()=>void}){
 useEffect(()=>reportBrowserError(error),[error]);
 return <section className="error" role="alert"><h2>화면을 불러오지 못했습니다.</h2><button onClick={reset}>다시 시도</button></section>;
}
