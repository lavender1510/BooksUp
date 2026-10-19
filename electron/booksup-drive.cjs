'use strict';
// Desktop companion for the existing BooksUp Google Drive appDataFolder sync.
// OAuth PKCE in the system browser. Refresh tokens remain encrypted using Electron safeStorage.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {app,safeStorage,shell}=require('electron');
const TOKEN_URI='https://oauth2.googleapis.com/token';
const APP_FOLDER='https://www.googleapis.com/auth/drive.appdata';
const ORIGINS=new Set(['https://www.googleapis.com']);
let session=null,loginActive=false;
function credentialsPath(){return path.join(app.getPath('userData'),'booksup-google-drive.credential')}
async function clientId(){
  const pathToFile=path.resolve(__dirname,'../www/cloud-drive-config.js');
  const source=await fs.readFile(pathToFile,'utf8');
  // Public OAuth desktop client identifier only – never store client secrets.
  const match=source.match(/BOOKSUP_GOOGLE_DESKTOP_CLIENT_ID\s*=\s*['"]([a-zA-Z0-9._-]+\.apps\.googleusercontent\.com)['"]/);
  if(!match)throw Error('Google Desktop OAuth Client-ID fehlt in www/cloud-drive-config.js.');
  return match[1];
}
async function saveRefresh(token){
  if(!token)return;
  if(!safeStorage.isEncryptionAvailable())throw Error('Windows Credential-Verschlüsselung ist nicht verfügbar.');
  await fs.writeFile(credentialsPath(),safeStorage.encryptString(token),{mode:0o600});
}
async function savedRefresh(){
  if(!safeStorage.isEncryptionAvailable())return null;
  try{return safeStorage.decryptString(await fs.readFile(credentialsPath()))}catch{return null}
}
async function tokenRequest(body){
  const res=await fetch(TOKEN_URI,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(15000)});
  const data=await res.json();
  if(!res.ok||!data.access_token)throw Error('Google Anmeldung: '+String(data.error_description||data.error||res.status));
  return data;
}
async function refresh(){
  const key=session?.refresh||await savedRefresh();
  if(!key)throw Error('Bitte zuerst Google Drive verbinden.');
  const data=await tokenRequest({client_id:await clientId(),grant_type:'refresh_token',refresh_token:key});
  session={access:data.access_token,expires:Date.now()+(Number(data.expires_in)||3500)*1000,refresh:data.refresh_token||key,email:session?.email||''};
  if(data.refresh_token)await saveRefresh(data.refresh_token);
  return session.access;
}
async function access(){
  if(session?.access&&session.expires>Date.now()+60000)return session.access;
  return refresh();
}
async function profile(accessToken){
  try {
    const res=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(9000)});
    return res.ok?String((await res.json()).email||''):'';
  }catch{return ''}
}
async function login(){
  if(loginActive)throw Error('Google-Anmeldung läuft bereits.');
  loginActive=true;
  let server;
  try{
    const id=await clientId(),state=crypto.randomBytes(24).toString('base64url');
    const verifier=crypto.randomBytes(50).toString('base64url'),challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
    const callback=new Promise((resolve,reject)=>{
      server=http.createServer((req,res)=>{
        try{
          const uri=new URL(req.url,'http://127.0.0.1');
          if(uri.pathname!=='/booksup/google/callback')throw Error('Invalid callback path');
          if(uri.searchParams.get('state')!==state)throw Error('OAuth state mismatch');
          const code=uri.searchParams.get('code'),error=uri.searchParams.get('error');
          res.writeHead(code?200:400,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
          res.end(code?'<html><meta charset="utf-8"><body><h2>BooksUp ist mit Google verbunden.</h2><p>Dieses Fenster kannst du schließen.</p></body></html>':'<html><meta charset="utf-8"><body>BooksUp OAuth Fehler</body></html>');
          if(!code)reject(Error(error||'Google-Anmeldung abgebrochen'));else resolve(code);
        }catch(e){res.writeHead(400);res.end('Invalid OAuth callback');reject(e)}
      });
      server.once('error',reject);
      server.listen(0,'127.0.0.1');
    });
    await new Promise((resolve,reject)=>{if(server.listening)resolve();else{server.once('listening',resolve);server.once('error',reject)}});
    const redirect='http://127.0.0.1:'+server.address().port+'/booksup/google/callback';
    const query=new URLSearchParams({client_id:id,redirect_uri:redirect,response_type:'code',
      scope:APP_FOLDER+' openid email',state,code_challenge:challenge,code_challenge_method:'S256',
      access_type:'offline',prompt:'consent'});
    await shell.openExternal('https://accounts.google.com/o/oauth2/v2/auth?'+query);
    const code=await Promise.race([callback,new Promise((_,reject)=>setTimeout(()=>reject(Error('Google-Anmeldung nach 3 Minuten abgebrochen.')),180000))]);
    const data=await tokenRequest({client_id:id,grant_type:'authorization_code',code,redirect_uri:redirect,code_verifier:verifier});
    session={access:data.access_token,expires:Date.now()+(Number(data.expires_in)||3500)*1000,
      refresh:data.refresh_token||null,email:await profile(data.access_token)};
    if(session.refresh)await saveRefresh(session.refresh);
    return {email:session.email};
  }finally{loginActive=false;server?.close();}
}
async function resume(){
  try{const t=await access();if(!session.email)session.email=await profile(t);return {active:true,email:session.email}}catch{return {active:false,email:''}}
}
async function disconnect(){
  session=null;
  await fs.unlink(credentialsPath()).catch(()=>{});
  return true;
}
async function request({url,method='GET',headers={},bodyBase64,bodyText}={}){
  const target=new URL(String(url||''));
  if(!ORIGINS.has(target.origin)||(!target.pathname.startsWith('/drive/v3/files')&&!target.pathname.startsWith('/upload/drive/v3/files')))
    throw Error('Nur Google Drive AppData API zugelassen.');
  method=String(method).toUpperCase();
  if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))throw Error('Unzulässige Methode.');
  const allowed=['content-type','content-range','x-upload-content-length','x-upload-content-type'];
  const outgoing={Authorization:'Bearer '+await access()};
  for(const [key,value] of Object.entries(headers||{}))if(allowed.includes(key.toLowerCase()))outgoing[key]=String(value).slice(0,260);
  let body;
  if(bodyBase64){if(bodyBase64.length>1200000)throw Error('Upload-Segment zu groß.');body=Buffer.from(bodyBase64,'base64');}
  else if(bodyText!==undefined){if(String(bodyText).length>2e6)throw Error('Metadaten zu groß.');body=String(bodyText)}
  const response=await fetch(target,{method,headers:outgoing,body,redirect:'error',signal:AbortSignal.timeout(25000)});
  const buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.byteLength>12*1024*1024)throw Error('Google-Drive-Antwort zu groß.');
  return {status:response.status,statusText:response.statusText,headers:Object.fromEntries(response.headers.entries()),bodyBase64:buffer.toString('base64')};
}
module.exports={login,resume,disconnect,request};
