@echo off
setlocal
cd /d "%~dp0"
echo BooksUp Desktop - Electron
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js fehlt. Installiere Node.js von https://nodejs.org
 pause
 exit /b 1
)
if not exist "node_modules\electron" (
 call npm install
 if errorlevel 1 goto :failed
)
call npm start
if errorlevel 1 goto :failed
exit /b 0
:failed
echo BooksUp konnte nicht gestartet werden.
pause
exit /b 1
