'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {validatePublicEndpoint,resolvePublicEndpoint,configure}=require('./configure-public-translation.cjs');

const host='https://translate.books.example/translate';
assert.equal(validatePublicEndpoint(host),host);
assert.equal(validatePublicEndpoint(''), '');
for(const bad of [
 'http://translate.example.org/translate',
 'https://localhost/translate',
 'https://127.0.0.1/translate',
 'https://test.example.org:5000/translate',
 'https://foo:password@test.example.org/translate',
 'https://test.example.org/translate?api_key=secret',
 'https://test.example.org/docs',
 'https://test.example.org/translate#token',
 'https://192.168.0.1/translate',
 'https://anything.local/translate'
])assert.throws(()=>validatePublicEndpoint(bad),undefined,bad);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booksup-translation-config-'));
try{
 const file=path.join(dir,'translation.json');
 assert.equal(configure({env:{BOOKSUP_PUBLIC_TRANSLATION_URL:host},file}),host);
 assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),{endpoint:host});
 assert.equal(resolvePublicEndpoint({env:{},file}),host);
 assert.throws(()=>configure({env:{BOOKSUP_PUBLIC_TRANSLATION_URL:'https://u:secret@example.com/translate'},file}));
 assert.ok(!fs.readFileSync(file,'utf8').includes('secret'));
 assert.equal(configure({env:{BOOKSUP_PUBLIC_TRANSLATION_URL:''},file}),'');
 assert.equal(resolvePublicEndpoint({env:{},file}),'');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const compose=read('deploy/libretranslate/compose.yml'),caddy=read('deploy/libretranslate/Caddyfile');
assert.match(compose,/libretranslate\/libretranslate:/);
assert.match(compose,/LT_API_KEYS: "false"/);
assert.match(compose,/LT_LOAD_ONLY: "de,en,fr,es,it"/);
assert.match(compose,/LT_BATCH_LIMIT: "12"/);
assert.match(compose,/LT_REQ_LIMIT: "30"/);
assert.doesNotMatch(compose,/"5000:5000"/,'Only Caddy should be exposed to the Internet');
assert.match(caddy,/reverse_proxy libretranslate:5000/);
assert.match(caddy,/\{\$TRANSLATE_DOMAIN\}/);
assert.match(caddy,/max_size 24KB/);
const android=read('tools/android-init.cjs');
assert.match(android,/resolvePublicEndpoint\(\)/);
assert.match(android,/appendFileSync\(join\(publicDir,'booksup-android-48.js'\)/);
assert.match(android,/BOOKSUP_LIBRETRANSLATE_URL/);
const desktop=read('electron/main.cjs');
assert.match(desktop,/booksup-translation-config\.json/);
assert.match(desktop,/BOOKSUP_LIBRETRANSLATE_API_KEY/);
assert.match(read('.github/workflows/build-android.yml'),/vars\.BOOKSUP_PUBLIC_TRANSLATION_URL/);
assert.match(read('.github/workflows/build-desktop.yml'),/vars\.BOOKSUP_PUBLIC_TRANSLATION_URL/);
assert.equal(JSON.parse(read('www/booksup-translation-config.json')).endpoint,'');
console.log('BooksUp self-hosted LibreTranslate: public config validation, key-free Docker flags, HTTPS proxy, Android/Windows build wiring passed.');
