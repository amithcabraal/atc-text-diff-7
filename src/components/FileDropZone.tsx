import React, { useCallback, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { FileContent } from '../types';

interface FileDropZoneProps {
  onFileLoad: (file: FileContent) => void;
  side: 'left' | 'right';
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileLoad, side }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        try {
          const content = await file.text();
          onFileLoad({
            content,
            name: file.name,
            type: file.type || 'text/plain',
          });
        } catch (error) {
          console.error('Error reading file:', error);
          // TODO: Add proper error handling UI
        }
      }
    },
    [onFileLoad]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const content = await file.text();
          onFileLoad({
            content,
            name: file.name,
            type: file.type || 'text/plain',
          });
        } catch (error) {
          console.error('Error reading file:', error);
          // TODO: Add proper error handling UI
        }
      }
    },
    [onFileLoad]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {/* Primary Upload Button */}
        <button
          onClick={handleClick}
          className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          aria-label={`Upload ${side === 'left' ? 'original' : 'modified'} file`}
        >
          <FileUp className="w-5 h-5" />
          <span>Choose File</span>
        </button>

        {/* Browse Button */}
        <button
          onClick={handleClick}
          className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          aria-label={`Browse for ${side === 'left' ? 'original' : 'modified'} file`}
        >
          <Upload className="w-5 h-5" />
          <span>Browse</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transform group-hover:scale-110 transition-transform">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              <span className="font-semibold">Drag and drop</span> your file here
              <br />
              <span className="text-xs">Supports TXT, JSON, CSV (max 10MB)</span>
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept=".txt,.json,.csv"
        className="hidden"
        aria-label={`Upload ${side} file`}
      />
    </div>
  );
};