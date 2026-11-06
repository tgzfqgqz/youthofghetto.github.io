import {AsyncLocalStorage} from 'node:async_hooks';
export type VisitorGeo={country:string,city:string,lat:number|null,lon:number|null};
const context=new AsyncLocalStorage<VisitorGeo>();
export function normalizeGeo(cf:any):VisitorGeo{const coord=(v:unknown,min:number,max:number)=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?Math.round(n*10)/10:null};return {country:typeof cf?.country==='string'&&/^[A-Z]{2}$/.test(cf.country)?cf.country:'Unknown',city:typeof cf?.city==='string'?cf.city.slice(0,100):'Unknown',lat:coord(cf?.latitude,-90,90),lon:coord(cf?.longitude,-180,180)}}
export function withVisitorGeo<T>(cf:unknown,run:()=>T){return context.run(normalizeGeo(cf),run)}
export function visitorGeo(){return context.getStore()||normalizeGeo(null)}
