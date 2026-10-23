/* BooksUp 4.4: preserved local shelf interactions and reader zoom. */
const BU44_REC_KEY='booksup.rec.v44',BU44_FEED_KEY='booksup.prices.v44';
let bu44Remote=[],bu44LastFetch=0,bu44LastAttempt=0,bu44Loading=false,bu44PriceBusy=false;
function bu44RetrieveCache(){
 try{const j=JSON.parse(localStorage.getItem(BU44_REC_KEY)||'null');if(j&&Array.isArray(j.items)){bu44Remote=j.items;bu44LastFetch=j.time||0}}catch{}
}
bu44RetrieveCache();
function bu44ExtraRecommendations(){return bu44Remote}
function bu44EditionIsbn(v){
 const s=String(v||'').replace(/[^0-9X]/gi,'').toUpperCase().slice(0,13);
 if(/^\d{9}[\dX]$/.test(s)){
  let sum=0;for(let i=0;i<10;i++)sum+=(s[i]==='X'?10:Number(s[i]))*(10-i);
  if(sum%11===0){
   const base='978'+s.slice(0,9);let check=0;
   for(let i=0;i<12;i++)check+=Number(base[i])*(i%2?3:1);
   return base+String((10-check%10)%10);
  }
 }
 return s;
}
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
async function bu44FetchRecommendations(){return false;}
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

const BU44_WORDS={"Mehr Bücher entdecken":["Discover more books","Découvrir plus de livres","Descubrir más libros","Scopri altri libri"],"Bücher im Regal suchen":["Search bookshelf","Rechercher dans la bibliothèque","Buscar en la estantería","Cerca nella libreria"],"Bücher hinzufügen":["Add books","Ajouter des livres","Añadir libros","Aggiungi libri"],"Digitale Bücher":["Digital books","Livres numériques","Libros digitales","Libri digitali"],"Physische Bücher":["Physical books","Livres papier","Libros físicos","Libri cartacei"],"Mehr Optionen":["More options","Plus d'options","Más opciones","Altre opzioni"],"Alle Bücher":["All books","Tous les livres","Todos los libros","Tutti i libri"],"Mehrere auswählen":["Select multiple","Sélection multiple","Seleccionar varios","Seleziona più"],"Ordner erstellen":["Create folder","Créer un dossier","Crear carpeta","Crea cartella"],"Mehrere digitale Dateien importieren":["Import digital files","Importer des fichiers numériques","Importar archivos digitales","Importa file digitali"],"Bücher in deiner Bibliothek":["books in your library","livres dans votre bibliothèque","libros en tu biblioteca","libri nella tua libreria"],"Vergrößern":["Zoom in","Agrandir","Acercar","Ingrandisci"],"Verkleinern":["Zoom out","Réduire","Alejar","Riduci"],"Verbindung erforderlich":["Connection required","Connexion requise","Conexión necesaria","Connessione necessaria"],"Nicht verfügbar":["Unavailable","Indisponible","No disponible","Non disponibile"],"Euro":["Euro","Euro","Euro","Euro"],"US-Dollar":["US dollar","Dollar américain","Dólar estadounidense","Dollaro USA"],"Britisches Pfund":["British pound","Livre sterling","Libra esterlina","Sterlina britannica"],"Schweizer Franken":["Swiss franc","Franc suisse","Franco suizo","Franco svizzero"],"Schwedische Krone":["Swedish krona","Couronne suédoise","Corona sueca","Corona svedese"],"Norwegische Krone":["Norwegian krone","Couronne norvégienne","Corona noruega","Corona norvegese"],"Dänische Krone":["Danish krone","Couronne danoise","Corona danesa","Corona danese"],"Japanischer Yen":["Japanese yen","Yen japonais","Yen japonés","Yen giapponese"],"Kanadischer Dollar":["Canadian dollar","Dollar canadien","Dólar canadiense","Dollaro canadese"],"Australischer Dollar":["Australian dollar","Dollar australien","Dólar australiano","Dollaro australiano"],"Neuigkeiten":["News","Actualités","Noticias","Novità"],"Preisänderung":["Price change","Changement de prix","Cambio de precio","Variazione prezzo"],"Automatisch":["Automatic","Automatique","Automático","Automatico"],"Kapitel":["Chapters","Chapitres","Capítulos","Capitoli"],"PDF-Zoom":["PDF zoom","Zoom PDF","Zoom PDF","Zoom PDF"],"Lesesitzung":["Reading session","Séance de lecture","Sesión de lectura","Sessione di lettura"],"Buch herunterladen":["Download book","Télécharger le livre","Descargar libro","Scarica libro"],"Buchdetails":["Book details","Détails du livre","Detalles del libro","Dettagli del libro"],"Cover im Internet suchen":["Search for online cover","Chercher une couverture en ligne","Buscar portada en línea","Cerca copertina online"],"Cover nicht verfügbar":["Cover unavailable","Couverture indisponible","Portada no disponible","Copertina non disponibile"],"Empfehlungen anpassen":["Customize recommendations","Personnaliser les recommandations","Personalizar recomendaciones","Personalizza i consigli"],"Bücher und Geschichten":["Books and stories","Livres et histoires","Libros e historias","Libri e storie"],"Letzter Speicherstand geladen":["Latest save restored","Dernière sauvegarde chargée","Último guardado cargado","Ultimo salvataggio caricato"],"Keine Daten gefunden":["No data found","Aucune donnée trouvée","No se encontraron datos","Nessun dato trovato"],"Updates verfügbar":["Updates available","Mises à jour disponibles","Actualizaciones disponibles","Aggiornamenti disponibili"],"Theme-Vorlagen":["Theme templates","Modèles de thème","Plantillas de tema","Modelli di tema"],"Benachrichtigung testen":["Test notification","Tester la notification","Probar notificación","Prova notifica"],"Preis prüfen":["Check price","Vérifier le prix","Consultar precio","Controlla prezzo"],"Fertig gelesen":["Finished reading","Lecture terminée","Lectura terminada","Lettura terminata"],"Zustand":["Condition","État","Estado","Condizione"],"Ordner":["Folder","Dossier","Carpeta","Cartella"],"Markierung":["Highlight","Surlignage","Resaltado","Evidenziazione"]};

/* Price-alert labels remain available offline in all five shipped locales. */
