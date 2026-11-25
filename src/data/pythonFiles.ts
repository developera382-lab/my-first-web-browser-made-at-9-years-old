import JSZip from 'jszip';

import microwebPy from '../../python/microweb.py?raw';
import requirementsTxt from '../../python/requirements.txt?raw';
import microwebSpec from '../../python/microweb.spec?raw';
import buildExeBat from '../../python/build_exe.bat?raw';
import readmeMd from '../../python/README.md?raw';
import githubWorkflowYml from '../../.github/workflows/build-microweb-exe.yml?raw';

export interface PythonProjectFile {
  name: string;
  zipPath: string;
  language: string;
  summary: string;
  content: string;
  lines: number;
  sizeBytes: number;
}

function makeFile(
  name: string,
  zipPath: string,
  language: string,
  summary: string,
  content: string,
): PythonProjectFile {
  return {
    name,
    zipPath,
    language,
    summary,
    content,
    lines: content.split('\n').length,
    sizeBytes: new Blob([content]).size,
  };
}

export const PYTHON_PROJECT_FILES: PythonProjectFile[] = [
  makeFile(
    'microweb.py',
    'microweb.py',
    'Python',
    'Windows 7-compatible PyQt5 + Chromium WebEngine browser',
    microwebPy,
  ),
  makeFile(
    '.github/workflows/build-microweb-exe.yml',
    '.github/workflows/build-microweb-exe.yml',
    'YAML',
    'GitHub Actions cloud workflow that compiles MicroWeb.exe',
    githubWorkflowYml,
  ),
  makeFile(
    'requirements.txt',
    'requirements.txt',
    'Text',
    'PyQt5, PyQtWebEngine (Chromium), and PyInstaller dependencies',
    requirementsTxt,
  ),
  makeFile(
    'microweb.spec',
    'microweb.spec',
    'Python',
    'PyInstaller build specification for MicroWeb.exe',
    microwebSpec,
  ),
  makeFile(
    'build_exe.bat',
    'build_exe.bat',
    'Batch',
    'Windows script to install dependencies and build MicroWeb.exe',
    buildExeBat,
  ),
  makeFile(
    'README.md',
    'README.md',
    'Markdown',
    'GitHub Actions, Windows 7 Python 3.8, and .exe build guide',
    readmeMd,
  ),
];

export function downloadSingleFile(file: PythonProjectFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name.split('/').pop() || file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  for (const file of PYTHON_PROJECT_FILES) {
    zip.file(file.zipPath, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'microweb-github-exe.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
