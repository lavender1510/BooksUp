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
  list.items=[...manual,...[...S.books,...bu45Extra()].filter(b=>(b.status==='abandoned'||b.status==='dnf')&&!excluded.has(String(b.id))).map(b=>{
   const old=previous.get(String(b.id));
   return {...old,id:old?.id||'auto-'+b.id,bookId:b.id,title:b.title,author:b.author,owned:bu45IsOwned(b),mediaFormat:old?.mediaFormat||fmt(b.mediaFormat||b.type)};
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

// The existing completion modal must clear an earlier abandoned status too.
const prevSetRate=window.setRate;
window.setRate=function(id,completed){const result=prevSetRate.apply(this,arguments);const b=currentBook(id);
 if(b?.finished){b.status='read';b.abandonedAt=null;persist();}
 return result;};

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
 const statusText=selected==='abandoned'?html.replace(/<span>(Am Lesen|Noch nicht begonnen|Gelesen)<\/span>/,'<span>Abgebrochen</span>'):html;
 return statusText.replace('</section>',group+'</section>');
};
const originalBookProgress=window.bu45ProgressBar;
window.bu45ProgressBar=function(book){
 return originalBookProgress(book)+(book?.status==='abandoned'?'<small class="bu55-abandoned">Abgebrochen</small>':'');
};
const originalStats=window.stats;
window.stats=function(){
 const html=originalStats.apply(this,arguments),n=[...S.books,...bu45Extra()].filter(b=>b.status==='abandoned'||b.status==='dnf').length;
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
const navDefault=['home','library','shelf','news','profile','settings'];
function visibleNav(){
 const candidate=Array.isArray(ALL.bu55BottomNav)?ALL.bu55BottomNav:navDefault;
 const visible=navDefault.filter(x=>candidate.includes(x));
 return visible.length?visible:navDefault;
}
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

// Scanned edition covers also need to be copied back: the legacy saveEdit method
// only persisted a fixed set of scalar fields and silently dropped editDraft.covers.
const previousEditSave=window.saveEdit;
window.saveEdit=function(id){
 if(!editDraft)return previousEditSave.apply(this,arguments);
 captureEdit();
 const cover=Array.isArray(editDraft.covers)?[...editDraft.covers]:null;
 const result=previousEditSave.apply(this,arguments);
 if(editDraft===null&&cover?.length){
  const book=currentBook(id);
  if(book){book.covers=cover;book.cover=cover[0];persist();}
 }
 return result;
};


// Goodreads imports often live in libraryBooks, not S.books. Give those edition
// records the same camera lookup without silently turning them into owned copies.
const previousLibraryDetail=window.bu45LibraryDetail;
window.bu45LibraryDetail=function(){
 const html=previousLibraryDetail.apply(this,arguments),book=currentBook(cur);
 if(!book)return html;
 const id=key(book.id);
 const indicator=book.status==='abandoned'?'Abgebrochen':book.finished?'Gelesen':'Nicht als gelesen abgeschlossen';
 const content=html.replace('<button class="btn o" onclick="bu45EditIsbn',
  '<button class="chip" onclick="bu55LibraryISBN('+id+')">▣ ISBN scannen / Ausgabe prüfen</button><button class="btn o" onclick="bu45EditIsbn');
 const statusControls='<div class="bu55-book-status"><label>Lesestatus</label><div class="row">'+
  [['read','Gelesen'],['abandoned','Abgebrochen'],['unread','Nicht abgeschlossen']].map(([code,title])=>
  '<button class="chip '+((indicator===title)?'on':'')+'" onclick="bu55SetReadStatus('+id+','+JSON.stringify(code)+')">'+title+'</button>').join('')+
  '</div></div>';
 return content.replace(/<p>(Gelesen|Nicht als gelesen abgeschlossen)<\/p>/,'<p>'+indicator+'</p>')
  .replace('</section>',statusControls+'</section>');
};
window.bu55LibraryISBN=function(id){
 const book=currentBook(id);if(!book)return;
 stopScanner();
 modal='<h3>ISBN / Ausgabe abgleichen</h3><p class="hint">Scanne die Ausgabe oder gib eine ISBN ein. Es wird nichts geändert, bis du die Vorschau bestätigst.</p>'+
 '<video id="bu55-lib-video" playsinline muted></video><label>ISBN-10 / ISBN-13</label>'+
 '<input id="bu55-lib-isbn" value="'+esc(book.isbn||'')+'" inputmode="numeric">'+
 '<p id="bu55-lib-status" class="hint"></p><div class="row">'+
 '<button class="btn" onclick="bu55ApplyLibraryISBN('+key(id)+',$(\'bu55-lib-isbn\').value)">Daten prüfen</button>'+
 '<button class="chip" onclick="bu55StopScanner();modal=null;render()">Schließen</button></div>';
 render();
 const video=document.getElementById('bu55-lib-video'),label=document.getElementById('bu55-lib-status');
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){
  if(video)video.hidden=true;if(label)label.textContent='Kamerascanner nicht verfügbar. ISBN bitte manuell eingeben.';return;
 }
 (async()=>{
  try{
   scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
   if(!video?.isConnected){stopScanner();return;}
   video.srcObject=scanStream;await video.play();
   const detector=new BarcodeDetector({formats:['ean_13','upc_a']});
   const scan=async()=>{
    if(!scanStream||!video.isConnected)return stopScanner();
    try{
     const entries=await detector.detect(video);
     const isbn=entries.map(x=>isbnClean(x.rawValue)).find(isbnValid);
     if(isbn){stopScanner();const field=document.getElementById('bu55-lib-isbn');if(field)field.value=isbn;await window.bu55ApplyLibraryISBN(id,isbn);return;}
    }catch(error){console.debug('Barcode frame:',error);}
    scanTimer=setTimeout(scan,400);
   };void scan();
  }catch(error){stopScanner();if(video)video.hidden=true;if(label)label.textContent='Kamera nicht verfügbar: '+String(error.message||error);}
 })();
};
window.bu55ApplyLibraryISBN=async function(id,raw){
 const isbn=isbnClean(raw),book=currentBook(id),status=document.getElementById('bu55-lib-status');
 if(!book)return;
 if(!isbnValid(isbn)){if(status)status.textContent='ISBN-10/13 ungültig. Prüfziffer kontrollieren.';return;}
 if(status)status.textContent='Lade Ausgabendaten …';
 try{
  const result=await Promise.race([lookupIsbn(isbn),new Promise((_,reject)=>setTimeout(()=>reject(Error('Timeout')),15000))]);
  const preview='ISBN: '+isbn+'\nTitel: '+(result?.title||book.title)+'\nVerlag: '+(result?.publisher||'nicht verfügbar')+
   '\nEinband: '+(result?.format||'nicht verfügbar')+'\nCover: '+(result?.cover?'gefunden':'nicht verfügbar')+
   '\n\nDiese Vorschläge für die Goodreads-Ausgabe speichern? Titel, Lesestatus und Leselisten bleiben erhalten.';
  if(!confirm(preview)){if(status)status.textContent='Keine Änderungen übernommen.';return;}
  book.isbn=isbn;
  if(result?.publisher)book.publisher=result.publisher;
  if(result?.format)book.format=result.format;
  if(result?.cover){book.covers=[result.cover,...(book.covers||[]).filter(c=>c!==result.cover)];book.cover=result.cover;}
  if(result?.language)book.language=result.language;
  if(result?.edition)book.edition=result.edition;
  stopScanner();modal=null;persist();render();toast('ISBN und bestätigte Ausgabendaten gespeichert.');
 }catch(error){if(status)status.textContent='Ausgabendaten konnten nicht geladen werden: '+String(error.message||error);}
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
// Recommendations are scored against the OPEN book. Never manufacture candidate genres.
const simWords=value=>new Set(String(value||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(w=>w.length>3&&!['book','novel','fiction','story','series','pages','buch','roman','geschichte','livre','libro','volume','the','with','eine','einer','über','from','their','this','that'].includes(w)));
const simOverlap=(a,b)=>{const A=simWords(a),B=simWords(b);return [...A].filter(w=>B.has(w)).length;};
const simField=v=>String(v||'').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function simScore(seed,item){
 const series=simField(seed.series),sameSeries=series&&series===simField(item.series);
 const genreMatch=simOverlap(seed.genre,item.genre),tags=simOverlap(seed.tags,item.tags);
 const topic=simOverlap(seed.description,item.description),cross=simOverlap([seed.genre,seed.tags].join(' '),[item.genre,item.tags,item.description].join(' '));
 const sameAuthor=simField(seed.author)&&simField(seed.author)===simField(item.author);
 const samePublisher=simField(seed.publisher)&&simField(seed.publisher)===simField(item.publisher);
 // Topic, author or series must independently establish relevance.
 if(!sameSeries&&!sameAuthor&&!genreMatch&&!tags&&!cross&&topic<2)return -1;
 let score=(sameSeries?60:0)+(sameAuthor?34:0)+Math.min(genreMatch,3)*23+Math.min(tags,5)*12+Math.min(cross,4)*9+Math.min(topic,5)*5;
 if(samePublisher)score+=2;
 const years=[Number.parseInt(seed.year,10),Number.parseInt(item.year,10)];
 if(years.every(Number.isFinite))score+=Math.max(0,5-Math.floor(Math.abs(years[0]-years[1])/4));
 const lang=typeof nextLanguage==='function'?nextLanguage():'de';
 if(item.language===lang)score+=4;
 return score>=21?score:-1;
}
window.bu46SimilarLoad=async function(book){
 if(!book?.title)return;
 const id=similarKey(book);
 if(similarPending.has(id)||bu46SimilarCache.has(id))return;
 similarPending.add(id);similarErrors.delete(id);
 const paint=()=>{const box=[...document.querySelectorAll('[data-similar-key]')].find(el=>el.dataset.similarKey===id);if(box){const node=document.createElement('div');node.innerHTML=window.bu46SimilarHtml(book);const replacement=node.querySelector('[data-similar-key]');if(replacement)box.innerHTML=replacement.innerHTML;bu43LoadCovers();}};
 paint();
 try{
  const withTimeout=(p,ms)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error('Zeitüberschreitung')),ms))]);
  const topics=[...simWords(book.genre+' '+book.tags)].slice(0,3);
  const primary=topics.length?'subject:'+topics.join(' '):book.author?'inauthor:'+book.author:'intitle:'+book.title;
  const raw=await Promise.allSettled([
   withTimeout(fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(primary)+'&maxResults=40'),12000),
   withTimeout(fetchMetaUrl('https://openlibrary.org/search.json?q='+encodeURIComponent([book.genre,book.tags,book.author].filter(Boolean).join(' ')||book.title)+'&fields=title,author_name,isbn,first_publish_year,cover_i,subject,language,publisher&limit=40'),12000)
  ]);
  const candidates=[];
  if(raw[0].status==='fulfilled')for(const item of raw[0].value.items||[]){
   const parsed=bu44ItemToBook(item);if(parsed)candidates.push(parsed);
  }
  if(raw[1].status==='fulfilled')for(const item of raw[1].value.docs||[])candidates.push({
   title:item.title||'',author:(item.author_name||[]).join(', '),isbn:item.isbn?.[0]||'',
   year:item.first_publish_year||'',language:item.language?.[0]||'',
   publisher:item.publisher?.[0]||'',genre:item.subject?.[0]||'',tags:(item.subject||[]).slice(0,12).join(', '),
   cover:item.cover_i?'https://covers.openlibrary.org/b/id/'+Number(item.cover_i)+'-M.jpg':''
  });
  const seen=new Set(),scored=candidates.map(b=>({b,score:simScore(book,b)})).filter(({b,score})=>{
   if(score<0||!b.title||!bu46Allowed(b))return false;
   if(simField(b.title)===simField(book.title)&&(simField(b.author)===simField(book.author)||!b.author))return false;
   const key=simField(b.title)+'|'+simField(b.author);
   if(seen.has(key))return false;seen.add(key);return true;
  });
  scored.sort((a,b)=>b.score-a.score||a.b.title.localeCompare(b.b.title));
  bu46SimilarCache.set(id,scored.slice(0,12).map(x=>x.b));
  if(raw.every(x=>x.status==='rejected'))similarErrors.set(id,'offline');
 }catch(error){similarErrors.set(id,String(error?.message||error));bu46SimilarCache.set(id,[]);}
 finally{similarPending.delete(id);paint();}
};
// Price alarms accept a verified owned edition directly; no shelf-only prerequisite.
const previousWatch=window.bu44WatchPrompt;
window.bu44WatchPrompt=function(input){
 const book=input||{};
 const raw=isbnClean(book.isbn||'');
 const editions=(book.editions||[]).map(x=>isbnClean(x.isbn||'')).filter(isbnValid);
 const chosen=isbnValid(raw)?raw:(new Set(editions).size===1?editions[0]:'');
 if(chosen)return previousWatch({...book,isbn:chosen});
 if(book.id==null){
  alert('Für diesen Preisalarm fehlt die genaue ISBN-Ausgabe. Öffne das Buch in deiner Bibliothek, um eine ISBN einzutragen oder eine Ausgabe auszuwählen.');
  return;
 }
 const match=currentBook(book.id);
 if(!match){alert('Buch nicht gefunden. Bitte die gewünschte Ausgabe zuerst in der Bibliothek öffnen.');return;}
 const manual=confirm('Dieses Buch hat noch keine eindeutige, gültige ISBN.\n\nOK: ISBN manuell ergänzen.\nAbbrechen: passende Ausgaben online suchen.');
 if(manual){
  const value=prompt('ISBN-10 oder ISBN-13 der gewünschten Ausgabe:','');
  if(value===null)return;
  const clean=isbnClean(value);
  if(!isbnValid(clean)){alert('Die ISBN ist ungültig. Bitte die ISBN inklusive Prüfziffer kontrollieren.');return;}
  match.isbn=clean;persist();return previousWatch({...match,isbn:clean});
 }
 return window.bu48IsbnChooser?.(match.id,true);
};
// Complement the existing Google Books, Open Library and DNB enrichment chain.
// Enrich only from strongly identified works; never guess ISBN or series numbers.
const metaNorm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const metaText=v=>String(v||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function metaSeries(value){
 const s=Array.isArray(value)?value[0]:value;
 const text=String(s||'').trim();
 const m=text.match(/^(.+?)[\s,]*(?:#|band\s*|volume\s*|vol\.?\s*|book\s*)(\d+(?:\.\d+)?)$/i);
 return text?{series:m?m[1].trim():text,seriesNumber:m?Number(m[2]):null}:{series:'',seriesNumber:null};
}
function metaCandidate(raw,kind){
 if(kind==='google'){
  const v=raw?.volumeInfo||{},series=metaSeries(v.seriesInfo?.volumeSeries?.[0]?.seriesId||v.series||'');
  const order=Number(v.seriesInfo?.volumeSeries?.[0]?.orderNumber);
  return {title:v.title||'',author:(v.authors||[]).join(', '),isbn:v.industryIdentifiers?.find(x=>x.type==='ISBN_13')?.identifier||'',
   genre:(v.categories||[])[0]||'',tags:(v.categories||[]).join(', '),publisher:v.publisher||'',description:metaText(v.description),language:v.language||'',
   cover:v.imageLinks?.thumbnail?.replace(/^http:/,'https:')||'',year:v.publishedDate||'',series:series.series,seriesNumber:Number.isFinite(order)&&order>0?order:series.seriesNumber,source:'Google Books'};
 }
 const series=metaSeries(raw?.series||[]);
 return {title:raw?.title||'',author:(raw?.author_name||[]).join(', '),isbn:'',genre:(raw?.subject||[])[0]||'',tags:(raw?.subject||[]).slice(0,12).join(', '),
  publisher:(raw?.publisher||[])[0]||'',language:(raw?.language||[])[0]||'',cover:raw?.cover_i?'https://covers.openlibrary.org/b/id/'+Number(raw.cover_i)+'-L.jpg':'',
  year:raw?.first_publish_year||'',series:series.series,seriesNumber:series.seriesNumber,source:'Open Library'};
}
function metaConfidence(book,candidate){
 const a=metaNorm(book.title),b=metaNorm(candidate.title),author=metaNorm(book.author),by=metaNorm(candidate.author);
 const isbn=isbnClean(book.isbn||''),matchIsbn=isbnValid(isbn)&&isbn===isbnClean(candidate.isbn||'');
 let score=matchIsbn?200:a&&a===b?92:a.length>=8&&b.length>=8&&(a.includes(b)||b.includes(a))?57:0;
 if(!score)return 0;
 if(author&&by){if(author===by)score+=25;else if(author.includes(by)||by.includes(author))score+=14;else if(!matchIsbn)score-=70;}
 if(!matchIsbn&&score<80)return 0;
 const lang=typeof nextLanguage==='function'?nextLanguage():'de';
 if(candidate.language===lang)score+=8;else if(['de','en'].includes(candidate.language))score+=3;
 return score;
}
const lookupBefore56=window.bu48Lookup;
const metaRunning=new Map();
window.bu48Lookup=async function(id,options={}){
 const book=currentBook(id);if(!book)return null;
 const token=String(id);if(metaRunning.has(token))return metaRunning.get(token);
 const task=(async()=>{
  const original=await lookupBefore56.call(this,id,options);
  if(!(book.title||book.isbn)||!window.booksupCatalog?.search||navigator.onLine===false)return original;
  if(book.description&&book.publisher&&book.genre&&book.tags&&book.covers?.length&&book.series)return original;
  const terms=[{title:book.title||'',author:book.author||'',isbn:book.isbn||''}];
  if(book.originalTitle&&metaNorm(book.originalTitle)!==metaNorm(book.title))terms.push({title:book.originalTitle,author:book.author||''});
  if(book.alternativeTitle&&metaNorm(book.alternativeTitle)!==metaNorm(book.title))terms.push({title:book.alternativeTitle,author:book.author||''});
  if(book.title&&book.author)terms.push({title:book.title});
  const unique=[...new Map(terms.filter(x=>x.title||x.isbn).map(x=>[JSON.stringify(x),x])).values()].slice(0,4);
  const calls=await Promise.allSettled(unique.map(async x=>window.booksupCatalog.search(x)));
  const rows=[];
  for(const call of calls)if(call.status==='fulfilled'){
   for(const x of call.value.google||[])rows.push(metaCandidate(x,'google'));
   for(const x of call.value.open||[])rows.push(metaCandidate(x,'open'));
  }
  const ranked=rows.map(x=>({...x,confidence:metaConfidence(book,x)})).filter(x=>x.confidence>=80).sort((a,b)=>b.confidence-a.confidence);
  const dedup=new Map();
  for(const x of ranked){
   const key=metaNorm(x.title)+'|'+metaNorm(x.author)+'|'+isbnClean(x.isbn);
   if(!dedup.has(key))dedup.set(key,x);
  }
  let changed=false;
  // Merge complementary fields from the same verified title/author, ordered by confidence.
  for(const x of dedup.values()){
   for(const f of ['description','genre','tags','publisher','year','language','series','seriesNumber']){
    if((book[f]==null||book[f]==='')&&x[f]!=null&&x[f]!==''){
     book[f]=x[f];changed=true;
    }
   }
   if(!book.cover&&!book.covers?.length&&/^https:\/\//.test(x.cover||'')){book.covers=[x.cover];changed=true;}
  }
  const editions=[...new Set([...dedup.values()].filter(x=>x.confidence>=110&&isbnValid(isbnClean(x.isbn))).map(x=>isbnClean(x.isbn)))];
  if(!book.isbn&&editions.length===1){book.isbn=editions[0];changed=true;}
  if(changed){persist();if(['detail','libraryDetail'].includes(view)&&String(cur)===token)render();}
  const candidates=[...(original?.candidates||[]),...dedup.values()];
  return {...(original||{}),candidates,errors:[...(original?.errors||[]),...calls.filter(x=>x.status==='rejected').map(x=>'Buchdaten: '+String(x.reason?.message||x.reason))]};
 })().finally(()=>metaRunning.delete(token));
 metaRunning.set(token,task);return task;
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
// Text-mode and EPUB highlights are restored after loadSeg rebuilds #txt.
function restoreTextMarks(){
 const root=document.getElementById('txt'),book=S.books.find(b=>String(b.id)===String(cur));
 if(!root||!book)return;
 for(const note of book.annotations||[]){
  if(note.type!=='text-highlight'||!note.text)continue;
  if(root.querySelector('[data-bu55-note="'+String(note.id||'').replace(/[^a-z0-9-]/gi,'')+'"]'))continue;
  const text=String(note.text).trim();
  for(const paragraph of root.querySelectorAll('p[data-p],h3[data-p]')){
   const node=[...paragraph.childNodes].find(n=>n.nodeType===3&&n.textContent.includes(text));
   if(!node)continue;
   const offset=node.textContent.indexOf(text),range=document.createRange();
   range.setStart(node,offset);range.setEnd(node,offset+text.length);
   const mark=document.createElement('mark');mark.className='bu53-highlighted-text';
   mark.dataset.bu55Note=String(note.id||'');mark.style.backgroundColor=(note.color||'#ffe36a')+'88';
   mark.title=note.comment||'Markierung auf Seite '+note.page;
   try{range.surroundContents(mark);}catch(error){console.debug('Unable to restore selection',error);}
   break;
  }
 }
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
 restoreTextMarks();
 mountPen();
}
window.bu55NoteLastHighlight=function(){
 const book=S.books.find(b=>String(b.id)===String(cur)),item=[...(book?.annotations||[])].reverse().find(x=>x.rect||x.text||x.type==='ink');
 if(!item)return toast('Bitte zuerst eine Stelle markieren.');
 const note=prompt('Notiz zur Markierung auf Seite '+(item.page||1)+':',item.comment||'');
 if(note===null)return;
 item.comment=note.slice(0,4000);persist();toast('Notiz gespeichert.');
};

// Pressure-sensitive pen strokes use normalized page coordinates, so zoom and
// re-rendering never change their location. Touch continues to scroll normally.
let penMode=false,penActive=null;
const penPage=canvas=>canvas.id==='pdfCv2'?Number(pgNow)+1:Number(canvas.closest('[data-n]')?.dataset.n||pgNow||1);
const penPoint=(canvas,event)=>{
 const r=canvas.getBoundingClientRect();
 return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/Math.max(1,r.width))),
 y:Math.max(0,Math.min(1,(event.clientY-r.top)/Math.max(1,r.height))),
 pressure:Math.max(.1,Math.min(1,Number(event.pressure)||.5))};
};
function paintPen(){
 const area=document.getElementById('rdscroll'),book=S.books.find(b=>String(b.id)===String(cur));
 if(!area||!book||view!=='reader')return;
 area.querySelectorAll('.bu55-pen-overlay').forEach(el=>el.remove());
 for(const canvas of area.querySelectorAll('canvas')){
  if(canvas.width<2||canvas.clientWidth<2)continue;
  const parent=canvas.parentElement;if(!parent)continue;
  if(getComputedStyle(parent).position==='static')parent.style.position='relative';
  const root=document.createElementNS('http://www.w3.org/2000/svg','svg');
  root.classList.add('bu55-pen-overlay');root.setAttribute('viewBox','0 0 1000 1000');
  root.setAttribute('preserveAspectRatio','none');
  Object.assign(root.style,{position:'absolute',zIndex:'6',pointerEvents:'none',left:canvas.offsetLeft+'px',
   top:canvas.offsetTop+'px',width:canvas.clientWidth+'px',height:canvas.clientHeight+'px'});
  const rows=(book.annotations||[]).filter(a=>a.type==='ink'&&Number(a.page)===penPage(canvas));
  if(penActive?.canvas===canvas)rows.push(penActive.note);
  for(const mark of rows){
   const pts=mark.points||[];if(pts.length<2)continue;
   for(let j=1;j<pts.length;j++){
    const a=pts[j-1],b=pts[j],path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M'+Math.round(a.x*1000)+' '+Math.round(a.y*1000)+' L'+Math.round(b.x*1000)+' '+Math.round(b.y*1000));
    path.setAttribute('fill','none');path.setAttribute('stroke',mark.color||'#ffe36a');
    path.setAttribute('stroke-width',String(1+3*((a.pressure||.5)+(b.pressure||.5))));
    path.setAttribute('stroke-linecap','round');root.appendChild(path);
   }
  }
  parent.appendChild(root);
 }
}
window.bu55PenToggle=function(){
 penMode=!penMode;
 const selected=document.getElementById('bu53-highlight-button');
 if(penMode&&selected?.getAttribute('aria-pressed')==='true')window.bu53HighlightToggle?.();
 const button=document.getElementById('bu55-pen-button');
 if(button){button.setAttribute('aria-pressed',String(penMode));button.classList.toggle('on',penMode);}
 toast(penMode?'Stift aktiv: Mit S-Pen auf einer Buchseite schreiben.':'Stiftmodus beendet.');
};
function mountPen(){
 const area=document.getElementById('rdscroll'),wrap=document.getElementById('rdwrap');
 if(!area||!wrap)return;
 const toolbar=wrap.querySelector('.bu55-highlight-colors')?.parentElement;
 if(toolbar&&!toolbar.querySelector('#bu55-pen-button')){
  const btn=document.createElement('button');btn.id='bu55-pen-button';btn.type='button';btn.className='chip';
  btn.textContent='✎ S-Pen';btn.setAttribute('aria-pressed',String(penMode));
  btn.addEventListener('click',window.bu55PenToggle);toolbar.appendChild(btn);
 }
 if(area.dataset.bu55Pen){paintPen();return;}
 area.dataset.bu55Pen='1';
 area.addEventListener('pointerdown',event=>{
  if(!penMode||!event.isPrimary||!['pen','mouse'].includes(event.pointerType))return;
  const canvas=event.target.closest?.('canvas');
  if(!canvas||canvas.width<2)return;
  event.preventDefault();event.stopImmediatePropagation();
  penActive={pointerId:event.pointerId,canvas,note:{id:crypto.randomUUID(),page:penPage(canvas),
   type:'ink',color:ALL.bu55HighlightColor||'#ffe36a',points:[penPoint(canvas,event)],created:Date.now()}};
  try{area.setPointerCapture(event.pointerId);}catch{}
 },true);
 area.addEventListener('pointermove',event=>{
  if(!penActive||event.pointerId!==penActive.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  penActive.note.points.push(penPoint(penActive.canvas,event));
  requestAnimationFrame(paintPen);
 },true);
 area.addEventListener('pointerup',event=>{
  if(!penActive||event.pointerId!==penActive.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  const final=penActive;penActive=null;
  if(final.note.points.length>1){
   const book=S.books.find(b=>String(b.id)===String(cur));
   if(book){book.annotations??=[];book.annotations.push(final.note);persist();toast('Handschriftliche Notiz gespeichert.');}
  }
  paintPen();
 },true);
 area.addEventListener('pointercancel',()=>{penActive=null;paintPen();},true);
 const observer=new MutationObserver(changes=>{
  if(!area.isConnected){observer.disconnect();return;}
  // The SVG overlays are our own DOM changes, not newly loaded book pages.
  const significant=changes.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>!n.classList?.contains('bu55-pen-overlay')));
  if(significant)requestAnimationFrame(paintPen);
 });
 observer.observe(area,{childList:true,subtree:true});
 paintPen();
}
const penShow=window.showPg;
if(typeof penShow==='function')window.showPg=async function(){const result=await penShow.apply(this,arguments);requestAnimationFrame(paintPen);return result;};
const penDraw=window.drawPg;
if(typeof penDraw==='function')window.drawPg=async function(){const result=await penDraw.apply(this,arguments);requestAnimationFrame(paintPen);return result;};

const oldAfter=window.nextAfterRender;
window.nextAfterRender=function(){
 oldAfter?.apply(this,arguments);
 entryControls();
 if(view==='reader'){setTimeout(readerTools,100);setTimeout(()=>{decorateHighlights();paintPen();restoreTextMarks();},450);}
};
const style=document.createElement('style');
style.textContent='.bu55-book-status,.bu55-list-controls,.bu55-import{margin:12px 0;padding:10px;border:1px solid var(--bd);border-radius:10px}.bu55-list-controls label,.bu55-book-status label,.bu55-medium{display:block;font-size:13px;margin:8px 0}.bu55-import-pages{max-height:40vh;overflow:auto}.bu55-import-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--bd)}.bu55-import-row span{min-width:0}.bu55-import-row small{display:block;color:var(--mut)}.bu55-import-row select{flex-shrink:0}.bu55-highlight-colors{display:flex;align-items:center;gap:6px;font-size:12px}#bu55-edition-video{max-width:100%;width:100%;max-height:200px;object-fit:cover;border-radius:10px;background:#111}.bu55-abandoned{color:var(--mut)}#rdwrap.full.bu55-focus .rdtop,#rdwrap.full.bu55-focus .next-reading-tools,#rdwrap.full.bu55-focus .bu47-reader-tools,#rdwrap.full.bu55-focus .bu53-zoom-toolbar{display:none!important}';
style.textContent+='html.rdlock .next-reading-tools,html.rdlock .next-reading-subtitle,html.rdlock .next-reading-bottom,html.rdlock .next-annotations,html.rdlock .next-chapters,html.rdlock #rdbar{display:none!important}';
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
