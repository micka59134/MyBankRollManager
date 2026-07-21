@echo off
cd /d "%~dp0"
echo Demarrage de Bankroll Manager sur http://localhost:8765 ...
start "" http://localhost:8765
python -m http.server 8765
