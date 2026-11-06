import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {db,ApiError} from './store';
const COOKIE='yog_admin_session';
const encoder=new TextEncoder();
export type Actor={id:string,username:string,role:'owner'|'admin'};
export async function ownerIdentity(){const u=await getChatGPTUser();const email=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;return !!(u&&email&&u.email.toLowerCase()===email.trim().toLowerCase())}
export async function digest(text:string){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))))}
function hex(a:Uint8Array){return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)))}
export function username(value:unknown){if(typeof value!=='string'||!(/^[a-zA-Z0-9_.-]{3,32}$/).test(value))throw new ApiError('Username must be 3–32 letters, numbers, dots, hyphens or underscores.');return value.toLowerCase()}
export function password(value:unknown){if(typeof value!=='string'||value.length<14||value.length>128)throw new ApiError('Use a password or passphrase of 14–128 characters.');return value}
export async function hashPassword(value:string,salt:string){const key=await crypto.subtle.importKey('raw',encoder.encode(value),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256)))}
function equal(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
export async function verifyPassword(value:string,salt:string,hash:string){return equal(await hashPassword(value,salt),hash)}
export async function actor():Promise<Actor|null>{const token=(await cookies()).get(COOKIE)?.value;if(token&&/^[a-f0-9]{64}$/.test(token)){const row=await db().prepare('SELECT a.id,a.username,a.role FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires>? AND a.active=1').bind(await digest(token),Date.now()).first<Actor>();if(row)return row}if(await ownerIdentity())return {id:'platform-owner',username:'TheMask',role:'owner'};return null}
export async function requireOwner(){const user=await actor();if(user?.role!=='owner')throw new ApiError('Only the store owner can manage admin accounts.',403);return user}
export async function createSession(id:string,r:Request){const token=randomToken();await db().prepare('DELETE FROM admin_sessions WHERE expires<=?').bind(Date.now()).run();await db().prepare('INSERT INTO admin_sessions(token_hash,admin_id,expires) VALUES(?,?,?)').bind(await digest(token),id,Date.now()+86400000).run();return cookieHeader(token,r,86400)}
export function cookieHeader(token:string,r:Request,age:number){return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${age}${new URL(r.url).protocol==='https:'?'; Secure':''}`}
export async function logout(r:Request){const token=(await cookies()).get(COOKIE)?.value;if(token)await db().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();return cookieHeader('',r,0)}
export async function throttle(r:Request,name:string){const now=Date.now(),window=900000;const keys=[['ip:'+await digest(r.headers.get('cf-connecting-ip')||'local'),30],['user:'+await digest(name),8]] as const;for(const [key,max] of keys){const row=await db().prepare('INSERT INTO login_limits(id,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING attempts').bind(key,now+window,now,now,now+window).first<{attempts:number}>();if(!row||row.attempts>max)throw new ApiError('Too many login attempts. Please try again in 15 minutes.',429)}await db().prepare('DELETE FROM login_limits WHERE reset_at<?').bind(now-window).run()}
