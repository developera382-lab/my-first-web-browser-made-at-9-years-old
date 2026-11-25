import React, { useState } from 'react';
import { Download, Monitor, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isWindows7, install } =
    usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install MicroWeb</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>{isIOS ? 'Install on iOS' : 'Install for Win 7'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-xl text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {isIOS
                    ? 'Install MicroWeb on iPhone / iPad'
                    : 'Install MicroWeb on Windows 7'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isWindows7
                    ? 'Windows 7 detected — follow these steps to run MicroWeb as a standalone window.'
                    : 'Run MicroWeb as a standalone desktop window with offline support.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>
                  Tap the <strong>Share</strong> button in the Safari toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> to launch MicroWeb full-screen.
                </li>
              </ol>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  Open this MicroWeb app directly in{' '}
                  <strong className="text-slate-900 dark:text-white">
                    Chrome 109, Edge 109, or Supermium
                  </strong>{' '}
                  on Windows 7 (outside an embedded preview frame):
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>
                    Click the <strong>Install</strong> icon in the right side of
                    the browser address bar, or open the{' '}
                    <strong>⋮ Menu → Save and share → Install MicroWeb</strong>{' '}
                    (or <strong>More tools → Create shortcut</strong> with{' '}
                    <strong>Open as window</strong> checked).
                  </li>
                  <li>
                    Right-click the MicroWeb icon on your Windows 7 taskbar and
                    choose <strong>Pin this program to taskbar</strong>.
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
