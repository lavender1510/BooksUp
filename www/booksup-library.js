/* BooksUp 4.1 – book collections, safe prices, Goodreads preview and discovery.
   Additive data fields preserve all existing BooksUp records and backup compatibility. */
let buShelfQuery='',buMulti=false,buSelected=new Set(),buCatalogIndex=-1;
let buGoodreadsRows=[],buGoodreadsHead=[],buGoodreadsShelves=[],buGoodreadsChoice=new Set();
const buSafeNumber=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(String(v).trim().replace(',','.'));return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:null};
const buCurrency=v=>v==null?'–':money(Number(v));
const buNorm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const buOwned=b=>b?.type==='physical'||b?.type==='digital';
const buHasRead=b=>!!(b?.finished||b?.read===true||b?.status==='read');
const buShelfSet=b=>new Set([...(b.folders||[]),...(b.folder?[b.folder]:[])].filter(Boolean));
function buShelfFilter(b){const q=buNorm(buShelfQuery);return !q||buNorm([b.title,b.author,b.isbn,b.series,b.tags].join(' ')).includes(q)}
function buFilterShelfLive(){buShelfQuery=$('bu-shelf-search')?.value||'';document.querySelectorAll('[data-bu-book-search]').forEach(el=>{el.hidden=!buNorm(el.dataset.buBookSearch).includes(buNorm(buShelfQuery))});const count=$('bu-results-count');if(count)count.textContent=[...document.querySelectorAll('[data-bu-book-search]')].filter(x=>!x.hidden).length+' Treffer'}
function buToggleMulti(){buMulti=!buMulti;buSelected.clear();render()}
function buSelect(id){id=Number(id);if(buSelected.has(id))buSelected.delete(id);else buSelected.add(id);document.querySelectorAll('[data-bu-selection]').forEach(el=>el.checked=buSelected.has(Number(el.dataset.buSelection)));const count=$('bu-selected-count');if(count)count.textContent=buSelected.size+' ausgewählt'}
function buSelectVisible(){document.querySelectorAll('[data-bu-book-search]:not([hidden])').forEach(el=>{const id=Number(el.dataset.buBookId);if(Number.isFinite(id))buSelected.add(id)});render()}
function buBulkDelete(){if(!buSelected.size)return toast('Keine Bücher ausgewählt');if(!confirm(buSelected.size+' Bücher wirklich löschen? Gespeicherte Lesedaten können verloren gehen.'))return;S.books=S.books.filter(b=>!buSelected.has(Number(b.id)));buSelected.clear();buMulti=false;save();toast('Bücher gelöscht')}
function buBulkFolder(){
  if(!buSelected.size)return toast('Bitte Bücher auswählen');
  const options=[...(S.folders||[])];const v=prompt('Zielordner (neu oder vorhanden):',options[0]||'');if(v===null)return;const folder=v.trim();if(!folder)return;
  if(!S.folders.includes(folder))S.folders.push(folder);
  S.books.filter(b=>buSelected.has(Number(b.id))).forEach(b=>{b.folder=folder;b.folders=[...buShelfSet(b).add(folder)]});
  buSelected.clear();buMulti=false;save();toast('Ordner zugewiesen')
}
function buShelfToolbar(){return bu44ShelfToolbar()}
function buBookCheckbox(b){return buMulti?'<label class="bu-book-pick" onclick="event.stopPropagation()"><input type="checkbox" data-bu-selection="'+Number(b.id)+'" '+(buSelected.has(Number(b.id))?'checked':'')+' onchange="buSelect('+Number(b.id)+')" aria-label="'+esc(b.title)+' auswählen"></label>':''}
function buListsData(){if(!Array.isArray(S.readingLists))S.readingLists=[];return S.readingLists}
function buNewList(){const v=prompt('Name der neuen Leseliste:', 'Möchte ich lesen');if(v===null||!v.trim())return;const name=v.trim();if(buListsData().some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast('Liste existiert bereits');buListsData().push({id:Date.now(),name,items:[],folderSync:true});save();go('lists')}
function buAddWishlist(id){const l=buListsData().find(x=>String(x.id)===String(id));if(!l)return;const title=prompt('Titel (auch wenn du das Buch nicht besitzt):');if(!title?.trim())return;const author=prompt('Autor (optional):')||'';l.items.push({id:crypto.randomUUID(),title:title.trim(),author,owned:false});save();go('lists')}
function buAddOwnedToList(listId,bookId){const l=buListsData().find(x=>String(x.id)===String(listId)),b=S.books.find(x=>String(x.id)===String(bookId));if(!l||!b)return;if(!l.items.some(x=>String(x.bookId)===String(bookId)))l.items.push({id:crypto.randomUUID(),bookId:b.id,title:b.title,author:b.author,owned:true});save();go('lists')}
function buAddToListDialog(id){const ls=buListsData();if(!ls.length){buNewList();return}modal='<h3>Zur Leseliste hinzufügen</h3>'+ls.map(l=>'<button class="next-setting-row" onclick="buAddOwnedToList('+Number(l.id)+','+Number(id)+');modal=null"><b>'+esc(l.name)+'</b></button>').join('')+'<button class="chip" onclick="modal=null;render()">Schließen</button>';render()}
function buRemoveListItem(lid,idx){const l=buListsData().find(x=>String(x.id)===String(lid));if(!l)return;l.items.splice(idx,1);save();go('lists')}
function buRemoveList(lid){if(!confirm('Leseliste löschen? Die Bücher bleiben erhalten.'))return;S.readingLists=buListsData().filter(x=>String(x.id)!==String(lid));save();go('lists')}
function buListsView(){return bar('Meine Leselisten','shelf')+'<section class="bu-lists"><header class="bu-head"><div><span class="next-overline">BOOKSUP COLLECTIONS</span><h1>Meine Leselisten</h1><p class="hint">Plane deine Bücher unabhängig davon, ob du sie schon besitzt.</p></div><button class="btn" onclick="buNewList()">+ Neue Leseliste</button></header>'+
 (buListsData().map(l=>'<div class="card bu-list-card"><div class="bu-head"><h2>'+esc(l.name)+'</h2><div><button class="chip" onclick="buAddWishlist('+Number(l.id)+')">+ Wunschbuch</button><button class="chip" onclick="buRemoveList('+Number(l.id)+')">Löschen</button></div></div>'+
 bu43ListsRules(l)+((l.items||[]).map((item,i)=>{const b=S.books.find(x=>String(x.id)===String(item.bookId));return '<div class="li"><div style="flex:1"><strong>'+esc(b?.title||item.title||'')+'</strong><small style="display:block">'+esc(b?.author||item.author||'')+(b?' · Im Besitz':' · Wunschliste')+'</small></div>'+(b?'<button class="chip" onclick="go(\'detail\','+Number(b.id)+')">Details</button>':'')+'<button class="chip" onclick="buRemoveListItem('+Number(l.id)+','+i+')">Entfernen</button></div>'}).join('')||'<p class="hint">Noch keine Bücher. Öffne ein Buch oder füge ein Wunschbuch hinzu.</p>')+'</div>').join('')||'<div class="card"><p>Noch keine Leselisten erstellt.</p></div>')+'</section>'}
function buAmountFields(mode,d){
 const pre=mode==='edit'?'ed_':'f_',v=(k)=>esc(d?.[k]??''),buy='Kaufpreis (tatsächlich bezahlt)';
 return '<div class="bu-price-fields"><label>'+buy+' ('+esc(S.currency||'€')+')</label><input id="'+pre+'purchasePrice" inputmode="decimal" type="number" step="0.01" min="0" value="'+v('purchasePrice')+'" placeholder="z. B. 5,00 gebraucht"><label>Zustand</label><select id="'+pre+'condition"><option value="new" '+((d?.condition||'new')==='new'?'selected':'')+'>Neu</option><option value="used" '+(d?.condition==='used'?'selected':'')+'>Gebraucht</option><option value="unknown" '+(d?.condition==='unknown'?'selected':'')+'>Keine Angabe</option></select></div>'
}
function buSyncPriceDraft(data,prefix){const amount=$(prefix+'purchasePrice'),condition=$(prefix+'condition');if(amount)data.purchasePrice=amount.value;if(condition)data.condition=condition.value}
function buFixExistingPrices(book){if(!book)return;book.msrp=buSafeNumber(book.msrp??book.price);if(book.purchasePrice!==undefined&&book.purchasePrice!==null&&book.purchasePrice!=='')book.purchasePrice=buSafeNumber(book.purchasePrice);else book.purchasePrice=null}
function buPriceDetails(b){
 const bought=buSafeNumber(b.purchasePrice),retail=buSafeNumber(b.msrp??b.price),prefs=ALL.priceSettings||{};
 return (prefs.showPurchase===false?'':'<div class="bu-price-summary"><div><small>Tatsächlich bezahlt</small><b>'+buCurrency(bought)+'</b></div><div><small>Zustand</small><b>'+(b.condition==='used'?'Gebraucht':b.condition==='new'?'Neu':'Nicht angegeben')+'</b></div></div>')+
 (prefs.showUVP===false?'':'<details class="bu-pricing-expand"><summary>Mehr Details · UVP / Listenpreis</summary><p>UVP (sofern verfügbar): <b>'+buCurrency(retail)+'</b></p><p class="hint">Der UVP stammt aus Buchmetadaten oder deiner eigenen Eingabe. Kaufpreis und UVP werden getrennt gespeichert.</p></details>');
}
function buSaveNote(id){const b=S.books.find(x=>Number(x.id)===Number(id)),v=$('bu-note-text');if(!b||!v?.value.trim())return;const date=Date.now();if(!Array.isArray(b.annotations))b.annotations=[];b.annotations.push({id:date,page:b.page||1,text:'',comment:v.value.trim(),createdAt:date});v.value='';save();go('detail',id)}
function buBookNotes(b){return '<div class="bu-notes"><label>Notiz zu diesem Buch</label><textarea id="bu-note-text" rows="3" placeholder="Deine Gedanken, Zitate, Rezension ..."></textarea><button class="btn o" onclick="buSaveNote('+Number(b.id)+')">Notiz speichern</button></div>'}
function buNextEligible(){
 const ordered=S.books.filter(b=>buOwned(b)&&!buHasRead(b)).filter(b=>{
  if(!b.series)return true;
  const num=parseFloat(String(b.seriesNumber||'').replace(',','.'));
  if(!Number.isFinite(num)||num<=1)return true;
  const series=S.books.filter(x=>buNorm(x.series)===buNorm(b.series)&&x.id!==b.id);
  const prior=series.filter(x=>{const n=parseFloat(String(x.seriesNumber||'').replace(',','.'));return Number.isFinite(n)&&n<num});
  return prior.length>0&&prior.every(buHasRead);
 });
 return ordered.sort((a,b)=>(b.lastRead||0)-(a.lastRead||0)||(a.added||0)-(b.added||0));
}
function buNextToReadSection(){const list=buNextEligible().slice(0,8);return '<section class="next-section"><header><h2>Was lese ich als Nächstes?</h2><button class="next-text-button" onclick="pickNext()">Überrasch mich →</button></header><p class="hint">Ungelesene Bücher aus deinem Regal. Bei Reihen haben frühere ungelesene Bände Vorrang.</p>'+
 (list.length?'<div class="next-book-rail">'+list.map(b=>'<button class="next-book-card" onclick="go(\'detail\','+Number(b.id)+')"><span class="next-cover">'+nextCover(b)+'</span><strong>'+esc(b.title)+'</strong><small>'+esc(b.series?b.series+' · Band '+(b.seriesNumber||'?'):b.author||'')+'</small></button>').join('')+'</div>':'<p class="hint">Noch keine passenden ungelesenen Bücher.</p>')+'</section>'}
function buRecIdentity(b){return String(b.isbn||'').replace(/[^\dX]/gi,'')||buNorm(b.title)+'|'+buNorm(b.author)}
function buRecs(){
 const r=S.rec||{},allOwned=[...ALL.book.books,...ALL.manga.books];
 const readSet=new Set(allOwned.filter(b=>buHasRead(b)).flatMap(b=>[buRecIdentity(b),buNorm(b.title)]));
 const ownedSet=new Set(allOwned.flatMap(b=>[buRecIdentity(b),buNorm(b.title)]));
 const wantedGenres=new Set((r.includeGenres||[]).map(buNorm)),wantedTags=new Set((r.includeTags||[]).map(buNorm)),excluded=new Set((r.exclude||[]).map(buNorm));
 const seen=new Set(),list=[];
 const source=[...(r.own===false?[]:buNextEligible().map(b=>({...b,own:1}))),...(r.cat===false?[]:[...CAT_(),...bu44ExtraRecommendations()].map(b=>({...b,own:0})))];
 for(const b of source){
  const title=buNorm(b.title),key=buRecIdentity(b),genre=buNorm(b.genre),tags=tg(b.tags).map(buNorm);
  if(!title||readSet.has(key)||readSet.has(title)||seen.has(key)||excluded.has(genre))continue;
  if(!b.own&&(ownedSet.has(key)||ownedSet.has(title)))continue;
  if(wantedGenres.size&&![...wantedGenres].some(g=>genre===g||genre.includes(g)||g.includes(genre)&&genre.length>3))continue;
  if(wantedTags.size&&!tags.some(t=>wantedTags.has(t)))continue;
  seen.add(key);list.push(b);
 }
 const sources=(r.sources||[]).map(id=>S.books.find(b=>String(b.id)===String(id))).filter(Boolean);
 const last=sources.length?sources:[...S.books].filter(b=>buHasRead(b)).slice(-4);
 const score=b=>last.filter(x=>buNorm(x.genre)===buNorm(b.genre)).length*4+last.reduce((n,x)=>n+tg(x.tags).filter(t=>tg(b.tags).includes(t)).length,0);
 const day=Math.floor(Date.now()/86400000);const tie=b=>{const v=buNorm(b.title)+'/'+day;let h=2166136261;for(let i=0;i<v.length;i++)h=Math.imul(h^v.charCodeAt(i),16777619);return(h>>>0)%500};
 list.sort((a,b)=>score(b)-score(a)||tie(a)-tie(b));
 return {list:list.slice(0,48),last};
}
function buCatalogDetails(i){buCatalogIndex=Number(i);const b=buRecs().list[buCatalogIndex];go('catalog');const isbn=bu44EditionIsbn(b?.isbn);if(isbn&&b&&!bu44WatchState(b)){const k='bu44-watch-asked-'+isbn;try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch{}setTimeout(()=>{if(view==='catalog'&&buRecs().list[buCatalogIndex]===b)bu44WatchPrompt(b)},650)}}
function buCatalogView(){
 const b=buRecs().list[buCatalogIndex];if(!b)return bar('Empfehlung','home')+'<div class="card">Empfehlung nicht mehr verfügbar.</div>';
 const isbn=esc(b.isbn||''),year=esc(b.year||''),publisher=esc(b.publisher||''),genre=esc(b.genre||'');
 return bar('Buch entdecken','home')+'<section class="next-detail"><div class="next-detail-main"><div class="next-detail-cover">'+nextCover(b)+'</div><div class="next-detail-intro"><span class="next-overline">BOOKSUP DISCOVER</span><h1>'+esc(b.title)+'</h1><p>'+esc(b.author||'')+'</p><p class="hint">'+genre+'</p><button class="btn" onclick="buCatalogAdd('+buCatalogIndex+')">Zur Bibliothek hinzufügen</button><button class="btn o" onclick="bu44WatchCatalog('+buCatalogIndex+')">🔔 MediMops-Preisalarm</button></div></div><section class="next-book-information"><h2>Über das Buch</h2><div class="next-info-grid"><div><small>Autor</small><b>'+esc(b.author||'–')+'</b></div><div><small>Jahr</small><b>'+year+'</b></div><div><small>Verlag</small><b>'+publisher+'</b></div><div><small>ISBN</small><b>'+isbn+'</b></div><div><small>Genre</small><b>'+genre+'</b></div><div><small>Reihe</small><b>'+esc(b.series||'–')+'</b></div></div><p class="hint">Weitere Angaben werden über die Online-Buchdatenbanken ergänzt, wenn sie vorhanden sind.</p><div id="bu-catalog-meta" class="hint">Online-Informationen werden geprüft …</div></section></section>';
}
function buCatalogAdd(i){const b=buRecs().list[Number(i)];if(!b)return;draft={title:b.title,author:b.author,genre:b.genre,year:b.year,publisher:b.publisher,isbn:b.isbn,series:b.series,seriesNumber:b.seriesNumber,covers:[...(b.covers||[]),...(b.cover?[b.cover]:[])].filter(Boolean)};addType='physical';view='add';render()}
async function buCatalogEnrich(){
 if(view!=='catalog')return;const b=buRecs().list[buCatalogIndex],target=$('bu-catalog-meta');if(!b||!target)return;
 try{const q=b.isbn?'isbn:'+b.isbn:'intitle:'+b.title+' inauthor:'+b.author;const j=await fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=3');const item=j.items?.[0];if(!item||view!=='catalog')return;
 const m=metadataGoogle(item.volumeInfo,item);target.innerHTML='<b>Zusätzliche Online-Daten</b><p>'+[m.publisher,m.year,m.pages?m.pages+' Seiten':'',m.language,m.tags].filter(Boolean).map(esc).join(' · ')+'</p>';
 }catch(e){target.textContent='Weitere Daten derzeit nicht verfügbar (offline oder kein Treffer).'}
}
const buCoverCache=new Map();
async function buLoadRecCovers(){
 if(view!=='home'||navigator.onLine===false)return;
 const items=[...document.querySelectorAll('[data-bu-cover-search]')].slice(0,10);
 async function load(node){
  if(!node.isConnected)return;
  const title=node.dataset.buCoverTitle,isbn=String(node.dataset.buCoverIsbn||'').replace(/\D/g,'');
  const key=isbn||buNorm(title);if(!key)return;
  let url=buCoverCache.get(key)||null;
  if(!buCoverCache.has(key)){
   if(isbn.length>=10)url='https://covers.openlibrary.org/b/isbn/'+encodeURIComponent(isbn)+'-M.jpg?default=false';
   else try{
    const r=await fetchMetaUrl('https://openlibrary.org/search.json?title='+encodeURIComponent(title)+'&limit=1&fields=cover_i');
    const cover=r.docs?.[0]?.cover_i;if(cover)url='https://covers.openlibrary.org/b/id/'+cover+'-M.jpg';
   }catch(e){}
   buCoverCache.set(key,url);
  }
  if(!url||!node.isConnected)return;
  const img=new Image();img.loading='lazy';img.alt='Cover: '+title;
  img.onload=()=>{if(node.isConnected){node.replaceChildren(img);img.className='bu-internet-cover'}};
  img.src=url;
 }
 await Promise.allSettled(items.map(load));
}
function buRatingConfig(){if(!ALL.goodreadsMapping)ALL.goodreadsMapping={1:2,2:4,3:6,4:8,5:10};return ALL.goodreadsMapping}
function buRatingScale(){return ALL.ratingScale===5?5:10}
function buRatingLabel(v){if(v==null)return '–';const scale=buRatingScale();return (scale===5?(Number(v)/2).toFixed(1):Number(v).toFixed(1))+'/'+scale}
function buRatingInput(){return '<h3>Bewertungssystem</h3><p class="hint">Intern speichert BooksUp weiterhin 0 bis 10 Punkte, damit ältere Bewertungen erhalten bleiben.</p><div class="row"><button class="chip '+(buRatingScale()===5?'on':'')+'" onclick="ALL.ratingScale=5;save()">5 Sterne</button><button class="chip '+(buRatingScale()===10?'on':'')+'" onclick="ALL.ratingScale=10;save()">10 Punkte</button></div><h3>Goodreads 5 Sterne → BooksUp 10 Punkte</h3><div class="bu-rating-mapping">'+[1,2,3,4,5].map(i=>'<label>'+i+' Goodreads ★<input type="number" min="0" max="10" step="0.5" value="'+esc(buRatingConfig()[i]??i*2)+'" onchange="ALL.goodreadsMapping['+i+']=Math.min(10,Math.max(0,Number(this.value)||0));persist()"></label>').join('')+'</div>'}
function buGoodreadsPick(){raw('.csv,text/csv',f=>{f.text().then(buGoodreadsPreview).catch(e=>toast('Goodreads-Datei konnte nicht gelesen werden: '+e.message))})}
function buGoodreadsPreview(text){
 const rows=parseCSV(text),head=rows.shift()?.map(x=>x.trim().replace(/^\uFEFF/,''))||[];
 if(!head.includes('Title')||!head.includes('Author'))return alert('Ungültiger Goodreads-CSV-Export');
 buGoodreadsRows=rows;buGoodreadsHead=head;
 const i=head.indexOf('Bookshelves'),exclusive=head.indexOf('Exclusive Shelf'),set=new Set();
 rows.forEach(r=>{[...(i>=0?(r[i]||'').split(','):[]),exclusive>=0?r[exclusive]:''].map(v=>v.trim()).filter(Boolean).forEach(x=>set.add(x))});
 buGoodreadsShelves=[...set].sort();buGoodreadsChoice=new Set(buGoodreadsShelves);
 const markup='<h3>Goodreads-Import prüfen</h3><p class="hint">'+rows.length+' Datensätze gefunden. Wähle, welche Shelves als Leselisten/Ordner übernommen werden. Nicht ausgewählte Shelves werden ignoriert statt als Tags importiert.</p><div class="bu-shelf-import">'+buGoodreadsShelves.map((s,i)=>'<label><input type="checkbox" data-goodreads-shelf="'+i+'" checked onchange="buGoodreadsToggle('+i+',this.checked)"> '+esc(s)+'</label>').join('')+'</div>'+
 '<label><input type="checkbox" id="bu-goodreads-tags" checked> Tags nur aus expliziter Tags-Spalte übernehmen</label>'+
 '<p class="hint">Bewertungszuordnung und 5-/10-Punkt-Anzeige kannst du unter Datensicherung einstellen.</p><button class="btn" onclick="buGoodreadsCommit()">Ausgewählte Shelves importieren</button> <button class="chip" onclick="modal=null;render()">Abbrechen</button>';
 modal=markup;render();
}
function buGoodreadsToggle(i,checked){const s=buGoodreadsShelves[i];if(checked)buGoodreadsChoice.add(s);else buGoodreadsChoice.delete(s)}
function buGoodreadsCommit(){
 const h=buGoodreadsHead,idx=n=>h.indexOf(n),v=(r,k)=>idx(k)<0?'':String(r[idx(k)]||'').trim();
 const addList=name=>{let l=buListsData().find(l=>l.name===name);if(!l){l={id:Date.now()+buListsData().length,name,items:[]};buListsData().push(l)}return l};
 let count=0,skipped=0;
 const keepTags=$('bu-goodreads-tags')?.checked!==false;
 for(let i=0;i<buGoodreadsRows.length;i++){
  const r=buGoodreadsRows[i],title=v(r,'Title'),author=v(r,'Author');if(!title)continue;
  const shelfNames=[...new Set([...v(r,'Bookshelves').split(','),v(r,'Exclusive Shelf')].map(x=>x.trim()).filter(Boolean))].filter(x=>buGoodreadsChoice.has(x));
  if(!shelfNames.length){skipped++;continue}
  let b=S.books.find(x=>buNorm(x.title)===buNorm(title)&&buNorm(x.author)===buNorm(author));
  const rawRate=Number(v(r,'My Rating'))||0;
  const rawIsbn=(v(r,'ISBN13')||v(r,'ISBN')).replace(/[="]/g,'').replace(/[^0-9X]/gi,'');
  if(!b){const id=Date.now()*1000+i;const shelves=shelfNames.filter(x=>!['read','to-read','currently-reading'].includes(x));
    b={id,added:Date.now()+i,type:'physical',title,author,isbn:rawIsbn,year:v(r,'Original Publication Year')||v(r,'Year Published'),publisher:v(r,'Publisher'),pages:Number(v(r,'Number of Pages'))||undefined,format:v(r,'Binding')||'',tags:keepTags?v(r,'Tags')||'':'',folder:shelves[0]||'',folders:shelves,qty:1,rating:rawRate>=1&&rawRate<=5?Number(buRatingConfig()[rawRate]??rawRate*2):null,price:null,msrp:null,purchasePrice:null,covers:rawIsbn?['https://covers.openlibrary.org/b/isbn/'+encodeURIComponent(rawIsbn)+'-L.jpg?default=false']:[]};
    if(v(r,'Exclusive Shelf')==='read'){b.finished=gqDate(v(r,'Date Read'))||gqDate(v(r,'Date Added'))||iso(Date.now());b.started=b.finished}
    else if(v(r,'Exclusive Shelf')==='currently-reading')b.started=gqDate(v(r,'Date Added'))||iso(Date.now());
    S.books.push(b);count++;
  }else {b.folders=[...new Set([...buShelfSet(b),...shelfNames])];if(!b.folder&&shelfNames.length)b.folder=shelfNames[0];skipped++}
  for(const sn of shelfNames){if(!['read','currently-reading'].includes(sn)&&!S.folders.includes(sn))S.folders.push(sn);const l=addList(sn);if(!l.items.some(x=>String(x.bookId)===String(b.id)))l.items.push({id:crypto.randomUUID(),bookId:b.id,title:b.title,author:b.author,owned:true})}
 }
 modal=null;save();toast(count+' Bücher importiert, '+skipped+' übersprungen/zugeordnet.');view='shelf';render();
}
