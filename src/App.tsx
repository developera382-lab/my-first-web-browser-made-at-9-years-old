import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { LiveBrowser } from './components/LiveBrowser';
import { PythonSourceStudio } from './components/PythonSourceStudio';
import { BuildExeGuide } from './components/BuildExeGuide';
import { OfflineIndicator } from './components/OfflineIndicator';
import { downloadProjectZip } from './data/pythonFiles';
import type { BrowserSettings } from './types/browser';

type AppView = 'browser' | 'python' | 'build';

const SETTINGS_STORAGE_KEY = 'microweb_settings_v1';

const INITIAL_SETTINGS: BrowserSettings = {
  theme: 'light',
  searchEngine: 'duckduckgo',
  showBookmarksBar: true,
  homeUrl: 'microweb://newtab',
};

function loadSettings(): BrowserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return INITIAL_SETTINGS;
    return {
      ...INITIAL_SETTINGS,
      ...(JSON.parse(raw) as Partial<BrowserSettings>),
    };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('browser');
  const [settings, setSettings] = useState<BrowserSettings>(loadSettings);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage quota errors ignored
    }
  }, [settings]);

  const handleUpdateSettings = (next: Partial<BrowserSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  };

  const handleResetSettings = () => {
    setSettings(INITIAL_SETTINGS);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      await downloadProjectZip();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between gap-8 shrink-0">
        <a
          href="#browser"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('browser');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          MicroWeb
        </a>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveView('browser')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'browser'
                ? 'border-blue-600 text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Browser PWA
          </button>
          <button
            type="button"
            onClick={() => setActiveView('python')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'python'
                ? 'border-blue-600 text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Python (.py)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('build')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'build'
                ? 'border-blue-600 text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Build .EXE
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Packaging...' : 'Download .PY (.zip)'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col">
        {activeView === 'browser' && (
          <LiveBrowser
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
          />
        )}
        {activeView === 'python' && (
          <PythonSourceStudio onDownloadZip={handleDownloadZip} />
        )}
        {activeView === 'build' && (
          <BuildExeGuide
            onDownloadZip={handleDownloadZip}
            onOpenSource={() => setActiveView('python')}
          />
        )}
      </main>

      <OfflineIndicator />
    </div>
  );
}
