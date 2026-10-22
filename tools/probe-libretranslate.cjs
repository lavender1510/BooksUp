'use strict';
// Public, fixed probe only. Sends no BooksUp user data and no credentials.
(async()=>{
 const url='https://de.libretranslate.com/translate';
 for(const [mode,payload] of [
  ['batch',{q:['Guten Morgen'],source:'de',target:'en',format:'text'}],
  ['single',{q:'Guten Morgen',source:'de',target:'en',format:'text'}]
 ]){
  try{
   const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
   const body=await res.text();
   let json;try{json=JSON.parse(body);}catch{}
   const detail=json?.error||json?.message||'';
   if(!res.ok){console.log('LibreTranslate de '+mode+': HTTP '+res.status+' '+String(detail).slice(0,120));continue;}
   const text=json?.translatedText;
   const result=Array.isArray(text)?text[0]:text;
   if(typeof result==='string'&&result&&result!=='Guten Morgen')console.log('LibreTranslate de '+mode+': live translation confirmed');
   else console.log('LibreTranslate de '+mode+': response received, translation unverified');
  }catch(error){console.log('LibreTranslate de '+mode+': network error ('+String(error?.name||'unavailable')+').');}
 }
})().catch(()=>{console.log('LibreTranslate de: probe inconclusive.');});
(async()=>{
 const hosts=['https://translate.argosopentech.com/translate','https://libretranslate.de/translate'];
 await Promise.all(hosts.map(async endpoint=>{
  const hostname=new URL(endpoint).hostname;
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({q:['Guten Morgen'],source:'de',target:'en',format:'text'}),signal:AbortSignal.timeout(10000)});
   if(!response.ok){console.log('LibreTranslate '+hostname+': HTTP '+response.status);return;}
   const result=await response.json(),text=result?.translatedText;
   if(Array.isArray(text)&&text[0]&&text[0]!=='Guten Morgen')console.log('LibreTranslate '+hostname+': anonymous batch supported');
   else console.log('LibreTranslate '+hostname+': response not compatible with batch');
  }catch(error){console.log('LibreTranslate '+hostname+': unavailable ('+String(error?.name||'network')+').');}
 }));
})().catch(()=>{});

