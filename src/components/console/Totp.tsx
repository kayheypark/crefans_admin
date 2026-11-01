'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {api,ApiError} from '@/lib/console-api';
import {graceDaysLeft,groupSecret} from '@/lib/totp';
import {ConfirmDialog} from './TypedConfirm';
import {useSnackbar} from './Snackbar';

export type TotpStatus={enabled:boolean;graceUntil:string|null;recoveryCodesLeft:number};
const BLOCKED='2차 인증(OTP)을 등록해야 콘솔을 쓸 수 있습니다.';
const kst=(v:string)=>new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'});

// Shown in the console shell until the operator enrolls; `blocked` is the server's TOTP_ENROLLMENT_REQUIRED message.
export function TotpBanner({totp,blocked}:{totp:TotpStatus;blocked:string}){
 const days=totp.graceUntil?graceDaysLeft(totp.graceUntil):undefined;
 const text=blocked||days===null?blocked||BLOCKED:days===undefined?'2차 인증(OTP)을 등록해 주세요.':days===0?'오늘 안에 2차 인증을 등록해야 합니다.':`${days}일 안에 2차 인증을 등록해야 합니다.`;
 return <div className="notice totp-banner" role={blocked||days===null?'alert':'status'}><strong>{text}</strong>{totp.graceUntil&&days!==null&&!blocked&&<span> 기한 {kst(totp.graceUntil)} (한국 시간). 이후에는 등록 전까지 마이페이지만 쓸 수 있습니다.</span>} <Link href="/console/me#totp">2차 인증 등록하기</Link></div>;
}

export function TotpSection({totp,onChanged}:{totp:TotpStatus;onChanged:()=>void}){
 const snackbar=useSnackbar(),ref=useRef<HTMLElement>(null),[setup,setSetup]=useState<{secret:string;otpauthUri:string}|null>(null),[code,setCode]=useState(''),[codes,setCodes]=useState<string[]|null>(null),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(location.hash==='#totp')ref.current?.scrollIntoView({block:'start'});},[]);
 async function start(){setBusy(true);setError('');try{setSetup(await api<{secret:string;otpauthUri:string}>('/admin/me/totp/setup',{}));setCode('');}catch(e){if(e instanceof ApiError&&e.code==='TOTP_ALREADY_ENABLED')onChanged();setError((e as Error).message);}finally{setBusy(false);}}
 async function enable(e:React.FormEvent){e.preventDefault();if(!/^\d{6}$/.test(code))return;setBusy(true);setError('');try{const result=await api<{message:string;recoveryCodes:string[]}>('/admin/me/totp/enable',{code});setSetup(null);setCode('');setSaved(false);setCodes(result.recoveryCodes);}catch(err){if(err instanceof ApiError&&err.code==='TOTP_SETUP_REQUIRED')setSetup(null);setError((err as Error).message);}finally{setBusy(false);}}
 async function copy(){try{await navigator.clipboard.writeText(codes!.join('\n'));snackbar('복구 코드를 복사했습니다.');}catch{snackbar('복사하지 못했습니다. 코드를 직접 옮겨 적어 주세요.');}}
 // The codes are never shown again: the dialog only closes once the operator confirms they stored them.
 function close(){if(!saved)return;setCodes(null);onChanged();}
 return <section id="totp" ref={ref}><h2>2차 인증(OTP)</h2>
  {totp.enabled&&!codes?<p><strong>사용 중</strong> · 남은 복구 코드 {totp.recoveryCodesLeft}개</p>:<>
   <p className="notice">로그인할 때 비밀번호와 함께 휴대폰 인증 앱(Google Authenticator 등)에 표시되는 6자리 코드를 확인합니다. 개인정보의 안전성 확보조치 기준에 따라 콘솔에 접속하는 운영자는 2차 인증을 사용해야 합니다.</p>
   {!setup?<button type="button" className="primary" disabled={busy} onClick={()=>void start()}>{busy?'준비 중…':'등록 시작'}</button>:<form className="editor" onSubmit={enable}>
    <p>인증 앱에서 &lsquo;설정 키 입력&rsquo;을 고르고 아래 키를 입력하세요(시간 기준).</p>
    <dl className="totp-setup"><dt>설정 키</dt><dd><code aria-label="설정 키">{groupSecret(setup.secret)}</code></dd><dt>otpauth 주소</dt><dd><code className="totp-uri">{setup.otpauthUri}</code></dd></dl>
    <label>인증 코드 6자리<input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
    <button className="primary" disabled={busy||!/^\d{6}$/.test(code)}>{busy?'확인 중…':'인증하고 켜기'}</button>
   </form>}
  </>}
  {error&&<p role="alert" className="error">{error}</p>}
  {codes&&<ConfirmDialog title="복구 코드" onCancel={close}>
   <p className="notice">휴대폰을 잃어버렸을 때 인증 코드 대신 한 번씩 쓸 수 있는 코드입니다. <strong>지금 한 번만 보여 드립니다.</strong> 비밀번호 관리자 등 안전한 곳에 보관하고 다른 사람과 공유하지 마세요.</p>
   <ol className="recovery-codes">{codes.map(c=><li key={c}><code>{c}</code></li>)}</ol>
   <button type="button" onClick={()=>void copy()}>복구 코드 복사</button>
   <label className="check"><input type="checkbox" checked={saved} onChange={e=>setSaved(e.target.checked)}/>복구 코드를 안전한 곳에 보관했습니다.</label>
   <div className="actions dialog-actions"><button type="button" className="primary" disabled={!saved} onClick={close}>닫기</button></div>
  </ConfirmDialog>}
 </section>;
}
