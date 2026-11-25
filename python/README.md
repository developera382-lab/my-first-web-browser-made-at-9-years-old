# MicroWeb — Chrome-Like Web Browser for Python (Chromium Engine)

MicroWeb uses **PyQt5 + PyQtWebEngine** (embedded Chromium) so it runs natively on **Windows 7 (Python 3.8)** as well as Windows 10/11, macOS, and Linux, and loads every website directly without iframe restrictions.

## Option 1: Build `MicroWeb.exe` Automatically on GitHub (No Python Needed)
1. Upload this folder (including the `.github/workflows/build-microweb-exe.yml` file) to a GitHub repository.
2. Open the **Actions** tab in your repository on GitHub.
3. Select **Build MicroWeb.exe** and click **Run workflow**.
4. Once finished, download the **MicroWeb-Windows-exe** artifact, extract the ZIP, and double-click `MicroWeb.exe`.

## Option 2: Run Locally with Python (`microweb.py`)
> On **Windows 7**, use **Python 3.8.x** (the last official Python release supporting Windows 7).

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python microweb.py
```

## Option 3: Build `MicroWeb.exe` Locally
Double-click `build_exe.bat` or run:
```bat
pyinstaller --noconfirm --clean microweb.spec
```
Your executable will be created at `dist\MicroWeb\MicroWeb.exe`.
