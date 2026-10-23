/* BooksUp 4.6 - recommendations, private reader profiles, discovery and similarities.
   Personal fields stay inside local backup data, never in public News or GitHub. */
let bu46SearchResults=[],bu46SearchTerm='',bu46SearchBusy=false,bu46SearchSeq=0,bu46FocusBook=null;
const bu46SimilarCache=new Map(),bu46UnknownTags=/\b(erotica|erotic|explicit|porn|pornograph|adult romance|dark romance|smut|sex stories|sexgeschichten|erotik|erotisch|hentai|yaoi 18|18\+|nsfw)\b/i;
const bu46YouthTags=/\b(young adult|juvenile|children|childrens|kids|teen|middle grade|jugendbuch|kinderbuch|kinder|jugend|ages 8|ages 12|ab 12|ab 10)\b/i;
function bu46Private(){ALL.privateReader??={age:null,adult:false};return ALL.privateReader}
function bu46Age(){const n=Number(bu46Private().age);return Number.isInteger(n)&&n>=13&&n<=120?n:null}
function bu46AdultEnabled(){return bu46Age()>=18&&!!bu46Private().adult}
function bu46AgeLabel(b){
 const txt=[b.genre,b.tags,b.description,b.categories,b.maturity,b.ageRating,b.audience].flat().filter(Boolean).join(' ');
 const age=Number(b.minAge??b.ageMinimum??b.ageRatingNumber??0);
 if(Number.isFinite(age)&&age>=18)return 18;
 if(bu46UnknownTags.test(txt))return 18;
 if(Number.isFinite(age)&&age>=6&&age<18)return age;
 return bu46YouthTags.test(txt)?12:null;
}
function bu46Allowed(b){
 const rating=bu46AgeLabel(b),age=bu46Age();
 if(age===null)return rating!==18; // unknown users have adult suggestions disabled
 if(age<18){
   if(rating===18||rating!==null&&rating>age)return false;
   // Only age-categorized remote titles for minors. Locally curated owned books remain accessible.
   if(!S.books.includes(b)&&!ALL.book.books.includes(b)&&!ALL.manga.books.includes(b)&&rating===null)return false;
   return true;
 }
 return rating!==18||bu46AdultEnabled();
}
function bu46SetAge(value){
 const age=Number(value);
 if(!Number.isInteger(age)||age<13||age>120){toast('Bitte ein Alter ab 13 eingeben.');return}
 bu46Private().age=age;if(age<18)bu46Private().adult=false;
 persist();render();
}
function bu46SetAdult(on){
 if(on&&bu46Age()<18){toast('18+ Empfehlungen sind erst ab 18 Jahren verfügbar.');return}
 bu46Private().adult=!!on;persist();render();
}
function bu46AccountSettings(){
 const p=bu46Private(),age=bu46Age();
 return '<section class="bu46-private"><div class="bu46-privacy-note"><b>Nur auf diesem Gerät</b><p>Dein angegebenes Alter und deine Empfehlungseinstellungen werden nicht öffentlich angezeigt. Sie sind allerdings Bestandteil eines von dir erstellten Backups.</p></div>'+
 '<label for="bu46-age">Dein Alter</label><div class="row"><input id="bu46-age" type="number" min="13" max="120" step="1" inputmode="numeric" placeholder="Alter eingeben" value="'+(age||'')+'"><button class="btn" onclick="bu46SetAge($(\'bu46-age\').value)">Speichern</button></div>'+
 '<label class="bu43-check"><input type="checkbox" '+(bu46AdultEnabled()?'checked':'')+' '+(age===null||age<18?'disabled':'')+' onchange="bu46SetAdult(this.checked)"> 18+ Empfehlungen aktivieren</label>'+
 '<p class="hint">Bücher haben nicht immer eine zuverlässige Alterskennzeichnung. Unbekannte Online-Titel werden bei unter 18-Jährigen vorsichtshalber ausgeschlossen; eine vollständige Altersprüfung ist damit nicht garantiert. Du kannst die Einstellung jederzeit ändern.</p></section>';
}
function bu46SearchOpen(){go('discoverSearch')}
function bu46SearchView(){
 return bar('Bücher suchen','home')+'<section class="bu46-discover-search"><div class="bu45-pagehead"><div><span class="next-overline">BOOKSUP DISCOVER</span><h1>Bücher entdecken</h1><p class="hint">Suche nach Titel, Autor oder ISBN und füge Bücher einer Leseliste hinzu, ohne sie als gekauft zu markieren.</p></div></div>'+
 '<form class="bu46-search-form" onsubmit="event.preventDefault();bu46Search($(\'bu46-search-input\').value,true)"><input type="search" id="bu46-search-input" value="'+esc(bu46SearchTerm)+'" placeholder="Titel, Autor, ISBN …" autocomplete="off" required><button class="btn" type="submit">Suchen</button></form>'+
 '<div id="bu46-search-status" class="hint">'+(bu46SearchBusy?'Suche läuft …':bu46SearchResults.length?bu46SearchResults.length+' lokale Treffer':'Suche in den lokalen Buchvorschlägen')+'</div>'+
 '<div id="bu46-search-items" class="bu46-result-grid">'+bu46SearchResults.map((b,i)=>bu46SearchCard(b,i)).join('')+'</div></section>';
}
function bu46SearchCard(b,i){
 return '<article class="bu46-result"><button class="bu46-result-main" onclick="bu46SearchDetail('+i+')"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title)+'</b><small>'+esc(b.author||'')+'</small><small>'+esc(b.genre||b.year||'')+'</small></button>'+
 '<button class="chip" onclick="bu46ChooseList('+i+')">＋ Leseliste</button></article>';
}
function bu46SearchDetail(i){bu46FocusBook=bu46SearchResults[Number(i)];go('searchDetail')}
function bu46BookInfo(){
 const b=bu46FocusBook;if(!b)return bar('Buch','discoverSearch');
 return bar('Buch entdecken','discoverSearch')+'<section class="bu45-library-detail"><div class="bu45-cover bu45-cover-large">'+bu43CoverHtml(b)+'</div><div><h1>'+esc(b.title||'')+'</h1><p>'+esc(b.author||'')+'</p><p class="hint">'+esc([b.year,b.genre,b.publisher].filter(Boolean).join(' · '))+'</p><p>'+esc(b.description||'Für dieses Buch ist keine Inhaltsbeschreibung verfügbar.')+'</p><button class="btn" onclick="bu46ChooseList('+bu46SearchResults.indexOf(b)+')">＋ Zur Leseliste</button></div></section>';
}
async function bu46Search(term,reset=true){
 term=String(term||'').trim();if(term.length<2)return toast('Bitte mindestens 2 Zeichen eingeben.');
 if(reset){bu46SearchTerm=term;bu46SearchResults=[]} const token=++bu46SearchSeq;
 const status=$('bu46-search-status'),input=$('bu46-search-input');if(input)input.value=term;if(status)status.textContent='Suche in zwei Buchdatenbanken …';
 bu46SearchBusy=true;
 try{
  const isbn=term.replace(/[^0-9X]/gi,'');
  const q=/^\d{10}$|^\d{13}$/.test(isbn)?'isbn:'+isbn:term;
  const [g,o]=await Promise.allSettled([
   fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=40&startIndex=0'),
   fetchMetaUrl('https://openlibrary.org/search.json?'+(q.startsWith('isbn:')?'isbn='+encodeURIComponent(isbn):'q='+encodeURIComponent(term))+'&limit=40&fields=key,title,author_name,isbn,first_publish_year,cover_i,subject,language')
  ]);
  if(token!==bu46SearchSeq)return;
  const found=[];
  if(g.status==='fulfilled')for(const x of g.value.items||[]){const v=bu44ItemToBook(x);if(v)found.push(v)}
  if(o.status==='fulfilled')for(const x of o.value.docs||[]){
    if(!x.title)continue;
    const cover=Number(x.cover_i)>0?'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg':'';
    found.push({id:x.key,title:x.title,author:(x.author_name||[]).join(', '),isbn:x.isbn?.[0]||'',cover,genre:x.subject?.[0]||'',tags:(x.subject||[]).slice(0,5).join(', '),year:x.first_publish_year||'',audience:bu46YouthTags.test((x.subject||[]).join(' '))?'young adult':null});
  }
  const seen=new Set();
  bu46SearchResults=found.filter(b=>{
   if(!bu46Allowed(b))return false;
   const k=buNorm(b.title)+'|'+buNorm(b.author);
   if(!k||seen.has(k))return false;seen.add(k);return true;
  });
  if(view==='discoverSearch'){
   $('bu46-search-items').innerHTML=bu46SearchResults.map(bu46SearchCard).join('');
   $('bu46-search-status').textContent=bu46SearchResults.length+' Ergebnisse';
   bu43LoadCovers();buTranslateUI();
  }
 }catch(e){if(status)status.textContent='Online-Suche fehlgeschlagen: '+String(e.message||e)}
 finally{if(token===bu46SearchSeq)bu46SearchBusy=false}
}
function bu46ChooseList(index){
 const b=bu46SearchResults[Number(index)];if(!b)return;
 const lists=bu45AllLists();if(!lists.length)return toast('Erstelle zuerst eine Leseliste.');
 modal='<h3>Zu welcher Leseliste?</h3><p>'+esc(b.title)+'</p>'+
 lists.map(l=>'<button class="next-setting-row" onclick="bu46AddToList('+Number(index)+','+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">'+esc(l.name)+' <small>'+(l.items||[]).length+' Bücher</small></button>').join('')+
 '<button class="chip" onclick="modal=null;render()">Abbrechen</button>';render();
}
function bu46AddToList(index,id){
 const b=bu46SearchResults[Number(index)],list=bu45AllLists().find(x=>String(x.id)===String(id));if(!b||!list)return;
 const key=bu45Key(b);
 let owned=S.books.find(x=>bu45Key(x)===key),library=bu45Extra().find(x=>bu45Key(x)===key);
 if(!owned&&!library){library={...b,id:Date.now()+Math.round(Math.random()*900),type:'wishlist',owned:false,source:'discover',added:Date.now()};bu45Extra().push(library)}
 const chosen=owned||library||b;
 if(!list.items.some(x=>String(x.bookId)===String(chosen.id)))list.items.push({id:crypto.randomUUID(),bookId:chosen.id,title:chosen.title,author:chosen.author,owned:!!owned});
 modal=null;persist();toast('Zur Leseliste „'+list.name+'“ hinzugefügt.');go('discoverSearch');
}
function bu46SimilarHtml(book){
 if(!book?.title)return '';
 const k=buNorm(book.title+' '+book.author);
 const cards=bu46SimilarCache.get(k);
 return '<section class="bu46-similar"><div class="bu45-pagehead"><div><h2>Ähnliche Bücher</h2><p class="hint">Weitere Geschichten zu passenden Genres, Themen und Autoren.</p></div></div>'+
 '<div class="bu46-similar-grid" data-similar-key="'+esc(k)+'">'+(cards?cards.map((b,i)=>'<button class="bu46-similar-card" onclick="bu46SimilarOpen('+JSON.stringify(k)+','+i+')"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title)+'</b><small>'+esc(b.author||'')+'</small></button>').join(''):'<p class="hint">Ähnliche Bücher werden gesucht …</p>')+'</div></section>';
}
function bu46SimilarOpen(key,i){bu46FocusBook=(bu46SimilarCache.get(key)||[])[i];if(!bu46FocusBook)return;bu46SearchResults=[bu46FocusBook,...bu46SearchResults];go('searchDetail')}
async function bu46SimilarLoad(book){
 if(!book?.title||navigator.onLine===false)return;
 const key=buNorm(book.title+' '+book.author);if(bu46SimilarCache.has(key))return;
 bu46SimilarCache.set(key,[]);
 try{
  const search=book.genre?'subject:'+book.genre:book.author?'inauthor:'+book.author:book.title;
  const j=await fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(search)+'&maxResults=20');
  const list=(j.items||[]).map(bu44ItemToBook).filter(Boolean).filter(x=>buNorm(x.title)!==buNorm(book.title)&&bu46Allowed(x)).slice(0,9);
  bu46SimilarCache.set(key,list);
  const box=[...document.querySelectorAll('[data-similar-key]')].find(n=>n.dataset.similarKey===key);
  if(box){box.innerHTML=list.length?list.map((b,i)=>'<button class="bu46-similar-card" onclick="bu46SimilarOpen('+JSON.stringify(key)+','+i+')"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title)+'</b><small>'+esc(b.author||'')+'</small></button>').join(''):'<p class="hint">Noch keine ähnlichen Titel gefunden.</p>';bu43LoadCovers()}
 }catch(e){bu46SimilarCache.delete(key)}
}
function bu46ActiveDetailBook(){
 if(view==='libraryDetail')return [...bu45Extra(),...bu45AllLibraryBooks().map(x=>x.book)].find(x=>String(x.id)===String(cur));
 if(view==='listDetail')return null;
 if(view==='detail')return S.books.find(x=>String(x.id)===String(cur));
 if(view==='catalog')return buRecs().list[buCatalogIndex];
 if(view==='searchDetail')return bu46FocusBook;
 return null;
}
function bu46ListSimilarHtml(l){
 const b=(l?.items||[]).map(bu45Book).find(x=>x.genre||x.author);
 return b?bu46SimilarHtml(b):'';
}
function bu46ReadingHistory(){
 const all=[...ALL.book.books,...ALL.manga.books,...bu45Extra()],seen=new Set();
 const finished=all.filter(b=>b.finished).filter(b=>{const k=bu45Key(b);if(seen.has(k))return false;seen.add(k);return true});
 const byYear=new Map(),byMonth=new Map();
 for(const b of finished){const d=new Date(String(b.finished).slice(0,10));if(!Number.isFinite(+d))continue;const y=String(d.getFullYear()),m=y+'-'+String(d.getMonth()+1).padStart(2,'0');byYear.set(y,(byYear.get(y)||0)+1);byMonth.set(m,(byMonth.get(m)||0)+1)}
 const years=[...byYear.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10),months=[...byMonth.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,18);
 const chart=(entries,max)=>entries.map(([label,n])=>'<div class="bu46-chart-row"><span>'+esc(label)+'</span><div class="bu45-progress"><span style="width:'+Math.max(4,Math.round(n/max*100))+'%"></span></div><b>'+n+'</b></div>').join('');
 return '<section class="card bu46-reading-history"><div class="bu45-pagehead"><h2>Gelesene Bücher im Zeitverlauf</h2><small>'+finished.length+' abgeschlossene Bücher</small></div>'+
 '<div class="bu46-history-columns"><div><h3>Nach Jahr</h3>'+(years.length?chart(years,Math.max(...years.map(x=>x[1]))):'<p class="hint">Noch keine Abschlussdaten hinterlegt.</p>')+'</div><div><h3>Nach Monat</h3>'+(months.length?chart(months,Math.max(...months.map(x=>x[1]))):'<p class="hint">Keine datierten Abschlüsse vorhanden.</p>')+'</div></div></section>';
}
function bu46AfterRender(){/* Offline: no editorial server or background metadata calls. */}
