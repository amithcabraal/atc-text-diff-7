export interface DiffLine {
  type: 'add' | 'remove' | 'normal';
  content: string;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
}

export interface DiffBlock {
  lines: DiffLine[];
  startLine: number;
  endLine: number;
}

export interface FileContent {
  content: string;
  name: string;
  type: string;
}