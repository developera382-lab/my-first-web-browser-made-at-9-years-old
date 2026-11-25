@echo off
setlocal
echo === Building MicroWeb.exe (Windows 7 / 10 / 11) ===

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

pyinstaller --noconfirm --clean microweb.spec

echo.
echo Build complete! Launch MicroWeb with:
echo   dist\MicroWeb\MicroWeb.exe
pause
