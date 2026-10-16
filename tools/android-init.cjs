'use strict';
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = join(__dirname, '..');
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
const vectorDir=join(ROOT,'android','app','src','main','res','drawable');
mkdirSync(vectorDir,{recursive:true});
// Monochrome book/logomark optimized for Android's notification status bar.
const smallIcon='<?xml version="1.0" encoding="utf-8"?>\n'+
 '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">'+
 '<path android:fillColor="#FFFFFFFF" android:pathData="M3,4 L10.5,4 C12,4 12,5 12,5 L12,21 C12,21 11,20 9.5,20 L3,20 Z M21,4 L13.5,4 C12.5,4 12,5 12,5 L12,21 C12,21 13,20 14.5,20 L21,20 Z"/>'+
 '<path android:fillColor="#FF000000" android:pathData="M11.2,6 L12.8,6 L12.8,20 L11.2,20 Z"/></vector>\n';
writeFileSync(join(vectorDir,'ic_stat_booksup.xml'),smallIcon);
execBin(command, ['--no-install', 'cap', 'sync', 'android']);
console.log('\nBooksUp Android eingerichtet – App-Name und Icons sind gesetzt.');
