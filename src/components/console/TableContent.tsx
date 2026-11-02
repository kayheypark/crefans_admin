import type {ReactNode} from 'react';

/** Keep populated rows during refresh; show no-data only after a successful empty response. */
export function TableContent({count,pending=false,emptyMessage,children}:{count:number;pending?:boolean;emptyMessage:string;children:ReactNode}){
 return count>0?<>{children}</>:pending?null:<p className="empty">{emptyMessage}</p>;
}
