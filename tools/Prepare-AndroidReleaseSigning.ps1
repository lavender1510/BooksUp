# BooksUp Android production signing setup (Windows PowerShell).
# Run locally. Do not commit the generated keystore or share its passwords.
$ErrorActionPreference='Stop'
$dir=Join-Path $env:USERPROFILE 'Documents\BooksUp-Android-Signing'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$key=Join-Path $dir 'booksup-release.p12'
if(Test-Path $key){throw "Keystore exists: $key. Never overwrite a signing key used for a published APK."}
$keytool=Get-Command keytool -ErrorAction Stop
Write-Host 'Generating permanent BooksUp production signing certificate.'
Write-Host 'Choose a strong password when keytool prompts. Save it in a password manager.'
& $keytool.Source -genkeypair -storetype PKCS12 -keystore $key -alias booksup -keyalg RSA -keysize 4096 -validity 10000 -dname 'CN=BooksUp,O=BooksUp,C=DE'
if($LASTEXITCODE -ne 0 -or !(Test-Path $key)){throw 'Keytool failed'}
Write-Host "Keystore: $key"
Write-Host 'BACK THIS FILE UP SECURELY. Losing the certificate blocks future Android updates.'
Write-Host 'Run the command below to copy it into a GitHub Secret:'
Write-Host ('[Convert]::ToBase64String([IO.File]::ReadAllBytes('''+$key+''')) | Set-Clipboard')
Write-Host 'Then open GitHub > lavender1510/BooksUp > Settings > Secrets and variables > Actions.'
Write-Host 'Set BOOKSUP_ANDROID_RELEASE_KEYSTORE_BASE64 to the base64 string.'
Write-Host 'Set BOOKSUP_ANDROID_RELEASE_STORE_PASSWORD to the password.'
Write-Host 'Set BOOKSUP_ANDROID_RELEASE_KEY_ALIAS to booksup.'
Write-Host 'Set BOOKSUP_ANDROID_RELEASE_KEY_PASSWORD to the private key password.'
Write-Host 'After all four secrets exist, run Android Production Release workflow.'
