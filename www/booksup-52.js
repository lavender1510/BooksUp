/* BooksUp 5.2: reader gestures, native metadata, genuine recommendations, LAN diagnostics, language and accessibility. */
(function(){
'use strict';
if(window.booksup52)return;window.booksup52=true;
const onAndroid=()=>window.Capacitor?.getPlatform?.()==='android';
const keyOf=b=>String(b?.isbn||'').replace(/[^\dX]/gi,'')||String(b?.title||'').normalize('NFKD').toLocaleLowerCase()+'|'+String(b?.author||'').toLocaleLowerCase();
const native=async(method,data)=>{
 const x=window.Capacitor?.Plugins?.BooksUpNetwork;
 if(x?.[method])return x[method](data);
 if(typeof window.Capacitor?.nativePromise==='function')return window.Capacitor.nativePromise('BooksUpNetwork',method,data);
 throw Error('BooksUp 5.2 Netzwerkdienst nicht registriert. Bitte die aktuelle APK installieren.');
};
if(onAndroid()){
 const oldCatalog=window.booksupCatalog?.search;
 window.booksupCatalog??={};
 window.booksupCatalog.search=async request=>{
   try{return await native('searchCatalog',request||{});}
   catch(e){
    if(oldCatalog){const result=await oldCatalog(request);result.errors=[...(result.errors||[]),'Android-Netzwerkdienst: '+String(e.message||e)];return result;}
    throw e;
   }
 };
 window.booksupLan??={};
 window.booksupLan.signal=async args=>native('signal',args);
}
/* Gestures: trackpad pinch is Ctrl/Meta+wheel. Touch pinch commits once after
 * fingers release, rather than remounting the entire PDF on every touchmove. */
let gesture=null,zoomCommit=null;
const clampZoom=v=>Math.round(Math.max(.8,Math.min(3,Number(v)||1))*100)/100;
function zoomValue(){return clampZoom(S.pdfZoom||1);}
function targetReader(e){const el=e.target;return view==='reader'&&el?.closest?.('#rdscroll, #rdbody, #rdwrap')&&pdfDoc&&typeof bu44ZoomSet==='function';}
function previewZoom(value,x,y){
 const root=document.getElementById('rdscroll');if(!root)return;
 const target=clampZoom(value),relative=target/zoomValue();
 root.style.setProperty('--bu52-preview-scale',String(relative));
 root.style.setProperty('--bu52-origin-x',Math.round(x)+'px');
 root.style.setProperty('--bu52-origin-y',Math.round(y)+'px');
 root.classList.toggle('bu52-pinch-preview',Math.abs(relative-1)>.01);
 const label=document.getElementById('bu52-gesture-zoom');if(label)label.textContent=Math.round(target*100)+'%';
}
function finishZoom(value){
 const root=document.getElementById('rdscroll');
 if(root){root.classList.remove('bu52-pinch-preview');root.style.removeProperty('--bu52-preview-scale');}
 if(view==='reader'&&typeof bu44ZoomSet==='function'){
  const v=clampZoom(value);bu44ZoomSet(Math.min(3,v));
 }
}
document.addEventListener('wheel',e=>{
 if(!targetReader(e)||!(e.ctrlKey||e.metaKey))return;
 e.preventDefault();e.stopPropagation();
 const root=document.getElementById('rdscroll'),rect=root?.getBoundingClientRect();
 const x=rect?e.clientX-rect.left:0,y=rect?e.clientY-rect.top:0;
 if(!gesture||gesture.kind!=='wheel')gesture={kind:'wheel',value:zoomValue()};
 const amount=Math.min(2.5,Math.abs(e.deltaY||0));
 gesture.value=clampZoom(gesture.value*Math.exp(-Math.sign(e.deltaY||0)*amount*.012));
 previewZoom(gesture.value,x,y);
 clearTimeout(zoomCommit);zoomCommit=setTimeout(()=>{finishZoom(gesture.value);gesture=null;},135);
},{passive:false,capture:true});
const gap=e=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
document.addEventListener('touchstart',e=>{
 if(!targetReader(e)||e.touches.length!==2)return;
 window.bu52Pinching=true;
 gesture={kind:'touch',start:Math.max(1,gap(e)),base:zoomValue(),value:zoomValue()};
},{passive:true,capture:true});
document.addEventListener('touchmove',e=>{
 if(!gesture||gesture.kind!=='touch'||e.touches.length!==2||!targetReader(e))return;
 e.preventDefault();e.stopPropagation();
 const root=document.getElementById('rdscroll'),rect=root?.getBoundingClientRect();
 const x=(e.touches[0].clientX+e.touches[1].clientX)/2-(rect?.left||0),y=(e.touches[0].clientY+e.touches[1].clientY)/2-(rect?.top||0);
 gesture.value=clampZoom(gesture.base*gap(e)/gesture.start);
 previewZoom(gesture.value,x,y);
},{passive:false,capture:true});
function touchFinish(e){
 if(gesture?.kind!=='touch'||e.touches?.length>=2)return;
 finishZoom(gesture.value);gesture=null;
 queueMicrotask(()=>{window.bu52Pinching=false;});
}
document.addEventListener('touchend',touchFinish,{passive:true,capture:true});
document.addEventListener('touchcancel',touchFinish,{passive:true,capture:true});
const afterRender=window.nextAfterRender;
window.nextAfterRender=function(){
 afterRender?.apply(this,arguments);
 document.body.classList.toggle('bu52-android',onAndroid());
 if(view==='reader'){
   const root=document.getElementById('rdwrap');
   if(root&&!document.getElementById('bu52-gesture-zoom')){
    const hud=document.createElement('span');hud.id='bu52-gesture-zoom';hud.className='bu52-gesture-zoom';hud.setAttribute('aria-live','polite');hud.textContent=Math.round(zoomValue()*100)+'%';
    root.appendChild(hud);
   }
 }
};
/* Real catalog sources: Android uses a native HTTPS client; desktop uses the
 * Electron main-process gateway. CORS fallbacks only when native isn't usable. */
const oldLookup=window.bu48Lookup;
window.bu48Lookup=async function(id,opts={}){
 const b=[...S.books,...(typeof bu45Extra==='function'?bu45Extra():[])].find(x=>String(x.id)===String(id));
 if(!b)return null;
 const old=await oldLookup.apply(this,arguments);
 if((b.description&&b.publisher&&b.covers?.length)||!(b.title||b.isbn))return old;
 let result,errors=[];
 try{result=await window.booksupCatalog.search({title:b.title||'',author:b.author||'',isbn:b.isbn||''});errors=result.errors||[];}
 catch(e){if(!opts.silent)toast('Buchdaten: '+String(e.message||e));return old;}
 const items=[];
 for(const row of result.google||[]){
  const v=row.volumeInfo||{};if(!v.title)continue;
  items.push({title:v.title,author:(v.authors||[]).join(', '),publisher:v.publisher||'',year:(v.publishedDate||'').slice(0,4),pages:v.pageCount||0,genre:v.categories?.[0]||'',description:v.description||'',cover:v.imageLinks?.thumbnail?.replace(/^http:/,'https:')||'',isbn:v.industryIdentifiers?.find(x=>x.type==='ISBN_13')?.identifier||''});
 }
 for(const row of result.open||[]){
  if(!row.title)continue;
  items.push({title:row.title,author:(row.author_name||[]).join(', '),publisher:row.publisher?.[0]||'',year:row.first_publish_year||'',genre:row.subject?.[0]||'',cover:row.cover_i?'https://covers.openlibrary.org/b/id/'+Number(row.cover_i)+'-L.jpg':'',isbn:row.isbn?.[0]||''});
 }
 const simplify=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const q=simplify(b.title),a=simplify(b.author),isbn=String(b.isbn||'').replace(/[^\dX]/gi,'');
 const ranked=items.map(x=>{
  const t=simplify(x.title),author=simplify(x.author),exactISBN=isbn&&x.isbn&&isbn===String(x.isbn).replace(/[^\dX]/gi,'');
  const match=exactISBN?130:(t===q?85:q.length>6&&(t.includes(q)||q.includes(t))?55:0)+(!a?0:author===a?20:author&&a&&(author.includes(a)||a.includes(author))?12:0);
  return {...x,match};
 }).filter(x=>x.match>=75).sort((x,y)=>y.match-x.match);
 const best=ranked[0];let changed=0;
 if(best)for(const field of ['description','publisher','year','pages','genre']){
  if(!b[field]&&best[field]){b[field]=field==='description'?String(best[field]).replace(/<[^>]*>/g,' ').slice(0,7000):best[field];changed++;}
 }
 if(best?.cover&&!b.cover&&!b.covers?.length){b.covers=[best.cover];changed++;}
 if(!b.isbn&&best?.match>=105&&ranked.filter(x=>x.isbn).every(x=>x.isbn===best.isbn)&&best.isbn){b.isbn=best.isbn;changed++;}
 if(changed){persist();if(['detail','libraryDetail'].includes(view))render();}
 if(!opts.silent)toast(changed?changed+' zusätzliche Buchinformationen gefunden.':errors.length?'Katalogquellen: '+errors.join(' | ').slice(0,200):'Keine weiteren passenden Angaben.');
 return old?.candidates?.length?old:{candidates:ranked,suggestions:ranked.filter(x=>x.isbn),errors};
};
/* New results are sampled from actual catalog responses, not the repeating
 * static demo catalog. User-owned and previously shown items are excluded. */
const oldRecs=window.buRecs;
/* Reliable LAN native join: no insecure mixed-content WebView requests. */
if(onAndroid()){
 window.booksupLan??={};
 window.booksupLan.signal=data=>native('signal',data);
}
const prevLanJoin=window.bu51LanJoin;
window.bu51LanJoin=async function(){
 const input=document.getElementById('bu51-lan-address');
 const text=String(input?.value||'').trim();
 if(input&&text&&!/^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(text)){
  const msg=document.getElementById('bu51-lan-status');
  if(msg)msg.textContent='Bitte die lokale IPv4-Adresse des Windows-PCs (gleiches WLAN) angeben.';
  return;
 }
 return prevLanJoin();
};
/* Wallpaper contrast is sampled from the user's original image. Keep a
 * readable translucent surface even when a photo has mixed light/dark zones. */
let sampledUrl='';
async function sampleBackground(){
 if(!document.documentElement.classList.contains('bu50-has-background')||view==='reader')return;
 const css=document.documentElement.style.getPropertyValue('--bu50-bg-image');
 const hit=css.match(/url\(["']?(blob:[^"')]+)["']?\)/);
 if(!hit||hit[1]===sampledUrl)return;
 sampledUrl=hit[1];
 try{
  const image=new Image();image.src=sampledUrl;await image.decode();
  const c=document.createElement('canvas');c.width=c.height=24;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,24,24);
  const px=ctx.getImageData(0,0,24,24).data;let total=0;
  for(let i=0;i<px.length;i+=4)total+=(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])/255;
  const bright=total/(px.length/4)>.52;
  document.documentElement.dataset.bu52Wallpaper=bright?'light':'dark';
 }catch(e){document.documentElement.dataset.bu52Wallpaper='dark';}
}
const after=window.nextAfterRender;
window.nextAfterRender=function(){after?.apply(this,arguments);if(view!=='reader')void sampleBackground();};
/* Language forcing is applied after every screen render and DOM refresh.
 * Do not translate books/reader, user notes, article bodies or authored titles. */
const extraTranslations={
 'Empfehlungen':['Recommendations','Recommandations','Recomendaciones','Consigli'],
 'Buch suchen':['Search book','Rechercher un livre','Buscar libro','Cerca libro'],
 'Profil':['Profile','Profil','Perfil','Profilo'],
 'Bibliothek':['Library','Bibliothèque','Biblioteca','Biblioteca'],
 'Leselisten':['Reading lists','Listes de lecture','Listas de lectura','Liste di lettura'],
 'Auf Updates prüfen':['Check for updates','Vérifier les mises à jour','Buscar actualizaciones','Verifica aggiornamenti'],
 'Nach Updates suchen':['Check for updates','Rechercher des mises à jour','Buscar actualizaciones','Controlla aggiornamenti'],
 'Bücher entdecken':['Discover books','Découvrir des livres','Descubrir libros','Scopri libri'],
 'Mehr Bücher entdecken':['Explore more books','Découvrir plus de livres','Explorar más libros','Scopri altri libri'],
 'Profil bearbeiten':['Edit profile','Modifier le profil','Editar perfil','Modifica profilo'],
 'Weiterlesen':['Continue reading','Continuer la lecture','Continuar leyendo','Continua a leggere'],
 'Neue Bücher laden':['Load new books','Charger des livres','Cargar nuevos libros','Carica nuovi libri'],
 'Geräte verbinden':['Connect devices','Connecter des appareils','Conectar dispositivos','Collega dispositivi'],
 'Verbindung anbieten':['Offer connection','Proposer la connexion','Ofrecer conexión','Offri connessione'],
 'Verbinden':['Connect','Connecter','Conectar','Connetti'],
 'Schriftart':['Font','Police','Fuente','Carattere'],
 'Hintergrund':['Background','Arrière-plan','Fondo','Sfondo'],
 'Änderungsverlauf':['Changelog','Historique des modifications','Historial de cambios','Registro modifiche'],
 'Datensicherung':['Backup','Sauvegarde','Copia de seguridad','Backup'],
 'Sprache':['Language','Langue','Idioma','Lingua'],
 'Darstellung':['Appearance','Apparence','Apariencia','Aspetto'],
 'Leseeinstellungen':['Reading settings','Paramètres de lecture','Ajustes de lectura','Impostazioni di lettura'],
 'Buchdetails':['Book details','Détails du livre','Detalles del libro','Dettagli del libro'],
 'In Ordner':['Move to folder','Déplacer vers un dossier','Mover a carpeta','Sposta nella cartella'],
 'Löschen':['Delete','Supprimer','Eliminar','Elimina'],
 'Aktualisieren':['Refresh','Actualiser','Actualizar','Aggiorna'],
 'Speichern':['Save','Enregistrer','Guardar','Salva'],
 'Schließen':['Close','Fermer','Cerrar','Chiudi'],
 'Zurück':['Back','Retour','Volver','Indietro'],
 'Meine Bücher':['My books','Mes livres','Mis libros','I miei libri'],
 'Bücherregal':['Bookshelf','Étagère','Estantería','Scaffale'],
 'Suchen':['Search','Rechercher','Buscar','Cerca']
};
const oldTranslate=window.buTranslate;
window.buTranslate=function(value,lang){
 const text=String(value||'').trim(),idx={en:0,fr:1,es:2,it:3}[lang];
 if(idx!==undefined&&extraTranslations[text])return extraTranslations[text][idx];
 return oldTranslate.apply(this,arguments);
};
let scheduled=false,languageObserver=null,languageRoot=null;
function forceLanguage(){
 if(view==='reader')return;
 const lang=typeof nextLanguage==='function'?nextLanguage():'de';
 document.documentElement.lang=lang;
 if(typeof buTranslateUI==='function')buTranslateUI();
 // The observer catches async recommendations, metadata and news UI changes.
}
function afterMutation(){
 if(scheduled||view==='reader')return;
 scheduled=true;queueMicrotask(()=>{scheduled=false;forceLanguage();});
}
function bindLanguageObserver(){
 const app=document.getElementById('app');
 if(!app||app===languageRoot)return;
 languageObserver?.disconnect();
 languageRoot=app;
 languageObserver=new MutationObserver(mutations=>{
  if(view==='reader')return;
  if(mutations.some(x=>x.type==='childList'&&x.addedNodes?.length))afterMutation();
 });
 languageObserver.observe(app,{childList:true,subtree:true});
}
const priorAfter=window.nextAfterRender;
window.nextAfterRender=function(){
 priorAfter?.apply(this,arguments);
 bindLanguageObserver();
 if(view!=='reader')forceLanguage();
};

/* Platform update progress is delivered into the settings page without silently
 * restarting the app, and signing errors are surfaced rather than hidden. */
function updateStatus(message,percent){
 const element=document.getElementById('bu50-update-status');
 if(element)element.textContent=String(message||'')+(Number.isFinite(percent)?' '+Math.max(0,Math.min(100,Math.round(percent)))+'%':'');
}
try{
 window.booksupUpdateEvents?.subscribe?.(data=>updateStatus(data.message,data.percent));
 const updates=window.Capacitor?.Plugins?.BooksUpUpdater;
 updates?.addListener?.('downloadProgress',progress=>{
  const total=Number(progress.totalBytes),downloaded=Number(progress.downloadedBytes);
  updateStatus('Android-APK wird heruntergeladen …',total>0?100*downloaded/total:null);
 });
}catch(e){console.debug('BooksUp update progress listener:',e);}
})();