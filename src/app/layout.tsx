import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'크레팬스 운영 콘솔',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
