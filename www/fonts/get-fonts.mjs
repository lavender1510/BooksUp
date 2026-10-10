// Lädt Newsreader und Inter von Google Fonts und legt sie lokal ab, damit die App offline gleich aussieht.
// Einmal ausführen (Node 18 oder neuer, mit Internet):  node fonts/get-fonts.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const CSS = 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Inter:wght@400;500;600&display=swap';
const css = await (await fetch(CSS, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' } })).text();
let out = css, i = 0;
for (const u of new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))) {
  const name = 'f' + (++i) + '.woff2';
  await writeFile(dir + name, Buffer.from(await (await fetch(u)).arrayBuffer()));
  out = out.split(u).join(name);
}
await writeFile(dir + 'fonts.css', out);
console.log(i + ' Schriftdateien gespeichert.');
