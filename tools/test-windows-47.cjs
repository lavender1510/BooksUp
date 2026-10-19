'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'electron/booksup-windows-47.js'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'electron/booksup-windows-47.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const desktopWorkflow = fs.readFileSync(path.join(root, '.github/workflows/build-desktop.yml'), 'utf8');
const androidWorkflow = fs.readFileSync(path.join(root, '.github/workflows/build-android.yml'), 'utf8');
const pkg = require(path.join(root,'package.json'));
assert.equal(pkg.version,'5.0.0');
assert.match(desktopWorkflow, /v5\.0\.0/);
assert.doesNotMatch(androidWorkflow.split('paths:')[1].split('jobs:')[0], /package\.json/);
assert.match(main,/booksup-windows-47\.js/);
assert.match(main,/booksup-metadata:dnb/);
assert.match(layout,/position:fixed!important/);
assert.match(layout,/\.bu47-kpi-grid/);
assert.match(source,/requestFullscreen/);
assert.match(source,/bu47ToggleHighlightMode/);
assert.match(source,/bu47EnrichOwnedBook/);
new Function(source);
let renders=0,saved=0;
const settings=[['language','Sprache'],['admin','Admin & Redaktion'],['updates','Update']];
const books=[{id:1,title:'A test book',author:'Author',isbn:'9781234567897',type:'digital',finished:'2026-10-02'}];
const state={books,log:[{date:'2026-10-18',mins:42,pages:18}],readingLists:[]};
const fakeWindow={
 booksupDesktopUpdate:{check:async()=>({message:'OK'})},buTranslate:(s)=>s,
 nextChooseSettings:()=>{},nextSettingsDetail:()=>'',nextAfterRender:()=>{},
 saveBook:async()=>{},batchFiles:async()=>{},mountMode:async()=>{},showPg:async()=>{},drawPg:async()=>{},toggleFull:()=>{},leaveFull:()=>{},
 booksupDnb:null,getSelection:()=>({toString:()=>''})
};
const env={
 window:fakeWindow,document:{addEventListener:()=>{},querySelectorAll:()=>[]},
 NEXT_SETTINGS:settings,ALL:{book:state,manga:{books:[],log:[]}},S:state,
 cur:1,pgNow:2,rdFull:false,view:'home',nextSettingCategory:'language',
 bar:(s)=>s,esc:(s)=>String(s),bu45AllLists:()=>[],
 APP_VERSION:'5.0.0',render:()=>{renders++},persist:()=>{saved++},
 navigator:{onLine:false},prompt:()=>null,toast:()=>{},console,
 clearTimeout,setTimeout,crypto:{randomUUID:()=> 'id-1'},Date,Set,Map
};
vm.runInNewContext(source,env,{timeout:3000});
assert.ok(fakeWindow.booksupWindows47);
assert.equal(settings.find(x=>x[0]==='admin'),undefined);
assert.ok(settings.some(x=>x[0]==='changelog'));
assert.match(fakeWindow.bu45DesktopInsights(),/42|0,7|Leseanalyse/);
assert.match(fakeWindow.bu47ChangelogView(),/4\.7\.0/);
assert.equal(fakeWindow.buTranslate('Bücher hinzufügen','en'),'Add books');
assert.ok(renders>0);
console.log('OK: Windows 4.7 desktop smoke checks passed');
