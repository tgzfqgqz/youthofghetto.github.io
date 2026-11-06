import {db,requireAdmin,failure} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(r:Request){try{await requireAdmin();const value=Number(new URL(r.url).searchParams.get('days')||7),days=[1,7,30,90].includes(value)?value:7,now=Date.now(),since=now-days*86400000,live=now-120000,d=db();
const results=await d.batch([
d.prepare('SELECT count(DISTINCT visitor_id) visitors,count(*) sessions, count(DISTINCT CASE WHEN last_seen>=? THEN visitor_id END) active FROM visit_sessions WHERE started>=?').bind(live,since),
d.prepare('SELECT count(DISTINCT s.visitor_id) n FROM visit_sessions s WHERE s.started>=? AND EXISTS(SELECT 1 FROM visit_sessions p WHERE p.visitor_id=s.visitor_id AND p.started<s.started)').bind(since),
d.prepare("SELECT strftime('%Y-%m-%d',started/1000,'unixepoch') day,count(*) sessions,count(DISTINCT visitor_id) visitors FROM visit_sessions WHERE started>=? GROUP BY day ORDER BY day").bind(since),
d.prepare('SELECT country,city,lat,lon,count(DISTINCT visitor_id) visitors,count(DISTINCT CASE WHEN last_seen>=? THEN visitor_id END) active FROM visit_sessions WHERE started>=? GROUP BY country,city,lat,lon ORDER BY visitors DESC LIMIT 250').bind(live,since),
d.prepare('SELECT country,count(DISTINCT visitor_id) visitors,count(DISTINCT CASE WHEN last_seen>=? THEN visitor_id END) active FROM visit_sessions WHERE started>=? GROUP BY country ORDER BY visitors DESC').bind(live,since),
d.prepare('SELECT source label,count(*) value FROM visit_sessions WHERE started>=? GROUP BY source ORDER BY value DESC LIMIT 10').bind(since),
d.prepare('SELECT device label,count(*) value FROM visit_sessions WHERE started>=? GROUP BY device ORDER BY value DESC').bind(since),
d.prepare('SELECT e.kind,count(*) events,count(DISTINCT e.session_id) sessions FROM visit_events e JOIN visit_sessions s ON s.id=e.session_id WHERE s.started>=? GROUP BY e.kind').bind(since),
d.prepare("SELECT count(*) orders,COALESCE(sum(CASE WHEN status='delivered' THEN total ELSE 0 END),0) revenue,COALESCE(sum(CASE WHEN status!='cancelled' THEN total ELSE 0 END),0) orderValue, sum(CASE WHEN status='new' THEN 1 ELSE 0 END) pending FROM orders WHERE created>=?").bind(new Date(since).toISOString()),
d.prepare("SELECT json_extract(j.value,'$.title') title,sum(json_extract(j.value,'$.qty')) units FROM orders o,json_each(o.items) j WHERE o.created>=? AND o.status!='cancelled' GROUP BY title ORDER BY units DESC LIMIT 10").bind(new Date(since).toISOString()),
d.prepare("SELECT p.title,v.size,v.color,v.stock FROM variants v JOIN products p ON p.id=v.product_id WHERE p.status='active' AND v.stock<=5 ORDER BY v.stock,p.title LIMIT 20"),
d.prepare("SELECT p.title,count(*) views FROM visit_events e JOIN products p ON p.id=e.product_id WHERE e.kind='product_view' AND e.created>=? GROUP BY p.id ORDER BY views DESC LIMIT 10").bind(since),
d.prepare("SELECT count(DISTINCT o.analytics_session) n FROM orders o JOIN visit_sessions s ON s.id=o.analytics_session WHERE o.created>=? AND s.started>=? AND o.status!='cancelled'").bind(new Date(since).toISOString(),since),
d.prepare('SELECT min(started) firstTracked, count(DISTINCT CASE WHEN lat IS NULL OR lon IS NULL THEN visitor_id END) unmapped FROM visit_sessions WHERE started>=?').bind(since)
]);const rows=(i:number)=>results[i].results as any[];return Response.json({days,generatedAt:now,summary:rows(0)[0],returning:rows(1)[0].n,trend:rows(2),locations:rows(3),countries:rows(4),sources:rows(5),devices:rows(6),events:rows(7),sales:rows(8)[0],bestSellers:rows(9),lowStock:rows(10),topProducts:rows(11),converted:rows(12)[0].n,coverage:rows(13)[0]},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
