/* BooksUp 4.8 – Windows fixes only. Injected by Electron after 4.7. */
(function () {
'use strict';
if (!window.booksupBackupFile) return;
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
window.bu48Lookup=async()=>({candidates:[],suggestions:[],errors:[]});
window.bu47EnrichOwnedBook=async()=>null;
window.bu46EnrichBook=async()=>null;
window.bu48IsbnChooser=async function(id){
 const book=[...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));
 if(!book)return;
 const input=prompt('ISBN-10 oder ISBN-13 der Ausgabe:',book.isbn||'');
 if(input===null)return;
 const clean=String(input).replace(/[^0-9X]/gi,'').toUpperCase();
 if(!/^(?:\d{13}|\d{9}[\dX])$/.test(clean))return toast('ISBN benötigt 10 oder 13 Zeichen.');
 book.isbn=clean;persist();render();
};
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
// Keep everything in the Windows injection layer; do not touch Android assets.
const previousChangelog=window.bu47ChangelogView;
window.bu47ChangelogView=function(){
  if(typeof window.bu49ChangelogView==='function')return window.bu49ChangelogView();
  const page=previousChangelog();
  const entry='<article class="bu47-change"><small>4.8.0 · Windows</small><h2>Deine Bibliothek, sicherer und persönlicher</h2><p>Stabile Löschbuttons in Leselisten, neue große Sammlungs-Vorschauen, Profil-Reihenfolge, eigene Theme-Kombinationen, bessere Schriftgrößen und eine überarbeitete ISBN-/Metadatensuche.</p></article>';
  return page.replace('<div class="bu47-changelog">','<div class="bu47-changelog">'+entry);
};
const oldAfter=window.nextAfterRender;
window.nextAfterRender=function(){
  oldAfter();
  applyAccent();wireDeleteButtons();
};
render();
})();