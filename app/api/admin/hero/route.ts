import {db,requireAdmin,sameOrigin,json,failure} from '../../../../lib/store';
import {heroConfig,validateHero} from '../../../../lib/hero';
export async function GET(){try{await requireAdmin();return Response.json(await heroConfig(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);await requireAdmin();const data=await json(request),hero=await validateHero(data.hero);await db().prepare("INSERT INTO settings(id,value) VALUES('homepage_hero',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(JSON.stringify(hero)).run();return Response.json({ok:true,hero})}catch(e){return failure(e)}}
