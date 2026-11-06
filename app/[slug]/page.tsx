import {notFound} from 'next/navigation';
import {LanguageProvider} from '../language';
import InformationPage from '../information-page';
import {shopContent} from '../../lib/shop-content';
import {config} from '../../lib/store';
import {PAGE_TITLES} from '../../lib/shop-content-defaults';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:PAGE_TITLES[slug]?PAGE_TITLES[slug]+' — YOG':'Page not found — YOG'}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!Object.hasOwn(PAGE_TITLES,slug))notFound();const [info,settings]=await Promise.all([shopContent(),config()]);return <LanguageProvider><InformationPage slug={slug} info={info} settings={settings}/></LanguageProvider>}
