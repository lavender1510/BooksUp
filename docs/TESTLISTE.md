# Testliste für echte Geräte

Ich konnte BooksUp nur im Desktop-Browser prüfen (automatisierte Tests). Bitte gehe das einmal auf einem Handy und einem Tablet durch. Mit **Einstellungen → Systemtest** siehst du sofort, was auf dem Gerät funktioniert.

**Handy (am besten ein älteres Modell mit wenig Arbeitsspeicher)**
- [ ] Systemtest zeigt keine ✗
- [ ] PDF mit 300+ Seiten öffnen: Blättern, Scrollen-Modus, Textmodus (läuft flüssig, kein Absturz?)
- [ ] EPUB mit Bildern öffnen, Kapitelliste, Suche, Lesezeichen mit Notiz
- [ ] Comic (CBZ): Seiten, Scrollen, Manga-Richtung
- [ ] Vollbild: Bildschirm bleibt an, Antippen blendet Leisten aus, Zurück-Taste schließt erst Einstellungen, dann Vollbild
- [ ] Gerät drehen während des Lesens (Position bleibt?)
- [ ] Hell, Dunkel, Sepia sowie Systemdesign
- [ ] Automatisches Scrollen: Start, Pause per Antippen
- [ ] Erinnerung: Test-Button, Android 13+ fragt nach Erlaubnis, kommt die Nachricht?
- [ ] ISBN-Scan mit Kamera, danach auch ohne Internet (Fehlermeldung statt Absturz)
- [ ] Backup mit Büchern erstellen, teilen, App-Daten löschen, Backup laden
- [ ] Flugmodus: App läuft komplett offline (Schriften evtl. anders, wenn nicht lokal eingebunden)

**Tablet**
- [ ] Querformat: Doppelseite bei Comics und PDFs
- [ ] Layout im Hoch- und Querformat, Textmodus mit großer Schrift

**Vor der Veröffentlichung**
- [ ] Freunde und Chat mit zwei Geräten (nur wenn Firebase eingerichtet ist)
- [ ] Release-Build (signiert) installieren und die Punkte oben kurz wiederholen
