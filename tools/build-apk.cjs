'use strict';
const { existsSync, mkdirSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = join(__dirname, '..');
const android = join(ROOT, 'android');
let result = spawnSync(process.execPath, [join(__dirname, 'android-init.cjs')], { stdio: 'inherit', cwd: ROOT });
if (result.error) throw result.error;
if (result.status) process.exit(result.status);
const gradle = join(android, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradle)) {
  console.error('Gradle Wrapper fehlt: bitte Android Studio und SDK installieren.');
  process.exit(1);
}
console.log('> Gradle assembleDebug');
result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'sh',
  process.platform === 'win32' ? ['/d', '/s', '/c', '""' + gradle + '" assembleDebug --no-daemon"'] : [gradle, 'assembleDebug', '--no-daemon'],
  { stdio: 'inherit', cwd: android });
if (result.error) throw result.error;
if (result.status) process.exit(result.status);
const from = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!existsSync(from)) throw new Error('APK wurde nicht gefunden: ' + from);
mkdirSync(join(ROOT, 'release'), { recursive: true });
const target = join(ROOT, 'release', 'BooksUp-debug.apk');
copyFileSync(from, target);
console.log('\nFertig: ' + target);
console.log('Debug-APK für lokale Tests. Play-Store-Release muss separat signiert werden.');
