import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode2,
  FileJson,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Terminal,
  Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Finding {
  id: string;
  scanner?: string;
  rule_id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file_path: string;
  start_line?: number;
  end_line?: number;
  code_snippet?: string;
}

interface FileContentViewerProps {
  filePath: string;
  content?: string;
  findings?: Finding[];
  onClose?: () => void;
  onSelectFinding?: (findingId: string) => void;
}

function getFileLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'TypeScript';
    case 'js':
    case 'jsx':
      return 'JavaScript';
    case 'py':
      return 'Python';
    case 'json':
      return 'JSON';
    case 'md':
      return 'Markdown';
    case 'css':
      return 'CSS';
    case 'html':
      return 'HTML';
    case 'yml':
    case 'yaml':
      return 'YAML';
    case 'sql':
      return 'SQL';
    case 'sh':
      return 'Shell';
    case 'env':
      return 'Environment';
    default:
      return 'Plain Text';
  }
}

function getFileIcon(filePath: string) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'json') return <FileJson className="h-4 w-4 text-[#F2C94C]" />;
  if (ext === 'md' || ext === 'txt') return <FileText className="h-4 w-4 text-[#8B949E]" />;
  if (ext === 'csv') return <FileSpreadsheet className="h-4 w-4 text-[#3FB950]" />;
  if (ext === 'py') return <FileCode2 className="h-4 w-4 text-[#58A6FF]" />;
  if (ext === 'tsx' || ext === 'ts' || ext === 'jsx' || ext === 'js') {
    return <Code2 className="h-4 w-4 text-[#7EE787]" />;
  }
  return <FileCode2 className="h-4 w-4 text-[#AAB6C4]" />;
}

export function FileContentViewer({
  filePath,
  content,
  findings = [],
  onClose,
  onSelectFinding,
}: FileContentViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'source' | 'findings'>('source');

  const fileFindings = useMemo(
    () => findings.filter((f) => f.file_path === filePath || filePath.endsWith(f.file_path)),
    [findings, filePath]
  );

  const lines = useMemo(() => {
    if (!content) return [];
    return content.split('\n');
  }, [content]);

  const copyCode = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = filePath.split('/');
  const language = getFileLanguage(filePath);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`relative flex flex-col rounded-xl border border-[#30363D] bg-[#161B22] shadow-2xl overflow-hidden transition-all duration-300 ${
        expanded ? 'fixed inset-4 z-50 max-w-none' : 'w-full'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363D] bg-[#1C2128] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-[#0D1117] border border-[#30363D]/60 flex items-center justify-center">
            {getFileIcon(filePath)}
          </span>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 font-mono text-xs text-[#8B949E] truncate">
            {pathParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[#484F58] flex-shrink-0" />}
                <span
                  className={
                    idx === pathParts.length - 1
                      ? 'font-bold text-[#F0F6FC] truncate'
                      : 'hover:text-[#C9D1D9] truncate'
                  }
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          <span className="hidden sm:inline-block rounded-full bg-[#0D1117] border border-[#30363D] px-2 py-0.5 font-mono text-[10px] text-[#7EE787]">
            {language}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {fileFindings.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-[#FF4D4D]/15 border border-[#FF4D4D]/30 px-2.5 py-0.5 font-mono text-[11px] text-[#FF4D4D] font-bold">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>
                {fileFindings.length} {fileFindings.length === 1 ? 'Finding' : 'Findings'}
              </span>
            </div>
          )}

          <div className="flex items-center border border-[#30363D] bg-[#0D1117] rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('source')}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition ${
                activeTab === 'source'
                  ? 'bg-[#21262D] text-[#F0F6FC] font-bold shadow-sm'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              Source Code
            </button>
            {fileFindings.length > 0 && (
              <button
                onClick={() => setActiveTab('findings')}
                className={`px-2.5 py-1 rounded-md font-mono text-xs transition flex items-center gap-1.5 ${
                  activeTab === 'findings'
                    ? 'bg-[#FF4D4D]/20 text-[#FF4D4D] font-bold shadow-sm'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                <span>Findings ({fileFindings.length})</span>
              </button>
            )}
          </div>

          <button
            onClick={copyCode}
            title="Copy file contents"
            className="flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 font-mono text-xs text-[#8B949E] hover:border-[#7EE787] hover:text-[#F0F6FC] transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#7EE787]" />
                <span className="text-[#7EE787]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Minimize view' : 'Maximize view'}
            className="rounded-lg border border-[#30363D] bg-[#0D1117] p-1.5 text-[#8B949E] hover:border-[#7EE787] hover:text-[#F0F6FC] transition"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1 font-mono text-xs text-[#8B949E] hover:text-[#FF4D4D] hover:border-[#FF4D4D]/50 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Security alert strip if findings exist */}
      {fileFindings.length > 0 && activeTab === 'source' && (
        <div className="bg-[#FF4D4D]/10 border-b border-[#FF4D4D]/25 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#FF4D4D]">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span className="font-bold">
              Detected {fileFindings.length} security vulnerability in this file
            </span>
          </div>
          <div className="flex items-center gap-2">
            {fileFindings.map((finding) => (
              <Link
                key={finding.id}
                to={`/finding/${finding.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF4D4D]/20 border border-[#FF4D4D]/40 font-mono text-[11px] text-[#F0F6FC] hover:bg-[#FF4D4D]/30 transition"
              >
                <span>Line {finding.start_line || 1}</span>
                <span className="font-bold">({finding.severity})</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Body / Code Display */}
      {activeTab === 'source' ? (
        <div className="flex-1 overflow-auto bg-[#0D1117] max-h-[560px]">
          {content === undefined ? (
            <div className="p-12 text-center font-mono text-xs text-[#8B949E] flex flex-col items-center justify-center gap-2">
              <Terminal className="h-6 w-6 text-[#484F58]" />
              <span>Select a file from the repository tree to inspect its contents.</span>
            </div>
          ) : lines.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#8B949E]">
              (Empty file)
            </div>
          ) : (
            <div className="font-mono text-xs py-3 select-text">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const findingForLine = fileFindings.find(
                  (f) =>
                    f.start_line &&
                    f.end_line &&
                    lineNum >= f.start_line &&
                    lineNum <= f.end_line
                );

                return (
                  <div
                    key={lineNum}
                    className={`group flex items-start px-2 py-0.5 transition ${
                      findingForLine
                        ? 'bg-[#FF4D4D]/15 border-l-2 border-[#FF4D4D]'
                        : 'hover:bg-[#161B22]/60 border-l-2 border-transparent'
                    }`}
                  >
                    {/* Line number gutter */}
                    <span
                      className={`w-10 pr-3 text-right select-none font-mono text-[11px] flex-shrink-0 ${
                        findingForLine
                          ? 'text-[#FF4D4D] font-bold'
                          : 'text-[#484F58] group-hover:text-[#8B949E]'
                      }`}
                    >
                      {lineNum}
                    </span>

                    {/* Code content */}
                    <pre
                      className={`flex-1 overflow-x-auto whitespace-pre leading-relaxed ${
                        findingForLine ? 'text-[#FF7B72] font-semibold' : 'text-[#C9D1D9]'
                      }`}
                    >
                      {line || ' '}
                    </pre>

                    {/* Finding badge on vulnerable line */}
                    {findingForLine && lineNum === (findingForLine.start_line || 1) && (
                      <Link
                        to={`/finding/${findingForLine.id}`}
                        className="ml-2 flex-shrink-0 rounded bg-[#FF4D4D] px-1.5 py-0.2 font-mono text-[10px] text-[#0D1117] font-bold hover:bg-[#FF7B72] transition flex items-center gap-1"
                        title="Click to view AI fix"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>{findingForLine.rule_id}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Findings List Tab */
        <div className="p-4 space-y-3 bg-[#0D1117] max-h-[560px] overflow-y-auto">
          {fileFindings.map((finding) => (
            <div
              key={finding.id}
              className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 transition hover:border-[#7EE787]/50"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-[#8B949E]">
                    <span className="rounded bg-[#21262D] px-2 py-0.5 text-[#7EE787] font-bold">
                      {finding.scanner?.toUpperCase()}
                    </span>
                    <span>Line {finding.start_line}:{finding.end_line}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#F0F6FC] mt-1">
                    {finding.title}
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                    finding.severity === 'CRITICAL'
                      ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/30'
                      : finding.severity === 'HIGH'
                      ? 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/30'
                      : 'bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/30'
                  }`}
                >
                  {finding.severity}
                </span>
              </div>
              <p className="text-xs text-[#8B949E] mb-3 leading-relaxed">
                {finding.description}
              </p>
              {finding.code_snippet && (
                <pre className="p-2.5 bg-[#0D1117] rounded-lg border border-[#30363D] font-mono text-xs text-[#FF7B72] overflow-x-auto mb-3">
                  {finding.code_snippet}
                </pre>
              )}
              <Link
                to={`/finding/${finding.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7EE787] text-[#0D1117] font-heading font-bold text-xs hover:bg-[#a7f3ad] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Gemini AI Fix & Unified Diff</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between border-t border-[#30363D] bg-[#1C2128] px-4 py-2 font-mono text-[11px] text-[#8B949E]">
        <div className="flex items-center gap-4">
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{content ? new Blob([content]).size : 0} bytes</span>
          <span>·</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#7EE787]">DEVSec SAST Safe Inspector</span>
        </div>
      </div>
    </motion.div>
  );
}
