@echo off
setlocal
cd /d "%~dp0"
echo ===============================
echo   BooksUp - Android APK Build
 echo ===============================
where node >nul 2>&1
if errorlevel 1 (
 echo ERROR: Node.js 22 oder neuer fehlt.
 echo Installiere Node.js von https://nodejs.org
 pause
 exit /b 1
)
call npm install
if errorlevel 1 goto :failed
call npm run android:apk
if errorlevel 1 goto :failed
echo.
echo APK fertig: release\BooksUp-debug.apk
pause
exit /b 0
:failed
echo.
echo Build fehlgeschlagen. Pruefe Android Studio, SDK, Java und die Meldung oben.
pause
exit /b 1
