@echo off
chcp 65001 >nul
title Sistema de Stock - Informatica
cd /d "%~dp0backend"
echo Iniciando el Sistema de Stock...
echo (Esta ventana tiene que quedar abierta mientras se usa el sistema)
echo.
node dist\main.js
if errorlevel 1 (
  echo.
  echo Hubo un problema al iniciar. Revisa el mensaje de arriba.
  pause
)
