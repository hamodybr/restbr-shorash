import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const cfg = JSON.parse(readFileSync(process.env.CONNECT_CONFIG || 'connect.local.json','utf8'));
const equal = (a,b) => { const x=Buffer.from(String(a)),y=Buffer.from(String(b)); return x.length===y.length && timingSafeEqual(x,y); };
if(typeof cfg.adminCode!=='string'||cfg.adminCode.length<16||cfg.adminCode.length>256||!Array.isArray(cfg.workers)||!cfg.workers.length||cfg.workers.some(w=>typeof w.id!=='string'||! /^[a-zA-Z0-9_-]{1,40}$/.test(w.id)||typeof w.name!=='string'||typeof w.code!=='string'||w.code.length<16||w.code.length>256)||new Set(cfg.workers.map(w=>w.id)).size!==cfg.workers.length||new Set([cfg.adminCode,...cfg.workers.map(w=>w.code)]).size!==cfg.workers.length+1) throw Error('Use unique random codes of at least 16 characters and unique worker IDs.');
const page = readFileSync(new URL('./index.html',import.meta.url));
const server=createServer({key:readFileSync(cfg.key),cert:readFileSync(cfg.cert)},(req,res)=>{
  if(req.method!=='GET'||req.url!=='/'){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Permissions-Policy':'microphone=(self), camera=()','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' wss:; media-src 'self' blob:; frame-ancestors 'none'"}).end(page);
});
const wss=new WebSocketServer({noServer:true,maxPayload:128*1024});
const workers=new Map(),admins=new Set(),calls=new Map();
const send=(s,m)=>{if(s?.readyState===WebSocket.OPEN)s.send(JSON.stringify(m));};
const roster=()=>{const list=cfg.workers.map(w=>({id:w.id,name:w.name,online:workers.has(w.id)}));for(const a of admins)send(a,{type:'roster',workers:list});};
const stop=(id)=>{const c=calls.get(id);if(!c)return;calls.delete(id);send(c.admin,{type:'end',call:id});send(c.worker,{type:'end',call:id});};
server.on('upgrade',(req,socket,head)=>{
  if(req.url!=='/ws'||req.headers.origin!=='https://'+req.headers.host){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
});
wss.on('connection',s=>{
  s.alive=true; s.on('pong',()=>s.alive=true);s.on('error',()=>{});
  const authTimer=setTimeout(()=>{if(!s.role)s.close(1008,'Authentication required');},5000);
  let windowAt=Date.now(),count=0;
  s.on('message',raw=>{
    if(Date.now()-windowAt>1000){windowAt=Date.now();count=0;}if(++count>40){s.close(1008,'Rate limit');return;}
    let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
    if(!s.role){
      if(m.type!=='auth'||typeof m.code!=='string'||m.code.length>256){s.close(1008,'Denied');return;}
      if(m.role==='admin'&&equal(m.code,cfg.adminCode)){s.role='admin';admins.add(s);}
      else if(m.role==='worker'){
        const w=cfg.workers.find(w=>w.id===m.id&&equal(m.code,w.code));if(!w||workers.has(w.id)){s.close(1008,'Denied or already connected');return;}
        s.role='worker';s.id=w.id;workers.set(w.id,s);
      }else{s.close(1008,'Denied');return;}
      clearTimeout(authTimer);send(s,{type:'ready',role:s.role});roster();return;
    }
    if(s.role==='admin'){
      if(m.type==='alert'){
        const w=workers.get(m.target);if(!w){send(s,{type:'error',message:'النادل غير متصل'});return;}
        const id=randomUUID();send(w,{type:'alert',id});send(s,{type:'sent',id});return;
      }
      if(m.type==='offer'&&typeof m.sdp==='string'&&m.sdp.length<100000){
        const w=workers.get(m.target);if(!w||[...calls.values()].some(c=>c.worker===w)){send(s,{type:'error',message:'النادل غير متصل أو مشغول'});return;}
        for(const [id,c] of calls)if(c.admin===s)stop(id);
        const id=randomUUID();calls.set(id,{admin:s,worker:w});send(s,{type:'session',call:id});send(w,{type:'offer',call:id,sdp:m.sdp});return;
      }
      if(m.type==='end'&&calls.get(m.call)?.admin===s)stop(m.call);
    }else{
      if(m.type==='answer'&&typeof m.sdp==='string'&&m.sdp.length<100000&&calls.get(m.call)?.worker===s)send(calls.get(m.call).admin,{type:'answer',call:m.call,sdp:m.sdp});
      if(m.type==='end'&&calls.get(m.call)?.worker===s)stop(m.call);
    }
  });
  s.on('close',()=>{clearTimeout(authTimer);admins.delete(s);if(s.role==='worker'&&workers.get(s.id)===s)workers.delete(s.id);for(const [id,c] of calls)if(c.admin===s||c.worker===s)stop(id);roster();});
});
const heartbeat=setInterval(()=>{for(const s of wss.clients){if(!s.alive){s.terminate();continue;}s.alive=false;s.ping();}},15000);heartbeat.unref();
server.listen(cfg.port||8443,cfg.host||'0.0.0.0',()=>console.log('SHORASH CONNECT pilot HTTPS port '+(cfg.port||8443)));
