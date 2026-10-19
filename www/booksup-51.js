/* BooksUp 5.1 — shared regression fixes; installed after the 5.0 modules. */
(function(){
'use strict';
if(window.booksup51)return;window.booksup51=true;
const safe=v=>esc(v==null?'':String(v)),mobile=()=>window.Capacitor?.getPlatform?.()==='android';
const normalize=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const KEY='bu51.favoriteFonts';
let query='';
function refreshFonts(){
 const input=document.getElementById('bu50-font-query');
 if(!input)return;
 if(document.activeElement!==input && query && input.value!==query)input.value=query;
 const term=normalize(input.value);
 document.querySelectorAll('.bu50-font-row').forEach(row=>{
   const name=normalize(row.dataset.font||row.textContent);
   row.hidden=!!term&&!name.includes(term);
 });
 const count=document.getElementById('bu51-font-count');
 if(count)count.textContent=document.querySelectorAll('.bu50-font-row:not([hidden])').length+' passende Schriftarten';
}
window.bu50ChooseFont=function(){query=document.getElementById('bu50-font-query')?.value||'';refreshFonts();};
document.addEventListener('input',e=>{if(e.target?.id==='bu50-font-query'){query=e.target.value;refreshFonts();}},true);
const priorAppearance=window.bu43AppearanceView;
window.bu43AppearanceView=function(){
 const original=priorAppearance.apply(this,arguments);
 return original.replace('<div class="bu50-font-list">','<div id="bu51-font-count" class="hint">100 Schriftarten</div><div class="bu50-font-list">');
};
function combos(){if(!Array.isArray(ALL.bu48ThemeCombos))ALL.bu48ThemeCombos=[];return ALL.bu48ThemeCombos;}
window.bu51SaveCombo=function(){
 const input=prompt('Name deiner neuen Kombination:','Mein Lesedesign');
 if(input===null)return;
 const name=String(input).trim().slice(0,60);if(!name)return toast('Bitte einen Namen eingeben.');
 const d=typeof bu43AppearanceDraft!=='undefined'&&bu43AppearanceDraft?bu43AppearanceDraft:bu43ApCapture();
 const item={id:crypto.randomUUID(),name,nextTheme:d.nextTheme||ALL.nextTheme||'standard',
   mode:Number(d.mode??S.mode??0),theme:Number(d.theme??S.theme??0),paper:Number(d.paper??S.paper??0),
   fs:Number(d.fs??S.fs??1),font:ALL.bu50Appearance?.font||'Inter',
   fontHeading:ALL.bu50Appearance?.fontHeading||'Newsreader',bgFilter:localStorage.getItem('bu50.bgFilter')||'65'};
 combos().push(item);persist();render();
 toast('Gespeichert: '+name);
 return item;
};
window.bu48SaveThemeCombo=window.bu51SaveCombo;window.bu50SaveCombo=window.bu51SaveCombo;
window.bu51ApplyCombo=function(id){
 const c=combos().find(x=>String(x.id)===String(id));if(!c)return;
 ALL.nextTheme=c.nextTheme;
 for(const k of ['mode','theme','paper','fs'])if(c[k]!==undefined)S[k]=c[k];
 if(typeof bu43AppearanceDraft!=='undefined'&&bu43AppearanceDraft){
  for(const k of ['mode','theme','paper','fs','nextTheme'])bu43AppearanceDraft[k]=c[k];
  bu43AppearanceBaseline=JSON.stringify(bu43AppearanceDraft);
 }
 ALL.bu50Appearance??={};
 if(c.font)ALL.bu50Appearance.font=c.font;
 if(c.fontHeading)ALL.bu50Appearance.fontHeading=c.fontHeading;
 if(c.bgFilter)localStorage.setItem('bu50.bgFilter',String(c.bgFilter));
 persist();if(typeof nextApplyTheme==='function')nextApplyTheme();render();
 toast('Kombination angewendet: '+c.name);
};
window.bu48ApplyThemeCombo=window.bu51ApplyCombo;window.bu50ApplyCombo=window.bu51ApplyCombo;
// GIFs are stored as original Blob, not resized or converted to static thumbnails.
window.bu50PickBackground=()=>raw('image/gif,image/png,image/jpeg,image/webp,.gif',async file=>{
 if(!/^image\/(gif|png|jpeg|webp)$/i.test(file.type)&&!/\.(gif|png|jpe?g|webp)$/i.test(file.name||''))return toast('Bitte ein GIF, PNG, JPG oder WebP auswählen.');
 if(file.size>20*1024*1024)return toast('Bitte ein Hintergrundbild bis maximal 20 MB verwenden.');
 const ok=await put('bu50.background',file);
 if(!ok)return toast('Das Bild konnte nicht lokal gespeichert werden.');
 // Reloading creates an object URL for the original GIF so frames remain animated.
 if(typeof window.bu51ReloadBackground==='function')await window.bu51ReloadBackground();
 else if(typeof window.bu50RefreshBackground==='function')await window.bu50RefreshBackground();
 else{const buffer=await file.arrayBuffer();const blob=new Blob([buffer],{type:file.type||'image/gif'});const url=URL.createObjectURL(blob);
  document.documentElement.style.setProperty('--bu50-bg-image','url("'+url+'")');
  document.documentElement.classList.add('bu50-has-background');
  if(window.bu51TempWallpaper)URL.revokeObjectURL(window.bu51TempWallpaper);
  window.bu51TempWallpaper=url;
 }
 render();toast('Hintergrund auf diesem Gerät gespeichert.');
});
// Expose existing 5.0 wallpaper refresh, so users see their selected GIF instantly.
if(!window.bu50RefreshBackground){
 window.bu50RefreshBackground=async()=>{
  const d=await db();const file=await new Promise(ok=>{const tx=d.transaction('f').objectStore('f').get('bu50.background');tx.onsuccess=()=>ok(tx.result);tx.onerror=()=>ok(null);});
  if(window.bu51TempWallpaper)URL.revokeObjectURL(window.bu51TempWallpaper);
  window.bu51TempWallpaper=file instanceof Blob?URL.createObjectURL(file):'';
  const html=document.documentElement;
  html.classList.toggle('bu50-has-background',!!window.bu51TempWallpaper);
  if(window.bu51TempWallpaper)html.style.setProperty('--bu50-bg-image','url("'+window.bu51TempWallpaper+'")');
 };
}
// Catalog normalization; a failed backend must not turn a legitimate query into an empty list.
const catalogRows=(raw)=>{
 const result=[];
 for(const g of raw?.google||[]){
  const v=g.volumeInfo||{};if(!v.title)continue;
  result.push({...metadataGoogle(v,g),description:v.description||'',title:v.title,author:(v.authors||[]).join(', '),year:v.publishedDate?.slice(0,4)||'',source:'Google Books'});
 }
 for(const o of raw?.open||[]){
  if(!o.title)continue;
  result.push({id:o.key,title:o.title,author:(o.author_name||[]).join(', '),isbn:(o.isbn||[])[0]||'',
   year:o.first_publish_year||'',genre:(o.subject||[])[0]||'',tags:(o.subject||[]).slice(0,5).join(', '),
   cover:o.cover_i?'https://covers.openlibrary.org/b/id/'+Number(o.cover_i)+'-L.jpg':'',language:(o.language||[])[0]||'',source:'Open Library'});
 }
 return result;
};
async function catalogQuery(term,author=''){
 const errors=[],results=[];
 if(window.booksupCatalog?.search){
  try{
   const r=await window.booksupCatalog.search({title:term,author,isbn:/^(?:\d{10}|\d{13})$/.test(term.replace(/[^0-9X]/gi,''))?term:''});
   results.push(...catalogRows(r));errors.push(...(r.errors||[]));
  }catch(e){errors.push('Native Buchsuche: '+String(e.message||e));}
 }
 if(!results.length){
  const isbn=term.replace(/[^\dX]/gi,'');
  const q=/^(?:\d{10}|\d{13})$/.test(isbn)?'isbn:'+isbn:term+(author?' '+author:'');
  const endpoints=[
   'https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=40',
   'https://openlibrary.org/search.json?'+(q.startsWith('isbn:')?'isbn='+encodeURIComponent(isbn):'q='+encodeURIComponent(q))+'&limit=35&fields=key,title,author_name,isbn,first_publish_year,cover_i,subject,language'
  ];
  const responses=await Promise.allSettled(endpoints.map(async u=>{
   const r=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
  }));
  responses.forEach((x,i)=>{if(x.status==='fulfilled')results.push(...catalogRows(i===0?{google:x.value.items||[]}:{open:x.value.docs||[]}));
   else errors.push(['Google Books','Open Library'][i]+': '+String(x.reason?.message||x.reason));});
 }
 const found=new Set();
 return {books:results.filter(b=>{const k=normalize(b.title)+'|'+normalize(b.author);if(!k||found.has(k))return false;found.add(k);return true;}),errors};
}
let discoveryToken=0;
window.bu46Search=async function(term,reset=true){
 const value=String(term??document.getElementById('bu46-search-input')?.value??'').trim();
 if(value.length<2)return toast('Bitte mindestens zwei Zeichen eingeben.');
 const token=++discoveryToken;bu46SearchSeq++;bu46SearchTerm=value;
 if(reset)bu46SearchResults=[];
 bu46SearchBusy=true;
 const status=()=>document.getElementById('bu46-search-status');
 if(status())status().textContent='Suche in Google Books und Open Library …';
 try{
  const result=await catalogQuery(value);
  if(token!==discoveryToken)return;
  const items=result.books.filter(b=>typeof bu46Allowed!=='function'||bu46Allowed(b));
  bu46SearchResults=items.slice(0,90);
  const list=document.getElementById('bu46-search-items');
  if(list)list.innerHTML=bu46SearchResults.map((b,i)=>bu46SearchCard(b,i)).join('');
  if(status())status().textContent=items.length?items.length+' Bücher gefunden'+(result.errors.length?' · eine Quelle ist eingeschränkt':''):
    'Keine Treffer. '+(result.errors.length?'Verbindungsproblem: '+result.errors.join(' | ').slice(0,220):'Versuche Titel, Autor oder ISBN.');
  if(typeof bu43LoadCovers==='function')bu43LoadCovers();
 }catch(e){if(token===discoveryToken&&status())status().textContent='Buchsuche fehlgeschlagen: '+String(e.message||e);}
 finally{if(token===discoveryToken)bu46SearchBusy=false;}
};
const beforeLookup=window.bu48Lookup;
window.bu48Lookup=async function(id,options={}){
 const b=[...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));if(!b)return null;
 const first=await beforeLookup.apply(this,arguments);
 if(!b.title || (first?.candidates?.length&&b.description&&b.publisher))return first;
 const result=await catalogQuery(String(b.isbn||b.title),b.isbn?'':b.author||'');
 const wanted=normalize(b.title),author=normalize(b.author);
 const scored=result.books.map(c=>({...c,confidence:(normalize(c.title)===wanted?80:normalize(c.title).includes(wanted)&&wanted.length>5?58:0)+(author&&(normalize(c.author).includes(author)||author.includes(normalize(c.author)))?18:0)})).filter(c=>c.confidence>=70).sort((a,b)=>b.confidence-a.confidence);
 let changes=0;
 const pick=scored[0];
 if(pick){for(const k of ['author','year','publisher','pages','language','description','genre','tags']){
  if(!b[k]&&pick[k]){b[k]=k==='description'?String(pick[k]).replace(/<[^>]+>/g,' ').slice(0,7000):pick[k];changes++;}
 }
 if(!b.covers?.length&&!b.cover&&pick.cover){b.covers=[pick.cover];changes++;}
 const editions=new Set(scored.map(x=>String(x.isbn||'').replace(/[^\dX]/gi,'')).filter(x=>x.length===13));
 if(!b.isbn&&editions.size===1&&pick.confidence>=95){b.isbn=[...editions][0];changes++;}
 }
 if(changes){persist();if(['detail','libraryDetail'].includes(view))render();}
 if(!options.silent && !changes && !first?.candidates?.length)toast(result.errors.length?'Online-Buchdaten: '+result.errors.join(' | ').slice(0,180):'Kein eindeutiger Treffer. Prüfe Titel und Autor.');
 return first?.candidates?.length?first:{candidates:scored,suggestions:scored.filter(x=>x.isbn),errors:result.errors};
};
window.bu46EnrichBook=function(id){return window.bu48Lookup(id,{silent:false});};
window.bu47EnrichOwnedBook=function(id,silent=false){return window.bu48Lookup(id,{silent});};
const defaultRecs=window.buRecs;
if(typeof defaultRecs==='function'){
 window.buRecs=function(){
  const obj=defaultRecs.apply(this,arguments),cycle=Number(ALL.recCycle||0);
  if(!cycle||obj.list.length<3)return obj;
  const list=[...obj.list],shift=(cycle*13)%list.length;
  return {...obj,list:[...list.slice(shift),...list.slice(0,shift)]};
 };
}
let recommendationBusy=false;
window.bu46MoreBooks=async function(){
 if(recommendationBusy)return;
 recommendationBusy=true;ALL.recCycle=(Number(ALL.recCycle)||0)+1;persist();
 if(view==='home')render();toast('Suche nach anderen Büchern …');
 try{
  // Rotate categories and request broader results; use native catalog search if WebView CORS fails.
  if(typeof bu44FetchRecommendations==='function')await bu44FetchRecommendations(true);
  if(window.booksupCatalog?.search){
   const words=sp==='manga'?['manga','comic','graphic novel','webtoon','shonen','manhwa']:
     ['fantasy','mystery','science fiction','literature','romance','history','nonfiction','biography','adventure'];
   const picked=[words[ALL.recCycle%words.length],words[(ALL.recCycle*3+1)%words.length]];
   const responses=await Promise.allSettled(picked.map(title=>window.booksupCatalog.search({title})));
   const old=new Set(bu44Remote.map(b=>normalize(b.title)+'|'+normalize(b.author)));
   const additions=responses.flatMap(x=>x.status==='fulfilled'?catalogRows(x.value):[]).filter(b=>{
    const key=normalize(b.title)+'|'+normalize(b.author);
    if(!b.title||old.has(key)||typeof bu46Allowed==='function'&&!bu46Allowed(b))return false;
    old.add(key);return true;
   }).slice(0,65);
   if(additions.length){bu44Remote=[...additions,...bu44Remote].slice(0,400);
    bu44LastFetch=Date.now();
    try{localStorage.setItem(BU44_REC_KEY,JSON.stringify({time:bu44LastFetch,items:bu44Remote}))}catch{}
   }
  }
  render();toast('Neue Empfehlungen geladen. Weitere Bücher entdecken wechselt die Auswahl.');
 }catch(e){render();toast('Online-Bücher konnten nicht geladen werden. Lokale Empfehlungen wurden neu gemischt.');}
 finally{recommendationBusy=false;}
};
// Extended UI translations. Do not rewrite user-entered names, reading text or article bodies.
const translations={
 'Mehr Bücher entdecken':['Discover more books','Découvrir plus de livres','Descubrir más libros','Scopri altri libri'],
 'Kombination dauerhaft speichern':['Save combination','Enregistrer la combinaison','Guardar combinación','Salva combinazione'],
 'Eigene Designkombinationen':['Saved design combinations','Combinaisons enregistrées','Combinaciones guardadas','Combinazioni salvate'],
 'Hintergrundbild':['Background image','Image de fond','Imagen de fondo','Immagine di sfondo'],
 'Geräte direkt verbinden':['Connect devices directly','Connexion directe','Conectar dispositivos','Collega dispositivi'],
 'Leselisten verwalten':['Manage reading lists','Gérer les listes de lecture','Gestionar listas','Gestisci liste'],
 'Schriftarten suchen':['Search fonts','Rechercher des polices','Buscar fuentes','Cerca caratteri'],
 'Suchen':['Search','Rechercher','Buscar','Cerca'],
 'Profil bearbeiten':['Edit profile','Modifier le profil','Editar perfil','Modifica il profilo'],
 'Bücherregal':['Bookshelf','Étagère','Estantería','Scaffale'],
 'Meine Leselisten':['My reading lists','Mes listes de lecture','Mis listas de lectura','Le mie liste'],
 'Neue Leseliste':['New reading list','Nouvelle liste de lecture','Nueva lista','Nuova lista'],
 'Lesestatistik':['Reading statistics','Statistiques de lecture','Estadísticas de lectura','Statistiche di lettura'],
 'Notizen':['Notes','Notes','Notas','Note'],
 'Markierungen':['Highlights','Surlignages','Destacados','Evidenziazioni'],
 'Hinzufügen':['Add','Ajouter','Añadir','Aggiungi'],
 'Entfernen':['Remove','Retirer','Eliminar','Rimuovi'],
 'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
 'Änderungsverlauf':['Changelog','Journal des modifications','Historial de cambios','Registro modifiche'],
 'Mehr Optionen':['More options','Plus d’options','Más opciones','Altre opzioni'],
 'Buchdaten online suchen':['Search book details online','Rechercher les données du livre','Buscar datos en línea','Cerca informazioni online'],
 'Bücher suchen':['Search books','Rechercher des livres','Buscar libros','Cerca libri'],
 'Darstellung':['Appearance','Apparence','Apariencia','Aspetto'],
 'Schriftgröße':['Font size','Taille du texte','Tamaño del texto','Dimensione carattere'],
 'Sprache':['Language','Langue','Idioma','Lingua'],
 'Profileinstellungen':['Profile settings','Paramètres du profil','Ajustes del perfil','Impostazioni profilo'],
 'Neu laden':['Refresh','Actualiser','Actualizar','Aggiorna'],
 'Meine Bibliothek':['My library','Ma bibliothèque','Mi biblioteca','La mia biblioteca'],
 'Alle Leselisten':['All reading lists','Toutes les listes','Todas las listas','Tutte le liste'],
 'Speichern':['Save','Enregistrer','Guardar','Salva'],
 'Abbrechen':['Cancel','Annuler','Cancelar','Annulla'],
 'Zurück':['Back','Retour','Volver','Indietro']
};
const previousTranslate=window.buTranslate;
window.buTranslate=function(text,lang){
 const x=String(text||'').trim(),i={en:0,fr:1,es:2,it:3}[lang];
 if(translations[x]&&i!==undefined)return translations[x][i];
 return previousTranslate.apply(this,arguments);
};
const beforeRender=window.nextAfterRender;
window.nextAfterRender=function(){
 beforeRender?.apply(this,arguments);
 if(view==='settingsDetail'&&nextSettingCategory==='appearance')refreshFonts();
 document.body.classList.toggle('bu51-mobile',mobile());
};
/* Short LAN pairing: six-digit PIN + host address, no long SDP clipboard strings. */
let lanTimer=null,lanBusy=false;
const lanStatus=message=>{const e=document.getElementById('bu51-lan-status');if(e)e.textContent=message;};
function lanStopPoll(){if(lanTimer){clearInterval(lanTimer);lanTimer=null;}}
window.bu51LanHost=async function(){
 if(lanBusy)return;
 if(!window.booksupLan?.host)return lanStatus('Gerätehosting ist derzeit in der Windows-Version verfügbar. Öffne BooksUp auf deinem Windows-PC und wähle „Verbindung anbieten“.');
 lanBusy=true;
 try{
  lanStatus('Erstelle verschlüsseltes Verbindungsangebot …');
  await window.bu50StartPeer();
  const src=document.getElementById('bu50-local-sdp')?.value;
  if(!src)throw Error('WebRTC-Angebot wurde nicht erstellt.');
  const result=await window.booksupLan.host(JSON.parse(src));
  const value=document.getElementById('bu51-lan-host-details');
  if(value)value.textContent=(result.ips||[]).join(' oder ')+':'+result.port+' · PIN '+result.pin;
  lanStatus('Bereit. Auf Android oder Windows die angezeigte Adresse und den sechsstelligen PIN eingeben.');
  lanStopPoll();lanTimer=setInterval(async()=>{
   try{
    const incoming=await window.booksupLan.poll();
    if(incoming?.type==='answer'){
     lanStopPoll();
     const field=document.getElementById('bu50-remote-sdp');if(field)field.value=JSON.stringify(incoming);
     await window.bu50FinishPeer();lanStatus('Antwort übernommen. Beide Geräte sollten denselben Sicherheitscode anzeigen. Erst danach Daten senden.');
    }
   }catch(error){lanStopPoll();lanStatus('Lokale Verbindung unterbrochen: '+error.message);}
  },900);
 }catch(error){lanStatus('Start fehlgeschlagen: '+String(error.message||error));}
 finally{lanBusy=false;}
};
const privateIP=(value)=>/^(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(value)&&value.split('.').every(x=>Number(x)<=255);
async function lanSignal(args){
 if(window.booksupLan?.signal)return window.booksupLan.signal(args);
 if(!mobile())throw Error('LAN-Signaling wird auf diesem Gerät nicht unterstützt.');
 const api=window.Capacitor?.Plugins?.CapacitorHttp;
 if(!api?.get||!api?.post)throw Error('Android-HTTP-Schnittstelle fehlt. Bitte die aktuelle Android-APK installieren.');
 const uri='http://'+args.ip+':'+args.port+'/'+args.action+'?pin='+encodeURIComponent(args.pin);
 const options={url:uri,connectTimeout:12000,readTimeout:12000};
 const result=args.action==='answer'?await api.post({...options,headers:{'Content-Type':'application/json'},data:{answer:args.answer}}):await api.get(options);
 if(Number(result.status)<200||Number(result.status)>=300)throw Error('Verbindung abgelehnt (HTTP '+result.status+').');
 return typeof result.data==='string'?JSON.parse(result.data):result.data;
}
window.bu51LanJoin=async function(){
 if(lanBusy)return;lanBusy=true;
 try{
  const entry=String(document.getElementById('bu51-lan-address')?.value||'').trim();
  const pin=String(document.getElementById('bu51-lan-pin')?.value||'').trim();
  const match=entry.match(/^([^:]+):(\d{2,5})$/);
  const ip=match?.[1],port=Number(match?.[2]);
  if(!privateIP(ip)||port<1024||port>65535||!/^\d{6}$/.test(pin))throw Error('Lokale IPv4-Adresse mit Port (z. B. 192.168.1.10:40000) und sechsstelligen PIN eingeben.');
  lanStatus('Verbindungsangebot wird direkt vom Windows-PC geladen …');
  const response=await lanSignal({ip,port,pin,action:'offer'});
  if(response?.offer?.type!=='offer')throw Error('Ungültiges Angebot vom PC.');
  const remote=document.getElementById('bu50-remote-sdp');if(!remote)throw Error('Verbindungsformular fehlt.');
  remote.value=JSON.stringify(response.offer);
  await window.bu50AcceptPeer();
  const local=document.getElementById('bu50-local-sdp')?.value;
  if(!local)throw Error('WebRTC-Antwort konnte nicht erstellt werden.');
  await lanSignal({ip,port,pin,action:'answer',answer:JSON.parse(local)});
  lanStatus('Antwort gesendet. Vergleiche den Sicherheitscode beider Geräte; danach kannst du die Bücher übertragen.');
 }catch(error){lanStatus('Verbindung fehlgeschlagen: '+String(error.message||error));}
 finally{lanBusy=false;}
};
window.bu51LanStop=async function(){
 lanStopPoll();
 try{await window.booksupLan?.stop?.()}catch{}
 window.bu50PeerStop();lanStatus('Verbindung getrennt.');
};
const beforePair=window.bu50PairingView;
window.bu50PairingView=function(){
 const original=beforePair.apply(this,arguments);
 const quick='<div class="bu51-lan-pair"><h2>Mit PIN verbinden</h2>'+
 '<p class="hint">Ohne Internetserver: Ein Windows-PC bietet die Verbindung im selben WLAN oder Hotspot an. Auf dem zweiten Gerät werden nur lokale Adresse und sechsstelliger PIN benötigt.</p>'+
 '<div class="bu51-lan-box"><h3>1. Am Windows-PC</h3><button class="btn" onclick="bu51LanHost()">Verbindung anbieten</button>'+
 '<p id="bu51-lan-host-details" class="bu51-lan-address" aria-live="polite">Adresse und PIN erscheinen hier.</p></div>'+
 '<div class="bu51-lan-box"><h3>2. Am zweiten Gerät (Android oder Windows)</h3>'+
 '<label>Lokale Adresse des Windows-PCs <input id="bu51-lan-address" inputmode="url" autocomplete="off" placeholder="192.168.1.10:40000"></label>'+
 '<label>Sechsstelliger PIN <input id="bu51-lan-pin" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000"></label>'+
 '<button class="btn" onclick="bu51LanJoin()">Verbinden</button></div>'+
 '<p id="bu51-lan-status" role="status">Noch nicht verbunden.</p>'+
 '<p class="hint">Keine Router-Freigabe nötig. Die Windows-Firewall muss lokale Verbindungen erlauben. Die Daten laufen anschließend verschlüsselt über WebRTC; Sicherheitscode vergleichen. Android-zu-Android-Hosting ist noch nicht verfügbar.</p>'+
 '<button class="chip" onclick="bu51LanStop()">Verbindung beenden</button></div>';
 const anchor='<div class="bu50-pair-steps">';
 const advanced='<details class="bu51-advanced"><summary>Erweiterte Verbindung über manuelle WebRTC-Texte</summary>'+anchor;
 return original.replace(anchor,quick+advanced).replace(/<\/div><\/section>$/,'</div></details></section>');
};

})();