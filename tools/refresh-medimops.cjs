'use strict';
// Publisher-side price ingestion only; no credentials in the Android/Windows app.
// momox's /offer endpoint is a BUYBACK price, never a medimops retail sale price.
const fs=require('node:fs');
const FEED='www/medimops-prices.json';
const clean=v=>String(v||'').replace(/[^0-9X]/gi,'').toUpperCase();
function validIsbn(value){
 const s=clean(value);
 if(/^\d{13}$/.test(s)){let sum=0;for(let i=0;i<13;i++)sum+=Number(s[i])*(i%2?3:1);return sum%10===0;}
 if(/^\d{9}[\dX]$/.test(s)){let sum=0;for(let i=0;i<10;i++)sum+=(s[i]==='X'?10:Number(s[i]))*(10-i);return sum%11===0;}
 return false;
}
function validateRetail(items){
 if(!Array.isArray(items))throw Error('Retail provider must return a prices array');
 const prices=[],seen=new Set();
 for(const item of items.slice(0,2500)){
  const isbn=clean(item.isbn||item.ean);
  if(!validIsbn(isbn)||String(item.provider||'').toLowerCase()!=='medimops'||seen.has(isbn))continue;
  const price=Number(item.price),url=String(item.url||'');
  if(!Number.isFinite(price)||price<0||price>5000||String(item.currency||'').toUpperCase()!=='EUR')continue;
  prices.push({isbn,provider:'medimops',price:Math.round(price*100)/100,currency:'EUR',
   source:'MediMops · verifizierter externer Verkaufsdatenanbieter',
   url:/^https:\/\/(www\.)?medimops\.de\//i.test(url)?url:''});
  seen.add(isbn);
 }
 return prices;
}
async function retailPrices(fetcher,env){
 const endpoint=env.BOOKSUP_MEDIMOPS_PROVIDER_URL||'';
 if(!endpoint)return null;
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Retail provider must use an HTTPS URL without credentials');
 const token=env.BOOKSUP_MEDIMOPS_PROVIDER_TOKEN||'';
 const response=await fetcher(endpoint,{headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Medimops retail provider HTTP '+response.status);
 return validateRetail((await response.json()).prices);
}
async function momoxOffers(fetcher,env){
 const token=env.BOOKSUP_MOMOX_API_TOKEN||'';
 const codes=[...new Set(String(env.BOOKSUP_MOMOX_EANS||'').split(/[\s,;]+/).map(clean).filter(Boolean))];
 if(!token||!codes.length)return null;
 if(codes.length>40||codes.some(x=>!validIsbn(x)))throw Error('Publisher configured invalid or excessive momox EAN list');
 const marketplace=env.BOOKSUP_MOMOX_MARKETPLACE_ID||'momox_de';
 if(!/^[a-z]{3,12}_[a-z]{2,3}$/.test(marketplace))throw Error('Invalid marketplace');
 const rows=[];
 for(const isbn of codes){
  const endpoint='https://api.momox.de/api/v4/offer/?ean='+encodeURIComponent(isbn);
  const response=await fetcher(endpoint,{headers:{Accept:'application/json','X-API-TOKEN':token,'X-MARKETPLACE-ID':marketplace},signal:AbortSignal.timeout(12000)});
  if(response.status===429)throw Error('momox API rate limited: retry later');
  if(response.status===401||response.status===403)throw Error('momox API authorization failed: configure valid publisher credentials');
  if(!response.ok){console.warn('momox offer not available for configured EAN:',isbn,'HTTP',response.status);continue;}
  const data=await response.json();
  if(clean(data?.product?.ean)!==isbn||data?.status!=='offer')continue;
  const price=Number(data.price);
  if(!Number.isFinite(price)||price<0||price>5000||String(data.currency||'').toLowerCase()!=='eur')continue;
  rows.push({isbn,provider:'momox',price:Math.round(price*100)/100,currency:'EUR',
   kind:'buyback',source:'momox Ankauf (nicht MediMops-Verkaufspreis)'});
 }
 return rows;
}
async function main({fetcher=fetch,env=process.env,file=FEED}={}){
 const retail=await retailPrices(fetcher,env);
 const buyback=await momoxOffers(fetcher,env);
 if(retail===null&&buyback===null){console.log('No authorized provider configured: existing price feed preserved.');return null;}
 let existing={updatedAt:null,prices:[],momoxUpdatedAt:null,momoxOffers:[]};
 try{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data&&typeof data==='object')existing={...existing,...data};}catch{}
 const stamp=new Date().toISOString();
 const out={updatedAt:retail!==null?stamp:existing.updatedAt,prices:retail===null?existing.prices:retail,
  momoxUpdatedAt:buyback!==null?stamp:existing.momoxUpdatedAt,
  momoxOffers:buyback===null?existing.momoxOffers:buyback};
 fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');
 console.log('Published',out.prices.length,'verified retail prices and',out.momoxOffers.length,'separately labeled momox buyback offers.');
 return out;
}
module.exports={clean,validIsbn,validateRetail,retailPrices,momoxOffers,main};
if(require.main===module)main().catch(error=>{console.error(String(error?.message||error));process.exitCode=1;});
