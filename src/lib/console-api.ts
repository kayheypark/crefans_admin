export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string,public requestId?:string){super(message);}
}
export const TOTP_REQUIRED_EVENT='crefans-admin:totp-required';
let refreshing:Promise<void>|null=null;
export async function api<T=unknown>(path:string,body?:unknown,method=body===undefined?'GET':'POST',retry=true):Promise<T>{
  if(!/^\/admin(?:\/|$)/.test(path))throw new Error('Unsupported console API');
  const res=await fetch('/api/v1'+path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await res.json().catch(()=>null);
  // A wrong TOTP code is also 401 but the session is fine: never refresh and resend the code.
  if(res.status===401&&retry&&!path.startsWith('/admin/auth/')&&data?.errorCode!=='TOTP_INVALID'){
    if(!refreshing)refreshing=api<void>('/admin/auth/refresh',{},'POST',false).finally(()=>{refreshing=null;});
    await refreshing;return api<T>(path,body,method,false);
  }
  // Past the 7-day grace the server allows only the operator's own routes; the console shell sends them to TOTP enrollment.
  if(res.status===403&&data?.errorCode==='TOTP_ENROLLMENT_REQUIRED'&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent(TOTP_REQUIRED_EVENT,{detail:data.errorMessage}));
  if(!res.ok||!data?.success)throw new ApiError(res.status,data?.errorCode||'INVALID_RESPONSE',(data?.errorMessage||'요청을 처리하지 못했습니다.')+(res.headers.get('X-Request-ID')?' (요청 ID: '+res.headers.get('X-Request-ID')+')':''),res.headers.get('X-Request-ID')||undefined);
  return data.data as T;
}
