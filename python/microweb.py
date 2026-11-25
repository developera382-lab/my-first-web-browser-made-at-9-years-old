"""
MicroWeb — Chrome-Like Desktop Web Browser for Python (Chromium Engine)
Built with PyQt5 + PyQtWebEngine for Windows 7, Windows 10/11, macOS, and Linux.

Features:
  - Real Chromium rendering engine (PyQtWebEngine) with full HTML5/JS/WebGL support
  - Multi-tab browsing with favicons, close buttons, and New Tab (+)
  - Smart Omnibox (auto-detects URLs vs search queries)
  - Back, Forward, Reload/Stop, Home, and Zoom controls
  - Persistent Bookmarks bar and History (stored in ~/.microweb/)
  - Private / Incognito window mode (Ctrl+Shift+N)
  - Find in page (Ctrl+F)
  - Download manager shelf with progress
  - Integrated Chromium DevTools panel (F12)
  - Light & Dark Chrome-inspired themes
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus, urlparse

from PyQt5.QtCore import QSize, Qt, QUrl
from PyQt5.QtGui import QIcon, QKeySequence
from PyQt5.QtWebEngineWidgets import (
    QWebEngineDownloadItem,
    QWebEnginePage,
    QWebEngineProfile,
    QWebEngineSettings,
    QWebEngineView,
)
from PyQt5.QtWidgets import (
    QAction,
    QApplication,
    QDockWidget,
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenu,
    QPushButton,
    QShortcut,
    QTabWidget,
    QToolBar,
    QToolButton,
    QVBoxLayout,
    QWidget,
)

APP_NAME = "MicroWeb"
APP_VERSION = "1.0.0"
DATA_DIR = Path.home() / ".microweb"
BOOKMARKS_FILE = DATA_DIR / "bookmarks.json"
HISTORY_FILE = DATA_DIR / "history.json"
SETTINGS_FILE = DATA_DIR / "settings.json"

SEARCH_ENGINES = {
    "duckduckgo": {
        "label": "DuckDuckGo",
        "template": "https://duckduckgo.com/?q={query}",
    },
    "google": {
        "label": "Google",
        "template": "https://www.google.com/search?q={query}",
    },
    "bing": {
        "label": "Bing",
        "template": "https://www.bing.com/search?q={query}",
    },
}

DEFAULT_BOOKMARKS = [
    {"title": "Wikipedia", "url": "https://en.wikipedia.org/"},
    {"title": "DuckDuckGo", "url": "https://duckduckgo.com/"},
    {"title": "Python.org", "url": "https://www.python.org/"},
    {"title": "MDN Web Docs", "url": "https://developer.mozilla.org/"},
    {"title": "GitHub", "url": "https://github.com/"},
]

DEFAULT_SETTINGS = {
    "theme": "light",
    "search_engine": "duckduckgo",
    "show_bookmarks_bar": True,
    "home_url": "microweb://newtab",
}


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path: Path, fallback: Any) -> Any:
    ensure_data_dir()
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def save_json(path: Path, data: Any) -> None:
    ensure_data_dir()
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def looks_like_url(text: str) -> bool:
    value = text.strip()
    if not value or " " in value:
        return False
    if value.startswith(("http://", "https://", "file://", "microweb://")):
        return True
    if value.startswith("localhost"):
        return True
    domain_pattern = re.compile(r"^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([:/?#].*)?$")
    return bool(domain_pattern.match(value))


def normalize_input_to_url(raw: str, search_engine_key: str) -> str:
    text = raw.strip()
    if not text:
        return "microweb://newtab"
    if text.startswith("microweb://"):
        return text
    if looks_like_url(text):
        if not text.startswith(("http://", "https://", "file://")):
            return f"https://{text}"
        return text
    engine = SEARCH_ENGINES.get(search_engine_key, SEARCH_ENGINES["duckduckgo"])
    return engine["template"].format(query=quote_plus(text))


def build_stylesheet(theme: str, incognito: bool) -> str:
    if incognito:
        bg = "#1e222a"
        surface = "#282c34"
        toolbar = "#2c313c"
        border = "#3a404d"
        text = "#f1f5f9"
        muted = "#94a3b8"
        accent = "#60a5fa"
        omnibox = "#1b1f27"
    elif theme == "dark":
        bg = "#202124"
        surface = "#292a2d"
        toolbar = "#35363a"
        border = "#44474e"
        text = "#e8eaed"
        muted = "#9aa0a6"
        accent = "#8ab4f8"
        omnibox = "#202124"
    else:
        bg = "#dee1e6"
        surface = "#f1f3f4"
        toolbar = "#ffffff"
        border = "#dadce0"
        text = "#202124"
        muted = "#5f6368"
        accent = "#1a73e8"
        omnibox = "#f1f3f4"

    return f"""
        QMainWindow {{
            background-color: {bg};
            color: {text};
        }}
        QTabWidget::pane {{
            border: none;
            background-color: {toolbar};
        }}
        QTabBar {{
            background-color: {bg};
            qproperty-drawBase: 0;
        }}
        QTabBar::tab {{
            background-color: {bg};
            color: {muted};
            padding: 8px 14px;
            margin-top: 6px;
            margin-right: 2px;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            min-width: 120px;
            max-width: 220px;
            font-size: 12px;
        }}
        QTabBar::tab:selected {{
            background-color: {toolbar};
            color: {text};
            font-weight: 600;
        }}
        QTabBar::tab:hover:!selected {{
            background-color: {surface};
        }}
        QToolBar {{
            background-color: {toolbar};
            border: none;
            border-bottom: 1px solid {border};
            spacing: 4px;
            padding: 5px 8px;
        }}
        QToolButton {{
            background-color: transparent;
            color: {text};
            border: none;
            border-radius: 14px;
            padding: 5px 8px;
            font-size: 13px;
        }}
        QToolButton:hover {{
            background-color: {surface};
        }}
        QToolButton:disabled {{
            color: {muted};
        }}
        QLineEdit#omnibox {{
            background-color: {omnibox};
            color: {text};
            border: 1px solid {border};
            border-radius: 16px;
            padding: 6px 14px;
            font-size: 13px;
            selection-background-color: {accent};
        }}
        QLineEdit#omnibox:focus {{
            border: 2px solid {accent};
            background-color: {toolbar};
        }}
        QWidget#findBar, QWidget#downloadBar {{
            background-color: {toolbar};
            border-top: 1px solid {border};
            color: {text};
        }}
        QLineEdit {{
            background-color: {omnibox};
            color: {text};
            border: 1px solid {border};
            border-radius: 6px;
            padding: 4px 8px;
        }}
        QPushButton {{
            background-color: {surface};
            color: {text};
            border: 1px solid {border};
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
        }}
        QPushButton:hover {{
            border-color: {accent};
        }}
        QMenu {{
            background-color: {toolbar};
            color: {text};
            border: 1px solid {border};
            padding: 4px;
        }}
        QMenu::item {{
            padding: 6px 20px;
            border-radius: 4px;
        }}
        QMenu::item:selected {{
            background-color: {surface};
        }}
    """


class MicroWebPage(QWebEnginePage):
    def __init__(self, profile: QWebEngineProfile, window: "MicroWebWindow") -> None:
        super().__init__(profile, window)
        self._window = window

    def createWindow(self, _type: QWebEnginePage.WebWindowType) -> QWebEnginePage:
        new_view = self._window.add_new_tab("microweb://newtab", switch=True)
        return new_view.page()


class MicroWebWindow(QMainWindow):
    def __init__(self, incognito: bool = False) -> None:
        super().__init__()
        self.incognito = incognito
        self.settings_data: Dict[str, Any] = load_json(SETTINGS_FILE, dict(DEFAULT_SETTINGS))
        self.bookmarks: List[Dict[str, str]] = load_json(BOOKMARKS_FILE, list(DEFAULT_BOOKMARKS))
        self.history: List[Dict[str, str]] = load_json(HISTORY_FILE, [])

        if self.incognito:
            self.profile = QWebEngineProfile(self)
            self.profile.setHttpCacheType(QWebEngineProfile.MemoryHttpCache)
            self.profile.setPersistentCookiesPolicy(QWebEngineProfile.NoPersistentCookies)
            title_suffix = " (Incognito)"
        else:
            self.profile = QWebEngineProfile.defaultProfile()
            title_suffix = ""

        self.profile.downloadRequested.connect(self.handle_download_requested)

        self.setWindowTitle(f"{APP_NAME}{title_suffix}")
        self.resize(1280, 820)

        self.devtools_dock: Optional[QDockWidget] = None
        self.devtools_view: Optional[QWebEngineView] = None

        self._build_ui()
        self._apply_theme()
        self._register_shortcuts()

        start_url = "microweb://newtab" if self.incognito else self.settings_data.get("home_url", "microweb://newtab")
        self.add_new_tab(start_url, switch=True)

    def _build_ui(self) -> None:
        central = QWidget(self)
        root_layout = QVBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # Navigation Toolbar
        self.nav_toolbar = QToolBar("Navigation", self)
        self.nav_toolbar.setMovable(False)
        self.nav_toolbar.setIconSize(QSize(16, 16))
        self.addToolBar(Qt.TopToolBarArea, self.nav_toolbar)

        self.back_btn = self._make_tool_button("←", "Back (Alt+Left)", self.go_back)
        self.forward_btn = self._make_tool_button("→", "Forward (Alt+Right)", self.go_forward)
        self.reload_btn = self._make_tool_button("↻", "Reload (Ctrl+R)", self.reload_or_stop)
        self.home_btn = self._make_tool_button("⌂", "Home", self.go_home)

        self.nav_toolbar.addWidget(self.back_btn)
        self.nav_toolbar.addWidget(self.forward_btn)
        self.nav_toolbar.addWidget(self.reload_btn)
        self.nav_toolbar.addWidget(self.home_btn)

        # Omnibox
        self.omnibox = QLineEdit(self)
        self.omnibox.setObjectName("omnibox")
        self.omnibox.setPlaceholderText("Search the web or type a URL (microweb://newtab)")
        self.omnibox.returnPressed.connect(self.navigate_from_omnibox)
        self.nav_toolbar.addWidget(self.omnibox)

        self.bookmark_star_btn = self._make_tool_button("☆", "Bookmark this page (Ctrl+D)", self.toggle_current_bookmark)
        self.nav_toolbar.addWidget(self.bookmark_star_btn)

        if self.incognito:
            incognito_badge = QLabel(" Incognito ")
            incognito_badge.setStyleSheet("color: #93c5fd; font-weight: 600; font-size: 12px;")
            self.nav_toolbar.addWidget(incognito_badge)

        self.zoom_label = QLabel("100%")
        self.zoom_label.setStyleSheet("font-size: 11px; padding: 0 6px;")
        self.nav_toolbar.addWidget(self.zoom_label)

        self.menu_btn = QToolButton(self)
        self.menu_btn.setText("⋮")
        self.menu_btn.setToolTip("Customize and control MicroWeb")
        self.menu_btn.setPopupMode(QToolButton.InstantPopup)
        self.menu_btn.setMenu(self._build_main_menu())
        self.nav_toolbar.addWidget(self.menu_btn)

        # Bookmarks Bar
        self.addToolBarBreak(Qt.TopToolBarArea)
        self.bookmarks_bar = QToolBar("Bookmarks", self)
        self.bookmarks_bar.setMovable(False)
        self.addToolBar(Qt.TopToolBarArea, self.bookmarks_bar)
        self._rebuild_bookmarks_bar()
        self.bookmarks_bar.setVisible(bool(self.settings_data.get("show_bookmarks_bar", True)))

        # Tabs
        self.tabs = QTabWidget(self)
        self.tabs.setDocumentMode(True)
        self.tabs.setTabsClosable(True)
        self.tabs.setMovable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self.on_tab_changed)

        new_tab_btn = QToolButton(self)
        new_tab_btn.setText("+")
        new_tab_btn.setToolTip("New Tab (Ctrl+T)")
        new_tab_btn.clicked.connect(lambda: self.add_new_tab("microweb://newtab", switch=True))
        self.tabs.setCornerWidget(new_tab_btn, Qt.TopRightCorner)
        root_layout.addWidget(self.tabs)

        # Find-in-page bar (hidden by default)
        self.find_bar = QWidget(self)
        self.find_bar.setObjectName("findBar")
        find_layout = QHBoxLayout(self.find_bar)
        find_layout.setContentsMargins(12, 6, 12, 6)
        find_layout.addWidget(QLabel("Find:"))
        self.find_input = QLineEdit(self.find_bar)
        self.find_input.setFixedWidth(260)
        self.find_input.setPlaceholderText("Find in page...")
        self.find_input.textChanged.connect(lambda text: self.find_in_page(text, backward=False))
        self.find_input.returnPressed.connect(lambda: self.find_in_page(self.find_input.text(), backward=False))
        find_layout.addWidget(self.find_input)

        prev_btn = QPushButton("Previous")
        prev_btn.clicked.connect(lambda: self.find_in_page(self.find_input.text(), backward=True))
        next_btn = QPushButton("Next")
        next_btn.clicked.connect(lambda: self.find_in_page(self.find_input.text(), backward=False))
        close_find_btn = QPushButton("Close")
        close_find_btn.clicked.connect(self.hide_find_bar)
        find_layout.addWidget(prev_btn)
        find_layout.addWidget(next_btn)
        find_layout.addWidget(close_find_btn)
        find_layout.addStretch()
        self.find_bar.setVisible(False)
        root_layout.addWidget(self.find_bar)

        # Download shelf
        self.download_bar = QWidget(self)
        self.download_bar.setObjectName("downloadBar")
        self.download_layout = QHBoxLayout(self.download_bar)
        self.download_layout.setContentsMargins(12, 6, 12, 6)
        self.download_status_label = QLabel("No active downloads")
        self.download_layout.addWidget(self.download_status_label)
        self.download_layout.addStretch()
        hide_dl_btn = QPushButton("Dismiss")
        hide_dl_btn.clicked.connect(lambda: self.download_bar.setVisible(False))
        self.download_layout.addWidget(hide_dl_btn)
        self.download_bar.setVisible(False)
        root_layout.addWidget(self.download_bar)

        self.setCentralWidget(central)

    def _make_tool_button(self, text: str, tooltip: str, handler) -> QToolButton:
        btn = QToolButton(self)
        btn.setText(text)
        btn.setToolTip(tooltip)
        btn.clicked.connect(handler)
        return btn

    def _build_main_menu(self) -> QMenu:
        menu = QMenu(self)

        new_tab_act = QAction("New Tab\tCtrl+T", self)
        new_tab_act.triggered.connect(lambda: self.add_new_tab("microweb://newtab", switch=True))
        menu.addAction(new_tab_act)

        incognito_act = QAction("New Incognito Window\tCtrl+Shift+N", self)
        incognito_act.triggered.connect(self.open_incognito_window)
        menu.addAction(incognito_act)

        menu.addSeparator()

        history_act = QAction("History\tCtrl+H", self)
        history_act.triggered.connect(lambda: self.add_new_tab("microweb://history", switch=True))
        menu.addAction(history_act)

        bookmarks_act = QAction("Bookmarks Manager", self)
        bookmarks_act.triggered.connect(lambda: self.add_new_tab("microweb://bookmarks", switch=True))
        menu.addAction(bookmarks_act)

        toggle_bm_act = QAction("Toggle Bookmarks Bar\tCtrl+Shift+B", self)
        toggle_bm_act.triggered.connect(self.toggle_bookmarks_bar)
        menu.addAction(toggle_bm_act)

        menu.addSeparator()

        find_act = QAction("Find in Page...\tCtrl+F", self)
        find_act.triggered.connect(self.show_find_bar)
        menu.addAction(find_act)

        zoom_in_act = QAction("Zoom In\tCtrl++", self)
        zoom_in_act.triggered.connect(lambda: self.adjust_zoom(0.1))
        menu.addAction(zoom_in_act)

        zoom_out_act = QAction("Zoom Out\tCtrl+-", self)
        zoom_out_act.triggered.connect(lambda: self.adjust_zoom(-0.1))
        menu.addAction(zoom_out_act)

        zoom_reset_act = QAction("Reset Zoom\tCtrl+0", self)
        zoom_reset_act.triggered.connect(lambda: self.set_zoom(1.0))
        menu.addAction(zoom_reset_act)

        menu.addSeparator()

        theme_act = QAction("Switch Light / Dark Theme", self)
        theme_act.triggered.connect(self.toggle_theme)
        menu.addAction(theme_act)

        devtools_act = QAction("Developer Tools\tF12", self)
        devtools_act.triggered.connect(self.toggle_devtools)
        menu.addAction(devtools_act)

        settings_act = QAction("Settings", self)
        settings_act.triggered.connect(lambda: self.add_new_tab("microweb://settings", switch=True))
        menu.addAction(settings_act)

        return menu

    def _register_shortcuts(self) -> None:
        QShortcut(QKeySequence("Ctrl+T"), self, lambda: self.add_new_tab("microweb://newtab", switch=True))
        QShortcut(QKeySequence("Ctrl+W"), self, lambda: self.close_tab(self.tabs.currentIndex()))
        QShortcut(QKeySequence("Ctrl+L"), self, self.focus_omnibox)
        QShortcut(QKeySequence("Ctrl+R"), self, self.reload_or_stop)
        QShortcut(QKeySequence("F5"), self, self.reload_or_stop)
        QShortcut(QKeySequence("Ctrl+F"), self, self.show_find_bar)
        QShortcut(QKeySequence("Escape"), self, self.hide_find_bar)
        QShortcut(QKeySequence("Ctrl+D"), self, self.toggle_current_bookmark)
        QShortcut(QKeySequence("Ctrl+H"), self, lambda: self.add_new_tab("microweb://history", switch=True))
        QShortcut(QKeySequence("Ctrl+Shift+B"), self, self.toggle_bookmarks_bar)
        QShortcut(QKeySequence("Ctrl+Shift+N"), self, self.open_incognito_window)
        QShortcut(QKeySequence("Ctrl+="), self, lambda: self.adjust_zoom(0.1))
        QShortcut(QKeySequence("Ctrl+-"), self, lambda: self.adjust_zoom(-0.1))
        QShortcut(QKeySequence("Ctrl+0"), self, lambda: self.set_zoom(1.0))
        QShortcut(QKeySequence("F12"), self, self.toggle_devtools)

    def _apply_theme(self) -> None:
        theme = self.settings_data.get("theme", "light")
        self.setStyleSheet(build_stylesheet(theme, self.incognito))

    def toggle_theme(self) -> None:
        current = self.settings_data.get("theme", "light")
        self.settings_data["theme"] = "dark" if current == "light" else "light"
        save_json(SETTINGS_FILE, self.settings_data)
        self._apply_theme()

    def current_view(self) -> Optional[QWebEngineView]:
        widget = self.tabs.currentWidget()
        return widget if isinstance(widget, QWebEngineView) else None

    def add_new_tab(self, url_str: str = "microweb://newtab", switch: bool = True) -> QWebEngineView:
        view = QWebEngineView(self)
        page = MicroWebPage(self.profile, self)
        view.setPage(page)

        settings = view.settings()
        settings.setAttribute(QWebEngineSettings.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
        settings.setAttribute(QWebEngineSettings.FullScreenSupportEnabled, True)
        settings.setAttribute(QWebEngineSettings.PluginsEnabled, True)

        index = self.tabs.addTab(view, "New Tab")
        if switch:
            self.tabs.setCurrentIndex(index)

        view.titleChanged.connect(lambda title, v=view: self._on_view_title_changed(v, title))
        view.iconChanged.connect(lambda icon, v=view: self._on_view_icon_changed(v, icon))
        view.urlChanged.connect(lambda qurl, v=view: self._on_view_url_changed(v, qurl))
        view.loadStarted.connect(lambda v=view: self._on_load_started(v))
        view.loadFinished.connect(lambda ok, v=view: self._on_load_finished(v, ok))

        self.load_url_in_view(view, url_str)
        return view

    def load_url_in_view(self, view: QWebEngineView, url_str: str) -> None:
        if url_str.startswith("microweb://"):
            self._render_internal_page(view, url_str)
            return
        view.setUrl(QUrl(url_str))

    def _render_internal_page(self, view: QWebEngineView, uri: str) -> None:
        theme = self.settings_data.get("theme", "light")
        is_dark = self.incognito or theme == "dark"
        bg = "#1e222a" if self.incognito else ("#202124" if is_dark else "#f8fafc")
        card = "#282c34" if self.incognito else ("#292a2d" if is_dark else "#ffffff")
        text = "#f1f5f9" if is_dark else "#0f172a"
        muted = "#94a3b8" if is_dark else "#64748b"
        border = "#3a404d" if is_dark else "#e2e8f0"
        accent = "#60a5fa" if is_dark else "#2563eb"

        route = uri.replace("microweb://", "").strip("/").lower()
        body_html = ""
        title = "MicroWeb"

        if route == "history":
            title = "History — MicroWeb"
            rows = "".join(
                f"<tr><td class='time'>{html.escape(item.get('time', ''))}</td>"
                f"<td><a href='{html.escape(item.get('url', ''))}'>{html.escape(item.get('title', item.get('url', '')))}</a>"
                f"<div class='sub'>{html.escape(item.get('url', ''))}</div></td></tr>"
                for item in reversed(self.history[-100:])
            )
            if not rows:
                rows = "<tr><td colspan='2' class='muted'>No browsing history recorded yet.</td></tr>"
            body_html = f"""
                <div class='wrap'>
                  <h1>Browsing History</h1>
                  <p class='muted'>Stored locally in {html.escape(str(HISTORY_FILE))}</p>
                  <table>{rows}</table>
                </div>
            """
        elif route == "bookmarks":
            title = "Bookmarks — MicroWeb"
            cards = "".join(
                f"<a class='bm-card' href='{html.escape(bm['url'])}'>"
                f"<strong>{html.escape(bm['title'])}</strong>"
                f"<span>{html.escape(bm['url'])}</span></a>"
                for bm in self.bookmarks
            )
            body_html = f"""
                <div class='wrap'>
                  <h1>Bookmarks</h1>
                  <p class='muted'>Click any bookmark to open it, or press Ctrl+D on any website to save it.</p>
                  <div class='grid'>{cards}</div>
                </div>
            """
        elif route == "settings":
            title = "Settings — MicroWeb"
            engine = SEARCH_ENGINES.get(self.settings_data.get("search_engine", "duckduckgo"), SEARCH_ENGINES["duckduckgo"])["label"]
            body_html = f"""
                <div class='wrap'>
                  <h1>MicroWeb Settings</h1>
                  <div class='panel'>
                    <div><strong>Version:</strong> {APP_VERSION} (PyQt5 + Chromium WebEngine)</div>
                    <div><strong>Theme:</strong> {html.escape(theme.title())} (Use the menu to switch)</div>
                    <div><strong>Default Search Engine:</strong> {html.escape(engine)}</div>
                    <div><strong>Config Directory:</strong> {html.escape(str(DATA_DIR))}</div>
                  </div>
                </div>
            """
        else:
            title = "New Tab — MicroWeb"
            engine_key = self.settings_data.get("search_engine", "duckduckgo")
            engine_template = SEARCH_ENGINES.get(engine_key, SEARCH_ENGINES["duckduckgo"])["template"]
            shortcuts = "".join(
                f"<a class='tile' href='{html.escape(bm['url'])}'>"
                f"<div class='tile-icon'>{html.escape(bm['title'][:1].upper())}</div>"
                f"<div class='tile-title'>{html.escape(bm['title'])}</div></a>"
                for bm in self.bookmarks[:8]
            )
            incognito_note = "<p class='incognito-note'>Incognito mode is active. History and cookies are not saved to disk.</p>" if self.incognito else ""
            body_html = f"""
                <div class='newtab'>
                  <div class='brand'>MicroWeb</div>
                  {incognito_note}
                  <form class='search-box' onsubmit="event.preventDefault(); const q = document.getElementById('q').value.trim(); if (!q) return; if (q.includes('.') && !q.includes(' ')) {{ window.location.href = q.startsWith('http') ? q : 'https://' + q; }} else {{ window.location.href = '{engine_template}'.replace('{{query}}', encodeURIComponent(q)); }}">
                    <input id='q' type='text' placeholder='Search the web or type a URL' autofocus />
                    <button type='submit'>Go</button>
                  </form>
                  <div class='tiles'>{shortcuts}</div>
                </div>
            """

        page_html = f"""<!doctype html>
<html>
<head>
  <meta charset='utf-8' />
  <title>{html.escape(title)}</title>
  <style>
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: {bg}; color: {text}; }}
    a {{ color: {accent}; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    .wrap {{ max-width: 820px; margin: 48px auto; padding: 0 24px; }}
    .muted {{ color: {muted}; font-size: 14px; }}
    .newtab {{ min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }}
    .brand {{ font-size: 48px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 18px; }}
    .incognito-note {{ color: #93c5fd; font-size: 13px; margin-bottom: 18px; }}
    .search-box {{ display: flex; width: 100%; max-width: 580px; background: {card}; border: 1px solid {border}; border-radius: 26px; padding: 6px 10px 6px 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }}
    .search-box input {{ flex: 1; border: none; outline: none; background: transparent; color: {text}; font-size: 15px; }}
    .search-box button {{ background: {accent}; color: #fff; border: none; border-radius: 18px; padding: 8px 18px; font-weight: 600; cursor: pointer; }}
    .tiles {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 34px; max-width: 640px; }}
    .tile {{ width: 96px; padding: 14px 8px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: {text}; background: {card}; border: 1px solid {border}; }}
    .tile:hover {{ text-decoration: none; border-color: {accent}; }}
    .tile-icon {{ width: 38px; height: 38px; border-radius: 10px; background: {accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }}
    .tile-title {{ font-size: 12px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 84px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 20px; background: {card}; border: 1px solid {border}; border-radius: 10px; overflow: hidden; }}
    td {{ padding: 12px 14px; border-bottom: 1px solid {border}; vertical-align: top; font-size: 14px; }}
    .time {{ width: 150px; color: {muted}; font-size: 12px; }}
    .sub {{ color: {muted}; font-size: 12px; margin-top: 2px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 20px; }}
    .bm-card {{ display: flex; flex-direction: column; gap: 4px; padding: 14px; background: {card}; border: 1px solid {border}; border-radius: 10px; color: {text}; }}
    .bm-card span {{ color: {muted}; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    .panel {{ background: {card}; border: 1px solid {border}; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }}
  </style>
</head>
<body>{body_html}</body>
</html>"""
        view.setProperty("virtual_url", uri)
        view.setHtml(page_html, QUrl(uri))
        if view is self.current_view():
            self.omnibox.setText(uri)
            self._update_bookmark_star(uri)

    def close_tab(self, index: int) -> None:
        if self.tabs.count() <= 1:
            self.close()
            return
        widget = self.tabs.widget(index)
        self.tabs.removeTab(index)
        if widget is not None:
            widget.deleteLater()

    def on_tab_changed(self, _index: int) -> None:
        view = self.current_view()
        if view is None:
            return
        url_str = view.property("virtual_url") or view.url().toString()
        self.omnibox.setText(url_str)
        self._update_nav_buttons(view)
        self._update_bookmark_star(url_str)
        self.zoom_label.setText(f"{round(view.zoomFactor() * 100)}%")

    def _on_view_title_changed(self, view: QWebEngineView, title: str) -> None:
        idx = self.tabs.indexOf(view)
        if idx >= 0:
            short = (title or "New Tab")[:28]
            self.tabs.setTabText(idx, short)
            self.tabs.setTabToolTip(idx, title)

    def _on_view_icon_changed(self, view: QWebEngineView, icon: QIcon) -> None:
        idx = self.tabs.indexOf(view)
        if idx >= 0:
            self.tabs.setTabIcon(idx, icon)

    def _on_view_url_changed(self, view: QWebEngineView, qurl: QUrl) -> None:
        url_str = qurl.toString()
        if not url_str.startswith("microweb://"):
            view.setProperty("virtual_url", None)
        display_url = view.property("virtual_url") or url_str
        if view is self.current_view():
            self.omnibox.setText(display_url)
            self._update_nav_buttons(view)
            self._update_bookmark_star(display_url)

    def _on_load_started(self, view: QWebEngineView) -> None:
        if view is self.current_view():
            self.reload_btn.setText("✕")
            self.reload_btn.setProperty("loading", True)

    def _on_load_finished(self, view: QWebEngineView, ok: bool) -> None:
        if view is self.current_view():
            self.reload_btn.setText("↻")
            self.reload_btn.setProperty("loading", False)
            self._update_nav_buttons(view)

        url_str = view.property("virtual_url") or view.url().toString()
        if ok and not self.incognito and url_str.startswith(("http://", "https://")):
            self.history.append({
                "title": view.title() or url_str,
                "url": url_str,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
            })
            self.history = self.history[-500:]
            save_json(HISTORY_FILE, self.history)

    def _update_nav_buttons(self, view: QWebEngineView) -> None:
        self.back_btn.setEnabled(view.history().canGoBack())
        self.forward_btn.setEnabled(view.history().canGoForward())

    def navigate_from_omnibox(self) -> None:
        view = self.current_view()
        if view is None:
            return
        target = normalize_input_to_url(
            self.omnibox.text(),
            self.settings_data.get("search_engine", "duckduckgo"),
        )
        self.load_url_in_view(view, target)

    def go_back(self) -> None:
        view = self.current_view()
        if view is not None:
            view.back()

    def go_forward(self) -> None:
        view = self.current_view()
        if view is not None:
            view.forward()

    def reload_or_stop(self) -> None:
        view = self.current_view()
        if view is None:
            return
        if self.reload_btn.property("loading"):
            view.stop()
        else:
            virtual_url = view.property("virtual_url")
            if virtual_url:
                self._render_internal_page(view, virtual_url)
            else:
                view.reload()

    def go_home(self) -> None:
        view = self.current_view()
        if view is not None:
            self.load_url_in_view(view, self.settings_data.get("home_url", "microweb://newtab"))

    def focus_omnibox(self) -> None:
        self.omnibox.setFocus()
        self.omnibox.selectAll()

    def _is_bookmarked(self, url_str: str) -> bool:
        return any(bm["url"] == url_str for bm in self.bookmarks)

    def _update_bookmark_star(self, url_str: str) -> None:
        self.bookmark_star_btn.setText("★" if self._is_bookmarked(url_str) else "☆")

    def toggle_current_bookmark(self) -> None:
        view = self.current_view()
        if view is None:
            return
        url_str = view.property("virtual_url") or view.url().toString()
        if not url_str or url_str.startswith("microweb://"):
            return
        if self._is_bookmarked(url_str):
            self.bookmarks = [bm for bm in self.bookmarks if bm["url"] != url_str]
        else:
            parsed = urlparse(url_str)
            title = view.title() or parsed.netloc or url_str
            self.bookmarks.append({"title": title[:32], "url": url_str})
        save_json(BOOKMARKS_FILE, self.bookmarks)
        self._update_bookmark_star(url_str)
        self._rebuild_bookmarks_bar()

    def _rebuild_bookmarks_bar(self) -> None:
        self.bookmarks_bar.clear()
        for bm in self.bookmarks:
            btn = QToolButton(self)
            btn.setText(bm["title"])
            btn.setToolTip(bm["url"])
            btn.clicked.connect(lambda _checked=False, u=bm["url"]: self._open_bookmark(u))
            self.bookmarks_bar.addWidget(btn)

    def _open_bookmark(self, url_str: str) -> None:
        view = self.current_view()
        if view is not None:
            self.load_url_in_view(view, url_str)

    def toggle_bookmarks_bar(self) -> None:
        visible = not self.bookmarks_bar.isVisible()
        self.bookmarks_bar.setVisible(visible)
        self.settings_data["show_bookmarks_bar"] = visible
        save_json(SETTINGS_FILE, self.settings_data)

    def adjust_zoom(self, delta: float) -> None:
        view = self.current_view()
        if view is not None:
            factor = max(0.25, min(3.0, view.zoomFactor() + delta))
            self.set_zoom(factor)

    def set_zoom(self, factor: float) -> None:
        view = self.current_view()
        if view is not None:
            view.setZoomFactor(factor)
            self.zoom_label.setText(f"{round(factor * 100)}%")

    def show_find_bar(self) -> None:
        self.find_bar.setVisible(True)
        self.find_input.setFocus()
        self.find_input.selectAll()

    def hide_find_bar(self) -> None:
        self.find_bar.setVisible(False)
        view = self.current_view()
        if view is not None:
            view.findText("")

    def find_in_page(self, text: str, backward: bool = False) -> None:
        view = self.current_view()
        if view is not None:
            flags = QWebEnginePage.FindBackward if backward else QWebEnginePage.FindFlags()
            view.findText(text, flags)

    def toggle_devtools(self) -> None:
        view = self.current_view()
        if view is None:
            return
        if self.devtools_dock is None:
            self.devtools_dock = QDockWidget("MicroWeb DevTools", self)
            self.devtools_view = QWebEngineView(self.devtools_dock)
            self.devtools_dock.setWidget(self.devtools_view)
            self.addDockWidget(Qt.BottomDockWidgetArea, self.devtools_dock)
        else:
            self.devtools_dock.setVisible(not self.devtools_dock.isVisible())

        if self.devtools_view is not None and self.devtools_dock.isVisible():
            view.page().setDevToolsPage(self.devtools_view.page())

    def open_incognito_window(self) -> None:
        win = MicroWebWindow(incognito=True)
        win.show()
        app = QApplication.instance()
        if app is not None:
            windows = getattr(app, "_windows", [])
            windows.append(win)
            setattr(app, "_windows", windows)

    def handle_download_requested(self, download: QWebEngineDownloadItem) -> None:
        suggested = download.suggestedFileName() or "download"
        default_path = str(Path.home() / "Downloads" / suggested)
        dest, _ = QFileDialog.getSaveFileName(self, "Save File", default_path)
        if not dest:
            download.cancel()
            return

        dest_path = Path(dest)
        download.setDownloadDirectory(str(dest_path.parent))
        download.setDownloadFileName(dest_path.name)
        download.accept()

        self.download_bar.setVisible(True)
        self.download_status_label.setText(f"Downloading {dest_path.name}...")
        download.downloadProgress.connect(
            lambda received, _total: self.download_status_label.setText(
                f"Downloading {dest_path.name} ({received // 1024} KB)"
            )
        )
        download.finished.connect(
            lambda: self.download_status_label.setText(f"Saved: {dest_path}")
        )


def main() -> int:
    os.environ.setdefault("QT_AUTO_SCREEN_SCALE_FACTOR", "1")
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setApplicationVersion(APP_VERSION)

    main_win = MicroWebWindow(incognito=False)
    main_win.show()
    setattr(app, "_windows", [main_win])
    return app.exec_()


if __name__ == "__main__":
    sys.exit(main())
