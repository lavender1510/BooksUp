/* BooksUp Windows 4.7 – desktop improvements. Android bundles do not execute this file. */
(function () {
  'use strict';
  if (!window.booksupDesktopUpdate) return;
  window.booksupWindows47 = true;

  const localize = {
    'Bücher hinzufügen':['Add books','Ajouter des livres','Añadir libros','Aggiungi libri'],
    'Buch hinzufügen':['Add book','Ajouter un livre','Añadir libro','Aggiungi libro'],
    'Meine Leselisten':['My reading lists','Mes listes de lecture','Mis listas de lectura','Le mie liste'],
    'Erweiterte Details':['More details','Plus de détails','Más detalles','Altri dettagli'],
    'Mehr Details':['More details','Plus de détails','Más detalles','Altri dettagli'],
    'Informationen bearbeiten':['Edit information','Modifier les informations','Editar información','Modifica informazioni'],
    'Lesestatistik':['Reading statistics','Statistiques de lecture','Estadísticas de lectura','Statistiche di lettura'],
    'Leseanalyse':['Reading analytics','Analyse de lecture','Análisis de lectura','Analisi di lettura'],
    'Deine Leseanalyse':['Your reading analytics','Votre analyse de lecture','Tu análisis de lectura','La tua analisi di lettura'],
    'Meine Bücher':['My books','Mes livres','Mis libros','I miei libri'],
    'Sitzungen':['Sessions','Sessions','Sesiones','Sessioni'],
    'Fertig gelesen':['Finished','Terminé','Terminado','Terminato'],
    'Keine Daten vorhanden':['No data yet','Aucune donnée','Sin datos','Nessun dato'],
    'Buchdaten online ergänzen':['Find book details online','Compléter les données en ligne','Buscar datos en línea','Cerca dati online'],
    'Buchdaten automatisch suchen':['Find book details automatically','Rechercher les données automatiquement','Buscar datos automáticamente','Cerca dati automaticamente'],
    'Automatische Geräte-Backups':['Automatic device backups','Sauvegardes automatiques','Copias automáticas','Backup automatici'],
    'Mehrere Dateien hinzufügen':['Add multiple files','Ajouter plusieurs fichiers','Añadir varios archivos','Aggiungi più file'],
    'Dateien importieren':['Import files','Importer des fichiers','Importar archivos','Importa file'],
    'Sprache':['Language','Langue','Idioma','Lingua'],
    'Aktualisierungen':['Updates','Mises à jour','Actualizaciones','Aggiornamenti'],
    'Nach Updates suchen':['Check for updates','Rechercher des mises à jour','Buscar actualizaciones','Controlla aggiornamenti'],
    'Update suchen':['Check for update','Chercher une mise à jour','Buscar actualización','Cerca aggiornamenti'],
    'Neuigkeiten':['What is new','Nouveautés','Novedades','Novità'],
    'Änderungsverlauf':['Changelog','Journal des modifications','Registro de cambios','Registro modifiche'],
    'Jetzt lesen':['Read now','Lire maintenant','Leer ahora','Leggi ora'],
    'Seite markieren':['Highlight a page area','Marquer une zone','Marcar un área','Evidenzia un area'],
    'Markierung speichern':['Save highlight','Enregistrer la marque','Guardar marca','Salva evidenziazione'],
    'Notiz hinzufügen':['Add note','Ajouter une note','Añadir nota','Aggiungi nota'],
    'Notiz gespeichert':['Note saved','Note enregistrée','Nota guardada','Nota salvata'],
    'Buchinformationen':['Book information','Informations du livre','Información del libro','Informazioni sul libro'],
    'Informationen aus dem Internet':['Information from the internet','Informations en ligne','Información en línea','Informazioni online'],
    'Bücher entdecken':['Discover books','Découvrir des livres','Descubrir libros','Scopri libri'],
    'Mehr Bücher entdecken':['Discover more books','Découvrir plus de livres','Descubrir más libros','Scopri altri libri'],
    'Nächste Bücher':['Next books','Livres suivants','Siguientes libros','Libri successivi'],
    'Vorherige Bücher':['Previous books','Livres précédents','Libros anteriores','Libri precedenti'],
    'Zur Bibliothek':['Back to library','Retour à la bibliothèque','Volver a la biblioteca','Torna alla libreria'],
    'Bibliothek':['Library','Bibliothèque','Biblioteca','Biblioteca'],
    'Bücherregal':['Bookshelf','Étagère','Estantería','Scaffale'],
    'Entdecken':['Discover','Découvrir','Descubrir','Scopri'],
    'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
    'Leselisten':['Reading lists','Listes de lecture','Listas de lectura','Liste di lettura'],
    'Lesemodus':['Reader','Mode lecture','Modo lectura','Modalità lettura'],
    'Leseeinstellungen':['Reading settings','Paramètres de lecture','Ajustes de lectura','Impostazioni di lettura'],
    'Vollbild':['Fullscreen','Plein écran','Pantalla completa','Schermo intero'],
    'Schließen':['Close','Fermer','Cerrar','Chiudi'],
    'Zurück':['Back','Retour','Volver','Indietro'],
    'Mehr Informationen':['More information','En savoir plus','Más información','Più informazioni'],
    'Keine Treffer':['No results','Aucun résultat','Sin resultados','Nessun risultato'],
    'Gesamt':['Total','Total','Total','Totale'],
    'Lesestunden':['Hours read','Heures de lecture','Horas leídas','Ore di lettura'],
    'Gelesene Seiten':['Pages read','Pages lues','Páginas leídas','Pagine lette'],
    'Gelesene Bücher':['Books finished','Livres terminés','Libros terminados','Libri finiti'],
    'Lesetage':['Reading days','Jours de lecture','Días de lectura','Giorni di lettura'],
    'Durchschnitt':['Average','Moyenne','Promedio','Media'],
    'Bester Lesetag':['Best reading day','Meilleur jour','Mejor día','Giorno migliore']
  };
  const previousTranslate = window.buTranslate;
  window.buTranslate = function (s, lang) {
    if (lang === 'de') return s;
    const original = previousTranslate(s, lang);
    if (original !== s) return original;
    const translated = localize[String(s || '').trim()];
    const n = {en:0,fr:1,es:2,it:3}[lang];
    return translated && n !== undefined ? translated[n] : s;
  };

  // Hide editorial access from ordinary desktop settings. A hidden menu is not authorization.
  if (typeof NEXT_SETTINGS !== 'undefined') {
    const at = NEXT_SETTINGS.findIndex(x => x[0] === 'admin');
    if (at !== -1) NEXT_SETTINGS.splice(at, 1);
    if (!NEXT_SETTINGS.some(x => x[0] === 'changelog')) NEXT_SETTINGS.push(['changelog', 'Änderungsverlauf', '↺', 'Was ist neu in BooksUp?']);
  }
  const oldChoose = window.nextChooseSettings;
  window.nextChooseSettings = function(id) {
    if (id === 'admin') return;
    return oldChoose(id);
  };
  const oldDetail = window.nextSettingsDetail;
  window.nextSettingsDetail = function () {
    if (nextSettingCategory === 'admin') nextSettingCategory = 'appearance';
    if (nextSettingCategory === 'changelog') return bu47ChangelogView();
    if (nextSettingCategory === 'updates') return bu47UpdateView();
    return oldDetail();
  };
  window.bu47ChangelogView = function () {
    const list = [
      ['4.7.0 · Windows', 'Desktop edition', 'Fixed desktop sidebar, recommendation navigation, analytics, fullscreen PDF zoom and annotations; added import and metadata workflows, localized controls, a changelog and clearer updates.'],
      ['4.6.0', 'Discover and reading lists', 'Improved ISBN edition search, reading lists, similar books, private recommendations, and reading history.'],
      ['4.5.0', 'Library and device backups', 'New library view, reading-list organization, ZIP backups and desktop insights.'],
      ['4.4.0', 'Covers and zoom', 'Extended online cover search and reader display options.']
    ];
    return bar('Änderungsverlauf','settings') + '<section class="bu47-page"><div class="bu47-head"><div><span class="next-overline">BOOKSUP / WHAT IS NEW</span><h1>Änderungsverlauf</h1><p>Die wichtigsten Änderungen der letzten Versionen.</p></div></div><div class="bu47-changelog">' +
      list.map((x,i) => '<article class="bu47-change"><small>' + esc(x[0]) + '</small><h2>' + esc(x[1]) + '</h2><p>' + esc(x[2]) + '</p></article>').join('') + '</div></section>';
  };
  window.bu47UpdateView = function () {
    return bar('Aktualisierungen','settings') + '<section class="bu47-page"><div class="bu47-head"><span class="next-overline">BOOKSUP / WINDOWS</span><h1>Aktualisierungen</h1><p>Installierte Windows-Versionen können ein kompatibles NSIS-Update herunterladen. Die portable EXE öffnet stattdessen die Downloadseite.</p></div><div class="bu47-update-card"><strong>BooksUp ' + esc(APP_VERSION) + '</strong><p>Deine Buchdateien und Profile bleiben beim normalen Installer-Update im selben lokalen App-Speicher.</p><button class="btn" id="bu47-update-check" onclick="bu47CheckUpdates()">Nach Updates suchen</button><p class="hint" id="bu47-update-result" role="status">Prüfung noch nicht gestartet.</p><button class="chip" onclick="nextChooseSettings(\'changelog\')">Änderungsverlauf ansehen →</button></div></section>';
  };
  window.bu47CheckUpdates = async function () {
    const button = document.getElementById('bu47-update-check'), result = document.getElementById('bu47-update-result');
    if(button) button.disabled = true;
    if(result) result.textContent = 'Update wird geprüft …';
    try {
      const response = await window.booksupDesktopUpdate.check();
      if (result) result.textContent = response && response.message || 'Prüfung abgeschlossen.';
    } catch(e) { if(result) result.textContent = 'Updateprüfung fehlgeschlagen: ' + String(e.message || e); }
    finally {if(button)button.disabled=false;}
  };

  // Real list statistics. No synthetic reading metrics.
  window.bu45DesktopInsights = function () {
    const books = [...ALL.book.books,...ALL.manga.books];
    const logs = [...ALL.book.log,...ALL.manga.log].filter(x => Number(x.mins) >= 0 && x.date);
    const completed = books.filter(b => !!b.finished);
    const mins = logs.reduce((n,x)=>n+(Number(x.mins)||0),0);
    const pages = logs.reduce((n,x)=>n+(Number(x.pages)||0),0);
    const active = books.filter(b => b.started && !b.finished).length;
    const uniqueDays = new Set(logs.filter(x => Number(x.mins)>0).map(x => String(x.date).slice(0,10))).size;
    const avg = logs.length ? (mins/logs.length).toFixed(1) : '–';
    const months = Array.from({length:12}, (_,i) => {const d = new Date();d.setDate(1);d.setMonth(d.getMonth()-(11-i));return {key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label:d.toLocaleDateString('de-DE',{month:'short'}),value:0};});
    for(const b of completed){const key = String(b.finished).slice(0,7),m=months.find(x=>x.key===key);if(m)m.value++;}
    const monthMax = Math.max(1,...months.map(x=>x.value));
    const recent = Array.from({length:28},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(27-i));return {key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),value:0};});
    for(const l of logs){const d=recent.find(x=>x.key===String(l.date).slice(0,10));if(d)d.value+=Number(l.mins)||0;}
    const maxDay=Math.max(1,...recent.map(x=>x.value));
    const groups=new Map();for(const b of books){const genre=String(b.genre||'Nicht kategorisiert').trim();groups.set(genre,(groups.get(genre)||0)+1);}
    const genres=[...groups.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7);
    const fmt=n=>Number(n).toLocaleString('de-DE');
    const kpis=[['Bücher',fmt(books.length),'Bücher + Manga'],['Abgeschlossen',fmt(completed.length),'Als gelesen markiert'],['Aktiv',fmt(active),'Aktuell am Lesen'],['Lesezeit',fmt(Math.round(mins/60*10)/10)+' h','Erfasste Stunden'],['Seiten',fmt(pages),'In Lesesitzungen'],['Ø Sitzung',avg+' min','Je erfasster Eintrag']];
    const kpiHtml=kpis.map(x=>'<div class="bu47-kpi"><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join('');
    const monthHtml=months.map(x=>'<div class="bu47-month"><div class="bu47-month-track"><div style="height:'+Math.max(3,Math.round(x.value/monthMax*100))+'%" title="'+esc(x.key)+': '+x.value+'"></div></div><b>'+x.value+'</b><small>'+esc(x.label)+'</small></div>').join('');
    const heat=recent.map(x=>'<span title="'+esc(x.key)+': '+fmt(x.value)+' Minuten" style="opacity:'+(.16+.84*x.value/maxDay).toFixed(2)+'"></span>').join('');
    const genreHtml=genres.map(x=>'<div class="bu47-rank"><div><b>'+esc(x[0])+'</b><small>'+fmt(x[1])+' Bücher</small></div><div class="bu47-rank-track"><i style="width:'+Math.round(100*x[1]/Math.max(1,books.length))+'%"></i></div></div>').join('');
    const list=bu45AllLists().map(x=>({name:x.name,n:(x.items||[]).length})).sort((a,b)=>b.n-a.n).slice(0,8);
    const listsHtml=list.map(x=>'<div class="bu47-rank"><div><b>'+esc(x.name)+'</b><small>'+x.n+' Bücher</small></div><div class="bu47-rank-track"><i style="width:'+Math.round(100*x.n/Math.max(1,...list.map(z=>z.n)))+'%"></i></div></div>').join('');
    const profiles=[['Bücher',ALL.book],['Manga / Comics',ALL.manga]].map(([n,p])=>'<div class="bu47-profile"><b>'+esc(n)+'</b><span>'+p.books.length+' insgesamt · '+p.books.filter(b=>b.finished).length+' gelesen</span></div>').join('');
    return bar('Leseanalyse','home')+'<section class="bu47-page"><div class="bu47-head"><div><span class="next-overline">BOOKSUP / READING INTELLIGENCE</span><h1>Deine Leseanalyse</h1><p>Deine Geschichte in Zahlen. Alle Statistiken werden ausschließlich aus deinem lokalen Bücherbestand und deinen protokollierten Sitzungen berechnet.</p></div><span class="bu47-chip">'+uniqueDays+' Lesetage</span></div>' +
      '<div class="bu47-kpi-grid">'+kpiHtml+'</div><div class="bu47-dashboard"><section class="bu47-panel bu47-panel-wide"><div class="bu47-panel-title"><h2>Gelesene Bücher · 12 Monate</h2><small>Abschlussdatum</small></div><div class="bu47-month-chart">'+monthHtml+'</div></section>' +
      '<section class="bu47-panel"><div class="bu47-panel-title"><h2>Aktivität · 28 Tage</h2><small>Minuten je Tag</small></div><div class="bu47-heatmap">'+heat+'</div><p class="hint">Dunklere Felder bedeuten mehr protokollierte Lesezeit.</p></section>' +
      '<section class="bu47-panel"><div class="bu47-panel-title"><h2>Genre-Verteilung</h2><small>Alle Bücher</small></div>'+(genreHtml||'<p class="hint">Noch keine Buchdaten.</p>')+'</section>' +
      '<section class="bu47-panel"><div class="bu47-panel-title"><h2>Deine Leselisten</h2><small>Größte Sammlungen</small></div>'+(listsHtml||'<p class="hint">Erstelle deine erste Leseliste.</p>')+'</section>' +
      '<section class="bu47-panel"><div class="bu47-panel-title"><h2>Profile im Vergleich</h2><small>Beide Bereiche</small></div>'+profiles+'</section></div></section>';
  };
  window.stats = function () {return window.bu45DesktopInsights();};

  // Auto-pagination affordance for every horizontal book rail.
  window.bu47ScrollRail = function (index,direction) {
    const rail=document.querySelectorAll('.next-book-rail')[index];
    if(rail)rail.scrollBy({left:direction*Math.max(280,rail.clientWidth*.85),behavior:'smooth'});
  };
  function arrows(){
    const rails=document.querySelectorAll('.next-book-rail');
    rails.forEach((rail,i)=>{
      if(rail.parentElement.querySelector('.bu47-rail-nav'))return;
      const nav=document.createElement('div');nav.className='bu47-rail-nav';
      nav.innerHTML='<button aria-label="Vorherige Bücher" title="Vorherige Bücher" onclick="bu47ScrollRail('+i+',-1)">←</button><button aria-label="Nächste Bücher" title="Nächste Bücher" onclick="bu47ScrollRail('+i+',1)">→</button>';
      const title=rail.parentElement.querySelector('header');if(title)title.appendChild(nav);else rail.before(nav);
      rail.setAttribute('tabindex','0');rail.setAttribute('aria-label','Bücher horizontal durchblättern');
    });
  }

  // Windows file picker stays in the document until selection; users can use Ctrl+A/Shift.
  window.batchChoose = function () {
    const chooser=document.createElement('input');
    chooser.type='file';chooser.multiple=true;chooser.accept='.pdf,.epub,.cbz,.zip,application/pdf,application/epub+zip';
    chooser.style.display='none';document.body.appendChild(chooser);
    chooser.addEventListener('change',()=>{const files=Array.from(chooser.files||[]);chooser.remove();if(files.length)window.batchFiles(files);},{once:true});
    chooser.click();
  };
  window.bu47ChooseFolder = function () {
    const input=document.createElement('input');input.type='file';input.multiple=true;input.setAttribute('webkitdirectory','');input.style.display='none';document.body.appendChild(input);
    input.addEventListener('change',()=>{const files=[...input.files].filter(x=>/\.(pdf|epub|cbz|zip)$/i.test(x.name));input.remove();if(files.length)window.batchFiles(files);else toast('Keine unterstützten Buchdateien im Ordner gefunden.');},{once:true});input.click();
  };
  function batchHelp() {
    if(view!=='add')return;
    const container=document.querySelector('.book-form');if(!container||container.querySelector('.bu47-batch-help'))return;
    const helper=document.createElement('div');helper.className='bu47-batch-help';
    helper.innerHTML='<b>Mehrere E-Books auf einmal importieren</b><p>Im Dateidialog mit <kbd>Strg + A</kbd> oder <kbd>Umschalt</kbd> mehrere Dateien auswählen. Alternativ kannst du einen ganzen Ordner importieren.</p><button class="chip" onclick="bu47ChooseFolder()">Ordner mit Büchern wählen</button>';
    container.insertBefore(helper,container.firstElementChild);
  }

  // Search in multiple public book databases; never overwrite user-entered metadata.
  const normalize = v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const isbnClean47=v=>String(v||'').replace(/[^0-9X]/gi,'').toUpperCase();
  const metaBusy=new Set();
  async function queryJson(url) {
    const ac=new AbortController(),time=setTimeout(()=>ac.abort(),10000);
    try {const res=await fetch(url,{signal:ac.signal});if(!res.ok)throw Error('HTTP '+res.status);return await res.json();}
    finally {clearTimeout(time);}
  }
  function parseDnb(xml,isbn) {
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))return null;
    const records=Array.from(doc.getElementsByTagNameNS('*','record')).filter(r=>r.getElementsByTagNameNS('*','datafield').length);
    for(const rec of records) {
      const fields=Array.from(rec.getElementsByTagNameNS('*','datafield'));
      const val=(tag,code)=>{const f=fields.find(x=>x.getAttribute('tag')===tag);if(!f)return '';const sub=Array.from(f.getElementsByTagNameNS('*','subfield')).find(x=>x.getAttribute('code')===code);return sub?.textContent?.trim()||'';};
      const isbnHere=isbnClean47(val('020','a'));
      if(isbnHere && isbnHere!==isbn)continue;
      const title=val('245','a').replace(/[\s/:]+$/,'');
      if(title)return {title,author:val('100','a').replace(/[,.:;]+$/,''),publisher:val('264','b')||val('260','b'),year:val('264','c')||val('260','c'),pages:parseInt(val('300','a'),10)||null,language:val('041','a')||val('008','a'),source:'DNB'};
    }
    return null;
  }
  async function gatherMetadata(b) {
    const isbn=isbnClean47(b.isbn), title=String(b.title||'').trim(), author=String(b.author||'').trim(),results=[];
    if(!isbn && !title)return results;
    const google='https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(isbn?'isbn:'+isbn:'intitle:'+title+(author?' inauthor:'+author:''))+'&maxResults=12&printType=books';
    const open='https://openlibrary.org/search.json?'+(isbn?'isbn='+encodeURIComponent(isbn):'title='+encodeURIComponent(title)+(author?'&author='+encodeURIComponent(author):''))+'&limit=12&fields=title,author_name,isbn,first_publish_year,edition_key,subject,cover_i,publisher,number_of_pages_median';
    const all=await Promise.allSettled([queryJson(google),queryJson(open),isbn&&window.booksupDnb?window.booksupDnb.isbn(isbn):Promise.resolve(null)]);
    const similar=x=>{const s=normalize(x.title);if(!s)return false;return isbn?isbnClean47(x.isbn)===isbn || (normalize(title)===s && !!title):s===normalize(title) || (s.includes(normalize(title)) && normalize(title).length>=8);};
    if(all[0].status==='fulfilled')for(const row of all[0].value.items||[]){
      const info=metadataGoogle(row.volumeInfo||{},row),g=row.volumeInfo||{};
      const ids=(g.industryIdentifiers||[]).map(x=>isbnClean47(x.identifier));
      if((isbn&&ids.includes(isbn))||(!isbn&&similar(info))){results.push({...info,description:g.description||'',publisher:g.publisher||'',pages:g.pageCount||'',language:g.language||'',source:'Google Books'});}
    }
    if(all[1].status==='fulfilled')for(const row of all[1].value.docs||[]){
      const item={title:row.title,author:(row.author_name||[])[0]||'',isbn:(row.isbn||[])[0]||'',year:row.first_publish_year||'',genre:(row.subject||[])[0]||'',tags:(row.subject||[]).slice(0,6).join(', '),publisher:(row.publisher||[])[0]||'',pages:row.number_of_pages_median||'',cover:row.cover_i?'https://covers.openlibrary.org/b/id/'+row.cover_i+'-L.jpg':'',source:'Open Library'};
      if((isbn&&(row.isbn||[]).some(x=>isbnClean47(x)===isbn))||(!isbn&&similar(item)))results.push(item);
    }
    if(all[2].status==='fulfilled'&&typeof all[2].value==='string'){const d=parseDnb(all[2].value,isbn);if(d)results.push(d);}
    return results;
  }
  window.bu47EnrichOwnedBook = async function (id,silent=false) {
    const b=S.books.find(x=>String(x.id)===String(id));
    if(!b||metaBusy.has(String(id)))return;
    if(navigator.onLine===false){if(!silent)toast('Offline: Buchdaten können gerade nicht abgerufen werden.');return;}
    metaBusy.add(String(id));
    if(!silent)toast('Suche in Google Books, Open Library und DNB …');
    try{
      const candidates=await gatherMetadata(b);
      let count=0,providers=new Set();
      const fields=['author','year','genre','tags','publisher','pages','language','series','seriesNumber','description','isbn'];
      for(const candidate of candidates){
        providers.add(candidate.source);
        for(const key of fields)if((b[key]===undefined||b[key]===null||b[key]==='')&&candidate[key]!=null&&candidate[key]!==''){b[key]=candidate[key];count++;}
        if(!(b.covers||[]).length && !b.cover && /^https:\/\//i.test(candidate.cover||'')){b.covers=[candidate.cover];count++;}
        if(b.msrp==null && candidate.msrp!=null && candidate.msrp!==''){b.msrp=buSafeNumber(candidate.msrp);count++;}
      }
      b.metadataCheckedAt=Date.now();
      b.metadataSources=[...new Set([...(b.metadataSources||[]),...providers])];
      persist();
      if(count && (view==='detail'||view==='shelf'))render();
      if(!silent)toast(count?count+' Angaben ergänzt ('+[...providers].join(', ')+').':'Keine eindeutigen neuen Angaben gefunden. Manuelle Eingabe bleibt möglich.');
    }catch(e){if(!silent)toast('Onlinesuche fehlgeschlagen: '+String(e.message||e));}
    finally{metaBusy.delete(String(id));}
  };
  function detailMeta(){
    if(view!=='detail')return;
    const area=document.querySelector('.next-book-information');
    if(!area||area.querySelector('.bu47-metadata-btn'))return;
    const button=document.createElement('button');button.className='btn o bu47-metadata-btn';button.textContent='↻ Buchdaten automatisch suchen';
    button.addEventListener('click',()=>window.bu47EnrichOwnedBook(cur));area.appendChild(button);
  }
  const previousSaveBook=window.saveBook;
  window.saveBook=async function() {
    const previous=new Set(S.books.map(x=>String(x.id)));
    await previousSaveBook();
    for(const b of S.books)if(!previous.has(String(b.id)))void window.bu47EnrichOwnedBook(b.id,true);
  };
  const previousBatchFiles=window.batchFiles;
  window.batchFiles=async function(files) {
    const before=new Set(S.books.map(x=>String(x.id)));
    await previousBatchFiles(files);
    const newer=S.books.filter(x=>!before.has(String(x.id)));
    for(let i=0;i<newer.length;i++){
      await window.bu47EnrichOwnedBook(newer[i].id,true);
      if(i>=19)break; // API rate limits: larger imports can be enriched manually later.
    }
  };

  // PDF canvas pages are not selectable DOM text. Save normalized-area highlights per page.
  let highlightMode=false,drag=null;
  const activeBook=()=>S.books.find(x=>String(x.id)===String(cur));
  window.bu47ToggleHighlightMode=function(){
    highlightMode=!highlightMode;
    document.getElementById('rdscroll')?.classList.toggle('bu47-highlighting',highlightMode);
    toast(highlightMode?'Ziehe mit der Maus einen Bereich auf der PDF-Seite auf.':'Markierungsmodus beendet.');
  };
  window.bu47AddNote=function(){
    const b=activeBook();if(!b)return;
    const selected=window.getSelection?.().toString().trim().slice(0,1500)||'';
    const note=prompt(selected?'Kommentar zur ausgewählten Textstelle:':'Notiz zur aktuellen Seite:','');
    if(note===null||(!selected&&!note.trim()))return;
    b.annotations??=[];b.annotations.push({id:crypto.randomUUID(),page:Number(pgNow)||Number(b.page)||1,text:selected,comment:note.trim().slice(0,2000),created:Date.now()});
    persist();toast('Notiz gespeichert.');window.bu47ShowAnnotations();
  };
  window.nextCaptureHighlight=function(){window.bu47AddNote();};
  window.bu47RemoveAnnotation=function(index){
    const b=activeBook();if(!b||!Array.isArray(b.annotations)||!Number.isInteger(index)||index<0||index>=b.annotations.length)return;
    b.annotations.splice(index,1);persist();window.bu47ShowAnnotations();
  };
  function pageOf(canvas){
    if(canvas.id==='pdfCv2')return Number(pgNow)+1;
    const parent=canvas.closest('[data-n]');
    return parent?Number(parent.dataset.n):Number(pgNow)||1;
  }
  function drawHighlights(){
    const sc=document.getElementById('rdscroll'),b=activeBook();if(!sc||!b||view!=='reader')return;
    sc.querySelectorAll('.bu47-highlight-overlay').forEach(n=>n.remove());
    sc.querySelectorAll('canvas').forEach(canvas=>{
      if(!canvas.width||!canvas.height||!canvas.clientWidth)return;
      const p=pageOf(canvas),records=(b.annotations||[]).filter(a=>a.rect&&Number(a.page)===p);
      const parent=canvas.parentElement;if(!parent)return;
      if(getComputedStyle(parent).position==='static')parent.style.position='relative';
      for(const a of records){
        const el=document.createElement('div');el.className='bu47-highlight-overlay';
        el.title=a.comment||'Markierung auf Seite '+p;
        el.style.left=(canvas.offsetLeft+a.rect.x*canvas.clientWidth)+'px';el.style.top=(canvas.offsetTop+a.rect.y*canvas.clientHeight)+'px';
        el.style.width=(a.rect.w*canvas.clientWidth)+'px';el.style.height=(a.rect.h*canvas.clientHeight)+'px';
        parent.appendChild(el);
      }
    });
  }
  window.bu47ShowAnnotations=function(){
    drawHighlights();
    const b=activeBook(),list=document.getElementById('bu47-annotations-list');if(!list||!b)return;
    const annotations=b.annotations||[];
    list.innerHTML=annotations.length?annotations.map((a,i)=>({a,i})).reverse().map(({a,i})=>'<div class="bu47-note"><b>Seite '+Number(a.page||1)+(a.rect?' · Markierung':' · Notiz')+'</b><p>'+esc(a.comment||a.text||'Bereich auf der Seite markiert')+'</p><button class="chip" data-remove-annotation="'+i+'">Löschen</button></div>').join(''):'<p class="hint">Noch keine Notizen oder Markierungen.</p>';
    list.querySelectorAll('[data-remove-annotation]').forEach(el=>el.addEventListener('click',()=>window.bu47RemoveAnnotation(Number(el.dataset.removeAnnotation))));
  };
  function attachReaderTools(){
    if(view!=='reader')return;
    const wrap=document.getElementById('rdwrap'),sc=document.getElementById('rdscroll');
    if(!wrap||!sc)return;
    if(!wrap.querySelector('.bu47-reader-tools')){
      const toolbar=document.createElement('div');toolbar.className='bu47-reader-tools';
      toolbar.innerHTML='<button class="chip" onclick="bu47ToggleHighlightMode()">▧ Seite markieren</button><button class="chip" onclick="bu47AddNote()">✎ Notiz hinzufügen</button><span class="hint">Strg + Mausrad oder Touchpad-Geste: Zoom</span>';
      wrap.querySelector('.rdtop')?.insertAdjacentElement('afterend',toolbar);
    }
    if(!document.getElementById('bu47-annotations-list')){
      const box=document.createElement('section');box.className='bu47-annotation-panel';
      box.innerHTML='<h3>Deine Markierungen & Notizen</h3><div id="bu47-annotations-list"></div>';
      wrap.after(box);
    }
    if(sc.dataset.bu47Events==='yes'){window.bu47ShowAnnotations();return;}
    sc.dataset.bu47Events='yes';
    sc.classList.toggle('bu47-highlighting',highlightMode);
    sc.addEventListener('wheel',e=>{
      if(!e.ctrlKey&&!e.metaKey)return;
      e.preventDefault();
      const next=bu44ZoomValue()+(e.deltaY<0?.15:-.15);
      bu44ZoomSet(next);
    },{passive:false});
    sc.addEventListener('pointerdown',e=>{
      if(!highlightMode||e.button!==0)return;
      const canvas=e.target.closest('canvas');if(!canvas)return;
      e.preventDefault();e.stopPropagation();
      const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
      drag={canvas,page:pageOf(canvas),x,y,px:e.clientX,py:e.clientY};
      try{sc.setPointerCapture(e.pointerId);}catch{}
    },true);
    sc.addEventListener('pointerup',e=>{
      if(!drag)return;const d=drag;drag=null;
      e.preventDefault();e.stopPropagation();
      const r=d.canvas.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
      const rect={x:Math.min(d.x,x),y:Math.min(d.y,y),w:Math.abs(x-d.x),h:Math.abs(y-d.y)};
      if(rect.w<.01||rect.h<.005){toast('Ziehe über den Bereich, den du markieren möchtest.');return;}
      const b=activeBook();if(!b)return;b.annotations??=[];
      b.annotations.push({id:crypto.randomUUID(),page:d.page,rect,comment:'',created:Date.now()});
      persist();highlightMode=false;sc.classList.remove('bu47-highlighting');window.bu47ShowAnnotations();
      toast('Seitenbereich markiert und gespeichert.');
    },true);
    sc.addEventListener('pointercancel',()=>{drag=null;},true);
    window.bu47ShowAnnotations();
  }
  const originalMount=window.mountMode;
  window.mountMode=async function(){const ret=await originalMount.apply(this,arguments);setTimeout(drawHighlights,150);return ret;};
  const originalShow=window.showPg;
  window.showPg=async function(){const ret=await originalShow.apply(this,arguments);if(bu44ZoomValue()>1.01){document.querySelectorAll('#rdscroll canvas').forEach(c=>{if(c.style.width)c.style.setProperty('width',c.style.width,'important');if(c.style.height)c.style.setProperty('height',c.style.height,'important');});}setTimeout(drawHighlights,20);return ret;};
  const originalDrawPg=window.drawPg;
  window.drawPg=async function(){const ret=await originalDrawPg.apply(this,arguments);setTimeout(drawHighlights,25);return ret;};

  // Use actual OS display fullscreen, with a safe CSS fallback if Electron denies the request.
  const originalToggle=window.toggleFull,originalLeave=window.leaveFull;
  window.toggleFull=function(){
    const enter=!rdFull;
    originalToggle();
    const wrap=document.getElementById('rdwrap');
    if(enter && wrap?.requestFullscreen){void wrap.requestFullscreen().catch(e=>console.warn('Fullscreen API:',e.message));}
    else if(!enter && document.fullscreenElement){void document.exitFullscreen().catch(()=>{});}
    setTimeout(attachReaderTools,100);
  };
  window.leaveFull=function(){originalLeave();if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});};
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement && rdFull && view==='reader')originalToggle();});
  document.addEventListener('keydown',e=>{
    if(view!=='reader')return;
    if(e.ctrlKey && ['+','=','-','0'].includes(e.key)){
      e.preventDefault();
      if(e.key==='0')bu44ZoomSet(1);else bu44ZoomStep(e.key==='-'?-.2:.2);
    }
  });

  const originalAfter=window.nextAfterRender;
  window.nextAfterRender=function(){
    originalAfter();
    arrows();batchHelp();detailMeta();
    if(view==='reader')setTimeout(attachReaderTools,0);
  };
  render();
})();