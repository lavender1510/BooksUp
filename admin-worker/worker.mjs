/* Cloudflare Worker: verified BooksUp publisher only. Configure:
   OAuth CLIENT_ID, CLIENT_SECRET, GITHUB_PUBLISH_TOKEN, KV SESSIONS,
   ADMIN_LOGIN=lavender1510, optional ADMIN_GITHUB_ID. Never expose secrets. */
const repo='lavender1510/BooksUp';
const reply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const random=()=>crypto.randomUUID()+crypto.randomUUID();
const gh=async(url,token,init={})=>{
 const response=await fetch(url,{...init,headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,...(init.headers||{})}});
 if(!response.ok)throw Error('GitHub '+response.status);
 return response.json();
};
const origin=request=>new URL(request.url).origin;
async function session(req,env){
 const id=(req.headers.get('Cookie')||'').match(/(?:^|;\s*)booksup_admin=([a-f0-9-]{72})/)?.[1];if(!id)return null;
 const data=await env.SESSIONS.get('auth:'+id);if(!data)return null;return JSON.parse(data);
}
async function publish(env,file,next){
 const uri='https://api.github.com/repos/'+repo+'/contents/www/'+file;
 const token=env.GITHUB_PUBLISH_TOKEN;
 if(!token)throw Error('Publishing token not configured');
 let old={},sha;
 const r=await fetch(uri,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'}});
 if(r.ok){const j=await r.json();sha=j.sha;old=JSON.parse(atob(j.content.replace(/\s/g,'')))}
 else if(r.status!==404)throw Error('Could not retrieve current file');
 const data=JSON.stringify(next(old),null,2)+'\n';if(data.length>100000)throw Error('Content too large');
 const bytes=new TextEncoder().encode(data);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 const result=await gh(uri,token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'content: verified BooksUp admin publication',content:btoa(binary),...(sha?{sha}:{})})});
 return result.commit.sha;
}
const ADMIN_PAGE="<!doctype html><html lang=\"de\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>BooksUp Redaktion</title><style>body{font:15px system-ui;background:#171226;color:#f5eefc;max-width:680px;margin:40px auto;padding:18px}.box{background:#2b223e;padding:20px;border-radius:20px;margin-top:20px}label{display:block;margin:10px 0}input,textarea{width:100%;padding:9px;box-sizing:border-box;border-radius:10px;background:#171226;color:white;border:1px solid #69517b}button{background:#cf92f8;color:#191022;padding:11px;border:0;border-radius:10px;cursor:pointer}</style><h1>BooksUp · Redaktion</h1><p id=\"status\">Prüfe GitHub-Anmeldung …</p><section class=\"box\"><h2>News veröffentlichen</h2><label>Titel<input id=\"title\"></label><label>Zusammenfassung<textarea id=\"summary\"></textarea></label><label>Bild-URL (HTTPS)<input id=\"image\"></label><button onclick=\"publish('articles')\">News veröffentlichen</button></section><section class=\"box\"><h2>Buchinformationen ergänzen</h2><label>Titel<input id=\"book-title\"></label><label>Autor<input id=\"author\"></label><label>ISBN<input id=\"isbn\"></label><label>Genre<input id=\"genre\"></label><label>Beschreibung<textarea id=\"description\"></textarea></label><button onclick=\"publish('books')\">Daten veröffentlichen</button></section><script>let csrf='';const v=x=>document.getElementById(x).value;async function init(){const r=await fetch('/api/me');if(!r.ok){document.getElementById('status').textContent='Bitte über /auth/login anmelden.';document.querySelectorAll('button').forEach(b=>b.disabled=true);return}const j=await r.json();csrf=j.csrf;document.getElementById('status').textContent='Angemeldet: '+j.login}async function publish(kind){if(!csrf)return;const data=kind==='books'?{title:v('book-title'),author:v('author'),isbn:v('isbn'),genre:v('genre'),description:v('description')}:{title:v('title'),summary:v('summary'),image:v('image')};const res=await fetch('/api/'+kind,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':csrf},body:JSON.stringify(data)});document.getElementById('status').textContent=res.ok?'Erfolgreich veröffentlicht':'Fehler: '+(await res.text()).slice(0,190)}init()</script></html>";
const isHttps=x=>/^https:\/\/[^\s"<>]+$/i.test(String(x||''));
export default {async fetch(request,env){
 try{
  const u=new URL(request.url),path=u.pathname,base=origin(request);
  if(path==='/auth/login'&&request.method==='GET'){
   if(!env.CLIENT_ID||!env.CLIENT_SECRET||!env.SESSIONS)return reply({error:'OAuth not configured'},503);
   const state=random();await env.SESSIONS.put('oauth:'+state,'ready',{expirationTtl:600});
   const ghUrl=new URL('https://github.com/login/oauth/authorize');
   for(const [k,v] of Object.entries({client_id:env.CLIENT_ID,redirect_uri:base+'/auth/callback',state,scope:'read:user'}))ghUrl.searchParams.set(k,v);
   return Response.redirect(ghUrl.toString(),302);
  }
  if(path==='/auth/callback'&&request.method==='GET'){
   const st=u.searchParams.get('state')||'',code=u.searchParams.get('code')||'';
   if(!st||!code||await env.SESSIONS.get('oauth:'+st)!=='ready')return reply({error:'Invalid OAuth state'},403);
   await env.SESSIONS.delete('oauth:'+st);
   const raw=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.CLIENT_ID,client_secret:env.CLIENT_SECRET,code,redirect_uri:base+'/auth/callback'})});
   if(!raw.ok)return reply({error:'OAuth exchange failed'},503);
   const token=(await raw.json()).access_token;if(!token)return reply({error:'No OAuth token'},403);
   const user=await gh('https://api.github.com/user',token);
   if(String(user.login||'').toLowerCase()!==(env.ADMIN_LOGIN||'lavender1510').toLowerCase()||(env.ADMIN_GITHUB_ID&&String(user.id)!==String(env.ADMIN_GITHUB_ID)))return reply({error:'Not authorized'},403);
   const id=random(),csrf=random();
   await env.SESSIONS.put('auth:'+id,JSON.stringify({login:user.login,githubId:user.id,csrf}),{expirationTtl:14400});
   return new Response(null,{status:302,headers:{Location:base+'/admin','Set-Cookie':'booksup_admin='+id+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=14400','Cache-Control':'no-store'}});
  }
  if(path==='/admin'&&request.method==='GET')return new Response(ADMIN_PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  const current=await session(request,env);
  if(!current||String(current.login).toLowerCase()!==(env.ADMIN_LOGIN||'lavender1510').toLowerCase())return reply({error:'GitHub admin login required'},401);
  if(path==='/api/me'&&request.method==='GET')return reply({login:current.login,csrf:current.csrf});
  if(request.method!=='POST'||!['/api/articles','/api/books'].includes(path))return reply({error:'Not found'},404);
  if(request.headers.get('Origin')!==base||request.headers.get('X-CSRF')!==current.csrf)return reply({error:'CSRF validation failed'},403);
  if(Number(request.headers.get('Content-Length')||0)>16000)return reply({error:'Payload too large'},413);
  const x=await request.json();if(!x||typeof x!=='object'||String(x.title||'').length<3)return reply({error:'Invalid title'},422);
  let commit;
  if(path==='/api/articles'){
   const item={title:String(x.title).slice(0,160),summary:String(x.summary||'').slice(0,1000),image:isHttps(x.image)?x.image:null,date:new Date().toISOString(),source:'BooksUp Original',url:'https://github.com/'+repo+'/blob/main/www/admin-news.json',id:crypto.randomUUID()};
   commit=await publish(env,'admin-news.json',old=>({updatedAt:new Date().toISOString(),articles:[item,...(old.articles||[])].slice(0,120)}));
  }else{
   const book={};for(const k of ['title','author','isbn','genre','description','language','series','publisher','tags','minAge'])if(x[k]!==undefined)book[k]=String(x[k]).slice(0,k==='description'?3000:200);
   if(book.isbn&&!/^(\d{10}|\d{13})$/.test(book.isbn))return reply({error:'Invalid ISBN'},422);
   commit=await publish(env,'admin-books.json',old=>({updatedAt:new Date().toISOString(),books:[book,...(old.books||[])].slice(0,400)}));
  }
  return reply({ok:true,commit});
 }catch(e){return reply({error:String(e.message||e)},400)}
}};
