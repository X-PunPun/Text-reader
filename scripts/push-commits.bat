@echo off
REM Sube al repositorio los commits locales UNO A UNO, en orden.
REM Asi el historial aparece en GitHub paso a paso y no en un unico empujon.
setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo Consultando el estado del remoto...
git fetch origin
if errorlevel 1 goto error

for /f %%c in ('git rev-list --reverse origin/main..HEAD') do (
  echo.
  echo ---------------------------------------------
  git log -1 --format="%%h  %%s" %%c
  echo ---------------------------------------------
  git push origin %%c:main
  if errorlevel 1 goto error
)

echo.
echo Enlazando la rama local con origin/main...
git branch --set-upstream-to=origin/main main >nul 2>nul

echo.
echo Listo. Todos los commits estan en GitHub.
goto end

:error
echo.
echo El push se detuvo. Revisa el mensaje de arriba.
echo Si pide usuario y contrasena, usa un token de acceso personal
echo o instala Git Credential Manager.

:end
pause
endlocal
