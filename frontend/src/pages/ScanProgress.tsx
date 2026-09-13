import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Sparkles,
  Search,
  KeyRound,
  Bug,
  Cpu,
  CheckCircle2,
  Lock,
  Award,
  Zap,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { AnimatedFileTree } from '../components/AnimatedFileTree';
import { CyberScannerAnimation } from '../components/CyberScannerAnimation';
import { FileContentViewer } from '../components/FileContentViewer';

const STEPS = ["QUEUED", "FETCHING", "SCANNING", "ANALYZING", "READY"];

type CategoryType = 'ALL' | 'SECRETS' | 'SECURITY' | 'DEBUG_ERROR' | 'OPTIMIZATION';
type SeverityType = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function ScanProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState<any>(null);
  const [err, setErr] = useState('');
  const [rescanning, setRescanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'findings' | 'code'>('findings');
  
  // Filtering & search states (active when findings exist)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const load = () => {
    const token = localStorage.getItem('token');
    fetch(`/api/scans/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) =>
        r.ok ? r.json() : r.json().then((j) => {
          throw new Error(j.detail || 'Scan not found');
        })
      )
      .then((data) => {
        setScan(data);
        if (!selectedFile && data.repo_files && data.repo_files.length > 0) {
          const findingFile = data.findings?.[0]?.file_path;
          const match = data.repo_files.find(
            (f: string) => f === findingFile || (findingFile && f.endsWith(findingFile))
          );
          setSelectedFile(match || data.repo_files[0]);
        }
      })
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [id]);

  const handleRescan = async () => {
    setRescanning(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/scans/${scan.id}/rescan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      window.location.href = `/scan/${j.id}`;
    } catch (e: any) {
      alert(e.message || 'Rescan failed');
      setRescanning(false);
    }
  };

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    setActiveTab('code');
  };

  const findings = scan?.findings || [];
  const repoFiles = scan?.repo_files || [];
  const fileContents = scan?.file_contents || {};
  
  const severityCounts = scan?.severity_counts || {
    CRITICAL: findings.filter((f: any) => f.severity === 'CRITICAL').length,
    HIGH: findings.filter((f: any) => f.severity === 'HIGH').length,
    MEDIUM: findings.filter((f: any) => f.severity === 'MEDIUM').length,
    LOW: findings.filter((f: any) => f.severity === 'LOW').length,
  };

  const categoryCounts = scan?.category_counts || {
    SECRETS: findings.filter((f: any) => f.category === 'SECRETS').length,
    SECURITY: findings.filter((f: any) => f.category === 'SECURITY' || !f.category).length,
    DEBUG_ERROR: findings.filter((f: any) => f.category === 'DEBUG_ERROR').length,
    OPTIMIZATION: findings.filter((f: any) => f.category === 'OPTIMIZATION').length,
  };

  // Overall Security Rating & Health Grade (0 - 100)
  const securityScore = useMemo(() => {
    if (findings.length === 0) return 100;
    const deductions =
      (severityCounts.CRITICAL || 0) * 25 +
      (severityCounts.HIGH || 0) * 12 +
      (severityCounts.MEDIUM || 0) * 5 +
      (severityCounts.LOW || 0) * 2;
    return Math.max(5, 100 - deductions);
  }, [findings, severityCounts]);

  const securityRating = useMemo(() => {
    if (securityScore >= 98 && findings.length === 0) {
      return {
        grade: 'A+',
        label: 'EXCEPTIONAL',
        badgeColor: 'text-[#3FB950] border-[#3FB950]/50 bg-[#3FB950]/15',
        gradient: 'from-[#3FB950] to-[#7EE787]',
        verdict: 'Repository verified clean. Safe to deploy with zero detected security risks.',
      };
    }
    if (securityScore >= 90) {
      return {
        grade: 'A',
        label: 'HARDENED',
        badgeColor: 'text-[#7EE787] border-[#7EE787]/50 bg-[#7EE787]/15',
        gradient: 'from-[#7EE787] to-[#2EA043]',
        verdict: 'Strong security posture. Only minor or informational notices detected.',
      };
    }
    if (securityScore >= 75) {
      return {
        grade: 'B',
        label: 'MODERATE RISK',
        badgeColor: 'text-[#F2C94C] border-[#F2C94C]/50 bg-[#F2C94C]/15',
        gradient: 'from-[#F2C94C] to-[#D29922]',
        verdict: 'Medium severity flaws present. Recommended to review before release.',
      };
    }
    if (securityScore >= 50) {
      return {
        grade: 'C',
        label: 'ELEVATED RISK',
        badgeColor: 'text-[#FF9F43] border-[#FF9F43]/50 bg-[#FF9F43]/15',
        gradient: 'from-[#FF9F43] to-[#DB6D28]',
        verdict: 'High severity security issues or secret exposures identified.',
      };
    }
    if (securityScore >= 30) {
      return {
        grade: 'D',
        label: 'HIGH RISK',
        badgeColor: 'text-[#FF6B6B] border-[#FF6B6B]/50 bg-[#FF6B6B]/15',
        gradient: 'from-[#FF6B6B] to-[#DA3633]',
        verdict: 'Critical vulnerabilities present. Deployment blocked until remediated.',
      };
    }
    return {
      grade: 'F',
      label: 'CRITICAL FAILURE',
      badgeColor: 'text-[#FF4D4D] border-[#FF4D4D]/50 bg-[#FF4D4D]/20',
      gradient: 'from-[#FF4D4D] to-[#B62324]',
      verdict: 'Multiple critical security leaks and vulnerabilities require immediate emergency action.',
    };
  }, [securityScore, findings]);

  // Sub-dimension ratings
  const secretHealth = Math.max(0, 100 - (categoryCounts.SECRETS || 0) * 35);
  const injectionHealth = Math.max(0, 100 - (severityCounts.CRITICAL || 0) * 35);
  const runtimeIntegrity = Math.max(0, 100 - (categoryCounts.DEBUG_ERROR || 0) * 20);
  const archIndex = Math.max(0, 100 - (categoryCounts.OPTIMIZATION || 0) * 15);

  // Filtered findings based on category, severity, and search query
  const filteredFindings = useMemo(() => {
    return findings.filter((f: any) => {
      const matchCat =
        selectedCategory === 'ALL'
          ? true
          : (f.category || 'SECURITY') === selectedCategory;

      const matchSev =
        selectedSeverity === 'ALL'
          ? true
          : f.severity === selectedSeverity;

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        f.title?.toLowerCase().includes(query) ||
        f.file_path?.toLowerCase().includes(query) ||
        f.rule_id?.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query);

      return matchCat && matchSev && matchSearch;
    });
  }, [findings, selectedCategory, selectedSeverity, searchQuery]);

  if (err)
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 font-mono text-[#FF4D4D] flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>Error loading scan: {err}</span>
      </div>
    );

  if (!scan)
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 font-mono text-[#8B949E] flex items-center gap-3 animate-pulse">
        <div className="w-4 h-4 border-2 border-[#7EE787] border-t-transparent rounded-full animate-spin" />
        <span>INITIALIZING REPOSITORY ANALYSIS ENGINE #{id?.slice(0, 8)}...</span>
      </div>
    );

  const idx = STEPS.indexOf(scan.status);
  const currentContent =
    fileContents[selectedFile] ??
    (selectedFile ? `// File: ${selectedFile}\n// Content indexed from repository session.` : undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 font-sans">
      {/* Top Breadcrumb navigation */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-xs text-[#8B949E] hover:text-[#F0F6FC] px-3.5 py-2 border border-[#30363D] rounded-lg bg-[#161B22] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO DASHBOARD</span>
      </Link>

      {/* Main Scan Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pb-6 border-b border-[#30363D]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl tracking-tight text-[#F0F6FC]">
              SCAN REPORT
            </h1>
            <span
              className={`font-mono text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${
                scan.status === 'READY'
                  ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/40'
                  : 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/40 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  scan.status === 'READY' ? 'bg-[#3FB950]' : 'bg-[#FF9F43]'
                }`}
              />
              {scan.status}
            </span>
          </div>
          <p className="font-mono text-xs text-[#8B949E] mt-1">
            Target: <span className="text-[#F0F6FC] font-semibold">{scan.deployment_target || 'Vercel'}</span>
          </p>
        </div>

        {scan.status === 'READY' && (
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-5 py-2.5 rounded-lg bg-[#7EE787] text-[#0D1117] font-heading font-bold text-xs flex items-center gap-2 hover:bg-[#a7f3ad] transition shadow-[0_0_12px_rgba(126,231,135,0.3)] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${rescanning ? 'animate-spin' : ''}`} />
            <span>RE-SCAN REPOSITORY</span>
          </button>
        )}
      </div>

      {/* Scanning Pipeline Progress Track */}
      <div className="mt-8 bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-lg">
        <div className="flex gap-2 mb-3">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                i <= idx
                  ? 'bg-[#7EE787] shadow-[0_0_8px_rgba(126,231,135,0.6)]'
                  : 'bg-[#21262D]'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between font-mono text-[11px] text-[#8B949E]">
          {STEPS.map((s) => (
            <span
              key={s}
              className={
                scan.status === s
                  ? 'text-[#7EE787] font-bold'
                  : s === 'READY' && idx >= 4
                  ? 'text-[#3FB950]'
                  : 'text-[#8B949E]'
              }
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {scan.status === 'READY' && (
        <>
          {/* COMPREHENSIVE SECURITY RATING & POSTURE SCORE CARD */}
          <div className="mt-8 rounded-2xl border border-[#30363D] bg-gradient-to-br from-[#161B22] via-[#1C2128] to-[#161B22] p-6 shadow-2xl relative overflow-hidden">
            {/* Background Ambient Aura */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,_rgba(126,231,135,0.12)_0%,_transparent_65%)] pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-6 items-center relative z-10">
              {/* Left Column: Grade Badge & Overall Score */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-4 border-b lg:border-b-0 lg:border-r border-[#30363D] pb-6 lg:pb-0 lg:pr-6">
                <div className="flex items-center gap-4">
                  {/* Glowing Grade Badge */}
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-heading font-black text-4xl shadow-xl border-2 ${securityRating.badgeColor}`}>
                    <span>{securityRating.grade}</span>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-[#8B949E] uppercase font-bold tracking-wider">
                      Security Rating
                    </span>
                    <h2 className="font-heading font-black text-2xl text-[#F0F6FC]">
                      {securityRating.label}
                    </h2>
                    <p className="font-mono text-xs text-[#7EE787] font-bold mt-0.5">
                      Score: {securityScore} / 100
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full mt-2">
                  <div className="w-full h-2.5 bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div
                      className={`h-full bg-gradient-to-r ${securityRating.gradient} transition-all duration-1000`}
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Security Posture Breakdown & Verdict */}
              <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#F0F6FC] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#7EE787]" />
                      <span>Security Posture Evaluation</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#8B949E]">
                      {findings.length === 0 ? '0 issues found' : `${findings.length} total diagnostics flagged`}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#C9D1D9] leading-relaxed">
                    {securityRating.verdict}
                  </p>
                </div>

                {/* Sub-dimension Health Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#8B949E]">
                      <span>Secret Health</span>
                      <span className="text-[#FF9F43] font-bold">{secretHealth}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#FF9F43]" style={{ width: `${secretHealth}%` }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#8B949E]">
                      <span>SAST & Injection</span>
                      <span className="text-[#FF4D4D] font-bold">{injectionHealth}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#FF4D4D]" style={{ width: `${injectionHealth}%` }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#8B949E]">
                      <span>Runtime / Bugs</span>
                      <span className="text-[#F2C94C] font-bold">{runtimeIntegrity}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#F2C94C]" style={{ width: `${runtimeIntegrity}%` }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#8B949E]">
                      <span>Architecture</span>
                      <span className="text-[#38BDF8] font-bold">{archIndex}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#38BDF8]" style={{ width: `${archIndex}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* If there are real findings: show metric cards */}
          {findings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#161B22] border border-[#FF4D4D]/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#FF4D4D] font-bold">CRITICAL FLAWS</p>
                  <Shield className="w-4 h-4 text-[#FF4D4D]" />
                </div>
                <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
                  {severityCounts.CRITICAL || 0}
                </p>
                <p className="text-[11px] font-mono text-[#8B949E] mt-1">Requires immediate hotfix</p>
              </div>

              <div className="bg-[#161B22] border border-[#FF9F43]/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#FF9F43] font-bold">SECRET / .ENV LEAKS</p>
                  <KeyRound className="w-4 h-4 text-[#FF9F43]" />
                </div>
                <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
                  {categoryCounts.SECRETS || 0}
                </p>
                <p className="text-[11px] font-mono text-[#8B949E] mt-1">Keys & .env exposures</p>
              </div>

              <div className="bg-[#161B22] border border-[#F2C94C]/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#F2C94C] font-bold">DEBUG & CODE DEFECTS</p>
                  <Bug className="w-4 h-4 text-[#F2C94C]" />
                </div>
                <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
                  {categoryCounts.DEBUG_ERROR || 0}
                </p>
                <p className="text-[11px] font-mono text-[#8B949E] mt-1">Syntax / runtime issues</p>
              </div>

              <div className="bg-[#161B22] border border-[#38BDF8]/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#38BDF8] font-bold">OPTIMIZATION & ARCH</p>
                  <Cpu className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
                  {categoryCounts.OPTIMIZATION || 0}
                </p>
                <p className="text-[11px] font-mono text-[#8B949E] mt-1">Performance bottlenecks</p>
              </div>
            </div>
          )}

          {/* Main Layout: Repository File Tree on Left + Tabbed Findings & Inspector on Right */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
            {/* Left Column: Repository File Browser */}
            <aside className="rounded-xl border border-[#30363D] bg-[#161B22] shadow-xl overflow-hidden sticky top-6">
              <div className="flex items-center justify-between border-b border-[#30363D] px-4 py-3 bg-[#1C2128]">
                <div>
                  <h2 className="font-heading text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
                    <span>Repository Tree</span>
                  </h2>
                  <p className="font-mono text-[11px] text-[#8B949E]">
                    {repoFiles.length} indexed source files
                  </p>
                </div>
                <span className="rounded-md border border-[#7EE787]/30 bg-[#7EE787]/10 px-2 py-0.5 font-mono text-[10px] text-[#7EE787]">
                  INDEXED
                </span>
              </div>
              <div className="p-3">
                <AnimatedFileTree
                  files={repoFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  findings={findings}
                />
              </div>
            </aside>

            {/* Right Column: Interactive Finding Explorer & Source Code Inspector */}
            <div className="space-y-4">
              {/* If there are findings, show Tab switcher. If clean (0 findings), prioritize clean state & direct code inspector */}
              {findings.length > 0 ? (
                <>
                  {/* Primary Switcher: Security Findings vs Code Inspector */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] pb-3">
                    <div className="flex items-center gap-1 border border-[#30363D] bg-[#161B22] rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => setActiveTab('findings')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-heading text-xs font-bold transition ${
                          activeTab === 'findings'
                            ? 'bg-[#21262D] text-[#7EE787] shadow-sm'
                            : 'text-[#8B949E] hover:text-[#F0F6FC]'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>ACTIONABLE ISSUES ({findings.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-heading text-xs font-bold transition ${
                          activeTab === 'code'
                            ? 'bg-[#21262D] text-[#7EE787] shadow-sm'
                            : 'text-[#8B949E] hover:text-[#F0F6FC]'
                        }`}
                      >
                        <FileCode className="w-4 h-4" />
                        <span>SOURCE CODE INSPECTOR</span>
                        {selectedFile && (
                          <span className="hidden sm:inline font-mono text-[10px] text-[#8B949E] truncate max-w-[140px]">
                            ({selectedFile.split('/').pop()})
                          </span>
                        )}
                      </button>
                    </div>

                    <span className="font-mono text-xs text-[#8B949E]">
                      {activeTab === 'findings'
                        ? `${filteredFindings.length} of ${findings.length} issues shown`
                        : `Viewing: ${selectedFile || 'None'}`}
                    </span>
                  </div>

                  {/* View 1: Categorized Security & Diagnostics Findings */}
                  {activeTab === 'findings' && (
                    <div className="space-y-4">
                      {/* Category Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-2 pb-1">
                        <button
                          onClick={() => setSelectedCategory('ALL')}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                            selectedCategory === 'ALL'
                              ? 'bg-[#7EE787]/15 text-[#7EE787] border-[#7EE787]/50'
                              : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                          }`}
                        >
                          All ({findings.length})
                        </button>

                        {categoryCounts.SECRETS > 0 && (
                          <button
                            onClick={() => setSelectedCategory('SECRETS')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                              selectedCategory === 'SECRETS'
                                ? 'bg-[#FF9F43]/20 text-[#FF9F43] border-[#FF9F43]/60'
                                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Secrets & Leaks ({categoryCounts.SECRETS})</span>
                          </button>
                        )}

                        {categoryCounts.SECURITY > 0 && (
                          <button
                            onClick={() => setSelectedCategory('SECURITY')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                              selectedCategory === 'SECURITY'
                                ? 'bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/60'
                                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Security Glitches ({categoryCounts.SECURITY})</span>
                          </button>
                        )}

                        {categoryCounts.DEBUG_ERROR > 0 && (
                          <button
                            onClick={() => setSelectedCategory('DEBUG_ERROR')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                              selectedCategory === 'DEBUG_ERROR'
                                ? 'bg-[#F2C94C]/20 text-[#F2C94C] border-[#F2C94C]/60'
                                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                            }`}
                          >
                            <Bug className="w-3.5 h-3.5" />
                            <span>Debug & Defects ({categoryCounts.DEBUG_ERROR})</span>
                          </button>
                        )}

                        {categoryCounts.OPTIMIZATION > 0 && (
                          <button
                            onClick={() => setSelectedCategory('OPTIMIZATION')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                              selectedCategory === 'OPTIMIZATION'
                                ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/60'
                                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                            }`}
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Architecture ({categoryCounts.OPTIMIZATION})</span>
                          </button>
                        )}
                      </div>

                      {/* Search Bar & Severity Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161B22] border border-[#30363D] rounded-xl p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <Search className="w-4 h-4 text-[#8B949E] shrink-0" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by file, rule, or error description..."
                            className="bg-transparent border-none text-xs text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none w-full font-mono"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="text-xs text-[#8B949E] hover:text-[#F0F6FC] font-mono px-1"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Severity Filters */}
                        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-[#30363D] pt-2 sm:pt-0 sm:pl-3 font-mono text-[11px]">
                          <span className="text-[#8B949E] mr-1 hidden md:inline">Severity:</span>
                          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityType[]).map((sev) => (
                            <button
                              key={sev}
                              onClick={() => setSelectedSeverity(sev)}
                              className={`px-2 py-0.5 rounded border transition ${
                                selectedSeverity === sev
                                  ? 'bg-[#21262D] text-[#F0F6FC] border-[#7EE787] font-bold'
                                  : 'text-[#8B949E] border-[#30363D] hover:text-[#F0F6FC]'
                              }`}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Findings Cards List */}
                      {filteredFindings.length === 0 ? (
                        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-8 text-center font-mono text-xs text-[#8B949E]">
                          No issues match the selected category or search filter.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredFindings.map((f: any) => {
                            const category = f.category || 'SECURITY';
                            return (
                              <div
                                key={f.id}
                                className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 transition hover:border-[#7EE787]/50 hover:shadow-xl group relative overflow-hidden"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-xs">
                                      {/* Category Tag */}
                                      <span
                                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                          category === 'SECRETS'
                                            ? 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/40'
                                            : category === 'DEBUG_ERROR'
                                            ? 'bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/40'
                                            : category === 'OPTIMIZATION'
                                            ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40'
                                            : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40'
                                        }`}
                                      >
                                        {category === 'SECRETS'
                                          ? 'SECRET / LEAK'
                                          : category === 'DEBUG_ERROR'
                                          ? 'CODE DEFECT'
                                          : category === 'OPTIMIZATION'
                                          ? 'OPTIMIZATION'
                                          : 'SECURITY GLITCH'}
                                      </span>

                                      <span className="rounded border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-[#8B949E]">
                                        {f.scanner?.toUpperCase()}
                                      </span>

                                      <span className="text-[#8B949E] truncate max-w-[260px] font-mono">
                                        {f.rule_id}
                                      </span>
                                    </div>

                                    <h3 className="font-heading text-base font-bold text-[#F0F6FC] transition group-hover:text-[#7EE787]">
                                      {f.title}
                                    </h3>

                                    <p className="mt-1 font-sans text-xs text-[#8B949E] leading-relaxed">
                                      {f.description}
                                    </p>

                                    <div className="mt-2 flex items-center gap-2 font-mono text-xs text-[#7EE787]/80">
                                      <FileCode className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">
                                        {f.file_path}:{f.start_line || 1}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Severity Badge */}
                                  <span
                                    className={`shrink-0 rounded border px-3 py-1 font-mono text-xs font-bold ${
                                      f.severity === 'CRITICAL'
                                        ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/30'
                                        : f.severity === 'HIGH'
                                        ? 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/30'
                                        : f.severity === 'MEDIUM'
                                        ? 'bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/30'
                                        : 'bg-[#21262D] text-[#8B949E] border-[#30363D]'
                                    }`}
                                  >
                                    {f.severity}
                                  </span>
                                </div>

                                {/* Code Snippet Box */}
                                {f.code_snippet && (
                                  <div className="mt-3 p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] font-mono text-xs text-[#F0F6FC] overflow-x-auto">
                                    <pre className="whitespace-pre-wrap">{f.code_snippet}</pre>
                                  </div>
                                )}

                                {/* Action Row */}
                                <div className="mt-4 pt-3 border-t border-[#30363D]/60 flex flex-wrap items-center justify-between gap-2">
                                  <button
                                    onClick={() => handleSelectFile(f.file_path)}
                                    className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8B949E] hover:text-[#7EE787] transition cursor-pointer"
                                  >
                                    <FileCode className="h-3.5 w-3.5" />
                                    <span>Inspect in Code Viewer ({f.file_path.split('/').pop()}:{f.start_line || 1})</span>
                                  </button>

                                  <Link
                                    to={`/finding/${f.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#7EE787] text-[#F0F6FC] hover:text-[#0D1117] font-heading font-bold text-xs border border-[#30363D] hover:border-transparent transition"
                                  >
                                    <Sparkles className="h-3.5 w-3.5 text-[#7EE787] group-hover:text-[#0D1117]" />
                                    <span>AI Fix & Unified Diff</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* View 2: File Content & Source Code Inspector */}
                  {activeTab === 'code' && (
                    <div className="space-y-4">
                      <FileContentViewer
                        filePath={selectedFile || repoFiles[0] || 'Unknown'}
                        content={currentContent}
                        findings={findings}
                        onSelectFinding={(findingId) => navigate(`/finding/${findingId}`)}
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Clean Repository State: Minimalist, Verified, Uncluttered */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#3FB950]/40 bg-gradient-to-b from-[#161B22] to-[#0D1117] p-8 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#3FB950]/15 border-2 border-[#3FB950]/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(63,185,80,0.3)]">
                        <CheckCircle2 className="w-9 h-9 text-[#3FB950]" />
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/40 font-bold">
                            ZERO FLAWS DETECTED
                          </span>
                          <span className="font-mono text-xs text-[#8B949E]">
                            Security Grade: <strong className="text-[#7EE787]">A+ (100/100)</strong>
                          </span>
                        </div>
                        <h3 className="font-heading font-black text-xl text-[#F0F6FC] mt-1.5">
                          Verified Clean Repository
                        </h3>
                        <p className="font-sans text-xs text-[#8B949E] mt-1 leading-relaxed max-w-xl">
                          Full AST parsing, secret leak audit, and SAST rules completed. No exposed .env files, leaked API keys, SQL injections, or runtime crashes detected across all {repoFiles.length} indexed files.
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('code')}
                        className="px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#7EE787] text-[#F0F6FC] hover:text-[#0D1117] font-heading font-bold text-xs border border-[#30363D] hover:border-transparent transition flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-[#7EE787] group-hover:text-[#0D1117]" />
                        <span>Inspect Source Files</span>
                      </button>
                    </div>

                    {/* Architecture & Integrity Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#30363D]/60 font-mono text-xs">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                        <span className="text-[#F0F6FC] text-[11px]">Zero .env / Key Leaks</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                        <span className="text-[#F0F6FC] text-[11px]">Zero SAST Injections</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                        <span className="text-[#F0F6FC] text-[11px]">Valid AST Syntax</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1117] border border-[#30363D]">
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                        <span className="text-[#F0F6FC] text-[11px]">Clean Architecture</span>
                      </div>
                    </div>
                  </div>

                  {/* Code Inspector when clean */}
                  <FileContentViewer
                    filePath={selectedFile || repoFiles[0] || 'Unknown'}
                    content={currentContent}
                    findings={findings}
                    onSelectFinding={(findingId) => navigate(`/finding/${findingId}`)}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {scan.status !== 'READY' && scan.status !== 'FAILED' && (
        <CyberScannerAnimation
          target={scan.deployment_target || 'Vercel / Cloud'}
          statusText="Executing multi-layer AST, Secret Leak, SAST & Architecture analysis on isolated clone workspace."
        />
      )}
    </div>
  );
}
