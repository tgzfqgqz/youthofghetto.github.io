import {db,requireAdmin,sameOrigin,json,failure} from '../../../../lib/store';
import {shopContent,validateContent} from '../../../../lib/shop-content';
export async function GET(){try{await requireAdmin();return Response.json(await shopContent(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);await requireAdmin();const data=await json(request),content=validateContent(data.content);await db().prepare("INSERT INTO settings(id,value) VALUES('shop_content',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(JSON.stringify(content)).run();return Response.json({ok:true,content})}catch(e){return failure(e)}}
