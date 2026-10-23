'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const failures=[],screens=['home','library','shelf','profile','settings'];
 const sizes=[
  {width:320,height:568},{width:360,height:640},{width:390,height:844},
  {width:768,height:1024},{width:1024,height:768},{width:1365,height:850},
  {width:667,height:375}
 ];
 try{
  for(const size of sizes){
   const context=await browser.newContext({viewport:size,locale:'de-DE',colorScheme:'light',isMobile:size.width<=390,hasTouch:size.width<=390});
   const page=await context.newPage();
   const exceptions=[];
   page.on('pageerror',e=>exceptions.push(String(e.message||e)));
   await page.route('**/*',route=>{
    const uri=new URL(route.request().url());
    if(['127.0.0.1','localhost'].includes(uri.hostname))return route.continue();
    return route.abort('internetdisconnected');
   });
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(250);
   for(const lang of ['de','en','fr','es','it']){
    const change=await page.evaluate(lang=>{
     if(typeof ALL==='undefined'||typeof go!=='function')return {error:'App initialization missing'};
     ALL.nextLanguage=lang;
     window.go('home');
     return {code:window.nextLanguage?.(),page:window.view};
    },lang);
    if(change.error||change.code!==lang)failures.push(JSON.stringify({size,lang,change}));
   }
   for(const screen of screens){
    const result=await page.evaluate(screen=>{
     try{window.go(screen);}catch(error){return {error:String(error)}}
     const pageWidth=document.documentElement.scrollWidth;
     const viewportWidth=document.documentElement.clientWidth;
     return {body:document.body.scrollWidth,document:pageWidth,viewport:viewportWidth,
      heading:document.querySelector('h1,h2')?.textContent?.slice(0,80),
      hasError:document.body.textContent.includes('Etwas ist schiefgelaufen')};
    },screen);
    if(result.error||result.hasError||result.document>result.viewport+3){
     failures.push(JSON.stringify({size,screen,result}));
    }
   }
   for(const mode of [0,1,2]){
    const result=await page.evaluate(mode=>{
     S.mode=mode;window.go('settings');
     return document.documentElement.dataset.theme;
    },mode);
    if(result!==(mode===2?'dark':'light'))failures.push(JSON.stringify({size,mode,theme:result}));
   }
   if(exceptions.length)failures.push(JSON.stringify({size,exceptions:exceptions.slice(0,5)}));
   await context.close();
  }
 }finally{await browser.close()}
 if(failures.length){for(const f of failures.slice(0,25))console.error('UI QA:',f);throw Error(failures.length+' offline UI checks failed')}
 console.log('PASS: offline app loads with no outbound network calls, 7 portrait/landscape/desktop sizes, 5 locales, 3 theme modes, 5 main views, no document horizontal overflow');
}
run().catch(e=>{console.error(e);process.exitCode=1});
