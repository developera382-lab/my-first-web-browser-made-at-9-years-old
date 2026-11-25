import React, { useState } from 'react';
import { Check, Copy, Download, FileCode2, FileText, Terminal } from 'lucide-react';
import {
  PYTHON_PROJECT_FILES,
  downloadSingleFile,
  type PythonProjectFile,
} from '../data/pythonFiles';

interface PythonSourceStudioProps {
  onDownloadZip: () => void;
}

function getFileIcon(name: string) {
  if (name.endsWith('.py') || name.endsWith('.spec') || name.endsWith('.yml')) {
    return <FileCode2 className="w-4 h-4 shrink-0" />;
  }
  if (name.endsWith('.bat')) {
    return <Terminal className="w-4 h-4 shrink-0" />;
  }
  return <FileText className="w-4 h-4 shrink-0" />;
}

export const PythonSourceStudio: React.FC<PythonSourceStudioProps> = ({
  onDownloadZip,
}) => {
  const [selectedName, setSelectedName] = useState<string>('microweb.py');
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const selectedFile: PythonProjectFile =
    PYTHON_PROJECT_FILES.find((f) => f.name === selectedName) ??
    PYTHON_PROJECT_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopiedName(selectedFile.name);
      setTimeout(() => setCopiedName(null), 1800);
    } catch {
      // Clipboard ignored if blocked
    }
  };

  const lines = selectedFile.content.split('\n');

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 flex flex-col min-h-0">
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            MicroWeb Chromium (.py)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {PYTHON_PROJECT_FILES.length} files · PyQt5 WebEngine (Win 7+)
          </p>
        </div>

        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {PYTHON_PROJECT_FILES.map((file) => {
            const active = file.name === selectedFile.name;
            return (
              <button
                key={file.name}
                type="button"
                onClick={() => setSelectedName(file.name)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-start gap-2.5 ${
                  active
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                <span
                  className={
                    active
                      ? 'text-blue-600 dark:text-blue-400 mt-0.5'
                      : 'text-slate-400 mt-0.5'
                  }
                >
                  {getFileIcon(file.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium truncate">
                      {file.name}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                      {file.lines}L
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {file.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onDownloadZip}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (.zip)</span>
          </button>
        </div>
      </aside>

      <section className="lg:col-span-9 flex flex-col min-w-0 min-h-0">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {selectedFile.name}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">
              ·
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedFile.language}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">
              ·
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {selectedFile.lines} lines
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">
              ·
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {(selectedFile.sizeBytes / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedName === selectedFile.name ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadSingleFile(selectedFile)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selectedFile.name}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-zinc-950 font-mono text-[12.5px] leading-6">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-100/80 dark:hover:bg-zinc-900/70"
                >
                  <td className="select-none text-right pr-4 pl-4 text-slate-400 dark:text-zinc-600 tabular-nums w-12 align-top">
                    {idx + 1}
                  </td>
                  <td className="pr-6 text-slate-800 dark:text-slate-200 whitespace-pre">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
