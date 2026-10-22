'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {validIsbn,validateRetail,momoxOffers,main}=require('./refresh-medimops.cjs');
const good='9783527507993',other='9783864906114';
assert.ok(validIsbn(good));assert.ok(validIsbn(other));assert.equal(validIsbn('9783527507994'),false);
assert.deepEqual(validateRetail([{isbn:good,provider:'momox',price:'4.12',currency:'EUR'}]),[],'Buyback is never retail');
assert.equal(validateRetail([{isbn:good,provider:'medimops',price:'12.45',currency:'EUR'}])[0].price,12.45);
const calls=[];
async function mockFetch(url,init){
 calls.push({url,init});
 if(url.includes('api.momox.de'))return {ok:true,status:200,json:async()=>({status:'offer',price:'4.12',currency:'eur',product:{ean:good}})};
 return {ok:true,status:200,json:async()=>({prices:[{isbn:good,provider:'medimops',price:'12.45',currency:'EUR',url:'https://www.medimops.de/buch'}]})};
}
(async()=>{
 const env={BOOKSUP_MOMOX_API_TOKEN:'test-secret-not-real',BOOKSUP_MOMOX_EANS:good,BOOKSUP_MEDIMOPS_PROVIDER_URL:'https://retail.example.org/books'};
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'booksup-price-test-')),file=path.join(root,'prices.json');
 try{
  const output=await main({fetcher:mockFetch,env,file});
  assert.equal(output.prices[0].price,12.45);
  assert.equal(output.momoxOffers[0].price,4.12);
  assert.equal(output.momoxOffers[0].kind,'buyback');
  assert.equal(calls.find(x=>x.url.includes('api.momox.de')).init.headers['X-API-TOKEN'],env.BOOKSUP_MOMOX_API_TOKEN);
  assert.equal(calls.find(x=>x.url.includes('api.momox.de')).init.headers['X-MARKETPLACE-ID'],'momox_de');
  assert.ok(!fs.readFileSync(file,'utf8').includes(env.BOOKSUP_MOMOX_API_TOKEN),'No secret may appear in public feed');
  const frozen=fs.readFileSync(file,'utf8');
  await main({fetcher:mockFetch,env:{},file});
  assert.equal(fs.readFileSync(file,'utf8'),frozen,'Missing providers preserve previous feed');
  await assert.rejects(momoxOffers(async()=>({status:429,ok:false}),env),/rate limited/);
  await assert.rejects(momoxOffers(mockFetch,{...env,BOOKSUP_MOMOX_EANS:'1234567890123'}),/invalid/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 const script=fs.readFileSync('www/booksup-53.js','utf8');
 const start=script.indexOf('const LT_LANGS='),end=script.indexOf('const after=window.nextAfterRender;',start);
 assert.ok(start>=0&&end>start,'Translation service must be present in the existing locale module');
 const cache=new Map(),requestCalls=[];let offline=false;
 const privateParent={tagName:'SPAN',closest:()=>null};
 const publicParent={tagName:'SPAN',closest:selector=>selector==='[data-bu-ui-translate]'?publicParent:null};
 const privateNode={nodeValue:'My secret password',parentElement:privateParent,isConnected:true};
 const publicNode={nodeValue:'Wähle die Sprache',parentElement:publicParent,isConnected:true};
 const nodes=[privateNode,publicNode];
 const app={querySelectorAll:()=>[]};
 const scope={
  window:{booksupTranslation:{translateMany:async args=>{requestCalls.push(args);if(offline)throw Error('offline');return {translatedText:args.texts.map(x=>'Choose the language')};}}},
  document:{createTreeWalker:()=>{let i=-1;return {nextNode(){i++;return i<nodes.length;},get currentNode(){return nodes[i];}}}},
  NodeFilter:{SHOW_TEXT:4},navigator:{onLine:true},localStorage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)},
  canonical:new Map(),knownTranslations:new Map(),localeIndex:{en:0,fr:1,es:2,it:3},nextLanguage:()=> 'en',
  URL,Date,Math,JSON,Map,Set,Array,Promise,console,
  setTimeout:()=>1,clearTimeout:()=>{},
 };
 vm.createContext(scope);
 vm.runInContext(script.slice(start,end),scope,{timeout:3000});
 scope.window.BooksUpTranslationService.translateUI(app,'en');
 await vm.runInContext('ltFlush()',scope);
 assert.equal(publicNode.nodeValue,'Choose the language');
 assert.equal(privateNode.nodeValue,'My secret password');
 assert.equal(requestCalls.length,1);
 assert.equal(requestCalls[0].source,'auto');
 assert.deepEqual(Array.from(requestCalls[0].texts),['Wähle die Sprache']);
 publicNode.nodeValue='Wähle die Sprache';
 scope.window.BooksUpTranslationService.translateUI(app,'en');
 assert.equal(publicNode.nodeValue,'Choose the language','Cache should apply synchronously');
 assert.equal(requestCalls.length,1,'Cached texts must not cause duplicate requests');
 const loaded=JSON.parse(cache.get('booksup.libretranslate.ui.v1'));assert.equal(loaded['en|Wähle die Sprache'],'Choose the language');
 offline=true;
 publicNode.nodeValue='Eine neue Beschriftung';
 scope.window.BooksUpTranslationService.translateUI(app,'en');
 await vm.runInContext('ltFlush()',scope);
 assert.equal(publicNode.nodeValue,'Eine neue Beschriftung','API errors must preserve existing UI');
 assert.ok(!JSON.stringify(scope.window).includes('test-secret-not-real'),'No publisher tokens in renderer');
 offline=false;
 for(const lang of ['de','en','fr','es','it']){
  const values=await scope.window.BooksUpTranslationService.translateMany(['Weitere Optionen'],lang);
  assert.equal(values[0],'Choose the language');
  assert.equal(requestCalls.at(-1).target,lang,'All five target language codes must reach the bridge');
 }
 assert.match(fs.readFileSync('electron/main.cjs','utf8'),/BOOKSUP_LIBRETRANSLATE_API_KEY/);
 assert.doesNotMatch(fs.readFileSync('www/booksup-53.js','utf8'),/X-API-TOKEN/);

 // Exercise the actual UI price-watch functions with simulated retailer, momox and offline responses.
 const priceSource=fs.readFileSync('www/booksup-44.js','utf8');
 const pa=priceSource.indexOf('function bu44ValidIsbn('),pb=priceSource.indexOf('/* Actual PDF zoom',pa);
 assert.ok(pa>0&&pb>pa);
 const saved={isbn:good,title:'Verified book',lastPrice:null,lastChecked:null,targetPrice:12,history:[],alerts:[]};
 const current={updatedAt:new Date().toISOString(),prices:[{isbn:good,provider:'medimops',currency:'EUR',price:13.45}],
  momoxOffers:[{isbn:good,provider:'momox',kind:'buyback',price:3.25,currency:'EUR'}]};
 let notices=0,alerted=0,priceHttp=200;
 const state={ALL:{medimopsWatches:[saved]},window:{BOOKSUP_PRICE_FEED_URL:'https://prices.example.org/feed'},
  navigator:{onLine:true},Date,Number,Math,JSON,Promise,Array,Set,AbortController,console,
  setTimeout,clearTimeout,esc:String,toast:()=>{notices++;},alert:()=>{alerted++;},
  confirm:()=>true,prompt:()=>null,persist:()=>{},render:()=>{},
  fetch:async()=>({ok:priceHttp===200,status:priceHttp,json:async()=>current})};
 vm.createContext(state);
 const prelude=`let bu44PriceBusy=false;
 function bu44EditionIsbn(v){return String(v||'').replace(/[^0-9X]/gi,'').slice(0,13)}
 function bu44Watches(){return ALL.medimopsWatches}`;
 vm.runInContext(prelude+priceSource.slice(pa,pb)+';globalThis.priceApi={check:bu44CheckWatches,prompt:bu44WatchPrompt,ui:bu44PriceNotificationsView}',state);
 await state.priceApi.check(true);
 assert.equal(saved.lastPrice,13.45,'First Retail quote must be saved');
 assert.equal(saved.alerts.length,0,'First higher-than-target quote causes no alarm');
 assert.match(state.priceApi.ui(),/momox Ankauf: 3\.25/,'Buyback must be labeled separately');
 assert.match(state.priceApi.ui(),/kein MediMops-Verkaufspreis/);
 current.prices[0].price=11.85;state.ALL.lastPriceManualCheck=0;
 await state.priceApi.check(true);
 assert.equal(saved.lastPrice,11.85);
 assert.equal(saved.alerts.length,1,'Threshold reached and change should emit a single alert');
 assert.ok(saved.alerts[0].targetHit);
 assert.equal(saved.history.length,2);
 state.navigator.onLine=false;await state.priceApi.check(true);
 assert.equal(saved.lastPrice,11.85,'Offline must retain the last price');
 state.navigator.onLine=true;state.ALL.lastPriceManualCheck=0;priceHttp=429;
 await state.priceApi.check(true);
 assert.equal(saved.lastPrice,11.85,'HTTP 429 must not destroy cached prices');
 assert.match(state.ALL.medimopsLastError,/zu viele Anfragen/);
 state.priceApi.prompt({title:'Missing ISBN'});assert.equal(alerted,1,'Missing ISBN requires explanatory message');
 console.log('BooksUp 5.6 integrations: batch translation, privacy cache/offline fallback, ISBN checks and momox/retail separation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
