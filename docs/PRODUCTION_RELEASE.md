# BooksUp Android – production releases

Android only installs an update over a prior installation when the package ID AND
signing certificate match. Android 5.2 and older used temporary debug signing
certificates. A newly signed production APK cannot overwrite those installations.

DO NOT uninstall your working version before verifying a full backup and
successful restoration of the library and locally stored PDF/EPUB files.

## One-time publisher setup on Windows

1. Install Java JDK and run PowerShell:
   powershell -ExecutionPolicy Bypass -File tools/Prepare-AndroidReleaseSigning.ps1
2. Back up the generated booksup-release.p12 securely and retain passwords forever.
3. On GitHub: lavender1510/BooksUp > Settings > Secrets and variables > Actions.
4. Add four repository secrets:

| GitHub secret | Contents |
|---|---|
| BOOKSUP_ANDROID_RELEASE_KEYSTORE_BASE64 | Entire base64 of the .p12 file |
| BOOKSUP_ANDROID_RELEASE_STORE_PASSWORD | Keystore password |
| BOOKSUP_ANDROID_RELEASE_KEY_ALIAS | booksup |
| BOOKSUP_ANDROID_RELEASE_KEY_PASSWORD | Private key password |

5. Run Actions > BooksUp Android Production Release > Run workflow.

The workflow intentionally fails if any of the above are absent. It builds
assembleRelease with the key from Actions Secrets, verifies the package with
apksigner, then publishes the stable v5.3.0-android release.

Never commit or publish the private signing certificate/passwords.

## Migration and limitations

A permanent signature ensures future updates using the same certificate,
but cannot retroactively update an older debug-signed installation.
Users must separately verify a complete backup before any migration.

Windows v5.3.0 is a stable installer/portable release. Authenticode
code signing is a separate optional publisher certificate and is not
equivalent to Android APK signing.
