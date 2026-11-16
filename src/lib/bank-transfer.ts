// Bank transfer (무통장입금) console helpers (2026-11-16). Times the operator types are Korean time (KST, no DST),
// whatever the browser's own time zone is, so datetime-local values are read and written as +09:00.
export const KIND_LABELS:Record<string,string>={bean:'콩 충전','ai-shop':'AI 이용권',ad:'광고상품'};
export const CASH_RECEIPT_LABELS:Record<string,string>={income:'소득공제',expense:'지출증빙'};
const KST_MS=9*3600000;

/** `YYYY-MM-DDTHH:mm` in KST, for a datetime-local value or max. */
export function kstInput(at:Date=new Date()){return new Date(at.getTime()+KST_MS).toISOString().slice(0,16);}

/** Reads a datetime-local value as KST and returns ISO (UTC); null when it is not a complete date and time. */
export function kstInputToIso(value:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
 const at=new Date(value+':00+09:00');
 return Number.isFinite(at.getTime())&&kstInput(at)===value?at.toISOString():null;
}

/** Deposit deadline left, e.g. '3시간 5분 남음'; null once it has passed. */
export function timeLeft(expiresAt:string,now:number){
 const ms=new Date(expiresAt).getTime()-now;if(!(ms>0))return null;
 const minutes=Math.ceil(ms/60000),h=Math.floor(minutes/60),m=minutes%60;
 return `${h?`${h}시간 `:''}${m}분 남음`;
}

/** A refund still waiting for the transfer after its due time (3 business days, 전자상거래법 제18조). */
export function refundOverdue(row:{status:string;dueAt:string|null},now:number){
 return row.status==='requested'&&!!row.dueAt&&new Date(row.dueAt).getTime()<now;
}
