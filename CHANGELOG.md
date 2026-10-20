## 5.6.0 (Entwicklungsstand – noch nicht vollständig abgenommen)
- Direkter Gerätetransfer: verbundene Gerätekennung, Status, Sende-Button nur bei aktiver Verbindung, Fortschrittsanzeige mit ETA, Zielbestätigung und Fehlermeldungen.
- Metadaten: mehrere Suchwege nach ISBN/Titel/Autor und abweichenden Titeln, zusammengeführte verifizierte Treffer mit sicheren Fallbacks.
- Empfehlungen: buchabhängige Themen-/Genre-Suche und Relevanzfilter statt beliebiger Treffer.
- MediMops: verständliche ISBN-Auswahl und manueller Eintrag, transparenter Umgang mit nicht erreichbarer Preisquelle.
- Hell/Dunkel/System: Vorrang der Helligkeit vor unpassenden statischen Farbpaletten; bestehende Designs bleiben erhalten.
- Einstellungen: geordnete bestehende Bereiche und staged Speichern/Verwerfen, ohne neue visuelle Komponenten.
- Reader: Sitzungsdauer und Seite/Gesamtzahl in Vollbild, Auto-Speichern und Wiederherstellung unterbrochener Sessions; robustere Markierungswiederherstellung.
- Übersetzungen: weitere UI-Begriffe; eine vollständige 5-Sprachen-Prüfung steht noch aus.
- Offen: produktiver MediMops-Preisfeed und Benachrichtigungen bei vollständig beendeter App benötigen externe Infrastruktur. Android-/Windows-Endtests am Gerät noch ausstehend.

## 5.5.1 – Android Settings/News Regression Fix (20.10.2026)
- Restored News and Settings to the default bottom navigation; individual choices remain supported.
- News loading now handles offline/API failures with visible retry status and keeps existing cached articles.
- Disabled repeated failed News requests after each render without breaking manual refresh.
- Retains the Android 4.6 layout, book data, and all previously implemented features.

## [5.5.0] – 2026-10-20 (Reading, Collections and Edition Fixes)

**Design preserved:** Windows retains its 5.2.0 layout; Android retains its original 4.6.0 layout. No replacement shell or navigation architecture.

- ISBN-10/13 edition lookup in the owned-book editor and directly for Goodreads-imported library books, with barcode camera where supported and user confirmation before changes.
- Discover navigation and similar-book recommendations corrected, including network timeouts, retry buttons and empty/error states.
- New "Abgebrochen" reading status, automatic abandoned-books rule and status cards.
- Persisted list placement (library, shelf or both), media format on lists and individual entries, and per-record bulk-editable Goodreads import formats.
- Configurable bottom navigation; profile ordering restored without replacing original components.
- Reader highlight colors, persistent page-anchored PDF areas, text-mode restoration and pressure-aware S-Pen stroke notes.
- Signed Android installer download checks APK hash, package name, certificate and version; update is considered installed only after reopening the requested version.
- Windows installer/restart update status improved. Portable installations still require manual replacement.

**Known constraints:** Android requires permission to install unknown-source APKs and matching production signatures. Camera barcode recognition depends on the device's BarcodeDetector support; manual ISBN input remains available. Text range relocation is best-effort after reflow, and physical-device S-Pen and installer interaction require real-device verification.

## [5.4.0] – 2026-10-20 (Layout Restoration + New Features)

**Design baseline:** Windows visually retains BooksUp 5.2.0. Android returns to the original BooksUp 4.6.0 profile, reading-list screens, typography and layout. The application version and feature set remain current.

- Removed the broad global 5.3 layout stylesheet from Windows loading. Feature-specific controls still receive minimal styling; current 5.3 JavaScript functions remain active.
- Android renders the original 4.6 profile, reading history and list views again instead of the restructured 4.8 screens. New list deletion safety and online metadata behavior remain.
- On Android, stopped injecting the oversized 4.8 mobile stylesheet and later 5.1–5.3 design overrides; added a narrowly scoped stylesheet for new-only features (LAN pairing, update progress, reader zoom and PDF marks).
- Retained current 5.3 reader zoom persistence, PDF highlights, online lookup, device pairing and production-signed APK updates on both platforms.
- Guardrail tests prevent accidental future loading of unwanted global design overrides.

**Compatibility:** Same data storage, Android package ID and signing key as 5.3.0. No data downgrade, uninstall or reset needed for users of the signed 5.3 release. Earlier temporary debug-signed installs still cannot be updated across Android signing certificates. The Windows executable remains Authenticode unsigned until a publisher certificate is configured.

## [5.3.0] – 2026-10-20 (Android & Windows)

### Stability and release engineering
- Android production: replace auto-published debug APKs with **assembleRelease** and a mandatory permanent publisher signing key. The Android release job refuses to publish when GitHub Actions Secrets are missing. See docs/PRODUCTION_RELEASE.md.
- Windows: stable GitHub Releases and stable automatic-update channel. EXEs are not yet Authenticode-signed.
- APK update flow: existing signature checks remain, now with genuine byte-based progress, speed and ETA whenever the backend exposes byte counts.

### Reader and highlights
- PDF reader: pinch and touchpad zoom commit the chosen zoom level to the saved reading settings and redraw at that actual scale, rather than showing only a transient preview.
- Reader toolbars are horizontally scrollable without shrinking buttons into vertical letter columns. Fullscreen scrolling, zoomed canvas pan and reading settings are contained.
- Page-area highlighting is exposed for Android and Windows and stored with a book as normalized PDF coordinates; highlights redraw after new page renders or zoom. Text selections also create persistent annotation records.

### Mobile and localization
- Address Android 9+ error 'Cleartext HTTP traffic to private IP not permitted': generate the correct Manifest usesCleartextTraffic flag, with the native LAN plugin still restricting network targets to RFC1918 IP addresses.
- Adaptive mobile card/grid widths and reader controls; preserve vertical scrolling while containing horizontal overflow.
- Selected UI language is re-applied using the combined shipped dictionaries in either direction; reader contents and user-authored titles/notes excluded. Gaps in legacy strings may remain.

### Important migration note
- Prior debug APKs cannot be updated in-place by a new production certificate. Preserve and verify a full backup of all books and local file content **before uninstalling any older build**.
- Windows release builds are not a Microsoft Authenticode-signed publisher installer until a separate code-signing certificate is available.

## [5.2.0] – 2026-10-20 (Android & Windows)

- Reader: Two-finger touch pinch and Ctrl/Meta+wheel trackpad gesture; delayed PDF rendering avoids work on every movement.
- Updates: In-app Windows download progress, Android download progress and native package/version/signature checks before invoking Android's installer.
- Native Android HTTPS catalog bridge searches Google Books and Open Library without WebView restrictions, with extra confidence-based metadata enrichment. Windows catalog uses broader Open Library queries.
- More varied recommendations using actual online subject searches and filtering of owned, duplicate and recently seen titles. Provider outages remain possible.
- Device connection: Native Android HTTP LAN signaling joins the Windows-hosted PIN exchange. Both devices still need the same reachable local Wi-Fi/Hotspot, matching security code, and firewall access.
- Android responsive layout: fluid profile cards, statistics, display areas, controls and safe-area spacing.
- UI language choice reapplied after renders and async updates, excluding book reader content; remaining legacy strings can still require translations.
- Image wallpapers: brightness sampling with stronger translucent card and theme color overlays for readability.
- New automated regressions and platform build checks.

IMPORTANT: Existing Android builds were signed with transient debug keys. Android will refuse updating an installation signed by a different key; verify a full library-and-book-files backup before migration. The updater deliberately refuses unsafe signature mismatches.

## [5.1.0] – 2026-10-19 (Android & Windows)

- Corrected mobile profile and settings layout on narrow Android screens, including grid cards, cover previews, modal widths and inputs.
- Fixed font filter visibility: nonmatching fonts are actually hidden instead of forced visible by the button display rule.
- Reworked appearance preset save/apply to persist all selected theme/accent/paper/font/scale/tint fields and reliably restore them.
- Added animated GIF wallpaper selection as an original local image file (not exported or synchronized); the reader remains wallpaper-free.
- Rebuilt Discover search to handle the native catalog gateway and Google Books/Open Library fallback requests, with user-visible error messages.
- Additional metadata fallback for editions, covers and descriptions; only confidently matching fields are filled automatically.
- Fixed the broken “Mehr Bücher entdecken” action; recommendations rotate on every request and can expand through online catalog data when providers answer.
- Expanded translations for common settings and controls; other legacy strings may still require additional localization.
- Windows-hosted private LAN pairing using a six-digit PIN and host IP:port, with Android or Windows joining and direct encrypted WebRTC transfer. Manual SDP exchange remains under advanced options. Android-to-Android hosting is not included.
- Adds targeted regression tests for font filtering, saved presets, search results, metadata, recommendations and LAN signaling.

**Signing and service limitations:** Existing Android debug APKs were signed with ephemeral certificates. Users must create and verify a complete backup before changing installations; in-app updating cannot bypass Android signature checks. Online book coverage and font availability depend on external providers. The LAN pairing needs two devices on a reachable local network and allows Windows hosting only at this stage.

## [5.0.0] – 2026-10-19 (Android & Windows)

- Save and apply appearance combinations with theme, accent, font and wallpaper tint; 100 optional online fonts with offline system fallback.
- Device-specific background pictures stored in IndexedDB (not included in sync or exported backups); hide background in reader.
- Reading-list administration, opt-in list preview for shelf, profile quick tiles cleaned up; unfinished Friends features hidden.
- Cross-platform notes panel and area annotations retained in local book data.
- More resilient Google Books/Open Library lookup, online book blurbs and manual description editing; show ISBN choices when editions are ambiguous.
- Native Android APK download and Android system installer handoff; Electron installer uses app updater. Neither can override OS signature checks.
- Peer-to-peer direct WebRTC data exchange with manual offer/answer, six-digit verification and receiver confirmation. Works only when local networking permits direct connectivity. No cloud/server is used; existing books are never automatically replaced, and large files may be skipped.
- Dedicated reading-list controls in Settings and extended translation dictionaries.

**Distribution:** Separate Windows v5.0.0 and Android v5.0.0-android.1 test releases.
**Signing limitation:** The existing Android releases use ephemeral debug signing keys. The new APK cannot be installed over differently signed older builds without creating a verified backup first.
**Network/translation limitations:** Optional Google fonts and metadata require working providers; direct WebRTC LAN connectivity is network-dependent and not an unattended background sync; translations beyond the extended dictionary are not guaranteed complete.

## [4.9.0] – 2026-10-19 (Android & Windows)

- Responsive Android screens and modal fixes, including smaller-phone layouts.
- Direct per-book delete in the bookshelf and clear bulk-selection delete/folder actions.
- News in-app preview, separate original-source browser link, saved articles and a Favorites tab.
- In-app history for all recorded BooksUp releases from 4.0 through 4.9, including Windows.
- Goodreads imports automatically route clearly identified Manga, Manhwa, Comics and Graphic Novels into the Manga profile, while regular books go to the Books profile. Existing Goodreads-only records are migrated conservatively once.
- Desktop Google Drive appDataFolder sync client added, with OAuth PKCE, OS-encrypted refresh tokens and revision-based conflict protection. The Android sync implementation remains opt-in.
- **Configuration required:** Google Desktop and Android OAuth client IDs are currently not provisioned. Device sync cannot connect before the publisher configures these IDs and builds compatible apps. Read docs/DEVICE_SYNC.md.
- The compact Android reading statistics remain unchanged; the Windows analytics dashboard is Windows-only.
- News providers supply excerpts, not the full article. BooksUp shows only the available feed summary and links to the publisher for the full article.

**Android signing:** In-place updates require a persistent matching debug signing certificate. Never uninstall without verifying a full backup.

## [4.8.0-android.1] – 2026-10-19 (Android-Testversion)

- Android now includes the Windows 4.8 reading-list safety fix (stable IDs instead of positional deletion), large collection cards with recent covers, the new profile order, theme/accent customization, and visibly different font sizes.
- Discover books can be added directly to a preferred reading list selected in Settings.
- The native Capacitor HTTP bridge handles Google Books/Open Library and optional German National Library title/ISBN lookups. Ambiguous editions require selecting the correct ISBN.
- PDF readers include touch-friendly page-area highlighting, notes and fullscreen handling.
- Changelog and News capitalization are updated. The existing compact mobile reading statistics remain; the desktop analytics dashboard is intentionally excluded.
- Android-only assets are bundled after Capacitor sync, preserving the existing BooksUp app ID and local storage origin. Android versionName **4.8.0**, versionCode **40800**.
- Android prerelease asset: **BooksUp-debug.apk**, tag **v4.8.0-android.1**. Windows 4.8.0 is unchanged.

**In-place upgrade warning:** A higher versionCode is not enough: Android requires the same signing certificate. The last public 4.6 debug build did not have a persistent signing secret configured, so an upgrade from that APK is likely to fail. Back up and verify all local book files before considering a reinstall. Never uninstall without a working backup.

**External services:** ISBN discovery does not mean the MediMops price feed is available. The real price source must be configured separately. Admin privileges require the deployed GitHub OAuth Worker; no local switch grants admin rights.

## [4.8.0] – 2026-10-19 (Windows)

- Fixed index-based list deletion: each reading-list entry now has a stable unique ID; removing a list entry never removes the underlying book.
- Corrected News capitalization in Windows navigation.
- Reordered the profile sections: profile, continue reading, quick tiles, library, reading lists, statistics, history, top five, recommendations.
- Made accent colors independent of base themes; added persistent saved theme combinations.
- Increased observable font-size differences throughout desktop views.
- Replaced reading-list grid with large horizontal collection cards, latest books and cover previews.
- Catalog lookups from Electron main process using Google Books and Open Library with optional DNB title/ISBN SRU; confidence-ranked ISBN suggestions and a choice UI for ambiguous editions.
- Added a default Discover reading-list setting and one-click add action.
- Owner login shortcut Ctrl+Shift+A opens configured GitHub OAuth publisher worker; login requires secure backend, not local bypass.

**Price alarm note:** A valid edition-specific ISBN is required. The existing MediMops price monitor also requires an actual, authorized price feed; this release does not fabricate prices or guarantee a third-party source.

**Windows-only:** Android resources and APK workflows are unchanged. Windows UI functions require installed/portable 4.8.

# BooksUp – Update Log

Dokumentation zum Open-Source-Projekt [lavender1510/BooksUp](https://github.com/lavender1510/BooksUp). Android- und Windows-Testversionen werden als GitHub-Releases bereitgestellt. Automatisierte Builds ersetzen keine Tests auf echten Geräten.

## [4.7.0] – 2026-10-19 (Windows-Testversion)

- Fixed navigation rail, fullscreen PDF display and Ctrl+wheel/touchpad zoom on Windows.
- New desktop analytics dashboard with monthly completion, activity, genres and profile comparison.
- Discovery arrow controls; localized Windows controls and visible changelog.
- Multi-file and folder import entry points, plus automatic background enrichment of newly imported book records.
- Online metadata lookup from Google Books, Open Library and optional DNB ISBN SRU; only blank fields are completed.
- In-reader page-area annotations and freeform notes saved locally.
- Admin/editorial menu hidden in Windows client; authentication still requires separately deployed GitHub OAuth Worker.
- Installer update checks, portable release fallback and Windows-only distribution pipeline.

**Known limitations:** On PDF canvas pages, highlights are page-area overlays (not selectable PDF text). Hardcover is not connected without an API token. DNB SRU access may be restricted, so Google Books and Open Library remain active fallbacks. Legacy translations outside the UI dictionaries and real-device end-to-end workflows require additional verification. No Android APK is published as part of 4.7.0.

## [4.6.0] – 2026-10-18 (Testversion)

### Verbesserungen
- **Leselisten:** Ein Buch entfernen lässt die geöffnete Liste bestehen und aktualisiert die Zählung. In automatisch gepflegten Listen werden manuell entfernte Bücher ausgeschlossen.
- **Bibliothek:** Zeigt die Anzahl gefundener Bibliotheksbücher.
- **Discover:** Suche nach Titel, Autor und ISBN mit Google Books/Open Library, Hinzufügen zur gewünschten Leseliste ohne Besitzannahme, größere/wechselnde Empfehlungsauswahl mit Ladefeedback.
- **Ähnliche Bücher:** Unter den Detailinformationen von Buchregal-, Bibliotheks- und Leselisteneinträgen.
- **ISBN und Metadaten:** Ausgabe-/Sprach-Auswahl statt stiller Übernahme einer möglicherweise falschen ISBN; zusätzliche Datenbankabfragen ergänzen nur fehlende Felder.
- **Privatprofil:** Lokal gespeichertes Alter, optionaler 18+-Empfehlungsmodus erst ab 18; konservativer Filter für unklassifizierte Online-Titel bei Minderjährigen.
- **Lesestatistik:** Anzahl gelesener Bücher nach Jahren und Monaten im Profil.
- **Theme:** Das unveränderte Neon-Theme heißt nun **Midnight Orchid**.
- **Admin-Vorbereitung:** Sicherheitsorientiertes OAuth-Backend für den verifizierten GitHub-Herausgeber `lavender1510`, eigene redaktionelle Buchinformationen und News-Artikel. Betrieb erfordert separate OAuth-/Worker-Konfiguration, daher nicht standardmäßig freigeschaltet.
- **Übersetzungen:** Weitere feste Begriffe lokalisiert; ältere Texte sind noch nicht vollständig geprüft.

### Grenzen / Testhinweise
- ISBNs/Altersratings und Buchdaten sind nicht für alle Ausgaben zuverlässig verfügbar. Minderjährigenschutz ist konservativ, aber keine unabhängige Altersverifikation.
- Adminfunktionen können **erst nach sicherer Server-Einrichtung** aktiviert werden.
- Google Books kann Treffer wiederholen oder API-Limits setzen.
- Vollständige mehrsprachige Lokalisierung und alle Geräte-Abläufe sind noch nicht end-to-end verifiziert.
- Android-In-Place-Updates erfordern weiterhin denselben APK-Signaturschlüssel, den die vorhandene Installation nutzt. Niemals ohne erfolgreich getestetes Backup deinstallieren.

## [4.5.0] – 2026-10-18 (Testversion veröffentlicht)

### Neu
- **Leselisten-Navigation:** Übersicht als Kacheln mit Buchzahl und Drei-Punkte-Menü; separate Detail- und Einstellungsseiten.
- **Bibliothek:** Aggregiert alle Bücher der Leselisten und zeigt Herkunft, Fortschritt und vollständig gelesene Bücher mit 100-%-Balken.
- **Selektives Bücherregal:** Jede Leseliste kann zum Anzeigen im Regal freigegeben werden. Wunschbücher werden nicht automatisch als Besitz erfasst.
- **Goodreads-Daten:** Neue Importe erzeugen Leselisten statt Ordner und speichern noch nicht vorhandene Bücher zunächst im getrennten Bibliotheksbestand.
- **Geräte-Backups:** Zeitgestempelte ZIP-Sicherungen im BooksUp-Ordner; Kennzeichen `automatisch` / `manuell`, Frequenz täglich/wöchentlich/monatlich, einstellbare Aufbewahrung.
- **Desktop-Analyse:** Leseminuten, Seiten, Genres und Listenvergleich; eigener Geräteübertragungsbereich.
- **ISBN-Nachsuche:** Recherche zu importierten Büchern über Google Books und Open Library, ergänzt um manuelle ISBN-Korrektur.
- **Projektportfolio:** separates PDF mit Produktvision, technischem Aufbau und Qualitätszielen.

### Behoben
- Navigation aus dem Profil öffnet direkt die ausgewählte Leseliste.
- Fortschrittsanzeige verwendet bei als gelesen markierten Büchern 100 %.
- Goodreads-Shelves werden nicht mehr beim Neuimport automatisch als Ordner ins Regal übertragen.

### Noch offen / wichtige Hinweise
- Bereits früher importierte Bücher ohne Herkunftsmarkierung bleiben aus Datenschutz- und Besitzschutzgründen unverändert; ihre Zuordnung muss manuell geprüft werden.
- Automatische Backups funktionieren nur, während die App läuft. Kein Android-Hintergrunddienst bei geschlossener App.
- Vollständig automatische Windows-Google-Drive-Synchronisierung ist noch nicht integriert; der ZIP-Transfer ist die verfügbare geräteübergreifende Alternative.
- Android-In-Place-Upgrades setzen ein unverändertes APK-Signaturzertifikat voraus.
- Online-Cover und ISBNs sind nicht für jedes Buch bzw. jede Ausgabe verfügbar.
- UI-Lokalisierung früherer Dialoge ist nicht in jedem Detail vollständig nachgewiesen.

## [4.4.0] – 2026-10-16
- Größerer Empfehlungsbestand mit Online-Cache und Cover-Retries.
- PDF-Zoom auf Mobilgeräten und vereinfachte Regalleiste.
- Erweiterte Währungen und ein farbbasiertes dunkles Theme.
- Optionaler MediMops-Preisalarm als Beta; externe Preisdatenquelle erforderlich.

## [4.3.0] – 2026-10-16
- Online-Cover-Fallbacks, optimierter mobiler PDF-Reader und horizontaler Scrollmodus.
- Darstellungsänderungen speichern/verwerfen, erweiterte Reader-Einstellungen.
- Leselisten mit konfigurierbaren Aktualisierungsregeln.

## [4.2.0] – 2026-10-14
- News-Tab, RSS-Nachrichtenfeed, Backup-Fortschritt und Navigationsverbesserungen.
- Weitere Sprachzuordnungen und Buchdatenabfragen.

## [4.1.0] – 2026-10-14
- Goodreads-CSV-Import mit einstellbarer Bewertungskonvertierung.
- Kaufpreis/UVP, Leselisten, Regalsuche und Mehrfachauswahl.

## [4.0.0] – 2026-10-13
- Discover-Oberfläche, Buchdetailseiten, Reader-Layout und Theme-Vorlagen.
- Desktop-Sidebar und Breitenanpassungen.

## Frühere Meilensteine
- **3.3:** Google-Drive-Appdaten-Backup als OAuth-abhängige Beta.
- **3.2:** Erste Windows-Build-Pipeline und Editionen.
- **3.1:** Profilvorschau, Mehrfachimport, Lesesitzungen und Coververbesserungen.
