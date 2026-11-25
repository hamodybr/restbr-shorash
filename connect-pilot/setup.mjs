import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const path='connect.local.json';
if(existsSync(path)){console.error('Config already exists; refusing to overwrite');process.exit(1);}
const code=()=>randomBytes(18).toString('base64url');
const cfg={host:'0.0.0.0',port:8443,key:'key.pem',cert:'cert.pem',adminCode:code(),workers:[{id:'w01',name:'نادل تجريبي 1',code:code()},{id:'w02',name:'نادل تجريبي 2',code:code()}]};
writeFileSync(path,JSON.stringify(cfg,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Created connect.local.json. Open it locally to find your private login codes.');
