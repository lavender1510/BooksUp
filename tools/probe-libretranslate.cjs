'use strict';
// Diagnostic only: sends a fixed public test word, never BooksUp user data.
(async()=>{
 const url='https://de.libretranslate.com/translate';
 try{
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({q:['Guten Morgen'],source:'de',target:'en',format:'text'}),
   signal:AbortSignal.timeout(12000)});
  if(!res.ok){console.log('LibreTranslate de instance: HTTP '+res.status+' (anonymous translation NOT verified)');return;}
  const result=await res.json(),words=result?.translatedText;
  if(Array.isArray(words)&&typeof words[0]==='string'&&words[0].trim()&&words[0]!=='Guten Morgen'){
   console.log('LibreTranslate de instance: anonymous batch endpoint responded with translation (one-off probe; no SLA).');
  }else console.log('LibreTranslate de instance: HTTP 200 but translation response is unexpected.');
 }catch(error){console.log('LibreTranslate de instance: unreachable from CI ('+String(error?.name||'network error')+'); fallback required.');}
})().catch(()=>{console.log('LibreTranslate de instance: diagnostic inconclusive.');});
