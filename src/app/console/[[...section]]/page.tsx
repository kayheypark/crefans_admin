import {notFound} from 'next/navigation';
import {Console} from '@/components/console/Console';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const resolved=await params;const section=resolved.section?.[0]||'overview';if((resolved.section?.length||0)>1||!['overview','members','invites','content','revenue','advertising','beans','support','settings','logs','operators','me'].includes(section))notFound();return <Console section={section}/>;}
