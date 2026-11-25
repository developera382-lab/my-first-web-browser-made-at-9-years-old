import React, { useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  Globe,
  History,
  Lock,
  Monitor,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
} from 'lucide-react';
import type {
  BookmarkItem,
  BrowserSettings,
  HistoryItem,
  SearchEngineKey,
} from '../types/browser';

interface BrowserViewportProps {
  url: string;
  zoom: number;
  incognito: boolean;
  findQuery: string;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  settings: BrowserSettings;
  onNavigate: (urlOrQuery: string) => void;
  onAddBookmark: (title: string, url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onClearHistory: () => void;
  onResetBrowserData: () => void;
  onUpdateSettings: (next: Partial<BrowserSettings>) => void;
  onIframeLoad: () => void;
}

const SEARCH_ENGINE_OPTIONS: {
  key: SearchEngineKey;
  label: string;
  domain: string;
}[] = [
  { key: 'duckduckgo', label: 'DuckDuckGo', domain: 'duckduckgo.com' },
  { key: 'google', label: 'Google', domain: 'google.com' },
  { key: 'bing', label: 'Bing', domain: 'bing.com' },
];

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  url,
  zoom,
  incognito,
  findQuery,
  bookmarks,
  history,
  settings,
  onNavigate,
  onAddBookmark,
  onRemoveBookmark,
  onClearHistory,
  onResetBrowserData,
  onUpdateSettings,
  onIframeLoad,
}) => {
  const [newTabInput, setNewTabInput] = useState('');
  const [historyFilter, setHistoryFilter] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkUrl, setBookmarkUrl] = useState('');

  const highlightText = (text: string): React.ReactNode => {
    const q = findQuery.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={idx}
          className="bg-amber-300 text-slate-900 rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      ),
    );
  };

  const scaleStyle: React.CSSProperties =
    zoom !== 1
      ? {
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
        }
      : {};

  if (url === 'microweb://newtab') {
    return (
      <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-slate-100">
        <div
          style={scaleStyle}
          className="min-h-full flex flex-col items-center justify-center px-6 py-12"
        >
          <div className="w-full max-w-xl flex flex-col items-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              {highlightText('MicroWeb')}
            </h1>

            {incognito ? (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-7">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {highlightText(
                    'Incognito mode is active. History is not recorded in this window.',
                  )}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 text-center">
                {highlightText(
                  'Chrome-style Progressive Web App browser with offline support for Windows 7 and desktop.',
                )}
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTabInput.trim()) {
                  onNavigate(newTabInput);
                  setNewTabInput('');
                }
              }}
              className="w-full flex items-center gap-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-4 py-2.5 shadow-xs focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={newTabInput}
                onChange={(e) => setNewTabInput(e.target.value)}
                placeholder="Search the web or enter a URL (e.g. microweb://win7)"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Go
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-8">
              {bookmarks.slice(0, 8).map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => onNavigate(bm.url)}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-display font-semibold text-sm transition-colors">
                    {bm.title.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate w-full">
                    {highlightText(bm.title)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-zinc-800 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate('microweb://win7')}
                className="hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
              >
                Windows 7 PWA Setup
              </button>
              <button
                type="button"
                onClick={() => onNavigate('microweb://history')}
                className="hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => onNavigate('microweb://bookmarks')}
                className="hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
              >
                Bookmarks
              </button>
              <button
                type="button"
                onClick={() => onNavigate('microweb://settings')}
                className="hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (url === 'microweb://history') {
    const filtered = history.filter(
      (item) =>
        item.title.toLowerCase().includes(historyFilter.toLowerCase()) ||
        item.url.toLowerCase().includes(historyFilter.toLowerCase()),
    );

    return (
      <div className="h-full w-full overflow-y-auto bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100">
        <div style={scaleStyle} className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>{highlightText('Browsing History')}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                {history.length} saved{' '}
                {history.length === 1 ? 'visit' : 'visits'} stored offline in
                this PWA
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Filter history..."
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={onClearHistory}
                disabled={history.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {history.length === 0
                  ? 'No browsing history recorded yet.'
                  : 'No history entries match your filter.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Open any bookmark or enter a URL in the address bar to record
                visits.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-800 mt-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(item.url)}
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left cursor-pointer"
                    >
                      {highlightText(item.title)}
                    </button>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {highlightText(item.url)}
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                    {item.visitedAt}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (url === 'microweb://bookmarks') {
    return (
      <div className="h-full w-full overflow-y-auto bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100">
        <div style={scaleStyle} className="max-w-4xl mx-auto px-6 py-10">
          <div className="pb-6 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
              <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{highlightText('Bookmarks Manager')}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Saved locally in your MicroWeb PWA across restarts.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!bookmarkTitle.trim() || !bookmarkUrl.trim()) return;
              const normalized =
                bookmarkUrl.startsWith('http') ||
                bookmarkUrl.startsWith('microweb://')
                  ? bookmarkUrl.trim()
                  : `https://${bookmarkUrl.trim()}`;
              onAddBookmark(bookmarkTitle.trim(), normalized);
              setBookmarkTitle('');
              setBookmarkUrl('');
            }}
            className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 pb-6 border-b border-slate-200 dark:border-zinc-800"
          >
            <input
              type="text"
              value={bookmarkTitle}
              onChange={(e) => setBookmarkTitle(e.target.value)}
              placeholder="Bookmark title"
              className="sm:col-span-4 px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-600"
            />
            <input
              type="text"
              value={bookmarkUrl}
              onChange={(e) => setBookmarkUrl(e.target.value)}
              placeholder="https://example.com"
              className="sm:col-span-6 px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {bookmarks.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              No bookmarks saved yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-800 mt-2">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(bm.url)}
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left cursor-pointer"
                    >
                      {highlightText(bm.title)}
                    </button>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {highlightText(bm.url)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveBookmark(bm.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (url === 'microweb://settings') {
    return (
      <div className="h-full w-full overflow-y-auto bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100">
        <div style={scaleStyle} className="max-w-3xl mx-auto px-6 py-10 space-y-8">
          <div className="pb-6 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{highlightText('MicroWeb Settings')}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customize appearance, search engine, and offline PWA data.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Theme</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Switch between Chrome-inspired light and dark surfaces.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Search Engine</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Used when typing search terms into the address bar.
                </p>
              </div>
              <select
                value={settings.searchEngine}
                onChange={(e) =>
                  onUpdateSettings({
                    searchEngine: e.target.value as SearchEngineKey,
                  })
                }
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-600"
              >
                {SEARCH_ENGINE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} ({opt.domain})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Bookmarks Bar</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Display saved bookmarks directly below the address bar.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    showBookmarksBar: !settings.showBookmarksBar,
                  })
                }
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  settings.showBookmarksBar
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {settings.showBookmarksBar ? 'Visible' : 'Hidden'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Reset Browser Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Restore default bookmarks, clear history, and reset preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetBrowserData}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (url === 'microweb://win7') {
    return (
      <div className="h-full w-full overflow-y-auto bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100">
        <div style={scaleStyle} className="max-w-3xl mx-auto px-6 py-10 space-y-6">
          <div className="pb-6 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{highlightText('Installing MicroWeb PWA on Windows 7')}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Standalone Desktop Window · Offline Service Worker · Taskbar Pinning
            </p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              {highlightText(
                'MicroWeb is configured with a standard Web App Manifest and Workbox offline service worker so it can be installed directly as a standalone desktop window on Windows 7 without needing an .exe installer.',
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  01. Compatible Windows 7 Browsers
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Works on Google Chrome 109, Microsoft Edge 109, or actively updated Chromium builds for Windows 7 such as Supermium and Thorium.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  02. Install as a Desktop Window
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Click the Install MicroWeb button in the tab bar, or open ⋮ Menu → More tools → Create shortcut and check Open as window.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  03. Pin to Windows 7 Taskbar
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Once MicroWeb opens in its own window, right-click its icon in the Windows 7 taskbar and select Pin this program to taskbar.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  04. Offline Persistence
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  The app shell, Start Page, History, Bookmarks, and Settings are cached locally and keep working even when your PC is offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-50 dark:bg-zinc-800/70 border-b border-slate-200 dark:border-zinc-700/80 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          {url.startsWith('https://') ? (
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate font-mono">{url}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 font-medium"
        >
          <span>Open in New Window</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex-1 relative overflow-hidden bg-white">
        <iframe
          key={url}
          src={url}
          title={url}
          onLoad={onIframeLoad}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="w-full h-full border-0"
          style={
            zoom !== 1
              ? {
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};
