# BooksUp 3.3.0 — Cloud Backup beta (Android) & Windows

**Android APK + Windows installer/portable EXE** are published by GitHub Actions after a successful build. All release assets are **test builds**. Windows installers are unsigned and may trigger SmartScreen warnings. Existing library data is local to each device: use **Einstellungen → Backup mit Büchern** before migrating or reinstalling.

## Update 3.3.0 – Google Drive Cloud-Backup (Android beta)

- Google OAuth login with dedicated `drive.appdata` access, not full Drive access.
- Upload both profiles, bookshelf data and imported books into hidden BooksUp Drive application storage.
- Pull to a freshly installed tablet, reconcile device changes, warn rather than silently overwrite divergent libraries.
- Sync runs only when app is in the foreground and Google auth is connected; no promised background service.
- Google OAuth configuration is not included in public source. **Cloud login is inactive until publisher configures Google Cloud OAuth.**

### Required publisher setup

1. Create Google Cloud OAuth consent screen and enable Google Drive API. Request `https://www.googleapis.com/auth/drive.appdata`; configure scopes/testing or verification as applicable.
2. Create an OAuth **Web client ID** and an **Android client** for package `dev.lyvt.booksup` and the signing certificate SHA-1. Android client matches the certificate of the APK actually shipped.
3. Set GitHub Actions secret `BOOKSUP_GOOGLE_WEB_CLIENT_ID` to the Web OAuth client ID (ends with `.apps.googleusercontent.com`). This ID is a non-secret identifier; the workflow injects it into `www/cloud-drive-config.js` at build time.
4. Release stable APK signing is required before reliable in-place Android upgrades: GitHub Actions ephemeral debug signing keys may differ per build.
5. Run Android sign-in, large-file cloud restore, offline and conflict tests on two devices before declaring the cloud feature production-ready.

### Limitations

- Windows Google Drive sync is not yet implemented; Windows remains a local app.
- Google login/Drive upload requires an OAuth client ID configured by the publisher; no Google account can connect until that happens.
- Tokens are session-only and the user may need to reconnect after reopening the app. Automatic cloud sync only works while the app is in the foreground and the account is connected.
- Stored books and reader data in Google Drive's application folder count against the user's Google storage quota.
- Before enabling cloud sync, export a local ZIP backup.

## Update 3.2.2

- Android backup export writes ZIP content in 128 KiB blocks to avoid memory spikes; backup file layout remains compatible.
- Android checks for APK updates on GitHub and opens the download (installation requires Android confirmation and compatible APK signature).
- The installed Windows app checks for updates and can download/install after confirmation (portable EXEs require manual replacement).
- Windows release publishes latest.yml metadata for electron-updater; existing local database stays intact.

## Neu in 3.2

- Fixed profile editing, live avatar crop and zoom, explicit one-time profile copying (optional continuous sync)
- Scrolling book dialogs; ISBN multi-entry and scanning queue; editable genre, tags, series/band, publisher, year, language and price
- Separate physical editions with ISBN, language, bindings, individual price and cover; works with existing physical book data
- Google Books/Open Library metadata and alternative covers, with manual overrides. **Not every ISBN has complete edition metadata or a verified UVP**, so unknown details remain editable.
- Shelf filters **Alle / Digital / Physisch**, long-title wrapping, completion date and better discovery filters
- IndexedDB-first persistent storage prevents localStorage image quota errors; backups recommended

## Download

The Actions **BooksUp Android APK + GitHub Release** and **BooksUp Windows EXE + Release** upload builds to [Releases](https://github.com/lavender1510/BooksUp/releases) under `v3.2.0-test.1` once successful. Windows binaries are built on GitHub `windows-latest` rather than on Linux.

# BooksUp 3.1 – Desktop (Electron) & Android

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


## Neu in BooksUp 3.1

- Profil live bearbeiten, Avatar-/Bannerbilder zuschneiden, positionieren und zoomen.
- Profile aus Bücher- und Manga-Bereich auf Knopfdruck synchronisieren (optional auch künftige Änderungen). Bücher und Fortschritt bleiben getrennt.
- Mehrfachimport von PDF/EPUB/CBZ/ZIP-Dateien sowie mehreren physischen Buchtiteln.
- Bücher direkt aus dem Regal lesen; Langdruck oder „Details / Bearbeiten“ öffnet das Menü.
- Titel, Autor, Genre, Jahr, Seitenzahl, Reihe, Tags und Cover nachträglich bearbeiten.
- PDF-Vorschaubild aus der ersten Seite erzeugen; eigenes Cover weiterhin möglich.
- Automatisches Starten/Beenden einer Lesesitzung beim Ein-/Ausschalten des Vollbildmodus.
- Online-Buchsuche mit Google Books und Open Library einschließlich deutscher/englischer Ausgaben (Internet erforderlich).
- Empfehlungsliste nach Lieblingsbüchern, ähnlichen Genres und ausgeschlossenen Genres steuern.

**Hinweise:** Die Android-Version muss durch GitHub Actions neu gebaut werden. Bereits lokal gespeicherte Bücher bleiben in der App erhalten, sofern die App mit derselben Android-Paketkennung aktualisiert wird. Mach vor größeren Updates sicherheitshalber ein ZIP-Backup unter Einstellungen.