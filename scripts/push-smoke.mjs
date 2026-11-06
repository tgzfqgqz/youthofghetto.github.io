import assert from 'node:assert/strict';
import {createECDH,randomBytes} from 'node:crypto';
import webpush from 'web-push';
const origin='http://127.0.0.1:5173';
const sign=await fetch(origin+'/signin-with-chatgpt?return_to=/admin',{redirect:'manual'}),cookie=sign.headers.get('set-cookie').split(';')[0];
async function call(path,body,admin=false){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(admin?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
const api='/api/push/admin',sub='/api/push/subscribe';
assert.equal((await call(api)).status,403);assert.equal((await call(api,{action:'run'})).status,403);
const forged=await fetch(origin+api,{method:'POST',headers:{Cookie:cookie,Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal(forged.status,403);
const token=crypto.randomUUID()+crypto.randomUUID(),ecdh=createECDH('prime256v1');ecdh.generateKeys();const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/local-fixture-'+crypto.randomUUID(),keys:{p256dh:ecdh.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};
const payload={token,subscription,preferences:{new:true,discount:false,exclusive:true},watched:[]};
assert.equal((await call(sub,{...payload,subscription:{...subscription,endpoint:'https://127.0.0.1/private'}})).status,400,'Private network rejected');
assert.equal((await call(sub,payload)).status,200);
assert.equal((await call(sub,{...payload,token:crypto.randomUUID()+crypto.randomUUID()})).status,403,'Subscription ownership enforced');
assert.equal((await call(sub,{...payload,preferences:{new:false,discount:true},watched:['fixture']})).status,200);
// Remove synthetic endpoint before any campaign can send. No test contacts a push service.
assert.equal((await call(sub,{...payload,action:'unsubscribe'})).status,200);
const before=(await call(api,null,true)).data;assert.equal(before.subscribers.active||0,0,'This test requires an isolated database with no real subscribers');
await call(api,{action:'config',config:{new:false,discount:false,exclusive:false,restock:false}},true);
const id='push-test-'+Date.now(),p={id,title:'LOCAL NOTIFICATION TEST',description:'Local test only',category:'Test',price:20000,sale:null,photos:['/images/3azzzimodel1.jpg'],status:'draft',featured:false,exclusive:true,variants:[{size:'M',color:'Black',stock:0}]};
async function save(){const r=await call('/api/admin',{action:'product',product:p},true);assert.equal(r.status,200,JSON.stringify(r.data))}
async function campaigns(){return (await call(api,null,true)).data.campaigns.filter(c=>c.product_id===id)}
await save();assert.equal((await campaigns()).length,0,'Draft does not alert');p.status='active';await save();let list=await campaigns();assert.equal(list.length,1);assert.equal(list[0].kind,'exclusive');assert.equal(list[0].state,'draft');await save();assert.equal((await campaigns()).length,1,'Repeat save does not duplicate');p.price=25000;await save();assert.equal((await campaigns()).length,1,'Price increase does not alert');p.sale=18000;await save();list=await campaigns();assert.equal(list.length,2);assert.equal(list[0].kind,'discount');p.variants[0].stock=5;await save();list=await campaigns();assert.equal(list[0].kind,'restock');
const future=list[0];await call(api,{action:'schedule',id:future.id,due:Date.now()+86400000},true);await call(api,{action:'run'},true);assert.equal((await campaigns()).find(c=>c.id===future.id).state,'queued','Future alert not sent early');await call(api,{action:'cancel',id:future.id},true);
const send=list.find(c=>c.kind==='discount');assert.equal((await call(api,{action:'send',id:send.id},true)).status,200);assert.equal((await call(api,{action:'send',id:send.id},true)).status,400,'Cannot enqueue twice');await call(api,{action:'run'},true);assert.equal((await campaigns()).find(c=>c.id===send.id).state,'complete','Empty audience completes');
const vapid=webpush.generateVAPIDKeys(),req=webpush.generateRequestDetails(subscription,JSON.stringify({title:'Test'}),{vapidDetails:{subject:'mailto:test@example.com',...vapid},contentEncoding:'aes128gcm'});assert.ok(req.body.length>20);assert.equal(req.headers['Content-Encoding'],'aes128gcm');assert.ok(req.headers.Authorization.startsWith('vapid '));
const denied=await call('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'process_due_notifications'}});assert.equal(denied.data.result.isError,true);
p.status='draft';await save();for(const c of await campaigns())if(c.state==='draft')await call(api,{action:'cancel',id:c.id},true);await call(api,{action:'config',config:before.config},true);
console.log('PASS: subscription ownership, origin/access controls, endpoint filtering, preferences, event detection, deduplication, future scheduling, cancellation, empty-audience processing, encrypted payloads, MCP owner restriction. No real notifications sent.');
