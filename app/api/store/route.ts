import {shopContent} from '../../../lib/shop-content';
import {heroConfig} from '../../../lib/hero';
import {catalogue,config,failure} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({products:await catalogue(),settings:await config(),hero:await heroConfig(),info:await shopContent()},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
