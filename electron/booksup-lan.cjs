'use strict';
// Local-only signaling for BooksUp Direct. No account, cloud, STUN or public relay.
const http=require('node:http'),os=require('node:os'),crypto=require('node:crypto');
const {ipcMain}=require('electron');
let server=null,session=null,attempts=new Map(),answer=null;
const MAX_BODY=100000;
const lanIp=ip=>/^(?:127\.0\.0\.1|::1|::ffff:127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|::ffff:10\.\d+\.\d+\.\d+|::ffff:192\.168\.\d+\.\d+|::ffff:172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(ip||'');
function hosts(){return Object.values(os.networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal&&lanIp(x.address)).map(x=>x.address)}
function close(){if(server){server.close();server=null}session=null;answer=null;attempts.clear()}
const parse=async req=>{
 let b='';for await(const part of req){b+=part.toString();if(b.length>MAX_BODY)throw Error('Too large');}
 return JSON.parse(b||'{}');
};
function respond(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function allowed(req){
 const ip=req.socket.remoteAddress||'';
 if(!lanIp(ip))return false;
 const count=attempts.get(ip)||{n:0,time:Date.now()};
 if(Date.now()-count.time>60000){count.n=0;count.time=Date.now()}
 count.n++;attempts.set(ip,count);
 return count.n<=40;
}
function authorized(req){return !!session&&Date.now()<session.expires&&new URL(req.url,'http://localhost').searchParams.get('pin')===session.pin;}
async function onRequest(req,res){
 if(!allowed(req))return respond(res,429,{error:'Local request limit'});
 if(!authorized(req))return respond(res,403,{error:'Falscher oder abgelaufener PIN'});
 const route=new URL(req.url,'http://localhost').pathname;
 if(route==='/offer'&&req.method==='GET')return respond(res,200,{offer:session.offer});
 if(route==='/answer'&&req.method==='POST'){
  try{const data=await parse(req);if(data?.answer?.type!=='answer'||typeof data.answer.sdp!=='string'||data.answer.sdp.length>80000)return respond(res,400,{error:'Ungültige WebRTC-Antwort'});
   answer=data.answer;return respond(res,200,{ok:true});
  }catch(e){return respond(res,400,{error:'Ungültige Antwort'});}
 }
 respond(res,404,{error:'Not found'});
}
function registerLan(validate){
 const guard=e=>{if(typeof validate==='function')validate(e)};
 ipcMain.handle('booksup-lan:start',async(event,offer)=>{
  guard(event);
  if(offer?.type!=='offer'||typeof offer.sdp!=='string'||offer.sdp.length>80000)throw Error('WebRTC-Angebot fehlt');
  close();
  const pin=String(crypto.randomInt(0,1000000)).padStart(6,'0');
  session={pin,offer,expires:Date.now()+8*60000};
  server=http.createServer((req,res)=>{void onRequest(req,res).catch(()=>respond(res,500,{error:'Local error'}))});
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'0.0.0.0',resolve)})}
  catch(e){close();throw e}
  return {pin,port:server.address().port,ips:hosts(),expires:session.expires};
 });
 ipcMain.handle('booksup-lan:poll',async event=>{guard(event);return answer});
 ipcMain.handle('booksup-lan:stop',async event=>{guard(event);close();return true});
 ipcMain.handle('booksup-lan:signal',async(event,args)=>{
  guard(event);
  const ip=String(args?.ip||''),port=Number(args?.port),pin=String(args?.pin||'');
  if(!lanIp(ip)||!/^\d{6}$/.test(pin)||!Number.isInteger(port)||port<1024||port>65535)throw Error('Bitte lokale IP, Port und sechsstelligen PIN prüfen.');
  const action=args?.action==='answer'?'answer':'offer';
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),13000);
  try{
   const endpoint='http://'+ip+':'+port+'/'+action+'?pin='+encodeURIComponent(pin);
   const response=await fetch(endpoint,{method:action==='offer'?'GET':'POST',headers:action==='answer'?{'Content-Type':'application/json'}:{},body:action==='answer'?JSON.stringify({answer:args.answer}):undefined,signal:ctrl.signal});
   if(!response.ok)throw Error('Verbindung abgelehnt (HTTP '+response.status+')');
   return await response.json();
  }finally{clearTimeout(timeout)}
 });
}
module.exports={registerLan,close};