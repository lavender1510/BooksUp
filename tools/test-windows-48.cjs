'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(base,'electron/booksup-windows-48.js'),'utf8');
const css=fs.readFileSync(path.join(base,'electron/booksup-windows-48.css'),'utf8');
const main=fs.readFileSync(path.join(base,'electron/main.cjs'),'utf8');
const preload=fs.readFileSync(path.join(base,'electron/preload.cjs'),'utf8');
const android=fs.readFileSync(path.join(base,'.github/workflows/build-android.yml'),'utf8');
new Function(source);
assert.match(css,/bu48-list-tile/);
assert.match(css,/bu48-ui-font/);
assert.match(main,/booksup-windows-48\.js/);
assert.match(main,/booksup-metadata:search/);
assert.match(main,/booksup-metadata:dnb-title/);
assert.match(preload,/booksupCatalog/);
assert.doesNotMatch(android.split('paths:')[1].split('jobs:')[0],/package\.json/);
const books=[
 {id:101,title:'Book A',author:'A',type:'physical',added:12},
 {id:102,title:'Book B',author:'B',type:'physical',added:15},
 {id:103,title:'Matilda',author:'Roald Dahl',type:'physical',added:16,isbn:''}
];
const list={id:'list-1',name:'Favorites',items:[{id:'entry-1',bookId:101,title:'Book A'},{id:'entry-2',bookId:102,title:'Book B'}],autoRule:'manual'};
const shelf={books,readingLists:[list]};
const settings=[['goodreads','Goodreads'],['appearance','Appearance']];
let persisted=0,renders=0;
let catalog={google:[],open:[],errors:[]};
const win={
 booksupDesktopUpdate:{check:async()=>({message:'OK'})},
 bu45ListDetails:()=>'<p>old</p>',bu45ListsOverview:()=>'',bu45ProfileLists:()=>'',bu46ReadingHistory:()=>'',home:()=>'',nextApplyTheme:()=>{},bu43AppearanceView:()=>'<div class="bu43-ap-actions"></div>',
 bu43AfterRender:()=>{},nextSettingsDetail:()=>'',bu46ChooseList:()=>{},bu46BookInfo:()=>'',bu47EnrichOwnedBook:()=>{},bu46EnrichBook:()=>{},bu44WatchPrompt:()=>{},nextAfterRender:()=>{},
 booksupCatalog:{search:async()=>catalog},booksupDnbTitle:{search:async()=>''},
};
const app={
 window:win,console,Date,Number,Set,Map,Promise,
 crypto:{randomUUID:()=> 'entry-created-'+Math.random()},
 S:shelf,ALL:{book:shelf,manga:{books:[],readingLists:[]}},T:[['Pink','#ff88ac'],['Blue','#5577ee']],
 NEXT_SETTINGS:settings,bu43AppearanceDraft:null,cur:'list-1',bu45ListId:'list-1',view:'listDetail',nextSettingCategory:'appearance',
 bu45AllLists:()=>shelf.readingLists,bu45Extra:()=>[],bu45Book:item=>books.find(b=>String(b.id)===String(item.bookId))||item,bu45IsOwned:b=>books.includes(b),bu43CoverHtml:()=>'<span>cover</span>',
 bu43RefreshList:()=>{},bar:()=>'',esc:v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;'),persist:()=>{persisted++},render:()=>{renders++},
 toast:()=>{},prompt:()=>null,alert:()=>{},navigator:{onLine:true},bu46SearchResults:[],
 metadataGoogle:(v)=>({title:v.title||''}),document:{addEventListener:()=>{},querySelectorAll:()=>[],documentElement:{style:{setProperty:()=>{}}},createElement:()=>({innerHTML:'',querySelector:()=>null})},
};
vm.runInNewContext(source,app,{timeout:3000});
assert.equal(win.booksupWindows48,true);
assert.ok(settings.some(x=>x[0]==='discoverList'));
win.bu48RemoveListEntry('list-1','entry-1');
assert.deepEqual(list.items.map(x=>x.id),['entry-2']);
win.bu48RemoveListEntry('list-1','entry-2');
assert.equal(list.items.length,0);
assert.equal(books.length,3,'Deleting links must never delete source books');
list.items.push({id:'entry-A',bookId:101},{id:'entry-B',bookId:102});
win.bu48RemoveListEntry('list-1','entry-B');
assert.equal(list.items[0].bookId,101);
assert.equal(list.items.length,1);
const overview=win.bu45ListsOverview();
assert.match(overview,/bu48-list-tile/);
assert.match(overview,/Book A/);
assert.match(win.bu45ListDetails(),/data-bu48-item/);
assert.equal(typeof win.bu48LookupResults.get,'function');
catalog={google:[{volumeInfo:{title:'Matilda',authors:['Roald Dahl'],publisher:'Puffin',language:'en',industryIdentifiers:[{type:'ISBN_13',identifier:'9780140328721'}]}}],open:[],errors:[]};
(async()=>{
 const result=await win.bu48Lookup(103,{silent:true});
 assert.equal(books[2].isbn,'9780140328721','Only one high-confidence edition should auto-populate ISBN');
 assert.equal(books[2].publisher,'Puffin');
 assert.equal(result.suggestions.length,1);
 assert.ok(persisted>0);
 console.log('OK: Windows 4.8 stable list deletion, ISBN enrichment and UI smoke tests');
})().catch(e=>{console.error(e);process.exitCode=1});
