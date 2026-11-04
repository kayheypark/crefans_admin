'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api,ApiError} from '@/lib/console-api';
import {authenticatorLink} from '@/lib/authenticator-launch';
import {Brand} from '@/components/console/Brand';
export default function Login(){
 const router=useRouter(),pending=useRef(false),lastAutomaticCode=useRef(''),appAttempted=useRef(false);
 const [appLink,setAppLink]=useState<string|null>(null);
 useEffect(()=>{setAppLink(authenticatorLink(navigator.userAgent,navigator.maxTouchPoints));},[]);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[second,setSecond]=useState(false),[recovery,setRecovery]=useState(false),[code,setCode]=useState(''),[recoveryCode,setRecoveryCode]=useState('');
 useEffect(()=>{if(!second||recovery||!appLink||appAttempted.current)return;appAttempted.current=true;try{window.location.assign(appLink);}catch{/* Keep code entry available if external navigation is blocked. */}},[second,recovery,appLink]);
 const ready=!second?!!email.trim()&&!!password:recovery?!!recoveryCode.trim():/^\d{6}$/.test(code);
 // Reuse the existing password + TOTP/recovery contract. A ref also guards same-tick paste/submit events.
 async function login(pastedCode?:string){
  if(pending.current||(!pastedCode&&!ready))return;
  pending.current=true;setBusy(true);setError('');
  try{await api('/admin/auth/login',!second?{email,password}:recovery?{email,password,recoveryCode:recoveryCode.trim()}:{email,password,code:pastedCode??code});router.replace('/console');}
  catch(e){if(e instanceof ApiError&&e.code==='TOTP_REQUIRED')setSecond(true);else setError(e instanceof ApiError&&e.status===429?'인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.':e instanceof Error?e.message:'로그인에 실패했습니다.');}
  finally{pending.current=false;setBusy(false);}
 }
 function updateCode(next:string){
  if(pending.current)return;
  setCode(next);setError('');
  if(next.length<6){lastAutomaticCode.current='';return;}
  if(/^\d{6}$/.test(next)&&lastAutomaticCode.current!==next){lastAutomaticCode.current=next;void login(next);}
 }
 function pasteCode(e:React.ClipboardEvent<HTMLInputElement>){
  e.preventDefault();if(pending.current)return;
  const pasted=e.clipboardData.getData('text').replace(/\s/g,'');
  if(!/^\d{6}$/.test(pasted)){setError('숫자 6자리 인증 코드를 붙여넣어 주세요.');return;}
  lastAutomaticCode.current='';updateCode(pasted);
 }
 function restart(){appAttempted.current=false;lastAutomaticCode.current='';setSecond(false);setRecovery(false);setCode('');setRecoveryCode('');setPassword('');setError('');}
 return <main className={`login${second?' login-second':''}`}><form onSubmit={e=>{e.preventDefault();void login();}} aria-busy={busy}>
  <div className="login-brand"><Brand/></div>
  {second&&<div className="login-security-icon" aria-hidden="true"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m8 12 3 3 5-6"/></svg></div>}
  <h1>{second?recovery?'복구 코드 인증':'2차 인증':'운영 콘솔 로그인'}</h1>
  {!second?<><label>이메일<input type="email" autoComplete="username" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" autoComplete="current-password" required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label></>:recovery?<><p className="muted">인증 앱을 쓸 수 없으면 등록할 때 받은 복구 코드 하나를 입력하세요. 쓴 코드는 다시 쓸 수 없습니다.</p><label>복구 코드<input autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={20} required autoFocus disabled={busy} placeholder="xxxxx-xxxxx" value={recoveryCode} onChange={e=>setRecoveryCode(e.target.value)}/></label></>:<>
   <p className="muted" id="otp-help">인증 앱에 표시된 6자리 코드를 입력해 주세요.</p>
   <label htmlFor="login-otp">인증 코드</label><div className="login-otp"><input id="login-otp" type="text" name="one-time-code" aria-describedby="otp-help" aria-invalid={!!error} inputMode="numeric" autoComplete="one-time-code" autoCapitalize="off" spellCheck={false} enterKeyHint="go" pattern="\d{6}" maxLength={6} required autoFocus readOnly={busy} value={code} onPaste={pasteCode} onChange={e=>updateCode(e.target.value.replace(/\D/g,''))}/></div>
  </>}
  {error&&<p role="alert" className="error">{error}</p>}
  <button className="primary" disabled={busy||!ready}>{busy?(second?'확인 중…':'로그인 중…'):second?'인증하고 로그인':'로그인'}</button>
  {second&&!recovery&&appLink&&<div className="login-authenticator"><a href={appLink}>Google Authenticator 열기 ↗</a></div>}
  {second&&<><div className="login-alternatives"><button type="button" disabled={busy} onClick={()=>{setRecovery(v=>!v);setError('');}}>{recovery?'인증 앱 코드 사용':'복구 코드 사용'}</button><button type="button" disabled={busy} onClick={restart}>다른 계정으로 로그인</button></div></>}
 </form></main>;
}
