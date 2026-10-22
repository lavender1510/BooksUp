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
