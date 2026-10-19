'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('www/booksup-51.js'),css=read('www/booksup-51.css'),lan=read('electron/booksup-lan.cjs');
new Function(src);new Function(lan);
assert.match(css,/\.bu50-font-row\[hidden\]\{display:none!important\}/);
assert.match(css,/bu51-mobile/);
assert.match(read('electron/main.cjs'),/booksup-lan\.cjs/);
assert.match(read('electron/preload.cjs'),/booksupLan/);
assert.match(read('tools/android-init.cjs'),/usesCleartextTraffic/);
assert.equal(JSON.parse(read('package.json')).version,'5.1.0');
let renders=0,saves=0,joined=0,discover=[],lookupCalls=0;
const fontRows=[{dataset:{font:'inter'},hidden:false},{dataset:{font:'roboto'},hidden:false},{dataset:{font:'comic sans'},hidden:false}];
const elements={
 'bu50-font-query':{value:'Roboto'},'bu51-font-count':{textContent:''},'bu46-search-status':{textContent:''},
 'bu46-search-items':{innerHTML:''},'bu51-lan-status':{textContent:''},'bu51-lan-host-details':{textContent:''},
 'bu50-local-sdp':{value:''},'bu50-remote-sdp':{value:''},
 'bu51-lan-address':{value:'192.168.1.8:42000'},'bu51-lan-pin':{value:'123456'}
};
const document={
 activeElement:null,
 getElementById:id=>elements[id]||null,
 querySelectorAll:q=>q==='.bu50-font-row'?fontRows:q==='.bu50-font-row:not([hidden])'?fontRows.filter(x=>!x.hidden):[],
 addEventListener:()=>{},body:{classList:{toggle:()=>{}}},documentElement:{style:{setProperty:()=>{}},classList:{toggle:()=>{}}}
};
const b={id:1,title:'Matilda',author:'Roald Dahl',isbn:'',publisher:'',description:''};
const book={books:[b],readingLists:[],mode:0,theme:0,paper:0,fs:1,rec:{}};
const manga={books:[],readingLists:[]};
const ALL={book,manga,nextTheme:'forest',bu50Appearance:{font:'Roboto',fontHeading:'Roboto'}};
const store=new Map();
const nativeBooks={google:[{volumeInfo:{title:'Matilda',authors:['Roald Dahl'],publisher:'Puffin',description:'A story of Matilda.',industryIdentifiers:[{type:'ISBN_13',identifier:'9780140328721'}]}}],open:[],errors:[]};
const lanSignals=[];
const win={
 Capacitor:{getPlatform:()=> 'android'},booksupCatalog:{search:async()=>nativeBooks},
 bu43AppearanceView:()=>'<div class="bu50-font-list"></div>',
 bu48Lookup:async()=>({candidates:[],suggestions:[],errors:[]}),
 bu50PairingView:()=>'<section class="bu50-pair"><div class="bu50-pair-steps"><div></div></div></section>',
 bu50StartPeer:async()=>{elements['bu50-local-sdp'].value=JSON.stringify({type:'offer',sdp:'v=0\r\nlocal'});},
 bu50AcceptPeer:async()=>{elements['bu50-local-sdp'].value=JSON.stringify({type:'answer',sdp:'v=0\r\nremote'});},
 bu50FinishPeer:async()=>{},bu50PeerStop:()=>{},
 booksupLan:{host:async()=>({pin:'123456',port:42000,ips:['192.168.1.8']}),poll:async()=>null,signal:async args=>{lanSignals.push(args);return args.action==='offer'?{offer:{type:'offer',sdp:'v=0\r\nlocal'}}:{ok:true}},stop:async()=>{}},
 nextAfterRender:()=>{},buTranslate:(v)=>v,buRecs:()=>({list:[{title:'A'},{title:'B'},{title:'C'},{title:'D'}],last:[]}),
 bu46Search:async()=>{},bu50SaveCombo:()=>{},
};
const env={window:win,document,ALL,S:book,sp:'book',view:'settingsDetail',cur:null,nextSettingCategory:'appearance',
 bu43AppearanceDraft:{mode:2,nextTheme:'forest',theme:4,paper:0,fs:3},bu43ApCapture:()=>({mode:2,nextTheme:'forest',theme:4,paper:0,fs:3}),
 bu43AppearanceBaseline:'',NEXT_SETTINGS:[],
 persist:()=>{saves++},render:()=>{renders++},toast:()=>{},prompt:()=> 'Mein Theme',
 localStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)},
 esc:v=>String(v??''),metadataGoogle:(v)=>({title:v.title,author:(v.authors||[]).join(', '),isbn:v.industryIdentifiers?.[0]?.identifier,publisher:v.publisher||'',description:v.description||''}),
 bu46Allowed:()=>true,bu46SearchResults:[],bu46SearchTerm:'',bu46SearchBusy:false,bu46SearchSeq:0,
 bu46SearchCard:(x,i)=>'<article>'+i+':'+x.title+'</article>',bu43LoadCovers:()=>{},
 bu45Extra:()=>[],bu44Remote:[],bu44LastFetch:0,BU44_REC_KEY:'booksup.rec.v44',bu44FetchRecommendations:async()=>{},
 buNorm:v=>String(v||'').toLowerCase(),raw:()=>{},db:async()=>{},put:async()=>true,
 navigator:{onLine:true},URL,Blob,crypto:{randomUUID:()=> 'unique-'+(saves+1)},Date,Number,Map,Set,Promise,
 confirm:()=>true,console,AbortSignal,fetch:async()=>({ok:false,status:400}),
 setTimeout:()=>0,setInterval:()=>0,clearTimeout:()=>{},clearInterval:()=>{}
};
vm.runInNewContext(src,env,{timeout:4000});
assert.equal(win.booksup51,true);
const combo=win.bu51SaveCombo();
assert.equal(ALL.bu48ThemeCombos.length,1,'Combination must survive on ALL');
assert.equal(combo.fs,3);
assert.equal(combo.theme,4);
assert.equal(combo.font,'Roboto');
assert.ok(saves>0,'Must persist combination');
book.theme=0;win.bu51ApplyCombo(combo.id);
assert.equal(book.theme,4,'Combination must actually restore style');
win.bu50ChooseFont();
assert.deepEqual(fontRows.map(x=>x.hidden),[true,false,true]);
assert.equal(elements['bu51-font-count'].textContent,'1 passende Schriftarten');
assert.match(win.bu50PairingView(),/Mit PIN verbinden/);
assert.match(win.bu50PairingView(),/192\.168\.1\.10/);
(async()=>{
 env.view='discoverSearch';
 await win.bu46Search('Matilda');
 assert.equal(env.bu46SearchResults.length,1,'Discover should show results');
 assert.match(elements['bu46-search-items'].innerHTML,/Matilda/);
 await win.bu48Lookup(1,{silent:true});
 assert.equal(b.publisher,'Puffin','Book enrichment should fill publisher');
 assert.ok(b.description.includes('Matilda'),'Book description should be filled');
 env.view='home';
 await win.bu46MoreBooks();
 assert.ok(ALL.recCycle>=1,'More books must change recommendation cycle');
 assert.ok(win.buRecs().list[0].title!=='A','Recommended book order must change');
 await win.bu51LanHost();
 assert.match(elements['bu51-lan-host-details'].textContent,/123456/);
 await win.bu51LanJoin();
 assert.deepEqual(lanSignals.map(x=>x.action),['offer','answer']);
 console.log('OK: BooksUp 5.1 persisted presets, mobile font search, discover/metadata, recommendations and LAN PIN');
})().catch(e=>{console.error(e);process.exitCode=1});
