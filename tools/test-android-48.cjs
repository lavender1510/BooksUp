'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'mobile/booksup-android-48.js'),'utf8');
const css=fs.readFileSync(path.join(root,'mobile/booksup-android-48.css'),'utf8');
const init=fs.readFileSync(path.join(root,'tools/android-init.cjs'),'utf8');
const androidFlow=fs.readFileSync(path.join(root,'.github/workflows/build-android.yml'),'utf8');
new Function(script);
assert.ok(css.includes('.bu48-list-tile'));
assert.ok(css.includes('body.bu-android'));
assert.match(init,/copyFileSync\(source,join\(publicDir,name\)\)/);
assert.match(init,/APP_VERSION/);
assert.match(androidFlow,/v5\.2\.0-android\.1/);
let nextId=10,saves=0,renders=0,requestLog=[];
const a={id:'l-1',name:'My list',items:[{id:'a',bookId:1,title:'First'},{id:'b',bookId:2,title:'Second'}],autoRule:'manual'};
const books=[{id:1,title:'First',author:'One',type:'physical'},{id:2,title:'Second',author:'Two',type:'physical'},{id:3,title:'Matilda',author:'Roald Dahl',type:'physical'}];
const state={books,readingLists:[a],log:[],goals:[],rec:{},profile:{name:'Test'}};
const settings=[['appearance','Appearance'],['admin','Admin'],['goodreads','Goodreads']];
const win={
 Capacitor:{getPlatform:()=> 'android',Plugins:{CapacitorHttp:{get:async({url})=>{
    requestLog.push(url);
    if(url.includes('googleapis.com'))return {status:200,data:{items:[{volumeInfo:{title:'Matilda',authors:['Roald Dahl'],industryIdentifiers:[{type:'ISBN_13',identifier:'9780140328721'}],publisher:'Puffin',language:'en'}}]}};
    if(url.includes('openlibrary.org'))return {status:200,data:{docs:[]}};
    if(url.includes('services.dnb.de'))return {status:200,data:'<?xml version="1.0"?><records />'};
    throw Error('Unknown URL');
 }}}},
 nextSettingsDetail:()=>'',nextChooseSettings:()=>{},nextAfterRender:()=>{},bu43AfterRender:()=>{},bu43AppearanceView:()=>'<div class="bu43-ap-actions"></div>',
 nextApplyTheme:()=>{},home:()=>'<div class="banner"></div>',bu45ListDetails:()=>'',bu45ListsOverview:()=>'',bu45ProfileLists:()=>'',bu46ReadingHistory:()=>'',bu46BookInfo:()=>'',bu46ChooseList:()=>{},bu46AddToList:()=>{},
 bu47EnrichOwnedBook:()=>{},bu46EnrichBook:()=>{},bu44WatchPrompt:()=>{},
 mountMode:async()=>{},showPg:async()=>{},drawPg:async()=>{},toggleFull:()=>{},leaveFull:()=>{},
 saveBook:()=>{},batchFiles:async()=>{},getSelection:()=>({toString:()=>''})
};
const document={
 body:{classList:{add:()=>{}}},
 addEventListener:()=>{},querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null,
 documentElement:{style:{setProperty:()=>{}}},
 createElement:()=>({innerHTML:'',querySelector:()=>null})
};
const env={window:win,document,Date,Promise,Map,Set,Math,Number,console,
 AbortController,setTimeout,clearTimeout,URL,
 NEXT_SETTINGS:settings,ALL:{book:state,manga:{books:[],log:[],readingLists:[]}},S:state,T:[['Rose','#ffaaaa']],
 nextSettingCategory:'appearance',bu43AppearanceDraft:null,view:'listDetail',cur:'l-1',bu45ListId:'l-1',
 render:()=>{renders++},persist:()=>{saves++},toast:()=>{},alert:()=>{},prompt:()=>null,
 esc:(v)=>String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'),
 bar:(t)=>t,bu45AllLists:()=>state.readingLists,
 bu45Book:item=>books.find(b=>String(b.id)===String(item.bookId))||item,bu45IsOwned:b=>books.includes(b),
 bu43CoverHtml:()=>'<b>cover</b>',bu43RefreshList:()=>{},bu45Extra:()=>[],
 crypto:{randomUUID:()=> 'new-id-'+(++nextId)},
 metadataGoogle:(v)=>({title:v.title,author:(v.authors||[]).join(', ')}),
 navigator:{onLine:true},APP_VERSION:'4.8.0'};
vm.runInNewContext(script,env,{timeout:3000});
assert.equal(win.booksupAndroid48,true);
assert.equal(settings.some(s=>s[0]==='admin'),false);
assert.equal(settings.some(s=>s[0]==='changelog'),true);
assert.equal(settings.some(s=>s[0]==='discoverList'),true);
assert.equal(typeof win.bu47ShowAnnotations,'function');
assert.match(win.bu45ListsOverview(),/bu48-list-tile/);
win.bu48RemoveListEntry('l-1','a');
assert.equal(a.items.length,1);
assert.equal(a.items[0].id,'b');
assert.equal(books.length,3);
win.bu48RemoveListEntry('l-1','b');
assert.equal(a.items.length,0);
assert.equal(books.length,3);
(async()=>{
 const metadata=await win.bu48Lookup(3,{silent:true});
 assert.equal(books[2].isbn,'9780140328721','Known ISBN-13 must be applied for one high-confidence match');
 assert.equal(books[2].publisher,'Puffin');
 assert.equal(metadata.suggestions.length,1);
 assert.ok(requestLog.some(x=>x.includes('googleapis.com')));
 assert.ok(requestLog.some(x=>x.includes('openlibrary.org')));
 assert.ok(requestLog.some(x=>x.includes('services.dnb.de')));
 assert.ok(saves>0 && renders>0);
 console.log('OK: Android 4.8 list safety, build isolation, native metadata lookup and ISBN');
})().catch(error=>{console.error(error);process.exitCode=1});
