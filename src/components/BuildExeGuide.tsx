import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Download } from 'lucide-react';

interface BuildExeGuideProps {
  onDownloadZip: () => void;
  onOpenSource: () => void;
}

const TROUBLESHOOTING = [
  {
    issue: 'Make sure hidden .github folder is uploaded to GitHub',
    fix: 'When uploading extracted files via GitHub web UI, drag the .github folder along with microweb.py, requirements.txt, and microweb.spec so GitHub detects the Actions workflow.',
  },
  {
    issue: 'Windows 7 compatibility with Python 3.8 + PyQt5',
    fix: 'The GitHub Actions workflow uses Python 3.8 and PyQt5 + PyQtWebEngine (Qt 5.15) specifically so the compiled MicroWeb.exe runs on Windows 7 as well as Windows 10/11.',
  },
  {
    issue: 'Windows SmartScreen warning on unsigned .exe',
    fix: 'Unsigned builds downloaded from GitHub Actions may show a SmartScreen prompt; click More info and Run anyway.',
  },
];

export const BuildExeGuide: React.FC<BuildExeGuideProps> = ({
  onDownloadZip,
  onOpenSource,
}) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyCommand = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedStep(id);
      setTimeout(() => setCopiedStep(null), 1800);
    } catch {
      // Clipboard ignored if blocked
    }
  };

  const githubSteps = [
    {
      id: 'gh-1',
      title: '01. Download and Extract microweb-github-exe.zip',
      description:
        'Click Download .PY (.zip) to get microweb.py, microweb.spec, requirements.txt, and .github/workflows/build-microweb-exe.yml ready for GitHub.',
    },
    {
      id: 'gh-2',
      title: '02. Push or Upload the Extracted Files to a GitHub Repository',
      description:
        'Create a new repository on GitHub and push (or upload) all extracted files, including the .github folder.',
      command: 'git init && git add . && git commit -m "Add MicroWeb" && git push -u origin main',
    },
    {
      id: 'gh-3',
      title: '03. Download MicroWeb.exe from GitHub Actions',
      description:
        'Open the Actions tab in your GitHub repo, select Build MicroWeb.exe (click Run workflow if needed), wait for the Windows build to finish, and download the MicroWeb-Windows-exe artifact.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-zinc-800">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Build MicroWeb.exe on GitHub Actions (No Python Required)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              GitHub Actions compiles microweb.py and the Chromium WebEngine into a Windows 7-compatible MicroWeb.exe in the cloud so you only have to download the finished artifact.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSource}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Inspect Workflow & Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download GitHub Bundle (.zip)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {githubSteps.map((step) => (
            <div
              key={step.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3"
            >
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {step.description}
                </p>
              </div>
              {step.command && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                  <code className="font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-nowrap">
                    {step.command}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyCommand(step.id, step.command!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {copiedStep === step.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Cloud Build & Windows 7 Notes
            </h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-zinc-800">
            {TROUBLESHOOTING.map((item) => (
              <div key={item.issue} className="px-5 py-4 space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.issue}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
