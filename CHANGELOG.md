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
