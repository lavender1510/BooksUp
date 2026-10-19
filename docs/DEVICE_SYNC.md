# BooksUp – Android + Windows Geräte synchronisieren (4.9)

BooksUp nutzt den privaten **Google Drive appDataFolder**. Es werden beide Profile, Leselisten, Lesefortschritte und digitale Buchdateien synchronisiert, aber nur während BooksUp geöffnet ist.

## Einmalige Einrichtung durch den App-Herausgeber

Die Google-OAuth-Client-IDs sind im Repository **noch nicht konfiguriert**. Ohne sie funktioniert der Login nicht.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) ein Projekt erstellen und die Google Drive API aktivieren.
2. Den OAuth-Zustimmungsbildschirm inklusive Scope **https://www.googleapis.com/auth/drive.appdata** konfigurieren. Während der Testphase die jeweiligen Google-Konten als Tester hinzufügen.
3. Einen **Webanwendungs-OAuth-Client** für den bestehenden Android-Capacitor-Social-Login-Flow erstellen und dessen öffentliche ID im GitHub Secret **BOOKSUP_GOOGLE_WEB_CLIENT_ID** hinterlegen. Je nach Plugin-Konfiguration ist auch ein Android OAuth Client nötig, dessen Paketname **dev.lyvt.booksup** und SHA-1 zur tatsächlichen APK-Signatur passen.
4. Einen getrennten **Desktop OAuth Client** erstellen. Dessen öffentliche Client-ID in **www/cloud-drive-config.js** bei **BOOKSUP_GOOGLE_DESKTOP_CLIENT_ID** setzen. Niemals ein Client-Secret oder Zugriffstoken ins Repository committen.
5. Anschließend Android APK und Windows Installer neu bauen und den Anmeldeablauf auf echten Geräten verifizieren.

## Verbinden

Auf jedem Gerät BooksUp → Einstellungen → Datensicherung → Mit Google verbinden öffnen. **Dasselbe Google-Konto** verwenden. Auf dem ersten Gerät die Datensicherung durchführen, bevor das zweite Gerät mit der Cloud verbunden wird. Anschließend die automatische Synchronisierung einschalten.

Unter Windows startet BooksUp den OAuth-PKCE-Login im Systembrowser mit einem kurzlebigen Rückrufserver auf **127.0.0.1**. Der Refresh-Token wird nur mit der Betriebssystem-Verschlüsselung von Electron gespeichert; die Weboberfläche erhält keinen echten Google-Token.

## Schutz vor Datenverlust

- BooksUp prüft die Cloud-Revision. Bei parallelen Änderungen wird ein Konflikt gemeldet und nichts ungefragt überschrieben.
- Die manuelle Cloud-Wiederherstellung kann die lokale Bibliothek ersetzen und fragt daher um Bestätigung. Vorher immer ein vollständiges ZIP-Backup erzeugen und prüfen.
- Kein automatisches Drei-Wege-Merge; keine Synchronisierung bei geschlossener App; kein Offline-Transfer.
- Google Drive appDataFolder ist privat für das Google-Konto, aber nicht zusätzlich durch eine eigenständige Ende-zu-Ende-Verschlüsselung geschützt.
- Android-Updates funktionieren nur bei identischer APK-Signatur. Ohne dauerhaftes CI-Signaturzertifikat niemals die alte App ohne überprüftes Backup deinstallieren.

**Stand:** Der Client-Code und die Cross-Platform-Schnittstelle sind implementiert. **Betriebsbereit erst nach Eintragen und Testen der OAuth-Client-IDs durch den Herausgeber.**
