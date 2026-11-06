import {readFile,writeFile} from 'node:fs/promises';
import webpush from 'web-push';
import sharp from 'sharp';
const file=new URL('../.dev.vars',import.meta.url);
let vars=await readFile(file,'utf8');
if(!vars.includes('PUSH_PRIVATE_KEY=')){const keys=webpush.generateVAPIDKeys();vars+='\nPUSH_PUBLIC_KEY="'+keys.publicKey+'"\nPUSH_PRIVATE_KEY="'+keys.privateKey+'"\n';await writeFile(file,vars)}
for(const size of [192,512])await sharp(new URL('../public/push-icon.svg',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')).resize(size,size).png().toFile(new URL(`../public/push-${size}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
console.log('Local-only notification keys and app icons prepared.');
