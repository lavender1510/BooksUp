# Freunde & Chat einrichten (einmalig, kostenlos)

1. https://console.firebase.google.com → **Projekt hinzufügen** (Analytics nicht nötig).
2. **Build → Authentication → Sign-in method → Anonym** aktivieren.
3. **Build → Firestore Database → Datenbank erstellen** (Produktionsmodus, Region z. B. eur3).
4. Reiter **Regeln**: Inhalt von `firestore.rules` einfügen → **Veröffentlichen**.
5. **Projekteinstellungen (Zahnrad) → Allgemein → Meine Apps → Web-App (</>)** hinzufügen.
   Aus der angezeigten Konfiguration brauchst du `apiKey` und `projectId`.
6. In BooksUp: **Einstellungen → Freunde-Server** → beide Werte eintragen → Speichern.
   Fertig. Danach im Bereich **Freunde** die ID teilen oder eine ID eingeben.

Wichtig
- Den API-Schlüssel **nicht** auf „Android-Apps“ einschränken, sonst blockt Google die Anfragen aus der WebView. Der Schutz kommt von den Regeln in `firestore.rules`.
- Stattdessen in der Google Cloud Console (APIs & Dienste → Anmeldedaten) den Schlüssel auf die **API-Einschränkungen** „Identity Toolkit API“ und „Cloud Firestore API“ begrenzen, ein **Budget mit Warnung** anlegen und die Firestore-Kontingente niedrig halten. Damit bleibt ein möglicher Missbrauch begrenzt.
- **App Check** (Schutz gegen fremde Apps) ist in dieser Version nicht eingebaut. Es braucht das Firebase-SDK bzw. ein natives Plugin, die hier verwendete schlanke Anbindung über REST kann es nicht.
- Wer alle Nutzer mit denselben Zugangsdaten versorgen will, kann `apiKey` und `projectId` oben in `index.html` bei `FBCFG` eintragen. Dann entfällt Schritt 6.
- Die Identität (anonymes Konto) steckt im Backup. Wer ein Backup lädt, behält seine Freunde. Backup-Dateien nicht weitergeben.
- Chats sind nicht Ende-zu-Ende-verschlüsselt, und es gibt keine Push-Benachrichtigungen.
