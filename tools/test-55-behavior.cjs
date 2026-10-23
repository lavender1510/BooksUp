'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../www/booksup-55.js'),'utf8');
const original={id:42,title:'Novel',author:'Writer',type:'digital',added:1};
const extra={id:73,title:'Imported',author:'Author',type:'wishlist',source:'goodreads'};
const profile={books:[original],libraryBooks:[extra],readingLists:[{id:7,name:'New',showInShelf:false,autoRule:'manual',items:[{id:'i1',bookId:42,title:'Novel'}]}],folders:[]};
const manga={books:[],libraryBooks:[],readingLists:[],folders:[]};
const state={
 console,URL,Map,Set,Promise,Date,Math,JSON,Number,String,Array,Error,
 ALL:{book:profile,manga},S:profile,sp:'book',cur:42,view:'detail',
 NEXT_SETTINGS:[],CATB:[{title:'Other',author:'Writer',genre:'Fantasy'}],CATM:[],nextSettingCategory:'appearance',bu45ListId:7,bu45ListSettingsId:7,
 bu46SimilarCache:new Map(),bu46SearchTerm:'',bu46SearchResults:[],
 addEventListener(){},removeEventListener(){},document:{createElement:()=>({textContent:'',style:{}}),head:{appendChild(){}},
  addEventListener(){},querySelectorAll(){return[]},getElementById(){return null}},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 navigator:{onLine:true},crypto:{randomUUID:()=>String(Math.random())},
 setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(){},
 getComputedStyle:()=>({position:'relative'}),
 APP_VERSION:'5.5.1',rdFull:false,pgNow:1,editDraft:null,
 bu45AllLists:()=>state.S.readingLists,bu45Extra:()=>state.S.libraryBooks,
 bu45Book:item=>[...state.S.books,...state.S.libraryBooks].find(b=>String(b.id)===String(item.bookId))||item,
 bu45IsOwned:book=>state.S.books.some(b=>String(b.id)===String(book.id)),
 buNorm:x=>String(x||'').toLowerCase().trim(),
 esc:x=>String(x||''),iso:()=> '2026-10-20',persist(){},save(){},render(){},toast(){},
 bu43LoadCovers(){},bu43SyncFolder(){},bu43ReconcileLists(){
  for(const l of state.S.readingLists)state.bu43RefreshList(l);
 },
 bu46Allowed:()=>true,bu44ItemToBook:x=>({title:x.volumeInfo?.title,author:x.volumeInfo?.authors?.join(',')}),
 fetchMetaUrl:async url=>url.includes('openlibrary')?{docs:[]}:{items:[{volumeInfo:{title:'Other',authors:['B']}}]},
 lookupIsbn:async()=>({publisher:'Publisher',cover:'https://example.com/c.jpg'}),
 captureEdit(){},isbnClean:x=>String(x),isbnValid:()=>true,confirm:()=>true,
};
state.window=state;
for(const name of ['bu45ShelfToggle','bu45LibraryDetail','bu45ListDetails','bu45ListSettings','bu45ShelfImports',
 'bu45AllLibraryBooks','bu43ListsRules','bu43RefreshList','bu45ProgressBar','nextBookDetails',
 'stats','home','bu45ProfileLists','bu46ReadingHistory','nextShell','nextSettingsDetail','buGoodreadsPreview',
 'bu45GoodreadsCommit','drawEditBook','nextAfterRender','toggleFull','go','setRate','saveEdit','bu46SimilarHtml',
 'bu46SimilarLoad','bu46MoreBooks']){
 state[name]=function(){return '<section>Old UI</section>';};
}
state.saveEdit=function(){state.editDraft=null;};
state.go=function(next){state.view=next;};
vm.createContext(state);vm.runInContext(source,state,{filename:'booksup-55.js'});
state.bu55SetVisibility(7,'both');
assert.equal(profile.readingLists[0].visibility,'both');
assert.equal(profile.readingLists[0].showInShelf,true);
state.bu55SetVisibility(7,'library');
assert.equal(state.bu45AllLibraryBooks().length,1);
state.bu55SetListFormat(7,'physical');
assert.equal(profile.readingLists[0].mediaFormat,'physical');
state.bu55SetEntryFormat(7,'i1','digital');
assert.equal(profile.readingLists[0].items[0].mediaFormat,'digital');
state.bu55SetListFormat(7,'both');
state.bu55SetReadStatus(42,'abandoned');
assert.equal(original.status,'abandoned');
assert.equal(original.finished,null);
profile.readingLists[0].autoRule='abandoned';
state.bu43RefreshList(profile.readingLists[0]);
assert.equal(profile.readingLists[0].items.length,1);
assert.equal(profile.readingLists[0].items[0].bookId,42);
state.bu55SetReadStatus(42,'read');
assert.equal(original.status,'read');
assert.ok(original.finished);
state.bu55SetReadStatus(73,'abandoned');
state.bu43RefreshList(profile.readingLists[0]);
assert.ok(profile.readingLists[0].items.some(e=>e.bookId===73));
state.bu55SetNav('news',true);
assert.ok(!state.ALL.bu55BottomNav?.includes('news'),'retired news may never be enabled');
state.bu55SetNav('library',true);assert.ok(state.ALL.bu55BottomNav.includes('library'));
state.bu46MoreBooks();assert.equal(state.view,'discoverSearch');
(async()=>{
 await state.bu46SimilarLoad({title:'Novel',author:'Writer',genre:'Fantasy'});
 assert.equal(state.bu46SimilarCache.get('novel writer')[0].title,'Other');
 state.editDraft={title:'Novel',covers:['https://example.com/new.jpg']};
 state.saveEdit(42);assert.equal(original.covers[0],'https://example.com/new.jpg');
 console.log('BooksUp offline behavior tests passed: statuses, automatic lists, visibility, formats, navigation, Discover, recommendations and cover save.');
})().catch(e=>{console.error(e);process.exitCode=1});
