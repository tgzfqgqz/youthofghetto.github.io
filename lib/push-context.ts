import {AsyncLocalStorage} from 'node:async_hooks';
const store=new AsyncLocalStorage<(promise:Promise<unknown>)=>void>();
export function withPushTasks<T>(wait:(promise:Promise<unknown>)=>void,run:()=>T){return store.run(wait,run)}
export function queueBackground(task:()=>Promise<unknown>){const wait=store.getStore();if(wait)wait(task().catch(()=>{}));}
