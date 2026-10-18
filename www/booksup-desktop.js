/* BooksUp desktop workspace - no changes to Android/mobile profile design */
function bu45DesktopInsights(){
 const books=[...ALL.book.books,...ALL.manga.books],records=[...ALL.book.log,...ALL.manga.log];
 const num=x=>Number(x)||0,done=books.filter(b=>!!b.finished).length;
 const totalMinutes=records.reduce((s,x)=>s+num(x.mins),0),totalPages=records.reduce((s,x)=>s+num(x.pages),0);
 const days=Array.from({length:14},(_,i)=>{const d=new Date(Date.now()-(13-i)*86400000),key=d.toISOString().slice(0,10);return {key,label:d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),mins:records.filter(x=>String(x.date||'').slice(0,10)===key).reduce((s,x)=>s+num(x.mins),0)}});
 const max=Math.max(1,...days.map(x=>x.mins)),genres=new Map();
 for(const b of books){const g=b.genre||'Ohne Genre';genres.set(g,(genres.get(g)||0)+1)}
 const topGenres=[...genres.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7);
 const counts=bu45AllLists().map(l=>({name:l.name,total:(l.items||[]).length}));
 return bar('Analyse','home')+'<section class="bu45-workspace"><header class="bu45-pagehead"><div><span class="next-overline">BOOKSUP / DESKTOP INSIGHTS</span><h1>Deine Leseanalyse</h1><p>Alle Profile auf einen Blick – Auswertungen lokal auf diesem Gerät.</p></div><button class="btn o" onclick="go(\'transfer\')">↗ Geräte verbinden</button></header>'+
 '<div class="bu45-stat-grid">'+[['Bücher insgesamt',books.length],['Gelesene Bücher',done],['Lesestunden',Math.round(totalMinutes/60*10)/10],['Gelesene Seiten',totalPages],['Leselisten',bu45AllLists().length]].map(([label,value])=>'<div class="bu45-stat"><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div>'+
 '<div class="bu45-analysis-grid"><section class="card"><h2>Leseminuten · letzte 14 Tage</h2><div class="bu45-chart">'+days.map(d=>'<div title="'+d.label+': '+d.mins+' Minuten"><div class="bu45-chart-column" style="height:'+Math.max(2,Math.round(d.mins/max*100))+'%"></div><small>'+d.label.slice(0,2)+'</small></div>').join('')+'</div></section>'+
 '<section class="card"><h2>Genres</h2>'+topGenres.map(([g,c])=>'<div class="bu45-genre"><span>'+esc(g)+'</span><strong>'+c+'</strong><div class="bu45-progress"><span style="width:'+Math.round(c/Math.max(1,books.length)*100)+'%"></span></div></div>').join('')+'</section>'+
 '<section class="card"><h2>Leselisten im Vergleich</h2>'+counts.map(x=>'<div class="bu45-genre"><span>'+esc(x.name)+'</span><strong>'+x.total+' Bücher</strong><div class="bu45-progress"><span style="width:'+Math.round(x.total/Math.max(1,...counts.map(v=>v.total))*100)+'%"></span></div></div>').join('')+'</section>'+
 '<section class="card"><h2>Mehr über deine Bibliothek</h2><p>Die Bibliothek vereint Bücher aus allen Leselisten. Das Bücherregal enthält deine eigenen Bücher sowie freigegebene Leselisten.</p><button class="btn o" onclick="go(\'library\')">Bibliothek öffnen</button><button class="btn o" onclick="go(\'lists\')">Leselisten verwalten</button></section></div></section>';
}
function bu45TransferHub(){
 const desktop=!!window.booksupBackupFile;
 return bar('Geräte verbinden','settings')+'<section class="bu45-workspace"><header class="bu45-pagehead"><div><span class="next-overline">BOOKSUP SYNC</span><h1>Daten zwischen Geräten übertragen</h1><p class="hint">Bibliotheken ohne versehentliches Überschreiben sichern und wiederherstellen.</p></div></header><div class="bu45-transfer-grid">'+
 '<div class="card"><h2>1. Backup erstellen</h2><p>Erstellt eine vollständige ZIP-Sicherung mit Buchdateien. Du kannst die Datei anschließend auf ein zweites Gerät übertragen.</p><button class="btn" onclick="backupFull()">ZIP sichern / teilen</button></div>'+
 '<div class="card"><h2>2. Backup übernehmen</h2><p>Öffne auf dem zweiten Gerät die Sicherungsdatei. BooksUp fragt vor dem Ersetzen vorhandener Daten nach.</p><button class="btn o" onclick="restore()">Backup importieren</button></div>'+
 '<div class="card"><h2>3. Google Drive (Android-Beta)</h2><p>Die Cloud-Sicherung benötigt eine gültige Google-OAuth-Konfiguration. Eine vollautomatische Windows-Anmeldung ist noch nicht eingerichtet.</p><button class="btn o" onclick="nextChooseSettings(\'backup\')">Datensicherung öffnen</button></div>'+
 '<div class="card"><h2>Geräteordner</h2><p>'+(desktop?'Windows: Dokumente / BooksUp / Backups':'Android: BooksUp / Backups im app-eigenen Dokumentbereich')+'</p><button class="btn o" onclick="nextChooseSettings(\'backup\')">Automatische Backups konfigurieren</button></div></div></section>';
}

if(window.booksupBackupFile)document.body.classList.add('bu-desktop');
