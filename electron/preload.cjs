'use strict';
const {contextBridge,ipcRenderer}=require('electron');

contextBridge.exposeInMainWorld('booksupBackupFile',Object.freeze({init:()=>ipcRenderer.invoke('booksup-backup:init'),start:(name)=>ipcRenderer.invoke('booksup-backup:start',name),append:(id,base64)=>ipcRenderer.invoke('booksup-backup:append',id,base64),finish:(id,keep)=>ipcRenderer.invoke('booksup-backup:finish',id,keep),abort:(id)=>ipcRenderer.invoke('booksup-backup:abort',id)}));

// Pair directly on the private LAN; remote requests are constrained in main process.
contextBridge.exposeInMainWorld('booksupLan',Object.freeze({host:offer=>ipcRenderer.invoke('booksup-lan:start',offer),poll:()=>ipcRenderer.invoke('booksup-lan:poll'),stop:()=>ipcRenderer.invoke('booksup-lan:stop'),signal:args=>ipcRenderer.invoke('booksup-lan:signal',args)}));

