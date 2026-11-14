'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/console-api';
import {useData,State} from './ConsoleData';
import {ConsoleIcon} from './ConsoleIcon';
import {TotpSection,type TotpStatus} from './Totp';
import {useConfirm} from './TypedConfirm';

export type Permissions=Record<string,Record<string,boolean>>;
type Operator={id:string;name:string;email:string;phone:string;role:string;isActive:boolean;mustChangePassword:boolean;lastLogin:string|null;createdAt:string;permissions:Permissions};

// Mirrors server ADMIN_MENUS: only actions that exist on each menu can be granted.
export const permissionMenus:[string,string,Record<string,string>][]=[
 ['shop','상점',{view:'상품·구매·사용·환불 조회',create:'상품 등록',update:'상품·노출·판매 수정',delete:'상품 소프트 삭제'}],
 ['advertising','광고상품',{view:'상품·주문 조회',create:'상품 등록',update:'상품·노출·판매 수정',delete:'상품 소프트 삭제'}],
 ['overview','대시보드',{view:'지표 조회'}],
 ['members','회원·크리에이터',{view:'목록·개별 조건·제한 이력·AI 사진 편집 허용 목록 조회',update:'인증 배지·광고 노출·이용 제한·AI 사진 편집 허용/해제·개별 조건 변경(조건은 운영 설정 변경 권한도 필요)'}],
 ['reserved-handles','예약 핸들 관리',{view:'목록·사용 여부·변경 이력 조회',create:'후보·예약 등록',update:'후보 수정·예약·해제·복구',delete:'예약 핸들 삭제'}],
 ['invites','초대 회원',{view:'초대 목록 조회',create:'초대 등록',update:'초대 메모·조건 수정',delete:'초대 취소'}],
 ['referrals','레퍼럴 관리',{view:'레퍼럴 목록 조회',create:'회원 레퍼럴 링크 생성',update:'친구 초대 보상 켜기·끄기'}],
 ['content','콘텐츠·신고',{view:'게시물·신고·활동 분야·조치 이력 조회',create:'활동 분야 추가',update:'신고 처리·게시물 숨김·활동 분야 상태 변경'}],
 ['revenue','매출·정산',{view:'매출·결제·출금 조회',create:'PG 입금 대사 기록'}],
 ['beans','콩 후원·출금',{view:'지표·지갑 조회',create:'프로모션콩 지급·입금 대사',update:'출금 승인·반려'}],
 ['support','고객지원',{view:'문의·공지 조회',create:'공지·FAQ 작성',update:'문의 답변·문서 수정'}],
 ['settings','운영 설정',{view:'금융 정책 조회',update:'금융 정책 변경'}],
 ['logs','운영 로그',{view:'로그 조회'}],
];
const actions:[string,string][]=[['view','입장(조회)'],['create','생성'],['update','수정'],['delete','삭제']];
export const roleLabel=(role:string)=>role==='SUPER_ADMIN'?'최고관리자':'부운영자';
const date=(v:string|null)=>v?new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'없음';

export function PermissionTable({value,onChange}:{value:Permissions;onChange?:(next:Permissions)=>void}){
 function toggle(menu:string,action:string,on:boolean){
  const row={...(value[menu]||{})};
  if(action==='view'&&!on){onChange?.({...value,[menu]:{}});return;}
  row[action]=on;if(on)row.view=true;
  onChange?.({...value,[menu]:row});
 }
 return <div className="table-wrap"><table className="permission-table"><thead><tr><th>메뉴</th>{actions.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>{permissionMenus.map(([menu,label,allowed])=><tr key={menu}><th scope="row">{label}</th>{actions.map(([action,actionLabel])=><td key={action}>{allowed[action]?(onChange?<label className="perm-cell" title={allowed[action]}><input type="checkbox" aria-label={`${label} ${actionLabel}`} checked={value[menu]?.[action]===true} onChange={e=>toggle(menu,action,e.target.checked)}/><span>{allowed[action]}</span></label>:<span className={value[menu]?.[action]?'perm-on':'perm-off'} title={allowed[action]}>{value[menu]?.[action]?'허용':'—'}</span>):<span className="perm-na" title="이 메뉴에는 해당 기능이 없습니다">해당 없음</span>}</td>)}</tr>)}</tbody></table></div>;
}

function TemporaryPassword({email,password,onClose}:{email:string;password:string;onClose:()=>void}){
 const [copied,setCopied]=useState(false);
 return <div className="temp-password" role="status"><p><strong>{email}</strong>의 임시 비밀번호입니다. 이 화면을 닫으면 다시 볼 수 없습니다. 안전한 경로로 직접 전달하세요. 첫 로그인 때 비밀번호를 바꿔야 합니다.</p><code>{password}</code><div className="actions"><button type="button" onClick={()=>{void navigator.clipboard?.writeText(password).then(()=>setCopied(true));}}>{copied?'복사됨':'복사'}</button><button type="button" className="primary" onClick={onClose}>확인했습니다</button></div></div>;
}

export function Operators({selfId}:{selfId:string}){
 const state=useData<Operator[]>('/admin/operators'),confirmAction=useConfirm(),[creating,setCreating]=useState(false),[editing,setEditing]=useState<Operator|null>(null),[issued,setIssued]=useState<{email:string;password:string}|null>(null),[message,setMessage]=useState('');
 async function act(op:Operator,kind:'reset'|'deactivate'|'activate'){
  const ask={reset:{title:'임시 비밀번호 재발급',message:`${op.name}의 임시 비밀번호를 다시 발급할까요? 기존 로그인은 모두 종료됩니다.`,actionLabel:'재발급',danger:true},
   deactivate:{title:'운영자 비활성화',message:`${op.name}을(를) 비활성화할까요? 즉시 로그인이 종료되고 콘솔에 들어올 수 없습니다.`,actionLabel:'비활성화',danger:true},
   activate:{title:'운영자 활성화',message:`${op.name}을(를) 다시 활성화할까요?`,actionLabel:'활성화'}}[kind];
  if(!await confirmAction(ask))return;setMessage('');
  try{if(kind==='reset'){const r=await api<{temporaryPassword:string}>(`/admin/operators/${op.id}/password-reset`,{});setIssued({email:op.email,password:r.temporaryPassword});}else if(kind==='deactivate')await api(`/admin/operators/${op.id}`,undefined,'DELETE');else await api(`/admin/operators/${op.id}`,{isActive:true},'PUT');state.reload();}catch(e){setMessage((e as Error).message);}
 }
 return <div className="operators">
  {issued&&<TemporaryPassword {...issued} onClose={()=>setIssued(null)}/>}
  <section><div className="section-head"><h2>운영자</h2><button type="button" className="primary" onClick={()=>{setEditing(null);setCreating(true);}}><ConsoleIcon name="plus"/>부운영자 추가</button></div>
   <p className="muted">최고관리자는 모든 메뉴를 사용할 수 있습니다. 부운영자는 아래 권한표에서 허용한 메뉴와 기능만 사용할 수 있고, 운영자·권한 관리는 최고관리자만 할 수 있습니다.</p>
   {message&&<p role="alert" className="error">{message}</p>}<State {...state}/>
   {state.data&&<div className="table-wrap"><table><thead><tr><th>이름</th><th>이메일</th><th>전화번호</th><th>종류</th><th>상태</th><th>마지막 로그인</th><th>관리</th></tr></thead><tbody>{state.data.map(op=><tr key={op.id}><td>{op.name}{op.id===selfId&&<small> (나)</small>}</td><td>{op.email}</td><td>{op.phone||'—'}</td><td>{roleLabel(op.role)}</td><td>{!op.isActive?'비활성':op.mustChangePassword?'비밀번호 변경 대기':'활성'}</td><td>{date(op.lastLogin)}</td><td>{op.role==='SUPER_ADMIN'||op.id===selfId?<span className="muted">—</span>:<div className="actions">{op.isActive?<><button type="button" onClick={()=>{setCreating(false);setEditing(op);}}>권한 편집</button><button type="button" onClick={()=>void act(op,'reset')}>임시 비밀번호 재발급</button><button type="button" className="danger" onClick={()=>void act(op,'deactivate')}>비활성화</button></>:<button type="button" onClick={()=>void act(op,'activate')}>다시 활성화</button>}</div>}</td></tr>)}</tbody></table></div>}
  </section>
  {creating&&<OperatorForm onDone={r=>{setCreating(false);if(r)setIssued(r);state.reload();}}/>}
  {editing&&<OperatorForm key={editing.id} operator={editing} onDone={()=>{setEditing(null);state.reload();}}/>}
 </div>;
}

function OperatorForm({operator,onDone}:{operator?:Operator;onDone:(issued?:{email:string;password:string})=>void}){
 const [name,setName]=useState(operator?.name||''),[email,setEmail]=useState(operator?.email||''),[phone,setPhone]=useState(operator?.phone||''),[permissions,setPermissions]=useState<Permissions>(operator?.permissions||{overview:{view:true}}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{if(operator){await api(`/admin/operators/${operator.id}`,{name,phone,permissions},'PUT');onDone();}else{const r=await api<{temporaryPassword:string}>('/admin/operators',{name,email,phone,permissions});onDone({email,password:r.temporaryPassword});}}
  catch(err){setError((err as Error).message);}finally{setBusy(false);}
 }
 return <section><h2>{operator?`${operator.name} 권한 편집`:'부운영자 추가'}</h2><form className="editor wide" onSubmit={save}>
  <div className="form-grid"><label>이름<input required maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><label>이메일 (로그인 ID)<input type="email" required maxLength={191} value={email} disabled={!!operator} onChange={e=>setEmail(e.target.value)} autoComplete="off"/></label><label>전화번호<input type="tel" maxLength={20} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000"/></label></div>
  <h3>메뉴별 권한</h3><p className="muted">입장(조회)을 끄면 그 메뉴의 다른 권한도 함께 꺼집니다. 생성·수정을 켜면 입장(조회)이 함께 켜집니다.</p>
  <PermissionTable value={permissions} onChange={setPermissions}/>
  {!operator&&<p className="notice">저장하면 임시 비밀번호가 한 번만 표시됩니다. 메일은 발송되지 않으니 직접 전달하세요.</p>}
  <div className="actions"><button type="button" onClick={()=>onDone()}>취소</button><button className="primary" disabled={busy||!name.trim()||(!operator&&!email.trim())}>{busy?'저장 중…':operator?'권한 저장':'계정 만들기'}</button></div>
  {error&&<p role="alert" className="error">{error}</p>}
 </form></section>;
}

export function PasswordForm({forced,onChanged}:{forced?:boolean;onChanged?:()=>void}){
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[again,setAgain]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const mismatch=again!==''&&next!==again,valid=current&&next.length>=10&&next===again;
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{await api('/admin/me/password',{currentPassword:current,newPassword:next});setCurrent('');setNext('');setAgain('');setMessage('비밀번호를 변경했습니다. 다른 기기의 로그인은 종료되었습니다.');onChanged?.();}catch(err){setError((err as Error).message);}finally{setBusy(false);}}
 return <section><h2>{forced?'임시 비밀번호 변경':'비밀번호 변경'}</h2>{forced&&<p className="notice">임시 비밀번호로 로그인했습니다. 새 비밀번호로 바꾼 뒤 메뉴를 사용할 수 있습니다.</p>}<form className="editor" onSubmit={save}><label>현재 비밀번호<input type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)}/></label><label>새 비밀번호 (10자 이상)<input type="password" autoComplete="new-password" required minLength={10} value={next} onChange={e=>setNext(e.target.value)}/></label><label>새 비밀번호 확인<input type="password" autoComplete="new-password" required value={again} onChange={e=>setAgain(e.target.value)} aria-invalid={mismatch||undefined}/></label>{mismatch&&<p role="alert" className="error">새 비밀번호가 서로 다릅니다.</p>}<button className="primary" disabled={busy||!valid}>{busy?'변경 중…':'비밀번호 변경'}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}</form></section>;
}

export function MyPage({onLogout,onProfileChanged,totp}:{onLogout:()=>void;onProfileChanged:()=>void;totp?:TotpStatus}){
 const state=useData<Operator>('/admin/me/profile'),[name,setName]=useState(''),[phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(state.data){setName(state.data.name);setPhone(state.data.phone);}},[state.data]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{await api('/admin/me/profile',{name,phone},'PUT');setMessage('저장했습니다.');state.reload();onProfileChanged();}catch(err){setError((err as Error).message);}finally{setBusy(false);}}
 return <div className="mypage"><State {...state}/>{state.data&&<>
  <section className="profile-card"><span className="avatar-default large" aria-hidden="true"><ConsoleIcon name="user"/></span><div><strong>{state.data.name}</strong><small>{roleLabel(state.data.role)} · {state.data.email}</small><small>마지막 로그인 {date(state.data.lastLogin)}</small></div></section>
  <section><h2>내 정보</h2><form className="editor" onSubmit={save}><label>이름<input required maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><label>이메일 (로그인 ID)<input value={state.data.email} disabled/></label><label>전화번호<input type="tel" maxLength={20} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000"/></label><label>운영자 종류<input value={roleLabel(state.data.role)} disabled/></label><button className="primary" disabled={busy||!name.trim()||(name===state.data.name&&phone===state.data.phone)}>{busy?'저장 중…':'저장'}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}</form></section>
  <PasswordForm/>
  {totp&&<TotpSection totp={totp} onChanged={onProfileChanged}/>}
  <section><h2>내 권한</h2><PermissionTable value={state.data.permissions}/></section>
  <button type="button" className="logout-button" onClick={onLogout}><ConsoleIcon name="logout"/>로그아웃</button>
 </>}</div>;
}
