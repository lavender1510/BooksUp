# BooksUp 4.3.0 — Reading & Cover Reliability

## Changes
- Automatic online cover lookup: verified Open Library Covers (ISBN/cover IDs) then Google Books metadata images, lazy-loaded when visible. Existing manual covers keep priority. Offline and no-result states are labeled.
- Cleaner, quieter PDF full-screen reader. Fit mobile PDF pages to the available viewport instead of rendering oversized pages with white space.
- PDF vertical/horizontal continuous scrolling is configurable; chapter, focus, colors, typography and text-mode preferences are available under Reading Settings.
- Appearance has consistent previews for templates, accent, paper, brightness and font size; changes are staged until Save, and leaving prompts to save, discard or stay.
- Recommendations show sources and genres directly; large lists scroll independently.
- Currency preferences include additional display currencies, locale formatting, visibility of purchase/list prices and a book-budget field (amounts are not automatically converted).
- Goodreads compatibility has its own Settings category.
- Profile reading lists support owned and wishlist items, optional rules based on finished/reading/unread/owned status, update timing, and optional synchronized library folders for all-owned lists.
- Book news feed extractor uses publisher OpenGraph and Twitter preview images when RSS feeds do not provide media. The original articles are linked.

## Limitations and safety
- Remote cover and article imagery depends on upstream providers and internet access; no image is fabricated where no matching original source exists.
- Five-language localization covers new settings and many older controls, but complete translation of every legacy screen has not yet been verified.
- Windows and Android automated builds and full-scale device reader/backup restoration tests must pass before considering this production-ready.
- Never uninstall an Android build until you have successfully tested restoring a local backup. In-place APK upgrades require identical signing certificates across releases.
- Google Drive Cloud sync still requires publisher OAuth configuration and device testing.

# BooksUp 4.2 – Stability and News

Updates:
- Faster UI navigation and an additional News tab using public RSS-aggregated articles from a scheduled GitHub workflow.
- News sources are credited, links point to the original publisher. A feed may be empty until `Refresh BooksUp Book News` runs successfully.
- Backup ZIP uses larger Android write chunks and includes a progress dialog with smoothed percentage display; duration depends on the number and size of files.
- Stronger top-positioned status messages, responsive settings typography, and scrolling improvements.
- Automatic metadata enrichment from book APIs, without overriding manually entered fields. Internet access and provider coverage required.
- Extended German, English, French, Spanish, and Italian UI localization dictionary for common elements. Legacy copy not in the dictionary is still untranslated.

CAUTION: **Do not uninstall the previous APK without a validated backup.** Android updates require matching signing certificates; existing debug signing may differ across builds. Cloud Drive OAuth remains beta. Test on a spare library before using on important data.

# BooksUp 4.1 – Bibliothek & Goodreads

### Neu und verbessert
- Größere Scrollbereiche, scrollbare Dialoge und abgeschnittene lange Regaltitel.
- UVP und tatsächlicher Kaufpreis getrennt; gebraucht/neu als Zustand; kaufbezogene Felder bearbeitbar.
- Bücherregal-Suche, Mehrfachauswahl zum Löschen und zur Ordnerzuordnung.
- Goodreads-Import mit Shelf-Auswahl, Shelf→Ordner und Leseliste, einstellbarer Bewertungsskala und fünf frei anpassbaren Importwerten.
- Individuelle Leselisten mit Wunschbüchern, die man noch nicht besitzt.
- Discover-Vorschläge zu ungelesenen eigenen Büchern, Reihenfolge-Berücksichtigung; Empfehlungen zeigen Buchdetails statt Add-Formular.
- Online-Cover-Auswahl und erste Informationen aus Google Books und Open Library, soweit verfügbar.
- Notizen in den Buchdetails und größeres ISBN-Kamerafenster.

### Datensicherheit
Backups vor jeder Installation prüfen. Android-Debug-APKs aus GitHub Actions sind nur bei identischem Signaturzertifikat als Update installierbar. Die Cloud-Synchronisation braucht weiterhin OAuth-Konfiguration.

# BooksUp 4.0 – Library & Reader Edition

**New test release for Android and Windows.** Screens inspired by the user-provided Wattpad screenshots, palettes inspired by the user-provided FanFiktion.de theme templates. No branding or artwork is copied from those screenshots.

## Changes

- Discover homepage replaces the dashboard's old profile-like home. Original profile remains available via Profile.
- 22 themes, including pastel, nature, warm and dark palettes with previews.
- Responsive Windows sidebar, wider cover rails and separate detail/reader settings pages.
- Book detail view with full metadata, editions, read button, edit button, ratings, progress and page-linked notes.
- Reader adds current book/chapter heading, expandable chapter navigation and notes from selected text. Highlights inside the current reader DOM are temporary; notes and passages are stored with the book.
- Manga view is titled Manga, Comics & Graphic Novels. Imported books of these formats share this collection.
- Profile GIF banners preserve source GIF bytes in IndexedDB instead of flattening animations in canvas. ZIP backups include saved GIFs.
- Backup restore now requires explicit confirmation and can include GIF binaries. Existing backups are read in the legacy ZIP format.
- Preferences organized into ten categories. A basic localization covers redesigned UI in German, English, French, Spanish and Italian; some legacy dialogs remain German.
- Windows has a desktop-specific workspace layout, keyboard search (Ctrl+K) and a full detail sidebar.

## Critical update and data safety

**Do not uninstall your current Android app unless you have a successfully verified backup.** GitHub-hosted test APKs were previously assembled with ephemeral debug certificates. Android cannot update an installed app signed with a different certificate. To permit future in-place upgrades, configure GitHub secret `BOOKSUP_ANDROID_DEBUG_KEYSTORE_BASE64` with the base64 representation of a persistently saved Android debug.keystore that matches the certificate used by the installed app. This secret is never printed in logs. If the old signing key was lost, an in-place upgrade cannot be guaranteed, regardless of the new code.

This test release does not bypass Android's platform installation confirmation. In-app APK silent installation is not supported on standard Android. Windows installed builds use Electron updater metadata from the GitHub release; portable EXEs require manual replacement.

Google Drive synchronization still requires the Google OAuth client ID and Android OAuth registration. Cloud synchronization remains beta and requires device testing.

## Testing

- JavaScript static checks for app and add-on scripts.
- Windows and Android GitHub Actions must finish before downloads are considered available.
- Actual device backup restoration, large libraries and in-place signing updates still require manual end-to-end verification.


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