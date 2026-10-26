 'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/console-api';
import {Brand} from '@/components/console/Brand';
export default function Login(){const router=useRouter();const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
async function login(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{await api('/auth/login',{email,password});try{await api('/admin/me');}catch(e){await api('/auth/logout',{}).catch(()=>{});throw e;}router.replace('/console');}catch(e){setError(e instanceof Error?e.message:'로그인에 실패했습니다.');}finally{setBusy(false);}}
return <main className="login"><form onSubmit={login}><div className="login-brand"><Brand/></div><h1>운영 콘솔 로그인</h1><label>이메일<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" disabled={busy||!email.trim()||!password}>{busy?'로그인 중…':'로그인'}</button><p className="muted">관리자 권한이 부여된 계정만 접근할 수 있습니다.</p></form></main>;}
