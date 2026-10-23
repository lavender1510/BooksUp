/* BooksUp 4.2 – additive UX, real news feed and UI localization.
   Keep all pre-existing app functions and data intact. */
const BU_NEWS_URL='https://raw.githubusercontent.com/lavender1510/BooksUp/main/www/news.json';
let buNewsArticles=[],buNewsUpdated=0,buNewsRequest=0,buNewsLoading=false,buNewsLastError='';
let buLastUiLang='';
const buLangFallback=['de','en','fr','es','it'];
const BU_WORDS={
 'Startseite':['Home','Accueil','Inicio','Home'],
 'Discover':['Discover','Découvrir','Descubrir','Scopri'],
 'Entdecken':['Discover','Découvrir','Descubrir','Scopri'],
 'Bücherregal':['Bookshelf','Bibliothèque','Estantería','Libreria'],
 'Profil':['Profile','Profil','Perfil','Profilo'],
 'Einstellungen':['Settings','Paramètres','Ajustes','Impostazioni'],
 'News':['News','Actualités','Noticias','Notizie'],
 'Nachrichten':['News','Actualités','Noticias','Notizie'],
 'Benachrichtigungen':['Notifications','Notifications','Notificaciones','Notifiche'],
 'Benachrichtigungen und Erinnerungen':['Notifications and reminders','Notifications et rappels','Notificaciones y recordatorios','Notifiche e promemoria'],
 'Leseeinstellungen':['Reading settings','Paramètres de lecture','Ajustes de lectura','Impostazioni di lettura'],
 'Darstellung':['Appearance','Apparence','Apariencia','Aspetto'],
 'Empfehlungen':['Recommendations','Recommandations','Recomendaciones','Consigli'],
 'Empfehlungen steuern':['Manage recommendations','Gérer les recommandations','Gestionar recomendaciones','Gestisci i consigli'],
 'Auf Updates prüfen':['Check for updates','Rechercher des mises à jour','Buscar actualizaciones','Controlla aggiornamenti'],
 'Datensicherung':['Backup','Sauvegarde','Copia de seguridad','Backup'],
 'Datensicherung erstellen':['Create backup','Créer une sauvegarde','Crear copia de seguridad','Crea backup'],
 'Backup mit Büchern (ZIP)':['Full backup (ZIP)','Sauvegarde complète (ZIP)','Copia completa (ZIP)','Backup completo (ZIP)'],
 'Backup laden':['Restore backup','Restaurer la sauvegarde','Restaurar copia','Ripristina backup'],
 'Nur Daten (JSON)':['Data only (JSON)','Données uniquement (JSON)','Solo datos (JSON)','Solo dati (JSON)'],
 'Import':['Import','Importer','Importar','Importa'],
 'Sprache':['Language','Langue','Idioma','Lingua'],
 'Hilfe':['Help','Aide','Ayuda','Aiuto'],
 'Währung':['Currency','Devise','Moneda','Valuta'],
 'Freunde Einstellungen':['Friends settings','Paramètres amis','Ajustes de amigos','Impostazioni amici'],
 'Freunde':['Friends','Amis','Amigos','Amici'],
 'Meine Bücher':['My books','Mes livres','Mis libros','I miei libri'],
 'Mein Profil':['My profile','Mon profil','Mi perfil','Il mio profilo'],
 'Bücher':['Books','Livres','Libros','Libri'],
 'Buch hinzufügen':['Add book','Ajouter un livre','Añadir libro','Aggiungi libro'],
 'Hinzufügen':['Add','Ajouter','Añadir','Aggiungi'],
 'Mehrere auswählen':['Select multiple','Sélection multiple','Selección múltiple','Selezione multipla'],
 'Löschen':['Delete','Supprimer','Eliminar','Elimina'],
 'Abbrechen':['Cancel','Annuler','Cancelar','Annulla'],
 'Speichern':['Save','Enregistrer','Guardar','Salva'],
 'Änderungen speichern':['Save changes','Enregistrer','Guardar cambios','Salva modifiche'],
 'Buchinformationen bearbeiten':['Edit book information','Modifier le livre','Editar información','Modifica informazioni'],
 'Über das Buch':['About the book','À propos du livre','Sobre el libro','Informazioni sul libro'],
 'Notizen':['Notes','Notes','Notas','Note'],
 'Weitere Buchoptionen':['More book options','Plus d’options','Más opciones','Altre opzioni'],
 'Leselisten':['Reading lists','Listes de lecture','Listas de lectura','Liste di lettura'],
 'Meine Leselisten':['My reading lists','Mes listes','Mis listas','Le mie liste'],
 'Alle':['All','Tous','Todos','Tutti'],
 'Digital':['Digital','Numérique','Digital','Digitale'],
 'Physisch':['Physical','Physique','Físico','Fisico'],
 'Lesen starten':['Start reading','Commencer la lecture','Empezar a leer','Inizia a leggere'],
 'Lesen':['Read','Lire','Leer','Leggi'],
 'Fortschritt':['Progress','Progression','Progreso','Progresso'],
 'Zurück':['Back','Retour','Volver','Indietro'],
 'Weiterlesen':['Continue reading','Continuer à lire','Continuar leyendo','Continua a leggere'],
 'Buchcover':['Book cover','Couverture','Portada','Copertina'],
 'Cover suchen':['Find cover','Chercher une couverture','Buscar portada','Cerca copertina'],
 'Cover selbst auswählen':['Choose cover','Choisir une couverture','Elegir portada','Scegli copertina'],
 'Weitere Cover online':['More covers online','Autres couvertures','Más portadas','Altre copertine'],
 'ISBN scannen / mehrere ISBNs':['Scan ISBNs','Scanner les ISBN','Escanear ISBN','Scansiona ISBN'],
 'Erweiterte Details':['Advanced details','Détails avancés','Detalles avanzados','Dettagli avanzati'],
 'Titel':['Title','Titre','Título','Titolo'],
 'Autor':['Author','Auteur','Autor','Autore'],
 'Erscheinungsjahr':['Publication year','Année de publication','Año de publicación','Anno di pubblicazione'],
 'Genre':['Genre','Genre','Género','Genere'],
 'Tags':['Tags','Mots-clés','Etiquetas','Tag'],
 'Reihe':['Series','Série','Serie','Serie'],
 'Band / Reihenfolge':['Volume / order','Tome / ordre','Tomo / orden','Volume / ordine'],
 'Verlag':['Publisher','Éditeur','Editorial','Editore'],
 'Preis':['Price','Prix','Precio','Prezzo'],
 'UVP / Listenpreis':['List price','Prix public','Precio de lista','Prezzo di listino'],
 'Kaufpreis (tatsächlich bezahlt)':['Purchase price','Prix payé','Precio pagado','Prezzo pagato'],
 'Sprache (z. B. de, en)':['Language (e.g. de, en)','Langue (ex. fr, en)','Idioma (p. ej. es, en)','Lingua (es. it, en)'],
 'Seitenzahl':['Pages','Pages','Páginas','Pagine'],
 'Ausgaben':['Editions','Éditions','Ediciones','Edizioni'],
 'Zustand':['Condition','État','Estado','Condizione'],
 'Gebraucht':['Used','Occasion','Usado','Usato'],
 'Neu':['New','Neuf','Nuevo','Nuovo'],
 'Kaufpreis':['Purchase price','Prix payé','Precio pagado','Prezzo pagato'],
 'Anzahl Exemplare':['Copies','Exemplaires','Ejemplares','Copie'],
 'Lesebeginn':['Start date','Date de début','Fecha de inicio','Data di inizio'],
 'Fertig gelesen am (optional)':['Finished on (optional)','Terminé le (facultatif)','Terminado el (opcional)','Terminato il (facoltativo)'],
 'Keine Treffer':['No results','Aucun résultat','Sin resultados','Nessun risultato'],
 'Suche':['Search','Recherche','Buscar','Cerca'],
 'Titel, ISBN, Autor oder Reihe':['Title, ISBN, author or series','Titre, ISBN, auteur ou série','Título, ISBN, autor o serie','Titolo, ISBN, autore o serie'],
 'Offline':['Offline','Hors ligne','Sin conexión','Offline'],
 'Neu laden':['Refresh','Actualiser','Actualizar','Aggiorna'],
 'Quelle':['Source','Source','Fuente','Fonte'],
 'Zur Originalquelle':['Original article','Article original','Artículo original','Articolo originale'],
 'Newsletter':['Newsletter','Newsletter','Boletín','Newsletter'],
 'Keine Nachrichten verfügbar.':['No news available.','Aucune actualité disponible.','No hay noticias disponibles.','Nessuna notizia disponibile.'],
 'Artikel öffnen':['Open article','Ouvrir l’article','Abrir artículo','Apri articolo'],
 'Verbunden':['Connected','Connecté','Conectado','Connesso'],
 'Jetzt sichern':['Back up now','Sauvegarder','Guardar ahora','Salva ora'],
 'Fertig':['Done','Terminé','Listo','Fatto'],
 'Zur Bibliothek':['To library','Vers la bibliothèque','A la biblioteca','Alla libreria'],
 'System':['System','Système','Sistema','Sistema'],
 'Hell':['Light','Clair','Claro','Chiaro'],
 'Dunkel':['Dark','Sombre','Oscuro','Scuro']
};
function buLocale(){try{return nextLanguage()}catch{return 'de'}}
function buTranslate(text,lang){
 if(lang==='de')return text;
 const a=BU_WORDS[text.trim()]||BU43_WORDS[text.trim()]||BU44_WORDS[text.trim()]||BU45_WORDS[text.trim()]||BU46_WORDS[text.trim()];const index={en:0,fr:1,es:2,it:3}[lang];return a&&index!==undefined?a[index]:text;
}
function buTranslateUI(){
 const lang=buLocale();const root=$('app');if(!root)return;
 root.lang=lang;document.documentElement.lang=lang;
 if(lang==='de')return;
 const skip=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE','SVG']);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement&&!skip.has(n.parentElement.tagName)&&n.nodeValue.trim()&&n.nodeValue.length<150)nodes.push(n)}
 for(const n of nodes){const old=n.nodeValue,trim=old.trim(),tr=buTranslate(trim,lang);if(tr!==trim)n.nodeValue=old.replace(trim,tr)}
 for(const el of root.querySelectorAll('input[placeholder],textarea[placeholder],button[aria-label]')){
  for(const attr of ['placeholder','aria-label']){const val=el.getAttribute(attr);if(val){const tr=buTranslate(val,lang);if(tr!==val)el.setAttribute(attr,tr)}}
 }
}
/* The native click is allowed to settle before a costly DOM render, so first taps register. */
let buNavQueued=null;
function buFastNav(target){
 if(buNavQueued!==null)clearTimeout(buNavQueued);
 document.querySelectorAll('.next-nav-item').forEach(x=>{const isTarget=x.dataset.buNav===target;x.classList.toggle('selected',isTarget);if(isTarget)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});
 if(view===target&&!modal)return;
 buNavQueued=setTimeout(()=>{buNavQueued=null;go(target)},0);
}
function buPolishAfterRender(){buTranslateUI();}
function buScheduleMeta(){/* Manual book details are edited locally. */}
/* Progress is based on completed stages; visual animation is easing-only. */
let buBackupUi=null,buBackupVisual=0,buBackupTarget=0,buBackupFrame=0;
function buBackupStart(){
 buBackupEnd();
 const el=document.createElement('div');el.className='bu-backup-overlay';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.innerHTML='<div class="bu-backup-dialog"><div class="bu-backup-ring" id="bu-backup-ring"><strong id="bu-backup-pct">0%</strong></div><h3>Datensicherung</h3><p>Deine Bibliothek und Dateien werden gesichert. Bitte BooksUp geöffnet lassen.</p></div>';
 document.body.appendChild(el);buBackupUi=el;buBackupVisual=0;buBackupTarget=0;buBackupTick();
}
function buBackupTick(){
 if(!buBackupUi)return;
 buBackupVisual+=(buBackupTarget-buBackupVisual)*.13;
 if(Math.abs(buBackupVisual-buBackupTarget)<.2)buBackupVisual=buBackupTarget;
 const pct=Math.floor(buBackupVisual),ring=document.getElementById('bu-backup-ring'),label=document.getElementById('bu-backup-pct');
 if(ring)ring.style.setProperty('--bu-prog',pct+'%');
 if(label)label.textContent=pct+'%';
 buBackupFrame=requestAnimationFrame(buBackupTick);
}
function buBackupProgress(value){buBackupTarget=Math.max(buBackupTarget,Math.min(100,Number(value)||0))}
function buBackupEnd(){if(buBackupFrame)cancelAnimationFrame(buBackupFrame);buBackupFrame=0;if(buBackupUi)buBackupUi.remove();buBackupUi=null}
