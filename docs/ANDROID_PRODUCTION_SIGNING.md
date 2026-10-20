# BooksUp Android: Produktionssignatur und In-App-Updates

BooksUp 5.3.0 wird nur als Android-Release veröffentlicht, wenn eine **dauerhafte private Release-Signatur** vorliegt. Ein CI-Debug-Keystore ist ausdrücklich nicht für Downloads geeignet.

## Einmalige Einrichtung (Windows / PowerShell)

1. Öffne PowerShell lokal auf einem vertrauenswürdigen Rechner mit installiertem JDK 21.
2. Erstelle einen privaten Keystore **lokal**, niemals im Git-Repository:

```powershell
keytool -genkeypair -v -keystore booksup-release.jks -alias booksup -keyalg RSA -keysize 3072 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\booksup-release.jks))) | Set-Clipboard
```

3. Öffne `lavender1510/BooksUp` → Settings → Secrets and variables → Actions → New repository secret.
4. Lege diese vier Secrets an:

| Secret-Name | Wert |
| --- | --- |
| `BOOKSUP_ANDROID_RELEASE_KEYSTORE_BASE64` | Base64-Inhalt des gesamten Keystores aus der Zwischenablage |
| `BOOKSUP_ANDROID_RELEASE_STORE_PASSWORD` | Passwort der JKS-Datei |
| `BOOKSUP_ANDROID_RELEASE_KEY_ALIAS` | `booksup` (wenn oben so angegeben) |
| `BOOKSUP_ANDROID_RELEASE_KEY_PASSWORD` | Passwort des privaten Schlüssels |

5. Sichere die originale JKS-Datei und die Passwörter **getrennt und offline** an zwei sicheren Orten. Falls dieser Schlüssel verloren geht, können bestehende Installationen nicht mehr mit derselben Signatur aktualisiert werden.
6. Starte GitHub Actions → **BooksUp Android Production Release** → Run workflow. Das Ergebnis muss `BooksUp-5.3.0.apk` heißen und `apksigner verify` bestehen.

## Migration von früheren Debug-Releases

Android akzeptiert Aktualisierungen **nur mit identischer Signatur**. Eine bereits installierte, temporär signierte Debug-APK kann nicht durch eine produktionssignierte APK an Ort und Stelle ersetzt werden. Vor einer Migration zuerst eine komplette Sicherung aller Buchdaten **und digitaler Dateien** anlegen und die Wiederherstellung nachweislich testen. Erst danach eine Neuinstallation erwägen.

Es ist technisch nicht zulässig, das Signaturverfahren zu umgehen oder den privaten Keystore öffentlich zu committen.

## Windows

Der Windows-Installer aus dem regulären Release kann den vorhandenen Electron-Updater nutzen. Für vertrauenswürdige Windows-SmartScreen- und Authenticode-Signaturen wird zusätzlich ein Publisher-Codesigning-Zertifikat benötigt; ein Windows-Release ohne Authenticode ist noch nicht offiziell signiert.
