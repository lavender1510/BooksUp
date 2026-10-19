'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('booksupDesktopUpdate',Object.freeze({check:()=>ipcRenderer.invoke('booksup-update:check')}));

contextBridge.exposeInMainWorld('booksupBackupFile',Object.freeze({init:()=>ipcRenderer.invoke('booksup-backup:init'),start:(name)=>ipcRenderer.invoke('booksup-backup:start',name),append:(id,base64)=>ipcRenderer.invoke('booksup-backup:append',id,base64),finish:(id,keep)=>ipcRenderer.invoke('booksup-backup:finish',id,keep),abort:(id)=>ipcRenderer.invoke('booksup-backup:abort',id)}));

contextBridge.exposeInMainWorld('booksupDnb',Object.freeze({isbn:(value)=>ipcRenderer.invoke('booksup-metadata:dnb',value)}));
