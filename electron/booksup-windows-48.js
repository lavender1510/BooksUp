/* BooksUp 4.8 – Windows fixes only. Injected by Electron after 4.7. */
(function () {
'use strict';
if (!window.booksupDesktopUpdate) return;
window.booksupWindows48 = true;

const safe = value => esc(value == null ? '' : String(value));
const norm48 = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const candidateKey = b => [norm48(b.title),norm48(b.author)].join('|');
const listId = v => String(v == null ? '' : v);
const readLists = () => bu45AllLists();
const freshId = () => crypto.randomUUID ? crypto.randomUUID() : 'list-'+Date.now()+'-'+Math.random().toString(36).slice(2);

function listById(id){return readLists().find(x=>listId(x.id)===listId(id));}
function stabilize(l) {
  if(!l || !Array.isArray(l.items))return;
  let changed=false;
  const seen=new Set();
  l.items.forEach(item=>{
    if(!item.id || seen.has(String(item.id))){item.id=freshId();changed=true;}
    seen.add(String(item.id));
  });
  if(changed)persist();
}
function stableDelete(lid,entryId) {
  const list=listById(lid);if(!list)return;
  stabilize(list);
  const idx=list.items.findIndex(x=>listId(x.id)===listId(entryId));
  if(idx<0){toast('Eintrag wurde bereits entfernt.');return;}
  const item=list.items[idx];
  if(list.autoRule && list.autoRule!=='manual') {
    list.excludedIds??=[];
    const key=listId(item.bookId || item.id);
    if(!list.excludedIds.includes(key))list.excludedIds.push(key);
  }
  // Only the link in this reading list is removed, never a book in S.books / S.libraryBooks.
  list.items.splice(idx,1);
  persist();render();
  toast('Nur aus dieser Leseliste entfernt.');
}
window.bu48RemoveListEntry=stableDelete;
window.buRemoveListItem=function(lid,idx) {
  const list=listById(lid);
  if(!list || !Number.isInteger(Number(idx)))return;
  stabilize(list);
  const item=list.items[Number(idx)];
  if(item)stableDelete(lid,item.id);
};
const oldListDetails=window.bu45ListDetails;
window.bu45ListDetails=function(){
  const list=listById(cur || bu45ListId);
  if(!list)return oldListDetails();
  if(list.autoTiming==='open')bu43RefreshList(list);
  stabilize(list);
  const ident=encodeURIComponent(listId(list.id));
  const cards=(list.items||[]).map(item=>{
    const b=bu45Book(item),owned=bu45IsOwned(b),id=listId(b.id);
    const action=owned?"go('detail',"+Number(id)+")":"bu45OpenLibraryBook("+JSON.stringify(id).replace(/"/g,'&quot;')+")";
    return '<article class="bu48-detail-book"><button class="bu48-detail-book-open" onclick="'+action+'"><span class="bu48-detail-cover">'+bu43CoverHtml(b)+'</span><span><strong>'+safe(b.title||item.title||'Ohne Titel')+'</strong><small>'+safe(b.author||item.author||'')+'</small><small>'+(owned?'Im Bücherregal':'In der Bibliothek')+'</small></span></button><button class="chip bu48-delete-entry" data-bu48-list="'+safe(ident)+'" data-bu48-item="'+safe(encodeURIComponent(listId(item.id)))+'">Entfernen</button></article>';
  }).join('');
  return bar(list.name,'lists')+'<section class="bu48-list-detail"><header class="bu45-pagehead"><div><span class="next-overline">READING LIST</span><h1>'+safe(list.name)+'</h1><p class="hint">'+list.items.length+' Bücher · Entfernen löscht niemals das Originalbuch.</p></div><button class="chip" onclick="bu45OpenListSettings('+JSON.stringify(listId(list.id)).replace(/"/g,'&quot;')+')">⋯ Einstellungen</button></header><div class="bu48-detail-grid">'+(cards||'<p class="hint">Noch keine Bücher in dieser Leseliste.</p>')+'</div><div class="bu45-list-actions"><button class="btn o" onclick="buAddWishlist('+JSON.stringify(listId(list.id)).replace(/"/g,'&quot;')+')">+ Wunschbuch</button><button class="btn o" onclick="go(\'lists\')">Alle Leselisten</button></div></section>';
};
function previewBooks(list,limit=4){
  return (list.items||[]).map((item,i)=>({item,book:bu45Book(item),i})).sort((a,b)=>Number(b.book.added||b.item.added||b.i)-Number(a.book.added||a.item.added||a.i)).slice(0,limit);
}
function listTile(list,i,compact=false) {
  const id=JSON.stringify(listId(list.id)).replace(/"/g,'&quot;');
  const sample=previewBooks(list,compact?3:5);
  const covers=sample.map(x=>'<span class="bu48-preview-cover" title="'+safe(x.book.title)+'">'+bu43CoverHtml(x.book)+'</span>').join('');
  return '<article class="bu48-list-tile"><button class="bu48-list-main" onclick="bu45OpenList('+id+')"><span class="bu48-list-symbol">'+['▤','◈','✦','▣'][i%4]+'</span><span class="bu48-list-text"><strong>'+safe(list.name)+'</strong><small>'+(list.items||[]).length+' Bücher · '+(list.showInShelf?'Im Bücherregal sichtbar':'Eigene Leseliste')+'</small><span class="bu48-preview-caption">'+(sample.length?'Neueste Einträge: '+sample.map(x=>safe(x.book.title)).join(' · '):'Noch keine Bücher eingetragen')+'</span></span><span class="bu48-list-covers">'+(covers||'<span class="bu48-preview-empty">＋</span>')+'</span><span class="bu48-list-arrow">→</span></button><button class="chip bu48-list-settings" onclick="bu45OpenListSettings('+id+')">⋯</button></article>';
}
window.bu45ListsOverview=function(){
  const lists=readLists();
  return bar('Leselisten','profile')+'<section class="bu48-lists"><header class="bu45-pagehead"><div><span class="next-overline">BOOKSUP / COLLECTIONS</span><h1>Deine Leselisten</h1><p class="hint">Große Sammlungen mit einer Vorschau der zuletzt hinzugefügten Bücher.</p></div><button class="btn" onclick="buNewList()">＋ Neue Leseliste</button></header><div class="bu48-list-stack">'+lists.map((l,i)=>listTile(l,i)).join('')+'</div>'+(lists.length?'':'<div class="card">Noch keine Leselisten vorhanden.</div>')+'</section>';
};
const previousProfileLists=window.bu45ProfileLists;
const previousHistory=window.bu46ReadingHistory;
const previousHome=window.home;
window.bu45ProfileLists=function(){return view==='profile'?'':previousProfileLists();};
window.bu46ReadingHistory=function(){return view==='profile'?'':previousHistory();};
window.home=function(){
  if(view!=='profile')return previousHome();
  const holder=document.createElement('div');holder.innerHTML=previousHome();
  const pick=selector=>holder.querySelector(selector)?.outerHTML||'';
  const cards=[...holder.querySelectorAll(':scope > .card')];
  const labelled=txt=>cards.find(e=>e.querySelector('.lbl')?.textContent.trim().startsWith(txt))?.outerHTML||'';
  const p=pick(':scope > .banner')+pick(':scope > .avframe')+pick(':scope > .pad');
  const continuing=labelled('Weiterlesen') || cont() || '<div class="card"><div class="lbl">Weiterlesen</div><p class="hint">Aktuell liest du kein digitales Buch.</p></div>';
  const tiles=pick(':scope > .grid');
  const lists='<section class="bu48-profile-lists"><div class="bu48-section-title"><h2>Leselisten</h2><button class="chip" onclick="go(\'lists\')">Alle ansehen →</button></div><div class="bu48-list-stack">'+readLists().slice(0,5).map((l,i)=>listTile(l,i,true)).join('')+'</div></section>';
  return '<section class="bu48-profile-order">'+
    '<div class="bu48-profile-section">'+p+'</div>'+
    '<section class="bu48-profile-section"><h2>Weiterlesen</h2>'+continuing+'</section>'+
    '<section class="bu48-profile-section"><h2>Schnellzugriff</h2>'+tiles+'</section>'+
    '<section class="bu48-profile-section">'+labelled('Bibliothek')+'</section>'+
    lists+
    '<section class="bu48-profile-section">'+labelled('Lesestatistik')+'</section>'+
    '<section class="bu48-profile-section">'+previousHistory()+'</section>'+
    '<section class="bu48-profile-section">'+labelled('Top 5')+'</section>'+
    '<section class="bu48-profile-section">'+labelled('Empfehlungen')+'</section>'+
    '</section>';
};

// Keep chosen accent independent from base theme. Save reusable local combinations.
const priorTheme=window.nextApplyTheme,priorAppearance=window.bu43AppearanceView,prior43=window.bu43AfterRender;
function applyAccent(){
  const draft=view==='settingsDetail' && nextSettingCategory==='appearance' ? bu43AppearanceDraft:null;
  const idx=Number(draft?.theme ?? S.theme ?? 0);
  const color=T[idx]?.[1]||T[0][1];
  document.documentElement.style.setProperty('--acc',color);
  const size=Number(draft?.fs ?? S.fs ?? 1);
  const pixels=[14,16,19,22][Math.max(0,Math.min(3,size))]||16;
  document.documentElement.style.setProperty('--bu48-ui-font',pixels+'px');
  document.documentElement.style.setProperty('--fz',pixels+'px');
}
window.nextApplyTheme=function(){priorTheme();applyAccent();};
window.bu43AfterRender=function(){prior43();applyAccent();};
window.bu48SaveThemeCombo=function(){
  const d=bu43AppearanceDraft;if(!d)return;
  const name=prompt('Name deiner Theme-Kombination:','Mein Theme');if(name===null||!name.trim())return;
  ALL.bu48ThemeCombos??=[];
  ALL.bu48ThemeCombos.push({id:freshId(),name:name.trim().slice(0,45),nextTheme:d.nextTheme,mode:d.mode,theme:d.theme,paper:d.paper,fs:d.fs});
  persist();render();toast('Theme-Kombination gespeichert.');
};
window.bu48ApplyThemeCombo=function(id){
  const entry=(ALL.bu48ThemeCombos||[]).find(x=>listId(x.id)===listId(id));if(!entry)return;
  for(const key of ['nextTheme','mode','theme','paper','fs'])bu43AppearanceDraft[key]=entry[key];
  render();toast('Vorschau aktiv – Änderungen speichern, um sie zu übernehmen.');
};
window.bu48DeleteThemeCombo=function(id){
  ALL.bu48ThemeCombos=(ALL.bu48ThemeCombos||[]).filter(x=>listId(x.id)!==listId(id));persist();render();
};
window.bu43AppearanceView=function(){
  const base=priorAppearance(),combos=ALL.bu48ThemeCombos||[];
  const extra='<section class="bu48-custom-themes"><h3>Eigene Kombinationen</h3><p class="hint">Kombiniere jede Theme-Vorlage mit deinen Akzentfarben und deiner Schriftgröße. Speichere die Kombination als eigenes Preset.</p><button class="btn o" onclick="bu48SaveThemeCombo()">＋ Aktuelle Kombination merken</button><div class="bu48-combo-list">'+combos.map(c=>'<div class="bu48-combo"><span class="bu48-combo-dot" style="background:'+safe(T[c.theme]?.[1]||'#999')+'"></span><b>'+safe(c.name)+'</b><button class="chip" onclick="bu48ApplyThemeCombo('+JSON.stringify(listId(c.id)).replace(/"/g,'&quot;')+')">Anwenden</button><button class="chip" onclick="bu48DeleteThemeCombo('+JSON.stringify(listId(c.id)).replace(/"/g,'&quot;')+')">Löschen</button></div>').join('')+'</div></section>';
  return base.replace('<div class="bu43-ap-actions">',extra+'<div class="bu43-ap-actions">');
};

// Persist a default reading list, selected in settings. No automatic owned-book conversion.
if(typeof NEXT_SETTINGS!=='undefined' && !NEXT_SETTINGS.some(x=>x[0]==='discoverList')) {
  const i=NEXT_SETTINGS.findIndex(x=>x[0]==='goodreads');
  NEXT_SETTINGS.splice(Math.max(0,i),0,['discoverList','Entdecken · Standard-Leseliste','▤','Ziel für neue Bücher aus Entdecken']);
}
const prevSettings=window.nextSettingsDetail;
window.nextSettingsDetail=function(){
  if(nextSettingCategory!=='discoverList')return prevSettings();
  const selected=listId(ALL.bu48DiscoverList||'');
  const options=readLists().map(l=>{
    const value=safe(listId(l.id));
    return '<label class="bu48-default-choice"><input type="radio" name="bu48-default" value="'+value+'" '+(selected===listId(l.id)?'checked':'')+' onchange="bu48SetDefaultList(this.value)"> <span>'+safe(l.name)+'</span><small>'+(l.items||[]).length+' Bücher</small></label>';
  }).join('');
  return bar('Standard-Leseliste','settings')+'<section class="bu48-default-page"><span class="next-overline">BOOKSUP DISCOVER</span><h1>Ziel-Leseliste festlegen</h1><p>Bei einem Buch aus „Entdecken“ kannst du es mit einem Klick zu deiner bevorzugten Leseliste hinzufügen. Bei Bedarf kannst du weiterhin eine andere Liste auswählen.</p><div class="bu48-default-grid"><label class="bu48-default-choice"><input type="radio" name="bu48-default" value="" '+(!selected?'checked':'')+' onchange="bu48SetDefaultList(\'\')"> Immer nachfragen</label>'+options+'</div><button class="btn o" onclick="buNewList()">Neue Leseliste anlegen</button></section>';
};
window.bu48SetDefaultList=function(id){ALL.bu48DiscoverList=id;persist();toast(id?'Standard-Leseliste gespeichert.':'Du wählst das Ziel wieder für jedes Buch selbst.');};
const oldChooseList=window.bu46ChooseList;
window.bu46ChooseList=function(index){
  const target=listById(ALL.bu48DiscoverList);
  if(!target)return oldChooseList(index);
  return window.bu46AddToList(index,target.id);
};
const oldBookInfo=window.bu46BookInfo;
window.bu46BookInfo=function(){
  const original=oldBookInfo();
  const b=bu46FocusBook;if(!b)return original;
  const idx=bu46SearchResults.indexOf(b);
  if(idx<0)return original;
  const selected=listById(ALL.bu48DiscoverList);
  return original.replace('</section>','<div class="bu48-discover-target"><p class="hint">Standard-Ziel: '+safe(selected?.name||'keine Leseliste ausgewählt')+'</p><button class="chip" onclick="bu48ChooseAnotherList('+idx+')">Andere Liste wählen …</button></div></section>');
};
window.bu48ChooseAnotherList=function(i){return oldChooseList(i);};

// Network lookups must use the restricted Electron main-process IPC, not CORS-dependent renderer fetch.
const state=new Map();
const valid13=s=>{s=String(s||'').replace(/[^0-9]/g,'');if(!/^\d{13}$/.test(s))return false;let n=0;for(let i=0;i<13;i++)n+=Number(s[i])*(i%2?3:1);return n%10===0;};
const to13=v=>{
  let s=String(v||'').replace(/[^0-9X]/gi,'').toUpperCase();
  if(valid13(s))return s;
  if(!/^\d{9}[\dX]$/.test(s))return '';
  let n=0;for(let i=0;i<10;i++)n+=(10-i)*(s[i]==='X'?10:Number(s[i]));
  if(n%11!==0)return '';
  s='978'+s.slice(0,9);let total=0;
  for(let i=0;i<12;i++)total+=Number(s[i])*(i%2?3:1);
  return s+String((10-total%10)%10);
};
function scoreBook(c,b){
  if(b.isbn && c.isbn && to13(b.isbn)===to13(c.isbn))return 120;
  if(!c.title||!b.title)return 0;
  const a=norm48(c.title),target=norm48(b.title);
  let score=a===target?65:(a.includes(target)||target.includes(a))&&Math.min(a.length,target.length)>=10?46:0;
  if(!score){const words=new Set(a.split(' ').filter(x=>x.length>2)),wanted=new Set(target.split(' ').filter(x=>x.length>2));let hits=0;for(const w of wanted)if(words.has(w))hits++;score=Math.round(45*hits/Math.max(wanted.size,words.size,1));}
  if(b.author && c.author){
    const author=norm48(b.author),actual=norm48(c.author);
    if(author===actual||author.includes(actual)||actual.includes(author))score+=18;
  }
  if(c.language==='de'||c.language==='ger')score+=5;
  if(b.isbn&&to13(b.isbn)===to13(c.isbn))score+=35;
  return score;
}
function googleCandidates(rows){
  const items=[];
  for(const row of rows){
    const v=row.volumeInfo||{},meta=metadataGoogle(v,row);
    const identifiers=(v.industryIdentifiers||[]).map(x=>to13(x.identifier)).filter(Boolean);
    items.push({...meta,title:v.title||'',author:(v.authors||[]).join(', '),description:v.description||'',year:v.publishedDate||'',language:v.language||'',isbn:identifiers[0]||'',publisher:v.publisher||'',cover:meta.cover||'',pages:v.pageCount||'',source:'Google Books'});
  }
  return items;
}
function openCandidates(rows){
  const items=[];
  for(const x of rows){
    const editions=x.editions?.docs||[],e=editions.find(z=>(z.isbn_13||[]).some(valid13))||editions[0]||{};
    const isbn=(e.isbn_13||[]).map(to13).find(Boolean)||(e.isbn_10||[]).map(to13).find(Boolean)||'';
    items.push({title:e.title||x.title||'',author:(x.author_name||[]).join(', '),isbn,language:e.language?.[0]||x.language?.[0]||'',year:e.publish_date||x.first_publish_year||'',publisher:e.publisher?.[0]||x.publisher?.[0]||'',genre:x.subject?.[0]||'',tags:(x.subject||[]).slice(0,7).join(', '),cover:x.cover_i?'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg':'',source:'Open Library',series:'',description:''});
  }
  return items;
}
function dnbCandidates(xml){
  if(!xml || typeof xml!=='string')return [];
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.getElementsByTagName('parsererror').length)return [];
  const out=[];
  for(const r of doc.getElementsByTagNameNS('*','record')){
    const fields=[...r.getElementsByTagNameNS('*','datafield')];if(!fields.length)continue;
    const get=(tag,sub)=>{for(const field of fields)if(field.getAttribute('tag')===tag){const el=[...field.getElementsByTagNameNS('*','subfield')].find(x=>x.getAttribute('code')===sub);if(el)return el.textContent.trim();}return '';};
    const isbn=to13(get('020','a'));
    const title=get('245','a').replace(/[\s\/:]+$/,'');
    if(!title)continue;
    out.push({title,author:get('100','a').replace(/[,.:;]+$/,''),isbn,publisher:get('264','b')||get('260','b'),year:get('264','c')||get('260','c'),pages:parseInt(get('300','a'),10)||'',language:'de',source:'Deutsche Nationalbibliothek'});
  }
  return out;
}
function sortedCandidates(book,results){
  const items=[...googleCandidates(results.google||[]),...openCandidates(results.open||[]),...(results.dnb||[])];
  const seen=new Set();
  return items.map(x=>({...x,score:scoreBook(x,book)})).filter(x=>x.score>=48)
    .sort((a,b)=>b.score-a.score)
    .filter(x=>{const key=candidateKey(x)+'|'+to13(x.isbn)+'|'+x.source;if(seen.has(key))return false;seen.add(key);return true;});
}
const currentBook=id=>[...S.books,...bu45Extra()].find(x=>listId(x.id)===listId(id));
async function search48(book) {
  const provider=window.booksupCatalog;
  if(!provider?.search)throw Error('Windows-Katalogdienst fehlt. Bitte Windows-Version 4.8 installieren.');
  const raw=await provider.search({title:book.title,author:book.author,isbn:book.isbn});
  let dnb=[];
  try {
    const data=book.isbn?await window.booksupDnb?.isbn?.(book.isbn):await window.booksupDnbTitle?.search?.(book.title);
    dnb=dnbCandidates(data);
  }catch(e){raw.errors.push('DNB: '+(e.message||e));}
  return {candidates:sortedCandidates(book,{...raw,dnb}),errors:raw.errors||[]};
}
window.bu48LookupResults=new Map();
window.bu48Lookup=async function(id,opts={}){
  const key=listId(id),book=currentBook(id);if(!book)return null;
  if(state.has(key))return state.get(key);
  const work=(async()=>{
    try{
      if(!book.title && !book.isbn)throw Error('Bitte zuerst Titel oder ISBN eintragen.');
      const {candidates,errors}=await search48(book);
      const suggestions=[...new Map(candidates.filter(c=>to13(c.isbn)).map(c=>[to13(c.isbn),c])).values()];
      const merged={candidates,suggestions,errors};
      window.bu48LookupResults.set(key,merged);
      let changes=0;
      // Keep every manually-entered value untouched. No guessed ISBN when editions differ.
      for(const x of candidates){
        for(const field of ['author','genre','tags','publisher','year','pages','language','description','series','seriesNumber']){
          if((book[field]===undefined||book[field]===null||book[field]==='')&&x[field]!==undefined&&x[field]!==null&&x[field]!==''){book[field]=x[field];changes++;}
        }
        if(!book.cover && !(book.covers||[]).length && /^https:\/\//.test(x.cover||'')){book.covers=[x.cover];changes++;}
      }
      if(!to13(book.isbn)&&suggestions.length===1 && suggestions[0].score>=70) {
        book.isbn=to13(suggestions[0].isbn);changes++;
      }
      book.metadataCheckedAt=Date.now();
      book.metadataSources=[...new Set([...(book.metadataSources||[]),...candidates.map(x=>x.source)])];
      persist();
      if(!opts.silent && view==='detail')render();
      if(!opts.silent)toast(changes?changes+' Buchangaben ergänzt. '+(to13(book.isbn)?'ISBN gefunden.':'ISBN-Ausgabe bitte prüfen.'):(errors.length&& !candidates.length?'Buchdatenquellen nicht erreichbar.':'Keine eindeutigen neuen Daten gefunden.'));
      return merged;
    }catch(e){if(!opts.silent)toast('Metadatensuche: '+String(e.message||e));return {candidates:[],suggestions:[],errors:[String(e.message||e)]};}
    finally{state.delete(key);}
  })();
  state.set(key,work);
  return work;
};
window.bu47EnrichOwnedBook=async function(id,silent=false){return window.bu48Lookup(id,{silent});};
window.bu46EnrichBook=async function(id){return window.bu48Lookup(id,{silent:false});};
window.bu48SelectIsbn=function(id,isbn,watch=false){
  const book=currentBook(id),clean=to13(isbn);
  if(!book||!clean)return;
  book.isbn=clean;
  if(book.type==='physical' && Array.isArray(book.editions) && book.editions.length===1)book.editions[0].isbn=clean;
  persist();modal=null;render();toast('ISBN der ausgewählten Ausgabe gespeichert.');
  if(watch)window.bu44WatchPrompt(book);
};
window.bu48IsbnChooser=async function(id,watch=false){
  const book=currentBook(id);if(!book)return;
  toast('Suche passende ISBN-Ausgaben …');
  const data=await window.bu48Lookup(id,{silent:true});
  const opts=data?.suggestions||[];
  if(!opts.length){
    alert('Keine verifizierbare ISBN gefunden.\n'+(data?.errors||[]).slice(0,2).join('\n')+'\nBitte ISBN bei Bedarf manuell eingeben.');
    return;
  }
  modal='<h3>ISBN-Ausgabe auswählen</h3><p class="hint">Wichtig für MediMops: Sprache und Ausgabe müssen exakt passen. Eine andere Übersetzung oder Sonderausgabe kann einen anderen Preis haben.</p>'+
    opts.slice(0,18).map(x=>'<button class="next-setting-row" onclick="bu48SelectIsbn('+JSON.stringify(listId(id)).replace(/"/g,'&quot;')+','+JSON.stringify(to13(x.isbn))+','+Boolean(watch)+')"><b>'+safe(to13(x.isbn))+'</b><small>'+safe([x.source,x.language,x.publisher,x.year].filter(Boolean).join(' · '))+'</small></button>').join('')+
    '<button class="chip" onclick="modal=null;render()">Abbrechen</button>';
  render();
};
const oldWatchPrompt=window.bu44WatchPrompt;
window.bu44WatchPrompt=function(book){
  if(to13(book?.isbn))return oldWatchPrompt(book);
  if(book?.id!=null)return window.bu48IsbnChooser(book.id,true);
  return alert('Bitte erst die ISBN-Ausgabe im Bücherregal auswählen.');
};
function metadataControls(){
  if(view!=='detail')return;
  const area=document.querySelector('.next-book-information');if(!area)return;
  if(!area.querySelector('.bu48-isbn-cta')){
    const box=document.createElement('div');box.className='bu48-metadata-actions';
    box.innerHTML='<button class="btn o" id="bu48-refresh-meta">Google Books / DNB / Open Library durchsuchen</button><button class="btn o bu48-isbn-cta" id="bu48-choose-isbn">ISBN-Ausgabe auswählen</button><p class="hint" id="bu48-meta-status"></p>';
    area.appendChild(box);
    box.querySelector('#bu48-refresh-meta').addEventListener('click',async()=>{const s=document.getElementById('bu48-meta-status');if(s)s.textContent='Suche läuft …';const res=await window.bu48Lookup(cur,{silent:false});const t=document.getElementById('bu48-meta-status');if(t)t.textContent=res?.errors?.length?'Quellen-Hinweise: '+res.errors.join(' | '):'Suche abgeschlossen.';});
    box.querySelector('#bu48-choose-isbn').addEventListener('click',()=>window.bu48IsbnChooser(cur));
  }
}
function wireDeleteButtons(){
  document.querySelectorAll('.bu48-delete-entry').forEach(btn=>{
    if(btn.dataset.bound)return;btn.dataset.bound='1';
    btn.addEventListener('click',()=>stableDelete(decodeURIComponent(btn.dataset.bu48List||''),decodeURIComponent(btn.dataset.bu48Item||'')));
  });
}
function fixNewsLabel(){
  document.querySelectorAll('.next-nav-item').forEach(btn=>{
    if(btn.dataset.buNav!=='news')return;
    const words=btn.querySelector('span:last-child');if(words)words.textContent='News';
    btn.setAttribute('aria-label','News');
  });
}
document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a'){
    const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA'].includes(tag))return;
    e.preventDefault();
    const endpoint=String(window.BOOKSUP_ADMIN_API_URL||'').replace(/\/+$/,'');
    if(!/^https:\/\//.test(endpoint)){
      alert('BooksUp-Admin: Der OAuth-Worker ist noch nicht eingerichtet.\nÖffne admin-worker/README.md im GitHub-Repository und konfiguriere Cloudflare Worker, GitHub OAuth und die öffentliche Worker-URL.');
      return;
    }
    window.open(endpoint+'/auth/login','_blank','noopener,noreferrer');
  }
});
// Keep everything in the Windows injection layer; do not touch Android assets.
const oldAfter=window.nextAfterRender;
window.nextAfterRender=function(){
  oldAfter();
  applyAccent();wireDeleteButtons();fixNewsLabel();metadataControls();
};
render();
})();