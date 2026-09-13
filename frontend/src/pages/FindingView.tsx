import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  ShieldAlert,
  RefreshCw,
  FileCode,
  KeyRound,
  Bug,
  Cpu,
  Zap,
} from 'lucide-react';

export default function FindingView() {
  const { id } = useParams();
  const [finding, setFinding] = useState<any>(null);
  const [fix, setFix] = useState<any>(null);
  const [loadingFix, setLoadingFix] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/findings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setFinding);
  }, [id]);

  const getFix = async () => {
    setLoadingFix(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/findings/${id}/suggest-fix`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      setFix(j);
    } catch (e: any) {
      alert('Failed to generate fix: ' + e.message);
    } finally {
      setLoadingFix(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!finding)
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 font-mono text-[#8B949E] animate-pulse flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[#7EE787] border-t-transparent rounded-full animate-spin" />
        <span>LOADING FINDING DETAILS...</span>
      </div>
    );

  const category = finding.category || 'SECURITY';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans">
      <Link
        to={`/scan/${finding.scan_id}`}
        className="inline-flex items-center gap-2 font-mono text-xs text-[#8B949E] hover:text-[#F0F6FC] px-3.5 py-2 border border-[#30363D] rounded-lg bg-[#161B22] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO SCAN RESULTS</span>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mt-6 pb-6 border-b border-[#30363D]">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#8B949E] mb-2">
            {/* Category Tag */}
            <span
              className={`px-2 py-0.5 rounded border text-[11px] font-bold flex items-center gap-1.5 ${
                category === 'SECRETS'
                  ? 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/40'
                  : category === 'DEBUG_ERROR'
                  ? 'bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/40'
                  : category === 'OPTIMIZATION'
                  ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40'
                  : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40'
              }`}
            >
              {category === 'SECRETS' ? (
                <>
                  <KeyRound className="w-3 h-3" />
                  <span>SECRET / LEAK</span>
                </>
              ) : category === 'DEBUG_ERROR' ? (
                <>
                  <Bug className="w-3 h-3" />
                  <span>CODE DEFECT</span>
                </>
              ) : category === 'OPTIMIZATION' ? (
                <>
                  <Cpu className="w-3 h-3" />
                  <span>OPTIMIZATION</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" />
                  <span>SECURITY GLITCH</span>
                </>
              )}
            </span>

            <span className="px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[#7EE787] font-bold">
              {finding.scanner?.toUpperCase()}
            </span>
            <span>{finding.rule_id}</span>
            <span>·</span>
            <span>{finding.file_path}:{finding.start_line || 1}</span>
          </div>

          <h1 className="font-heading font-bold text-2xl text-[#F0F6FC]">
            {finding.title}
          </h1>
          <p className="text-sm text-[#8B949E] mt-1 max-w-3xl leading-relaxed">
            {finding.description}
          </p>
        </div>

        <span
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold border shrink-0 ${
            finding.severity === 'CRITICAL'
              ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40'
              : finding.severity === 'HIGH'
              ? 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/40'
              : finding.severity === 'MEDIUM'
              ? 'bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/40'
              : 'bg-[#161B22] text-[#8B949E] border-[#30363D]'
          }`}
        >
          {finding.severity} SEVERITY
        </span>
      </div>

      {/* Side-by-side Code Comparison */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Left Pane: Vulnerable Code */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-[#1C2128] border-b border-[#30363D] px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-xs text-[#FF4D4D] font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF4D4D]" />
              FLAGGED CODE SNIPPET
            </span>
            <span className="font-mono text-[11px] text-[#8B949E]">
              {finding.file_path}:{finding.start_line || 1}
            </span>
          </div>

          <div className="p-4 bg-[#0D1117] flex-1 font-mono text-xs overflow-x-auto">
            <pre className="text-[#F0F6FC] leading-relaxed whitespace-pre-wrap">
              {finding.code_snippet || '// Code snippet unavailable'}
            </pre>
          </div>

          <div className="px-4 py-2.5 bg-[#FF4D4D]/10 border-t border-[#FF4D4D]/20 font-mono text-[11px] text-[#FF4D4D]">
            ⚠ Unsafe pattern or defect detected. Do not deploy without reviewing remediation.
          </div>
        </div>

        {/* Right Pane: AI Suggested Fix */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-[#1C2128] border-b border-[#30363D] px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-xs text-[#7EE787] font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7EE787]" />
              AI CONTEXTUAL REMEDIATION
            </span>

            {!fix && (
              <button
                onClick={getFix}
                disabled={loadingFix}
                className="px-3.5 py-1 rounded bg-[#7EE787] text-[#0D1117] font-heading font-bold text-xs hover:bg-[#a7f3ad] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingFix ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>GENERATING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>GENERATE FIX</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!fix ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#7EE787]/10 border border-[#7EE787]/30 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#7EE787]" />
              </div>
              <p className="font-heading font-bold text-base text-[#F0F6FC]">
                Contextual AI Remediation Engine
              </p>
              <p className="text-xs text-[#8B949E] mt-2 max-w-sm leading-relaxed font-sans">
                Click <strong className="text-[#7EE787]">Generate Fix</strong> to run AI code analysis. Generates an explanation, impact analysis, corrected replacement snippet, and unified diff.
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div>
                <p className="font-mono text-[11px] text-[#8B949E] font-bold uppercase tracking-wider mb-1">
                  Explanation
                </p>
                <p className="text-xs text-[#F0F6FC] bg-[#0D1117] p-3 rounded-lg border border-[#30363D] leading-relaxed">
                  {fix.explanation}
                </p>
              </div>

              <div>
                <p className="font-mono text-[11px] text-[#8B949E] font-bold uppercase tracking-wider mb-1">
                  Impact
                </p>
                <p className="text-xs text-[#F0F6FC] bg-[#0D1117] p-3 rounded-lg border border-[#30363D] leading-relaxed">
                  {fix.impact}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-[11px] text-[#7EE787] font-bold uppercase tracking-wider">
                    Corrected Code
                  </p>
                  <button
                    onClick={() => copyToClipboard(fix.fixed_code, 'code')}
                    className="px-2.5 py-1 rounded bg-[#21262D] border border-[#30363D] font-mono text-[11px] text-[#F0F6FC] hover:border-[#7EE787] flex items-center gap-1.5 transition"
                  >
                    {copiedType === 'code' ? (
                      <>
                        <Check className="w-3 h-3 text-[#7EE787]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#8B949E]" />
                        <span>COPY FIX</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] font-mono text-xs text-[#7EE787] overflow-x-auto">
                  {fix.fixed_code}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-[11px] text-[#8B949E] font-bold uppercase tracking-wider">
                    Unified Diff
                  </p>
                  <button
                    onClick={() => copyToClipboard(fix.unified_diff, 'diff')}
                    className="px-2.5 py-1 rounded bg-[#21262D] border border-[#30363D] font-mono text-[11px] text-[#F0F6FC] hover:border-[#7EE787] flex items-center gap-1.5 transition"
                  >
                    {copiedType === 'diff' ? (
                      <>
                        <Check className="w-3 h-3 text-[#7EE787]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#8B949E]" />
                        <span>COPY DIFF</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] font-mono text-xs text-[#8B949E] overflow-x-auto">
                  {fix.unified_diff}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
