/* BooksUp 5.0 – metadata, translations and update controls. Loaded after 5.0 core. */
(function(){
'use strict';
const e=v=>esc(v==null?'':String(v));
const m=()=>window.Capacitor?.getPlatform?.() === 'android';
const strip=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,7000);
const isISBN=v=>/^(?:\d{13}|\d{9}[\dX])$/i.test(String(v||'').replace(/[^0-9X]/gi,''));
function book(id){return [...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));}
const beforeEnrich=window.bu48Lookup;
window.bu48Lookup=async function(id,opts={}){
 const b=book(id);if(!b)return null;
 const result=await beforeEnrich.apply(this,arguments);
 const candidates=(result?.candidates||[]).filter(c=>c.score>=65);
 let changed=false;
 if(candidates.length){
  const strongest=candidates[0];
  // Accurate edition match is mandatory before ISBN is automatically assigned.
  if(!b.isbn&&result.suggestions?.length===1&&strongest.score>=87&&strongest.isbn){b.isbn=strongest.isbn;changed=true;}
  if(!b.description&&strongest.description){b.description=strip(strongest.description);changed=true;}
  for(const k of ['publisher','pages','year','genre','language'])if(!b[k]&&strongest[k]){b[k]=strongest[k];changed=true;}
 }
 if(!b.description && candidates.some(x=>x.source==='Open Library')){
  // Search API omits descriptions; fetch the book's work record only when a unique title matches.
  // This call is optional; Google metadata and manual editing remain available offline.
  const url='https://openlibrary.org/search.json?title='+encodeURIComponent(b.title||'')+(b.author?'&author='+encodeURIComponent(b.author):'')+'&limit=3&fields=key,title,author_name';
  try{
   const open=window.Capacitor?.Plugins?.CapacitorHttp;
   const result=open?.get?await open.get({url,connectTimeout:8000,readTimeout:8000}):{data:await (await fetch(url)).json()};
   const rows=typeof result.data==='string'?JSON.parse(result.data).docs||[]:result.data.docs||[];
   const match=rows.find(x=>buNorm(x.title)===buNorm(b.title));
   if(match?.key&&/^\/works\/OL\d+W$/.test(match.key)){
    const uri='https://openlibrary.org'+match.key+'.json';
    const detail=open?.get?await open.get({url:uri,connectTimeout:8000,readTimeout:8000}):{data:await (await fetch(uri)).json()};
    const doc=typeof detail.data==='string'?JSON.parse(detail.data):detail.data;
    const d=typeof doc.description==='string'?doc.description:doc.description?.value||'';
    if(d){b.description=strip(d);changed=true;}
   }
  }catch(e){console.debug('Optional Open Library description:',String(e.message||e));}
 }
 if(changed){persist();if(view==='detail'||view==='libraryDetail')render();}
 return result;
};
window.bu50EditBlurb=function(id){
 const b=book(id);if(!b)return;
 const text=prompt('Klappentext / Beschreibung bearbeiten:',b.description||'');
 if(text===null)return;b.description=text.trim().slice(0,7000);persist();render();
};
const beforeDetails=window.nextBookDetails;
window.nextBookDetails=function(){
 const html=beforeDetails.apply(this,arguments);
 const b=S.books.find(x=>String(x.id)===String(cur));if(!b)return html;
 return html.replace('<h2>Über das Buch</h2>','<h2>Über das Buch</h2><h3>Klappentext</h3><p class="bu50-blurb">'+e(b.description||'Noch kein Klappentext vorhanden. Die Online-Suche kann ihn ergänzen.')+'</p><div class="row"><button class="chip" onclick="bu50EditBlurb('+Number(b.id)+')">Klappentext bearbeiten</button><button class="chip" onclick="bu48Lookup('+Number(b.id)+',{silent:false})">Klappentext online suchen</button></div>');
};
// When Discover queries are blocked by WebView CORS, use the same native catalog gateway as owned-book enrichment.
const searchPrev=window.bu46Search;
window.bu46Search=async function(term,reset=true){
 if(!window.booksupCatalog?.search)return searchPrev.apply(this,arguments);
 const cleaned=String(term||'').trim();if(cleaned.length<2)return toast('Bitte mindestens 2 Zeichen eingeben.');
 const token=++bu46SearchSeq;
 if(reset){bu46SearchTerm=cleaned;bu46SearchResults=[];}
 bu46SearchBusy=true;const status=document.getElementById('bu46-search-status');if(status)status.textContent='Suche Google Books und Open Library …';
 try{
  const raw=await window.booksupCatalog.search({title:cleaned,isbn:isISBN(cleaned)?cleaned:''});
  if(token!==bu46SearchSeq)return;
  const books=[];
  for(const item of raw.google||[]){const v=item.volumeInfo||{};if(!v.title)continue;books.push({...metadataGoogle(v,item),description:strip(v.description),author:(v.authors||[]).join(', '),year:v.publishedDate||'',publisher:v.publisher||'',source:'google'});}
  for(const x of raw.open||[]){
   if(!x.title)continue;
   books.push({title:x.title,author:(x.author_name||[]).join(', '),isbn:(x.isbn||[])[0]||'',year:x.first_publish_year||'',genre:(x.subject||[])[0]||'',cover:x.cover_i?'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg':'',source:'openlibrary'});
  }
  const seen=new Set();bu46SearchResults=books.filter(b=>{
   if(typeof bu46Allowed==='function'&&!bu46Allowed(b))return false;
   const k=buNorm(b.title)+'|'+buNorm(b.author);if(!k||seen.has(k))return false;seen.add(k);return true;
  }).slice(0,70);
  if(view==='discoverSearch'){
   const container=document.getElementById('bu46-search-items');
   if(container)container.innerHTML=bu46SearchResults.map((b,i)=>bu46SearchCard(b,i)).join('');
   if(status)status.textContent=bu46SearchResults.length+' Ergebnisse'+(raw.errors?.length?' · einzelne Quellen nicht erreichbar':'');
   bu43LoadCovers();buTranslateUI();
  }
 }catch(error){if(status)status.textContent='Online-Buchsuche nicht erreichbar: '+(error.message||error);}
 finally{if(token===bu46SearchSeq)bu46SearchBusy=false;}
};
const oldBookInfo=window.bu46BookInfo;
window.bu46BookInfo=function(){const page=oldBookInfo.apply(this,arguments),b=bu46FocusBook;if(!b)return page;
 return page.replace('</section>','<div class="bu50-discover-blurb"><h3>Klappentext</h3><p>'+e(b.description||'Für dieses Buch wurde noch kein Klappentext gefunden.')+'</p></div></section>');
};
// Extend text translations while retaining all original dictionaries; no silent single-language fallback.
const words={
 'Klappentext':['Book description','Quatrième de couverture','Sinopsis','Quarta di copertina'],
 'Klappentext bearbeiten':['Edit description','Modifier le résumé','Editar sinopsis','Modifica descrizione'],
 'Klappentext online suchen':['Search book description','Rechercher le résumé','Buscar sinopsis','Cerca descrizione'],
 'Leselisten verwalten':['Manage reading lists','Gérer les listes','Gestionar listas','Gestisci liste'],
 'Geräte direkt verbinden':['Connect devices directly','Connecter les appareils','Conectar dispositivos','Collega dispositivi'],
 '100 Schriftarten':['100 fonts','100 polices','100 fuentes','100 caratteri'],
 'Schriftarten':['Fonts','Polices','Fuentes','Caratteri'],
 'Persönlicher Hintergrund':['Custom background','Fond personnalisé','Fondo personalizado','Sfondo personale'],
 'Bild auswählen':['Choose image','Choisir une image','Elegir imagen','Scegli immagine'],
 'Bild entfernen':['Remove image','Supprimer l’image','Quitar imagen','Rimuovi immagine'],
 'Profil bearbeiten':['Edit profile','Modifier le profil','Editar perfil','Modifica profilo'],
 'Profileinstellungen':['Profile settings','Paramètres du profil','Ajustes de perfil','Impostazioni profilo'],
 'Leselisten':['Reading lists','Listes de lecture','Listas de lectura','Liste di lettura'],
 'Entdecken':['Discover','Découvrir','Descubrir','Scopri'],
 'Bücherregal':['Bookshelf','Étagère','Estantería','Scaffale'],
 'Bibliothek':['Library','Bibliothèque','Biblioteca','Biblioteca'],
 'Darstellung':['Appearance','Apparence','Apariencia','Aspetto'],
 'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
 'Datensicherung':['Backup','Sauvegarde','Copia de seguridad','Backup'],
 'Sprache':['Language','Langue','Idioma','Lingua'],
 'Benachrichtigungen':['Notifications','Notifications','Notificaciones','Notifiche'],
 'Mehrere auswählen':['Select multiple','Sélection multiple','Selección múltiple','Seleziona più'],
 'Entfernen':['Remove','Supprimer','Eliminar','Rimuovi'],
 'Speichern':['Save','Enregistrer','Guardar','Salva'],
 'Bücher hinzufügen':['Add books','Ajouter des livres','Añadir libros','Aggiungi libri'],
 'News':['News','Actualités','Noticias','Notizie'],
 'Favoriten':['Favorites','Favoris','Favoritos','Preferiti'],
 'Änderungsverlauf':['Changelog','Historique','Cambios','Registro modifiche'],
 'Auf Updates prüfen':['Check for updates','Vérifier les mises à jour','Buscar actualizaciones','Verifica aggiornamenti'],
 'Direkt verbinden – ohne Server':['Connect directly – no server','Connexion directe – sans serveur','Conexión directa – sin servidor','Connessione diretta – senza server'],
 'Gerät A: Angebot erstellen':['Device A: Create offer','Appareil A : créer une offre','Dispositivo A: crear oferta','Dispositivo A: crea offerta'],
 'Gerät B: Angebot beantworten':['Device B: Answer offer','Appareil B : répondre','Dispositivo B: responder','Dispositivo B: rispondi'],
 'Kombination dauerhaft speichern':['Save combination','Enregistrer la combinaison','Guardar combinación','Salva combinazione'],
 'Meine Bücher':['My books','Mes livres','Mis libros','I miei libri'],
 'Zum Bücherregal hinzufügen':['Add to bookshelf','Ajouter à l’étagère','Añadir a estantería','Aggiungi allo scaffale'],
 'Nachrichten':['News','Actualités','Noticias','Notizie'],
 'Bearbeiten':['Edit','Modifier','Editar','Modifica'],
 'Löschen':['Delete','Supprimer','Eliminar','Elimina'],
 'Weiterlesen':['Continue reading','Continuer la lecture','Seguir leyendo','Continua a leggere'],
 'Gelesene Bücher':['Finished books','Livres lus','Libros leídos','Libri letti'],
 'Suchen':['Search','Chercher','Buscar','Cerca'],
 'Abbrechen':['Cancel','Annuler','Cancelar','Annulla'],
 'Schließen':['Close','Fermer','Cerrar','Chiudi']
};
const previousTranslate=window.buTranslate;
window.buTranslate=function(text,lang){
 const k=String(text||'').trim(),list=words[k],ix={en:0,fr:1,es:2,it:3}[lang];
 if(list&&ix!==undefined)return list[ix];
 return previousTranslate(text,lang);
};
const previousChangelog=window.bu49ChangelogView;
window.bu49ChangelogView=function(){
 const existing=previousChangelog.apply(this,arguments);
 const entry='<article class="bu49-version"><small>Android &amp; Windows</small><h2>BooksUp 5.0.0</h2><p>100 Schriftarten, gespeicherte Designkombinationen, gerätebezogene Hintergrundbilder, Leselistenverwaltung, direkter WebRTC-Datenaustausch, Klappentexte und überarbeitete App-Updates.</p></article>';
 return existing.replace('<p class="hint"><a href="https://github.com/lavender1510/BooksUp/blob/main/CHANGELOG.md"',entry+'<p class="hint"><a href="https://github.com/lavender1510/BooksUp/blob/main/CHANGELOG.md"');
};
const prevShell=window.nextShell;
window.nextShell=function(html){
 const original=prevShell.apply(this,arguments);
 return original.replace('onclick="go(\'transfer\')"','onclick="nextChooseSettings(\'devices\')"');
};
})();
