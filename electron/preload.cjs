'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('booksupDesktopUpdate',Object.freeze({check:()=>ipcRenderer.invoke('booksup-update:check')}));
