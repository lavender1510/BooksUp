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
 assert.match(fs.readFileSync('electron/main.cjs','utf8'),/BOOKSUP_LIBRETRANSLATE_API_KEY/);
 assert.doesNotMatch(fs.readFileSync('www/booksup-53.js','utf8'),/X-API-TOKEN/);
 console.log('BooksUp 5.6 integrations: batch translation, privacy cache/offline fallback, ISBN checks and momox/retail separation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
