'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('www/booksup-50.js'),pair=read('www/booksup-50-pair.js'),services=read('www/booksup-50-services.js');
for(const code of [source,pair,services])new Function(code);
assert.equal(JSON.parse(read('package.json')).version,'5.3.0');
assert.match(read('tools/android-init.cjs'),/BooksUpUpdaterPlugin/);
assert.match(read('mobile/android-native/BooksUpUpdaterPlugin.java'),/installGithubApk/);
assert.match(read('www/booksup-50.css'),/bu50-has-background/);
assert.match(read('electron/main.cjs'),/booksup-50-pair.js/);
assert.match(read('.github/workflows/build-android.yml'),/v5\.3\.0-android/);
assert.match(read('.github/workflows/build-desktop.yml'),/v5\.3\.0/);
let next=0,saveCount=0;
const storage=new Map();
const s={mode:0,theme:2,paper:0,fs:1,books:[],readingLists:[]};
const all={book:s,manga:{books:[],readingLists:[]},nextTheme:'standard'};
const picks=[];
const doc={
 documentElement:{style:{setProperty:(...x)=>picks.push(x),removeProperty:()=>{}},classList:{toggle:()=>{}}},
 head:{appendChild:()=>{}},
 body:{classList:{toggle:()=>{}}},
 getElementById:()=>null,createElement:tag=>({id:'',rel:'',href:'',tag}),
 querySelectorAll:()=>[],
};
const fakeWindow={
 Capacitor:{getPlatform:()=> 'android'},
 bu43AppearanceView:()=>'<div class="bu43-ap-actions"></div>',
 bu43ApOpen:()=>{},
 bu48SaveThemeCombo:()=>{},bu48ApplyThemeCombo:()=>{},bu48DeleteThemeCombo:()=>{},
 nextSettingsDetail:()=>'<p>settings</p>',bu45ShelfImports:()=>'<b>preview</b>',
 bu44ShelfToolbar:()=>'<p>toolbar</p>',
 home:()=>'<button onclick="go(\'friends\')"><b>Freunde</b><small>0 verbunden</small></button>',
 go:()=>{},nextReader:()=>'<p>reader</p>',nextAfterRender:()=>{},
 bu48Lookup:async()=>({candidates:[],suggestions:[]}),bu46Search:async()=>{},nextBookDetails:()=>'<h2>Über das Buch</h2>',
 bu46BookInfo:()=>'',buTranslate:text=>text,
};
const env={
 window:fakeWindow,document:doc,crypto:{randomUUID:()=> 'uuid-'+(++next)},
 S:s,ALL:all,sp:'book',view:'home',cur:0,pgNow:1,
 NEXT_SETTINGS:[['appearance','Design'],['friends','Freunde']],
 bu43AppearanceDraft:{nextTheme:'standard',theme:2,mode:0,paper:0,fs:1},
 bu43ApCapture:()=>({nextTheme:'standard',theme:2,mode:0,paper:0,fs:1}),
 bu43ApOpen:()=>{},bu43ApSave:()=>{saveCount++},
 bu45AllLists:()=>s.readingLists,bu45OpenList:()=>{},bu45OpenListSettings:()=>{},
 persist:()=>{saveCount++},render:()=>{},toast:()=>{},prompt:()=> 'Mein Setup',
 esc:v=>String(v),bar:x=>x,raw:()=>{},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 db:async()=>{throw new Error('No background stored')},
 put:async()=>true,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},Blob,
 navigator:{},matchMedia:()=>({matches:false}),
 console,Date,Math,Number,Set,Map,Promise,requestAnimationFrame:fn=>fn(),setTimeout,clearTimeout,
};
vm.runInNewContext(source,env,{timeout:3500});
assert.equal(fakeWindow.booksupMajor5,true);
assert.equal(fakeWindow.bu50Fonts.length,100,'Exactly 100 named fonts are required');
fakeWindow.bu48SaveThemeCombo();
assert.equal(all.bu48ThemeCombos.length,1,'Preset persisted');
assert.equal(all.bu48ThemeCombos[0].font,'Inter');
assert.ok(saveCount>=1);
assert.ok(env.NEXT_SETTINGS.some(x=>x[0]==='readingLists'));
assert.ok(env.NEXT_SETTINGS.some(x=>x[0]==='devices'));
assert.ok(!env.NEXT_SETTINGS.some(x=>x[0]==='friends'));
assert.equal(fakeWindow.bu45ShelfImports(),'','Non-opted-in reading lists cannot appear in shelf');
assert.match(fakeWindow.home(),/Leselisten/);
assert.match(fakeWindow.home(),/go\('lists'\)/);
assert.match(fakeWindow.bu43AppearanceView(),/100 Schriftarten/);
assert.match(fakeWindow.bu50ListsSettings(),/Leselisten/);
console.log('OK: BooksUp 5.0 appearance presets, 100 fonts, list settings and shelf privacy');
