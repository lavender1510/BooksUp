'use strict';
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
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
execBin(command, ['--no-install', 'cap', 'sync', 'android']);
console.log('\nBooksUp Android eingerichtet – App-Name und Icons sind gesetzt.');
