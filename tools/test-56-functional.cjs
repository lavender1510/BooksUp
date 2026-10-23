'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('www/booksup-55.js');
const themes=read('www/booksup-next.js');
function between(text,a,b){const p=text.indexOf(a),q=text.indexOf(b,p);assert.ok(p>=0&&q>p,'Missing source section: '+a);return text.slice(p,q);}
for(const file of ['www/booksup-next.js','www/booksup-43.js','www/booksup-53.js','www/booksup-55.js','www/booksup-50-pair.js'])new Function(read(file));
{
 const context={nextLanguage:()=> 'de',buNorm:v=>String(v||'').toLowerCase()};vm.createContext(context);
 vm.runInContext(between(source,'const simWords=','window.bu46SimilarLoad=')+';globalThis.relevance=simScore;',context);
 const score=context.relevance;
 const seed={title:'The Last Dragon',author:'C. A. North',genre:'Fantasy',tags:'dragons, magic',description:'A dragon protects a lost magical kingdom',year:2017};
 assert.equal(score(seed,{title:'Tax Law',author:'Other',genre:'Nonfiction',tags:'finance',description:'Corporation tax filing',year:2018}),-1,'Unrelated books must be rejected');
 assert.ok(score(seed,{title:'Dragon Kingdom',author:'M. Aran',genre:'Fantasy',tags:'dragons, magic',description:'A magical dragon kingdom',year:2020})>20,'Related books should pass');
 assert.ok(score(seed,{title:'Another Story',author:'C. A. North',genre:'Adventure',description:'A distant journey'})>20,'Same-author relevance should pass');
 assert.equal(score({...seed,genre:'Detective',tags:'forensics',author:'B'}, {title:'Dragon Kingdom',genre:'Fantasy',tags:'magic',author:'M'}),-1,'No universal recommendation list');
}
{
 const written={};
 const style={setProperty:(k,v)=>{written[k]=v},removeProperty:k=>{delete written[k]}};
 const root={style,dataset:{}},match={matches:true,addEventListener(){}};
 const context={document:{documentElement:root,querySelector:()=>({})},
 getComputedStyle:()=>({getPropertyValue:()=> '#111'}),matchMedia:()=>match,
 NEXT_THEMES:[['Night','night','#111','#222','#eee','#aaa','#333','#7af','dark']],
 ALL:{nextTheme:'night'},S:{mode:1,theme:0},T:[['Normal','#abc']],view:'home'};
 vm.createContext(context);
 vm.runInContext(between(themes,'function nextApplyTheme(){','function nextLanguageChooser()')+';globalThis.apply=nextApplyTheme;',context);
 context.apply();assert.equal(root.dataset.theme,'light');assert.equal(written['--bg'],undefined,'Dark palette must not overwrite light mode');
 context.S.mode=2;context.apply();assert.equal(root.dataset.theme,'dark');assert.equal(written['--bg'],'#111');
 context.S.mode=0;context.apply();assert.equal(root.dataset.theme,'dark','System should follow OS');
 match.matches=false;context.apply();assert.equal(root.dataset.theme,'light','System reacts to OS light mode');
}
assert.match(themes,/function nextSaveLanguage\(/);
assert.match(themes,/function nextDiscardLanguage\(/);
assert.match(source,/function sessionHud\(/);
assert.match(source,/recoverAutoSession\(/);
// Device-transfer ACK must only be emitted after confirmed durable import.
const peer=read('www/booksup-50-pair.js');
assert.match(peer,/const connected=\(\)=>ready&&channel\?\.readyState==='open'/);
assert.match(peer,/const durable=await put\('__state',JSON\.stringify\(ALL\)\)/);
assert.match(peer,/if\(!durable\)throw Error/);
assert.match(peer,/const accepted=await preview\(p\)/);
assert.match(peer,/if\(accepted&&channel\?\.readyState==='open'\)channel\.send/);
const androidCi=read('.github/workflows/check-android-48.yml');
assert.doesNotMatch(androidCi,/APK='release\/BooksUp-5\.4\.0\.apk'/);
assert.match(androidCi,/VERSION="\$\(node -p/);
console.log('BooksUp 5.6 targeted functional and syntax tests passed.');
