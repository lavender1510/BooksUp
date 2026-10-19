/* BooksUp 5.0 – shared cross-platform feature layer, loaded last. */
(function(){
'use strict';
if(window.booksupMajor5)return;window.booksupMajor5=true;
const h=v=>esc(v==null?'':String(v));
const m=()=>window.Capacitor?.getPlatform?.()==='android';
const now=()=>Date.now();
const fonts=[
'Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Nunito','Nunito Sans','Raleway','Ubuntu','Source Sans 3','Work Sans','Rubik','Mulish','Manrope','DM Sans','Outfit','Plus Jakarta Sans','Urbanist','Quicksand',
'Karla','Barlow','Barlow Condensed','Cabin','Fira Sans','IBM Plex Sans','Noto Sans','Noto Sans Display','Public Sans','Red Hat Display','Lexend','Assistant','Hind','Arimo','Asap','Josefin Sans','Titillium Web','Exo 2','Sora','Jost',
'Archivo','Archivo Narrow','Dosis','Oxygen','PT Sans','Kanit','Signika','Prompt','Heebo','Overpass','Mukta','Chivo','Varela Round','Catamaran','Yantramanav','Teko','Questrial','Maven Pro','Space Grotesk','Albert Sans',
'Newsreader','Merriweather','Lora','Playfair Display','Libre Baskerville','Crimson Text','EB Garamond','Cormorant Garamond','PT Serif','Noto Serif','Source Serif 4','Bitter','Spectral','Vollkorn','Alegreya','Cardo','Domine','Arvo','Rokkitt',
'Zilla Slab','Roboto Slab','Bree Serif','DM Serif Display','Prata','Fraunces','Literata','Libre Caslon Text','Gelasio','Old Standard TT','Cinzel','Philosopher','Tinos','IBM Plex Serif','Roboto Serif','Lusitana','Unna','Neuton','Yeseva One','Abril Fatface'];
window.bu50Fonts=fonts;
function data(){return ALL.bu50Appearance??(ALL.bu50Appearance={font:'Inter',fontHeading:'Newsreader'});}
function currentDraft(){return bu43AppearanceDraft||bu43ApCapture();}
function comboData(){if(!Array.isArray(ALL.bu48ThemeCombos))ALL.bu48ThemeCombos=[];return ALL.bu48ThemeCombos;}
function selectedFont(){return data().font||'Inter';}
function fontStyle(font){return '"'+String(font).replace(/[^a-zA-Z0-9 ]/g,'')+'", system-ui, sans-serif';}
let fontLoading='';
function applyFont(){
 const val=selectedFont();document.documentElement.style.setProperty('--ss',fontStyle(val));document.documentElement.style.setProperty('--sf',fontStyle(data().fontHeading||val));
 if(fontLoading!==val&&fonts.includes(val)){
  fontLoading=val;
  let l=document.getElementById('bu50-font-css');
  if(!l){l=document.createElement('link');l.rel='stylesheet';l.id='bu50-font-css';document.head.appendChild(l);}
  l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(val).replace(/%20/g,'+')+':wght@400;500;600;700&display=swap';
 }
}
window.bu50SetFont=function(value){
 if(!fonts.includes(value))return;data().font=value;data().fontHeading=value;
 persist();applyFont();render();toast('Schriftart gespeichert: '+value);
};
window.bu50SaveCombo=function(){
 const d=currentDraft(),name=prompt('Name deiner Designkombination:','Mein BooksUp Design');
 if(name===null||!name.trim())return;
 const combo={id:crypto.randomUUID(),name:name.trim().slice(0,60),nextTheme:d.nextTheme||ALL.nextTheme||'standard',mode:Number(d.mode||0),theme:Number(d.theme||0),paper:Number(d.paper||0),fs:Number(d.fs??1),font:selectedFont(),fontHeading:data().fontHeading||selectedFont(),bgFilter:localStorage.getItem('bu50.bgFilter')||'65'};
 comboData().push(combo);persist();render();toast('Designkombination „'+combo.name+'“ gespeichert.');
};
window.bu48SaveThemeCombo=window.bu50SaveCombo;
window.bu50ApplyCombo=function(id){
 const c=comboData().find(x=>String(x.id)===String(id));if(!c)return;
 if(!bu43AppearanceDraft)bu43ApOpen();
 for(const key of ['nextTheme','mode','theme','paper','fs'])if(c[key]!==undefined)bu43AppearanceDraft[key]=c[key];
 if(c.font) {data().font=c.font;data().fontHeading=c.fontHeading||c.font;}
 if(c.bgFilter)localStorage.setItem('bu50.bgFilter',String(c.bgFilter));
 // Applying a named preset commits it, rather than merely changing an unsaved preview.
 bu43ApSave();persist();applyFont();void loadBackground();toast('Kombination „'+c.name+'“ angewendet.');
};
window.bu48ApplyThemeCombo=window.bu50ApplyCombo;
window.bu50DeleteCombo=id=>{ALL.bu48ThemeCombos=comboData().filter(x=>String(x.id)!==String(id));persist();render();};
window.bu48DeleteThemeCombo=window.bu50DeleteCombo;
window.bu50ChooseFont=()=>{const q=document.getElementById('bu50-font-query')?.value?.toLowerCase()||'';
 document.querySelectorAll('.bu50-font-row').forEach(el=>el.hidden=!el.dataset.font.includes(q));};
window.bu50PickBackground=()=>raw('image/jpeg,image/png,image/webp',async f=>{
 if(f.size>12*1024*1024)return toast('Bitte Bild unter 12 MB auswählen.');
 const ok=await put('bu50.background',f);if(!ok)return toast('Speichern des Hintergrunds fehlgeschlagen.');
 await loadBackground();render();toast('Gerätehintergrund gespeichert (nicht im Backup oder Sync).');
});
window.bu50RemoveBackground=async()=>{await put('bu50.background',null);await loadBackground();render();};
window.bu50BgFilter=v=>{localStorage.setItem('bu50.bgFilter',String(Math.max(10,Math.min(95,Number(v)))));applyBackgroundFilter();};
let bgUrl='';
function applyBackgroundFilter(){
 const r=document.documentElement,f=Number(localStorage.getItem('bu50.bgFilter')||65);
 r.style.setProperty('--bu50-bg-tint',String(Math.max(10,Math.min(95,f))/100));
 r.classList.toggle('bu50-has-background',!!bgUrl);
 if(bgUrl)r.style.setProperty('--bu50-bg-image','url("'+bgUrl+'")');
 else r.style.removeProperty('--bu50-bg-image');
}
async function loadBackground(){
 try{const d=await db(),v=await new Promise(ok=>{const r=d.transaction('f').objectStore('f').get('bu50.background');r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null)});
  if(bgUrl)URL.revokeObjectURL(bgUrl);bgUrl=v instanceof Blob?URL.createObjectURL(v):'';applyBackgroundFilter();
 }catch(e){console.warn('Local background',e)}
}
const appearanceBefore=window.bu43AppearanceView;
window.bu43AppearanceView=function(){
 const original=appearanceBefore.apply(this,arguments);
 const rows=fonts.map((f,i)=>'<button class="bu50-font-row'+(f===selectedFont()?' selected':'')+'" data-font="'+h(f.toLowerCase())+'" onclick="bu50SetFont('+JSON.stringify(f).replace(/"/g,'&quot;')+')"><span style="font-family:'+h(fontStyle(f))+'">'+h(f)+'</span><small>'+(i+1)+'/100</small></button>').join('');
 const combos=comboData().map(c=>'<div class="bu50-combo"><b>'+h(c.name)+'</b><small>'+h(c.font||'Inter')+' · '+h(c.nextTheme)+'</small><button class="chip" onclick="bu50ApplyCombo('+JSON.stringify(String(c.id)).replace(/"/g,'&quot;')+')">Anwenden</button><button class="chip" onclick="bu50DeleteCombo('+JSON.stringify(String(c.id)).replace(/"/g,'&quot;')+')">✕</button></div>').join('');
 const block='<section class="bu50-appearance"><h3>100 Schriftarten</h3><p class="hint">Die gewählte Schriftart wird gespeichert und beim Öffnen geladen. Online-Schriften benötigen Internet; offline wird eine Systemschrift verwendet.</p>'+
  '<input id="bu50-font-query" placeholder="Unter 100 Schriftarten suchen …" oninput="bu50ChooseFont()" autocomplete="off">'+
  '<div class="bu50-font-list">'+rows+'</div>'+
  '<h3>Eigene Designkombinationen</h3><p class="hint">Speichert Theme, Akzent, Papier, Schriftart und Farbfilter zusammen.</p><button class="btn" onclick="bu50SaveCombo()">＋ Kombination dauerhaft speichern</button><div class="bu50-combos">'+combos+'</div>'+
  '<h3>Persönlicher Hintergrund (nur dieses Gerät)</h3><p class="hint">Dein Hintergrund wird nur lokal in dieser Installation gespeichert. Andere Geräte erhalten weder das Bild noch eine verkleinerte Kopie.</p>'+
  '<div class="row"><button class="btn o" onclick="bu50PickBackground()">Bild auswählen</button><button class="chip" onclick="bu50RemoveBackground()">Bild entfernen</button></div>'+
  '<label>Theme-Farbfilter / Lesbarkeit <input type="range" min="10" max="95" value="'+Number(localStorage.getItem('bu50.bgFilter')||65)+'" oninput="bu50BgFilter(this.value)"></label></section>';
 return original.replace('<div class="bu43-ap-actions">',block+'<div class="bu43-ap-actions">');
};
// New reading-list management category, deliberately separate from the Bookshelf.
for(const entry of [['readingLists','Leselisten','▤','Leselisten, Regeln und Bücherregal-Sichtbarkeit'],['devices','Geräte direkt verbinden','⇄','Ohne Cloud über ein lokales Netzwerk']]){
 if(!NEXT_SETTINGS.some(x=>x[0]===entry[0]))NEXT_SETTINGS.push(entry);
}
for(const id of ['friends']){const index=NEXT_SETTINGS.findIndex(x=>x[0]===id);if(index>=0)NEXT_SETTINGS.splice(index,1);}
window.bu50ListsSettings=function(){
 const lists=bu45AllLists();
 return bar('Leselisten verwalten','settings')+'<section class="bu50-manage"><h1>Leselisten</h1><p class="hint">Jede Liste verwaltet ihren eigenen Inhalt. Nur explizit aktivierte Listen erscheinen zusätzlich im Bücherregal. Diese Option kauft oder importiert kein Buch.</p><button class="btn" onclick="buNewList()">＋ Neue Leseliste</button>'+
 lists.map(l=>{const id=JSON.stringify(String(l.id)).replace(/"/g,'&quot;');return '<article class="bu50-manage-row"><div><b>'+h(l.name)+'</b><small>'+(l.items||[]).length+' Bücher · '+(l.showInShelf?'Regalvorschau aktiv':'Nur Bibliothek')+'</small></div><label><input type="checkbox" '+(l.showInShelf?'checked':'')+' onchange="bu45ShelfToggle('+id+',this.checked);render()"> Regalvorschau</label><button class="chip" onclick="bu45OpenList('+id+')">Öffnen</button><button class="chip" onclick="bu45OpenListSettings('+id+')">Verwalten</button></article>';}).join('')+
 '<button class="btn o" onclick="go(\'lists\')">Alle Leselisten →</button></section>';
};
const prevSettings=window.nextSettingsDetail;
window.nextSettingsDetail=function(){
 if(nextSettingCategory==='readingLists')return window.bu50ListsSettings();
 if(nextSettingCategory==='devices')return window.bu50PairingView();
 return prevSettings.apply(this,arguments);
};
const prevShelfImports=window.bu45ShelfImports;
window.bu45ShelfImports=function(){
 // Never leak library-only lists; never make wishlist cards look like owned shelf entries.
 if(ALL.bu50ShowListPreview!==true)return '';
 return prevShelfImports();
};
window.bu50ShelfPreview=on=>{ALL.bu50ShowListPreview=!!on;persist();render();};
const prevShelfToolbar=window.bu44ShelfToolbar;
window.bu44ShelfToolbar=function(){
 return prevShelfToolbar()+'<div class="bu50-shelf-privacy"><label><input type="checkbox" '+(ALL.bu50ShowListPreview===true?'checked':'')+' onchange="bu50ShelfPreview(this.checked)"> Vorschau aus aktivierten Leselisten im Bücherregal anzeigen</label></div>';
};
const prevHome=window.home;
window.home=function(){
 return prevHome.apply(this,arguments)
  .replace('onclick="go(\'friends\')"','onclick="go(\'lists\')"')
  .replace(/<b>Freunde<\/b>/,'<b>Leselisten</b>')
  .replace(/<small>\d+ verbunden<\/small>/,'<small>Eigene Sammlungen</small>')
  .replace('onclick="go(\'settings\')"','onclick="bu50ProfileSettings()"')
  .replace(/<b>Einstellungen<\/b>/,'<b>Profileinstellungen</b>')
  .replace(/<small>Design &amp; Backup<\/small>|<small>Design & Backup<\/small>/,'<small>Profil bearbeiten</small>');
};
window.bu50ProfileSettings=function(){go('pedit');};
const previousGo=window.go;
window.go=function(v,id){if(v==='friends'||v==='chat'){toast('Freunde sind vorübergehend deaktiviert.');return;}return previousGo(v,id);};
// Notes and highlights: ensure they survive page rendering and have a visible local UI.
window.bu50SaveReaderNote=function(){
 const b=S.books.find(x=>String(x.id)===String(cur));if(!b)return;
 const text=prompt('Notiz zur aktuellen Buchseite:','');if(text===null||!text.trim())return;
 b.annotations??=[];b.annotations.push({id:crypto.randomUUID(),page:Number(pgNow)||Number(b.page)||1,text:'',comment:text.trim().slice(0,4000),created:now(),type:'note'});
 persist();render();toast('Notiz gespeichert.');
};
window.bu50DeleteReaderNote=function(bookId,index){
 const b=S.books.find(x=>String(x.id)===String(bookId));if(!b||!Number.isInteger(index)||!b.annotations?.[index])return;
 b.annotations.splice(index,1);persist();render();toast('Notiz entfernt.');
};
window.bu50ReaderNotes=function(b){
 return '<div class="bu50-notes"><h3>Markierungen & Notizen</h3><button class="btn o" onclick="bu50SaveReaderNote()">＋ Notiz</button>'+
 (b.annotations||[]).map((a,i)=>'<article class="bu50-note"><strong>Seite '+Number(a.page||1)+(a.rect?' · Markiert':' · Notiz')+'</strong><p>'+h(a.comment||a.text||'Seitenbereich markiert')+'</p><button class="chip" onclick="bu50DeleteReaderNote('+Number(b.id)+','+i+')">Entfernen</button></article>').join('')+'</div>';
};
const origReader=window.nextReader;
window.nextReader=function(){const b=S.books.find(x=>String(x.id)===String(cur));const result=origReader.apply(this,arguments);return b?result+window.bu50ReaderNotes(b):result;};
// Restore notes after a reader rerender; avoid breaking either 4.7 or 4.8 reader overlays.
const oldAfter=window.nextAfterRender;
window.nextAfterRender=function(){
 oldAfter.apply(this,arguments);document.body.classList.toggle('bu50-reader-active',view==='reader');applyFont();applyBackgroundFilter();
 if(view==='reader'&&typeof window.bu47ShowAnnotations==='function')requestAnimationFrame(()=>{try{window.bu47ShowAnnotations()}catch(e){console.debug(e)}});
};
void loadBackground();
applyFont();
})();
