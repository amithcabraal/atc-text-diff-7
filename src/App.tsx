import React, { useState, useCallback } from 'react';
import { Menu, HelpCircle, Share2, Settings, FileText, Upload, ArrowRight, AlertCircle } from 'lucide-react';
import { FileDropZone } from './components/FileDropZone';
import { DiffViewer } from './components/DiffViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { FileContent } from './types';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark' | 'system') || 'system';
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('welcomeDismissed') !== 'true';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftFile, setLeftFile] = useState<FileContent | null>(null);
  const [rightFile, setRightFile] = useState<FileContent | null>(null);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [sortLines, setSortLines] = useState(false);
  const [headerRows, setHeaderRows] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [prettyPrintJson, setPrettyPrintJson] = useState(true); // Set to true by default

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('welcomeDismissed', 'true');
  }, []);

  const formatJsonContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return content;
    }
  };

  const handleFileLoad = useCallback((file: FileContent, side: 'left' | 'right') => {
    if (file.content.length > 10 * 1024 * 1024) { // 10MB limit
      setError('File size exceeds 10MB limit');
      return;
    }

    setError(null);
    const isJsonFile = file.type === 'application/json' || file.name.endsWith('.json');
    const processedContent = isJsonFile && prettyPrintJson ? formatJsonContent(file.content) : file.content;
    
    const processedFile = {
      ...file,
      content: processedContent,
      type: isJsonFile ? 'application/json' : file.type
    };

    if (side === 'left') {
      setLeftFile(processedFile);
    } else {
      setRightFile(processedFile);
    }
  }, [prettyPrintJson]);

  const sortContent = useCallback((content: string, skipRows: number) => {
    const lines = content.split('\n');
    const headers = lines.slice(0, skipRows);
    const sortedLines = lines.slice(skipRows).sort();
    return [...headers, ...sortedLines].join('\n');
  }, []);

  const processFileContent = useCallback((content: string, type: string) => {
    if (!sortLines) return content;
    return sortContent(content, headerRows);
  }, [sortLines, headerRows, sortContent]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Title Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Text Diff Tool
            </h1>
          </div>
          <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
        </div>
      </div>

      {/* Menu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg p-4">
            <div className="space-y-4">
              <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <HelpCircle className="w-5 h-5" />
                Help
              </button>
              <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </div>
          <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to Text Diff Tool!</h2>
            <div className="space-y-4 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Compare text files easily with our powerful diff tool:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Upload files via drag & drop or file browser</li>
                <li>View differences side by side or unified</li>
                <li>Navigate through changes easily</li>
                <li>Special handling for JSON and CSV files</li>
                <li>Sort and compare text files</li>
              </ul>
            </div>
            <button
              onClick={dismissWelcome}
              className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Options */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyDiffs}
                onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Show only differences
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sortLines}
                onChange={(e) => setSortLines(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Sort lines
            </label>
            {sortLines && (
              <label className="flex items-center gap-2">
                <span>Header rows:</span>
                <input
                  type="number"
                  min="0"
                  value={headerRows}
                  onChange={(e) => setHeaderRows(parseInt(e.target.value) || 0)}
                  className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prettyPrintJson}
                onChange={(e) => {
                  setPrettyPrintJson(e.target.checked);
                  // Re-process files when pretty print is toggled
                  if (leftFile) handleFileLoad(leftFile, 'left');
                  if (rightFile) handleFileLoad(rightFile, 'right');
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Pretty print JSON
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Original File</h2>
            {!leftFile ? (
              <FileDropZone onFileLoad={(file) => handleFileLoad(file, 'left')} side="left" />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">{leftFile.name}</span>
                  <button
                    onClick={() => setLeftFile(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Modified File</h2>
            {!rightFile ? (
              <FileDropZone onFileLoad={(file) => handleFileLoad(file, 'right')} side="right" />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">{rightFile.name}</span>
                  <button
                    onClick={() => setRightFile(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diff Viewer */}
        {leftFile && rightFile && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <DiffViewer
              oldText={processFileContent(leftFile.content, leftFile.type)}
              newText={processFileContent(rightFile.content, rightFile.type)}
              isJson={leftFile.type === 'application/json' || rightFile.type === 'application/json'}
              showOnlyDiffs={showOnlyDiffs}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;