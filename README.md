# BooksUp 3.0 – Desktop (Electron) & Android

**Originales BooksUp-Design und derselbe Web-App-Code auf allen Plattformen.**
Keine neue Oberfläche: `www/index.html` ist die HTML-Datei aus dem angelieferten Archiv. Der Reader samt `pdf.js` und `JSZip` liegt lokal in `www/lib`.

| Plattform | Technologie | Name | Ausgabe |
|---|---|---|---|
| Windows, macOS, Linux | Electron | BooksUp | `.exe`, `.dmg`, `.AppImage` |
| Android | Capacitor (Android WebView) | BooksUp | `BooksUp-debug.apk` |

**Wichtig:** Electron kann keine APK erzeugen. Die APK benutzt dieselbe Oberfläche mit **Capacitor**, während die Desktop-App mit **Electron** läuft.

## Starten als Desktop-App

Voraussetzung: Node.js **22 oder neuer** und Internet für die erste Installation.

```bash
npm install
npm start
```

Unter Windows kannst du alternativ **`BOOKSUP-DESKTOP-STARTEN.bat`** doppelklicken.

Um eine Windows-Installer-EXE und eine portable EXE zu erstellen (auf Windows):

```powershell
npm run desktop:windows
```

Die Desktop-Dateien liegen anschließend in `release/`. Für macOS/Linux gibt es `npm run desktop:mac` und `npm run desktop:linux` (jeweils am besten auf dem Zielbetriebssystem ausführen).

## Android-APK lokal erstellen

Installiere Node.js **22+**, **Android Studio** mit Android SDK und ein passendes JDK (Android Studio bringt eines mit). Dann:

```bash
npm install
npm run android:apk
```

Unter Windows gibt es dafür außerdem **`BOOKSUP-APK-BAUEN.bat`** (Doppelklick).

`npm run android:apk` erledigt Folgendes automatisch:
1. Erzeugt bei Bedarf das native Android-Projekt (`npx cap add android`).
2. Übernimmt die **BooksUp-Icons** und Startgrafiken aus `assets/`.
3. Ergänzt Kamera- und Benachrichtigungsrechte.
4. Synchronisiert die Web-App und alle Capacitor-Plugins.
5. Baut eine Android-Debug-APK und kopiert sie nach **`release/BooksUp-debug.apk`**.

Alternative: `npm run android:init` und `npm run android:open`, dann in Android Studio **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### APK einfach mit GitHub Actions bauen (ohne Android Studio auf deinem PC)

1. Lade den **Inhalt dieses Projektordners** in ein **eigenes privates GitHub-Repository** hoch (nicht nur die ZIP-Datei).
2. Öffne im Repo **Actions → BooksUp Android APK → Run workflow**. Alternativ startet der Build beim Push auf `main`.
3. Nach einem erfolgreichen Build: den Workflow-Lauf öffnen, unter **Artifacts** `BooksUp-debug-apk` laden und entpacken.
4. Auf dem Android-Gerät `BooksUp-debug.apk` installieren. Installation aus dieser Quelle kann beim ersten Mal bestätigt werden müssen.

Die GitHub-Actions-Datei liegt unter `.github/workflows/build-android.yml`. Bei erfolgreichem Build auf `main` wird automatisch ein **GitHub-Prerelease mit `BooksUp-debug.apk`** erstellt bzw. aktualisiert. Es wird **nur eine Test-APK** gebaut, nicht eine Play-Store-Veröffentlichung. Das ursprüngliche Projekt wird nicht automatisch auf GitHub hochgeladen.

## Daten und Offline-Verhalten

- Bücher, Lesestand und Bibliothek werden wie in der Vorlage lokal über **localStorage und IndexedDB** gespeichert.
- Die Electron-App verwendet absichtlich `booksup://booksup` statt `file://`, damit das Speicher-Origin stabil bleibt.
- PDF, EPUB und CBZ funktionieren offline, da `lib/` lokal mitgeliefert wird.
- Die Schrift Inter liegt als lizenzierte lokale Datei bei; Newsreader kann bei verfügbarer Internetverbindung über Google Fonts geladen werden, offline greift die ursprüngliche Serifenschrift-Fallback-Reihenfolge.
- Kamera, Erinnerungen, Freigabe und Firebase können je nach Plattform Berechtigungen oder Internet benötigen. Firebase ist optional und ohne Konfiguration nicht aktiv.
- Die App installiert **keinen gemeinsamen Sync** zwischen Android und Electron. Um Daten zu übertragen: **Einstellungen → Backup mit Büchern** erstellen und auf dem anderen Gerät wiederherstellen.
- Android- und Electron-Speicher sind getrennt. Eine Neuinstallation unter einer anderen App-ID übernimmt keine Daten automatisch.

## Struktur

```text
BooksUp-Electron-Android/
├── www/                   Originale BooksUp-Oberfläche und lokale Lesebibliotheken
├── electron/main.cjs      Sichere Electron-Desktop-Hülle
├── assets/                Originale Icon- und Splash-Quellen
├── build/                 Desktop-Icons (PNG, ICO, ICNS)
├── tools/                 Android-Initialisierung, APK-Build, statischer Test
├── .github/workflows/     Cloud-Build für APK und Windows-EXE
├── capacitor.config.json  App-Name BooksUp / Paket-ID dev.lyvt.booksup
├── package.json           Node-/Electron-/Capacitor-Abhängigkeiten
└── docs/                  Datenschutzerklärung, Testliste, Firebase-Infos
```

## Vor einem öffentlichen Release

- Eigene Paket-ID in `capacitor.config.json` festlegen und beibehalten.
- APK/AAB mit deinem **eigenen Release-Keystore** signieren. Den Keystore nie in Git einchecken.
- Datenschutz, Kamera, Benachrichtigungen und Firebase-Funktionen auf echten Geräten prüfen.
- Google-Play-spezifische Anforderungen (target API, Data Safety, Datenschutz-URL, Testphase) beachten.

## Teststatus

`npm run test:static` überprüft die statischen Bestandteile. Ein echtes Android-Build und ein Electron-Lauf benötigen die Plattform-Abhängigkeiten. Die Build-Workflows sind im Projekt eingerichtet; ein erfolgreicher Compilerlauf auf einem realen Gerät ist damit **nicht** behauptet.
