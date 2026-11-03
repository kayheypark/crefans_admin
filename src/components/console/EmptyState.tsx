import type {ReactNode} from 'react';

export function EmptyState({children='내역이 없어요'}:{children?:ReactNode}){
 return <div className="empty"><svg className="empty-icon" viewBox="0 0 36 44" aria-hidden="true" focusable="false"><path className="empty-page" d="M7 1h22a6 6 0 0 1 6 6v23L22 43H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6Z"/><path className="empty-fold" d="M22 43v-7a6 6 0 0 1 6-6h7Z"/></svg><p>{children}</p></div>;
}
