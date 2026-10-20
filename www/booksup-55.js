/* BooksUp 5.5 – functionality-only fixes on top of the original 5.4 presentation. */
(function(){
'use strict';
if(window.booksup55)return;
window.booksup55=true;
const key=id=>JSON.stringify(String(id)).replace(/"/g,'&quot;');
const fmt=v=>['digital','physical','both'].includes(v)?v:'both';
const fmtName=v=>({digital:'Digital',physical:'Physisch',both:'Beides'})[fmt(v)];
const scope=l=>['library','shelf','both'].includes(l?.visibility)?l.visibility:(l?.showInShelf?'both':'library');
const scopeName=v=>({library:'Nur Bibliothek',shelf:'Nur Bücherregal',both:'Bibliothek und Bücherregal'})[v]||'Nur Bibliothek';
const findList=id=>bu45AllLists().find(l=>String(l.id)===String(id));
const currentBook=id=>[...S.books,...bu45Extra()].find(b=>String(b.id)===String(id));
const label=(v,values)=>values.map(([k,n])=>'<option value="'+k+'" '+(k===v?'selected':'')+'>'+n+'</option>').join('');
const mediumOptions=[['both','Beides'],['digital','Digital'],['physical','Physisch']];

// A list's visibility is independent of ownership and a book's actual medium.
// Older lists retain their original showInShelf behavior.
window.bu55SetVisibility=function(id,value){
 const list=findList(id);if(!list||!['library','shelf','both'].includes(value))return;
 list.visibility=value;list.showInShelf=value!=='library';
 persist();render();
};
window.bu55SetListFormat=function(id,value){
 const list=findList(id);if(!list)return;
 list.mediaFormat=fmt(value);persist();render();
};
window.bu55SetEntryFormat=function(listId,itemId,value){
 const list=findList(listId),item=list?.items?.find(x=>String(x.id)===String(itemId));
 if(!item)return;
 item.mediaFormat=fmt(value);persist();render();
};
const originalShelfToggle=window.bu45ShelfToggle;
window.bu45ShelfToggle=function(id,on){const list=findList(id);if(list){list.visibility=on?'both':'library';list.showInShelf=!!on;}return originalShelfToggle.apply(this,arguments);};
const originalLibrary=window.bu45AllLibraryBooks;
window.bu45AllLibraryBooks=function(){
 const indexed=new Map();
 for(const list of bu45AllLists().filter(l=>scope(l)!=='shelf')){
  for(const item of list.items||[]){
   const b=bu45Book(item);
   const id=b.isbn?'isbn:'+String(b.isbn).replace(/[^0-9X]/gi,''):'id:'+buNorm(b.title)+'|'+buNorm(b.author);
   let row=indexed.get(id);
   if(!row){row={book:b,lists:[]};indexed.set(id,row);}
   if(!row.lists.includes(list.name))row.lists.push(list.name);
  }
 }
 return [...indexed.values()];
};
const originalShelfImports=window.bu45ShelfImports;
window.bu45ShelfImports=function(){
 // The per-list switch is authoritative; a global preview toggle must not hide it.
 const previous=ALL.bu50ShowListPreview;
 ALL.bu50ShowListPreview=true;
 try{return originalShelfImports.apply(this,arguments);}
 finally{ALL.bu50ShowListPreview=previous;}
};
const originalListSettings=window.bu45ListSettings;
window.bu45ListSettings=function(){
 const html=originalListSettings.apply(this,arguments),list=findList(cur||bu45ListSettingsId);
 if(!list)return html;
 const controls='<div class="bu55-list-controls"><label>Wo soll diese Leseliste erscheinen?</label><select onchange="bu55SetVisibility('+key(list.id)+',this.value)">'+label(scope(list),[['library','Nur Bibliothek'],['shelf','Nur Bücherregal'],['both','Beides']])+'</select>'+
 '<label>Format der Leseliste</label><select onchange="bu55SetListFormat('+key(list.id)+',this.value)">'+label(fmt(list.mediaFormat),mediumOptions)+'</select>'+
 '<p class="hint">Formate pro Buch kannst du direkt in der Leseliste individuell festlegen. Bestehende Bücher bleiben unverändert.</p></div>';
 return html.replace('<div class="row"><button class="btn o" onclick="bu45RenameList',controls+'<div class="row"><button class="btn o" onclick="bu45RenameList');
};
const oldListDetails=window.bu45ListDetails;
window.bu45ListDetails=function(){
 const html=oldListDetails.apply(this,arguments),list=findList(cur||bu45ListId);
 if(!list)return html;
 return html.replace('<div class="bu45-book-grid">','<p class="hint">Anzeige: '+scopeName(scope(list))+' · Format: '+fmtName(list.mediaFormat)+'</p><div class="bu45-book-grid">');
};
// Add medium editors to existing list cards without changing card markup, navigation or styles.
function entryControls(){
 if(view!=='listDetail')return;
 const list=findList(cur||bu45ListId);if(!list)return;
 const cards=document.querySelectorAll('.bu45-list-page .bu45-book-card');
 cards.forEach((card,i)=>{
  const item=list.items?.[i];if(!item||card.querySelector('.bu55-medium'))return;
  const group=document.createElement('label');group.className='bu55-medium';
  group.textContent='Format: ';
  const select=document.createElement('select');
  for(const [value,text] of mediumOptions){
   const option=document.createElement('option');option.value=value;option.textContent=text;option.selected=fmt(item.mediaFormat||list.mediaFormat)===value;select.appendChild(option);
  }
  select.addEventListener('change',()=>window.bu55SetEntryFormat(list.id,item.id,select.value));
  group.appendChild(select);card.appendChild(group);
 });
}
// Preserve exclusion state and per-item classification across automatic refreshes.
const refreshList=window.bu43RefreshList;
window.bu43RefreshList=function(list){
 if(!list)return;
 const previous=new Map((list.items||[]).filter(x=>x.bookId).map(x=>[String(x.bookId),x]));
 if(list.autoRule==='abandoned'){
  const excluded=new Set((list.excludedIds||[]).map(String));
  const manual=(list.items||[]).filter(x=>!x.bookId);
  list.items=[...manual,...S.books.filter(b=>(b.status==='abandoned'||b.status==='dnf')&&!excluded.has(String(b.id))).map(b=>{
   const old=previous.get(String(b.id));
   return {...old,id:old?.id||'auto-'+b.id,bookId:b.id,title:b.title,author:b.author,owned:true,mediaFormat:old?.mediaFormat||fmt(b.mediaFormat||b.type)};
  })];
  if(list.folderSync!==false)bu43SyncFolder(list);
 }else{
  refreshList.apply(this,arguments);
  if(list.autoRule==='unread')list.items=(list.items||[]).filter(x=>!x.bookId||!['abandoned','dnf'].includes(currentBook(x.bookId)?.status));
  list.items=(list.items||[]).map(item=>item.bookId&&previous.has(String(item.bookId))?{...item,mediaFormat:previous.get(String(item.bookId)).mediaFormat||item.mediaFormat}:item);
 }
 if(list.autoRule!=='manual'&&fmt(list.mediaFormat)!=='both'){
  list.items=(list.items||[]).filter(item=>{
   if(!item.bookId)return true;
   const b=currentBook(item.bookId);return fmt(item.mediaFormat||b?.mediaFormat||b?.type)===fmt(list.mediaFormat);
  });
 }
};
const rules=window.bu43ListsRules;
window.bu43ListsRules=function(list){
 return rules.apply(this,arguments).replace('<option value="', '<option value="'); // keep legacy appearance
};
// An additional automatic rule uses the existing rules selector.
const originalListSettingsWithRules=window.bu45ListSettings;
window.bu45ListSettings=function(){
 return originalListSettingsWithRules.apply(this,arguments).replace('</select><label>Wann aktualisieren?', '<option value="abandoned" '+(findList(cur||bu45ListSettingsId)?.autoRule==='abandoned'?'selected':'')+'>Abgebrochene Bücher</option></select><label>Wann aktualisieren?');
};

// Read/abandoned are mutually exclusive and persisted on the original book object.
window.bu55SetReadStatus=function(id,status){
 const book=currentBook(id);if(!book||!['read','abandoned','unread'].includes(status))return;
 if(status==='read'){
  book.status='read';book.finished=book.finished||iso(Date.now());
  book.started=book.started||book.finished;
 }else if(status==='abandoned'){
  book.status='abandoned';book.abandonedAt=iso(Date.now());book.finished=null;
 }else{book.status='unread';book.finished=null;book.abandonedAt=null;}
 for(const profile of [ALL.book,ALL.manga]){
  const old=S;S=profile;
  try{bu43ReconcileLists();}finally{S=old;}
 }
 save();
};
const originalBookDetails=window.nextBookDetails;
window.nextBookDetails=function(){
 const html=originalBookDetails.apply(this,arguments),book=currentBook(cur);
 if(!book)return html;
 const selected=book.status==='abandoned'?'abandoned':book.finished?'read':'unread';
 const group='<div class="bu55-book-status"><label>Lesestatus</label><div class="row">'+
 [['read','Gelesen'],['abandoned','Abgebrochen'],['unread','Nicht abgeschlossen']].map(([value,name])=>
 '<button class="chip '+(selected===value?'on':'')+'" onclick="bu55SetReadStatus('+key(book.id)+','+JSON.stringify(value)+')">'+name+'</button>').join('')+'</div></div>';
 return html.replace('</section>',group+'</section>');
};
const originalBookProgress=window.bu45ProgressBar;
window.bu45ProgressBar=function(book){
 return originalBookProgress(book)+(book?.status==='abandoned'?'<small class="bu55-abandoned">Abgebrochen</small>':'');
};
const originalStats=window.stats;
window.stats=function(){
 const html=originalStats.apply(this,arguments),n=S.books.filter(b=>b.status==='abandoned'||b.status==='dnf').length;
 return html+'<section class="card bu55-stat"><div class="lbl">Abgebrochene Bücher</div><span class="big">'+n+'</span></section>';
};

// Existing components, reordered only; preserve their exact original HTML.
const previousHome=window.home, previousProfileLists=window.bu45ProfileLists, previousHistory=window.bu46ReadingHistory;
window.home=function(){
 const html=previousHome.apply(this,arguments);
 if(view!=='profile')return html;
 const box=document.createElement('div');box.innerHTML=html;
 const nodes=[...box.children];
 const take=fn=>{const i=nodes.findIndex(fn);return i<0?'':nodes.splice(i,1)[0].outerHTML;};
 const heading=title=>take(el=>el.classList.contains('card')&&String(el.querySelector('.lbl')?.textContent||'').trim().startsWith(title));
 const intro=take(el=>el.classList.contains('banner'))+take(el=>el.classList.contains('avframe'))+take(el=>el.classList.contains('pad'));
 const navigation=take(el=>el.classList.contains('grid'));
 const library=heading('Bibliothek'),top=heading('Top 5'),stats=heading('Lesestatistik'),recs=heading('Empfehlungen');
 return intro+navigation+library+top+previousProfileLists()+stats+previousHistory()+recs+nodes.map(el=>el.outerHTML).join('');
};
window.bu45ProfileLists=function(){return view==='profile'?'':previousProfileLists.apply(this,arguments);};
window.bu46ReadingHistory=function(){return view==='profile'?'':previousHistory.apply(this,arguments);};

// Bottom navigation only: keep the entire desktop sidebar and profile links.
const navDefault=['home','library','shelf','profile'];
function visibleNav(){const candidate=Array.isArray(ALL.bu55BottomNav)?ALL.bu55BottomNav:navDefault;return ['home','library','shelf','news','profile','settings'].filter(x=>candidate.includes(x));}
window.bu55SetNav=function(id,enabled){
 let arr=visibleNav();
 arr=enabled?[...new Set([...arr,id])]:arr.filter(x=>x!==id);
 if(!arr.length){toast('Mindestens ein Navigationspunkt muss sichtbar bleiben.');return;}
 ALL.bu55BottomNav=arr;persist();render();
};
const originalShell=window.nextShell;
window.nextShell=function(html){
 const out=originalShell.apply(this,arguments);
 return out.replace(/(<nav class="next-bottom-nav"[^>]*>)([\s\S]*?)(<\/nav>)/,(_all,a,m,b)=>
 a+m.replace(/<button data-bu-nav="([^"]+)"[\s\S]*?<\/button>/g,(entry,id)=>visibleNav().includes(id)?entry:'')+b);
};
NEXT_SETTINGS.push(['navigation','Untere Navigation','▥','Sichtbare Bereiche festlegen']);
const oldSettingsDetail=window.nextSettingsDetail;
window.nextSettingsDetail=function(){
 if(nextSettingCategory!=='navigation')return oldSettingsDetail.apply(this,arguments);
 return bar('Untere Navigation','settings')+'<div class="next-settings-pane"><h1>Untere Navigation</h1><p class="hint">Wähle die sichtbaren Bereiche. Alle Seiten bleiben über Profil und Einstellungen erreichbar.</p>'+
 [['home','Entdecken'],['library','Bibliothek'],['shelf','Bücherregal'],['news','News'],['profile','Profil'],['settings','Einstellungen']].map(([id,name])=>
 '<label class="next-language-row"><input type="checkbox" '+(visibleNav().includes(id)?'checked':'')+' onchange="bu55SetNav('+JSON.stringify(id)+',this.checked)"> '+name+'</label>').join('')+
 '<div class="row"><button class="chip" onclick="ALL.bu55BottomNav=null;persist();render()">Standard wiederherstellen</button><button class="chip" onclick="go(\'profile\')">Zum Profil</button></div></div>';
};
// Add only missing links to the existing profile tiles, not a new navigation system.
const oldProfileHome=window.home;
window.home=function(){
 let html=oldProfileHome.apply(this,arguments);
 if(view!=='profile')return html;
 const extras=[['library','Bibliothek'],['news','News'],['settings','Einstellungen']].filter(([id])=>!visibleNav().includes(id));
 if(!extras.length)return html;
 const tiles=extras.map(([id,name])=>'<button class="tile" onclick="go('+JSON.stringify(id)+')"><div><b>'+name+'</b><br><small>Bereich öffnen</small></div></button>').join('');
 return html.replace(/(<div class="grid">)/,'$1'+tiles);
};

// Goodreads: one-click per record, paged to avoid huge import dialogs.
let importFormat=new Map(),importPage=0;
window.bu55GoodreadsFormat=i=>fmt(importFormat.get(Number(i))||'both');
window.bu55SetGoodreadsFormat=(i,v)=>{importFormat.set(Number(i),fmt(v));};
window.bu55GoodreadsAll=v=>{for(let i=0;i<buGoodreadsRows.length;i++)importFormat.set(i,fmt(v));bu55RenderGoodreadsPage();};
window.bu55RenderGoodreadsPage=function(){
 const node=document.getElementById('bu55-goodreads-page');if(!node)return;
 const start=importPage*35,rows=buGoodreadsRows.slice(start,start+35),h=buGoodreadsHead,index=n=>h.indexOf(n);
 node.innerHTML=rows.map((r,j)=>{
  const i=start+j,t=String(r[index('Title')]||''),a=String(r[index('Author')]||'');
  return '<label class="bu55-import-row"><span><b>'+esc(t)+'</b><small>'+esc(a)+'</small></span><select aria-label="Format für '+esc(t)+'" onchange="bu55SetGoodreadsFormat('+i+',this.value)">'+label(window.bu55GoodreadsFormat(i),mediumOptions)+'</select></label>';
 }).join('')||'<p class="hint">Keine Bücher auf dieser Seite.</p>';
 const page=document.getElementById('bu55-import-count');
 if(page)page.textContent='Bücher '+(start+1)+'–'+Math.min(start+35,buGoodreadsRows.length)+' von '+buGoodreadsRows.length;
};
window.bu55ImportPage=function(delta){importPage=Math.max(0,Math.min(Math.ceil(buGoodreadsRows.length/35)-1,importPage+delta));bu55RenderGoodreadsPage();};
const originalGoodreadsPreview=window.buGoodreadsPreview;
window.buGoodreadsPreview=function(text){
 importFormat=new Map();importPage=0;
 originalGoodreadsPreview.apply(this,arguments);
 if(!Array.isArray(buGoodreadsRows)||!buGoodreadsRows.length||!modal)return;
 modal+='<section class="bu55-import"><h3>Format der importierten Bücher</h3><p class="hint">Für jedes Buch einzeln wählen. Standard: Beides; auch per Schnellauswahl änderbar.</p>'+
 '<div class="row">'+mediumOptions.map(([v,name])=>'<button class="chip" onclick="bu55GoodreadsAll('+JSON.stringify(v)+')">Alle: '+name+'</button>').join('')+'</div>'+
 '<div id="bu55-goodreads-page" class="bu55-import-pages"></div><div class="row"><button class="chip" onclick="bu55ImportPage(-1)">← Vorherige</button><small id="bu55-import-count"></small><button class="chip" onclick="bu55ImportPage(1)">Nächste →</button></div></section>';
 render();bu55RenderGoodreadsPage();
};
const originalGoodreadsCommit=window.bu45GoodreadsCommit;
window.bu45GoodreadsCommit=function(){
 const head=buGoodreadsHead,at=k=>head.indexOf(k);
 const choices=buGoodreadsRows.map((row,i)=>({
  title:String(row[at('Title')]||''),author:String(row[at('Author')]||''),
  isbn:String(row[at('ISBN13')]||row[at('ISBN')]||'').replace(/[="]/g,'').replace(/[^0-9X]/gi,''),
  binding:String(row[at('Binding')]||''),tags:String(row[at('Bookshelves')]||''),mediaFormat:window.bu55GoodreadsFormat(i)
 }));
 const result=originalGoodreadsCommit.apply(this,arguments);
 for(const row of choices){
  const profile=window.bu49IsManga?.(row.title,row.tags,row.binding)?ALL.manga:ALL.book;
  const matches=[...(profile.books||[]),...(profile.libraryBooks||[])].filter(b=>row.isbn&&String(b.isbn||'').replace(/[^0-9X]/gi,'')===row.isbn||buNorm(b.title)===buNorm(row.title)&&buNorm(b.author)===buNorm(row.author));
  for(const book of matches){
   book.mediaFormat=row.mediaFormat;
   for(const list of profile.readingLists||[])for(const item of list.items||[])if(String(item.bookId)===String(book.id))item.mediaFormat=row.mediaFormat;
  }
 }
 persist();return result;
};

// A failed recommendation fetch must never leave a perpetual loading view.
const similarPending=new Set(),similarErrors=new Map();
const similarKey=b=>buNorm(String(b?.title||'')+' '+String(b?.author||''));
window.bu46SimilarHtml=function(book){
 if(!book?.title)return '';
 const id=similarKey(book),books=bu46SimilarCache.get(id),pending=similarPending.has(id);
 const body=books?.length?books.map((b,i)=>'<button class="bu46-similar-card" onclick="bu46SimilarOpen('+JSON.stringify(id)+','+i+')"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title)+'</b><small>'+esc(b.author||'')+'</small></button>').join(''):
 '<p class="hint">'+(pending?'Ähnliche Bücher werden geladen …':similarErrors.has(id)?'Ähnliche Bücher konnten nicht geladen werden.':'Keine ähnlichen Bücher gefunden.')+'</p>'+
 (!pending?'<button class="chip" onclick="bu55RetrySimilar('+JSON.stringify(id)+')">Erneut suchen</button>':'');
 return '<section class="bu46-similar"><div class="bu45-pagehead"><div><h2>Ähnliche Bücher</h2><p class="hint">Weitere Geschichten zu passenden Genres, Themen und Autoren.</p></div></div><div class="bu46-similar-grid" data-similar-key="'+esc(id)+'">'+body+'</div></section>';
};
window.bu55RetrySimilar=function(id){
 const book=window.bu46ActiveDetailBook?.();
 if(!book||similarKey(book)!==id)return;
 bu46SimilarCache.delete(id);similarErrors.delete(id);void window.bu46SimilarLoad(book);
};
window.bu46SimilarLoad=async function(book){
 if(!book?.title)return;
 const id=similarKey(book);
 if(similarPending.has(id)||bu46SimilarCache.has(id))return;
 similarPending.add(id);
 const paint=()=>{const box=[...document.querySelectorAll('[data-similar-key]')].find(el=>el.dataset.similarKey===id);if(box){const node=document.createElement('div');node.innerHTML=window.bu46SimilarHtml(book);const replacement=node.querySelector('[data-similar-key]');if(replacement)box.innerHTML=replacement.innerHTML;bu43LoadCovers();}};
 paint();
 const withTimeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('Timeout nach '+ms/1000+' Sekunden')),ms))]);
 const query=book.genre?'subject:'+book.genre:book.author?'inauthor:'+book.author:book.title;
 const results=await Promise.allSettled([
  withTimeout(fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(query)+'&maxResults=25'),12000),
  withTimeout(fetchMetaUrl('https://openlibrary.org/search.json?q='+encodeURIComponent(book.genre||book.author||book.title)+'&limit=25'),12000)
 ]);
 const seen=new Set(),list=[];
 function accept(b){
  if(!b?.title||buNorm(b.title)===buNorm(book.title)||!bu46Allowed(b))return;
  const k=String(b.isbn||'')||buNorm(b.title)+'|'+buNorm(b.author);
  if(seen.has(k))return;seen.add(k);list.push(b);
 }
 try{
  if(results[0].status==='fulfilled')for(const raw of results[0].value.items||[])accept(bu44ItemToBook(raw));
  if(results[1].status==='fulfilled')for(const raw of results[1].value.docs||[])accept({
   title:raw.title,author:raw.author_name?.join(', ')||'',isbn:raw.isbn?.[0]||'',year:raw.first_publish_year||'',
   cover:raw.cover_i?'https://covers.openlibrary.org/b/id/'+raw.cover_i+'-M.jpg':'',genre:book.genre||''
  });
  if(results.every(r=>r.status==='rejected'))similarErrors.set(id,'offline');
  bu46SimilarCache.set(id,list.slice(0,12));
 }finally{similarPending.delete(id);paint();}
};
// Discover is an existing screen; clicking its CTA must navigate even if catalog APIs are absent.
window.bu46MoreBooks=function(){bu46SearchTerm='';bu46SearchResults=[];go('discoverSearch');};

// ISBN editing uses the existing lookupIsbn and the original editDraft, not another data model.
let scanStream=null,scanTimer=null;
function stopScanner(){
 if(scanTimer){clearTimeout(scanTimer);scanTimer=null;}
 if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null;}
}
window.bu55StopScanner=stopScanner;
const oldDrawEdit=window.drawEditBook;
window.drawEditBook=function(){
 oldDrawEdit.apply(this,arguments);
 const target=document.getElementById('ed_isbn');
 if(!target||document.getElementById('bu55-edition-scanner'))return;
 target.insertAdjacentHTML('afterend','<div id="bu55-edition-scanner"><button type="button" class="chip" onclick="bu55OpenEditionScanner()">▣ ISBN scannen / Ausgabe korrigieren</button><div id="bu55-edition-scan-area"></div></div>');
};
window.bu55OpenEditionScanner=async function(){
 captureEdit();
 const node=document.getElementById('bu55-edition-scan-area');if(!node)return;
 stopScanner();
 node.innerHTML='<p class="hint">ISBN-13 scannen oder ISBN-10 manuell eingeben. Metadaten werden erst nach Bestätigung übernommen.</p>'+
 '<video id="bu55-edition-video" playsinline muted></video>'+
 '<div class="row"><input id="bu55-edition-isbn" inputmode="numeric" placeholder="ISBN-10 / ISBN-13">'+
 '<button class="chip" onclick="bu55LookupEdition($(\'bu55-edition-isbn\').value)">Prüfen</button>'+
 '<button class="chip" onclick="bu55StopScanner()">Kamera stoppen</button></div><p class="hint" id="bu55-edition-status"></p>';
 const video=document.getElementById('bu55-edition-video');
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){
  video.hidden=true;node.querySelector('#bu55-edition-status').textContent='Automatischer Kamerascan wird hier nicht unterstützt. ISBN bitte eingeben.';return;
 }
 try{
  scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
  video.srcObject=scanStream;await video.play();
  const detector=new BarcodeDetector({formats:['ean_13','upc_a']});
  const read=async()=>{
   if(!scanStream||!video.isConnected)return stopScanner();
   try{
    const codes=await detector.detect(video);
    const hit=codes.map(x=>isbnClean(x.rawValue)).find(isbnValid);
    if(hit){document.getElementById('bu55-edition-isbn').value=hit;stopScanner();await window.bu55LookupEdition(hit);return;}
   }catch(error){console.debug('ISBN scan frame:',error);}
   scanTimer=setTimeout(read,400);
  };
  void read();
 }catch(error){
  stopScanner();video.hidden=true;
  const status=document.getElementById('bu55-edition-status');if(status)status.textContent='Kamera nicht verfügbar: '+error.message+'. ISBN manuell eingeben.';
 }
};
window.bu55LookupEdition=async function(raw){
 const isbn=isbnClean(raw),status=document.getElementById('bu55-edition-status');
 if(!isbnValid(isbn)){if(status)status.textContent='ISBN ungültig (Prüfziffer prüfen).';return;}
 if(status)status.textContent='Suche Cover, Verlag und Ausgabe …';
 try{
  const result=await Promise.race([lookupIsbn(isbn),new Promise((_,reject)=>setTimeout(()=>reject(Error('Buchdaten-Abfrage hat zu lange gedauert.')),16000))]);
  if(!result){if(status)status.textContent='Keine Metadaten gefunden. Die ISBN kann trotzdem manuell eingegeben werden.';return;}
  const details='ISBN: '+isbn+'\nTitel: '+(result.title||'unbekannt')+'\nVerlag: '+(result.publisher||'keine Angabe')+
   '\nEinband: '+(result.format||'nicht bekannt')+'\nCover: '+(result.cover?'gefunden':'nicht gefunden')+
   '\n\nDiese Angaben für das Buch vorschlagen? Andere Felder und Lesedaten bleiben erhalten.';
  if(!confirm(details)){if(status)status.textContent='Änderungen nicht übernommen.';return;}
  captureEdit();editDraft.isbn=isbn;
  if(result.publisher)editDraft.publisher=result.publisher;
  if(result.format)editDraft.format=result.format;
  if(result.cover)editDraft.covers=[result.cover,...(editDraft.covers||[]).filter(x=>x!==result.cover)];
  if(editDraft.type==='physical'){
   editDraft.editions??=[];
   if(!editDraft.editions.length)editDraft.editions.push({qty:1,format:'Paperback'});
   editDraft.editions[0].isbn=isbn;
   if(result.format)editDraft.editions[0].format=result.format;
   if(result.cover)editDraft.editions[0].cover=result.cover;
  }
  stopScanner();drawEditBook();toast('Ausgabe vorgeschlagen. Mit „Änderungen speichern“ bestätigen.');
 }catch(error){if(status)status.textContent='ISBN-Abfrage fehlgeschlagen: '+String(error.message||error);}
};
const oldGo=window.go;
window.go=function(){stopScanner();return oldGo.apply(this,arguments);};

// Reader highlighting: nine persistent colors without replacing PDF/EPUB rendering.
const colors=[['Rot','#ff5353'],['Pink','#ff64ba'],['Blau','#507af9'],['Hellblau','#85d7fa'],['Grün','#39af76'],['Hellgrün','#a5e7a6'],['Gelb','#ffe36a'],['Orange','#ffb14f'],['Lila','#aa83eb']];
window.bu55HighlightColor=function(value){if(colors.some(x=>x[1]===value)){ALL.bu55HighlightColor=value;persist();}};
function decorateHighlights(){
 document.querySelectorAll('#rdscroll .bu53-highlight').forEach(el=>{
  const b=S.books.find(x=>String(x.id)===String(cur));if(!b)return;
  const page=Number(el.title?.match(/Seite (\d+)/)?.[1]||pgNow||b.page||1);
  const row=(b.annotations||[]).filter(x=>Number(x.page)===page&&x.rect);
  // Old highlights keep the original yellow until explicitly changed.
  const index=[...el.parentElement.querySelectorAll('.bu53-highlight')].indexOf(el);
  const color=row[index]?.color;
  if(color)el.style.background=color+'66';
 });
}
function readerTools(){
 if(view!=='reader')return;
 const holder=document.getElementById('rdwrap'),target=holder?.querySelector('.bu53-zoom-toolbar')||holder?.querySelector('.bu47-reader-tools')||holder?.querySelector('.rdtop');
 if(!target)return;
 if(!holder.querySelector('.bu55-highlight-colors')){
  const palette=document.createElement('label');palette.className='bu55-highlight-colors';palette.textContent='Farbe ';
  const select=document.createElement('select');select.setAttribute('aria-label','Markierungsfarbe');
  colors.forEach(([name,hex])=>{const option=document.createElement('option');option.value=hex;option.textContent=name;option.selected=(ALL.bu55HighlightColor||'#ffe36a')===hex;select.appendChild(option);});
  select.addEventListener('change',()=>window.bu55HighlightColor(select.value));palette.appendChild(select);target.appendChild(palette);
  const note=document.createElement('button');note.className='chip';note.textContent='Notiz zur Markierung';note.onclick=window.bu55NoteLastHighlight;target.appendChild(note);
 }
 decorateHighlights();
}
window.bu55NoteLastHighlight=function(){
 const book=S.books.find(b=>String(b.id)===String(cur)),item=[...(book?.annotations||[])].reverse().find(x=>x.rect||x.text||x.type==='ink');
 if(!item)return toast('Bitte zuerst eine Stelle markieren.');
 const note=prompt('Notiz zur Markierung auf Seite '+(item.page||1)+':',item.comment||'');
 if(note===null)return;
 item.comment=note.slice(0,4000);persist();toast('Notiz gespeichert.');
};
const oldAfter=window.nextAfterRender;
window.nextAfterRender=function(){
 oldAfter?.apply(this,arguments);
 entryControls();
 if(view==='reader'){setTimeout(readerTools,100);setTimeout(decorateHighlights,450);}
};
const style=document.createElement('style');
style.textContent='.bu55-book-status,.bu55-list-controls,.bu55-import{margin:12px 0;padding:10px;border:1px solid var(--bd);border-radius:10px}.bu55-list-controls label,.bu55-book-status label,.bu55-medium{display:block;font-size:13px;margin:8px 0}.bu55-import-pages{max-height:40vh;overflow:auto}.bu55-import-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--bd)}.bu55-import-row span{min-width:0}.bu55-import-row small{display:block;color:var(--mut)}.bu55-import-row select{flex-shrink:0}.bu55-highlight-colors{display:flex;align-items:center;gap:6px;font-size:12px}#bu55-edition-video{max-width:100%;width:100%;max-height:200px;object-fit:cover;border-radius:10px;background:#111}.bu55-abandoned{color:var(--mut)}#rdwrap.full.bu55-focus .rdtop,#rdwrap.full.bu55-focus .next-reading-tools,#rdwrap.full.bu55-focus .bu47-reader-tools,#rdwrap.full.bu55-focus .bu53-zoom-toolbar{display:none!important}';
document.head.appendChild(style);
setTimeout(()=>{const pending=localStorage.getItem('booksup-update-pending');if(pending&&pending===APP_VERSION){localStorage.removeItem('booksup-update-pending');toast('BooksUp '+APP_VERSION+' wurde erfolgreich installiert.');}},2000);
const oldFull=window.toggleFull;
window.toggleFull=function(){
 const entering=!rdFull;oldFull.apply(this,arguments);
 const wrap=document.getElementById('rdwrap');if(wrap)wrap.classList.toggle('bu55-focus',rdFull);
 if(entering&&wrap?.requestFullscreen)void wrap.requestFullscreen().catch(()=>{});
 else if(!entering&&document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&rdFull){const wrap=document.getElementById('rdwrap');wrap?.classList.remove('bu55-focus');}});
document.addEventListener('dblclick',e=>{if(rdFull&&e.target.closest('#rdwrap'))toggleFull();});
})();
