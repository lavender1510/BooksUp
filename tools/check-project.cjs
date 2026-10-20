'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = p => fs.readFileSync(path.join(root, p), 'utf8');
const config = JSON.parse(file('capacitor.config.json'));
const pkg = JSON.parse(file('package.json'));
const html = file('www/index.html');
const manifest = JSON.parse(file('www/manifest.webmanifest'));
assert.equal(config.appName, 'BooksUp');
assert.equal(pkg.productName, 'BooksUp');
assert.equal(manifest.name, 'BooksUp');
assert.equal(config.webDir, 'www');
assert.equal(pkg.main, 'electron/main.cjs');
assert.match(html, /<title>BooksUp<\/title>/);
for (const asset of ['www/lib/pdf.min.mjs','www/lib/pdf.worker.min.mjs',
  'www/lib/jszip.min.js','www/icons/icon-192.png','assets/icon-only.png',
  'assets/icon-background.png','assets/icon-foreground.png',
  'assets/splash.png','assets/splash-dark.png','build/icon.ico']) {
  assert.ok(fs.existsSync(path.join(root, asset)), 'missing: ' + asset);
}
assert.match(file('electron/main.cjs'), /nodeIntegration: false/);
assert.match(file('tools/android-init.cjs'), /POST_NOTIFICATIONS/);
for(const name of ['booksup-44.js','booksup-43.js','booksup-library.js','booksup-polish.js','booksup-next.js']){const src=file('www/'+name);assert.ok(src.length>200,'missing script: '+name);new Function(src)}
for(const name of ['booksup-46.js','booksup-46-extra.js','booksup-46-i18n.js','booksup-45.js','booksup-desktop.js','booksup-45-i18n.js']){const src=file('www/'+name);assert.ok(src.length>100,'missing script: '+name);new Function(src)}
assert.equal(pkg.version,'5.3.1');
for(const name of ['booksup-50.js','booksup-50-pair.js','booksup-50-services.js','booksup-51.js','booksup-52.js','booksup-53.js'])new Function(file('www/'+name));
assert.match(file('www/booksup-50.css'),/bu50-font-list/);
assert.match(file('www/booksup-51.css'),/bu51-mobile/);
assert.match(file('www/booksup-52.css'),/bu52-android/);
assert.match(file('www/booksup-531-features.css'),/bu53-reader/);
assert.match(file('tools/android-init.cjs'),/booksup-53\.js/);
assert.match(file('electron/main.cjs'),/booksup-lan\.cjs/);
assert.match(file('electron/main.cjs'),/booksup-50-pair.js/);
assert.match(file('tools/android-init.cjs'),/BooksUpUpdaterPlugin/);
new Function(file('www/booksup-49.js'));
assert.match(html,/booksup-49\.js/);
assert.match(html,/booksup-49\.css/);
assert.match(file('electron/preload.cjs'),/booksupDesktopDrive/);
assert.match(file('electron/main.cjs'),/booksup-drive:login/);
new Function(file('electron/booksup-windows-48.js'));
assert.ok(file('electron/booksup-windows-48.css').includes('.bu48-list-tile'));
assert.match(file('electron/preload.cjs'),/booksup-metadata:search/);
assert.match(file('electron/main.cjs'),/booksup-windows-47\.js/);
assert.match(file('electron/preload.cjs'),/booksup-metadata:dnb/);
new Function(file('electron/booksup-windows-47.js'));
assert.ok(file('electron/booksup-windows-47.css').includes('.bu47-kpi-grid'));
assert.match(file('electron/booksup-windows-47.js'),/bu47EnrichOwnedBook/);
assert.match(html,/bu46ReadingHistory/);
assert.match(html,/bu46AfterRender/);
assert.match(file('www/booksup-library.js'),/excludedIds/);
assert.match(file('www/booksup-next.js'),/bu46MoreBooks/);
assert.match(file('electron/preload.cjs'),/booksupBackupFile/);
assert.match(file('electron/main.cjs'),/booksup-backup:start/);
console.log('OK: BooksUp 4.6 modules wired, version matched,');
console.log('OK: BooksUp Design-Quellen, Icons, Offline-Bibliotheken, Electron und Android-Konfig.');
