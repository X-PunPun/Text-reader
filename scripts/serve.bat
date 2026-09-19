@echo off
REM Arranca un servidor local. Hace falta porque el proyecto usa modulos ES
REM (import/export) y los navegadores los bloquean al abrir el archivo con
REM doble clic (file://). Con http://localhost funciona todo.
setlocal
set PORT=8080
cd /d "%~dp0.."

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/
  python -m http.server %PORT%
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/
  py -m http.server %PORT%
  goto :end
)

where npx >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/
  npx --yes serve -l %PORT% .
  goto :end
)

echo.
echo No se encontro Python ni Node en este equipo.
echo Instala uno de los dos, o abre la carpeta con la extension
echo "Live Server" de VS Code.
echo.
pause

:end
endlocal
