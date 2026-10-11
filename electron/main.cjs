'use strict';

const { app, BrowserWindow, protocol, net, shell, session, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { stat } = require('node:fs/promises');

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
    return net.fetch(pathToFileURL(file).href);
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'BooksUp',
    width: 1100, height: 860, minWidth: 400, minHeight: 540,
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

  mainWindow.loadURL(APP_ORIGIN + '/index.html');
  if (process.env.BOOKSUP_DEVTOOLS === '1') mainWindow.webContents.openDevTools();
}


/* Signed-in user data stays in Electron's existing booksup:// origin during upgrades. */
let updateBusy=false;
autoUpdater.autoDownload=false;
autoUpdater.autoInstallOnAppQuit=false;
autoUpdater.allowPrerelease=true;
autoUpdater.allowDowngrade=false;
autoUpdater.setFeedURL({provider:'github',owner:'lavender1510',repo:'BooksUp',releaseType:'prerelease'});
autoUpdater.on('update-available', async info=>{
  if(!mainWindow||mainWindow.isDestroyed())return;
  const {response}=await dialog.showMessageBox(mainWindow,{
    type:'info',buttons:['Herunterladen','Später'],defaultId:0,cancelId:1,
    title:'BooksUp-Update',message:'BooksUp '+info.version+' ist verfügbar.',
    detail:'Das Update wird heruntergeladen und nach deiner Bestätigung installiert.'
  });
  if(response===0){try{await autoUpdater.downloadUpdate()}catch(e){dialog.showErrorBox('Update konnte nicht geladen werden',String(e.message||e))}}
});
autoUpdater.on('update-downloaded',async info=>{
  if(!mainWindow||mainWindow.isDestroyed())return;
  const {response}=await dialog.showMessageBox(mainWindow,{
    type:'info',buttons:['Jetzt installieren','Später'],defaultId:0,cancelId:1,
    title:'BooksUp-Update bereit',message:'BooksUp '+info.version+' wurde heruntergeladen.',
    detail:'BooksUp wird zum Installieren neu gestartet. Deine Bibliotheksdaten bleiben auf diesem Gerät.'
  });
  if(response===0)autoUpdater.quitAndInstall(false,true);
});
async function checkBooksUpUpdates(manual=false){
  if(!app.isPackaged||process.platform!=='win32'||process.env.PORTABLE_EXECUTABLE_DIR){
    return {message:'Automatische Installation ist nur in der installierten Windows-Version verfügbar.'};
  }
  if(updateBusy)return {message:'Eine Update-Prüfung läuft bereits.'};
  updateBusy=true;
  try{
    const result=await autoUpdater.checkForUpdates();
    if(!result?.updateInfo||!result.isUpdateAvailable){
      if(manual)await dialog.showMessageBox(mainWindow,{type:'info',message:'BooksUp ist aktuell.'});
      return {message:'Update-Prüfung abgeschlossen.'};
    }
    return {message:'Update gefunden: '+result.updateInfo.version};
  }catch(e){
    const msg=String(e.message||e);
    if(manual)await dialog.showMessageBox(mainWindow,{type:'warning',message:'Update-Prüfung fehlgeschlagen',detail:msg});
    return {message:'Update-Prüfung fehlgeschlagen.'};
  }finally{updateBusy=false}
}
ipcMain.handle('booksup-update:check',()=>checkBooksUpUpdates(true));

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
