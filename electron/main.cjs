'use strict';

const { app, BrowserWindow, protocol, net, shell, session, dialog, ipcMain } = require('electron');
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
        for (const name of ['booksup-50.js', 'booksup-50-pair.js', 'booksup-50-services.js','booksup-51.js','booksup-52.js','booksup-53.js','booksup-55.js'])
          await wc.executeJavaScript(fsSync.readFileSync(path.join(__dirname, '..', 'www', name), 'utf8'));
      }).catch(console.error);
  });
  mainWindow.loadURL(APP_ORIGIN + '/index.html');
  if (process.env.BOOKSUP_DEVTOOLS === '1') mainWindow.webContents.openDevTools();
}


/* Signed-in user data stays in Electron's existing booksup:// origin during upgrades. */
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
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
