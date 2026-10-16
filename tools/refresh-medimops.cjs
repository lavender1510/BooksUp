'use strict';
const fs=require('node:fs');
async function main(){
 const endpoint=process.env.BOOKSUP_MEDIMOPS_PROVIDER_URL||'';
 const token=process.env.BOOKSUP_MEDIMOPS_PROVIDER_TOKEN||'';
 if(!endpoint){console.log('No configured price provider; preserving feed.');return}
 if(!/^https:\/\//.test(endpoint))throw Error('Provider must use HTTPS');
 const response=await fetch(endpoint,{headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Provider returned '+response.status);
 const doc=await response.json();
 if(!Array.isArray(doc.prices))throw Error('Provider must return a prices array');
 const prices=[],seen=new Set();
 for(const item of doc.prices.slice(0,2500)){
  const isbn=String(item.isbn||'').replace(/[^\dX]/gi,'');
  if(!/^(\d{10}|\d{13})$/.test(isbn)||String(item.provider||'').toLowerCase()!=='medimops'||seen.has(isbn))continue;
  const price=Number(item.price);
  if(!Number.isFinite(price)||price<0||price>5000||item.currency!=='EUR')continue;
  const url=String(item.url||'');
  prices.push({isbn,provider:'medimops',price:Math.round(price*100)/100,currency:'EUR',source:'MediMops · externer Preis-Datenanbieter',url:/^https:\/\/(www\.)?medimops\.de\//i.test(url)?url:''});
  seen.add(isbn);
 }
 fs.writeFileSync('www/medimops-prices.json',JSON.stringify({updatedAt:new Date().toISOString(),prices},null,2)+'\n');
 console.log('Published '+prices.length+' prices. No user watchlists published.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
