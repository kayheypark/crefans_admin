// Special-term window dates for the console (KST calendar days ↔ server instants).
export const kstDay=(iso?:string|null)=>iso?new Date(new Date(iso).getTime()+9*3600000).toISOString().slice(0,10):'';
export const dayIso=(d:string)=>d===''?null:/^\d{4}-\d{2}-\d{2}$/.test(d)?new Date(`${d}T00:00:00+09:00`).toISOString():'invalid';
// 2026-11-17 user decision: special terms apply through the whole end day (확인서 '종료일까지'). The server keeps an exclusive
// end instant, so the console stores the next day 00:00 KST and shows that instant minus one day.
export const endIso=(d:string)=>{const v=dayIso(d);return v&&v!=='invalid'?new Date(new Date(v).getTime()+86400000).toISOString():v;};
export const endDay=(iso?:string|null)=>iso?kstDay(new Date(new Date(iso).getTime()-86400000).toISOString()):'';
