'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('booksupDesktopUpdate',Object.freeze({check:()=>ipcRenderer.invoke('booksup-update:check')}));

contextBridge.exposeInMainWorld('booksupBackupFile',Object.freeze({init:()=>ipcRenderer.invoke('booksup-backup:init'),start:(name)=>ipcRenderer.invoke('booksup-backup:start',name),append:(id,base64)=>ipcRenderer.invoke('booksup-backup:append',id,base64),finish:(id,keep)=>ipcRenderer.invoke('booksup-backup:finish',id,keep),abort:(id)=>ipcRenderer.invoke('booksup-backup:abort',id)}));

contextBridge.exposeInMainWorld('booksupDnb',Object.freeze({isbn:(value)=>ipcRenderer.invoke('booksup-metadata:dnb',value)}));

contextBridge.exposeInMainWorld('booksupCatalog',Object.freeze({search:(criteria)=>ipcRenderer.invoke('booksup-metadata:search',criteria)}));

contextBridge.exposeInMainWorld('booksupDnbTitle',Object.freeze({search:(title)=>ipcRenderer.invoke('booksup-metadata:dnb-title',title)}));

contextBridge.exposeInMainWorld('booksupDesktopDrive',Object.freeze({login:()=>ipcRenderer.invoke('booksup-drive:login'),resume:()=>ipcRenderer.invoke('booksup-drive:resume'),disconnect:()=>ipcRenderer.invoke('booksup-drive:disconnect'),request:(args)=>ipcRenderer.invoke('booksup-drive:request',args)}));

// Pair directly on the private LAN; remote requests are constrained in main process.
contextBridge.exposeInMainWorld('booksupLan',Object.freeze({host:offer=>ipcRenderer.invoke('booksup-lan:start',offer),poll:()=>ipcRenderer.invoke('booksup-lan:poll'),stop:()=>ipcRenderer.invoke('booksup-lan:stop'),signal:args=>ipcRenderer.invoke('booksup-lan:signal',args)}));

contextBridge.exposeInMainWorld('booksupUpdateEvents',Object.freeze({subscribe:listener=>{if(typeof listener!=='function')return ()=>{};const cb=(_event,data)=>listener({message:String(data?.message||''),percent:Number.isFinite(data?.percent)?data.percent:null});ipcRenderer.on('booksup-update:status',cb);return ()=>ipcRenderer.removeListener('booksup-update:status',cb)}}));
