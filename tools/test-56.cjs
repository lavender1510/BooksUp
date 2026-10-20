'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const src=read('www/booksup-56.js');new Function(src);
assert.match(read('tools/android-init.cjs'),/booksup-56\.js/);
assert.match(read('electron/main.cjs'),/booksup-56\.js/);
assert.match(read('www/index.html'),/bu56SettingsDraftActive/);
assert.match(read('www/booksup-50-pair.js'),/bu50-send-button/);
assert.match(read('www/booksup-50-pair.js'),/bu50-transfer-bar/);
assert.match(read('www/booksup-50-pair.js'),/notifyPeer\('ack'/);
const original={id:3,title:'Sky Ocean',author:'Ada Writer',isbn:'9780306406157',pdf:true,annotations:[]},profile={books:[original],readingLists:[],log:[],rec:{}};
const other={books:[],readingLists:[],log:[]};
const responses={
 google:[{volumeInfo:{title:'Sky Ocean',authors:['Ada Writer'],publisher:'Berlin Press',categories:['Space Adventure'],description:'Exploration of distant stars',language:'de',industryIdentifiers:[{type:'ISBN_13',identifier:'9780306406157'}],imageLinks:{thumbnail:'http://example.com/cover.jpg'}}}],
 open:[{title:'Sky Ocean',author_name:['Ada Writer'],isbn:['9780306406157'],subject:['Space Adventure','Exploration'],first_publish_year:2020}]
};
const state={console,Date,Math,JSON,Set,Map,Promise,Number,String,Array,Error,ALL:{book:profile,manga:other},S:profile,sp:'book',view:'detail',cur:3,rdFull:false,
 NEXT_SETTINGS:[['reading','Read'],['appearance','Design'],['help','Help'],['devices','Devices']],nextSettingCategory:'reading',
 bu46SimilarCache:new Map(),bu46Allowed:()=>true,bu45Extra:()=>[],buNorm:x=>String(x||'').toLowerCase(),
 nextLanguage:()=> 'de',isbnValid:x=>x==='9780306406157',persist(){state.saves++;},saves:0,
 render(){},toast(){},esc:x=>String(x),bu43LoadCovers(){},setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame:fn=>fn(),
 addEventListener(){},navigator:{onLine:true},crypto:{randomUUID:()=> 'test-id'},location:{},localStorage:{},
 fetchMetaUrl:async url=>{
   if(url.includes('googleapis'))return {items:[{volumeInfo:{title:'Ocean Moon',authors:['Ada Writer'],categories:['Space Adventure'],description:'Space exploration',industryIdentifiers:[]}}, {volumeInfo:{title:'Cooking Guide',authors:['Chef'],categories:['Cooking'],description:'Recipes'}}]};
   return {docs:[]};
 },prompt:()=> '9780306406157',confirm:()=>true,alert:()=>{},bu44Watches:()=>state.ALL.medimopsWatches||(state.ALL.medimopsWatches=[]),
 bu44CheckWatches:async()=>false,bu44PriceNotificationsView:()=>'<div>Price</div>',
 nextChooseSettings:id=>{state.nextSettingCategory=id;state.view='settingsDetail';},
 nextSettingsDetail:()=>'<div>Settings</div>',go:id=>{state.view=id;},
 nextAfterRender:()=>{},drawPg:async()=>{},
 document:{querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({innerHTML:'',querySelector:()=>null}),addEventListener(){},createTreeWalker:()=>({nextNode:()=>null})},
 window:null};
state.window=state;
state.booksupCatalog={search:async q=>{if(q.isbn||q.title==='Sky Ocean')return responses;return {google:[],open:[]};}};
vm.createContext(state);vm.runInContext(src,state,{timeout:3500});
(async()=>{
 const found=await state.bu48Lookup(3,{silent:true});
 assert.ok(found.candidates.length>0,'Must resolve edition via ISBN');
 assert.equal(original.publisher,'Berlin Press');
 assert.equal(original.language,'de');
 assert.equal(original.covers[0],'https://example.com/cover.jpg');
 state.bu44WatchPrompt({title:'New Book'});
 assert.equal(state.ALL.medimopsWatches[0].isbn,'9780306406157','Watch must allow catalogue book not in shelf');
 state.nextChooseSettings('reading');
 state.S.tfs=24;
 state.bu56SettingsDiscard();
 assert.equal(state.S.tfs,undefined,'Discard must restore last saved settings');
 state.nextChooseSettings('reading');state.S.tfs=22;state.bu56SettingsSave();
 assert.equal(state.S.tfs,22);assert.ok(state.saves>=2);
 await state.bu46SimilarLoad({title:'Sky Ocean',author:'Ada Writer',genre:'space adventure',tags:'space,exploration'});
 const suggestions=state.bu46SimilarCache.get('sky ocean ada writer')||[];
 assert.ok(suggestions.length>0,'Require book-specific recommendations');
 assert.ok(suggestions.every(b=>b.title!=='Cooking Guide'),'Irrelevant results must be excluded');
 console.log('OK: BooksUp 5.6 metadata, edition price-watch, save/discard, and content similarity');
})().catch(err=>{console.error(err);process.exitCode=1});
