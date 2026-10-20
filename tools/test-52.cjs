'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const script=read('www/booksup-52.js');
new Function(script);
assert.match(read('www/booksup-52.css'),/bu52-android/);
assert.match(read('mobile/android-native/MainActivity.java'),/registerPlugin\(BooksUpNetworkPlugin\.class\)/);
assert.match(read('tools/android-init.cjs'),/BooksUpNetworkPlugin\.java/);
assert.match(read('electron/main.cjs'),/booksup-52\.js/);
assert.match(read('electron/main.cjs'),/subject:/);
assert.match(read('mobile/android-native/BooksUpNetworkPlugin.java'),/searchCatalog/);
assert.match(read('mobile/android-native/BooksUpNetworkPlugin.java'),/void signal/);
assert.match(read('mobile/android-native/BooksUpUpdaterPlugin.java'),/getApkContentsSigners/);
assert.match(read('electron/main.cjs'),/download-progress/);
assert.equal(JSON.parse(read('package.json')).version,'5.3.1');
const events={};let changed=0,looked=0;
const reader={
 style:{setProperty:()=>{},removeProperty:()=>{}},
 classList:{toggle:()=>{},remove:()=>{}},
 getBoundingClientRect:()=>({left:0,top:0})
};
const canvas={getContext:()=>({drawImage:()=>{},getImageData:()=>({data:new Uint8ClampedArray(24*24*4)})})};
const app={};
const dom={
 addEventListener:(name,fn)=>{(events[name]??=[]).push(fn)},
 getElementById:k=>k==='rdscroll'?reader:k==='app'?app:null,
 createElement:(tag)=>tag==='canvas'?canvas:{id:'',className:'',setAttribute:()=>{}},
 documentElement:{style:{getPropertyValue:()=>'',setProperty:()=>{}},classList:{contains:()=>false},dataset:{}},
 body:{classList:{toggle:()=>{}}}
};
let current=[{id:1,title:'Matilda',author:'Roald Dahl'}];
const ALL={book:{books:current},manga:{books:[]},recCycle:1};
const fakeWindow={
 Capacitor:{getPlatform:()=> 'windows'},
 booksupCatalog:{search:async args=>{looked++;return {google:[{volumeInfo:{title:'Matilda',authors:['Roald Dahl'],description:'A published description',publisher:'Publisher'}}],open:[],errors:[]}}},
 bu48Lookup:async()=>({candidates:[],errors:[]}),buRecs:()=>({list:[{title:'A',author:'aa'},{title:'B',author:'bb'},{title:'C',author:'cc'}],last:[]}),
 nextAfterRender:()=>{},bu51LanJoin:async()=>{},buTranslate:v=>v,
 booksupUpdateEvents:{subscribe:()=>{}},
};
const env={
 window:fakeWindow,document:dom,ALL,S:ALL.book,view:'home',sp:'book',pdfDoc:{},cur:1,
 bu44ZoomSet:v=>{env.S.pdfZoom=v;changed++},bu45Extra:()=>[],bu46Allowed:()=>true,
 bu44Remote:[],bu46SearchResults:[],bu44FetchRecommendations:async()=>{},
 nextLanguage:()=> 'en',buTranslateUI:()=>{},persist:()=>{},render:()=>{},toast:()=>{},
 metadataGoogle:(v)=>({title:v.title,author:(v.authors||[]).join(', '),description:v.description||''}),
 esc:v=>v,localStorage:{getItem:()=>null,setItem:()=>{}},
 MutationObserver:class{observe(){}disconnect(){}},navigator:{language:'de'},Image:class{},
 URL,Blob,Math,Date,Number,Set,Map,Promise,JSON,console,
 queueMicrotask:fn=>fn(),setTimeout:(fn)=>{fn();return 1},clearTimeout:()=>{},
 AbortSignal,fetch:async()=>{throw Error('Offline test')},
};
vm.runInNewContext(script,env,{timeout:3000});
assert.equal(fakeWindow.booksup52,true);
assert.ok(events.wheel?.length>0,'Touchpad wheel handler must be registered');
assert.ok(events.touchmove?.length>0,'Pinch touch handler must be registered');
assert.equal(fakeWindow.buTranslate('Speichern','en'),'Save');
const book=fakeWindow.buRecs();
assert.ok(book.list.length>=3);
(async()=>{
 const result=await fakeWindow.bu48Lookup(1,{silent:true});
 assert.equal(current[0].publisher,'Publisher');
 assert.equal(current[0].description,'A published description');
 assert.ok(looked>=1);
 console.log('OK: BooksUp 5.2 reader gestures, native providers, source-backed book data, language and installer safeguards');
})().catch(e=>{console.error(e);process.exitCode=1});
