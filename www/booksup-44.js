/* BooksUp 4.4: remote recommendations + opt-in pricing + reader zoom.
   URL and auth for price provider must be supplied by publisher. No invented prices. */
const BU44_REC_KEY='booksup.rec.v44',BU44_FEED_KEY='booksup.prices.v44';
let bu44Remote=[],bu44LastFetch=0,bu44LastAttempt=0,bu44Loading=false,bu44PriceBusy=false;
function bu44RetrieveCache(){
 try{const j=JSON.parse(localStorage.getItem(BU44_REC_KEY)||'null');if(j&&Array.isArray(j.items)){bu44Remote=j.items;bu44LastFetch=j.time||0}}catch{}
}
bu44RetrieveCache();
function bu44ExtraRecommendations(){return bu44Remote}
function bu44EditionIsbn(v){return String(v||'').replace(/[^\dX]/gi,'').slice(0,13)}
function bu44PoolSubjects(){
 const r=S.rec||{},from=[...(r.includeGenres||[]),...S.books.filter(b=>b.rating>=7||b.finished).map(b=>b.genre)].filter(Boolean);
 const m={fantasy:'fantasy',sciencefiction:'science fiction',scifi:'science fiction',romance:'romance',liebe:'romance',manga:'manga',thriller:'thriller',krimi:'mystery',history:'history',historisch:'history',sachbuch:'nonfiction',biografie:'biography',graphicnovel:'graphic novel'};
 const found=[...new Set(from.map(x=>{const k=buNorm(x).replace(/\s+/g,'');return m[k]||buNorm(x)}))].filter(x=>x.length>2);
 return [...found,...(typeof bu46AdultEnabled==='function'&&bu46AdultEnabled()?['erotica','adult romance']:[]),'fantasy','fiction','romance','mystery','young adult','manga','history','science fiction','comics','literature'].slice(0,15);
}
function bu44ItemToBook(x){
 const v=x.volumeInfo||{},i=bu44EditionIsbn(v.industryIdentifiers?.find(z=>z.type==='ISBN_13')?.identifier||v.industryIdentifiers?.[0]?.identifier||'');
 if(!v.title||!v.authors?.[0])return null;
 const cover=v.imageLinks?.thumbnail||v.imageLinks?.smallThumbnail||'';
 return {id:x.id||i||v.title,title:v.title,author:v.authors.join(', '),isbn:i,
  genre:v.categories?.[0]||'',tags:(v.categories||[]).join(', '),
  year:v.publishedDate?.slice(0,4)||'',publisher:v.publisher||'',language:v.language||'',pages:v.pageCount||0,
  description:v.description||'',cover:cover.replace(/^http:/,'https:'),own:0};
}
async function bu44FetchRecommendations(force=false){
 if(bu44Loading||navigator.onLine===false)return;
 if(!force&&Date.now()-bu44LastFetch<6*3600000&&bu44Remote.length)return;
 if(!force&&Date.now()-bu44LastAttempt<10*60000)return;
 if(force){ALL.recCycle=(Number(ALL.recCycle)||0)+1;}
 bu44LastAttempt=Date.now();bu44Loading=true;
 try{
  const subjects=bu44PoolSubjects();
  const offset=new Date().getDate()%subjects.length;
  const order=[...subjects.slice(offset),...subjects.slice(0,offset)];
  const tasks=order.slice(0,5).map(async(sub,i)=>{
   const lang=ALL.nextLanguage&&ALL.nextLanguage!=='system'?ALL.nextLanguage:('de');
   const q='subject:'+sub;
   const url='https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&orderBy=newest&maxResults=30&startIndex='+(((Math.floor(Date.now()/86400000)+i+Number(ALL.recCycle||0)*3)%8)*30)+'&langRestrict='+encodeURIComponent(lang==='de'||lang==='en'?lang:'en');
   const response=await fetch(url);
   if(!response.ok)throw Error('HTTP '+response.status);
   const j=await response.json();return (j.items||[]).map(bu44ItemToBook).filter(Boolean);
  });
  const settled=await Promise.allSettled(tasks),items=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
  const seen=new Set(),unique=items.filter(b=>{const k=buNorm(b.title+' '+b.author);if(seen.has(k))return false;seen.add(k);return true});
  if(unique.length){const old=new Set((bu44Remote||[]).map(b=>buNorm(b.title+'|'+b.author)));const extras=unique.filter(b=>!old.has(buNorm(b.title+'|'+b.author)));bu44Remote=[...extras,...bu44Remote].slice(0,200);bu44LastFetch=Date.now();
    try{localStorage.setItem(BU44_REC_KEY,JSON.stringify({time:bu44LastFetch,items:bu44Remote}))}catch{}
    if(view==='home'||view==='catalog')render();
  }
 }catch(e){console.debug('Recommendations cache kept:',String(e))}
 finally{bu44Loading=false}
}
function bu44AddMenu(){
 modal='<h3>Bücher hinzufügen</h3><p>Wähle, welches Buch du hinzufügen möchtest.</p><div class="bu44-add-menu"><button class="next-setting-row" onclick="modal=null;addType=\'physical\';view=\'add\';draft={};render()">📖 Physisches Buch</button><button class="next-setting-row" onclick="modal=null;addType=\'digital\';view=\'add\';draft={};render()">▣ Digitales Buch / PDF / EPUB</button><button class="next-setting-row" onclick="modal=null;batchChoose()">＋ Mehrere digitale Dateien importieren</button></div><button class="chip" onclick="modal=null;render()">Schließen</button>';
 render();
}
let bu44AdvancedShelf=false,bu44ShelfTab='all';
function bu44SwitchShelf(type){shf=type;shFolder='alle';render()}
function bu44ShelfToolbar(){
 return '<div class="bu44-shelf-top"><label class="bu44-search"><span class="sr-only">Bücher suchen</span><input type="search" id="bu-shelf-search" placeholder="⌕  Titel, ISBN oder Autor suchen …" value="'+esc(buShelfQuery)+'" oninput="buFilterShelfLive()"></label>'+
 '<button class="bu44-add-primary" onclick="bu44AddMenu()">＋ Bücher hinzufügen</button><div class="bu44-shelf-tabs">'+
 '<button class="'+(shf==='digital'?'on':'')+'" onclick="bu44SwitchShelf(\'digital\')">▣ Digitale Bücher</button>'+
 '<button class="'+(shf==='physical'?'on':'')+'" onclick="bu44SwitchShelf(\'physical\')">▤ Physische Bücher</button></div>'+
 '<div class="bu44-aux"><span>'+S.books.length+' Bücher in deiner Bibliothek</span><button class="chip" onclick="bu44AdvancedShelf=!bu44AdvancedShelf;render()" aria-expanded="'+bu44AdvancedShelf+'">⋯ Mehr Optionen</button></div>'+
 (bu44AdvancedShelf?'<div class="bu44-advanced"><button class="chip" onclick="bu44SwitchShelf(\'all\')">Alle Bücher</button><button class="chip" onclick="buToggleMulti()">Mehrere auswählen</button><button class="chip" onclick="go(\'lists\')">Leselisten</button><button class="chip" onclick="newFolder()">Ordner erstellen</button><label>Sortieren <select onchange="shSort=this.value;render()"><option value="added" '+(shSort==='added'?'selected':'')+'>Zuletzt hinzugefügt</option><option value="title" '+(shSort==='title'?'selected':'')+'>Titel</option><option value="author" '+(shSort==='author'?'selected':'')+'>Autor</option><option value="rating" '+(shSort==='rating'?'selected':'')+'>Bewertung</option></select></label>'+
 '<div class="bu44-folders">'+S.folders.map(f=>'<button class="chip" onclick="shFolder='+JSON.stringify(f).replace(/"/g,'&quot;')+';render()">'+esc(f)+'</button>').join('')+'</div></div>':'')+
 (buMulti?'<div class="bu-bulk"><strong id="bu-selected-count">'+buSelected.size+' ausgewählt</strong><button class="chip" onclick="buSelectVisible()">Sichtbare wählen</button><button class="btn o" onclick="buBulkFolder()">In Ordner</button><button class="btn o" onclick="buBulkDelete()">Löschen</button></div>':'')+'</div>';
}
/* On-device opt-in only. No user ISBNs are published to GitHub or sent to an unconfigured provider. */
function bu44Watches(){if(!Array.isArray(ALL.medimopsWatches))ALL.medimopsWatches=[];return ALL.medimopsWatches}
function bu44WatchState(b){
 const key=bu44EditionIsbn(b.isbn);return key&&bu44Watches().some(x=>x.isbn===key);
}
function bu44ValidIsbn(value){
 const s=bu44EditionIsbn(value);
 if(/^\d{13}$/.test(s)){let sum=0;for(let i=0;i<13;i++)sum+=Number(s[i])*(i%2?3:1);return sum%10===0;}
 if(/^\d{9}[\dX]$/i.test(s)){let sum=0;for(let i=0;i<10;i++)sum+=(s[i].toUpperCase()==='X'?10:Number(s[i]))*(10-i);return sum%11===0;}
 return false;
}
function bu44WatchPrompt(b){
 const isbn=bu44EditionIsbn(b?.isbn);
 if(!bu44ValidIsbn(isbn))return alert('Für einen Preisalarm wird die gültige ISBN-10 oder ISBN-13 der gewünschten Ausgabe benötigt. Ergänze sie in den Buchdetails.');
 const watching=bu44WatchState({isbn});
 const detail='Der Preisalarm nutzt ausschließlich verifizierte MediMops-Verkaufspreise. Die momox-Ankaufspreise sind andere Daten und lösen keinen MediMops-Preisalarm aus. Ohne eingerichteten Preisanbieter werden keine Preise erfunden.';
 if(!confirm((watching?'Preisalarm deaktivieren?':'Preisalarm für '+(b.title||'dieses Buch')+' aktivieren?')+'\n\n'+detail))return;
 if(watching)ALL.medimopsWatches=bu44Watches().filter(x=>x.isbn!==isbn);
 else bu44Watches().push({isbn,title:b.title||'Buch',author:b.author||'',lastPrice:null,lastChecked:null,targetPrice:null,history:[],alerts:[]});
 persist();toast(watching?'Preisalarm deaktiviert':'Preisalarm gespeichert. Preisabfrage nur bei verfügbarer MediMops-Datenquelle.');render();
 if(!watching)void bu44CheckWatches(true);
}
function bu44WatchCatalog(index){const b=buRecs().list[Number(index)];if(b)bu44WatchPrompt(b)}
function bu44TargetPrompt(isbn){
 const w=bu44Watches().find(x=>x.isbn===isbn);if(!w)return;
 const input=prompt('Gewünschter MediMops-Verkaufspreis in EUR (leer = Zielpreis entfernen):',w.targetPrice==null?'':String(w.targetPrice).replace('.',','));
 if(input===null)return;
 if(!input.trim()){w.targetPrice=null;w.targetHit=false;persist();render();return;}
 const value=Number(input.trim().replace(',','.'));
 if(!Number.isFinite(value)||value<=0||value>5000)return alert('Bitte einen gültigen Zielpreis zwischen 0,01 € und 5.000 € eingeben.');
 w.targetPrice=Math.round(value*100)/100;w.targetHit=false;persist();render();
}
async function bu44NotifyPrice(w,oldPrice,amount,targetHit){
 const detail=targetHit?'Zielpreis erreicht':'Preis geändert';
 const message=w.title+': '+(oldPrice===null?'':oldPrice.toFixed(2)+' € → ')+amount.toFixed(2)+' €';
 toast('MediMops · '+detail+' · '+message);
 const ln=window.Capacitor?.Plugins?.LocalNotifications;
 try{
  if(ln&&(await ln.checkPermissions()).display==='granted')
   await ln.schedule({notifications:[{id:Math.floor(Math.random()*2147000000)+1,title:'BooksUp · '+detail,body:message,smallIcon:'ic_stat_booksup',schedule:{at:new Date(Date.now()+2500)}}]});
 }catch(error){console.debug('Price notification unavailable',error);}
}
async function bu44CheckWatches(force=false){
 if(bu44PriceBusy||!bu44Watches().length)return;
 if(navigator.onLine===false){ALL.medimopsLastError='Offline: Letzter bekannter MediMops-Preis bleibt erhalten.';if(force){persist();render();}return;}
 const now=Date.now();
 if(!force&&now-Number(ALL.lastPriceCheck||0)<86400000)return;
 if(force&&now-Number(ALL.lastPriceManualCheck||0)<60000){
  toast('Die letzte Preisabfrage ist noch keine Minute her.');return;
 }
 const endpoint=String(window.BOOKSUP_PRICE_FEED_URL||'https://raw.githubusercontent.com/lavender1510/BooksUp/main/www/medimops-prices.json').trim();
 if(!/^https:\/\/[^\s]+$/.test(endpoint))return;
 bu44PriceBusy=true;
 if(force)ALL.lastPriceManualCheck=now;
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let response;try{response=await fetch(endpoint,{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timeout);}
  if(!response.ok)throw Error(response.status===429?'Preisquelle hat zu viele Anfragen erhalten':'Preisquelle HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data?.prices))throw Error('Ungültige Preisdaten');
  const refreshed=Date.parse(data.updatedAt||'');
  if(!Number.isFinite(refreshed)||now-refreshed>14*86400000)throw Error('Noch kein aktueller MediMops-Verkaufspreisfeed konfiguriert');
  let found=0;
  for(const w of bu44Watches()){
   if(!bu44ValidIsbn(w.isbn))continue;
   const record=data.prices.find(p=>bu44EditionIsbn(p.isbn)===w.isbn&&p.provider==='medimops'&&String(p.currency).toUpperCase()==='EUR'&&
    p.price!==null&&p.price!==undefined&&Number.isFinite(Number(p.price))&&Number(p.price)>=0);
   if(!record)continue;
   const amount=Math.round(Number(record.price)*100)/100;if(amount>5000)continue;
   found++;
   const oldPrice=Number.isFinite(Number(w.lastPrice))&&w.lastPrice!==null?Number(w.lastPrice):null;
   const changed=oldPrice!==null&&oldPrice!==amount;
   const hit=w.targetPrice!=null&&amount<=Number(w.targetPrice)&&!w.targetHit;
   w.targetHit=w.targetPrice!=null&&amount<=Number(w.targetPrice);
   if(changed||hit){
    w.alerts??=[];w.alerts.unshift({at:now,before:oldPrice,after:amount,source:'MediMops · Verkaufspreis',targetHit:!!hit,url:record.url||''});
    w.alerts=w.alerts.slice(0,40);
    await bu44NotifyPrice(w,oldPrice,amount,hit);
   }
   w.history??=[];if(!w.history.length||w.history[0].price!==amount)w.history.unshift({at:now,price:amount});
   w.history=w.history.slice(0,40);
   w.lastPrice=amount;w.lastChecked=now;
  }
  ALL.lastPriceCheck=now;
  ALL.medimopsLastError=found?null:'Für die beobachteten ISBN-Ausgaben liegen momentan keine MediMops-Verkaufspreise vor.';
  persist();if(force)render();
 }catch(error){
  ALL.medimopsLastError=String(error?.message||error);
  console.debug('MediMops price check unavailable:',ALL.medimopsLastError);
  persist();if(force)render();
 }finally{bu44PriceBusy=false;}
}
window.bu44CheckWatchesNow=()=>bu44CheckWatches(true);
function bu44PriceNotificationsView(){
 const error=ALL.medimopsLastError;
 const items=bu44Watches().map(w=>{
  const last=w.lastChecked?new Date(w.lastChecked).toLocaleString():null;
  const price=w.lastPrice===null?'Noch kein geprüfter MediMops-Verkaufspreis':Number(w.lastPrice).toFixed(2)+' € · zuletzt geprüft: '+last;
  return '<div class="li"><b>'+esc(w.title)+'</b><small>'+esc(w.isbn)+' · '+esc(price)+'</small>'+
   (w.targetPrice!=null?'<small>Zielpreis: '+Number(w.targetPrice).toFixed(2)+' €</small>':'')+
   '<button class="chip" onclick="bu44TargetPrompt('+JSON.stringify(w.isbn).replace(/"/g,'&quot;')+')">Zielpreis</button></div>';
 }).join('');
 return '<div class="bu44-price-watch"><h3>MediMops-Preisalarm (Beta)</h3>'+
  '<p class="hint" data-bu-ui-translate>Für ISBN-Ausgaben mit verifizierten MediMops-Verkaufspreisen. momox-Ankaufspreise werden ausdrücklich nicht als Verkaufspreis verwendet.</p>'+
  items+'<button class="chip" data-bu-ui-translate onclick="bu44CheckWatchesNow()">Preis jetzt prüfen</button>'+
  (error?'<p class="hint" role="status">'+esc(error)+'</p>':'')+
  '<p class="hint">Ohne konfigurierten MediMops-Verkaufspreis-Anbieter stehen keine Livepreise bereit. Hintergrundbenachrichtigungen bei geschlossener App erfordern zusätzlich einen Server-/Pushdienst.</p></div>';
}
/* Actual PDF zoom factor, not an illusion that crops the document. */
function bu44ZoomValue(){return Math.max(.8,Math.min(3,Number(S.pdfZoom)||1))}
function bu44ZoomStep(delta){bu44ZoomSet(bu44ZoomValue()+delta)}
function bu44ZoomSet(value){
 S.pdfZoom=Math.round(Math.max(.8,Math.min(3,Number(value)||1))*10)/10;
 const z=document.getElementById('bu44-zoom-value');if(z)z.textContent=Math.round(S.pdfZoom*100)+'%';
 if(view==='reader'&&pdfDoc){
  const m=rdMode();
  if(m===0)showPg();
  else if(m===1)mountMode();
 }
 clearTimeout(bu44ZoomSet.timer);bu44ZoomSet.timer=setTimeout(persist,450);
}
function bu44ZoomTools(){
 return '<div class="bu44-zoom"><button class="chip" aria-label="Verkleinern" onclick="bu44ZoomStep(-.2)">−</button><b id="bu44-zoom-value">'+Math.round(bu44ZoomValue()*100)+'%</b><button class="chip" aria-label="Vergrößern" onclick="bu44ZoomStep(.2)">＋</button><button class="chip" onclick="bu44ZoomSet(1)">100%</button></div>';
}
function bu44AddReaderZoom(){
 if(view!=='reader')return;
 let root=$('rdwrap');if(!root||root.querySelector('.bu44-zoom'))return;
 const top=root.querySelector('.rdtop');if(top)top.insertAdjacentHTML('beforeend',bu44ZoomTools());
 const sc=$('rdscroll');if(!sc||sc._bu44Pinch)return;
 sc._bu44Pinch=true;let start=0,zoom=1;
 sc.addEventListener('touchstart',e=>{
  if(e.touches.length===2){start=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);zoom=bu44ZoomValue()}
 },{passive:true});
 sc.addEventListener('touchend',e=>{if(start&&e.touches.length<2){start=0}},{passive:true});
 sc.addEventListener('touchmove',e=>{
  if(!start||e.touches.length!==2)return;
  const current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  if(Math.abs(current-start)>20){e.preventDefault();const target=zoom*current/start;bu44ZoomSet(target);start=current;zoom=bu44ZoomValue()}
 },{passive:false});
}
function bu44BrokenCover(img){
 if(!img||!img.isConnected)return;
 const wrapper=document.createElement('span');wrapper.className='bu43-cover-slot';
 wrapper.dataset.coverTitle=img.dataset.coverTitle||img.alt||'';
 wrapper.dataset.coverAuthor=img.dataset.coverAuthor||'';
 wrapper.dataset.coverIsbn=img.dataset.coverIsbn||'';
 const key=wrapper.dataset.coverIsbn||bu43Norm(wrapper.dataset.coverTitle+' '+wrapper.dataset.coverAuthor);bu43CoverCache.delete(key);
 const word=document.createElement('span');word.className='bu43-cover-placeholder';word.textContent=(wrapper.dataset.coverTitle||'BU').slice(0,2);
 const note=document.createElement('small');note.textContent=navigator.onLine===false?'Offline · Cover nicht geladen':'Alternatives Cover wird gesucht …';
 wrapper.append(word,note);img.replaceWith(wrapper);
 bu43LoadCovers();
}
function bu44AfterRender(){
 if(view==='home')setTimeout(()=>bu44FetchRecommendations(false),700);
 if(view==='shelf')setTimeout(()=>buFilterShelfLive(),0);
 if(view==='reader')setTimeout(bu44AddReaderZoom,30);
 if(bu44Watches().length)setTimeout(bu44CheckWatches,900);
}

const BU44_WORDS={"Mehr Bücher entdecken":["Discover more books","Découvrir plus de livres","Descubrir más libros","Scopri altri libri"],"Bücher im Regal suchen":["Search bookshelf","Rechercher dans la bibliothèque","Buscar en la estantería","Cerca nella libreria"],"Bücher hinzufügen":["Add books","Ajouter des livres","Añadir libros","Aggiungi libri"],"Digitale Bücher":["Digital books","Livres numériques","Libros digitales","Libri digitali"],"Physische Bücher":["Physical books","Livres papier","Libros físicos","Libri cartacei"],"Mehr Optionen":["More options","Plus d'options","Más opciones","Altre opzioni"],"Alle Bücher":["All books","Tous les livres","Todos los libros","Tutti i libri"],"Mehrere auswählen":["Select multiple","Sélection multiple","Seleccionar varios","Seleziona più"],"Ordner erstellen":["Create folder","Créer un dossier","Crear carpeta","Crea cartella"],"Mehrere digitale Dateien importieren":["Import digital files","Importer des fichiers numériques","Importar archivos digitales","Importa file digitali"],"Bücher in deiner Bibliothek":["books in your library","livres dans votre bibliothèque","libros en tu biblioteca","libri nella tua libreria"],"Preisalarm":["Price alert","Alerte de prix","Alerta de precio","Avviso prezzo"],"MediMops-Preisalarm":["MediMops price alert","Alerte prix MediMops","Alerta precio MediMops","Avviso prezzo MediMops"],"Preisalarm deaktivieren?":["Disable price alert?","Désactiver l'alerte ?","¿Desactivar alerta?","Disattivare l'avviso?"],"Vergrößern":["Zoom in","Agrandir","Acercar","Ingrandisci"],"Verkleinern":["Zoom out","Réduire","Alejar","Riduci"],"Verbindung erforderlich":["Connection required","Connexion requise","Conexión necesaria","Connessione necessaria"],"Nicht verfügbar":["Unavailable","Indisponible","No disponible","Non disponibile"],"Euro":["Euro","Euro","Euro","Euro"],"US-Dollar":["US dollar","Dollar américain","Dólar estadounidense","Dollaro USA"],"Britisches Pfund":["British pound","Livre sterling","Libra esterlina","Sterlina britannica"],"Schweizer Franken":["Swiss franc","Franc suisse","Franco suizo","Franco svizzero"],"Schwedische Krone":["Swedish krona","Couronne suédoise","Corona sueca","Corona svedese"],"Norwegische Krone":["Norwegian krone","Couronne norvégienne","Corona noruega","Corona norvegese"],"Dänische Krone":["Danish krone","Couronne danoise","Corona danesa","Corona danese"],"Japanischer Yen":["Japanese yen","Yen japonais","Yen japonés","Yen giapponese"],"Kanadischer Dollar":["Canadian dollar","Dollar canadien","Dólar canadiense","Dollaro canadese"],"Australischer Dollar":["Australian dollar","Dollar australien","Dólar australiano","Dollaro australiano"],"Neuigkeiten":["News","Actualités","Noticias","Novità"],"Preisänderung":["Price change","Changement de prix","Cambio de precio","Variazione prezzo"],"Automatisch":["Automatic","Automatique","Automático","Automatico"],"Kapitel":["Chapters","Chapitres","Capítulos","Capitoli"],"PDF-Zoom":["PDF zoom","Zoom PDF","Zoom PDF","Zoom PDF"],"Lesesitzung":["Reading session","Séance de lecture","Sesión de lectura","Sessione di lettura"],"Buch herunterladen":["Download book","Télécharger le livre","Descargar libro","Scarica libro"],"Buchdetails":["Book details","Détails du livre","Detalles del libro","Dettagli del libro"],"Cover im Internet suchen":["Search for online cover","Chercher une couverture en ligne","Buscar portada en línea","Cerca copertina online"],"Cover nicht verfügbar":["Cover unavailable","Couverture indisponible","Portada no disponible","Copertina non disponibile"],"Empfehlungen anpassen":["Customize recommendations","Personnaliser les recommandations","Personalizar recomendaciones","Personalizza i consigli"],"Bücher und Geschichten":["Books and stories","Livres et histoires","Libros e historias","Libri e storie"],"Letzter Speicherstand geladen":["Latest save restored","Dernière sauvegarde chargée","Último guardado cargado","Ultimo salvataggio caricato"],"Keine Daten gefunden":["No data found","Aucune donnée trouvée","No se encontraron datos","Nessun dato trovato"],"Updates verfügbar":["Updates available","Mises à jour disponibles","Actualizaciones disponibles","Aggiornamenti disponibili"],"Theme-Vorlagen":["Theme templates","Modèles de thème","Plantillas de tema","Modelli di tema"],"Benachrichtigung testen":["Test notification","Tester la notification","Probar notificación","Prova notifica"],"Preis prüfen":["Check price","Vérifier le prix","Consultar precio","Controlla prezzo"],"Fertig gelesen":["Finished reading","Lecture terminée","Lectura terminada","Lettura terminata"],"Zustand":["Condition","État","Estado","Condizione"],"Ordner":["Folder","Dossier","Carpeta","Cartella"],"Markierung":["Highlight","Surlignage","Resaltado","Evidenziazione"]};
