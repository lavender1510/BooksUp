'use strict';
const { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = join(__dirname, '..');
const android = join(ROOT, 'android');
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function execBin(bin, args) {
  console.log('>', bin, ...args);
  const result = spawnSync(bin, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (!existsSync(join(ROOT, 'node_modules', '@capacitor', 'cli'))) {
  console.error('Bitte zuerst "npm install" im BooksUp-Ordner ausführen.');
  process.exit(1);
}
if (!existsSync(join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'))) {
  execBin(command, ['--no-install', 'cap', 'add', 'android']);
}
// Source sprites in assets/ are exactly the shapes expected by Capacitor Assets.
execBin(command, ['--no-install', 'capacitor-assets', 'generate', '--android']);

const file = join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let xml = readFileSync(file, 'utf8');
const extra = [
  ['android.permission.CAMERA', '<uses-permission android:name="android.permission.CAMERA" />'],
  ['android.permission.POST_NOTIFICATIONS', '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />']
];
let additions = '';
for (const [name, line] of extra) if (!xml.includes('android:name="' + name + '"')) additions += `    ${line}\n`;
if (!xml.includes('android.hardware.camera')) additions += '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n';
if (additions) {
  if (!xml.includes('<application')) throw new Error('AndroidManifest.xml hat kein <application>.');
  xml = xml.replace(/(\s*<application\b)/, '\n' + additions + '$1');
  writeFileSync(file, xml);
}
// Stable monotonically increasing Android versionCode is required for in-place upgrades.
// Matching signatures are ALSO required; a version code cannot repair missing keys.
const v=require(join(ROOT,'package.json')).version;
const parts=v.split('.').map(Number);
if(!parts.every(Number.isInteger))throw new Error('Invalid package version');
const versionCode=parts[0]*10000+parts[1]*100+parts[2];
const gradleFile=join(ROOT,'android','app','build.gradle');
if(existsSync(gradleFile)){
 let gradle=readFileSync(gradleFile,'utf8');
 if(!/versionCode\s+\d+/.test(gradle))throw new Error('Could not set Android versionCode safely');
 gradle=gradle.replace(/versionCode\s+\d+/,'versionCode '+versionCode).replace(/versionName\s+"[^"]*"/,'versionName "'+v+'"');
 writeFileSync(gradleFile,gradle);
}

// A production release requires a long-lived signing certificate held by the
// publisher in GitHub Actions Secrets (never committed or logged).
if(process.env.BOOKSUP_RELEASE_KEYSTORE){
 const keystore=process.env.BOOKSUP_RELEASE_KEYSTORE;
 if(!existsSync(keystore))throw Error('Production signing key file missing');
 const required=['BOOKSUP_RELEASE_STORE_PASSWORD','BOOKSUP_RELEASE_KEY_ALIAS','BOOKSUP_RELEASE_KEY_PASSWORD'];
 for(const name of required)if(!process.env[name])throw Error('Missing production signing environment: '+name);
 const signingFile=join(ROOT,'android','app','build.gradle');
 let build=readFileSync(signingFile,'utf8');
 if(!/android\s*\{/.test(build)||!/buildTypes\s*\{/.test(build)||!/release\s*\{/.test(build))throw Error('Unsupported Android Gradle template for production signing');
 if(!build.includes('booksupProduction'))build=build.replace(/android\s*\{/,
   'android {\n    signingConfigs {\n        booksupProduction {\n            storeFile file(System.getenv("BOOKSUP_RELEASE_KEYSTORE"))\n            storePassword System.getenv("BOOKSUP_RELEASE_STORE_PASSWORD")\n            keyAlias System.getenv("BOOKSUP_RELEASE_KEY_ALIAS")\n            keyPassword System.getenv("BOOKSUP_RELEASE_KEY_PASSWORD")\n        }\n    }');
 build=build.replace(/(\brelease\s*\{)/,'$1\n            signingConfig signingConfigs.booksupProduction');
 writeFileSync(signingFile,build);
}

const vectorDir=join(ROOT,'android','app','src','main','res','drawable');
mkdirSync(vectorDir,{recursive:true});
// Monochrome book/logomark optimized for Android's notification status bar.
const smallIcon='<?xml version="1.0" encoding="utf-8"?>\n'+
 '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">'+
 '<path android:fillColor="#FFFFFFFF" android:pathData="M3,4 L10.5,4 C12,4 12,5 12,5 L12,21 C12,21 11,20 9.5,20 L3,20 Z M21,4 L13.5,4 C12.5,4 12,5 12,5 L12,21 C12,21 13,20 14.5,20 L21,20 Z"/>'+
 '<path android:fillColor="#FF000000" android:pathData="M11.2,6 L12.8,6 L12.8,20 L11.2,20 Z"/></vector>\n';
writeFileSync(join(vectorDir,'ic_stat_booksup.xml'),smallIcon);
execBin(command, ['--no-install', 'cap', 'sync', 'android']);

// Register the native LAN plugin. Cloud and remote-APK services are not bundled.
const native=join(ROOT,'mobile','android-native');
const javaDir=join(android,'app','src','main','java','dev','lyvt','booksup');

mkdirSync(javaDir,{recursive:true});
for(const name of ['MainActivity.java','BooksUpNetworkPlugin.java'])
 copyFileSync(join(native,name),join(javaDir,name));
const manifestPath=join(android,'app','src','main','AndroidManifest.xml');
let manifest=readFileSync(manifestPath,'utf8');
// Local HTTP is used only for PIN-protected LAN WebRTC signaling (RFC1918 IPs).
// Digital book files themselves are transferred over encrypted WebRTC/DTLS.
// Android 9+ blocks HTTP LAN by default. The native BooksUpNetwork plugin only
// accepts validated private RFC1918 addresses; the manifest must explicitly
// allow cleartext for the local PIN handshake. Never silently skip this setting.
const appTag=/<application\b[^>]*>/;
if(!appTag.test(manifest))throw Error('Android manifest <application> element missing');
manifest=manifest.replace(appTag,tag=>{
 if(/android:usesCleartextTraffic\s*=/.test(tag))return tag.replace(/android:usesCleartextTraffic\s*=\s*"[^"]*"/,'android:usesCleartextTraffic="true"');
 return tag.replace('<application','<application android:usesCleartextTraffic="true"');
});
if(!/<application\b[^>]*android:usesCleartextTraffic="true"/.test(manifest))throw Error('Android LAN HTTP permission not configured');
writeFileSync(manifestPath,manifest);

// Inject mobile-only BooksUp 4.8 assets AFTER Capacitor sync. Do not alter www/
// or the Electron browser version. This keeps the same Capacitor app origin and
// its existing IndexedDB / localStorage data when the signing key is stable.
const publicDir=join(ROOT,'android','app','src','main','assets','public');
const mobileDir=join(ROOT,'mobile');
const indexPath=join(publicDir,'index.html');
if(!existsSync(indexPath))throw Error('Android web assets missing after Capacitor sync');
for(const name of ['booksup-android-48.js','booksup-android-48.css']){
 const source=join(mobileDir,name);
 if(!existsSync(source))throw Error('Mobile source not found: '+source);
 copyFileSync(source,join(publicDir,name));
}
let androidHtml=readFileSync(indexPath,'utf8');
const versionPattern=/const APP_VERSION='[^']+';/g;
if((androidHtml.match(versionPattern)||[]).length!==1)throw Error('Android version marker missing or ambiguous');
androidHtml=androidHtml.replace(versionPattern,'const APP_VERSION='+JSON.stringify(v)+';');
const cssTag='<link rel="stylesheet" href="booksup-android-48.css">';
const jsTag='<script src="booksup-android-48.js"></script>';
if(!androidHtml.includes('</head>')||!androidHtml.includes('</body>'))throw Error('Android HTML structure missing');
// 4.8 stylesheet replaced the 4.6 typography, list cards and profile layout.
 // Keep the runtime functionality, but do not apply these newer presentation rules.
 // The original 4.6 baseline CSS is already in www/index.html.
 // Feature-only UI styling is supplied by booksup-54-features.css instead.
 // Skip the mobile 4.8 presentation stylesheet; retain its JS functionality.
if(!androidHtml.includes(jsTag))androidHtml=androidHtml.replace('</body>',jsTag+'</body>');
// Shared 5.0 scripts are loaded after the Android 4.8 overrides, keeping both platforms aligned.
for(const name of ['booksup-50.css','booksup-50.js','booksup-50-pair.js','booksup-50-services.js','booksup-51.js','booksup-52.js','booksup-53.js','booksup-55.js','booksup-54-features.css']){
 const src=join(ROOT,'www',name);if(!existsSync(src))throw Error('Missing 5.0 source: '+name);
 copyFileSync(src,join(publicDir,name));
 if(name.endsWith('.css')){
  const tag='<link rel="stylesheet" href="'+name+'">';
  androidHtml=androidHtml.replace('</head>',tag+'</head>');
 }else{
  const tag='<script src="'+name+'"></script>';
  androidHtml=androidHtml.replace('</body>',tag+'</body>');
 }
}
writeFileSync(indexPath,androidHtml);
console.log('Android-only BooksUp '+v+' features added to generated APK assets.');

console.log('\nBooksUp Android eingerichtet – App-Name und Icons sind gesetzt.');
