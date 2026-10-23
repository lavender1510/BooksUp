'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const html=read('www/index.html'),next=read('www/booksup-next.js'),desktop=read('electron/main.cjs'),preload=read('electron/preload.cjs');
const local=read('www/booksup-46.js'),android=read('mobile/android-native/BooksUpNetworkPlugin.java');
for(const file of [
 'www/cloud-drive.js','www/cloud-drive-config.js','www/booksup-admin-config.js','www/medimops-prices.json',
 'www/news.json','www/booksup-translation-config.json','electron/booksup-drive.cjs',
 'mobile/android-native/BooksUpUpdaterPlugin.java','admin-worker/worker.mjs',
 '.github/workflows/news.yml','.github/workflows/medimops-prices.yml'
])assert.ok(!exists(file),'Retired server artifact remains: '+file);
const pkg=JSON.parse(read('package.json'));
for(const dep of ['electron-updater','@capgo/capacitor-social-login'])assert.ok(!pkg.dependencies[dep], 'unused online dependency '+dep);
assert.doesNotMatch(html,/src="cloud-drive|src="booksup-admin-config/);
assert.doesNotMatch(next,/'admin','Admin & Redaktion'|'news','profile','settings'/);
assert.doesNotMatch(next,/bu44PriceNotificationsView|BooksUpCloud/);
assert.doesNotMatch(desktop,/booksup-drive:|booksup-translate:|booksup-metadata:|autoUpdater|await fetch\(/);
assert.doesNotMatch(preload,/booksupDesktopDrive|booksupTranslation|booksupCatalog|booksupDnb|booksupDesktopUpdate/);
assert.match(preload,/booksupBackupFile/);
assert.match(preload,/booksupLan/);
assert.match(android,/private static final Pattern PRIVATE_IP/);
assert.doesNotMatch(android,/translateText|searchCatalog|api\.momox|libretranslate/);
assert.doesNotMatch(read('www/booksup-53.js'),/\/translate|BooksUpTranslationService/);
assert.doesNotMatch(read('www/booksup-44.js'),/medimops-prices\.json|MediMops-Preisalarm/);
assert.match(read('tools/android-init.cjs'),/BooksUpNetworkPlugin\.java/);
assert.doesNotMatch(read('tools/android-init.cjs'),/BooksUpUpdaterPlugin|configure-public-translation/);
assert.ok(html.includes("transfer:bu45TransferHub"),'LAN transfer screen must remain');
assert.ok(html.includes('reader:nextReader'),'reader must remain');
assert.ok(html.includes("settings:nextSettings"),'settings must remain');
const loaded=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
for(const file of loaded)if(!file.startsWith('http'))assert.ok(exists('www/'+file),'missing script '+file);
for(const file of loaded)if(file.endsWith('.js')&&!file.startsWith('http'))new Function(read('www/'+file));
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
for(const js of inline)new Function(js);
for(const file of ['www/booksup-50.js','www/booksup-50-pair.js','www/booksup-50-services.js','www/booksup-51.js','www/booksup-52.js','www/booksup-53.js','www/booksup-55.js','electron/booksup-windows-47.js','electron/booksup-windows-48.js','mobile/booksup-android-48.js'])new Function(read(file));
const start=local.indexOf('async function bu46Search(term,reset=true){'),end=local.indexOf('function bu46ChooseList(index){',start);
assert.ok(start>=0&&end>start);
let fetchCount=0,found='',status='',show='';
const rows=[{title:'The Hobbit',author:'J. R. R. Tolkien',isbn:'9780007458424',genre:'Fantasy'},
 {title:'Jane Eyre',author:'Charlotte Brontë',isbn:'9780008182250',genre:'Classic'}];
const elements={'bu46-search-status':{set textContent(v){status=v}},'bu46-search-items':{set innerHTML(v){show=v}}};
const ctx={CATB:rows,CATM:[],ALL:{book:{books:[],libraryBooks:[]},manga:{books:[],libraryBooks:[]}},
 buNorm:s=>String(s??'').normalize('NFKD').toLowerCase(),bu46Allowed:()=>true,bu46SearchSeq:0,
 bu46SearchTerm:'',bu46SearchBusy:false,bu46SearchResults:[],view:'discoverSearch',
 document:{getElementById:id=>elements[id]||null},bu46SearchCard:b=>'<article>'+b.title+'</article>',
 toast:()=>{},fetch:()=>{fetchCount++;throw Error('No remote fetch allowed')}};
vm.createContext(ctx);
vm.runInContext(local.slice(start,end)+';globalThis.searchBooks=bu46Search;',ctx);
(async()=>{
 await ctx.searchBooks('Hobbit');
 assert.equal(ctx.bu46SearchResults.length,1);
 assert.equal(ctx.bu46SearchResults[0].title,'The Hobbit');
 assert.match(status,/1 lokale Treffer/);
 assert.match(show,/The Hobbit/);
 await ctx.searchBooks('9780008182250');assert.equal(ctx.bu46SearchResults[0].title,'Jane Eyre');
 await ctx.searchBooks('missing');assert.equal(ctx.bu46SearchResults.length,0);
 assert.equal(fetchCount,0,'local catalog search must work without any network calls');
 console.log('PASS offline app graph, no server paths, JS parse, private LAN and local title/ISBN discovery');
})().catch(error=>{console.error(error);process.exitCode=1;});
