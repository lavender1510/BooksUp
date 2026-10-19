/* BooksUp 4.9 – shared Android and Windows features. No external JS dependencies. */
(function(){
'use strict';
const q = value => esc(String(value ?? ''));
const dateText = value => {try {const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('de-DE')}catch{return '';}};
const findNews = key => [...buNewsArticles,...Object.values(ALL.bu49NewsSaved||{})].find(a=>String(a.url||'')===String(key));
const savedNews = () => {if(!ALL.bu49NewsSaved || typeof ALL.bu49NewsSaved!=='object')ALL.bu49NewsSaved={};return ALL.bu49NewsSaved;};
const newsKey = item => String(item?.url||'').trim();
let newsTab = 'all';
window.bu49NewsTab = tab => {newsTab=tab==='saved'?'saved':'all';render();};
window.bu49SaveNews = index => {
 const a=buNewsArticles[Number(index)];if(!a || !/^https:\/\//i.test(a.url||''))return;
 const store=savedNews(),key=newsKey(a);
 if(store[key])delete store[key];else store[key]={...a,savedAt:Date.now()};
 persist();render();
};
window.bu49UnsaveNews = key => {delete savedNews()[key];persist();render()};
window.bu49OpenArticle = key => {
 const a=findNews(key);
 if(!a)return toast('Der Artikel wurde nicht gefunden.');
 const image=/^https:\/\//i.test(a.image||'')?'<img class="bu49-article-cover" src="'+q(a.image)+'" alt="" onerror="this.remove()">':'';
 const summary=q(a.summary||a.description||'Für diese Meldung liegt noch kein Textauszug vor.');
 const details=String(a.content||a.body||'').trim();
 // Publishers only provide excerpts through the feed; never label them as a full licensed article.
 modal='<section class="bu49-article">'+image+'<div class="bu49-article-body"><span class="next-overline">'+q(a.source||'News')+' · '+q(dateText(a.date))+'</span><h2>'+q(a.title)+'</h2><p>'+summary+'</p>'+(details?'<div class="bu49-article-text">'+q(details)+'</div>':'<p class="hint">Das ist die in BooksUp verfügbare Zusammenfassung. Den vollständigen Originalartikel kannst du über die Quelle lesen.</p>')+
 '<div class="bu49-article-actions"><button class="btn" onclick="bu49OpenOriginal('+JSON.stringify(newsKey(a)).replace(/"/g,'&quot;')+')">Original im Browser ↗</button><button class="chip" onclick="modal=null;render()">Schließen</button></div></div></section>';
 render();
};
window.bu49OpenOriginal = key => {
 const a=findNews(key),url=String(a?.url||'');
 if(!/^https:\/\//i.test(url))return;
 if(window.Capacitor?.Plugins?.Browser?.open)void window.Capacitor.Plugins.Browser.open({url}).catch(()=>window.open(url,'_blank','noopener,noreferrer'));
 else window.open(url,'_blank','noopener,noreferrer');
};
function newsCard(item,i,isSaved){
 const key=newsKey(item),safeKey=JSON.stringify(key).replace(/"/g,'&quot;');
 const marked=!!savedNews()[key],src=String(item.image||'');
 const preview=/^https:\/\//i.test(src)?'<img class="bu-news-img" src="'+q(src)+'" alt="" loading="lazy" onerror="this.remove()">':'<div class="bu-news-image-fallback">BOOKSUP ✦</div>';
 const title=q(item.title||'News'),meta=q(item.source||'')+' · '+q(dateText(item.date));
 return '<article class="bu-news-card bu49-news-card">'+
 '<button class="bu49-card-open" onclick="bu49OpenArticle('+safeKey+')" aria-label="In BooksUp lesen: '+title+'">'+preview+'<div class="bu-news-content"><span class="bu-news-meta">'+meta+'</span><h2>'+title+'</h2><p>'+q(item.summary||'')+'</p></div></button>'+
 '<div class="bu49-news-actions">'+(isSaved?
 '<button class="chip" onclick="bu49UnsaveNews('+safeKey+')">♥ Favorit entfernen</button>':
 '<button class="chip" onclick="bu49SaveNews('+i+')">'+(marked?'♥ Favorisiert':'♡ Favorisieren')+'</button>')+
 '<button class="chip" onclick="bu49OpenOriginal('+safeKey+')">Original ↗</button></div></article>';
}
window.buNewsView = function(){
 const all=buNewsArticles;
 const saved=Object.values(savedNews()).sort((a,b)=>Number(b.savedAt||0)-Number(a.savedAt||0));
 const onlySaved=newsTab==='saved';
 const entries=onlySaved?saved:all;
 return '<section class="bu-news bu49-news"><header class="bu-news-header"><div><span class="next-overline">BOOKSUP / NEWS</span><h1>News</h1><p class="hint">Lies Zusammenfassungen direkt in BooksUp oder öffne die Originalquelle im Browser.</p></div><button class="chip" onclick="buLoadNews(true)">↻ Aktualisieren</button></header>'+
 '<div class="bu49-news-tabs" role="group" aria-label="News filtern"><button class="chip '+(!onlySaved?'on':'')+'" onclick="bu49NewsTab(\'all\')">Alle Artikel ('+all.length+')</button><button class="chip '+(onlySaved?'on':'')+'" onclick="bu49NewsTab(\'saved\')">♥ Favoriten ('+saved.length+')</button></div>'+
 (entries.length?'<div class="bu-news-grid">'+entries.map((a,i)=>newsCard(a,i,onlySaved)).join('')+'</div>':
 '<div class="card"><p>'+(onlySaved?'Noch keine News favorisiert.':'Keine News geladen. Verbinde dich mit dem Internet und aktualisiere die Meldungen.')+'</p></div>')+'</section>';
};
// Selected items are already tracked by buSelected; make the actions visible without opening ⋯.
const oldShelfToolbar=window.bu44ShelfToolbar;
window.bu44ShelfToolbar=function(){
 const html=oldShelfToolbar();
 const actions='<div class="bu49-shelf-actions"><button class="chip '+(buMulti?'on':'')+'" onclick="buToggleMulti()">'+(buMulti?'✕ Auswahl beenden':'☑ Bücher auswählen')+'</button>'+
 (buMulti?'<span class="bu49-selected" id="bu49-selected-count">'+buSelected.size+' ausgewählt</span>'+
 '<button class="btn o" onclick="buBulkFolder()" '+(buSelected.size?'':'disabled')+'>In Ordner</button><button class="btn bu49-danger" onclick="buBulkDelete()" '+(buSelected.size?'':'disabled')+'>Ausgewählte löschen</button>':'')+'</div>';
 return html+actions;
};
const oldSelect=window.buSelect;
window.buSelect=function(id){oldSelect(id);const el=document.getElementById('bu49-selected-count');if(el)el.textContent=buSelected.size+' ausgewählt';
 document.querySelectorAll('.bu49-shelf-actions button').forEach(btn=>{if(/löschen|Ordner/i.test(btn.textContent))btn.disabled=!buSelected.size;});};
const priorShelf=window.shelf;
window.shelf=function(){
 const html=priorShelf();
 return html.replace(/(<button class="detail-btn" onclick="event\.stopPropagation\(\);shelfCancel\(\);bookM\((\d+)\)">Details \/ Bearbeiten<\/button>)/g,
  (_,original,id)=>original+'<button class="bu49-shelf-delete" onclick="event.stopPropagation();bu49DeleteBook('+id+')">🗑 Entfernen</button>');
};
window.bu49DeleteBook=id=>{
 const b=S.books.find(x=>String(x.id)===String(id));if(!b)return;
 if(!confirm('„'+b.title+'“ wirklich aus dem Bücherregal löschen? Die zugehörigen Leselisten-Einträge bleiben bestehen.'))return;
 S.books=S.books.filter(x=>String(x.id)!==String(id));
 for(const p of [ALL.book,ALL.manga])for(const l of p.readingLists||[])for(const item of l.items||[])if(String(item.bookId)===String(id))item.owned=false;
 buSelected.delete(Number(id));modal=null;save();toast('Buch aus dem Regal gelöscht.');
};
const originalBulk=window.buBulkDelete;
window.buBulkDelete=function(){
 if(!buSelected.size)return toast('Wähle zuerst Bücher aus.');
 const ids=new Set(buSelected),n=ids.size;
 if(!confirm(n+' ausgewählte Bücher wirklich aus dem Bücherregal löschen? Die Leselisten bleiben erhalten.'))return;
 S.books=S.books.filter(b=>!ids.has(Number(b.id)));
 for(const profile of [ALL.book,ALL.manga])for(const list of profile.readingLists||[])for(const item of list.items||[])if(ids.has(Number(item.bookId)))item.owned=false;
 buSelected.clear();buMulti=false;save();toast(n+' Bücher aus dem Regal gelöscht.');
};
// Show both current and historical platform updates. Platform notes are factual, not marketing text.
const timeline=[
 ['4.9.0','Android & Windows','Regal-Löschen, News-Lesemodus, Favoriten, Goodreads-Erkennung und Android-Layout.'],
 ['4.8.0-android.1','Android','Leselisten-Sicherheit, Theme-Kombinationen, ISBN-Suche und mobile Reader-Notizen.'],
 ['4.8.0','Windows','Leselisten-Kacheln, Profil-Reihenfolge, Design und Metadatensuche.'],
 ['4.7.0','Windows','Leseanalyse, Reader, Dateiauswahl und Changelog.'],
 ['4.6.0','Android & Windows','Bibliothek, Backups, ISBN-Recherche und Empfehlungen.'],
 ['4.5.0','Android & Windows','Leselisten und Bibliothek, Geräte-Backups.'],
 ['4.4.0','Android & Windows','Online-Cover, PDF-Anzeige und Reader-Zoom.'],
 ['4.3.0','Android & Windows','Darstellung, Profile und Sammlungen.'],
 ['4.2.0','Android & Windows','News und Übersetzungen.'],
 ['4.1.0','Android & Windows','Regal, Goodreads-Import und Preisfelder.'],
 ['4.0.0','Android & Windows','Umfangreiches Design- und Funktionsupdate.']
];
window.bu49ChangelogView=function(){
 return bar('Änderungsverlauf','settings')+'<section class="bu49-changelog"><span class="next-overline">BOOKSUP / RELEASE HISTORY</span><h1>Alle BooksUp-Updates</h1><p class="hint">Android- und Windows-Versionen, einschließlich Testreleases. Weitere Details findest du im offiziellen GitHub-Changelog.</p>'+
 timeline.map(([v,p,d])=>'<article class="bu49-version"><small>'+q(p)+'</small><h2>BooksUp '+q(v)+'</h2><p>'+q(d)+'</p></article>').join('')+
 '<p class="hint"><a href="https://github.com/lavender1510/BooksUp/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Ausführliches Changelog auf GitHub ↗</a></p></section>';
};
function installChangelog(){
 const previous=window.nextSettingsDetail;
 if(typeof previous==='function'&&!previous.bu49Wrapped){
  const next=function(){if(nextSettingCategory==='changelog')return window.bu49ChangelogView();return previous.apply(this,arguments)};
  next.bu49Wrapped=true;window.nextSettingsDetail=next;
 }
 if(Array.isArray(NEXT_SETTINGS)&&!NEXT_SETTINGS.some(x=>x[0]==='changelog'))NEXT_SETTINGS.push(['changelog','Änderungsverlauf','↺','Alle Updates für Android und Windows']);
}
// Unifies Goodreads manga/regular-books profile routing; ambiguous records remain regular books.
const mangaWords=/\b(manga|manhwa|manhua|graphic\s*novel|graphic\s*novels|comics?|webtoon|tank[oō]bon|seinen|shonen|shounen|shojo|shoujo)\b/i;
const famousManga=/^(one piece|naruto|bleach|attack on titan|chainsaw man|jujutsu kaisen|demon slayer|death note|my hero academia|berserk|tokyo ghoul)(?:\s|:|$)/i;
window.bu49IsManga=(title,tag,binding)=>mangaWords.test([tag,binding].join(' '))||famousManga.test(String(title||'').trim());
window.bu45GoodreadsCommit=function(){
 const head=buGoodreadsHead,index=k=>head.indexOf(k),get=(row,k)=>index(k)<0?'':String(row[index(k)]||'').trim();
 const includeTags=document.getElementById('bu-goodreads-tags')?.checked!==false;
 const accepted=new Set(buGoodreadsChoice);
 let imported=0,linked=0,mangaCount=0,bookCount=0;
 for(let i=0;i<buGoodreadsRows.length;i++){
  const row=buGoodreadsRows[i],title=get(row,'Title'),author=get(row,'Author');if(!title)continue;
  const shelves=[...new Set([...get(row,'Bookshelves').split(','),get(row,'Exclusive Shelf')].map(x=>x.trim()).filter(Boolean))].filter(x=>accepted.has(x));
  if(!shelves.length)continue;
  const tags=[get(row,'Tags'),get(row,'Bookshelves'),get(row,'Exclusive Shelf'),get(row,'Binding')].join(' ');
  const manga=window.bu49IsManga(title,tags,get(row,'Binding'));
  const profile=manga?ALL.manga:ALL.book;
  if(manga)mangaCount++;else bookCount++;
  profile.readingLists??=[];profile.libraryBooks??=[];
  const isbn=(get(row,'ISBN13')||get(row,'ISBN')).replace(/[="]/g,'').replace(/[^0-9X]/gi,'');
  const normalized=buNorm(title)+'|'+buNorm(author);
  const owns=(profile.books||[]).find(x=>(isbn&&x.isbn===isbn)||(buNorm(x.title)+'|'+buNorm(x.author)===normalized));
  let b=owns||[...profile.libraryBooks].find(x=>(isbn&&x.isbn===isbn)||(buNorm(x.title)+'|'+buNorm(x.author)===normalized));
  if(!b){
    const rate=Number(get(row,'My Rating'))||0,isRead=get(row,'Exclusive Shelf')==='read';
    b={id:Date.now()*1000+i,title,author,isbn,source:'goodreads',type:'wishlist',owned:false,added:Date.now()+i,
       year:get(row,'Original Publication Year')||get(row,'Year Published'),publisher:get(row,'Publisher'),pages:Number(get(row,'Number of Pages'))||undefined,
       format:get(row,'Binding')||'',tags:includeTags?get(row,'Tags'):'',rating:rate>=1&&rate<=5?Number(buRatingConfig()[rate]??rate*2):null,
       finished:isRead?(gqDate(get(row,'Date Read'))||gqDate(get(row,'Date Added'))||iso(Date.now())):null,
       started:isRead?gqDate(get(row,'Date Added')):null,cover:null,covers:[]};
    profile.libraryBooks.push(b);imported++;
  }else linked++;
  for(const name of shelves){
    let list=profile.readingLists.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if(!list){list={id:Date.now()*1000+i+profile.readingLists.length,name,items:[],showInShelf:false,folderSync:false,source:'goodreads'};profile.readingLists.push(list);}
    if(!list.items.some(x=>String(x.bookId)===String(b.id)))list.items.push({id:crypto.randomUUID(),bookId:b.id,title,author,owned:!!owns});
  }
 }
 modal=null;save();go('lists');
 toast(imported+' Bücher importiert · '+mangaCount+' Manga/Comics · '+bookCount+' Bücher. Profile bleiben getrennt.');
};
// One-time conservative migration for Goodreads entries imported before profile detection existed.
// Only library-only Goodreads records move. Files, owned books and user-created entries stay untouched.
window.bu49ClassifyExistingGoodreads=function(){
 if(ALL.bu49GoodreadsRouted)return {moved:0};
 let moved=0;
 for(const [fromKey,toKey] of [['book','manga'],['manga','book']]){
  const from=ALL[fromKey],to=ALL[toKey];
  from.libraryBooks??=[];from.readingLists??=[];to.libraryBooks??=[];to.readingLists??=[];
  for(const book of [...from.libraryBooks]){
   if(book?.source!=='goodreads'||book.owned||book.type==='physical'||book.type==='digital')continue;
   const references=from.readingLists.flatMap(l=>(l.items||[]).filter(x=>String(x.bookId)===String(book.id)).map(x=>({list:l,item:x})));
   const tags=[book.tags,book.format,...references.map(x=>x.list.name)].join(' ');
   const isManga=window.bu49IsManga(book.title,tags,book.format);
   if((toKey==='manga')!==isManga)continue;
   const duplicate=to.libraryBooks.find(x=>(book.isbn&&x.isbn===book.isbn)||(buNorm(x.title)===buNorm(book.title)&&buNorm(x.author)===buNorm(book.author)));
   // Reusing an existing record's ID can collide. Never merge without a safe ID mapping.
   if(duplicate&&String(duplicate.id)!==String(book.id))continue;
   if(!duplicate)to.libraryBooks.push(book);
   for(const ref of references){
     let dest=to.readingLists.find(l=>l.name.toLowerCase()===ref.list.name.toLowerCase());
     if(!dest){dest={id:Date.now()+Math.floor(Math.random()*1e8),name:ref.list.name,items:[],source:'goodreads',showInShelf:false};to.readingLists.push(dest);}
     if(!dest.items.some(x=>String(x.bookId)===String(book.id)))dest.items.push(ref.item);
     ref.list.items=ref.list.items.filter(x=>x!==ref.item);
   }
   from.libraryBooks=from.libraryBooks.filter(x=>x!==book);
   moved++;
  }
 }
 ALL.bu49GoodreadsRouted=Date.now();
 if(moved){persist();toast(moved+' Goodreads-Bücher dem passenden Profil zugeordnet.');}
 else persist();
 return {moved};
};
function responsive(){
 document.body.classList.toggle('bu49-mobile',window.Capacitor?.getPlatform?.()==='android');
 const selected=document.getElementById('bu49-selected-count');
 if(selected)selected.textContent=buSelected.size+' ausgewählt';
}
const lastRender=window.nextAfterRender;
window.nextAfterRender=function(){lastRender?.apply(this,arguments);responsive()};
window.addEventListener('load',()=>{installChangelog();}, {once:true});
setTimeout(installChangelog,350);
setTimeout(()=>{try{window.bu49ClassifyExistingGoodreads()}catch(e){console.warn('Goodreads profile routing:',e)}},700);
})();
