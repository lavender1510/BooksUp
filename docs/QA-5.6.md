# BooksUp 5.6 – Entwicklungs- und QA-Protokoll (nicht releasefähig)

Stand: Entwicklungsbranch `feature/booksup-56-quality`; Draft-PR #14. Änderungen erst nach vollständigem E2E-Test und geklärten externen Abhängigkeiten veröffentlichen.

## Automatisch prüfbar

- `npm run test:static` und die vorhandenen Tests für 4.8 bis 5.5 ausführen.
- `node tools/test-56-functional.cjs`: Syntax der geänderten Module; inhaltliche Ähnlichkeit vs. unpassende Bücher; unterschiedliches Ranking für verschiedene Bücher; Autorenabgleich bei Metadaten; Seriennummern; Hell-/Dunkel-/Systemmodus; Sprache-Speichern/Verwerfen und Reader-Session-Hooks.
- Workflow `check-49.yml`: Cross-Platform-Tests auf Pull Request.
- Workflow `check-android-48.yml`: Android-Source/Native-Checks auf Pull Request.

## Manuelle Prüfmatrix vor Freigabe

1. **Geräte:** Zwei echte Geräte im selben WLAN. Angebot/Antwort erstellen, Fingerprint-Code beidseitig vergleichen, erst dann Daten senden. Button davor deaktiviert, danach aktiv; Fortschritt 0–100 %, Empfang erst nach bestätigter Übernahme. Zielgerät-Import ablehnen, WLAN mitten im Transfer abschalten, anschließend erneut verbinden. Auch mehrere digitale PDFs und doppelte Bücher testen. Kein behaupteter erfolgreicher Import ohne Abschlussmeldung.
2. **Buchdaten:** Deutsche und englische Titel mit eindeutigen ISBNs, alternativen Titeln, Bandreihen sowie mehreren Ausgaben verwenden. Google Books, Open Library und optional DNB vergleichen. Falsche ISBN-Übernahme oder unbestätigte Bandangaben sind Release-Blocker. Offline-Fallback prüfen.
3. **Sprache:** Auf Deutsch, Englisch, Französisch, Spanisch und Italienisch umschalten, speichern, App neu starten. Alle Bereiche einschließlich Reader, Dialoge, Fehler- und Statusmeldungen prüfen. Keine Mischsprache zulassen.
4. **Ähnliche Bücher:** Mindestens fünf verschiedene Bücher aus drei Genres öffnen. API-Antworten prüfen, inhaltlich unpassende Treffer ausschließen und identische allgemeine Listen erkennen.
5. **Medimops:** Buch mit gültiger ISBN, ohne ISBN, ISBN-10, ungültige Prüfziffer und mehrere Ausgaben testen. Live-Preisfeed mit tatsächlich konfiguriertem und legitimem Datenanbieter testen, Preisänderung reproduzieren sowie Benachrichtigung auf echtem Android bestätigen. **Aktueller Blocker:** `www/medimops-prices.json` enthält keine Preise; ohne `BOOKSUP_MEDIMOPS_PROVIDER_URL` existiert kein verlässlicher Live-Preisabruf.
6. **Darstellung:** Alle Themes und Systemwechsel hell/dunkel, auch Reader und Dialoge, sofort und nach Neustart testen. Gespeicherte Darstellung vs. verworfene Änderungen vergleichen.
7. **Einstellungen:** Jeden Bereich öffnen, eine Änderung vornehmen, Verwerfen → letzter gespeicherter Zustand; Speichern → nach Neustart stabil. Insbesondere Empfehlungen, Reader, Benachrichtigungen, Profil, Datenschutz, Sprache prüfen. **Noch nicht durchgängig transaktional umgesetzt.**
8. **Reader:** Ein PDF mit echtem Text, ein gescanntes PDF und ein EPUB verwenden. Auswahl/Markierung, Zoom, Bildseiten, Wechsel von Seitendarstellung zu Textmodus, Annotation bearbeiten/löschen und Neustart testen. Vollbild-Sitzung inkl. Seite X von Y und Dauer starten; Hintergrund, Force-Close, Stromverlust simulieren und Fortschritt/Log prüfen.

## Release-Sperren

Kein Tag `v5.6.0-android` und keine Veröffentlichung, solange vollständige Lokalisierung, Speichern/Verwerfen in allen Bereichen, Medimops-Preisdienst und echte PDF-/EPUB-E2E-Tests fehlen. Die Android-App darf bei gleichem Signing Key nur über die vorhandene Installation aktualisiert werden; zuvor Nutzerdaten sichern. Keine bestehende Installation zum Testen ungeprüft deinstallieren.
