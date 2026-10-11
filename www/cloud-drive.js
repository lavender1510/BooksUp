/* BooksUp Google Drive appDataFolder sync — Android only, OAuth client configured by publisher.
   No tokens are persisted in localStorage. Never overwrite divergent data silently. */
(() => {
'use strict';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const API='https://www.googleapis.com/drive/v3/files';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
const MANIFEST='booksup-cloud-v1.json';
const CONFIG='booksup-drive-config-v1';
const CHUNK=262144;
const $cfg=()=>{try{return JSON.parse(localStorage.getItem(CONFIG)||'{}')}catch{return {}}};
const config=c=>localStorage.setItem(CONFIG,JSON.stringify(c));
let state={authorized:false,token:'',email:'',busy:false,connecting:false,initialized:false,lastError:''};
let hooks=null,timer=null,interval=null,lastChecked=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sdk=()=>window.Capacitor?.Plugins?.SocialLogin;
const supported=()=>window.Capacitor?.getPlatform?.()==='android';
const client=()=>String(window.BOOKSUP_GOOGLE_WEB_CLIENT_ID||'').trim();
const notify=message=>hooks?.toast?.(message);
const books=()=>[...(hooks?.snapshot?.().book?.books||[]),...(hooks?.snapshot?.().manga?.books||[])];
const empty=()=>books().length===0&&!((hooks?.snapshot?.().book?.log||[]).length+(hooks?.snapshot?.().manga?.log||[]).length);
const escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]));
function enabled(){return !!$cfg().enabled}
function ready(){return !!(supported()&&sdk()&&client().endsWith('.apps.googleusercontent.com'))}
function ui(){
  const cfg=$cfg(),status=!supported()?'Drive-Synchronisierung derzeit für Android':!sdk()?'Google-Anmeldemodul nicht verfügbar':!client()?'Google-Anmeldung muss vom App-Herausgeber eingerichtet werden':state.authorized?'Verbunden mit '+escape(state.email||'Google'):cfg.enabled?'Warte auf Google-Anmeldung':'Nicht verbunden';
  const online=state.authorized;
  return '<h3>Google Drive · Cloud-Sicherung</h3><div class="pad"><p class="hint">'+status+'</p>'+
    '<p class="hint">Sichert beide Profile, Lesefortschritte und importierte Buchdateien im privaten BooksUp-Appordner von Google Drive. Nur bei geöffneter App. Cloud-Daten eines anderen Gerätes werden nicht ungefragt über bestehende Bücher geschrieben.</p>'+
    '<div class="row"><button class="btn" onclick="BooksUpCloud.connect()" '+(!ready()||state.busy?'disabled':'')+'>'+(online?'Google-Konto wechseln':'Mit Google verbinden')+'</button>'+
    (online?'<button class="btn o" onclick="BooksUpCloud.disconnect()">Trennen</button>':'')+'</div>'+
    '<label class="pad" style="display:block"><input type="checkbox" style="width:auto" onchange="BooksUpCloud.enable(this.checked)" '+(cfg.enabled?'checked':'')+' '+(!online?'disabled':'')+'> Automatisch sichern und auf anderen Geräten abgleichen</label>'+
    '<div class="row"><button class="btn o" onclick="BooksUpCloud.upload()" '+(!online||state.busy?'disabled':'')+'>Jetzt in Drive sichern</button><button class="btn o" onclick="BooksUpCloud.restore()" '+(!online||state.busy?'disabled':'')+'>Von Drive übernehmen</button></div>'+
    '<p class="hint">'+(cfg.lastSuccess?'Letzte erfolgreiche Synchronisierung: '+new Date(cfg.lastSuccess).toLocaleString('de-DE'):'Noch keine erfolgreiche Cloud-Synchronisierung')+
    (state.lastError?' · '+escape(state.lastError):'')+'</p></div>';
}
async function auth(){
  if(!ready())throw Error('Google-Cloud-OAuth ist noch nicht eingerichtet.');
  const s=sdk();
  if(!state.initialized){
    await s.initialize({google:{webClientId:client(),mode:'online'}});
    state.initialized=true;
  }
  const result=await s.login({provider:'google',options:{scopes:[DRIVE_SCOPE,'email','profile'],filterByAuthorizedAccounts:false}});
  const token=result?.result?.accessToken?.token||result?.result?.accessToken;
  if(typeof token!=='string'||!token)throw Error('Google hat keinen Drive-Zugriffstoken geliefert. Prüfe die OAuth-Freigabe.');
  state.token=token;state.email=result.result.profile?.email||'';state.authorized=true;
}
async function request(url,opts={}){
  if(!state.token)throw Error('Google-Konto erneut verbinden.');
  const res=await fetch(url,{...opts,headers:{Authorization:'Bearer '+state.token,...opts.headers}});
  if(res.status===401||res.status===403)throw Error('Google Drive-Zugriff abgelaufen oder nicht erlaubt. Konto erneut verbinden.');
  if(!res.ok&&res.status!==308)throw Error('Google Drive: HTTP '+res.status+' '+(await res.text()).slice(0,180));
  return res;
}
async function list(name){
  const q=new URLSearchParams({spaces:'appDataFolder',q:"name = '"+name.replace(/'/g,"\\'")+"' and trashed = false",fields:'nextPageToken,files(id,name,modifiedTime,size)',pageSize:'100'});
  const r=await request(API+'?'+q);const j=await r.json();return j.files||[];
}
async function create(name,mime){
  const r=await request(API+'?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:mime,parents:['appDataFolder']})});
  const j=await r.json();if(!j.id)throw Error('Drive hat keine Datei-ID erzeugt.');return j.id;
}
async function upsert(name,blob,knownId){
  let id=knownId||((await list(name))[0]?.id);
  if(!id)id=await create(name,blob.type||'application/octet-stream');
  // Resumable upload prevents a second full-size base64 copy in Android WebView.
  const start=await request(UPLOAD+'/'+encodeURIComponent(id)+'?uploadType=resumable',{method:'PATCH',headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':blob.type||'application/octet-stream','X-Upload-Content-Length':String(blob.size)},body:'{}'});
  const uri=start.headers.get('Location');
  if(!uri||!uri.startsWith('https://'))throw Error('Google Drive hat keine Upload-Adresse geliefert.');
  if(blob.size===0){
    await request(uri,{method:'PUT',headers:{'Content-Length':'0'},body:new Blob()});
    return id;
  }
  for(let offset=0;offset<blob.size;offset+=CHUNK){
    const end=Math.min(blob.size,offset+CHUNK)-1;
    const r=await request(uri,{method:'PUT',headers:{'Content-Range':'bytes '+offset+'-'+end+'/'+blob.size,'Content-Type':blob.type||'application/octet-stream'},body:blob.slice(offset,end+1)});
    if(end!==blob.size-1&&r.status!==308)throw Error('Unvollständiger Drive-Upload.');
  }
  return id;
}
async function getJSON(id){const r=await request(API+'/'+encodeURIComponent(id)+'?alt=media');return r.json()}
async function getBlob(id){const r=await request(API+'/'+encodeURIComponent(id)+'?alt=media');return r.blob()}
async function remote(){const items=await list(MANIFEST);if(!items.length)return null;items.sort((a,b)=>String(b.modifiedTime).localeCompare(String(a.modifiedTime)));const item=items[0],data=await getJSON(item.id);if(data.schema!==1||!data.snapshot?.book||!data.snapshot?.manga||!data.revision)throw Error('Cloud-Backup ist nicht lesbar.');return {id:item.id,...data}}
async function uploadImpl(){
  if(state.busy||!state.authorized)return;
  state.busy=true;
  try{
    const cfg=$cfg(),old=await remote(),snapshot=structuredClone(hooks.snapshot());
    if(old&&old.revision!==cfg.lastRev){
      state.lastError='Ein anderes Gerät hat neuere Daten. Erst abgleichen.';
      notify(state.lastError);return;
    }
    const fileMap={...(old?.files||{})};
    const ids=new Set(books().filter(b=>b.pdf).map(b=>String(b.id)).filter(id=>/^[0-9]+$/.test(id)));
    for(const key of ids){
      if(fileMap[key])continue;
      const blob=await hooks.getFile(key);
      if(blob)fileMap[key]=await upsert('booksup-file-'+key,blob);
    }
    // Manifest is published last; incomplete uploads do not replace a valid snapshot.
    const next={schema:1,revision:crypto.randomUUID(),savedAt:Date.now(),deviceId:cfg.deviceId,files:Object.fromEntries([...ids].filter(x=>fileMap[x]).map(x=>[x,fileMap[x]])),snapshot};
    await upsert(MANIFEST,new Blob([JSON.stringify(next)],{type:'application/json'}),old?.id);
    config({...cfg,lastRev:next.revision,lastLocal:snapshot._savedAt||0,lastSuccess:Date.now(),enabled:true});
    state.lastError='';notify('Bücher erfolgreich in Google Drive gesichert.');
  }catch(e){state.lastError=e.message||String(e);notify('Drive-Sicherung fehlgeschlagen: '+state.lastError)}
  finally{state.busy=false}
}
async function restoreImpl(explicit=false){
  if(state.busy||!state.authorized)return;
  state.busy=true;
  try{
    const doc=await remote();
    if(!doc){if(explicit)notify('Noch keine Cloud-Sicherung vorhanden.');return}
    const cfg=$cfg();
    if(doc.revision===cfg.lastRev)return;
    const dirty=!!cfg.lastRev&&(hooks.snapshot()._savedAt||0)>(cfg.lastLocal||0);
    if((!empty()&&(!cfg.lastRev||dirty))&&!(explicit&&confirm('Lokale Bücher und Lesefortschritte durch die Cloud-Sicherung ersetzen? Erstelle vorher ein lokales Backup.'))){
      state.lastError='Unterschiedliche Bibliotheken: Bitte unter Einstellungen die Cloud-Übernahme ausdrücklich bestätigen.';
      notify(state.lastError);return;
    }
    const files={};
    for(const [id,fileId] of Object.entries(doc.files||{})){
      if(!/^[0-9]+$/.test(id)||!/^[\w-]+$/.test(fileId))continue;
      files[id]=await getBlob(fileId);
    }
    // Don't replace app state unless every required file was downloaded successfully.
    for(const [id,blob] of Object.entries(files)){if(!await hooks.putFile(id,blob))throw Error('Nicht genügend lokaler Speicher für '+id)}
    hooks.apply(doc.snapshot);
    const synced=hooks.snapshot();
    config({...cfg,lastRev:doc.revision,lastLocal:synced._savedAt||0,lastSuccess:Date.now(),enabled:true});
    state.lastError='';notify('Google-Drive-Bibliothek übernommen.');
  }catch(e){state.lastError=e.message||String(e);notify('Wiederherstellung fehlgeschlagen: '+state.lastError)}
  finally{state.busy=false}
}
async function sync(){
  if(!enabled()||!state.authorized||state.busy)return;
  const cfg=$cfg(),latest=await remote();
  if(latest&&latest.revision!==cfg.lastRev){
    if(empty()||(cfg.lastRev&&(hooks.snapshot()._savedAt||0)<=(cfg.lastLocal||0))){
      await restoreImpl(false);
    }else {state.lastError='Konflikt zwischen zwei Geräten. Bitte manuell abgleichen.';notify(state.lastError)}
  }else if((hooks.snapshot()._savedAt||0)>(cfg.lastLocal||0)){await uploadImpl()}
}
function schedule(){
  if(!enabled()||!state.authorized)return;
  clearTimeout(timer);timer=setTimeout(()=>{sync().catch(e=>{state.lastError=e.message;notify(state.lastError)})},12000);
}
async function connect(){
  if(state.connecting||state.busy)return;state.connecting=true;
  try{
    await auth();
    const cfg=$cfg(),id=cfg.deviceId||crypto.randomUUID();
    config({...cfg,enabled:true,deviceId:id});
    notify('Google verbunden: '+(state.email||'Konto'));
    await sync();
  }catch(e){state.lastError=e.message||String(e);notify('Google-Anmeldung fehlgeschlagen: '+state.lastError)}
  finally{state.connecting=false;hooks?.render?.()}
}
async function disconnect(){
  try{await sdk()?.logout({provider:'google'})}catch{}
  state.authorized=false;state.token='';state.email='';
  const cfg=$cfg();config({...cfg,enabled:false});clearTimeout(timer);hooks?.render?.()
}
async function enable(on){const cfg=$cfg();config({...cfg,enabled:!!on});if(on)await sync();hooks?.render?.()}
function setup(api){
  hooks=api;
  if(!$cfg().deviceId)config({...$cfg(),deviceId:crypto.randomUUID()});
  // No background service: sync runs while BooksUp is in the foreground.
  window.addEventListener('focus',()=>{if(enabled()&&state.authorized&&Date.now()-lastChecked>120000){lastChecked=Date.now();sync().catch(()=>{})}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled()&&state.authorized)sync().catch(()=>{})});
  interval=setInterval(()=>{if(!document.hidden&&enabled()&&state.authorized)sync().catch(()=>{})},180000);
}
window.BooksUpCloud={setup,ui,connect,disconnect,enable,upload:()=>uploadImpl(),restore:()=>restoreImpl(true),changed:schedule,ready};
})();