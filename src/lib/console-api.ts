export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string,public requestId?:string){super(message);}
}
let refreshing:Promise<void>|null=null;
export async function api<T=unknown>(path:string,body?:unknown,method=body===undefined?'GET':'POST',retry=true):Promise<T>{
  if(!/^\/(admin(?:\/|$)|auth\/(?:login|logout|refresh)$)/.test(path))throw new Error('Unsupported console API');
  const res=await fetch('/api/v1'+path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await res.json().catch(()=>null);
  if(res.status===401&&retry&&path.startsWith('/admin')){
    if(!refreshing)refreshing=api<void>('/auth/refresh',{},'POST',false).finally(()=>{refreshing=null;});
    await refreshing;return api<T>(path,body,method,false);
  }
  if(!res.ok||!data?.success)throw new ApiError(res.status,data?.errorCode||'INVALID_RESPONSE',(data?.errorMessage||'요청을 처리하지 못했습니다.')+(res.headers.get('X-Request-ID')?' (요청 ID: '+res.headers.get('X-Request-ID')+')':''),res.headers.get('X-Request-ID')||undefined);
  return data.data as T;
}
