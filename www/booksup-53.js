/* BooksUp 5.3 – persistent reader zoom, real highlighting and safe UI localization. */
(function(){
'use strict';
if(window.booksup53)return;window.booksup53=true;
const android=()=>window.Capacitor?.getPlatform?.()==='android';
const clamp=(v,min,max)=>{const n=Number(v);return Math.min(max,Math.max(min,Number.isFinite(n)?n:1));};
const book=()=>S.books.find(b=>String(b.id)===String(cur));
const reading=()=>view==='reader'&&!!document.getElementById('rdscroll');
const escape=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function pageZoom(){return clamp(S.pdfZoom||1,.8,3);}
function commitZoom(value,focus){
 const zoom=Math.round(clamp(value,.8,3)*10)/10;
 S.pdfZoom=zoom;
 const previousPage=Number(typeof pgNow==='undefined'?book()?.page||1:pgNow);
 const root=document.getElementById('rdscroll');
 const x=focus?.x||root?.clientWidth/2||0,y=focus?.y||root?.clientHeight/2||0;
 if(root){
  root.classList.remove('bu52-pinch-preview');
  root.style.removeProperty('--bu52-preview-scale');
  root.style.removeProperty('transform');
  root.classList.toggle('bu44-zoomed',zoom>1.02);
 }
 // Store before touching canvases; renderer then reads the final scale rather
 // than reverting to the original size after the fingers release.
 persist();
 if(typeof bu44ZoomSet==='function')bu44ZoomSet(zoom);
 if(root){
  let attempts=0;
  const keepFocus=()=>{if(!root.isConnected)return;if(++attempts<3){requestAnimationFrame(keepFocus);return;}
   root.scrollLeft=Math.max(0,root.scrollWidth>root.clientWidth?root.scrollWidth*(x/(root.clientWidth||1))-x:0);
   root.scrollTop=Math.max(0,root.scrollHeight>root.clientHeight?root.scrollHeight*(y/(root.clientHeight||1))-y:0);
   if(typeof pgNow!=='undefined'&&typeof rdMode==='function'&&rdMode()===0&&pgNow!==previousPage)pgNow=previousPage;
  };
  requestAnimationFrame(keepFocus);
 }
 const badge=document.getElementById('bu53-zoom-percent');if(badge)badge.textContent=Math.round(zoom*100)+'%';
 const slider=document.getElementById('bu53-zoom-slider');if(slider)slider.value=String(Math.round(zoom*100));
}
window.bu53ZoomTo=zoom=>commitZoom(Number(zoom));
let live=null;
function canZoom(e){return reading() && !!e.target?.closest?.('#rdscroll, #rdbody') && typeof bu44ZoomSet==='function' && typeof pdfDoc!=='undefined' && !!pdfDoc;}
function preview(zoom,x,y){
 const root=document.getElementById('rdscroll');if(!root)return;
 root.style.setProperty('--bu52-preview-scale',String(clamp(zoom,.8,3)/pageZoom()));
 root.style.setProperty('--bu52-origin-x',x+'px');root.style.setProperty('--bu52-origin-y',y+'px');
 root.classList.add('bu52-pinch-preview');
 const badge=document.getElementById('bu53-zoom-percent');if(badge)badge.textContent=Math.round(clamp(zoom,.8,3)*100)+'%';
}
const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
function onTouchStart(e){
 if(!canZoom(e)||e.touches.length!==2)return;
 const root=document.getElementById('rdscroll'),r=root.getBoundingClientRect();
 live={type:'touch',base:pageZoom(),value:pageZoom(),distance:Math.max(1,distance(e.touches)),x:(e.touches[0].clientX+e.touches[1].clientX)/2-r.left,y:(e.touches[0].clientY+e.touches[1].clientY)/2-r.top};
 window.bu52Pinching=true;
 e.stopImmediatePropagation();
}
function onTouchMove(e){
 if(live?.type!=='touch'||e.touches.length!==2)return;
 e.preventDefault();e.stopImmediatePropagation();
 live.value=clamp(live.base*distance(e.touches)/live.distance,.8,3);
 preview(live.value,live.x,live.y);
}
function onTouchDone(e){
 if(live?.type!=='touch'||e.touches?.length>=2)return;
 const gesture=live;live=null;
 e.stopImmediatePropagation();
 commitZoom(gesture.value,gesture);
 // Prevent end-of-pinch from triggering the old swipe handler's page turn.
 setTimeout(()=>{window.bu52Pinching=false;},200);
}
let wheelTimer=0;
function onWheel(e){
 if(!canZoom(e)||!(e.ctrlKey||e.metaKey))return;
 e.preventDefault();e.stopImmediatePropagation();
 const root=document.getElementById('rdscroll'),r=root.getBoundingClientRect();
 if(live?.type!=='wheel')live={type:'wheel',value:pageZoom(),x:e.clientX-r.left,y:e.clientY-r.top};
 live.value=clamp(live.value*Math.exp(-Math.sign(e.deltaY)*Math.min(120,Math.abs(e.deltaY))*.008),.8,3);
 preview(live.value,live.x,live.y);
 clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{const done=live;live=null;if(done)commitZoom(done.value,done);},170);
}
document.addEventListener('touchstart',onTouchStart,{capture:true,passive:true});
document.addEventListener('touchmove',onTouchMove,{capture:true,passive:false});
document.addEventListener('touchend',onTouchDone,{capture:true,passive:false});
document.addEventListener('touchcancel',onTouchDone,{capture:true,passive:false});
document.addEventListener('wheel',onWheel,{capture:true,passive:false});
function zoomToolbar(){
 const wrap=document.getElementById('rdwrap');if(!wrap||wrap.querySelector('.bu53-zoom-toolbar'))return;
 const header=wrap.querySelector('.rdtop');if(!header)return;
 const toolbar=document.createElement('div');toolbar.className='bu53-zoom-toolbar';
 toolbar.innerHTML='<span class="bu53-zoom-title">Zoom</span><button type="button" class="chip" aria-label="Verkleinern" onclick="bu53ZoomTo(Math.max(.8,Number(S.pdfZoom||1)-.2))">−</button>'+
 '<input id="bu53-zoom-slider" type="range" min="80" max="300" step="10" value="'+Math.round(pageZoom()*100)+'" aria-label="Zoomstufe" onchange="bu53ZoomTo(this.value/100)">'+
 '<button type="button" class="chip" aria-label="Vergrößern" onclick="bu53ZoomTo(Math.min(3,Number(S.pdfZoom||1)+.2))">＋</button>'+
 '<strong id="bu53-zoom-percent">'+Math.round(pageZoom()*100)+'%</strong>'+
 '<button type="button" class="chip" onclick="bu53ZoomTo(1)">100%</button>';
 header.insertAdjacentElement('afterend',toolbar);
}
// Real annotations: PDF canvas pixels cannot be DOM-selected. Capture a page-area
// rectangle in normalized coordinates, persist it with the book and reproject on zoom.
let marking=false,markDrag=null;
const canvasPage=c=>c.id==='pdfCv2'?Number(pgNow)+1:Number(c.closest('[data-n]')?.dataset.n||pgNow||book()?.page||1);
const point=(canvas,e)=>{
 const r=canvas.getBoundingClientRect();
 return{x:clamp((e.clientX-r.left)/Math.max(1,r.width),0,1),y:clamp((e.clientY-r.top)/Math.max(1,r.height),0,1)};
};
function highlightSave(canvas,start,end){
 const rect={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),w:Math.abs(start.x-end.x),h:Math.abs(start.y-end.y)};
 if(rect.w<.012||rect.h<.008){toast('Ziehe über den Bereich, den du markieren möchtest.');return;}
 const b=book();if(!b)return;
 b.annotations??=[];
 b.annotations.push({id:crypto.randomUUID(),page:canvasPage(canvas),rect,type:'highlight',text:'',comment:'',created:Date.now()});
 persist();marking=false;updateHighlightButton();renderHighlights();
 toast('Markierung gespeichert – auch nach dem Zoomen.');
}
function updateHighlightButton(){
 document.getElementById('rdscroll')?.classList.toggle('bu53-marking',marking);
 const button=document.getElementById('bu53-highlight-button');
 if(button){button.textContent=marking?'✕ Markierung abbrechen':'▧ Bereich markieren';button.setAttribute('aria-pressed',String(marking));}
}
window.bu53HighlightToggle=function(){marking=!marking;updateHighlightButton();if(marking)toast('Markierungsmodus: Auf einer Buchseite einen Bereich ziehen.');};
window.bu47ToggleHighlightMode=window.bu53HighlightToggle;
function renderHighlights(){
 const sc=document.getElementById('rdscroll'),b=book();if(!sc||!b||view!=='reader')return;
 sc.querySelectorAll('.bu53-highlight').forEach(n=>n.remove());
 for(const canvas of sc.querySelectorAll('canvas')){
  if(!canvas.clientWidth||!canvas.clientHeight||!canvas.width)continue;
  const page=canvasPage(canvas),parent=canvas.parentElement;
  if(!parent)continue;
  if(getComputedStyle(parent).position==='static')parent.style.position='relative';
  for(const a of b.annotations||[]){
   if(!a.rect||Number(a.page)!==page)continue;
   const r=a.rect,el=document.createElement('div');el.className='bu53-highlight';
   el.style.left=(canvas.offsetLeft+r.x*canvas.clientWidth)+'px';
   el.style.top=(canvas.offsetTop+r.y*canvas.clientHeight)+'px';
   el.style.width=(r.w*canvas.clientWidth)+'px';el.style.height=(r.h*canvas.clientHeight)+'px';
   el.title=a.comment||'Markierung auf Seite '+page;
   parent.appendChild(el);
  }
 }
}
window.bu53RenderHighlights=renderHighlights;
function bindHighlightPointer(){
 const sc=document.getElementById('rdscroll');
 if(!sc||sc.dataset.bu53Highlights)return;
 sc.dataset.bu53Highlights='1';
 sc.addEventListener('pointerdown',e=>{
  if(!marking||!e.isPrimary||!e.target.closest?.('canvas'))return;
  const canvas=e.target.closest('canvas');
  if(!canvas.width)return;
  e.preventDefault();e.stopImmediatePropagation();
  markDrag={id:e.pointerId,canvas,start:point(canvas,e),end:point(canvas,e)};
  try{sc.setPointerCapture(e.pointerId);}catch{}
 },true);
 sc.addEventListener('pointermove',e=>{
  if(!markDrag||e.pointerId!==markDrag.id)return;
  e.preventDefault();e.stopImmediatePropagation();
  markDrag.end=point(markDrag.canvas,e);
 },true);
 sc.addEventListener('pointerup',e=>{
  if(!markDrag||e.pointerId!==markDrag.id)return;
  e.preventDefault();e.stopImmediatePropagation();
  const d=markDrag;markDrag=null;highlightSave(d.canvas,d.start,point(d.canvas,e));
 },true);
 sc.addEventListener('pointercancel',()=>{markDrag=null;},true);
 const observer=new MutationObserver(()=>{if(!sc.isConnected){observer.disconnect();return;}requestAnimationFrame(renderHighlights);});
 observer.observe(sc,{childList:true,subtree:false});
}
function addAnnotationToolbar(){
 const wrap=document.getElementById('rdwrap');if(!wrap)return;
 const group=wrap.querySelector('.bu47-reader-tools')||wrap.querySelector('.rdtop');
 if(group&&!group.querySelector('#bu53-highlight-button')){
  const b=document.createElement('button');b.type='button';b.className='chip';b.id='bu53-highlight-button';
  b.textContent='▧ Bereich markieren';b.addEventListener('click',window.bu53HighlightToggle);
  group.prepend(b);
 }
 // Replace the older Android toggle; its old pointer listeners must remain inactive.
 if(group){group.querySelectorAll('button[onclick*="bu47ToggleHighlightMode"]').forEach(b=>b.remove());}
 updateHighlightButton();
 bindHighlightPointer();
 renderHighlights();
}
const previousHighlight=window.nextCaptureHighlight;
const originalShowPage=window.showPg;
if(typeof originalShowPage==='function')window.showPg=async function(){const result=await originalShowPage.apply(this,arguments);requestAnimationFrame(renderHighlights);return result;};
const originalRenderPage=window.drawPg;
if(typeof originalRenderPage==='function')window.drawPg=async function(){const result=await originalRenderPage.apply(this,arguments);requestAnimationFrame(renderHighlights);return result;};
window.nextCaptureHighlight=function(){
 const selection=window.getSelection?.().toString().trim()||'';
 if(selection){
  const b=book();if(!b)return;
  const comment=prompt('Notiz zur markierten Textstelle (optional):','');
  if(comment===null)return;
  b.annotations??=[];
  b.annotations.push({id:crypto.randomUUID(),page:Number(pgNow||b.page||1),type:'text-highlight',text:selection.slice(0,2000),comment:String(comment).slice(0,2000),created:Date.now()});
  try{const active=window.getSelection?.();if(active?.rangeCount){const range=active.getRangeAt(0);if(document.getElementById('rdscroll')?.contains(range.commonAncestorContainer)){const marker=document.createElement('mark');marker.className='bu53-highlighted-text';range.surroundContents(marker);active.removeAllRanges();}}}catch{}
  persist();toast('Textmarkierung gespeichert.');return;
 }
 window.bu53HighlightToggle();
};
function improveReader(){
 if(!reading())return;
 const wrap=document.getElementById('rdwrap');
 if(!wrap)return;
 zoomToolbar();addAnnotationToolbar();
 document.body.classList.toggle('bu53-reader',true);
}
// A display-scoped language pack (screen UI only). Work from a canonical
// German term for each already shipped locale so switching EN→DE restores text.
const dictionary={
 'Lesen':['Read','Lire','Leer','Leggi'],
 'Kapitel':['Chapters','Chapitres','Capítulos','Capitoli'],
 'Notiz':['Note','Note','Nota','Nota'],
 'Profil bearbeiten':['Edit profile','Modifier le profil','Editar perfil','Modifica profilo'],
 'Profil':['Profile','Profil','Perfil','Profilo'],
 'Weiterlesen':['Continue reading','Poursuivre la lecture','Continuar leyendo','Continua a leggere'],
 'Schnellzugriff':['Quick access','Accès rapide','Acceso rápido','Accesso rapido'],
 'Deine Bibliothek':['Your library','Votre bibliothèque','Tu biblioteca','La tua biblioteca'],
 'Bücherregal':['Bookshelf','Étagère','Estantería','Scaffale'],
 'Entdecken':['Discover','Découvrir','Descubrir','Scopri'],
 'News':['News','Actualités','Noticias','Notizie'],
 'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
 'Leselisten':['Reading lists','Listes de lecture','Listas de lectura','Liste di lettura'],
 'Darstellung':['Appearance','Apparence','Apariencia','Aspetto'],
 'Sprache':['Language','Langue','Idioma','Lingua'],
 'Hinzufügen':['Add','Ajouter','Añadir','Aggiungi'],
 'Speichern':['Save','Enregistrer','Guardar','Salva'],
 'Abbrechen':['Cancel','Annuler','Cancelar','Annulla'],
 'Schließen':['Close','Fermer','Cerrar','Chiudi'],
 'Suchen':['Search','Rechercher','Buscar','Cerca'],
 'Suche':['Search','Recherche','Búsqueda','Ricerca'],
 'Vollbild':['Fullscreen','Plein écran','Pantalla completa','Schermo intero'],
 'Seite markieren':['Highlight page','Surligner la page','Marcar página','Evidenzia pagina'],
 'Bereich markieren':['Highlight area','Surligner une zone','Marcar zona','Evidenzia area'],
 'Notiz hinzufügen':['Add note','Ajouter une note','Añadir nota','Aggiungi nota'],
 'Aktuelles Buch':['Current book','Livre actuel','Libro actual','Libro attuale'],
 'Empfehlungen':['Recommendations','Recommandations','Recomendaciones','Consigli'],
 'Mehr Bücher entdecken':['Discover more books','Découvrir plus de livres','Descubrir más libros','Scopri altri libri'],
 'Geräte verbinden':['Connect devices','Connecter les appareils','Conectar dispositivos','Collega dispositivi'],
 'Auf Updates prüfen':['Check for updates','Rechercher des mises à jour','Buscar actualizaciones','Controlla aggiornamenti'],
 'Datensicherung':['Backup','Sauvegarde','Copia de seguridad','Backup'],
 'Bücher':['Books','Livres','Libros','Libri'],
 'Bibliothek':['Library','Bibliothèque','Biblioteca','Biblioteca'],
 'Deine Markierungen & Notizen':['Your highlights & notes','Vos surlignages et notes','Tus destacados y notas','Le tue evidenziazioni e note'],
 'Seiten':['Pages','Pages','Páginas','Pagine'],
 'Fortsetzen':['Resume','Reprendre','Continuar','Riprendi'],
 'Verbinden':['Connect','Connecter','Conectar','Connetti'],
 'Verbindung beenden':['Disconnect','Déconnecter','Desconectar','Disconnetti'],
 'Verbindung anbieten':['Offer connection','Proposer une connexion','Ofrecer conexión','Offri connessione'],
 'Nur Bibliothek':['Library only','Bibliothèque uniquement','Solo biblioteca','Solo biblioteca']
};
const canonical=new Map();
Object.entries(dictionary).forEach(([de,loc])=>{[de,...loc].forEach(v=>canonical.set(v.toLowerCase(),de));});
const localeIndex={de:-1,en:0,fr:1,es:2,it:3};
function translateLabel(text,lang){
 const trimmed=String(text||'').trim();
 const base=canonical.get(trimmed.toLowerCase());if(!base)return text;
 const idx=localeIndex[lang];if(idx===undefined)return text;
 const target=idx<0?base:dictionary[base][idx];
 return text.replace(trimmed,target||base);
}
let localeBusy=false;
function applyLanguage(){
 if(view==='reader'||localeBusy)return;
 const app=document.getElementById('app');if(!app)return;
 const lang=typeof nextLanguage==='function'?nextLanguage():'de';
 document.documentElement.lang=lang;
 localeBusy=true;
 try{
  if(typeof buTranslateUI==='function')buTranslateUI();
  const els=app.querySelectorAll('button, h1,h2,h3,nav span,label,.next-setting-row b,.next-setting-row small,.next-nav-item span,.next-overline,.bar');
  els.forEach(el=>{
   if(el.closest('.bu45-cover,.next-book-card,.next-detail-cover,.next-book-information,.bu49-article,.bu49-news-article,.news-article,.book-title,.bu45-library-detail'))return;
   for(const node of el.childNodes){
    if(node.nodeType!==3||!node.nodeValue?.trim())continue;
    const changed=translateLabel(node.nodeValue,lang);
    if(changed!==node.nodeValue)node.nodeValue=changed;
   }
   for(const attr of ['aria-label','placeholder']){
    if(el.hasAttribute(attr)){const changed=translateLabel(el.getAttribute(attr),lang);el.setAttribute(attr,changed);}
   }
  });
 }finally{localeBusy=false;}
}
let languageObservation;
function observeLanguage(){
 const root=document.getElementById('app');if(!root)return;
 languageObservation?.disconnect();
 languageObservation=new MutationObserver(records=>{
  if(view==='reader'||localeBusy||!records.some(r=>r.addedNodes?.length))return;
  requestAnimationFrame(()=>{applyLanguage();});
 });
 languageObservation.observe(root,{childList:true,subtree:true});
}
const after=window.nextAfterRender;
window.nextAfterRender=function(){
 after?.apply(this,arguments);
 document.body.classList.toggle('bu53-reader',view==='reader');
 if(view==='reader'){setTimeout(improveReader,0);setTimeout(renderHighlights,180);}
 else{applyLanguage();observeLanguage();}
};
window.bu53ApplyLanguage=applyLanguage;

/* Real transfer progress is not an animation: only bytes reported by the
 * Android native downloader and Windows electron-updater advance this bar. */
let updateStart=0;
let downloadLast={bytes:0,time:0};
function fmtBytes(bytes){return Number(bytes)>0?(Number(bytes)/1048576).toFixed(1)+' MB':'0 MB';}
function fmtTime(seconds){const s=Math.max(0,Math.ceil(seconds));return s>=60?Math.floor(s/60)+' min '+s%60+' s':s+' s';}
function progressUpdate(data){
 const panel=document.getElementById('bu53-update-progress');if(!panel)return;
 const bytes=Number(data?.transferred||data?.downloadedBytes||0);
 const total=Number(data?.total||data?.totalBytes||0);
 const now=Date.now();
 if(!updateStart){updateStart=now;downloadLast={bytes:0,time:now};}
 const seconds=Math.max(.001,(now-updateStart)/1000);
 const speed=Number(data?.bytesPerSecond||0)||(bytes>0?bytes/seconds:0);
 const rawPct=total>0?Math.round(bytes/total*100):data?.percent;
 const pct=Number.isFinite(Number(rawPct))&&rawPct!==null?Math.max(0,Math.min(100,Number(rawPct))):null;
 const bar=panel.querySelector('progress'),label=panel.querySelector('.bu53-update-progress-label');
 if(bar){if(pct===null)bar.removeAttribute('value');else bar.value=pct;}
 if(label){
  const eta=total>bytes&&speed>100?fmtTime((total-bytes)/speed):'wird berechnet';
  label.textContent=(data?.message||'Update wird heruntergeladen …')+
    (pct!==null?' · '+pct+'%':'')+
    (bytes>0?' · '+fmtBytes(bytes)+(total>0?' / '+fmtBytes(total):''):'')+
    (speed>100?' · '+fmtBytes(speed)+'/s':'')+
    (total>bytes?' · Restzeit ca. '+eta:'');
 }
 panel.hidden=false;
 if(pct===100||/aktuell|fehlgeschlagen|blockiert|Abgeschlossen/i.test(String(data?.message||''))){downloadLast={bytes:0,time:0};updateStart=0;}
}
const prevSettingsDetail=window.nextSettingsDetail;
window.nextSettingsDetail=function(){
 const html=prevSettingsDetail.apply(this,arguments);
 if(nextSettingCategory!=='updates')return html;
 const progress='<div id="bu53-update-progress" class="bu53-update-progress" aria-live="polite" hidden>'+
 '<progress max="100" value="0" aria-label="Update-Download"></progress>'+
 '<div class="bu53-update-progress-label">Update wird vorbereitet …</div></div>';
 return html.replace('</div></div>',progress+'</div></div>');
};
try{
 window.booksupUpdateEvents?.subscribe?.(progressUpdate);
 window.Capacitor?.Plugins?.BooksUpUpdater?.addListener?.('downloadProgress',progressUpdate);
}catch(error){console.debug('Update progress setup',error);}
const oldUpdate=window.bu50CheckAppUpdate;
window.bu50CheckAppUpdate=async function(){
 updateStart=0;downloadLast={bytes:0,time:0};
 const box=document.getElementById('bu53-update-progress');
 if(box){box.hidden=false;const t=box.querySelector('.bu53-update-progress-label');if(t)t.textContent='Prüfe auf neue Versionen …';}
 try{return await oldUpdate.apply(this,arguments);}
 catch(error){progressUpdate({message:'Update fehlgeschlagen: '+String(error.message||error)});throw error;}
};

})();