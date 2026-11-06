import {db,requireAdmin,failure} from '../../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 await requireAdmin();const params=new URL(request.url).searchParams,rawDays=Number(params.get('days')||7),days=[1,7,30,90].includes(rawDays)?rawDays:7;
 const device=['Mobile','Desktop','Tablet'].includes(params.get('device')||'')?params.get('device')!:'all',ordered=['yes','no'].includes(params.get('ordered')||'')?params.get('ordered')!:'all';
 const rawPage=Number(params.get('page')||1),requested=Number.isSafeInteger(rawPage)&&rawPage>0?Math.min(rawPage,100000):1,size=20,now=Date.now(),since=now-days*86400000,d=db();
 const conditions=['s.started>=?'],values:(string|number)[]=[since];if(device!=='all'){conditions.push('s.device=?');values.push(device)}
 if(ordered!=='all')conditions.push(`${ordered==='no'?'NOT ':''}EXISTS(SELECT 1 FROM orders o WHERE o.analytics_session=s.id)`);
 const where=conditions.join(' AND '),count=await d.prepare(`SELECT count(*) total FROM visit_sessions s WHERE ${where}`).bind(...values).first<{total:number}>(),total=count?.total||0,pages=Math.max(1,Math.ceil(total/size)),page=Math.min(requested,pages);
 const visits=(await d.prepare(`SELECT s.id,s.visitor_id,s.started,s.last_seen,s.device,s.country,s.city,s.source,(SELECT count(*) FROM orders o WHERE o.analytics_session=s.id) order_count FROM visit_sessions s WHERE ${where} ORDER BY s.started DESC,s.id DESC LIMIT ? OFFSET ?`).bind(...values,size,(page-1)*size).all<any>()).results;
 const orders=visits.length?await d.batch(visits.map(s=>d.prepare('SELECT id,created,status,total,items FROM orders WHERE analytics_session=? ORDER BY created DESC LIMIT 10').bind(s.id))):[];
 return Response.json({generatedAt:now,timezone:'Africa/Casablanca',total,page,pages,pageSize:size,visits:visits.map((s,i)=>({visit:s.id.slice(0,16),visitor:s.visitor_id.slice(0,12),started:s.started,lastSeen:s.last_seen,active:s.last_seen>=now-120000,device:s.device,country:s.country,city:s.city,source:s.source,orderCount:s.order_count,orders:(orders[i]?.results||[]).map((o:any)=>({reference:o.id,created:o.created,status:o.status,total:o.total,items:JSON.parse(o.items).map((item:any)=>({title:item.title,size:item.size,color:item.color,qty:item.qty}))}))}))},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error)}}
