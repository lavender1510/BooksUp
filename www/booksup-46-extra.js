/* Additional 4.6 book discovery and ISBN edition tools */
let bu46MoreBusy=false,bu46IsbnOptions=[],bu46IsbnBookId=null;
async function bu46MoreBooks(){
 if(bu46MoreBusy)return;
 if(navigator.onLine===false)return toast('Neue Empfehlungen benötigen Internet.');
 bu46MoreBusy=true;
 const btn=[...document.querySelectorAll('button')].find(x=>x.getAttribute('onclick')==='bu46MoreBooks()');
 const old=btn?.textContent,prev=new Set(bu44Remote.map(x=>buNorm(x.title+'|'+x.author)));
 if(btn){btn.disabled=true;btn.textContent='⏳ Neue Bücher laden …'}
 try{
  await bu44FetchRecommendations(true);
  const count=bu44Remote.filter(x=>!prev.has(buNorm(x.title+'|'+x.author))).length;
  if(view==='home')render();
  toast(count?count+' neue Bücher gefunden.':'Keine weiteren Titel gefunden – versuche andere Genres oder die Suche.');
 }catch(e){toast('Suche fehlgeschlagen: '+String(e.message||e))}
 finally{bu46MoreBusy=false;if(btn?.isConnected){btn.disabled=false;btn.textContent=old}}
}
async function bu46FindIsbn(book){
 const title=String(book.title||'').trim(),author=String(book.author||'').trim();if(title.length<2)return [];
 const q='intitle:'+title+(author?' inauthor:'+author:'');
 const [google,open]=await Promise.allSettled([
  fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=40'),
  fetchMetaUrl('https://openlibrary.org/search.json?title='+encodeURIComponent(title)+(author?'&author='+encodeURIComponent(author):'')+'&fields=title,author_name,editions&limit=6')
 ]);
 const out=[],seen=new Set(),add=(x)=>{
  const i=isbnClean(x.isbn);if(!isbnValid(i)||seen.has(i))return;
  const t=buNorm(x.title||'');
  if(t!==buNorm(title)&&!t.includes(buNorm(title)))return;
  seen.add(i);out.push({...x,isbn:i});
 };
 if(google.status==='fulfilled')for(const item of google.value.items||[]){
  const v=item.volumeInfo||{};for(const id of v.industryIdentifiers||[])add({isbn:id.identifier,title:v.title,language:v.language||'',publisher:v.publisher||'',year:v.publishedDate||'',edition:v.subtitle||''});
 }
 if(open.status==='fulfilled')for(const d of open.value.docs||[])for(const e of d.editions?.docs||[]){
  for(const isbn of [...(e.isbn_13||[]),...(e.isbn_10||[])])add({isbn,title:e.title||d.title,language:e.language?.[0]?.key?.split('/').pop()||'',publisher:e.publisher?.[0]||'',edition:e.edition_name||'',year:e.publish_date||''});
 }
 return out.slice(0,25);
}
async function bu46IsbnDialog(id){
 const book=[...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));if(!book)return;
 bu46IsbnBookId=String(id);modal='<h3>ISBN-Ausgaben suchen</h3><p>Online-Suche läuft …</p>';render();
 try{
  bu46IsbnOptions=await bu46FindIsbn(book);
  modal='<h3>Passende ISBN-Ausgaben</h3><p class="hint">Bitte die korrekte Sprache und Edition auswählen, damit ein Preisvergleich nicht die falsche Ausgabe verwendet.</p>'+
  (bu46IsbnOptions.map((x,i)=>'<button class="next-setting-row" onclick="bu46PickIsbn('+i+')"><b>'+esc(x.isbn)+'</b><small>'+esc([x.language,x.publisher,x.edition,x.year].filter(Boolean).join(' · '))+'</small></button>').join('')||'<p>Keine eindeutig passende ISBN gefunden. Du kannst sie manuell erfassen.</p>')+
  '<button class="chip" onclick="modal=null;render()">Abbrechen</button>';render();
 }catch(e){modal=null;toast('ISBN-Suche derzeit nicht möglich.');render()}
}
function bu46PickIsbn(i){
 const book=[...S.books,...bu45Extra()].find(x=>String(x.id)===bu46IsbnBookId),x=bu46IsbnOptions[i];if(!book||!x)return;
 book.isbn=x.isbn;for(const k of ['language','publisher','edition'])if(!book[k]&&x[k])book[k]=x[k];
 modal=null;persist();render();toast('ISBN der ausgewählten Ausgabe gespeichert.');
}
async function bu46EnrichBook(id){
 const book=[...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));if(!book)return;
 if(navigator.onLine===false)return toast('Für Online-Buchdaten wird Internet benötigt.');
 toast('Weitere Informationen werden gesucht …');
 const isbn=isbnClean(book.isbn),query=isbnValid(isbn)?'isbn:'+isbn:'intitle:'+book.title+(book.author?' inauthor:'+book.author:'');
 const [g,o]=await Promise.allSettled([
  fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(query)+'&maxResults=10'),
  isbnValid(isbn)?fetchMetaUrl('https://openlibrary.org/isbn/'+encodeURIComponent(isbn)+'.json'):fetchMetaUrl('https://openlibrary.org/search.json?title='+encodeURIComponent(book.title)+'&limit=5&fields=title,subject,first_publish_year,cover_i')
 ]);
 const found=[];
 if(g.status==='fulfilled')for(const entry of g.value.items||[]){
  if(buNorm(entry.volumeInfo?.title)!==buNorm(book.title))continue;found.push(metadataGoogle(entry.volumeInfo||{},entry));
 }
 if(o.status==='fulfilled'){
  const d=o.value;
  if(d.title)found.push({publisher:d.publishers?.[0]||'',pages:d.number_of_pages||'',year:d.publish_date||'',language:d.languages?.[0]?.key?.split('/').pop()||'',series:d.series?.[0]||'',cover:d.covers?.[0]?'https://covers.openlibrary.org/b/id/'+d.covers[0]+'-L.jpg':''});
  for(const x of d.docs||[])if(buNorm(x.title)===buNorm(book.title))found.push({genre:x.subject?.[0]||'',tags:(x.subject||[]).slice(0,6).join(', '),year:x.first_publish_year||'',cover:x.cover_i?'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg':''});
 }
 let count=0;
 for(const entry of found)for(const k of ['genre','tags','publisher','year','pages','language','series','seriesNumber','description']){
  if((book[k]===null||book[k]===undefined||book[k]==='')&&entry[k]){book[k]=entry[k];count++}
 }
 if(!book.cover&&!book.covers?.length){const cover=found.map(x=>x.cover).find(x=>/^https:\/\//i.test(x||''));if(cover){book.covers=[cover];count++}}
 if(count){persist();render();toast(count+' Buchangaben ergänzt – weiterhin bearbeitbar.')}
 else toast('Keine zusätzlichen verlässlichen Daten gefunden.');
}
