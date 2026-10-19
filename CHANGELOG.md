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
