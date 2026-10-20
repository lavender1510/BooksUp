/* BooksUp 5.6: functional reliability only. Keep the original 4.6/5.2 presentation. */
(function(){
'use strict';
if(window.booksup56)return;window.booksup56=true;
const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=v=>norm(v).split(/\s+/).filter(x=>x.length>3&&!['the','and','with','eine','einer','oder','eine','das','der','die','von','und','pour','avec','from','book','roman','books','series','volume'].includes(x));
const unique=a=>[...new Set(a.filter(Boolean))];
const bookKey=b=>norm(String(b?.title||'')+' '+String(b?.author||''));
const ownBook=id=>[...S.books,...(typeof bu45Extra==='function'?bu45Extra():[])].find(b=>String(b.id)===String(id));
const isoISBN=v=>String(v||'').replace(/[^0-9X]/gi,'').toUpperCase();
const validISBN=v=>typeof isbnValid==='function'&&isbnValid(isoISBN(v));
const language=()=>typeof nextLanguage==='function'?nextLanguage():'de';
const cover=u=>/^https:\/\//i.test(String(u||''))?String(u).replace(/^http:/i,'https:'):'';
const cleanDesc=v=>String(typeof v==='string'?v:v?.value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,6500);
const scoreMatch=(requested,c)=>{
 const isbn=isoISBN(requested.isbn),ids=(c.isbns||[]).map(isoISBN);
 if(isbn&&ids.includes(isbn))return 180;
 const titles=unique([requested.title,requested.originalTitle,...(requested.alternativeTitles||[])].filter(x=>typeof x==='string').map(norm));
 const title=norm(c.title),author=norm(c.author),wantAuthor=norm(requested.author);
 if(!title||!titles.length)return 0;
 let s=0;for(const t of titles){
  if(t===title)s=Math.max(s,85);
  else if(t.length>6&&title.length>6&&(t.includes(title)||title.includes(t)))s=Math.max(s,52);
 }
 if(wantAuthor&&author){
  if(wantAuthor===author)s+=32;
  else if(wantAuthor.includes(author)||author.includes(wantAuthor))s+=18;
  else s-=35;
 }
 if(isbn&&ids.length&&!ids.includes(isbn))s-=45;
 if(c.lang&&c.lang===language())s+=5;
 return s;
};
const googleEntry=item=>{
 const v=item.volumeInfo||{},ids=(v.industryIdentifiers||[]).map(x=>isoISBN(x.identifier)).filter(validISBN);
 return {title:v.title||'',author:(v.authors||[]).join(', '),isbns:ids,isbn:ids.find(x=>x.length===13)||ids[0]||'',lang:v.language||'',cover:cover(v.imageLinks?.thumbnail||v.imageLinks?.smallThumbnail||''),genre:(v.categories||[])[0]||'',tags:(v.categories||[]).join(', '),publisher:v.publisher||'',pages:v.pageCount||0,year:String(v.publishedDate||'').slice(0,4),description:cleanDesc(v.description),series:v.seriesInfo?.seriesId?'':'',seriesNumber:v.seriesInfo?.bookDisplayNumber||'',source:'Google Books'};
};
const openEntry=x=>{
 const ids=(x.isbn||[]).map(isoISBN).filter(validISBN),sub=(x.subject||[]).slice(0,12),series=Array.isArray(x.series)?String(x.series[0]||''):'';
 return {title:x.title||'',author:(x.author_name||[]).join(', '),isbns:ids,isbn:ids.find(x=>x.length===13)||ids[0]||'',lang:(x.language||[]).includes(language())?language():(x.language||[])[0]||'',cover:x.cover_i?'https://covers.openlibrary.org/b/id/'+Number(x.cover_i)+'-L.jpg':'',genre:sub[0]||'',tags:sub.join(', '),publisher:(x.publisher||[])[0]||'',year:x.first_publish_year||'',pages:x.number_of_pages_median||0,description:cleanDesc(x.description),series,seriesNumber:series.match(/(?:vol(?:ume)?\.?|band|#)\s*(\d+)/i)?.[1]||'',workKey:x.key,source:'Open Library'};
};
const catalogCall=async(q)=>{
 if(window.booksupCatalog?.search)return window.booksupCatalog.search(q);
 const title=String(q.title||'').trim(),isbn=isoISBN(q.isbn);
 const urls=[
  'https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(isbn?'isbn:'+isbn:'intitle:'+title+(q.author?' inauthor:'+q.author:''))+'&maxResults=20&langRestrict='+encodeURIComponent(language()),
  'https://openlibrary.org/search.json?'+(isbn?'isbn='+encodeURIComponent(isbn):'title='+encodeURIComponent(title)+(q.author?'&author='+encodeURIComponent(q.author):''))+'&limit=25&fields=key,title,author_name,isbn,first_publish_year,cover_i,subject,publisher,language,series,number_of_pages_median'
 ];
 const r=await Promise.allSettled(urls.map(url=>fetchMetaUrl(url)));
 return {google:r[0].status==='fulfilled'?r[0].value.items||[]:[],open:r[1].status==='fulfilled'?r[1].value.docs||[]:[],errors:r.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason))};
};
const lookupLocks=new Map();
async function combined(request){
 const searches=[];
 const isbn=isoISBN(request.isbn);
 if(validISBN(isbn))searches.push({isbn,title:request.title||'',author:request.author||''});
 if(request.title)searches.push({title:request.title,author:request.author||''});
 if(request.originalTitle&&norm(request.originalTitle)!==norm(request.title))searches.push({title:request.originalTitle,author:request.author||''});
 for(const title of (request.alternativeTitles||[]).slice(0,2))if(title&&norm(title)!==norm(request.title))searches.push({title,author:request.author||''});
 if(!searches.length)return {candidates:[],suggestions:[],errors:['Kein Titel und keine ISBN vorhanden']};
 const queryKey=JSON.stringify(searches);
 if(lookupLocks.has(queryKey))return lookupLocks.get(queryKey);
 const run=(async()=>{
  const found=[],errors=[];
  // Keep traffic bounded: ISBN and exact title are enough for most books.
  for(let i=0;i<Math.min(4,searches.length);i+=2){
   const results=await Promise.allSettled(searches.slice(i,i+2).map(catalogCall));
   for(const result of results){
    if(result.status==='rejected'){errors.push(String(result.reason?.message||result.reason));continue;}
    const data=result.value||{};
    for(const x of data.google||[])found.push(googleEntry(x));
    for(const x of data.open||[])found.push(openEntry(x));
    errors.push(...(data.errors||[]));
   }
   if(i===0&&found.some(c=>scoreMatch(request,c)>=175))break;
  }
  const merged=new Map();
  for(const c of found){
   if(!c.title)continue;
   const k=norm(c.title)+'|'+norm(c.author)+(c.isbn?'|'+c.isbn:'');
   const cur=merged.get(k);if(!cur){merged.set(k,c);continue;}
   for(const field of ['cover','genre','tags','publisher','pages','year','description','series','seriesNumber','lang'])if(!cur[field]&&c[field])cur[field]=c[field];
   cur.isbns=unique([...cur.isbns,...c.isbns]);
  }
  const candidates=[...merged.values()].map(x=>({...x,score:scoreMatch(request,x)}))
   .filter(x=>x.score>=75).sort((a,b)=>b.score-a.score);
  return {candidates,suggestions:candidates.filter(x=>validISBN(x.isbn)),errors};
 })().finally(()=>lookupLocks.delete(queryKey));
 lookupLocks.set(queryKey,run);return run;
}
function fillMissing(book,results){
 const candidates=results.candidates||[],best=candidates[0];if(!best)return 0;
 const matched=candidates.filter(x=>x.score>=Math.max(85,best.score-24)),changed=[];
 const set=(k,value)=>{if((book[k]===undefined||book[k]===null||book[k]==='')&&value!==undefined&&value!==null&&value!==''){book[k]=value;changed.push(k);}};
 for(const k of ['author','publisher','year','pages','genre','tags','description','language','series','seriesNumber']){
  const val=matched.find(x=>x[k==='language'?'lang':k])?.[k==='language'?'lang':k];
  set(k,val);
 }
 const bestCover=matched.find(x=>x.cover)?.cover;
 if(bestCover&&!book.cover&&!book.covers?.length){book.covers=[bestCover];changed.push('cover');}
 const id=isoISBN(book.isbn);
 if(!id){
  const isbnCandidates=unique(matched.filter(x=>x.score>=115&&validISBN(x.isbn)).map(x=>x.isbn));
  if(isbnCandidates.length===1)set('isbn',isbnCandidates[0]);
 }
 if(changed.length){book.metadataCheckedAt=Date.now();book.metadataSources=unique(matched.map(x=>x.source));}
 return changed.length;
}
window.bu56CombinedLookup=combined;
window.bu48Lookup=async function(id,opts={}){
 const book=ownBook(id);if(!book)return null;
 try{
  const r=await combined(book),n=fillMissing(book,r);
  if(n){persist();if(['detail','libraryDetail'].includes(view))render();}
  if(!opts.silent)toast(n?n+' geprüfte Buchangaben ergänzt.':r.errors.length?'Einige Onlinequellen sind nicht erreichbar.':'Keine weiteren eindeutig passenden Angaben verfügbar.');
  return r;
 }catch(e){if(!opts.silent)toast('Buchsuche fehlgeschlagen. Vorhandene Daten bleiben erhalten.');return {candidates:[],suggestions:[],errors:[String(e.message||e)]};}
};
if(typeof autoBookMeta==='function')autoBookMeta=async function(){
 if(typeof keep==='function')keep();
 const requested={...draft},r=await combined(requested);
 if(view!=='add'||norm(draft.title)!==norm(requested.title))return;
 const n=fillMissing(draft,r);if(n)render();
 toast(n?n+' Buchangaben übernommen – weiterhin bearbeitbar.':'Keine eindeutig passenden Buchinformationen gefunden.');
};
if(typeof lookupIsbn==='function'){
 const oldIsbnLookup=lookupIsbn;
 lookupIsbn=async function(value){
  const isbn=isoISBN(value);if(!validISBN(isbn))return null;
  try{const found=await combined({isbn,title:''});const candidate=found.candidates.find(x=>x.isbns.includes(isbn));
   if(candidate)return {...candidate,isbn};
  }catch{}
  return oldIsbnLookup(isbn);
 };
}
/* Similar books: title-specific queries and a minimum semantic relevance score.
   Low-confidence candidates are hidden instead of serving generic bestseller lists. */
const pending=new Set();
const stopWords=new Set(['fiction','general','literature','book','novel','books','young','adult','author','deutsch','english','volume','manga','fantasy','roman','buch','leser','geschichte']);
function overlap(a,b){
 const x=new Set(tokens(a).filter(w=>!stopWords.has(w))),y=new Set(tokens(b).filter(w=>!stopWords.has(w)));
 return [...x].filter(w=>y.has(w)).length;
}
function relevance(book,c){
 if(norm(c.title)===norm(book.title)||!c.title)return -1;
 const a=norm(book.author),b=norm(c.author),sameAuthor=!!a&&!!b&&(a===b||a.includes(b)||b.includes(a));
 const series=norm(book.series),otherSeries=norm(c.series),sameSeries=series&&otherSeries&&series===otherSeries;
 const genre=overlap(book.genre,c.genre);
 const tag=overlap(book.tags,c.tags);
 const desc=overlap(book.description,c.description);
 let score=(sameSeries?72:0)+(sameAuthor?32:0)+Math.min(34,genre*16)+Math.min(48,tag*12)+Math.min(30,desc*4);
 if(book.language&&c.language&&book.language===c.language)score+=3;
 if(book.publisher&&c.publisher&&norm(book.publisher)===norm(c.publisher))score+=3;
 if(book.year&&c.year&&Math.abs(Number(book.year)-Number(c.year))<=6)score+=3;
 return score;
}
window.bu46SimilarLoad=async function(book){
 if(!book?.title)return;
 const key=bookKey(book);
 if(pending.has(key)||bu46SimilarCache.has(key))return;
 pending.add(key);
 try{
  const seeds=unique([String(book.genre||'').split(',')[0].trim(),...String(book.tags||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,2),book.author]).filter(s=>s.length>2).slice(0,4);
  if(!seeds.length){bu46SimilarCache.set(key,[]);return;}
  const searches=seeds.map((s,i)=>i===seeds.length-1&&norm(s)===norm(book.author)?{title:'',author:book.author}:{title:s});
  const result=await Promise.allSettled(searches.slice(0,3).map(catalogCall));
  const candidates=[];
  for(const entry of result){
   if(entry.status!=='fulfilled')continue;
   for(const g of entry.value.google||[])candidates.push(googleEntry(g));
   for(const o of entry.value.open||[])candidates.push(openEntry(o));
  }
  const seen=new Set(),ranked=candidates.map(x=>({...x,score:relevance(book,x)})).filter(x=>x.score>=25&&(!window.bu46Allowed||bu46Allowed(x)))
  .sort((a,b)=>b.score-a.score||norm(a.title).localeCompare(norm(b.title)));
  const good=[];
  for(const c of ranked){
   const k=norm(c.title)+'|'+norm(c.author);
   if(seen.has(k))continue;seen.add(k);
   good.push(c);if(good.length>=12)break;
  }
  bu46SimilarCache.set(key,good);
 }catch(e){console.warn('Similar books lookup failed:',e);bu46SimilarCache.set(key,[]);}
 finally{
  pending.delete(key);
  const node=[...document.querySelectorAll('[data-similar-key]')].find(x=>x.dataset.similarKey===key);
  if(node){const shell=document.createElement('div');shell.innerHTML=window.bu46SimilarHtml(book);node.innerHTML=shell.querySelector('[data-similar-key]')?.innerHTML||'';if(typeof bu43LoadCovers==='function')bu43LoadCovers();}
 }
};
/* MediMops alerts need an actual edition. Never invent a price when the feed is empty. */
window.bu44WatchPrompt=function(book){
 if(!book?.title)return toast('Bitte zuerst ein Buch auswählen.');
 const editions=unique([book.isbn,...(book.editions||[]).map(x=>x.isbn)].map(isoISBN).filter(validISBN));
 if(!editions.length){
  if(book.id!=null&&typeof window.bu48IsbnChooser==='function')return void window.bu48IsbnChooser(book.id,true);
  const entered=prompt('Für den Preisalarm wird die ISBN der konkreten Ausgabe benötigt.\nBitte ISBN-10 oder ISBN-13 eingeben:',book.isbn||'');
  if(entered===null)return;
  if(!validISBN(entered))return alert('Diese ISBN ist ungültig. Bitte prüfe die Ziffern oder wähle die richtige Ausgabe im Bücherregal.');
  editions.push(isoISBN(entered));if(book.id!=null){book.isbn=editions[0];persist();}
 }
 let selected=editions[0];
 if(editions.length>1){
  const response=prompt('Mehrere Ausgaben vorhanden. Gib die ISBN der Ausgabe ein, die du überwachen möchtest:\n'+editions.join('\n'),selected);
  if(response===null)return;if(!editions.includes(isoISBN(response)))return alert('Bitte eine ISBN der angezeigten Ausgaben wählen.');
  selected=isoISBN(response);
 }
 const watching=bu44Watches().some(w=>w.isbn===selected);
 if(!confirm((watching?'Preisalarm deaktivieren':'Preisalarm aktivieren')+' für „'+book.title+'“ · '+selected+'?\n\nPreise werden nur bei angeschlossener MediMops-Datenquelle angezeigt. Ohne Anbieterfeed gibt es keine automatische Preisabfrage.'))return;
 if(watching)ALL.medimopsWatches=bu44Watches().filter(w=>w.isbn!==selected);
 else bu44Watches().push({isbn:selected,title:book.title,author:book.author||'',lastPrice:null,lastChecked:null,alerts:[]});
 persist();render();toast(watching?'Preisalarm deaktiviert':'Preisalarm für die Ausgabe eingerichtet.');
};
const originalPriceScreen=window.bu44PriceNotificationsView;
window.bu44PriceNotificationsView=function(){
 const html=originalPriceScreen.apply(this,arguments);
 const last=ALL.lastPriceCheck?new Date(ALL.lastPriceCheck).toLocaleString(language()):'Keine Datenquelle geprüft';
 return html.replace('</div>','<p class="hint">Letzte Datenprüfung: '+esc(last)+'. Preisabruf bei geöffneter App; für Benachrichtigungen im Hintergrund ist ein separater Dienst erforderlich.</p><button class="chip" onclick="bu56RefreshPrices()">Preise jetzt prüfen</button></div>');
};
window.bu56RefreshPrices=async function(){
 if(navigator.onLine===false)return toast('Offline – Preisabfrage benötigt Internet.');
 ALL.lastPriceCheck=0;try{await bu44CheckWatches();toast('Preisdatenquelle geprüft. Fehlen Preise, ist kein Anbieterfeed verfügbar.');render();}
 catch(e){toast('Preisabfrage fehlgeschlagen: '+String(e.message||e));}
};
/* Saved, discardable changes in existing settings cards. The current style remains. */
const immediate=new Set(['appearance','help','updates','changelog','devices']);
let settingsSnap=null,settingsCategory='';
const clone=v=>JSON.parse(JSON.stringify(v));
function restoreSettings(){
 if(!settingsSnap)return;
 const snap=settingsSnap;
 for(const k of Object.keys(ALL))if(!(k in snap))delete ALL[k];
 for(const [k,v] of Object.entries(snap)){
  if((k==='book'||k==='manga')&&ALL[k]&&typeof ALL[k]==='object'){
   for(const old of Object.keys(ALL[k]))delete ALL[k][old];Object.assign(ALL[k],v);
  }else ALL[k]=v;
 }
 S=ALL[sp];settingsSnap=null;settingsCategory='';window.bu56SettingsDraftActive=false;
}
window.bu56SettingsSave=function(){
 if(!settingsSnap)return;
 settingsSnap=null;settingsCategory='';window.bu56SettingsDraftActive=false;
 persist();toast('Einstellungen gespeichert.');render();
};
window.bu56SettingsDiscard=function(){
 restoreSettings();toast('Ungespeicherte Änderungen verworfen.');render();
};
const oldChoose=window.nextChooseSettings;
window.nextChooseSettings=function(id){
 if(settingsSnap){
  if(JSON.stringify(ALL)!==JSON.stringify(settingsSnap)){
   const action=confirm('Ungespeicherte Änderungen verwerfen und zu einem anderen Bereich wechseln?');
   if(!action)return;
  }
  restoreSettings();
 }
 if(!immediate.has(id)){settingsSnap=clone(ALL);settingsCategory=id;window.bu56SettingsDraftActive=true;}
 oldChoose.apply(this,arguments);
};
const oldGo=window.go;
window.go=function(v,id){
 if(settingsSnap&&v!=='settingsDetail'){
  if(JSON.stringify(ALL)!==JSON.stringify(settingsSnap)&&!confirm('Ungespeicherte Einstellungen verwerfen und den Bereich verlassen?'))return;
  restoreSettings();
 }
 return oldGo.apply(this,arguments);
};
const oldSettingDetail=window.nextSettingsDetail;
window.nextSettingsDetail=function(){
 let h=oldSettingDetail.apply(this,arguments);
 if(!settingsSnap||nextSettingCategory!==settingsCategory)return h;
 const pos=h.lastIndexOf('</div>');
 if(pos<0)return h;
 const actions='<div class="bu43-ap-actions"><button class="btn" onclick="bu56SettingsSave()">✓ Änderungen speichern</button><button class="btn o" onclick="bu56SettingsDiscard()">Verwerfen</button></div>';
 return h.slice(0,pos)+actions+h.slice(pos);
};
const groupOrder=['friends','appearance','language','reading','recommendations','goodreads','currency','notifications','backup','devices','privacy','admin','navigation','updates','changelog','help'];
NEXT_SETTINGS.sort((a,b)=>{
 const ia=groupOrder.indexOf(a[0]),ib=groupOrder.indexOf(b[0]);return (ia<0?90:ia)-(ib<0?90:ib);
});
/* Reader: recover interrupted sessions, persist heartbeat and show page/total/time. */
function recoverSessions(){
 let dirty=false;
 for(const profile of [ALL.book,ALL.manga]){
  const sess=profile?.sess;if(!sess?.automatic)continue;
  const b=(profile.books||[]).find(x=>String(x.id)===String(sess.bid));
  const stop=Math.max(Number(sess.start)||Date.now(),Math.min(Date.now(),Number(sess.lastActiveAt)||Number(sess.start)||Date.now()));
  if(b){
   profile.log??=[];profile.log.push({bid:b.id,date:new Date(stop).toISOString().slice(0,10),mins:Math.max(1,Math.round((stop-Number(sess.start))/60000)),pages:Math.max(0,(Number(b.page)||0)-(Number(sess.p0)||0)),chapters:Math.max(0,(Number(b.chapter)||0)-(Number(sess.c0)||0)),automatic:true,interrupted:true});
   b.lastRead=stop;
  }
  profile.sess=null;dirty=true;
 }
 if(dirty)persist();
}
recoverSessions();
let lastSessionSave=0;
function sessionLabel(){
 if(view!=='reader'||!rdFull)return;
 const b=S.books.find(x=>String(x.id)===String(cur)),wrap=document.getElementById('rdwrap');if(!b||!wrap)return;
 let mark=wrap.querySelector('#bu56-session-status');
 if(!mark){mark=document.createElement('span');mark.id='bu56-session-status';mark.className='chip';mark.setAttribute('role','status');(wrap.querySelector('.rdtop')||wrap).appendChild(mark);}
 const pg=Number(typeof pgNow==='number'?pgNow:b.page)||1,total=Number(typeof pdfDoc!=='undefined'&&pdfDoc?.numPages||b.pages||0);
 const seconds=S.sess?.automatic?Math.max(0,Math.floor((Date.now()-S.sess.start)/1000)):0;
 mark.textContent='Seite '+pg+' von '+(total||'?')+' · '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
setInterval(()=>{
 if(view!=='reader'||!rdFull||!S.sess?.automatic)return;
 S.sess.lastActiveAt=Date.now();sessionLabel();
 if(Date.now()-lastSessionSave>10000){lastSessionSave=Date.now();persist();}
},1000);
const previousAfter=window.nextAfterRender;
window.nextAfterRender=function(){previousAfter?.apply(this,arguments);if(view==='reader'&&rdFull)sessionLabel();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.sess?.automatic){S.sess.lastActiveAt=Date.now();persist();}});
window.addEventListener('pagehide',()=>{if(S.sess?.automatic){S.sess.lastActiveAt=Date.now();persist();}});
/* Stable reattachment of text highlights after PDF text/EPUB segments rebuild. */
function restoreText(){
 const b=ownBook(cur),root=document.getElementById('txt');if(!b||!root)return;
 for(const a of b.annotations||[]){
  if(a.type!=='text-highlight'||!a.text||!a.id)continue;
  if(root.querySelector('[data-bu56-highlight="'+CSS.escape(String(a.id))+'"]'))continue;
  const quote=String(a.text).trim();if(quote.length<2)continue;
  for(const element of root.querySelectorAll('p[data-p],h3[data-p]')){
   if(Number(a.page)&&Number(element.dataset.p)!==Number(a.page))continue;
   const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),parts=[];let node,full='';
   while((node=walker.nextNode())){if(node.parentElement?.closest('mark'))continue;parts.push({node,start:full.length,end:full.length+node.textContent.length});full+=node.textContent;}
   const at=full.indexOf(quote);if(at<0)continue;
   const first=parts.find(x=>x.end>at),last=parts.find(x=>x.end>=at+quote.length);if(!first||!last)continue;
   const range=document.createRange();range.setStart(first.node,at-first.start);range.setEnd(last.node,at+quote.length-last.start);
   const mark=document.createElement('mark');mark.className='bu53-highlighted-text';mark.dataset.bu56Highlight=String(a.id);mark.style.backgroundColor=(a.color||'#ffe36a')+'88';mark.title=a.comment||'Markierung';
   try{range.surroundContents(mark);}catch{try{const fragment=range.extractContents();mark.appendChild(fragment);range.insertNode(mark);}catch{}}
   break;
  }
 }
}
const oldDraw=window.drawPg;
if(typeof oldDraw==='function')window.drawPg=async function(){const out=await oldDraw.apply(this,arguments);requestAnimationFrame(restoreText);return out;};
const oldSheet=window.nextAfterRender;
window.nextAfterRender=function(){oldSheet?.apply(this,arguments);if(view==='reader')setTimeout(restoreText,350);};
/* Extra translations for status messages introduced here; legacy dictionaries remain intact. */
const WORDS={
 'Verbunden mit:':['Connected to:','Connecté à :','Conectado a:','Connesso a:'],
 'Kein verbundenes Gerät erkannt.':['No connected device detected.','Aucun appareil connecté détecté.','No se detectó ningún dispositivo conectado.','Nessun dispositivo collegato rilevato.'],
 'Daten sicher senden':['Send data securely','Transférer les données en sécurité','Enviar datos de forma segura','Invia dati in sicurezza'],
 'Verbindung trennen':['Disconnect','Déconnecter','Desconectar','Disconnetti'],
 'Preise jetzt prüfen':['Check prices now','Vérifier les prix','Comprobar precios','Controlla i prezzi'],
 'Änderungen speichern':['Save changes','Enregistrer les modifications','Guardar cambios','Salva le modifiche'],
 'Verwerfen':['Discard','Annuler les modifications','Descartar','Annulla'],
 'Einstellungen gespeichert.':['Settings saved.','Paramètres enregistrés.','Ajustes guardados.','Impostazioni salvate.'],
 'Ungespeicherte Änderungen verworfen.':['Unsaved changes discarded.','Modifications non enregistrées annulées.','Cambios sin guardar descartados.','Modifiche non salvate annullate.'],
 'Markierung':['Highlight','Surlignage','Resaltado','Evidenziazione'],
 'Auf Updates prüfen':['Check for updates','Vérifier les mises à jour','Buscar actualizaciones','Controlla aggiornamenti'],
 'Hilfe':['Help','Aide','Ayuda','Aiuto'],
 'Datensicherung':['Backups','Sauvegardes','Copias de seguridad','Backup'],
 'Benachrichtigungen':['Notifications','Notifications','Notificaciones','Notifiche'],
 'Preisalarme':['Price alerts','Alertes de prix','Alertas de precios','Avvisi sui prezzi'],
 'Geräte verbinden':['Connect devices','Connecter les appareils','Conectar dispositivos','Connetti dispositivi'],
 'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
 'Lesesitzung':['Reading session','Session de lecture','Sesión de lectura','Sessione di lettura'],
 'Noch nicht verbunden.':['Not connected yet.','Pas encore connecté.','Aún no conectado.','Non ancora connesso.']
};
const priorTranslation=window.buTranslate;
window.buTranslate=function(t,lang){
 const p=priorTranslation?.apply(this,arguments);if(p&&p!==t)return p;
 const index={en:0,fr:1,es:2,it:3}[lang],v=WORDS[String(t||'').trim()];
 return v&&index!==undefined?v[index]:p||t;
};
})();