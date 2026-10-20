'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const shared=fs.readFileSync(path.join(root,'www/booksup-49.js'),'utf8');
const css=fs.readFileSync(path.join(root,'www/booksup-49.css'),'utf8');
const cloud=fs.readFileSync(path.join(root,'www/cloud-drive.js'),'utf8');
const desktopDrive=fs.readFileSync(path.join(root,'electron/booksup-drive.cjs'),'utf8');
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const android=fs.readFileSync(path.join(root,'.github/workflows/build-android.yml'),'utf8');
const windows=fs.readFileSync(path.join(root,'.github/workflows/build-desktop.yml'),'utf8');
new Function(shared);
new Function(cloud);
new Function(desktopDrive);
assert.match(html,/booksup-49\.js/);
assert.match(html,/booksup-49\.css/);
assert.match(css,/bu49-mobile/);
assert.match(android,/v5\.2\.0-android\.1/);
assert.match(windows,/v5\.2\.0/);
assert.match(desktopDrive,/code_challenge_method:'S256'/);
assert.match(desktopDrive,/safeStorage\.encryptString/);
assert.match(desktopDrive,/ORIGINS\.has/);
assert.match(cloud,/booksupDesktopDrive/);
const book={books:[],libraryBooks:[],readingLists:[]};
const manga={books:[],libraryBooks:[],readingLists:[]};
const all={book,manga};
const headers=['Title','Author','Bookshelves','Exclusive Shelf','ISBN13','Tags','Binding','My Rating'];
const rows=[
 ['Naruto, Vol. 1','Masashi Kishimoto','manga, favorites','to-read','9781569319000','manga','Paperback','5'],
 ['The Hobbit','J.R.R. Tolkien','fantasy','to-read','9780547928227','fantasy','Paperback','4']
];
const news=[{title:'New book',url:'https://example.com/books/news',date:'2026-10-19',summary:'Short excerpt',source:'News Feed'}];
const state={selection:new Set(),views:0,saved:0};
const win={
 bu44ShelfToolbar:()=>'<div>Shelf</div>',shelf:()=>'<div class="shelf"><button class="detail-btn" onclick="event.stopPropagation();shelfCancel();bookM(123)">Details / Bearbeiten</button></div>',
 buSelect:id=>{state.selection.add(id)},buBulkDelete:()=>{},buNewsView:()=>'',nextAfterRender:()=>{},
 addEventListener:()=>{},Capacitor:{getPlatform:()=> 'android'}
};
const env={
 window:win,ALL:all,S:book,sp:'book',buMulti:false,buSelected:state.selection,
 buNewsArticles:news,NEXT_SETTINGS:[['appearance','Design']],nextSettingCategory:'appearance',
 buGoodreadsHead:headers,buGoodreadsRows:rows,buGoodreadsChoice:new Set(['manga','favorites','to-read','fantasy']),
 buRatingConfig:()=>({4:8,5:10}),
 buNorm:v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,''),gqDate:v=>v,iso:()=> '2026-10-19',
 render:()=>{state.views++},save:()=>{state.saved++},persist:()=>{state.saved++},toast:()=>{},go:()=>{},confirm:()=>true,
 esc:v=>String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'),bar:s=>s,
 modal:null,console,Number,Math,Date,Set,Map,Object,crypto:{randomUUID:()=> 'entry-'+Math.random()},
 document:{getElementById:()=>({checked:true}),querySelectorAll:()=>[],body:{classList:{toggle:()=>{}}}},
 setTimeout:()=>{},clearTimeout:()=>{}
};
vm.runInNewContext(shared,env,{timeout:3000});
assert.match(win.buNewsView(),/Favoriten \(0\)/);
win.bu49SaveNews(0);
assert.ok(all.bu49NewsSaved['https://example.com/books/news']);
win.bu49NewsTab('saved');
assert.match(win.buNewsView(),/New book/);
assert.match(win.bu49ChangelogView(),/4\.0\.0/);
assert.match(win.bu49ChangelogView(),/4\.9\.0/);
assert.match(win.shelf(),/bu49DeleteBook\(123\)/);
book.books.push({id:123,title:'Owned',type:'physical'});
win.bu49DeleteBook(123);
assert.equal(book.books.length,0,'Removing from bookshelf must delete the requested book');
win.bu45GoodreadsCommit();
assert.equal(manga.libraryBooks.length,1);
assert.equal(book.libraryBooks.length,1);
assert.equal(manga.libraryBooks[0].title,'Naruto, Vol. 1');
assert.equal(book.libraryBooks[0].title,'The Hobbit');
assert.equal(manga.readingLists.every(l=>l.items.every(x=>x.bookId===manga.libraryBooks[0].id)),true);
assert.equal(book.readingLists.every(l=>l.items.every(x=>x.bookId===book.libraryBooks[0].id)),true);
assert.ok(state.saved>0);
console.log('OK: 4.9 cross-platform news favorites, version history, Goodreads profile routing and shelf deletion');
