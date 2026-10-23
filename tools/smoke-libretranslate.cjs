'use strict';
// End-to-end deployment smoke test. Sends only public fixed sample UI strings.
const {validatePublicEndpoint}=require('./configure-public-translation.cjs');
async function main(endpoint=process.argv[2]){
 if(!endpoint)throw Error('Usage: node tools/smoke-libretranslate.cjs https://your-host.example/translate');
 endpoint=validatePublicEndpoint(endpoint);
 const langUrl=new URL('/languages',endpoint);
 const languageResponse=await fetch(langUrl,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});
 if(!languageResponse.ok)throw Error('GET /languages: HTTP '+languageResponse.status);
 const languages=await languageResponse.json();
 const codes=new Set(Array.isArray(languages)?languages.map(x=>String(x.code||'')):[]);
 for(const code of ['de','en','fr','es','it'])if(!codes.has(code))throw Error('Missing LibreTranslate language: '+code);
 for(const target of ['en','fr','es','it']){
  const input=['Guten Morgen','Sprache wechseln'];
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({q:input,source:'de',target,format:'text'}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('POST /translate de→'+target+': HTTP '+response.status);
  const result=await response.json();
  if(!Array.isArray(result?.translatedText)||result.translatedText.length!==input.length||
   result.translatedText.some(s=>typeof s!=='string'||!s.trim()))throw Error('Invalid batch translation response for '+target);
  console.log('PASS de → '+target+': '+result.translatedText[0].slice(0,50));
 }
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({q:['Translate this'],source:'en',target:'de',format:'text'}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('POST /translate en→de: HTTP '+response.status);
 const result=await response.json();
 if(!Array.isArray(result.translatedText)||!result.translatedText[0])throw Error('Invalid German response');
 console.log('PASS en → de; all five BooksUp target languages confirmed without API key.');
}
if(require.main===module)main().catch(e=>{console.error(String(e?.message||e));process.exitCode=1;});
module.exports={main};
