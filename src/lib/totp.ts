// Operator TOTP helpers (server src/platform/admin-totp*.ts). Days are counted on the Korean calendar.
const kstDay=(time:number)=>Math.floor((time+9*3600000)/86400000);
/** Calendar days (KST) until the enrollment deadline: 0 = today, negative or `null` deadline passed = blocked. */
export function graceDaysLeft(graceUntil:string,now=Date.now()):number|null{const end=new Date(graceUntil).getTime();return end<=now?null:kstDay(end)-kstDay(now);}
/** Base32 secret in 4-character blocks for typing into an authenticator app. */
export const groupSecret=(secret:string)=>secret.match(/.{1,4}/g)?.join(' ')||'';
