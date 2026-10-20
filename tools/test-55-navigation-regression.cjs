'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ui=read('www/booksup-55.js'),polish=read('www/booksup-polish.js'),news=read('www/booksup-49.js');
assert.match(ui,/const navDefault=\['home','library','shelf','news','profile','settings'\]/);
assert.match(ui,/ALL\.bu55BottomNav/);
assert.match(ui,/nextSettingCategory!=='navigation'/);
assert.match(news,/role="status"/);
assert.match(news,/onclick="buLoadNews\(true\)">Wiederholen/);
assert.match(polish,/buNewsLastError/);
assert.match(polish,/now-buNewsRequest<30000/);
const begin=polish.indexOf('async function buLoadNews(force=false){');
const end=polish.indexOf("\ntry{const n=JSON.parse(localStorage.getItem('booksup.news.cache')",begin);
assert.ok(begin>0&&end>begin,'news function boundaries');
let fetchCalls=0,renders=0,online=false;
const ctx={view:'news',buNewsLoading:false,buNewsLastError:'',buNewsArticles:[],buNewsUpdated:0,buNewsRequest:0,
 navigator:{get onLine(){return online}},BU_NEWS_URL:'https://example.org/news.json',AbortController,
 Date,Error,Math,JSON,Promise,console,setTimeout(){return 1},clearTimeout(){},
 fetch:async()=>{fetchCalls++;return{ok:true,json:async()=>({articles:[{title:'Real article',url:'https://example.org/story'}],updatedAt:123})}},
 bu46ApplyEditorial(){throw Error('optional enrichment error')},localStorage:{setItem(){}},render(){renders++},toast(){}};
vm.createContext(ctx);vm.runInContext(polish.slice(begin,end),ctx);
(async()=>{
 await ctx.buLoadNews();
 assert.match(ctx.buNewsLastError,/Keine Internetverbindung/);
 assert.equal(fetchCalls,0);
 const prior=renders;
 await ctx.buLoadNews();
 assert.equal(fetchCalls,0);
 assert.equal(renders,prior,'no infinite offline rerenders');
 online=true;await ctx.buLoadNews(true);
 assert.equal(fetchCalls,1);
 assert.equal(ctx.buNewsLastError,'');
 assert.equal(ctx.buNewsArticles.length,1);
 const nc={buNewsArticles:[],buNewsLastError:'Keine Internetverbindung.',buNewsLoading:false,newsTab:'all',window:{},savedNews:()=>({}),q:x=>String(x)};
 const a=news.indexOf('window.buNewsView = function(){'),b=news.indexOf('\n// Selected items are already tracked',a);
 assert.ok(a>0&&b>a);
 vm.createContext(nc);vm.runInContext(news.slice(a,b),nc);
 const html=nc.window.buNewsView();
 assert.match(html,/Wiederholen/);assert.match(html,/Keine Internetverbindung/);
 console.log('OK: default navigation, offline state, retry, cached News, optional-service isolation.');
})().catch(error=>{console.error(error);process.exitCode=1});
