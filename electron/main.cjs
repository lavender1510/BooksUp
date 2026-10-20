'use strict';

const { app, BrowserWindow, protocol, net, shell, session, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { stat, readFile } = require('node:fs/promises');
const fsSync = require('node:fs');
const booksupLan=require('./booksup-lan.cjs');
booksupLan.registerLan(event=>{if(!mainWindow||event.sender!==mainWindow.webContents||!event.senderFrame?.url.startsWith('booksup://booksup/'))throw Error('Unauthorized local pairing');});

// A fixed secure origin keeps IndexedDB and localStorage stable between launches.
protocol.registerSchemesAsPrivileged([{
  scheme: 'booksup',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true }
}]);

const WEB_DIR = path.resolve(__dirname, '..', 'www');
const APP_ORIGIN = 'booksup://booksup';
let mainWindow;

async function serveApp(request) {
  try {
    const url = new URL(request.url);
    if (url.hostname !== 'booksup') return new Response('Forbidden', { status: 403 });
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.includes('\0')) return new Response('Forbidden', { status: 403 });
    const relative = pathname.replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(WEB_DIR, relative);
    const subpath = path.relative(WEB_DIR, file);
    if (subpath.startsWith('..') || path.isAbsolute(subpath)) return new Response('Forbidden', { status: 403 });
    const info = await stat(file);
    if (!info.isFile()) return new Response('Not Found', { status: 404 });
    if (relative === 'index.html' && process.platform === 'win32') {
      const html = await readFile(file, 'utf8');
      return new Response(html.replace("const APP_VERSION='4.6.0';", 'const APP_VERSION=' + JSON.stringify(app.getVersion()) + ';'), {headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    return net.fetch(pathToFileURL(file).href);
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'BooksUp',
    width: 1350, height: 900, minWidth: 780, minHeight: 580,
    backgroundColor: '#f5f0e8',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // User-invoked preview of an imported PDF; never run untrusted Node code.
    if (url.startsWith('blob:booksup://booksup/')) {
      return { action: 'allow', overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
      }};
    }
    if (/^https:\/\//i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(APP_ORIGIN + '/')) return;
    event.preventDefault();
    if (/^https:\/\//i.test(url)) void shell.openExternal(url);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow || mainWindow.isDestroyed() || process.platform !== 'win32') return;
    // Desktop-only UI extension; the Android web bundle stays unchanged.
    const wc = mainWindow.webContents;
    void wc.insertCSS(fsSync.readFileSync(path.join(__dirname, 'booksup-windows-47.css'), 'utf8')).catch(console.error);
    void wc.executeJavaScript(fsSync.readFileSync(path.join(__dirname, 'booksup-windows-47.js'), 'utf8')).then(() => {
      return wc.insertCSS(fsSync.readFileSync(path.join(__dirname, 'booksup-windows-48.css'), 'utf8'));
    }).then(() => wc.executeJavaScript(fsSync.readFileSync(path.join(__dirname, 'booksup-windows-48.js'), 'utf8')))
      .then(async () => {
        for (const name of ['booksup-50.css','booksup-51.css','booksup-52.css','booksup-54-features.css']) await wc.insertCSS(fsSync.readFileSync(path.join(__dirname, '..', 'www', name), 'utf8'));
        for (const name of ['booksup-50.js', 'booksup-50-pair.js', 'booksup-50-services.js','booksup-51.js','booksup-52.js','booksup-53.js','booksup-55.js','booksup-56.js'])
          await wc.executeJavaScript(fsSync.readFileSync(path.join(__dirname, '..', 'www', name), 'utf8'));
      }).catch(console.error);
  });
  mainWindow.loadURL(APP_ORIGIN + '/index.html');
  if (process.env.BOOKSUP_DEVTOOLS === '1') mainWindow.webContents.openDevTools();
}


/* Signed-in user data stays in Electron's existing booksup:// origin during upgrades. */
let updateBusy=false;
const booksupUpdateStatus=(message,percent,progress)=>{if(mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.send('booksup-update:status',{message,percent:percent??null,transferred:Number(progress?.transferred||0),total:Number(progress?.total||0),bytesPerSecond:Number(progress?.bytesPerSecond||0)})};
autoUpdater.on('download-progress',info=>{const pct=Math.round(info.percent||0);booksupUpdateStatus('Lade Update herunter …',pct,info);});
autoUpdater.on('update-not-available',()=>booksupUpdateStatus('BooksUp ist aktuell.',null));
autoUpdater.autoDownload=false;
autoUpdater.autoInstallOnAppQuit=false;
autoUpdater.allowPrerelease=false;
autoUpdater.allowDowngrade=false;
autoUpdater.setFeedURL({provider:'github',owner:'lavender1510',repo:'BooksUp',releaseType:'release'});
autoUpdater.on('update-available', async info=>{
  booksupUpdateStatus('Update verfügbar: '+info.version,null);
  if(!mainWindow||mainWindow.isDestroyed())return;
  const {response}=await dialog.showMessageBox(mainWindow,{
    type:'info',buttons:['Herunterladen','Später'],defaultId:0,cancelId:1,
    title:'BooksUp-Update',message:'BooksUp '+info.version+' ist verfügbar.',
    detail:'Das Update wird heruntergeladen und nach deiner Bestätigung installiert.'
  });
  if(response===0){try{await autoUpdater.downloadUpdate()}catch(e){dialog.showErrorBox('Update konnte nicht geladen werden',String(e.message||e))}}
});
autoUpdater.on('error',e=>{console.error('BooksUp updater:',e);booksupUpdateStatus('Update fehlgeschlagen: '+String(e.message||e),null);});
autoUpdater.on('update-downloaded',async info=>{
  booksupUpdateStatus('Update '+info.version+' bereit zur Installation.',100);
  if(!mainWindow||mainWindow.isDestroyed())return;
  const {response}=await dialog.showMessageBox(mainWindow,{
    type:'info',buttons:['Jetzt installieren','Später'],defaultId:0,cancelId:1,
    title:'BooksUp-Update bereit',message:'BooksUp '+info.version+' wurde heruntergeladen.',
    detail:'BooksUp wird zum Installieren neu gestartet. Deine Bibliotheksdaten bleiben auf diesem Gerät.'
  });
  if(response===0){
     booksupUpdateStatus('Installation wird gestartet. BooksUp beendet sich und wird nach der Installation neu geöffnet.',100);
     try{
       // Persist success feedback before the NSIS updater closes the renderer.
       await mainWindow.webContents.executeJavaScript('localStorage.setItem(\'booksup-update-pending\','+JSON.stringify(info.version)+')');
     }catch(error){console.warn('Could not persist update completion marker:',error);}
     try{autoUpdater.quitAndInstall(false,true);}catch(error){booksupUpdateStatus('Installation fehlgeschlagen: '+String(error.message||error),null);dialog.showErrorBox('BooksUp Update',String(error.message||error));}
   }
});
async function checkBooksUpUpdates(manual=false){
  if(!app.isPackaged||process.platform!=='win32'){
    return {message:'Installierbare Updates stehen in der gepackten Windows-Version zur Verfügung.'};
  }
  if(process.env.PORTABLE_EXECUTABLE_DIR){
    if(manual)await shell.openExternal('https://github.com/lavender1510/BooksUp/releases');
    return {message:'Portable Version: Release-Seite im Browser geöffnet. Neue portable EXE manuell herunterladen.'};
  }
  if(updateBusy)return {message:'Eine Update-Prüfung läuft bereits.'};
  updateBusy=true;
  try{
    const result=await autoUpdater.checkForUpdates();
    if(!result?.updateInfo || result.isUpdateAvailable===false){
      if(manual)await dialog.showMessageBox(mainWindow,{type:'info',message:'BooksUp ist aktuell.'});
      return {message:'Update-Prüfung abgeschlossen.'};
    }
    return {message:'Update gefunden: '+result.updateInfo.version};
  }catch(e){
    const msg=String(e.message||e);
    if(manual){const {response}=await dialog.showMessageBox(mainWindow,{type:'warning',buttons:['Releases öffnen','Schließen'],defaultId:0,cancelId:1,message:'Update-Prüfung fehlgeschlagen',detail:msg});if(response===0)await shell.openExternal('https://github.com/lavender1510/BooksUp/releases');}
    return {message:'Update-Prüfung fehlgeschlagen: '+msg};
  }finally{updateBusy=false}
}
ipcMain.handle('booksup-update:check',()=>checkBooksUpUpdates(true));

// Restrict DNB metadata lookups to a known SRU endpoint and the active BooksUp window.
// Fetch public catalog data from a fixed set of providers in Electron's main process.
ipcMain.handle('booksup-metadata:search', async (event, request) => {
  if (!mainWindow || event.sender !== mainWindow.webContents ||
      !event.senderFrame?.url.startsWith(APP_ORIGIN + '/')) throw Error('Unauthorized metadata lookup');
  const title = String(request?.title || '').trim().slice(0, 180);
  const author = String(request?.author || '').trim().slice(0, 120);
  const topic=String(request?.topic||'').trim().slice(0,60).replace(/[^a-zA-Z0-9 -]/g,'');
  const isbn = String(request?.isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
  if (!title && !topic && !/^(?:[0-9]{9}[0-9X]|[0-9]{13})$/.test(isbn)) throw Error('Title or valid ISBN required');
  const query = topic ? 'subject:' + topic : isbn ? 'isbn:' + isbn : 'intitle:' + title + (author ? ' inauthor:' + author : '');
  const googleUrls = [
    'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query) + '&maxResults=35&printType=books',
    'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(title + ' ' + author) + '&maxResults=20&printType=books'
  ];
  const openUrl = 'https://openlibrary.org/search.json?' +
    (topic ? 'q=' + encodeURIComponent('subject:' + topic) : isbn ? 'isbn=' + encodeURIComponent(isbn) : 'q=' + encodeURIComponent(title + (author ? ' ' + author : ''))) +
    '&limit=20&lang=de&fields=key,title,author_name,isbn,first_publish_year,cover_i,subject,language,publisher,editions,editions.title,editions.language,editions.isbn_13,editions.isbn_10,editions.publisher,editions.publish_date';
  const urls = [...googleUrls, openUrl];
  async function fetchCatalog(url) {
    const resp = await fetch(url, {signal: AbortSignal.timeout(11000), headers:{Accept:'application/json'}});
    if (!resp.ok) throw Error('HTTP ' + resp.status);
    const json = await resp.text();
    if (json.length > 1600000) throw Error('Catalog response too large');
    return JSON.parse(json);
  }
  const results = await Promise.allSettled(urls.map(fetchCatalog));
  const errors = results.map((x,i)=>x.status==='rejected'?['Google Books','Google Books','Open Library'][i]+': '+String(x.reason?.message||x.reason):null).filter(Boolean);
  return {google: results.slice(0,2).flatMap(x=>x.status==='fulfilled' ? x.value.items || [] : []),
          open: results[2].status==='fulfilled' ? results[2].value.docs || [] : [],
          errors};
});
ipcMain.handle('booksup-metadata:dnb-title', async (event, rawTitle) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || !event.senderFrame?.url.startsWith(APP_ORIGIN + '/')) throw Error('Unauthorized lookup');
  const title = String(rawTitle || '').replace(/[=*"()]/g,' ').trim().slice(0,140);
  if (title.length < 3) return '';
  const url = 'https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&recordSchema=MARC21-xml&maximumRecords=8&query=' + encodeURIComponent('tit=' + title);
  const response = await fetch(url, {signal:AbortSignal.timeout(11000),headers:{Accept:'application/xml'}});
  if(!response.ok)throw Error('DNB HTTP '+response.status);
  const data=await response.text();
  if(data.length>350000)throw Error('DNB result too large');
  return data;
});
ipcMain.handle('booksup-metadata:dnb', async (event, rawIsbn) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || !event.senderFrame?.url.startsWith(APP_ORIGIN + '/')) throw Error('Unauthorized metadata lookup');
  const isbn = String(rawIsbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
  if (!/^(?:[0-9]{9}[0-9X]|[0-9]{13})$/.test(isbn)) throw Error('Invalid ISBN');
  const endpoint = 'https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&recordSchema=MARC21-xml&maximumRecords=4&query=' + encodeURIComponent('num=' + isbn);
  const response = await fetch(endpoint, {signal: AbortSignal.timeout(9000), headers:{Accept:'application/xml'}});
  if (!response.ok) throw Error('DNB response ' + response.status);
  const body = await response.text();
  if (body.length > 300000) throw Error('DNB response too large');
  return body;
});


/* Persistent local BooksUp backup writer. Renderer never chooses an arbitrary path. */
const fsBackup=require('node:fs/promises');
const {randomUUID}=require('node:crypto');
const bu45BackupSessions=new Map();
function bu45AuthIpc(event){
 if(!mainWindow||event.sender!==mainWindow.webContents||!event.senderFrame?.url.startsWith(APP_ORIGIN+'/'))throw Error('Unauthorized BooksUp backup request');
}
function bu45BackupsFolder(){return path.join(app.getPath('documents'),'BooksUp','Backups')}
ipcMain.handle('booksup-backup:init',async event=>{bu45AuthIpc(event);await fsBackup.mkdir(bu45BackupsFolder(),{recursive:true});return true});
ipcMain.handle('booksup-backup:start',async(event,filename)=>{
 bu45AuthIpc(event);
 if(!/^BooksUp_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_(automatisch|manuell)\.zip$/.test(String(filename)))throw Error('Invalid backup filename');
 await fsBackup.mkdir(bu45BackupsFolder(),{recursive:true});
 const id=randomUUID(),dest=path.join(bu45BackupsFolder(),filename),temp=dest+'.part';
 const file=await fsBackup.open(temp,'wx');
 bu45BackupSessions.set(id,{file,temp,dest});
 return id;
});
ipcMain.handle('booksup-backup:append',async(event,id,base64)=>{
 bu45AuthIpc(event);
 const entry=bu45BackupSessions.get(id);
 if(!entry||typeof base64!=='string'||base64.length>100000)throw Error('Invalid backup chunk');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length>65536)throw Error('Backup chunk too large');
 await entry.file.write(bytes);
 return true;
});
ipcMain.handle('booksup-backup:finish',async(event,id,keep=10)=>{
 bu45AuthIpc(event);
 const entry=bu45BackupSessions.get(id);if(!entry)throw Error('Backup not found');
 bu45BackupSessions.delete(id);
 await entry.file.sync();await entry.file.close();await fsBackup.rename(entry.temp,entry.dest);
 const list=(await fsBackup.readdir(bu45BackupsFolder())).filter(n=>/^BooksUp_.*\.(zip)$/.test(n)).sort().reverse();
 const retain=Math.min(20,Math.max(3,Number(keep)||10));
 for(const filename of list.slice(retain))await fsBackup.unlink(path.join(bu45BackupsFolder(),filename)).catch(()=>{});
 return true;
});
ipcMain.handle('booksup-backup:abort',async(event,id)=>{
 bu45AuthIpc(event);
 const entry=bu45BackupSessions.get(id);if(!entry)return true;
 bu45BackupSessions.delete(id);await entry.file.close().catch(()=>{});await fsBackup.unlink(entry.temp).catch(()=>{});return true;
});

// Local OS credential storage and localhost OAuth only. The renderer never sees refresh tokens.
const booksupDrive=require('./booksup-drive.cjs');
ipcMain.handle('booksup-drive:login',event=>{bu45AuthIpc(event);return booksupDrive.login();});
ipcMain.handle('booksup-drive:resume',event=>{bu45AuthIpc(event);return booksupDrive.resume();});
ipcMain.handle('booksup-drive:disconnect',event=>{bu45AuthIpc(event);return booksupDrive.disconnect();});
ipcMain.handle('booksup-drive:request',(event,args)=>{bu45AuthIpc(event);return booksupDrive.request(args);});

app.whenReady().then(() => {
  protocol.handle('booksup', serveApp);
  // Camera scan is opt-in. Other requests are not silently approved.
  session.defaultSession.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    if (webContents !== mainWindow?.webContents || permission !== 'media' ||
        !String(details.requestingUrl || '').startsWith(APP_ORIGIN + '/')) return callback(false);
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question', buttons: ['Erlauben', 'Ablehnen'], defaultId: 1, cancelId: 1,
      title: 'BooksUp – Kamera', message: 'BooksUp möchte die Kamera zum ISBN-Scannen verwenden.'
    });
    callback(response === 0);
  });
  createWindow();
  if(app.isPackaged&&process.platform==='win32')setTimeout(()=>checkBooksUpUpdates(false),12000);
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
