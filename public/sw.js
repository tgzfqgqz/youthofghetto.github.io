self.addEventListener('push',event=>{
 let data={};try{data=event.data.json()}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'YOG — new drop',{body:data.body||'See what’s new at YOG.',icon:'/push-192.png',badge:'/push-192.png',tag:data.id||'yog-update',data:{url:data.url||'/'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();let url=new URL(event.notification.data?.url||'/',self.location.origin);if(url.origin!==self.location.origin)url=new URL('/',self.location.origin);
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const window of windows){if(new URL(window.url).origin===url.origin){await window.navigate(url.href);return window.focus()}}return clients.openWindow(url.href)}));
});
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));
