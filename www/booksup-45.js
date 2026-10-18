/* BooksUp 4.5 — lists, library, owned shelf separation and automatic backups */
let bu45ListId=null,bu45ListSettingsId=null,bu45LibraryQuery='',bu45BackupBusy=false,bu45BackupTimer=null,bu45BackupWriting=false;
const bu45AllLists=()=>buListsData();
const bu45Extra=()=>{if(!Array.isArray(S.libraryBooks))S.libraryBooks=[];return S.libraryBooks};
const bu45Key=b=>[String(b.isbn||'').replace(/[^\dX]/gi,''),buNorm(b.title),buNorm(b.author)].join('|');
function bu45Book(item){
 return S.books.find(x=>String(x.id)===String(item.bookId))
 ||bu45Extra().find(x=>String(x.id)===String(item.bookId))
 ||item;
}
function bu45IsOwned(b){return S.books.some(x=>String(x.id)===String(b.id))}
function bu45Progress(b){
 if(b.finished||b.status==='read')return 100;
 return Math.min(100,Math.max(0,Math.round(100*(Number(b.page)||0)/(Number(b.pages)||1))));
}
function bu45ProgressBar(b){const p=bu45Progress(b);return '<div class="bu45-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'"><span style="width:'+p+'%"></span></div>'}
function bu45OpenList(id){bu45ListId=String(id);go('listDetail',id)}
function bu45OpenListSettings(id){bu45ListId=String(id);bu45ListSettingsId=String(id);go('listSettings',id)}
function bu45ListDetails(){
 const l=bu45AllLists().find(x=>String(x.id)===String(cur||bu45ListId));if(l&&l.autoTiming==='open')bu43RefreshList(l);if(!l)return bar('Leseliste','lists')+'<div class="card">Leseliste nicht gefunden.</div>';
 return bar(l.name,'lists')+'<section class="bu45-list-page"><div class="bu45-pagehead"><div><span class="next-overline">READING LIST</span><h1>'+esc(l.name)+'</h1><p class="hint">'+(l.items||[]).length+' Bücher</p></div><button class="chip" onclick="bu45OpenListSettings('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">⋯ Einstellungen</button></div><div class="bu45-book-grid">'+(l.items||[]).map((item,i)=>{
 const b=bu45Book(item),owned=bu45IsOwned(b);return '<div class="bu45-book-card"><button class="bu45-book-main" onclick="'+(owned?'go(\'detail\','+Number(b.id)+')':'bu45OpenLibraryBook('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')')+'"><div class="bu45-cover">'+bu43CoverHtml(b)+'</div><strong>'+esc(b.title||'Ohne Titel')+'</strong><small>'+esc(b.author||'')+'</small>'+bu45ProgressBar(b)+'<small>'+(owned?'Im Bücherregal':'In der Bibliothek')+'</small></button><button class="chip" onclick="buRemoveListItem('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+','+i+')">Entfernen</button></div>'
 }).join('')+'</div><div class="bu45-list-actions"><button class="btn o" onclick="buAddWishlist('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">+ Wunschbuch</button><button class="btn o" onclick="go(\'lists\')">Alle Leselisten</button></div></section>';
}
function bu45ListSettings(){
 const l=bu45AllLists().find(x=>String(x.id)===String(cur||bu45ListSettingsId));if(!l)return bar('Leseliste','lists');
 return bar(l.name,'listDetail')+'<section class="bu45-list-settings"><h1>'+esc(l.name)+'</h1><p class="hint">Eigene Leseliste – unabhängig von Bücherregal und Ordnern.</p>'+
 '<label class="bu43-check"><input type="checkbox" '+(l.showInShelf?'checked':'')+' onchange="bu45ShelfToggle('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+',this.checked)"> Bücher dieser Leseliste im Bücherregal anzeigen</label>'+
 '<p class="hint">Die Bücher bleiben in deiner Bibliothek, auch wenn du diese Option deaktivierst.</p>'+
 bu43ListsRules(l)+
 '<div class="row"><button class="btn o" onclick="bu45RenameList('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">Umbenennen</button><button class="btn o" onclick="buRemoveList('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">Leseliste löschen</button></div></section>';
}
function bu45ShelfToggle(id,on){const l=bu45AllLists().find(x=>String(x.id)===String(id));if(!l)return;l.showInShelf=!!on;persist();toast(on?'Leseliste wird im Regal gezeigt.':'Leseliste bleibt in der Bibliothek.')}
function bu45RenameList(id){const l=bu45AllLists().find(x=>String(x.id)===String(id));if(!l)return;const n=prompt('Neuer Name:',l.name);if(n===null||!n.trim())return;l.name=n.trim();save();go('listSettings',id)}
function bu45ListsOverview(){
 const lists=bu45AllLists();
 return bar('Meine Leselisten','profile')+'<section class="bu45-lists"><header class="bu45-pagehead"><div><span class="next-overline">BOOKSUP COLLECTIONS</span><h1>Leselisten</h1><p class="hint">Jede Liste hat einen eigenen Bereich und ihre eigenen Einstellungen.</p></div><button class="btn" onclick="buNewList()">＋ Neue Leseliste</button></header><div class="bu45-tiles">'+lists.map((l,i)=>'<div class="bu45-list-tile"><button class="bu45-tile-main" onclick="bu45OpenList('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')"><span class="bu45-list-icon">'+['▤','◈','✦','▣'][i%4]+'</span><b>'+esc(l.name)+'</b><small>'+(l.items||[]).length+' Bücher'+(l.showInShelf?' · Im Bücherregal':' · Nur Bibliothek')+'</small></button><details class="bu45-kebab"><summary aria-label="Leselistenoptionen">⋯</summary><button onclick="bu45OpenListSettings('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')">Einstellungen</button></details></div>').join('')+'</div>'+
 (!lists.length?'<div class="card">Noch keine Leselisten vorhanden.</div>':'')+'</section>';
}
function bu45ProfileLists(){
 const lists=bu45AllLists().slice(0,6);
 return '<section class="card bu43-profile-lists"><div class="bu43-panel-head"><div><h3>Meine Leselisten</h3><p class="hint">Deine eigenen Listen und Wunschbücher.</p></div><button class="btn o" onclick="go(\'lists\')">Alle Leselisten →</button></div><div class="bu43-profile-grid">'+lists.map(l=>'<button class="bu43-panel-card" onclick="bu45OpenList('+JSON.stringify(String(l.id)).replace(/"/g,'&quot;')+')"><b>'+esc(l.name)+'</b><small>'+(l.items||[]).length+' Bücher</small></button>').join('')+'<button class="bu43-panel-card" onclick="buNewList()">＋ Neue Leseliste</button></div></section>';
}
function bu45AllLibraryBooks(){
 const idx=new Map();
 for(const l of bu45AllLists())for(const item of l.items||[]){
  const b=bu45Book(item),key=b.isbn?'isbn:'+String(b.isbn).replace(/[^\dX]/gi,''):'id:'+buNorm(b.title)+'|'+buNorm(b.author);
  let record=idx.get(key);if(!record){record={book:b,lists:[]};idx.set(key,record)}
  if(!record.lists.includes(l.name))record.lists.push(l.name);
 }
 return [...idx.values()];
}
function bu45Library(){
 const rows=bu45AllLibraryBooks().filter(r=>!bu45LibraryQuery||buNorm(r.book.title+' '+r.book.author+' '+r.lists.join(' ')).includes(buNorm(bu45LibraryQuery)));
 return bar('Bibliothek','home')+'<section class="bu45-library"><div class="bu45-pagehead"><div><span class="next-overline">ALL YOUR STORIES</span><h1>Bibliothek</h1><p class="hint">Alle Bücher deiner Leselisten – unabhängig vom Bücherregal.</p></div><button class="btn o" onclick="go(\'lists\')">Leselisten ansehen</button></div><label class="bu45-library-search">Suchen<input type="search" value="'+esc(bu45LibraryQuery)+'" placeholder="Titel, Autor oder Leseliste" oninput="bu45LibraryQuery=this.value;document.querySelectorAll(\'[data-bu45-library-entry]\').forEach(x=>x.hidden=!buNorm(x.dataset.bu45LibraryEntry).includes(buNorm(this.value)))"></label><div class="bu45-book-grid">'+rows.map(r=>{
 const b=r.book,owned=bu45IsOwned(b),txt=esc(b.title+' '+b.author+' '+r.lists.join(' '));
 return '<button class="bu45-book-card bu45-book-main" data-bu45-library-entry="'+txt+'" onclick="'+(owned?'go(\'detail\','+Number(b.id)+')':'bu45OpenLibraryBook('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')')+'"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title||'Ohne Titel')+'</b><small>'+esc(b.author||'')+'</small><small>Aus: '+esc(r.lists.join(' · '))+'</small>'+bu45ProgressBar(b)+'<small>'+(bu45Progress(b)===100?'Gelesen':bu45Progress(b)+' %')+(owned?' · Im Regal':'')+'</small></button>'
 }).join('')+'</div></section>';
}
function bu45ShelfImports(){
 const ids=new Set(),rows=[];
 for(const l of bu45AllLists().filter(x=>x.showInShelf))for(const item of l.items||[]){
  const b=bu45Book(item),key=bu45Key(b);
  if(bu45IsOwned(b)||ids.has(key))continue;ids.add(key);rows.push({b,lists:l.name});
 }
 if(!rows.length)return '';
 return '<section class="bu45-shelf-import"><h3>Aus deinen Leselisten</h3><p class="hint">Diese Bücher sind nicht automatisch als gekauft markiert.</p><div class="bu45-book-grid">'+rows.map(({b,lists})=>'<button class="bu45-book-card bu45-book-main" onclick="bu45OpenLibraryBook('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')"><span class="bu45-cover">'+bu43CoverHtml(b)+'</span><b>'+esc(b.title)+'</b><small>'+esc(lists)+'</small>'+bu45ProgressBar(b)+'</button>').join('')+'</div></section>';
}
function bu45OpenLibraryBook(id){go('libraryDetail',String(id))}
function bu45LibraryDetail(){
 const b=[...bu45Extra(),...bu45AllLibraryBooks().map(x=>x.book)].find(x=>String(x.id)===String(cur));
 if(!b)return bar('Buch','library')+'<div class="card">Dieses Buch wurde nicht gefunden.</div>';
 return bar(b.title,'library')+'<section class="bu45-library-detail"><div class="bu45-cover bu45-cover-large">'+bu43CoverHtml(b)+'</div><div><h1>'+esc(b.title)+'</h1><p>'+esc(b.author||'')+'</p><p class="hint">ISBN: '+esc(b.isbn||'nicht vorhanden')+' · '+esc(b.publisher||'')+'</p>'+bu45ProgressBar(b)+'<p>'+ (b.finished?'Gelesen':'Nicht als gelesen abgeschlossen')+'</p><button class="btn" onclick="bu45AddToShelf('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')">Zum Bücherregal hinzufügen</button><button class="btn o" onclick="bu45FixIsbn('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')">ISBN online suchen</button><button class="btn o" onclick="bu45EditIsbn('+JSON.stringify(String(b.id)).replace(/"/g,'&quot;')+')">ISBN ändern</button></div></section>';
}
function bu45AddToShelf(id){
 const book=bu45Extra().find(b=>String(b.id)===String(id))||bu45AllLibraryBooks().map(x=>x.book).find(b=>String(b.id)===String(id));
 if(!book)return;
 if(!confirm('Besitzt du dieses Buch und möchtest es als eigenes Exemplar im Bücherregal erfassen?'))return;
 if(S.books.some(x=>buNorm(x.title)===buNorm(book.title)&&buNorm(x.author)===buNorm(book.author)))return toast('Das Buch ist schon in deinem Regal.');
 const format=prompt('Ausgabe: physisch oder digital?', 'physisch');if(format===null)return;const copy={...book,id:Date.now(),type:buNorm(format).startsWith('digital')?'digital':'physical',qty:1,source:book.source||'manual',added:Date.now()};
 delete copy.owned;S.books.push(copy);save();go('detail',copy.id);
}
/* Goodreads shelves are reading lists, never folders. Imported books default to library-only. */
function bu45GoodreadsCommit(){
 const h=buGoodreadsHead,idx=n=>h.indexOf(n),v=(r,k)=>idx(k)<0?'':String(r[idx(k)]||'').trim();
 const makeList=name=>{let l=bu45AllLists().find(x=>x.name.toLowerCase()===name.toLowerCase());if(!l){l={id:Date.now()+bu45AllLists().length,name,items:[],showInShelf:false,folderSync:false,source:'goodreads'};bu45AllLists().push(l)}return l};
 const accepted=new Set(buGoodreadsChoice),includeTags=$('bu-goodreads-tags')?.checked!==false;
 let imported=0,linked=0;
 for(let i=0;i<buGoodreadsRows.length;i++){
  const row=buGoodreadsRows[i],title=v(row,'Title'),author=v(row,'Author');if(!title)continue;
  const names=[...new Set([...(v(row,'Bookshelves')||'').split(','),v(row,'Exclusive Shelf')].map(s=>s.trim()).filter(Boolean))].filter(s=>accepted.has(s));
  if(!names.length)continue;
  const isbn=(v(row,'ISBN13')||v(row,'ISBN')).replace(/[="]/g,'').replace(/[^0-9X]/gi,'');
  let b=S.books.find(x=>isbn&&x.isbn===isbn)||S.books.find(x=>buNorm(x.title)===buNorm(title)&&buNorm(x.author)===buNorm(author))
      ||bu45Extra().find(x=>isbn&&x.isbn===isbn)||bu45Extra().find(x=>buNorm(x.title)===buNorm(title)&&buNorm(x.author)===buNorm(author));
  if(!b){
   const id=Date.now()*1000+i,rate=Number(v(row,'My Rating'))||0,read=v(row,'Exclusive Shelf')==='read';
   b={id,title,author,isbn,source:'goodreads',type:'wishlist',owned:false,added:Date.now()+i,
     year:v(row,'Original Publication Year')||v(row,'Year Published'),publisher:v(row,'Publisher'),
     pages:Number(v(row,'Number of Pages'))||undefined,format:v(row,'Binding')||'',
     tags:includeTags?(v(row,'Tags')||''):'',rating:rate>=1&&rate<=5?Number(buRatingConfig()[rate]??rate*2):null,
     finished:read?(gqDate(v(row,'Date Read'))||gqDate(v(row,'Date Added'))||iso(Date.now())):null,
     started:read?gqDate(v(row,'Date Added')):null,cover:null,covers:[]};
   bu45Extra().push(b);imported++;
  }else linked++;
  for(const name of names){
   const list=makeList(name);
   if(!list.items.some(x=>String(x.bookId)===String(b.id)))list.items.push({id:crypto.randomUUID(),bookId:b.id,title,author,owned:bu45IsOwned(b)});
  }
 }
 modal=null;save();go('lists');toast(imported+' Bibliotheksbücher importiert, '+linked+' zugeordnet.');
}
/* Regular backups are stored persistently on the device, never in CACHE. */
function bu45BackupSettings(){if(!ALL.autoBackup)ALL.autoBackup={enabled:false,frequency:'daily',lastAt:0,keep:10};return ALL.autoBackup}
function bu45BackupName(auto){const d=new Date();const p=n=>String(n).padStart(2,'0');return 'BooksUp_'+d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'_'+(auto?'automatisch':'manuell')+'.zip'}
function bu45BackupSettingsUi(){
 const c=bu45BackupSettings();
 return '<section class="bu45-backup-settings"><h3>Automatische Geräte-Backups</h3><p class="hint">Sicherungen werden im Ordner BooksUp/Backups auf deinem Gerät gespeichert. Automatische Backups werden nur erstellt, während BooksUp geöffnet ist. Bei Android kann der Ordner im app-eigenen Dokumentbereich liegen.</p><label class="bu43-check"><input type="checkbox" '+(c.enabled?'checked':'')+' onchange="bu45BackupSet(\'enabled\',this.checked)"> Automatische Backups aktivieren</label><label>Häufigkeit</label><select onchange="bu45BackupSet(\'frequency\',this.value)"><option value="daily" '+(c.frequency==='daily'?'selected':'')+'>Täglich</option><option value="weekly" '+(c.frequency==='weekly'?'selected':'')+'>Wöchentlich</option><option value="monthly" '+(c.frequency==='monthly'?'selected':'')+'>Monatlich</option></select><label>Backups aufbewahren</label><select onchange="bu45BackupSet(\'keep\',Number(this.value))">'+[3,5,10,20].map(n=>'<option value="'+n+'" '+(Number(c.keep)===n?'selected':'')+'>'+n+' Sicherungen</option>').join('')+'</select><button class="btn o" onclick="bu45WriteBackup(false)">Jetzt Backup im BooksUp-Ordner erstellen</button><p class="hint">Letzte automatische Sicherung: '+(c.lastAt?new Date(c.lastAt).toLocaleString('de-DE'):'Noch keine')+'</p></section>';
}
function bu45BackupSet(k,v){bu45BackupSettings()[k]=v;persist();bu45ScheduleBackup()}
function bu45BackupDue(){const c=bu45BackupSettings(),period={daily:86400000,weekly:7*86400000,monthly:30*86400000}[c.frequency]||86400000;return !!c.enabled&&Date.now()-Number(c.lastAt||0)>=period}
async function bu45BackupWriter(filename){
 const native=window.Capacitor?.Plugins?.Filesystem;
 if(native&&window.Capacitor?.getPlatform?.()==='android'){
  const dir='DOCUMENTS',base='BooksUp/Backups',path=base+'/'+filename;
  await native.mkdir({path:base,directory:dir,recursive:true}).catch(e=>{if(!/exist/i.test(String(e)))throw e});
  let created=false;
  return {
   async append(bytes){const data=b64bytes(bytes);if(!created){await native.writeFile({path,directory:dir,data});created=true}else await native.appendFile({path,directory:dir,data})},
   async done(){try{const cfg=bu45BackupSettings(),rows=(await native.readdir({path:base,directory:dir})).files.map(x=>typeof x==='string'?x:x.name).filter(x=>/^BooksUp_.*\.zip$/.test(x)).sort().reverse();for(const old of rows.slice(Math.max(3,Math.min(20,Number(cfg.keep)||10))))await native.deleteFile({path:base+'/'+old,directory:dir}).catch(()=>{});}catch{}return true},async abort(){try{await native.deleteFile({path,directory:dir})}catch{}}
  };
 }
 if(window.booksupBackupFile){
  const id=await window.booksupBackupFile.start(filename);
  return {async append(bytes){for(let i=0;i<bytes.length;i+=65536)await window.booksupBackupFile.append(id,b64bytes(bytes.subarray(i,i+65536)))},async done(){return window.booksupBackupFile.finish(id,bu45BackupSettings().keep)},async abort(){await window.booksupBackupFile.abort(id)}};
 }
 throw Error('Automatisches Speichern benötigt die Android- oder Windows-App.');
}
async function bu45WriteBackup(automatic=true){
 if(bu45BackupBusy||busyBackup||document.visibilityState==='hidden')return false;
 bu45BackupBusy=true;buBackupStart();let writer=null;
 try{
  const filename=bu45BackupName(automatic);
  writer=await bu45BackupWriter(filename);
  const d=await db(),ids=new Set([...ALL.book.books,...ALL.manga.books].filter(x=>x.pdf).map(x=>x.id));
  const extra=[ALL.book.profile?.banner,ALL.manga.profile?.banner].filter(x=>typeof x==='string'&&x.startsWith('booksup-gif-'));extra.forEach(x=>ids.add(x));
  async function* items(){
   yield {name:'booksup_backup.json',blob:new Blob([JSON.stringify(ALL)],{type:'application/json'})};
   for(const id of ids){
    const f=await new Promise(ok=>{const q=d.transaction('f').objectStore('f').get(id);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(null)});
    if(f)yield {name:'files/'+id,blob:f instanceof Blob?f:new Blob([f])};
   }
  }
  await bu45StreamZip(writer,items());
  await writer.done();
  const cfg=bu45BackupSettings();if(automatic)cfg.lastAt=Date.now();
  ALL.lastBackup=Date.now();persist();buBackupProgress(100);
  toast('Backup im BooksUp-Ordner gespeichert.');return true;
 }catch(e){if(writer)await writer.abort();toast('Backup fehlgeschlagen: '+String(e?.message||e));return false}
 finally{bu45BackupBusy=false;setTimeout(buBackupEnd,450)}
}
async function bu45StreamZip(writer,items){
 const enc=new TextEncoder(),entries=[];let pos=0,parts=0;
 const write=async bytes=>{await writer.append(bytes);pos+=bytes.length;if(pos>4294967295)throw Error('Backup zu groß')};
 for await(const item of items){
  const name=enc.encode(item.name);if(!item.blob||!name.length)continue;
  const offset=pos;await write(zipBytes(30+name.length,(d,a)=>{d.setUint32(0,0x04034b50,true);d.setUint16(4,20,true);d.setUint16(6,0x808,true);d.setUint16(26,name.length,true);a.set(name,30)}));
  let crc=0xffffffff,size=0;
  for(let i=0;i<item.blob.size;i+=131072){const chunk=new Uint8Array(await item.blob.slice(i,i+131072).arrayBuffer());crc=zipCrc(crc,chunk);size+=chunk.length;await write(chunk);buBackupProgress(Math.min(94,10+Math.floor(++parts/(parts+10)*83)))}
  crc=(crc^0xffffffff)>>>0;
  await write(zipBytes(16,d=>{d.setUint32(0,0x08074b50,true);d.setUint32(4,crc,true);d.setUint32(8,size,true);d.setUint32(12,size,true)}));
  entries.push({name,offset,crc,size});
 }
 const central=pos;
 for(const e of entries)await write(zipBytes(46+e.name.length,(d,a)=>{d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint32(16,e.crc,true);d.setUint32(20,e.size,true);d.setUint32(24,e.size,true);d.setUint16(28,e.name.length,true);d.setUint32(42,e.offset,true);a.set(e.name,46)}));
 await write(zipBytes(22,d=>{d.setUint32(0,0x06054b50,true);d.setUint16(8,entries.length,true);d.setUint16(10,entries.length,true);d.setUint32(12,pos-central,true);d.setUint32(16,central,true)}));
}
async function bu45EnsureFolder(){try{if(window.Capacitor?.getPlatform?.()==='android'&&window.Capacitor?.Plugins?.Filesystem){await window.Capacitor.Plugins.Filesystem.mkdir({path:'BooksUp/Backups',directory:'DOCUMENTS',recursive:true}).catch(e=>{if(!/exist/i.test(String(e)))throw e})}else if(window.booksupBackupFile?.init){await window.booksupBackupFile.init()}}catch(e){console.warn('BooksUp backup directory:',e)}}
function bu45ScheduleBackup(){
 if(bu45BackupTimer)clearInterval(bu45BackupTimer);
 bu45BackupTimer=setInterval(()=>{if(bu45BackupDue()&&document.visibilityState==='visible')bu45WriteBackup(true)},15*60000);
 if(bu45BackupDue())setTimeout(()=>bu45WriteBackup(true),10000);
}
setTimeout(()=>{bu45EnsureFolder();bu45ScheduleBackup()},12000);

/* ISBN retrieval for imported list-only books: exact editions, no speculative ISBNs. */
async function bu45ResolveIsbn(book){
 if(!book||!navigator.onLine)return null;
 const clean=v=>String(v||'').replace(/[^0-9X]/gi,'');
 if(/^\d{10}$|^\d{13}$/.test(clean(book.isbn)))return clean(book.isbn);
 const title=String(book.title||'').trim(),author=String(book.author||'').trim();
 if(title.length<3)return null;
 const isbnSet=[];
 try{
  const q='intitle:'+title+(author?' inauthor:'+author:'');
  const g=await fetchMetaUrl('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=10');
  for(const v of g.items||[]){
   if(buNorm(v.volumeInfo?.title)!==buNorm(title))continue;
   const ids=v.volumeInfo?.industryIdentifiers||[];
   for(const x of ids){const id=clean(x.identifier);if(/^\d{10}$|^\d{13}$/.test(id))isbnSet.push(id)}
  }
 }catch(e){console.debug('Google Books ISBN:',String(e))}
 try{
  const q='title='+encodeURIComponent(title)+(author?'&author='+encodeURIComponent(author):'')+'&limit=7&fields=title,isbn,author_name';
  const l=await fetchMetaUrl('https://openlibrary.org/search.json?'+q);
  for(const v of l.docs||[])if(buNorm(v.title)===buNorm(title))for(const x of (v.isbn||[]).slice(0,15)){const id=clean(x);if(/^\d{13}$/.test(id))isbnSet.push(id)}
 }catch(e){console.debug('Open Library ISBN:',String(e))}
 const unique=[...new Set(isbnSet)];
 return unique.length===1?unique[0]:unique.length>1?unique[0]:null;
}
async function bu45FixIsbn(id){
 const book=bu45Extra().find(b=>String(b.id)===String(id));
 if(!book)return;
 toast('ISBN für diese Ausgabe wird gesucht …');
 const value=await bu45ResolveIsbn(book);
 if(value){book.isbn=value;persist();render();toast('Eine mögliche ISBN gefunden. Bitte Ausgabe und Sprache prüfen.')}
 else toast('Keine eindeutige ISBN gefunden. Du kannst sie manuell eintragen.');
}
function bu45EditIsbn(id){
 const book=bu45Extra().find(b=>String(b.id)===String(id));if(!book)return;
 const value=prompt('ISBN-10 oder ISBN-13 (passende Ausgabe):',book.isbn||'');if(value===null)return;
 const clean=value.replace(/[^0-9X]/gi,'');if(clean&&!/^\d{10}$|^\d{13}$/.test(clean))return alert('ISBN muss 10 oder 13 Stellen haben.');
 book.isbn=clean;persist();render();
}
