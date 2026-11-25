import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Globe,
  History,
  Home,
  Lock,
  Monitor,
  Moon,
  MoreVertical,
  Plus,
  RotateCw,
  Search,
  Settings,
  Shield,
  Star,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  BookmarkItem,
  BrowserSettings,
  BrowserTab,
  HistoryItem,
  SearchEngineKey,
} from '../types/browser';
import { BrowserViewport } from './BrowserViewport';
import { PWAInstallButton } from './PWAInstallButton';

interface LiveBrowserProps {
  settings: BrowserSettings;
  onUpdateSettings: (next: Partial<BrowserSettings>) => void;
  onResetSettings: () => void;
}

const BOOKMARKS_STORAGE_KEY = 'microweb_bookmarks_v1';
const HISTORY_STORAGE_KEY = 'microweb_history_v1';

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'bm-1', title: 'Win 7 PWA Setup', url: 'microweb://win7' },
  {
    id: 'bm-2',
    title: 'Wikipedia',
    url: 'https://en.m.wikipedia.org/wiki/Windows_7',
  },
  { id: 'bm-3', title: 'Example.com', url: 'https://example.com' },
  {
    id: 'bm-4',
    title: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/export/embed.html',
  },
  { id: 'bm-5', title: 'History', url: 'microweb://history' },
  { id: 'bm-6', title: 'Settings', url: 'microweb://settings' },
];

const SEARCH_TEMPLATES: Record<SearchEngineKey, string> = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
};

function deriveTitle(url: string): string {
  if (url === 'microweb://newtab') return 'New Tab';
  if (url === 'microweb://history') return 'History';
  if (url === 'microweb://bookmarks') return 'Bookmarks';
  if (url === 'microweb://settings') return 'Settings';
  if (url === 'microweb://win7') return 'Windows 7 PWA Setup';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normalizeUrlInput(raw: string, engine: SearchEngineKey): string {
  const text = raw.trim();
  if (!text) return 'microweb://newtab';
  if (text.startsWith('microweb://')) return text.toLowerCase();
  if (text.startsWith('http://') || text.startsWith('https://')) return text;
  if (!text.includes(' ') && /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(text)) {
    return `https://${text}`;
  }
  return `${SEARCH_TEMPLATES[engine]}${encodeURIComponent(text)}`;
}

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const LiveBrowser: React.FC<LiveBrowserProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [incognito, setIncognito] = useState(false);
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'New Tab',
      url: 'microweb://newtab',
      historyStack: ['microweb://newtab'],
      historyIndex: 0,
      zoom: 1,
      isLoading: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [omniboxValue, setOmniboxValue] = useState('microweb://newtab');
  const [omniboxFocused, setOmniboxFocused] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    loadStored(BOOKMARKS_STORAGE_KEY, DEFAULT_BOOKMARKS),
  );
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    loadStored(HISTORY_STORAGE_KEY, []),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const omniboxRef = useRef<HTMLInputElement>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch {
      // Storage quota errors ignored
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage quota errors ignored
    }
  }, [history]);

  useEffect(() => {
    if (activeTab) {
      setOmniboxValue(activeTab.url);
    }
  }, [activeTab?.id, activeTab?.url]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const updateTab = (tabId: string, updater: (tab: BrowserTab) => BrowserTab) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? updater(t) : t)));
  };

  const navigateTab = (rawInput: string, targetTabId = activeTab.id) => {
    const resolvedUrl = normalizeUrlInput(rawInput, settings.searchEngine);
    const title = deriveTitle(resolvedUrl);
    const isExternal =
      resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://');

    updateTab(targetTabId, (tab) => {
      const nextStack = tab.historyStack.slice(0, tab.historyIndex + 1);
      nextStack.push(resolvedUrl);
      return {
        ...tab,
        url: resolvedUrl,
        title,
        historyStack: nextStack,
        historyIndex: nextStack.length - 1,
        isLoading: isExternal,
      };
    });

    if (!incognito && !resolvedUrl.startsWith('microweb://')) {
      const now = new Date();
      const stamp = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setHistory((prev) => [
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          url: resolvedUrl,
          visitedAt: stamp,
        },
        ...prev.slice(0, 199),
      ]);
    }
    setOmniboxFocused(false);
  };

  const createNewTab = (initialUrl = 'microweb://newtab') => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const nextTab: BrowserTab = {
      id,
      title: deriveTitle(initialUrl),
      url: initialUrl,
      historyStack: [initialUrl],
      historyIndex: 0,
      zoom: 1,
      isLoading: false,
    };
    setTabs((prev) => [...prev, nextTab]);
    setActiveTabId(id);
    setMenuOpen(false);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      navigateTab('microweb://newtab', tabId);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === tabId);
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);
    if (tabId === activeTabId) {
      const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
      setActiveTabId(fallback.id);
    }
  };

  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.historyStack.length - 1;

  const goBack = () => {
    if (!canGoBack) return;
    updateTab(activeTab.id, (tab) => {
      const nextIdx = tab.historyIndex - 1;
      const nextUrl = tab.historyStack[nextIdx];
      return {
        ...tab,
        historyIndex: nextIdx,
        url: nextUrl,
        title: deriveTitle(nextUrl),
      };
    });
  };

  const goForward = () => {
    if (!canGoForward) return;
    updateTab(activeTab.id, (tab) => {
      const nextIdx = tab.historyIndex + 1;
      const nextUrl = tab.historyStack[nextIdx];
      return {
        ...tab,
        historyIndex: nextIdx,
        url: nextUrl,
        title: deriveTitle(nextUrl),
      };
    });
  };

  const reloadTab = () => {
    const isExternal = activeTab.url.startsWith('http');
    if (isExternal) {
      updateTab(activeTab.id, (tab) => ({ ...tab, isLoading: true }));
      const current = activeTab.url;
      updateTab(activeTab.id, (tab) => ({ ...tab, url: 'microweb://newtab' }));
      requestAnimationFrame(() => {
        updateTab(activeTab.id, (tab) => ({
          ...tab,
          url: current,
          isLoading: false,
        }));
      });
    }
  };

  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  const toggleCurrentBookmark = () => {
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      setBookmarks((prev) => [
        ...prev,
        {
          id: `bm-${Date.now()}`,
          title: activeTab.title || deriveTitle(activeTab.url),
          url: activeTab.url,
        },
      ]);
    }
  };

  const adjustZoom = (delta: number) => {
    updateTab(activeTab.id, (tab) => ({
      ...tab,
      zoom: Number(Math.min(1.75, Math.max(0.6, tab.zoom + delta)).toFixed(2)),
    }));
  };

  const handleResetBrowserData = () => {
    setBookmarks(DEFAULT_BOOKMARKS);
    setHistory([]);
    onResetSettings();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        omniboxRef.current?.focus();
        omniboxRef.current?.select();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'b'
      ) {
        e.preventDefault();
        onUpdateSettings({ showBookmarksBar: !settings.showBookmarksBar });
      } else if (e.key === 'Escape') {
        setFindOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.showBookmarksBar, onUpdateSettings]);

  const suggestions = useMemo(() => {
    if (!omniboxFocused) return [];
    const q = omniboxValue.trim().toLowerCase();
    const combined = [
      ...bookmarks.map((b) => ({ title: b.title, url: b.url })),
      ...history.map((h) => ({ title: h.title, url: h.url })),
      { title: 'Windows 7 PWA Setup', url: 'microweb://win7' },
      { title: 'Browsing History', url: 'microweb://history' },
      { title: 'Bookmarks Manager', url: 'microweb://bookmarks' },
      { title: 'MicroWeb Settings', url: 'microweb://settings' },
    ];
    const seen = new Set<string>();
    return combined
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [omniboxFocused, omniboxValue, bookmarks, history]);

  const shellStripClass = incognito
    ? 'bg-slate-900 text-slate-200 border-slate-700'
    : 'bg-slate-200/80 dark:bg-zinc-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-800';

  const toolbarClass = incognito
    ? 'bg-slate-800 text-slate-100 border-slate-700'
    : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-zinc-800';

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Chrome-Style Tab Strip + PWA Install */}
      <div
        className={`flex items-end justify-between gap-3 px-3 pt-2 border-b ${shellStripClass}`}
      >
        <div className="flex items-end gap-1 flex-1 min-w-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs cursor-pointer min-w-[120px] max-w-[210px] transition-colors select-none ${
                  isActive
                    ? incognito
                      ? 'bg-slate-800 text-white font-medium'
                      : 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium'
                    : incognito
                      ? 'text-slate-400 hover:bg-slate-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1">{tab.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  aria-label={`Close ${tab.title}`}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => createNewTab('microweb://newtab')}
            title="New Tab"
            className="p-2 mb-0.5 rounded-lg hover:bg-slate-300/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pb-1.5 shrink-0">
          {incognito && (
            <button
              type="button"
              onClick={() => setIncognito(false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 border border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Exit Incognito</span>
            </button>
          )}
          <PWAInstallButton />
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${toolbarClass}`}
      >
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            title="Back"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-default"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            title="Forward"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-default"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reloadTab}
            title="Reload"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCw
              className={`w-4 h-4 ${activeTab.isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => navigateTab(settings.homeUrl)}
            title="Home"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox */}
        <div className="relative flex-1 min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTab(omniboxValue);
              omniboxRef.current?.blur();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
              incognito
                ? 'bg-slate-900 border-slate-700 focus-within:border-blue-400'
                : 'bg-slate-100 dark:bg-zinc-800 border-transparent focus-within:bg-white dark:focus-within:bg-zinc-950 focus-within:border-blue-600'
            }`}
          >
            {activeTab.url.startsWith('https://') ? (
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}

            <input
              ref={omniboxRef}
              type="text"
              value={omniboxValue}
              onFocus={(e) => {
                setOmniboxFocused(true);
                e.currentTarget.select();
              }}
              onBlur={() => {
                setTimeout(() => setOmniboxFocused(false), 140);
              }}
              onChange={(e) => setOmniboxValue(e.target.value)}
              placeholder="Search or enter web address"
              className="flex-1 bg-transparent font-mono text-[13px] focus:outline-none min-w-0"
            />

            <button
              type="button"
              onClick={toggleCurrentBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
              className="p-1 rounded-full hover:bg-slate-200/70 dark:hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isBookmarked
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-400'
                }`}
              />
            </button>
          </form>

          {omniboxFocused && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden py-1">
              {suggestions.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateTab(item.url);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between gap-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[50%]">
                    {item.url}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeTab.zoom !== 1 && (
            <span className="text-xs font-mono tabular-nums px-2 text-slate-500 dark:text-slate-400">
              {Math.round(activeTab.zoom * 100)}%
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                theme: settings.theme === 'light' ? 'dark' : 'light',
              })
            }
            title="Switch Light / Dark Theme"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              title="Customize and control MicroWeb"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg py-1.5 text-xs text-slate-800 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => createNewTab('microweb://newtab')}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>New Tab</span>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncognito((v) => !v);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>
                    {incognito ? 'Exit Incognito' : 'Incognito Mode'}
                  </span>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={() => {
                    navigateTab('microweb://history');
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>History</span>
                  <History className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigateTab('microweb://bookmarks');
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Bookmarks Manager</span>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({
                      showBookmarksBar: !settings.showBookmarksBar,
                    });
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>
                    {settings.showBookmarksBar
                      ? 'Hide Bookmarks Bar'
                      : 'Show Bookmarks Bar'}
                  </span>
                  <span className="font-mono text-slate-400">Ctrl+Shift+B</span>
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-zinc-800" />
                <div className="px-3.5 py-1.5 flex items-center justify-between">
                  <span>Zoom</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustZoom(-0.1)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono tabular-nums w-10 text-center">
                      {Math.round(activeTab.zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustZoom(0.1)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFindOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Find in Page</span>
                  <span className="font-mono text-slate-400">Ctrl+F</span>
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={() => {
                    navigateTab('microweb://win7');
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Windows 7 PWA Guide</span>
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigateTab('microweb://settings');
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Settings</span>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookmarks Bar */}
      {settings.showBookmarksBar && (
        <div
          className={`flex items-center gap-1 px-3 py-1.5 border-b overflow-x-auto ${toolbarClass}`}
        >
          {bookmarks.map((bm) => (
            <button
              key={bm.id}
              type="button"
              onClick={() => navigateTab(bm.url)}
              title={bm.url}
              className="px-2.5 py-1 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {bm.title}
            </button>
          ))}
        </div>
      )}

      {/* Find-in-Page Bar */}
      {findOpen && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Find text on MicroWeb pages..."
              className="w-60 px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setFindQuery((q) => q)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
              title="Previous match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFindQuery((q) => q)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
              title="Next match"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setFindOpen(false);
              setFindQuery('');
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        <BrowserViewport
          url={activeTab.url}
          zoom={activeTab.zoom}
          incognito={incognito}
          findQuery={findQuery}
          bookmarks={bookmarks}
          history={history}
          settings={settings}
          onNavigate={(nextUrl) => navigateTab(nextUrl)}
          onAddBookmark={(title, url) =>
            setBookmarks((prev) => [
              ...prev,
              { id: `bm-${Date.now()}`, title, url },
            ])
          }
          onRemoveBookmark={(id) =>
            setBookmarks((prev) => prev.filter((b) => b.id !== id))
          }
          onClearHistory={() => setHistory([])}
          onResetBrowserData={handleResetBrowserData}
          onUpdateSettings={onUpdateSettings}
          onIframeLoad={() =>
            updateTab(activeTab.id, (tab) => ({ ...tab, isLoading: false }))
          }
        />
      </div>
    </div>
  );
};
