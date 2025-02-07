import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Columns } from 'lucide-react';
import * as diff from 'diff';
import { DiffLine, DiffBlock } from '../types';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  isJson: boolean;
  showOnlyDiffs: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  isJson,
  showOnlyDiffs,
}) => {
  const [currentDiff, setCurrentDiff] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  // Format JSON text before diffing if it's a JSON file
  const formatJsonIfNeeded = (text: string): string => {
    if (!isJson) return text;
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return text;
    }
  };

  const diffBlocks = useMemo(() => {
    // Process and format the text before diffing
    const processedOldText = formatJsonIfNeeded(oldText);
    const processedNewText = formatJsonIfNeeded(newText);

    // Process whitespace if enabled
    const processText = (text: string) => {
      if (ignoreWhitespace) {
        return text
          .split('\n')
          .map(line => line.trim())
          .join('\n');
      }
      return text;
    };

    const finalOldText = processText(processedOldText);
    const finalNewText = processText(processedNewText);

    const changes = diff.diffLines(finalOldText, finalNewText);
    const blocks: DiffBlock[] = [];
    let leftLineNumber = 1;
    let rightLineNumber = 1;
    let currentBlock: DiffLine[] = [];
    let hasChanges = false;

    changes.forEach((change) => {
      const lines = change.value.split('\n');
      // Remove the last empty line that's created by split()
      if (lines[lines.length - 1] === '') lines.pop();
      
      const type = change.added ? 'add' : change.removed ? 'remove' : 'normal';

      if (showOnlyDiffs && type === 'normal') {
        if (!change.added) leftLineNumber += lines.length;
        if (!change.removed) rightLineNumber += lines.length;
        
        if (currentBlock.length > 0 && hasChanges) {
          blocks.push({
            lines: [...currentBlock],
            startLine: currentBlock[0].leftLineNumber || currentBlock[0].rightLineNumber || 0,
            endLine: currentBlock[currentBlock.length - 1].leftLineNumber || currentBlock[currentBlock.length - 1].rightLineNumber || 0,
          });
          currentBlock = [];
          hasChanges = false;
        }
        return;
      }

      const diffLines: DiffLine[] = lines.map((content) => {
        // For changed lines, compute word-level diff
        let inlineChanges = null;
        if (type !== 'normal' && currentBlock.length > 0) {
          const lastLine = currentBlock[currentBlock.length - 1];
          if (lastLine && ((type === 'add' && lastLine.type === 'remove') || (type === 'remove' && lastLine.type === 'add'))) {
            const wordDiff = diff.diffWords(lastLine.content, content);
            inlineChanges = wordDiff.map(part => ({
              text: part.value,
              type: part.added ? 'add' : part.removed ? 'remove' : 'normal'
            }));
          }
        }

        return {
          type,
          content,
          leftLineNumber: !change.added ? leftLineNumber++ : null,
          rightLineNumber: !change.removed ? rightLineNumber++ : null,
          inlineChanges
        };
      });

      if (type !== 'normal') {
        hasChanges = true;
      }

      currentBlock.push(...diffLines);

      if (type === 'normal' && hasChanges && currentBlock.length > 0) {
        blocks.push({
          lines: [...currentBlock],
          startLine: currentBlock[0].leftLineNumber || currentBlock[0].rightLineNumber || 0,
          endLine: currentBlock[currentBlock.length - 1].leftLineNumber || currentBlock[currentBlock.length - 1].rightLineNumber || 0,
        });
        currentBlock = [];
        hasChanges = false;
      }
    });

    if (currentBlock.length > 0 && hasChanges) {
      blocks.push({
        lines: currentBlock,
        startLine: currentBlock[0].leftLineNumber || currentBlock[0].rightLineNumber || 0,
        endLine: currentBlock[currentBlock.length - 1].leftLineNumber || currentBlock[currentBlock.length - 1].rightLineNumber || 0,
      });
    }

    return blocks;
  }, [oldText, newText, showOnlyDiffs, ignoreWhitespace, isJson]);

  const renderInlineChanges = (line: DiffLine) => {
    if (!line.inlineChanges) return line.content;

    return (
      <span>
        {line.inlineChanges.map((part, i) => (
          <span
            key={i}
            className={
              part.type === 'add'
                ? 'bg-green-200 dark:bg-green-800'
                : part.type === 'remove'
                ? 'bg-red-200 dark:bg-red-800'
                : ''
            }
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  };

  const navigateDiff = (direction: 'next' | 'prev') => {
    if (diffBlocks.length === 0) return;
    
    if (direction === 'next') {
      setCurrentDiff((prev) => (prev + 1) % diffBlocks.length);
    } else {
      setCurrentDiff((prev) => (prev - 1 + diffBlocks.length) % diffBlocks.length);
    }
  };

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderJsonDiff = (block: DiffBlock) => {
    if (!isJson) return null;

    try {
      const content = JSON.parse(block.lines[0].content);
      return renderJsonNode(content, '', block.lines[0].type);
    } catch {
      return renderTextDiff(block);
    }
  };

  const renderJsonNode = (node: any, path: string, type: DiffLine['type']) => {
    if (typeof node !== 'object' || node === null) {
      return (
        <div className={`pl-6 ${getDiffClass(type)}`}>
          {JSON.stringify(node)}
        </div>
      );
    }

    const isExpanded = expandedNodes.has(path);
    const isArray = Array.isArray(node);

    return (
      <div className="pl-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => toggleNode(path)}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className={getDiffClass(type)}>
            {isArray ? '[' : '{'}
          </span>
        </div>
        {isExpanded && (
          <div className="pl-4">
            {Object.entries(node).map(([key, value]) => (
              <div key={key}>
                <span className={getDiffClass(type)}>{key}: </span>
                {renderJsonNode(value, `${path}.${key}`, type)}
              </div>
            ))}
          </div>
        )}
        <div className={getDiffClass(type)}>
          {isArray ? ']' : '}'}
        </div>
      </div>
    );
  };

  const renderTextDiff = (block: DiffBlock) => {
    if (viewMode === 'unified') {
      return (
        <div className="font-mono text-sm whitespace-pre">
          {block.lines.map((line, i) => (
            <div
              key={i}
              className={`${getDiffClass(line.type)} flex`}
            >
              <span className="w-12 text-gray-500 select-none">{line.leftLineNumber || line.rightLineNumber}</span>
              <span className="flex-1">{line.inlineChanges ? renderInlineChanges(line) : line.content}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="font-mono text-sm grid grid-cols-2 gap-4">
        {/* Left side (original) */}
        <div className="whitespace-pre">
          {block.lines.map((line, i) => (
            line.type !== 'add' && (
              <div
                key={i}
                className={`flex ${line.type === 'remove' ? 'bg-red-100 dark:bg-red-900' : ''}`}
              >
                <span className="w-12 text-gray-500 select-none">{line.leftLineNumber}</span>
                <span className="flex-1">{line.inlineChanges ? renderInlineChanges(line) : line.content}</span>
              </div>
            )
          ))}
        </div>
        {/* Right side (modified) */}
        <div className="whitespace-pre">
          {block.lines.map((line, i) => (
            line.type !== 'remove' && (
              <div
                key={i}
                className={`flex ${line.type === 'add' ? 'bg-green-100 dark:bg-green-900' : ''}`}
              >
                <span className="w-12 text-gray-500 select-none">{line.rightLineNumber}</span>
                <span className="flex-1">{line.inlineChanges ? renderInlineChanges(line) : line.content}</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  const getDiffClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'add':
        return 'bg-green-100 dark:bg-green-900';
      case 'remove':
        return 'bg-red-100 dark:bg-red-900';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <div className="sticky top-0 flex justify-between p-2 bg-white dark:bg-gray-800 border-b">
        <div className="flex gap-2">
          <button
            onClick={() => navigateDiff('prev')}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={diffBlocks.length === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateDiff('next')}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={diffBlocks.length === 0}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm">
            {diffBlocks.length === 0 
              ? 'No differences found' 
              : `${currentDiff + 1} of ${diffBlocks.length} differences`}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Ignore whitespace
          </label>
          <button
            onClick={() => setViewMode(mode => mode === 'unified' ? 'split' : 'unified')}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Columns className="w-4 h-4" />
            <span className="text-sm">{viewMode === 'unified' ? 'Split View' : 'Unified View'}</span>
          </button>
        </div>
      </div>
      <div className="p-4">
        {diffBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            The files are identical
          </div>
        ) : (
          diffBlocks.map((block, i) => (
            <div
              key={i}
              ref={i === currentDiff ? (el) => el?.scrollIntoView({ behavior: 'smooth' }) : undefined}
            >
              {isJson ? renderJsonDiff(block) : renderTextDiff(block)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};