'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const mobile=read('mobile/booksup-android-48.js');
const init=read('tools/android-init.cjs');
const main=read('electron/main.cjs');
const features=read('www/booksup-54-features.css');
const v=JSON.parse(read('package.json')).version;
assert.equal(v,'5.5.0');
// Classic Android is a renderer choice, NOT a downgrade of app logic or database.
assert.match(mobile,/const booksupUseOriginalMobileLayout=true/);
assert.match(mobile,/if\(booksupUseOriginalMobileLayout\)return oldListDetails\.apply/);
assert.match(mobile,/if\(booksupUseOriginalMobileLayout\)return originalListsOverview\.apply/);
assert.match(mobile,/booksupUseOriginalMobileLayout\?previousProfileLists\.apply/);
assert.match(mobile,/booksupUseOriginalMobileLayout\?previousHistory\.apply/);
assert.match(mobile,/if\(booksupUseOriginalMobileLayout\|\|view!=='profile'\)return previousHome\.apply/);
assert.match(mobile,/window\.bu48RemoveListEntry=stableDelete/);
assert.match(mobile,/window\.bu48Lookup=async/);
// Full newer 4.8/5.1/5.2/5.3 presentation files MUST NOT be injected on Android.
assert.doesNotMatch(init,/androidHtml\.replace\('<\/head>',cssTag\+'<\/head>'\)/);
for(const name of ['booksup-51.css','booksup-52.css','booksup-53.css']){
 assert.ok(!init.includes("'"+name+"'"),'Android must not inject '+name);
}
for(const name of ['booksup-50-pair.js','booksup-50-services.js','booksup-51.js','booksup-52.js','booksup-53.js']){
 assert.ok(init.includes("'"+name+"'"),'Android functionality must remain: '+name);
}
assert.match(init,/booksup-54-features\.css/);
assert.match(init,/usesCleartextTraffic="true"/);
// Windows keeps exactly the 5.2 stylesheet chain plus a narrowly scoped
// feature-only stylesheet. 5.3 scripting is still loaded.
assert.match(main,/booksup-50\.css','booksup-51\.css','booksup-52\.css','booksup-54-features\.css/);
assert.doesNotMatch(main,/booksup-52\.css','booksup-53\.css/);
assert.match(main,/booksup-53\.js/);
assert.match(features,/\.bu53-highlight/);
assert.match(features,/bu53-zoom-toolbar/);
assert.match(features,/bu53-update-progress/);
assert.doesNotMatch(features,/\.next-hero\b|\.next-home-top\b|\.bu48-profile-order\b|\.bu48-list-tile\b/);
assert.doesNotMatch(features,/html,body\{|\.next-layout\{display/);
// Original 4.6 presentation source was already included in 5.2; do not replace it.
assert.match(read('www/index.html'),/booksup-next\.css/);
assert.match(read('www/index.html'),/const APP_VERSION='4\.6\.0'/);
console.log('OK: Windows 5.2 CSS + newest code, Android 4.6 layouts + newest code, no global 5.3 design overrides.');
