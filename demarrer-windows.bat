@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===============================================
echo   Simple Family - prototype local
 echo ===============================================
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js n'est pas installé. Installez-le puis relancez ce fichier.
 pause
 exit /b 1
)
if not exist node_modules\vite\bin\vite.js (
 echo Installation des dépendances...
 call npm install
 if errorlevel 1 (
  echo L'installation a echoue. Verifiez votre connexion Internet.
  pause
  exit /b 1
 )
)
echo Ouvrez http://localhost:3000 dans votre navigateur.
call npm run dev
pause
