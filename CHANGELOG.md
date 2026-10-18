# BooksUp – Update Log

Dokumentation zum Open-Source-Projekt [lavender1510/BooksUp](https://github.com/lavender1510/BooksUp). Android- und Windows-Testversionen werden als GitHub-Releases bereitgestellt. Automatisierte Builds ersetzen keine Tests auf echten Geräten.

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
