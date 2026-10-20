'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('www/booksup-53.js'),css=read('www/booksup-53.css');
new Function(source);
assert.match(css,/\.rdtop>button/);
assert.match(css,/overflow-x:auto!important/);
assert.match(css,/bu53-highlight/);
const manifest=read('tools/android-init.cjs');
assert.match(manifest,/android:usesCleartextTraffic="true"/);
assert.match(manifest,/const appTag=\/<application\\b/);
assert.match(manifest,/booksup-53\.js/);
assert.match(read('.github/workflows/build-android.yml'),/assembleRelease|build-android-release\.cjs/);
assert.match(read('.github/workflows/build-android.yml'),/BOOKSUP_ANDROID_RELEASE_KEYSTORE_BASE64/);
assert.doesNotMatch(read('.github/workflows/build-android.yml'),/build-apk\.cjs|assembleDebug/);
assert.match(read('tools/build-android-release.cjs'),/assembleRelease/);
assert.match(read('electron/main.cjs'),/booksup-53\.js/);
assert.match(read('package.json'),/"version": "5\.3\.0"/);
let count=0,changed=0,saved=0,callbacks={};const textNode={nodeType:3,nodeValue:'Read'};
const item={closest:()=>null,childNodes:[textNode],hasAttribute:()=>false};
const scroll={clientWidth:350,clientHeight:560,scrollWidth:800,scrollHeight:1400,isConnected:true,
 scrollLeft:0,scrollTop:0,
 style:{setProperty:()=>{},removeProperty:()=>{}},
 classList:{add:()=>{},remove:()=>{},toggle:()=>{}},
 querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0})
};
const app={querySelectorAll:()=>[item]};
const elements={rdscroll:scroll,app};
const document={
 getElementById:id=>elements[id]||null,
 addEventListener:(name,fn)=>(callbacks[name]??=[]).push(fn),
 createElement:()=>({style:{}}),
 documentElement:{lang:'de'},
 body:{classList:{toggle:()=>{}}},
};
const S={pdfZoom:1.0,books:[{id:1,title:'Matilda',annotations:[]}]};
const window={nextAfterRender:()=>{},nextSettingsDetail:()=>'<section><p id="bu50-update-status">Ready</p></section>',
 nextCaptureHighlight:()=>{},getSelection:()=>({toString:()=> 'important sentence',rangeCount:0}),
 booksupUpdateEvents:{subscribe:()=>{}},Capacitor:{getPlatform:()=> 'windows'}};
const env={window,document,S,ALL:{},view:'reader',nextSettingCategory:'updates',cur:1,pgNow:3,pdfDoc:{},
 bu44ZoomSet:x=>{changed++;S.pdfZoom=x;},persist:()=>{saved++},toast:()=>{},esc:x=>x,prompt:()=>'',
 nextLanguage:()=> 'de',buTranslateUI:()=>{},MutationObserver:class{observe(){}disconnect(){}},
 requestAnimationFrame:cb=>{count++;if(count<50)cb();return 1;},setTimeout:()=>1,clearTimeout:()=>{},
 Math,Number,String,Date,Set,Map,Promise,crypto:{randomUUID:()=> 'test-highlight'},
 getComputedStyle:()=>({position:'relative'}),console};
vm.runInNewContext(source,env,{timeout:3000});
assert.equal(typeof window.bu53ZoomTo,'function');
window.bu53ZoomTo(1.8);
assert.equal(S.pdfZoom,1.8,'Zoom must remain at final 180%');
assert.equal(changed,1,'Zoom must be committed to PDF rendering');
assert.ok(saved>0,'Zoom must persist');
window.nextCaptureHighlight();
assert.equal(S.books[0].annotations[0].type,'text-highlight','Selected text must persist as a book annotation');
assert.equal(S.books[0].annotations[0].text,'important sentence');
env.view='home';
window.bu53ApplyLanguage();
assert.equal(textNode.nodeValue,'Lesen','English labels must return to selected German after render');
assert.match(window.nextSettingsDetail(),/bu53-update-progress/);
assert.equal(typeof window.bu47ToggleHighlightMode,'function','Cross-platform area highlighting should exist');
console.log('OK: BooksUp 5.3 persistent 180% zoom, saved highlights, German switching, update ETA panel, Android production gate, mobile CSS');
