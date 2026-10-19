/* BooksUp 5.0 – direct local peer-to-peer transfer via encrypted WebRTC DataChannel.
 * No central server or cloud account; manual SDP exchange on the same local network.
 * Devices must be mutually reachable; hotspot/router mDNS restrictions may block it.
 */
(function(){
'use strict';
let peer=null,channel=null,role='',code='',ready=false,receiving='',expected=0,importBusy=false;
const el=id=>document.getElementById(id);
const say=s=>{const n=el('bu50-peer-status');if(n)n.textContent=s;};
const waitIce=pc=>new Promise(resolve=>{
 if(pc.iceGatheringState==='complete')return resolve();
 const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',listen);resolve()},9000);
 function listen(){if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',listen);resolve();}}
 pc.addEventListener('icegatheringstatechange',listen);
});
function close(){try{channel?.close();peer?.close()}catch{}channel=null;peer=null;ready=false;role='';receiving='';expected=0;}
window.bu50PeerStop=function(){close();say('Verbindung getrennt.');};
function make(){
 close();
 if(!window.RTCPeerConnection)throw Error('Dieses Gerät unterstützt WebRTC nicht.');
 peer=new RTCPeerConnection({iceServers:[]});
 peer.addEventListener('connectionstatechange',()=>{if(peer?.connectionState==='connected')say('Direkte verschlüsselte Verbindung steht.');else if(['failed','disconnected'].includes(peer?.connectionState||''))say('Verbindung unterbrochen. Gleiches WLAN oder Hotspot prüfen.');});
 peer.addEventListener('datachannel',e=>bindChannel(e.channel));
}
function bindChannel(c){
 channel=c;channel.binaryType='arraybuffer';channel.bufferedAmountLowThreshold=262144;
 channel.onopen=()=>{ready=true;say('Verbunden! Prüft auf beiden Geräten den gleichen Sicherheitscode. Danach kannst du Daten senden.');void computeCode();};
 channel.onclose=()=>{ready=false;say('Verbindung geschlossen.');};
 channel.onerror=()=>say('Netzwerkfehler: Direkte Verbindung prüfen.');
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
 if(!channel||channel.readyState!=='open')throw Error('Keine direkte Verbindung.');
 if(data.length>43*1024*1024)throw Error('Übertragung zu groß (max. 43 MB).');
 channel.send(JSON.stringify({type:'start',length:data.length}));
 const slice=12000;
 for(let i=0;i<data.length;i+=slice){
  while(channel.bufferedAmount>512000)await new Promise(ok=>setTimeout(ok,25));
  if(channel.readyState!=='open')throw Error('Verbindung getrennt');
  channel.send(JSON.stringify({type:'chunk',content:data.slice(i,i+slice)}));
  if(i%(slice*50)===0)say('Sende: '+Math.round(i/data.length*100)+'%');
 }
 channel.send(JSON.stringify({type:'finish'}));say('Übertragung gesendet. Das zweite Gerät muss die Daten noch bestätigen.');
}
window.bu50SendPeer=async function(){
 if(!ready)return say('Noch nicht verbunden.');
 if(!confirm('Bücher, Lesefortschritt und vorhandene digitale Dateien auf das verbundene Gerät übertragen? Hintergrundbilder werden NICHT gesendet.'))return;
 try{say('Erstelle Übertragung …');await send(await packet());}catch(e){say('Senden fehlgeschlagen: '+(e.message||e));}
};
async function message(v){
 if(typeof v!=='string')return;
 let obj;try{obj=JSON.parse(v)}catch{return}
 if(obj.type==='start'){if(!Number.isInteger(obj.length)||obj.length>43*1024*1024)return;receiving='';expected=obj.length;say('Empfange Daten …');return;}
 if(obj.type==='chunk'){if(!expected||typeof obj.content!=='string'||obj.content.length>16000)return;receiving+=obj.content;if(receiving.length>expected){receiving='';expected=0;return;}return;}
 if(obj.type==='finish'){
  if(receiving.length!==expected||!expected)return;
  const data=receiving;expected=0;receiving='';
  try{const p=JSON.parse(data);await preview(p);}catch(e){say('Übertragung konnte nicht gelesen werden: '+e.message);}
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
 if(!confirm('Direkte BooksUp-Übertragung erhalten: '+count+' eigene Bücher, '+files.length+' digitale Dateien.\n\nNeue Einträge werden hinzugefügt. Bestehende Bücher bleiben unverändert; Konflikte werden übersprungen. Möchtest du die Daten übernehmen?'))return say('Empfang abgelehnt.');
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
  persist();render();say('Importiert: '+added+' Bücher. '+skipped+' vorhandene/konfliktbehaftete Bücher wurden nicht überschrieben.');
 }catch(e){say('Import fehlgeschlagen: '+e.message);}
 finally{importBusy=false;}
}
window.bu50PairingView=function(){
 return bar('Direkte Geräteverbindung','settings')+
 '<section class="bu50-pair"><span class="next-overline">BOOKSUP DIRECT</span><h1>Direkt verbinden – ohne Server</h1><p>Übertrage Bücher, Leselisten, Lesefortschritte und passende digitale Dateien direkt zwischen Geräten im <b>gleichen WLAN oder Hotspot</b>. Die verschlüsselte WebRTC-Verbindung benötigt weder ein Konto noch einen Cloud-Dienst. Es werden keine Daten im Internet gespeichert.</p>'+
 '<p class="hint">1. Auf Gerät A Angebot erstellen. 2. Text auf Gerät B einfügen und Antwort erstellen. 3. Antwort auf Gerät A einfügen. 4. Den gleichen sechsstelligen Code auf beiden Geräten überprüfen. 5. Daten senden und auf dem Zielgerät bestätigen.</p>'+
 '<div class="bu50-pair-steps"><div class="bu50-pair-step"><h3>1 · Verbinden</h3><button class="btn" onclick="bu50StartPeer()">Gerät A: Angebot erstellen</button><button class="btn o" onclick="bu50AcceptPeer()">Gerät B: Angebot beantworten</button><button class="chip" onclick="bu50FinishPeer()">Gerät A: Antwort übernehmen</button><p id="bu50-peer-status" role="status">Noch nicht verbunden.</p></div>'+
 '<div class="bu50-pair-step"><h3>2 · Text von diesem Gerät</h3><textarea id="bu50-local-sdp" readonly placeholder="Hier erscheint dein Verbindungstext"></textarea><button class="chip" onclick="bu50CopyPeer()">Kopieren</button></div>'+
 '<div class="bu50-pair-step"><h3>3 · Text vom anderen Gerät</h3><textarea id="bu50-remote-sdp" placeholder="Angebot oder Antwort vom anderen Gerät hier einfügen"></textarea></div>'+
 '<div class="bu50-pair-step"><h3>4 · Daten übertragen</h3><button class="btn" onclick="bu50SendPeer()">Daten sicher senden</button><button class="chip" onclick="bu50PeerStop()">Verbindung trennen</button><p class="hint">Bei gleichen Büchern wird nichts automatisch überschrieben. Es gibt keinen dauerhaften Hintergrund-Sync; beide Apps müssen geöffnet bleiben. Größere Dateien über 8 MB werden übersprungen. Hintergrundbilder bleiben immer auf dem jeweiligen Gerät.</p></div></div></section>';
};
})();
