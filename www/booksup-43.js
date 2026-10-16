/* BooksUp 4.3: additive cover, settings, reader and reading-list features. */
const bu43CoverCache=new Map(),bu43Pending=new Map();
const bu43IsHttp=u=>/^https:\/\/[^\s<>"']+$/i.test(String(u||''));
const bu43Norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,' ').trim();
function bu43CoverHtml(b){
 const src=(b.covers||[])[0]||b.cover||null;
 if(src && (/^https?:\/\//i.test(src)||/^data:image\//.test(src)||/^blob:/.test(src)))
   return '<img src="'+esc(src)+'" loading="lazy" decoding="async" alt="'+esc(b.title||'Buchcover')+'" onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span class=&quot;bu43-cover-missing&quot;>Cover nicht verfügbar</span>\')">';
 const title=String(b.title||'').slice(0,250),isbn=String(b.isbn||b.editions?.[0]?.isbn||'').replace(/[^0-9X]/gi,'');
 return '<span class="bu43-cover-slot" data-cover-title="'+esc(title)+'" data-cover-author="'+esc(String(b.author||'').slice(0,150))+'" data-cover-isbn="'+esc(isbn)+'"><span class="bu43-cover-placeholder">'+esc(title.slice(0,2)||'BU')+'</span><small>'+ (navigator.onLine===false?'Offline · Cover nicht geladen':'Cover wird gesucht …')+'</small></span>';
}
function bu43ImageWorks(url){
 return new Promise(resolve=>{
  if(!bu43IsHttp(url))return resolve(false);
  const img=new Image();let done=false;
  const finish=v=>{if(done)return;done=true;img.onload=img.onerror=null;resolve(v)};
  img.onload=()=>finish(img.naturalWidth>48&&img.naturalHeight>48);
  img.onerror=()=>finish(false);img.src=url;setTimeout(()=>finish(false),6500);
 });
}
async function bu43FindCover(title,author,isbn){
 const key=isbn||bu43Norm(title+' '+author);
 if(bu43CoverCache.has(key))return bu43CoverCache.get(key);
 if(bu43Pending.has(key))return bu43Pending.get(key);
 const task=(async()=>{
  if(navigator.onLine===false)return null;
  const candidates=[];
  if(isbn.length===10||isbn.length===13)candidates.push('https://covers.openlibrary.org/b/isbn/'+encodeURIComponent(isbn)+'-L.jpg?default=false');
  try{
    const query=isbn?'isbn:'+isbn:'intitle:'+title+(author?' inauthor:'+author:'');
    const j=await fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(query)+'&maxResults=8');
    for(const x of j.items||[]){
      const links=x.volumeInfo?.imageLinks||{},u=links.extraLarge||links.large||links.medium||links.thumbnail||links.smallThumbnail;
      if(u)candidates.push(u.replace(/^http:/,'https:').replace(/zoom=\d+/,'zoom=0'));
    }
  }catch{}
  try{
    const q=isbn?'isbn='+encodeURIComponent(isbn):'title='+encodeURIComponent(title)+(author?'&author='+encodeURIComponent(author):'');
    const j=await fetchMetaUrl('https://openlibrary.org/search.json?'+q+'&limit=6&fields=cover_i,isbn,title,author_name');
    for(const x of j.docs||[])if(x.cover_i)candidates.push('https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg');
  }catch{}
  let found=null;
  const pool=[...new Set(candidates)].slice(0,8);
  for(let i=0;i<pool.length;i+=4){const tests=await Promise.all(pool.slice(i,i+4).map(bu43ImageWorks));const first=tests.findIndex(Boolean);if(first>=0){found=pool[i+first];break}}
  bu43CoverCache.set(key,found);return found;
 })();
 bu43Pending.set(key,task);try{return await task}finally{bu43Pending.delete(key)}
}
let bu43CoverObserver=null;
function bu43LoadCovers(){
 if(bu43CoverObserver)bu43CoverObserver.disconnect();
 const nodes=[...document.querySelectorAll('.bu43-cover-slot')];
 if(!nodes.length)return;
 bu43CoverObserver=new IntersectionObserver(entries=>{
  for(const e of entries)if(e.isIntersecting){
   const el=e.target;bu43CoverObserver?.unobserve(el);
   if(navigator.onLine===false){const t=el.querySelector('small');if(t)t.textContent='Offline · Cover nicht geladen';continue}
   bu43FindCover(el.dataset.coverTitle||'',el.dataset.coverAuthor||'',el.dataset.coverIsbn||'').then(url=>{
    if(!el.isConnected)return;
    if(!url){const m=el.querySelector('small');if(m)m.textContent='Kein Online-Cover gefunden';return}
    const img=new Image();img.alt=el.dataset.coverTitle||'Cover';img.loading='lazy';img.decoding='async';img.src=url;
    el.replaceChildren(img);
   });
  }
 },{root:null,rootMargin:'550px'});
 nodes.forEach(x=>bu43CoverObserver.observe(x));
}
function bu43RestoreProfileLists(){
 return '<div class="card bu43-profile-lists"><div class="bu43-panel-head"><div><h3>Meine Leselisten</h3><p class="hint">Deine eigenen Listen und Wunschbücher.</p></div><button class="btn o" onclick="go(\'lists\')">Alle Leselisten →</button></div><div class="bu43-profile-grid">'+buListsData().slice(0,4).map(l=>'<button class="bu43-panel-card" onclick="go(\'lists\')"><b>'+esc(l.name)+'</b><small>'+(l.items||[]).length+' Bücher</small></button>').join('')+'<button class="bu43-panel-card" onclick="buNewList()">＋ Neue Leseliste</button></div></div>';
}
function bu43ListsRules(l){
 const options=[['manual','Manuell'],['unread','Alle ungelesenen Bücher'],['finished','Abgeschlossene Bücher'],['reading','Gerade am Lesen'],['owned','Alle vorhandenen Bücher']];
 const id=Number(l.id);
 return '<div class="bu43-rule"><label>Automatische Aktualisierung</label><select onchange="bu43ListRule('+id+',this.value)">'+options.map(([v,t])=>'<option value="'+v+'" '+((l.autoRule||'manual')===v?'selected':'')+'>'+t+'</option>').join('')+'</select><label>Wann aktualisieren?</label><select onchange="bu43ListTiming('+id+',this.value)"><option value="change" '+((l.autoTiming||'change')==='change'?'selected':'')+'>Bei Änderungen / Buchabschluss</option><option value="open" '+(l.autoTiming==='open'?'selected':'')+'>Beim Öffnen der Leseliste</option></select><label class="bu43-check"><input type="checkbox" '+(l.folderSync!==false?'checked':'')+' onchange="bu43FolderSync('+id+',this.checked)"> Ordner automatisch erstellen, wenn ausschließlich eigene Bücher enthalten sind</label></div>';
}
function bu43ListRule(id,rule){const l=buListsData().find(x=>Number(x.id)===id);if(!l)return;l.autoRule=rule;bu43RefreshList(l);save();go('lists')}
function bu43ListTiming(id,t){const l=buListsData().find(x=>Number(x.id)===id);if(!l)return;l.autoTiming=t;persist()}
function bu43FolderSync(id,v){const l=buListsData().find(x=>Number(x.id)===id);if(!l)return;l.folderSync=v;bu43SyncFolder(l);persist()}
function bu43RefreshList(l){
 if(!l||!l.autoRule||l.autoRule==='manual')return;
 const books=S.books.filter(b=>l.autoRule==='unread'?!b.finished:l.autoRule==='finished'?!!b.finished:l.autoRule==='reading'?!!b.started&&!b.finished:true);
 const remembered=(l.items||[]).filter(x=>!x.bookId); // keep manually added wishlist records
 l.items=[...remembered,...books.map(b=>({id:'auto-'+b.id,bookId:b.id,title:b.title,author:b.author,owned:true}))];
 bu43SyncFolder(l);
}
function bu43SyncFolder(l){
 if(!l||l.folderSync===false)return;
 const items=l.items||[];
 if(!items.length||items.some(x=>!x.bookId||!S.books.some(b=>String(b.id)===String(x.bookId))))return;
 S.folders=Array.isArray(S.folders)?S.folders:[];
 if(!S.folders.includes(l.name))S.folders.push(l.name);
 for(const x of items){
  const b=S.books.find(b=>String(b.id)===String(x.bookId));if(!b)continue;
  b.folders=[...new Set([...(b.folders||[]),l.name])];
  if(!b.folder)b.folder=l.name;
 }
}
let bu43ReconcileBusy=false;
function bu43ReconcileLists(){
 if(bu43ReconcileBusy)return;
 bu43ReconcileBusy=true;
 try{
  for(const l of buListsData()){
   if(l.autoRule&&l.autoRule!=='manual'&&(l.autoTiming||'change')==='change')bu43RefreshList(l);
   else bu43SyncFolder(l);
  }
 }finally{bu43ReconcileBusy=false}
}
function bu43ListsOnOpen(){for(const l of buListsData())if(l.autoRule&&l.autoRule!=='manual'&&l.autoTiming==='open')bu43RefreshList(l)}
/* Deliberately stage appearance changes: do not mutate the data model before Save. */
let bu43AppearanceDraft=null,bu43AppearanceBaseline='',bu43ExitPending=null,bu43GuardSkip=false;
function bu43ApCapture(){return {nextTheme:ALL.nextTheme||'standard',mode:S.mode??0,theme:S.theme??0,paper:S.paper??0,fs:S.fs??1}}
function bu43ApOpen(){bu43AppearanceDraft=bu43ApCapture();bu43AppearanceBaseline=JSON.stringify(bu43AppearanceDraft)}
function bu43ApDirty(){return !!bu43AppearanceDraft&&JSON.stringify(bu43AppearanceDraft)!==bu43AppearanceBaseline}
function bu43ApChoose(key,value){
 if(!bu43AppearanceDraft)bu43ApOpen();
 bu43AppearanceDraft[key]=value;
 const root=document.documentElement;
 if(key==='fs')root.style.setProperty('--fz',[14,16,19,22][value]+'px');
 if(key==='nextTheme')bu43ApPreviewTheme();
 render();
}
function bu43ApPreviewTheme(){
 if(!bu43AppearanceDraft)return;
 document.documentElement.setAttribute('data-theme',bu43AppearanceDraft.mode===2?'dark':bu43AppearanceDraft.mode===1?'light':(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
 document.documentElement.dataset.paper=String(bu43AppearanceDraft.paper);
 const t=NEXT_THEMES.find(t=>t[1]===bu43AppearanceDraft.nextTheme);
 if(t){const r=document.documentElement;for(const [key,val] of Object.entries({'--bg':t[2],'--card':t[3],'--ink':t[4],'--mut':t[5],'--bd':t[6],'--acc':t[7]}))r.style.setProperty(key,val)}
}
function bu43ApSave(){
 if(!bu43AppearanceDraft)return;
 const d=bu43AppearanceDraft;ALL.nextTheme=d.nextTheme;S.mode=d.mode;S.theme=d.theme;S.paper=d.paper;S.fs=d.fs;bu43AppearanceBaseline=JSON.stringify(d);persist();toast('Darstellung gespeichert.');render();
}
function bu43ApDiscard(){bu43AppearanceDraft=null;bu43AppearanceBaseline='';render()}
function bu43AskLeave(target,id){
 if(!bu43ApDirty())return false;
 bu43ExitPending={target,id};
 modal='<h3>Ungespeicherte Darstellung</h3><p>Du hast die Darstellung geändert. Änderungen speichern oder verwerfen?</p><div class="book-actions"><button class="btn" onclick="bu43ResolveLeave(\'save\')">Speichern</button><button class="btn o" onclick="bu43ResolveLeave(\'discard\')">Verwerfen</button><button class="chip" onclick="bu43ResolveLeave(\'cancel\')">Hier bleiben</button></div>';
 render();return true;
}
function bu43ResolveLeave(action){
 const next=bu43ExitPending;bu43ExitPending=null;modal=null;
 if(action==='cancel'){render();return}
 if(action==='save')bu43ApSave();else bu43ApDiscard();
 bu43GuardSkip=true;
 try{
  if(next?.target==='settingsDetail'&&typeof next.id==='string'){nextSettingCategory=next.id;view='settingsDetail';render()}
  else go(next?.target||'settings',next?.id);
 }finally{bu43GuardSkip=false}
}
function bu43GuardGo(target,id){return !bu43GuardSkip&&view==='settingsDetail'&&nextSettingCategory==='appearance'&&target!=='settingsDetail'&&bu43AskLeave(target,id)}
function bu43AppearanceView(){
 if(!bu43AppearanceDraft)bu43ApOpen();
 const d=bu43AppearanceDraft;
 const opt=(arr,key)=>arr.map(([n,val],i)=>'<button class="bu43-mode-preview '+(d[key]===val?'on':'')+'" onclick="bu43ApChoose(\''+key+'\','+JSON.stringify(val)+')"><span class="bu43-mode-art">'+(key==='fs'?'<span style="font-size:'+([14,16,19,22][val]||16)+'px">Aa</span>':key==='mode'?'<span class="bu43-mode-sample '+(val===2?'night':val===1?'day':'system')+'">Aa</span>':'✦')+'</span><small>'+esc(n)+'</small></button>').join('');
 return '<div class="bu43-appearance"><p class="hint">Probiere alles aus. Erst „Änderungen speichern“ übernimmt die Auswahl dauerhaft.</p>'+
 '<h3>Theme-Vorlagen</h3><div class="next-theme-grid">'+NEXT_THEMES.map(t=>'<button class="next-theme-choice '+(d.nextTheme===t[1]?'active':'')+'" onclick="bu43ApChoose(\'nextTheme\',\''+t[1]+'\')"><span class="next-theme-preview" style="background:linear-gradient(125deg,'+t[2]+' 10%,'+t[7]+' 130%)"><span style="background:'+t[3]+';color:'+t[4]+'">Aa</span></span><b>'+esc(t[0])+'</b></button>').join('')+'</div>'+
 '<h3>Helligkeit</h3><div class="bu43-preview-row">'+opt([['System',0],['Hell',1],['Dunkel',2]],'mode')+'</div>'+
 '<h3>Akzentfarben</h3><div class="bu43-preview-row">'+T.map((t,i)=>'<button class="bu43-mode-preview '+(d.theme===i?'on':'')+'" onclick="bu43ApChoose(\'theme\','+i+')"><span class="bu43-color-dot" style="background:'+t[1]+'"></span><small>'+esc(t[0])+'</small></button>').join('')+'</div>'+
 '<h3>Papierhintergrund</h3><div class="bu43-preview-row">'+PAP.map((t,i)=>'<button class="bu43-mode-preview '+(d.paper===i?'on':'')+'" onclick="bu43ApChoose(\'paper\','+i+')"><span class="bu43-mode-art" style="background:'+t[1]+'">▤</span><small>'+esc(t[0])+'</small></button>').join('')+'</div>'+
 '<h3>Schriftgröße</h3><div class="bu43-preview-row">'+opt([['Klein',0],['Normal',1],['Groß',2],['Extra groß',3]],'fs')+'</div>'+
 '<div class="bu43-ap-actions"><button class="btn" onclick="bu43ApSave()">✓ Änderungen speichern</button><button class="btn o" onclick="bu43ApDiscard();bu43ApOpen()">Verwerfen</button></div></div>';
}
function bu43RecView(){
 const r=S.rec||{},basis=Array.isArray(r.sources)?r.sources:[],genres=[...new Set([...S.books,...CAT_()].map(b=>String(b.genre||'').trim()).filter(Boolean))].slice(0,70);
 return '<div class="bu43-settings-panel"><h3>Empfehlungsbasis</h3><p class="hint">Wähle Bücher aus, die deinen Geschmack bestimmen.</p><div class="bu43-scroll-choices">'+S.books.map(b=>'<label class="bu43-check"><input type="checkbox" '+(basis.some(id=>String(id)===String(b.id))?'checked':'')+' onchange="recToggle(\'sources\','+Number(b.id)+')"> '+esc(b.title)+'</label>').join('')+'</div><h3>Gewünschte Genres</h3><div class="bu43-scroll-choices">'+genres.map(g=>'<label class="bu43-check"><input type="checkbox" '+((r.includeGenres||[]).some(x=>buNorm(x)===buNorm(g))?'checked':'')+' onchange="bu43ToggleGenre(this,'+JSON.stringify(g).replace(/"/g,'&quot;')+')"> '+esc(g)+'</label>').join('')+'</div><h3>Entdeckungen</h3><label class="bu43-check"><input type="checkbox" '+(r.own!==false?'checked':'')+' onchange="S.rec.own=this.checked;persist()"> Eigene ungelesene Bücher berücksichtigen</label><label class="bu43-check"><input type="checkbox" '+(r.cat!==false?'checked':'')+' onchange="S.rec.cat=this.checked;persist()"> Bücher vorschlagen, die ich noch nicht besitze</label><div class="row"><button class="btn o" onclick="recPicker()">Tags und Ausschlüsse bearbeiten</button></div></div>';
}
function bu43ToggleGenre(el,g){const arr=S.rec.includeGenres||[];if(el.checked&&!arr.includes(g))arr.push(g);if(!el.checked)S.rec.includeGenres=arr.filter(x=>x!==g);else S.rec.includeGenres=arr;persist()}
function bu43ReadingSettings(){
 const modes=[['Buchseiten',0],['Vertikal scrollen',1],['Textmodus',2]];
 const sel=(name,k,opts)=>'<label>'+name+'</label><select onchange="bu43ReadSet(\''+k+'\',this.value)">'+opts.map(([n,v])=>'<option value="'+v+'" '+(String(S[k]??'')===String(v)?'selected':'')+'>'+n+'</option>').join('')+'</select>';
 return '<div class="bu43-settings-panel"><h3>PDF und Comics</h3>'+sel('Lesemodus','rdMode',modes)+sel('Scrollrichtung für PDFs','pdfScrollDir',[['Oben nach unten','vertical'],['Rechts / links (horizontal)','horizontal']])+
 '<h3>Lesefarben und Typografie</h3>'+sel('Farbschema im Reader','readMode',[['Hell',0],['Dunkel',1],['Sepia',2]])+
 sel('Schriftfamilie im Textmodus','tff',[['Serif',0],['Sans Serif',1],['Lesefreundlich',2]])+
 '<label>Schriftgröße im Textmodus: <b>'+Number(S.tfs||18)+' px</b></label><input type="range" min="13" max="30" step="1" value="'+Number(S.tfs||18)+'" oninput="bu43ReadSet(\'tfs\',Number(this.value))">'+
 '<label>Zeilenabstand</label><input type="range" min="1.2" max="2.2" step=".1" value="'+Number(S.tlh||1.7)+'" oninput="bu43ReadSet(\'tlh\',Number(this.value))">'+
 '<h3>Navigation und Komfort</h3><label class="bu43-check"><input type="checkbox" '+(S.rtl?'checked':'')+' onchange="bu43ReadSet(\'rtl\',this.checked)"> Rechts-nach-links-Leserichtung (Manga)</label>'+
 '<label class="bu43-check"><input type="checkbox" '+(S.dbl?'checked':'')+' onchange="bu43ReadSet(\'dbl\',this.checked)"> Doppelseiten im Querformat</label>'+
 '<label class="bu43-check"><input type="checkbox" '+(S.autoPause?'checked':'')+' onchange="bu43ReadSet(\'autoPause\',this.checked)"> Sitzung bei Inaktivität pausieren</label>'+
 '<label class="bu43-check"><input type="checkbox" '+(S.focusLine?'checked':'')+' onchange="bu43ReadSet(\'focusLine\',this.checked)"> Fokuszeile anzeigen</label>'+
 '<p class="hint">Im Vollbild genügt ein Tippen auf die Seite, um die Bedienleiste ein- oder auszublenden.</p></div>';
}
let bu43TextSaveTimer=null;
function bu43ReadSet(key,value){S[key]=['rdMode','readMode','tff'].includes(key)?Number(value):value;
 if(key==='tfs'||key==='tlh'){const el=$('txt');if(el){el.style.setProperty('--tfs',(S.tfs||18)+'px');el.style.setProperty('--tlh',S.tlh||1.7)}clearTimeout(bu43TextSaveTimer);bu43TextSaveTimer=setTimeout(persist,320);return}
 persist();if(view==='reader')mountMode();else render()}
function bu43CurrencyView(){
 const c=S.currency||'€',p=ALL.priceSettings||{},curr=['€','$','£','CHF','SEK','NOK','DKK','¥','CAD','AUD'],locales=[['de-DE','Deutsch (1.234,56)'],['en-US','English (1,234.56)'],['fr-FR','Français (1 234,56)'],['it-IT','Italiano (1.234,56)']];
 return '<div class="bu43-settings-panel"><h3>Währung</h3><div class="bu43-preview-row">'+curr.map(x=>'<button class="bu43-mode-preview '+(c===x?'on':'')+'" onclick="bu43CurrencySet(\'currency\',\''+x+'\')"><span class="bu43-mode-art">'+x+'</span><small>'+x+'</small></button>').join('')+'</div><h3>Preisanzeige</h3><label>Zahlenformat</label><select onchange="bu43CurrencySet(\'locale\',this.value)">'+locales.map(([v,n])=>'<option value="'+v+'" '+((p.locale||'de-DE')===v?'selected':'')+'>'+n+'</option>').join('')+'</select>'+
 '<label class="bu43-check"><input type="checkbox" '+(p.showPurchase!==false?'checked':'')+' onchange="bu43CurrencySet(\'showPurchase\',this.checked)"> Kaufpreis auf Buchdetails anzeigen</label>'+
 '<label class="bu43-check"><input type="checkbox" '+(p.showUVP!==false?'checked':'')+' onchange="bu43CurrencySet(\'showUVP\',this.checked)"> UVP unter „Mehr Details“ anzeigen</label>'+
 '<label>Monatliches Buchbudget (optional)</label><input type="number" min="0" step=".01" placeholder="Kein Budget" value="'+esc(p.monthlyBudget??'')+'" onchange="bu43CurrencySet(\'monthlyBudget\',this.value)"><p class="hint">Die Beträge werden nicht automatisch zwischen Währungen umgerechnet. Deine Buchpreise bleiben erhalten.</p></div>';
}
function bu43CurrencySet(key,val){if(key==='currency')S.currency=val;else{ALL.priceSettings??={};ALL.priceSettings[key]=val}persist();render()}
function bu43GoodreadsView(){return '<div class="bu43-settings-panel"><h3>Goodreads-Kompatibilität</h3><p class="hint">Passe die Bewertungsskala und die Übernahme von Goodreads-Shelves an.</p>'+buRatingInput()+'<button class="btn" onclick="buGoodreadsPick()">Goodreads-CSV importieren</button></div>'}
function bu43AfterRender(){
 bu43LoadCovers();
 if(view==='settingsDetail'&&nextSettingCategory==='appearance'&&bu43AppearanceDraft){
  bu43ApPreviewTheme();
  document.documentElement.style.setProperty('--fz',[14,16,19,22][bu43AppearanceDraft.fs]+'px');
 }else if(!bu43AppearanceDraft){document.documentElement.style.setProperty('--fz',[14,16,19,22][S.fs??1]+'px')}
}

const BU43_WORDS={"Helligkeit":["Brightness","Luminosité","Brillo","Luminosità"],"Akzentfarben":["Accent colors","Couleurs d’accent","Colores de acento","Colori di accento"],"Papierhintergrund":["Paper background","Fond papier","Fondo de papel","Sfondo carta"],"Schriftgröße":["Font size","Taille du texte","Tamaño de letra","Dimensione del testo"],"Extra groß":["Extra large","Très grand","Muy grande","Molto grande"],"Änderungen speichern":["Save changes","Enregistrer","Guardar cambios","Salva modifiche"],"Änderungen verwerfen":["Discard changes","Ignorer les modifications","Descartar cambios","Annulla modifiche"],"Verwerfen":["Discard","Ignorer","Descartar","Annulla"],"Hier bleiben":["Stay here","Rester ici","Quedarme aquí","Resta qui"],"Ungespeicherte Darstellung":["Unsaved appearance settings","Apparence non enregistrée","Apariencia sin guardar","Aspetto non salvato"],"Goodreads-Kompatibilität":["Goodreads compatibility","Compatibilité Goodreads","Compatibilidad Goodreads","Compatibilità Goodreads"],"Bewertungen, Import und Shelves":["Ratings, import and shelves","Notes, import et étagères","Valoraciones, importación y estantes","Valutazioni, importazione e scaffali"],"Empfehlungsbasis":["Recommendation sources","Sources des recommandations","Base de recomendaciones","Fonti dei consigli"],"Gewünschte Genres":["Preferred genres","Genres préférés","Géneros deseados","Generi preferiti"],"Entdeckungen":["Discoveries","Découvertes","Descubrimientos","Scoperte"],"Eigene ungelesene Bücher berücksichtigen":["Include my unread books","Inclure mes livres non lus","Incluir mis libros sin leer","Includi i miei libri da leggere"],"Bücher vorschlagen, die ich noch nicht besitze":["Suggest books I don't own","Proposer des livres non possédés","Sugerir libros que no tengo","Suggerisci libri che non possiedo"],"Tags und Ausschlüsse bearbeiten":["Edit tags and exclusions","Modifier mots-clés et exclusions","Editar etiquetas y exclusiones","Modifica tag ed esclusioni"],"PDF und Comics":["PDFs and comics","PDF et BD","PDF y cómics","PDF e fumetti"],"Lesemodus":["Reading mode","Mode de lecture","Modo de lectura","Modalità di lettura"],"Buchseiten":["Book pages","Pages du livre","Páginas del libro","Pagine del libro"],"Vertikal scrollen":["Vertical scrolling","Défilement vertical","Desplazamiento vertical","Scorrimento verticale"],"Textmodus":["Text mode","Mode texte","Modo texto","Modalità testo"],"Scrollrichtung für PDFs":["PDF scroll direction","Sens de défilement PDF","Dirección de desplazamiento PDF","Direzione scorrimento PDF"],"Oben nach unten":["Top to bottom","De haut en bas","De arriba abajo","Dall'alto in basso"],"Rechts / links (horizontal)":["Left and right (horizontal)","Gauche/droite (horizontal)","Izquierda/derecha (horizontal)","Destra/sinistra (orizzontale)"],"Lesefarben und Typografie":["Reading colors and typography","Couleurs et typographie","Colores y tipografía","Colori e tipografia"],"Farbschema im Reader":["Reader color scheme","Couleurs du lecteur","Colores del lector","Colori del lettore"],"Schriftfamilie im Textmodus":["Text-mode font","Police du mode texte","Fuente del modo texto","Carattere modalità testo"],"Serif":["Serif","Avec empattements","Con serifas","Con grazie"],"Lesefreundlich":["Reading friendly","Confort de lecture","Fácil de leer","Facile da leggere"],"Zeilenabstand":["Line spacing","Interligne","Interlineado","Interlinea"],"Navigation und Komfort":["Navigation and comfort","Navigation et confort","Navegación y comodidad","Navigazione e comfort"],"Rechts-nach-links-Leserichtung (Manga)":["Right-to-left reading (manga)","Lecture droite-gauche (manga)","Lectura derecha-izquierda (manga)","Lettura da destra a sinistra (manga)"],"Doppelseiten im Querformat":["Two-page spread in landscape","Double page en paysage","Doble página horizontal","Doppia pagina orizzontale"],"Sitzung bei Inaktivität pausieren":["Pause session when inactive","Pause en cas d'inactivité","Pausar al estar inactivo","Pausa se inattivo"],"Fokuszeile anzeigen":["Show focus line","Afficher la ligne de focus","Mostrar línea de enfoque","Mostra riga di messa a fuoco"],"Preisanzeige":["Price display","Affichage des prix","Visualización de precios","Visualizzazione prezzi"],"Zahlenformat":["Number formatting","Format des nombres","Formato numérico","Formato numerico"],"Kaufpreis auf Buchdetails anzeigen":["Show purchase price in book details","Afficher le prix payé","Mostrar precio pagado","Mostra prezzo di acquisto"],"UVP unter „Mehr Details“ anzeigen":["Show list price in details","Afficher prix public","Mostrar precio de lista","Mostra prezzo di listino"],"Monatliches Buchbudget (optional)":["Monthly book budget (optional)","Budget mensuel (facultatif)","Presupuesto mensual (opcional)","Budget mensile (opzionale)"],"Automatische Aktualisierung":["Automatic updates","Mise à jour automatique","Actualización automática","Aggiornamento automatico"],"Manuell":["Manual","Manuel","Manual","Manuale"],"Alle ungelesenen Bücher":["All unread books","Tous les livres non lus","Todos los libros sin leer","Tutti i libri non letti"],"Abgeschlossene Bücher":["Finished books","Livres terminés","Libros terminados","Libri completati"],"Gerade am Lesen":["Currently reading","En cours de lecture","Leyendo ahora","Lettura in corso"],"Alle vorhandenen Bücher":["All owned books","Tous les livres possédés","Todos los libros propios","Tutti i libri posseduti"],"Wann aktualisieren?":["When to update?","Quand actualiser ?","¿Cuándo actualizar?","Quando aggiornare?"],"Bei Änderungen / Buchabschluss":["When changed / finished","Après modification/fin","Al cambiar/terminar","Quando cambia/finisce"],"Beim Öffnen der Leseliste":["When opening the list","À l'ouverture de la liste","Al abrir la lista","Quando si apre la lista"],"Neue Leseliste":["New reading list","Nouvelle liste de lecture","Nueva lista de lectura","Nuova lista di lettura"],"Meine Leselisten":["My reading lists","Mes listes de lecture","Mis listas de lectura","Le mie liste di lettura"],"Kapitel":["Chapters","Chapitres","Capítulos","Capitoli"],"Anmerkungen":["Annotations","Annotations","Anotaciones","Annotazioni"],"Cover wird gesucht …":["Searching for cover …","Recherche de couverture …","Buscando portada …","Ricerca copertina …"],"Offline · Cover nicht geladen":["Offline · cover unavailable","Hors ligne · couverture indisponible","Sin conexión · portada no disponible","Offline · copertina non disponibile"],"Kein Online-Cover gefunden":["No online cover found","Aucune couverture trouvée","No se encontró portada","Copertina non trovata"]};
