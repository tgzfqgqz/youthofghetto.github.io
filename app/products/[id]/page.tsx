import {notFound} from 'next/navigation';
import Shop from '../../shop';
import {LanguageProvider} from '../../language';
import {catalogue,config,db} from '../../../lib/store';
import {shopContent} from '../../../lib/shop-content';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params,p=await db().prepare("SELECT title,description,photos FROM products WHERE id=? AND status!='draft'").bind(id).first<any>();return p?{title:p.title+' — YOG',description:p.description.slice(0,160),openGraph:{title:p.title+' — YOG',description:p.description.slice(0,160),images:JSON.parse(p.photos)}}:{title:'Product not found — YOG'}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const [products,settings,info]=await Promise.all([catalogue(),config(),shopContent()]);if(!products.some((p:any)=>p.id===id))notFound();return <LanguageProvider><Shop productId={id} initialData={{products,settings,info}}/></LanguageProvider>}
