import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  FileSpreadsheet,
  Code2,
  FileTerminal,
  FileCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export type FileSecurityStatus = 'clean' | 'critical' | 'high' | 'medium' | 'low';

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
};

export type ViewNode = {
  name: string;
  path: string;
  children: ViewNode[];
  isFile: boolean;
};

function createNode(name: string, path: string, isFile = false): TreeNode {
  return { name, path, isFile, children: new Map() };
}

function toViewNode(node: TreeNode): ViewNode {
  const children = Array.from(node.children.values())
    .map(toViewNode)
    .sort((a, b) => Number(a.isFile) - Number(b.isFile) || a.name.localeCompare(b.name));

  return { name: node.name, path: node.path, isFile: node.isFile, children };
}

function buildTree(paths: string[]): ViewNode[] {
  const root = createNode('', '');

  paths.forEach((filePath) => {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      const isFile = index === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, createNode(part, path, isFile));
      }

      const next = current.children.get(part);
      if (next) {
        next.isFile = next.isFile || isFile;
        current = next;
      }
    });
  });

  return toViewNode(root).children;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return <Code2 className="h-4 w-4 text-[#7EE787]" />;
    case 'ts':
    case 'js':
      return <FileCode2 className="h-4 w-4 text-[#58A6FF]" />;
    case 'py':
      return <FileTerminal className="h-4 w-4 text-[#79C0FF]" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-[#F2C94C]" />;
    case 'md':
    case 'txt':
      return <FileText className="h-4 w-4 text-[#8B949E]" />;
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4 text-[#3FB950]" />;
    default:
      return <FileCode2 className="h-4 w-4 text-[#8B949E]" />;
  }
}

interface FileRowProps {
  node: ViewNode;
  depth: number;
  selectedFile?: string;
  onSelectFile?: (filePath: string) => void;
  fileStatuses?: Record<string, FileSecurityStatus>;
}

function FileRow({
  node,
  depth,
  selectedFile,
  onSelectFile,
  fileStatuses = {},
}: FileRowProps) {
  const [open, setOpen] = useState(true);
  const isSelected = selectedFile === node.path;
  const status = fileStatuses[node.path];

  if (node.isFile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => onSelectFile?.(node.path)}
        className={`group relative flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-mono transition-all cursor-pointer select-none ${
          isSelected
            ? 'bg-[#21262D] text-[#7EE787] font-semibold border border-[#7EE787]/40 shadow-sm'
            : 'text-[#C9D1D9] hover:bg-[#161B22] hover:text-[#F0F6FC]'
        }`}
        style={{ paddingLeft: depth * 14 + 10 }}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <span className="flex-shrink-0">{getFileIcon(node.name)}</span>
          <span className="truncate">{node.name}</span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {status === 'critical' && (
            <span className="rounded bg-[#FF4D4D]/20 border border-[#FF4D4D]/40 px-1.5 py-0.2 text-[10px] text-[#FF4D4D] font-bold">
              CRIT
            </span>
          )}
          {status === 'high' && (
            <span className="rounded bg-[#FF9F43]/20 border border-[#FF9F43]/40 px-1.5 py-0.2 text-[10px] text-[#FF9F43] font-bold">
              HIGH
            </span>
          )}
          {status === 'medium' && (
            <span className="rounded bg-[#F2C94C]/20 border border-[#F2C94C]/40 px-1.5 py-0.2 text-[10px] text-[#F2C94C] font-bold">
              MED
            </span>
          )}
          {status === 'low' && (
            <span className="rounded bg-[#58A6FF]/20 border border-[#58A6FF]/40 px-1.5 py-0.2 text-[10px] text-[#58A6FF]">
              LOW
            </span>
          )}
          {status === 'clean' && (
            <span className="size-1.5 rounded-full bg-[#3FB950]/60" title="Clean" />
          )}
        </div>
      </motion.div>
    );
  }

  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-[#F0F6FC] transition hover:bg-[#161B22] group"
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 text-[#8B949E] group-hover:text-[#F0F6FC]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>

          <AnimatePresence mode="wait">
            <motion.span
              key={open ? 'open' : 'closed'}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              transition={{ duration: 0.12 }}
              className="flex-shrink-0 text-[#FFB86B]"
            >
              {open ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>

          <span className="truncate font-mono text-xs">{node.name}</span>
        </div>

        <span className="font-mono text-[10px] text-[#484F58] group-hover:text-[#8B949E]">
          {node.children.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative overflow-hidden pl-2 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-[#30363D]/60"
          >
            {node.children.map((child) => (
              <FileRow
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                fileStatuses={fileStatuses}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedFileTreeProps {
  files: string[];
  selectedFile?: string;
  onSelectFile?: (filePath: string) => void;
  findings?: Array<{ file_path: string; severity: string }>;
}

export function AnimatedFileTree({
  files,
  selectedFile,
  onSelectFile,
  findings = [],
}: AnimatedFileTreeProps) {
  const [filterText, setFilterText] = useState('');

  // Map file findings to status
  const fileStatuses = useMemo(() => {
    const map: Record<string, FileSecurityStatus> = {};
    findings.forEach((f) => {
      const current = map[f.file_path];
      const sev = f.severity?.toLowerCase() as FileSecurityStatus;
      if (!current || (sev === 'critical') || (sev === 'high' && current !== 'critical')) {
        map[f.file_path] = sev || 'medium';
      }
    });
    return map;
  }, [findings]);

  const filteredFiles = useMemo(() => {
    if (!filterText.trim()) return files || [];
    return (files || []).filter((f) => f.toLowerCase().includes(filterText.toLowerCase()));
  }, [files, filterText]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  if (!files || files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#30363D] bg-[#0D1117] p-6 text-center text-xs text-[#8B949E]">
        File tree will appear once repository indexing finishes.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {/* Search Filter */}
      <div className="relative mb-1">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8B949E]" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter files..."
          className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] py-1.5 pl-8 pr-3 font-mono text-xs text-[#F0F6FC] placeholder-[#484F58] focus:border-[#7EE787] focus:outline-none transition"
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="absolute right-2.5 top-2 text-xs text-[#8B949E] hover:text-[#F0F6FC]"
          >
            ✕
          </button>
        )}
      </div>

      {/* File Tree List */}
      <div className="max-h-[520px] overflow-y-auto space-y-0.5 pr-1">
        {tree.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-[#8B949E]">
            No files matching &quot;{filterText}&quot;
          </div>
        ) : (
          tree.map((node) => (
            <FileRow
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              fileStatuses={fileStatuses}
            />
          ))
        )}
      </div>
    </div>
  );
}
