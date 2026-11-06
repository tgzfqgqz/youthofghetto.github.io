import { env } from 'cloudflare:workers';

export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB}
export const defaults={announcement:'YOUTH OF GHETTO — MADE ON THE BLOCK. WORN EVERYWHERE.',announcementEnabled:true,whatsapp:'212770876528',deliveryFee:3500,cities:'Casablanca,Rabat,Marrakech,Fès,Tanger,Agadir,Meknès,Oujda',codEnabled:true};
export async function config(){const row=await db().prepare('SELECT value FROM settings WHERE id=?').bind('store').first<{value:string}>();return row?{...defaults,...JSON.parse(row.value)}:defaults}
export async function isAdmin(){const {actor}=await import('./admin-auth');return !!await actor()}
export async function requireAdmin(){if(!await isAdmin())throw new ApiError('Admin access required. Sign in with the authorized account.',403)}
export class ApiError extends Error{constructor(message:string,public status=400){super(message)}}
export function sameOrigin(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin)throw new ApiError('Request origin rejected',403)}
export async function json(r:Request){if(Number(r.headers.get('content-length')||0)>100000)throw new ApiError('Request too large');const raw=await r.text();if(raw.length>100000)throw new ApiError('Request too large');try{return JSON.parse(raw)}catch{throw new ApiError('Invalid request')}}
export function str(x:unknown,min:number,max:number){if(typeof x!=='string'||x.trim().length<min||x.trim().length>max)throw new ApiError('Please check text fields');return x.trim()}
export function num(x:unknown,min:number,max:number){if(!Number.isSafeInteger(x)||Number(x)<min||Number(x)>max)throw new ApiError('Please check prices and quantities');return Number(x)}
export function photo(x:unknown){const v=str(x,1,180);if(!/^\/(?:images\/[\w.-]+|api\/photos\/[\w-]+)$/.test(v))throw new ApiError('Please upload a product photo');return v}
export async function catalogue(admin=false){const result=await db().prepare(admin?'SELECT * FROM products ORDER BY updated DESC':"SELECT * FROM products WHERE status != 'draft' ORDER BY featured DESC, updated DESC").all();const vs=await db().prepare('SELECT * FROM variants').all();return result.results.map((p:any)=>({...p,photos:JSON.parse(p.photos),details:JSON.parse(p.details||'{}'),variants:vs.results.filter((v:any)=>v.product_id===p.id)}))}
export function failure(e:unknown){console.error(e instanceof Error?e.message:'Request failed');return Response.json({error:e instanceof ApiError?e.message:'Unable to save changes. Please retry.'},{status:e instanceof ApiError?e.status:500})}
