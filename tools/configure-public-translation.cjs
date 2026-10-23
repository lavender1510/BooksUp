'use strict';
// Writes ONLY a public HTTPS endpoint into the distributed www/ bundle.
// An API token or credentials must NEVER be placed here.
const fs=require('node:fs'),path=require('node:path');
const defaultFile=path.join(__dirname,'..','www','booksup-translation-config.json');

function validatePublicEndpoint(input){
 const text=String(input??'').trim();
 if(!text)return '';
 if(text.length>250||/[\s<>]/.test(text))throw Error('Translation endpoint must be a short HTTPS URL');
 let url;try{url=new URL(text);}catch{throw Error('Invalid translation endpoint URL');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||
  url.search||url.hash||url.pathname!=='/translate'||
  !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(url.hostname)||
  url.hostname.toLowerCase().endsWith('.local')){
  throw Error('Endpoint must be https://<public-domain>/translate without credentials, port or parameters');
 }
 return url.href;
}
function resolvePublicEndpoint({env=process.env,file=defaultFile}={}){
 const override=env.BOOKSUP_PUBLIC_TRANSLATION_URL;
 if(override!==undefined)return validatePublicEndpoint(override);
 if(!fs.existsSync(file))return '';
 const parsed=JSON.parse(fs.readFileSync(file,'utf8'));
 return validatePublicEndpoint(parsed?.endpoint);
}
function configure({env=process.env,file=defaultFile}={}){
 const endpoint=resolvePublicEndpoint({env,file});
 fs.writeFileSync(file,JSON.stringify({endpoint},null,2)+'\n');
 console.log('BooksUp public translation URL:',endpoint?new URL(endpoint).host+' (configured)':'not configured (offline dictionaries only)');
 return endpoint;
}
module.exports={validatePublicEndpoint,resolvePublicEndpoint,configure};
if(require.main===module){try{configure();}catch(error){console.error(String(error?.message||error));process.exitCode=1;}}
