/* BooksUp 5.0 – direct local peer-to-peer transfer via encrypted WebRTC DataChannel.
 * No central server or cloud account; manual SDP exchange on the same local network.
 * Devices must be mutually reachable; hotspot/router mDNS restrictions may block it.
 */
(function(){
'use strict';
let peer=null,channel=null,role='',code='',ready=false,receiving='',expected=0,importBusy=false,transferBusy=false,remoteInfo=null,transferId='',ackTimer=null;
const el=id=>document.getElementById(id);
const say=s=>{const n=el('bu50-peer-status');if(n)n.textContent=s;};
let deviceId;try{deviceId=localStorage.getItem('booksup.deviceId');if(!deviceId){deviceId=crypto.randomUUID();localStorage.setItem('booksup.deviceId',deviceId);}}catch{deviceId=crypto.randomUUID();}
const ownDevice={id:deviceId,name:(window.Capacitor?.getPlatform?.()==='android'?'Android':window.booksupDesktopUpdate?'Windows':'Browser')+' · BooksUp',type:window.Capacitor?.getPlatform?.()||'desktop'};
function syncUi(){
 const b=el('bu50-send-button');if(b)b.disabled=!ready||!remoteInfo||transferBusy||channel?.readyState!=='open';
 const info=el('bu50-peer-info');if(info)info.textContent=ready&&remoteInfo?'Verbunden mit: '+remoteInfo.name+' (ID '+remoteInfo.id.slice(0,8)+')':'Kein verbundenes Gerät erkannt.';
}
function progress(percent,eta,message){
 const box=el('bu50-transfer-progress'),bar=el('bu50-transfer-bar'),label=el('bu50-transfer-detail');
 if(box)box.hidden=false;if(bar)bar.value=Math.max(0,Math.min(100,Math.round(percent)));
 if(label)label.textContent=Math.round(percent)+' % · '+(Number.isFinite(eta)?'noch ca. '+Math.max(0,Math.ceil(eta))+' s · ':'')+message;
}
function notifyPeer(type,details={}){if(channel?.readyState==='open')channel.send(JSON.stringify({type,...details}));}
const waitIce=pc=>new Promise(resolve=>{
 if(pc.iceGatheringState==='complete')return resolve();
 const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',listen);resolve()},9000);
 function listen(){if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',listen);resolve();}}
 pc.addEventListener('icegatheringstatechange',listen);
});
function close(){clearTimeout(ackTimer);ackTimer=null;try{channel?.close();peer?.close()}catch{}channel=null;peer=null;ready=false;remoteInfo=null;transferBusy=false;transferId='';role='';receiving='';expected=0;syncUi();}
window.bu50PeerStop=function(){close();say('Verbindung getrennt.');};
function make(){
 close();
 if(!window.RTCPeerConnection)throw Error('Dieses Gerät unterstützt WebRTC nicht.');
 peer=new RTCPeerConnection({iceServers:[]});
 peer.addEventListener('connectionstatechange',()=>{
  const state=peer?.connectionState;
  if(state==='connected')say('Direkte verschlüsselte Verbindung steht.');
  else if(['failed','disconnected','closed'].includes(state||'')){clearTimeout(ackTimer);ready=false;transferBusy=false;remoteInfo=null;syncUi();say('Verbindung unterbrochen. Neues Angebot erstellen und erneut verbinden.');}
 });
 peer.addEventListener('datachannel',e=>bindChannel(e.channel));
}
function bindChannel(c){
 channel=c;channel.binaryType='arraybuffer';channel.bufferedAmountLowThreshold=262144;
 channel.onopen=()=>{ready=true;remoteInfo=null;syncUi();say('Verbindung hergestellt. Warte auf Gerätekennung …');notifyPeer('hello',{device:ownDevice});void computeCode();};
 channel.onclose=()=>{clearTimeout(ackTimer);ready=false;transferBusy=false;remoteInfo=null;syncUi();say('Verbindung geschlossen. Zum erneuten Verbinden ein neues Angebot erstellen.');};
 channel.onerror=()=>{transferBusy=false;syncUi();say('Netzwerkfehler: Direkte Verbindung prüfen und bei Bedarf neu verbinden.');};
 channel.onmessage=e=>void message(e.data);
}
async function computeCode(){
 try{
  const s=[peer.localDescription?.sdp||'',peer.remoteDescription?.sdp||''];
  const patterns=s.map(v=>(v.match(/a=fingerprint:sha-256\s+([0-9A-F:]+)/i)||[])[1]||'');
  if(patterns.some(x=>!x))return;
  const key=patterns.sort().join('|'),buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  const bytes=new Uint8Array(buf);code=String(((bytes[0]<<16)|(bytes[1]<<8)|bytes[2])%1000000).padStart(6,'0');
  say('Direkt verbunden. Sicherheitscode: '+code+' – auf beiden Geräten vergleichen.');
 }catch(e){console.debug('Pairing code',e);}
}
function localText(){return el('bu50-local-sdp')}
function remoteText(){return el('bu50-remote-sdp')}
window.bu50StartPeer=async function(){
 try{
  make();role='offer';bindChannel(peer.createDataChannel('booksup-direct',{ordered:true}));
  await peer.setLocalDescription(await peer.createOffer());await waitIce(peer);
  if(localText())localText().value=JSON.stringify(peer.localDescription);
  say('Angebot erstellt. Kopiere es auf das zweite Gerät und erstelle dort die Antwort.');
 }catch(e){say('Verbindung fehlgeschlagen: '+(e.message||e));}
};
window.bu50AcceptPeer=async function(){
 try{
  const source=JSON.parse(remoteText()?.value||'');
  if(source.type!=='offer'||!/^v=0\r?\n/.test(source.sdp||'')||source.sdp.length>80000)throw Error('Ungültiges Verbindungsangebot.');
  make();role='answer';await peer.setRemoteDescription(source);
  await peer.setLocalDescription(await peer.createAnswer());await waitIce(peer);
  if(localText())localText().value=JSON.stringify(peer.localDescription);
  say('Antwort bereit. Übertrage die Antwort auf das erste Gerät.');
 }catch(e){say('Angebot ungültig: '+(e.message||e));}
};
window.bu50FinishPeer=async function(){
 try{
  if(role!=='offer'||!peer)throw Error('Erstelle zuerst ein Angebot.');
  const answer=JSON.parse(remoteText()?.value||'');
  if(answer.type!=='answer'||!/^v=0\r?\n/.test(answer.sdp||'')||answer.sdp.length>80000)throw Error('Ungültige Antwort.');
  await peer.setRemoteDescription(answer);say('Antwort übernommen. Verbinde Geräte …');
 }catch(e){say('Antwort fehlgeschlagen: '+(e.message||e));}
};
window.bu50CopyPeer=async function(){
 const v=localText()?.value||'';if(!v)return;
 try{await navigator.clipboard.writeText(v);say('Verbindungstext kopiert.');}catch{localText()?.select();say('Text auswählen und manuell kopieren.');}
};
const bytesToB64=bytes=>{let result='';for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(result)};
async function fileFor(book){
 if(!book.pdf)return null;
 try{
  const d=await db(),blob=await new Promise(ok=>{const req=d.transaction('f').objectStore('f').get(Number(book.id));req.onsuccess=()=>ok(req.result);req.onerror=()=>ok(null);});
  if(!(blob instanceof Blob)||blob.size>8*1024*1024)return null;
  return {id:book.id,type:blob.type||'application/octet-stream',data:bytesToB64(new Uint8Array(await blob.arrayBuffer()))};
 }catch{return null}
}
async function packet(){
 const snapshot={book:{},manga:{}},files=[],max=28*1024*1024;
 for(const key of ['book','manga']){
  const p=ALL[key]||{};
  snapshot[key]={profile:p.profile||{},books:p.books||[],libraryBooks:p.libraryBooks||[],readingLists:p.readingLists||[],log:p.log||[],goals:p.goals||[],folders:p.folders||[]};
  for(const book of p.books||[]){
   if(files.reduce((v,f)=>v+f.data.length,0)>max)break;
   const f=await fileFor(book);if(f)files.push({...f,profile:key});
  }
 }
 return JSON.stringify({version:1,app:'BooksUp',snapshot,files,created:Date.now()});
}
async function send(data){
 const started=Date.now();transferId=crypto.randomUUID();transferBusy=true;syncUi();
 progress(0,null,'Übertragung wird vorbereitet');
 if(!channel||channel.readyState!=='open')throw Error('Keine direkte Verbindung.');
 if(data.length>43*1024*1024)throw Error('Übertragung zu groß (max. 43 MB).');
 channel.send(JSON.stringify({type:'start',length:data.length,id:transferId}));
 const slice=12000;
 for(let i=0;i<data.length;i+=slice){
  while(channel.bufferedAmount>512000){if(channel.readyState!=='open')throw Error('Verbindung während des Sendens getrennt');await new Promise(ok=>setTimeout(ok,25));}
  if(channel.readyState!=='open')throw Error('Verbindung getrennt');
  channel.send(JSON.stringify({type:'chunk',content:data.slice(i,i+slice)}));
  if(i%(slice*20)===0||i+slice>=data.length){
   const amount=Math.min(data.length,i+slice),elapsed=Math.max(1,(Date.now()-started)/1000);
   progress(amount/data.length*95,elapsed*(data.length-amount)/Math.max(1,amount),'Daten werden gesendet');
  }
 }
 channel.send(JSON.stringify({type:'finish',id:transferId}));
 clearTimeout(ackTimer);
 ackTimer=setTimeout(()=>{if(!transferBusy)return;transferBusy=false;syncUi();progress(95,null,'Keine Bestätigung erhalten');say('Übertragung gesendet, aber das Zielgerät hat nicht bestätigt. Prüfe dort den Importstatus und sende nicht blind erneut.');},120000);
 progress(95,null,'Gesendet – warte auf Bestätigung des Zielgeräts');
 say('Daten versendet. Das Zielgerät muss den Import noch bestätigen.');
}
window.bu50SendPeer=async function(){
 if(!ready||!remoteInfo||channel?.readyState!=='open')return say('Noch kein verbundenes Gerät erkannt.');
 if(transferBusy)return say('Eine Übertragung läuft bereits.');
 if(!confirm('Bücher, Lesefortschritt und vorhandene digitale Dateien auf das verbundene Gerät übertragen? Hintergrundbilder werden NICHT gesendet.'))return;
 try{say('Erstelle Übertragung …');progress(0,null,'Bücher und digitale Dateien werden vorbereitet');await send(await packet());}catch(e){transferBusy=false;syncUi();say('Senden fehlgeschlagen: '+(e.message||e)+'. Erneut verbinden und versuchen.');progress(0,null,'Übertragung fehlgeschlagen');}
};
async function message(v){
 if(typeof v!=='string')return;
 let obj;try{obj=JSON.parse(v)}catch{return}
 if(obj.type==='hello'){
  const d=obj.device;
  if(!d||typeof d.id!=='string'||!d.id.trim()||typeof d.name!=='string')return;
  remoteInfo={id:d.id.slice(0,80),name:d.name.slice(0,90),type:String(d.type||'').slice(0,30)};
  syncUi();say('Verbunden mit '+remoteInfo.name+' · ID '+remoteInfo.id.slice(0,8)+'. Sicherheitscode auf beiden Geräten vergleichen.');return;
 }
 if(obj.type==='ack'){
  if(!transferBusy||obj.id!==transferId)return;
  clearTimeout(ackTimer);ackTimer=null;transferBusy=false;transferId='';syncUi();
  if(obj.ok){progress(100,0,'Auf Zielgerät erfolgreich übernommen');say('Übertragung abgeschlossen: Zielgerät hat den Import bestätigt.');}
  else{progress(95,null,'Import auf Zielgerät nicht übernommen');say('Daten gesendet, aber Zielgerät meldet: '+String(obj.message||'Import abgelehnt').slice(0,160));}
  return;
 }
 if(obj.type==='start'){if(!Number.isInteger(obj.length)||obj.length<=0||obj.length>43*1024*1024)return;receiving='';expected=obj.length;window.bu50IncomingTransferId=String(obj.id||'').slice(0,80);say('Empfange Daten …');return;}
 if(obj.type==='chunk'){if(!expected||typeof obj.content!=='string'||obj.content.length>16000)return;receiving+=obj.content;if(receiving.length>expected){receiving='';expected=0;return;}return;}
 if(obj.type==='finish'){
  if(receiving.length!==expected||!expected)return;
  const data=receiving;expected=0;receiving='';
  try{const p=JSON.parse(data);const ok=await preview(p);notifyPeer('ack',{id:window.bu50IncomingTransferId,ok,message:ok?'Import erfolgreich':'Import abgelehnt'});}catch(e){say('Übertragung konnte nicht gelesen werden: '+e.message);notifyPeer('ack',{id:window.bu50IncomingTransferId,ok:false,message:'Ungültige oder beschädigte Daten'});}
 }
}
function key(b){return b.isbn?'isbn:'+String(b.isbn).replace(/\W/g,''):(String(b.title||'').toLowerCase().trim()+'|'+String(b.author||'').toLowerCase().trim());}
async function preview(payload){
 if(payload?.app!=='BooksUp'||payload.version!==1)throw Error('Fremdes Übertragungsformat');
 if(!payload.snapshot?.book||!payload.snapshot?.manga)throw Error('Unvollständige Daten');
 for(const k of ['book','manga'])if(!Array.isArray(payload.snapshot[k].books)||payload.snapshot[k].books.length>15000||!Array.isArray(payload.snapshot[k].readingLists))throw Error('Ungültiger Datenbestand');
 const count=['book','manga'].reduce((n,k)=>n+payload.snapshot[k].books.length,0);
 const files=payload.files||[];
 if(!Array.isArray(files)||files.length>500)throw Error('Zu viele Buchdateien');
 if(!confirm('Direkte BooksUp-Übertragung erhalten: '+count+' eigene Bücher, '+files.length+' digitale Dateien.\n\nNeue Einträge werden hinzugefügt. Bestehende Bücher bleiben unverändert; Konflikte werden übersprungen. Möchtest du die Daten übernehmen?')){say('Empfang abgelehnt.');return false;}
 importBusy=true;say('Übernehme Daten ohne vorhandene Bücher zu überschreiben …');
 try{
  let added=0,skipped=0;
  for(const k of ['book','manga']){
   const target=ALL[k],source=payload.snapshot[k];
   target.books??=[];target.libraryBooks??=[];target.readingLists??=[];target.log??=[];target.goals??=[];
   const known=new Set(target.books.map(key));
   const knownIds=new Set(target.books.map(b=>String(b.id)));
   const imported=new Set();
   for(const b of source.books){
    if(!b||!b.title||known.has(key(b))||knownIds.has(String(b.id))){skipped++;continue;}
    target.books.push(b);known.add(key(b));knownIds.add(String(b.id));imported.add(String(b.id));added++;
   }
   const lib=new Set(target.libraryBooks.map(key));
   for(const b of source.libraryBooks||[])if(b?.title&&!lib.has(key(b))){target.libraryBooks.push(b);lib.add(key(b));}
   // Safe list merge by name; keep local configurations and avoid duplicate book links.
   for(const l of source.readingLists||[]){
    if(!l?.name)continue;
    let existing=target.readingLists.find(x=>String(x.name).toLowerCase()===String(l.name).toLowerCase());
    if(!existing){existing={...l,items:[]};target.readingLists.push(existing);}
    existing.items??=[];
    const seen=new Set(existing.items.map(i=>String(i.bookId||'')+'|'+String(i.title||'')));
    for(const item of l.items||[]){
     const kk=String(item.bookId||'')+'|'+String(item.title||'');
     if(!seen.has(kk)){existing.items.push(item);seen.add(kk);}
    }
   }
   const logs=new Set(target.log.map(l=>String(l.date)+'|'+String(l.mins)+'|'+String(l.pages)));
   for(const l of source.log||[]){const kk=String(l.date)+'|'+String(l.mins)+'|'+String(l.pages);if(!logs.has(kk)){target.log.push(l);logs.add(kk);}}
   target.bu50NewFileIds=[...imported]; // temporary internal state, deleted below
  }
  for(const f of files){
   if(!['book','manga'].includes(f.profile)||!ALL[f.profile].bu50NewFileIds.includes(String(f.id))||typeof f.data!=='string'||f.data.length>11000000)continue;
   try{const raw=atob(f.data),bytes=Uint8Array.from(raw,x=>x.charCodeAt(0));await put(Number(f.id),new Blob([bytes],{type:f.type||'application/octet-stream'}));}catch(e){console.warn('Digital book transfer',e);}
  }
  for(const k of ['book','manga'])delete ALL[k].bu50NewFileIds;
  persist();render();say('Importiert: '+added+' Bücher. '+skipped+' vorhandene/konfliktbehaftete Bücher wurden nicht überschrieben.');return true;
 }catch(e){say('Import fehlgeschlagen: '+e.message);return false;}
 finally{importBusy=false;}
}
window.bu50PairingView=function(){
 return bar('Direkte Geräteverbindung','settings')+
 '<section class="bu50-pair"><span class="next-overline">BOOKSUP DIRECT</span><h1>Direkt verbinden – ohne Server</h1><p>Übertrage Bücher, Leselisten, Lesefortschritte und passende digitale Dateien direkt zwischen Geräten im <b>gleichen WLAN oder Hotspot</b>. Die verschlüsselte WebRTC-Verbindung benötigt weder ein Konto noch einen Cloud-Dienst. Es werden keine Daten im Internet gespeichert.</p>'+
 '<p class="hint">1. Auf Gerät A Angebot erstellen. 2. Text auf Gerät B einfügen und Antwort erstellen. 3. Antwort auf Gerät A einfügen. 4. Den gleichen sechsstelligen Code auf beiden Geräten überprüfen. 5. Daten senden und auf dem Zielgerät bestätigen.</p>'+
 '<div class="bu50-pair-steps"><div class="bu50-pair-step"><h3>1 · Verbinden</h3><button class="btn" onclick="bu50StartPeer()">Gerät A: Angebot erstellen</button><button class="btn o" onclick="bu50AcceptPeer()">Gerät B: Angebot beantworten</button><button class="chip" onclick="bu50FinishPeer()">Gerät A: Antwort übernehmen</button><p id="bu50-peer-status" role="status">Noch nicht verbunden.</p></div>'+
 '<div class="bu50-pair-step"><h3>2 · Text von diesem Gerät</h3><textarea id="bu50-local-sdp" readonly placeholder="Hier erscheint dein Verbindungstext"></textarea><button class="chip" onclick="bu50CopyPeer()">Kopieren</button></div>'+
 '<div class="bu50-pair-step"><h3>3 · Text vom anderen Gerät</h3><textarea id="bu50-remote-sdp" placeholder="Angebot oder Antwort vom anderen Gerät hier einfügen"></textarea></div>'+
 '<div class="bu50-pair-step"><h3>4 · Daten übertragen</h3><p id="bu50-peer-info" role="status">Kein verbundenes Gerät erkannt.</p><button class="btn" id="bu50-send-button" disabled onclick="bu50SendPeer()">Daten sicher senden</button><button class="chip" onclick="bu50PeerStop()">Verbindung trennen</button><div id="bu50-transfer-progress" hidden><progress id="bu50-transfer-bar" value="0" max="100" style="width:100%"></progress><p class="hint" id="bu50-transfer-detail" role="status">0 %</p></div><p class="hint">Bei gleichen Büchern wird nichts automatisch überschrieben. Es gibt keinen dauerhaften Hintergrund-Sync; beide Apps müssen geöffnet bleiben. Größere Dateien über 8 MB werden übersprungen. Hintergrundbilder bleiben immer auf dem jeweiligen Gerät.</p></div></div></section>';
};
const prevAfterRender=window.nextAfterRender;window.nextAfterRender=function(){prevAfterRender?.apply(this,arguments);if(view==='transfer')syncUi();};
})();
