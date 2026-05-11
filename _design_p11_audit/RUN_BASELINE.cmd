@echo off
REM ============================================================
REM Sprint 0 baseline screenshots - run on Windows PowerShell
REM ============================================================
REM Pre-req: dev server running on http://127.0.0.1:3000
REM Pre-req: this folder is the repo root
REM ============================================================
cd /d "%~dp0\.."
echo.
echo Step 1/3: Installing Chromium browser binary (one-time, ~150 MB)
call npx playwright install chromium
if errorlevel 1 (
  echo Install failed. Try manually:
  echo   set PLAYWRIGHT_BROWSERS_PATH=0
  echo   npx playwright install chromium --force
  pause
  exit /b 1
)
echo.
echo Step 2/3: Capturing baseline of 9 routes + prototype...
node _design_p11_audit\audit-screenshots.js
echo.
echo Step 3/3: Listing output...
dir _design_p11_audit\screenshots\baseline
echo.
echo Done. Press any key to close.
pause
