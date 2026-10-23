/* BooksUp 5.0 – metadata, translations and update controls. Loaded after 5.0 core. */
(function(){
'use strict';
const e=v=>esc(v==null?'':String(v));
const m=()=>window.Capacitor?.getPlatform?.() === 'android';
const strip=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,7000);
const isISBN=v=>/^(?:\d{13}|\d{9}[\dX])$/i.test(String(v||'').replace(/[^0-9X]/gi,''));
function book(id){return [...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));}
window.bu50EditBlurb=function(id){
 const b=book(id);if(!b)return;
 const text=prompt('Klappentext / Beschreibung bearbeiten:',b.description||'');
 if(text===null)return;b.description=text.trim().slice(0,7000);persist();render();
};
const beforeDetails=window.nextBookDetails;
window.nextBookDetails=function(){
 const html=beforeDetails.apply(this,arguments);
 const b=S.books.find(x=>String(x.id)===String(cur));if(!b)return html;
 return html.replace('<h2>Über das Buch</h2>','<h2>Über das Buch</h2><h3>Klappentext</h3><p class="bu50-blurb">'+e(b.description||'Noch kein Klappentext vorhanden. Du kannst ihn manuell hinzufügen.')+'</p><div class="row"><button class="chip" onclick="bu50EditBlurb('+Number(b.id)+')">Klappentext bearbeiten</button></div>');
};
// When Discover queries are blocked by WebView CORS, use the same native catalog gateway as owned-book enrichment.
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
