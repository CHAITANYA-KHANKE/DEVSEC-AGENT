import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertCircle, ArrowUpRight, History, Server, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/dashboard/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) =>
        r.ok
          ? r.json()
          : r.json().then((j) => {
              throw new Error(j.detail || 'Failed to load dashboard data');
            })
      )
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err)
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 font-mono text-[#FF4D4D] flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Error loading overview: {err}</span>
      </div>
    );

  if (!data)
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 font-mono text-[#8B949E] animate-pulse flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[#7EE787] border-t-transparent rounded-full animate-spin" />
        <span>LOADING SECURITY HEALTH DASHBOARD...</span>
      </div>
    );

  const sev = data.severity_counts || {};
  const scores = data.scores || {};

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#30363D]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#7EE787]">
            <Shield className="w-4 h-4" />
            <span>SECURITY HEALTH METRICS</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-[#F0F6FC] mt-1">
            SECURITY DASHBOARD
          </h1>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            0–100 Deductive scoring matrix based on scan evidence.
          </p>
        </div>

        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-[#7EE787] text-[#0D1117] font-heading font-bold text-xs flex items-center gap-1.5 hover:bg-[#a7f3ad] transition shadow-[0_0_12px_rgba(126,231,135,0.3)]"
        >
          <span>NEW SCAN</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-8">
        {/* Security Health Score Card */}
        <div className="col-span-12 lg:col-span-5 bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#7EE787]" />

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-xs text-[#8B949E] font-bold uppercase tracking-wider">
                Overall Health Score
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#7EE787]/15 text-[#7EE787] border border-[#7EE787]/30">
                LIVE
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-heading font-black text-6xl text-[#F0F6FC]">
                {scores.security ?? 0}
              </span>
              <span className="font-mono text-xl text-[#8B949E]">/ 100</span>
            </div>

            {/* Score Bar */}
            <div className="w-full h-2.5 bg-[#0D1117] rounded-full overflow-hidden mt-4 border border-[#30363D]">
              <div
                className="h-full bg-gradient-to-r from-[#7EE787] to-[#3FB950] transition-all duration-1000"
                style={{ width: `${scores.security ?? 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 font-mono text-xs">
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-center">
              <span className="text-[#8B949E] block text-[10px]">CODE</span>
              <span className="font-bold text-[#F0F6FC]">
                {scores.code_quality ?? 0}
              </span>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-center">
              <span className="text-[#8B949E] block text-[10px]">SECRETS</span>
              <span className="font-bold text-[#F0F6FC]">
                {scores.secrets ?? 0}
              </span>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-center">
              <span className="text-[#8B949E] block text-[10px]">CONFIG</span>
              <span className="font-bold text-[#F0F6FC]">
                {scores.configuration ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Count Grid */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#161B22] border border-[#FF4D4D]/30 rounded-xl p-5 shadow-md">
            <span className="font-mono text-xs text-[#FF4D4D] font-bold">
              CRITICAL
            </span>
            <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
              {sev.CRITICAL || 0}
            </p>
            <span className="font-mono text-[10px] text-[#8B949E] block mt-1">
              P0 — URGENT
            </span>
          </div>

          <div className="bg-[#161B22] border border-[#FF9F43]/30 rounded-xl p-5 shadow-md">
            <span className="font-mono text-xs text-[#FF9F43] font-bold">
              HIGH
            </span>
            <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
              {sev.HIGH || 0}
            </p>
            <span className="font-mono text-[10px] text-[#8B949E] block mt-1">
              P1 — ACTION
            </span>
          </div>

          <div className="bg-[#161B22] border border-[#F2C94C]/30 rounded-xl p-5 shadow-md">
            <span className="font-mono text-xs text-[#F2C94C] font-bold">
              MEDIUM
            </span>
            <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
              {sev.MEDIUM || 0}
            </p>
            <span className="font-mono text-[10px] text-[#8B949E] block mt-1">
              P2 — REVIEW
            </span>
          </div>

          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-md">
            <span className="font-mono text-xs text-[#8B949E] font-bold">
              LOW
            </span>
            <p className="font-heading font-bold text-3xl text-[#F0F6FC] mt-2">
              {sev.LOW || 0}
            </p>
            <span className="font-mono text-[10px] text-[#8B949E] block mt-1">
              P3 — INFO
            </span>
          </div>

          {/* Stats Bar */}
          <div className="col-span-2 sm:col-span-4 bg-[#161B22] border border-[#30363D] rounded-xl p-4 grid grid-cols-3 gap-4 text-center font-mono">
            <div>
              <span className="text-[10px] text-[#8B949E] block">REPOSITORIES</span>
              <span className="font-heading font-bold text-lg text-[#F0F6FC]">
                {data.repositories_count || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] block">TOTAL SCANS</span>
              <span className="font-heading font-bold text-lg text-[#F0F6FC]">
                {data.scans_count || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8B949E] block">FINDINGS DETECTED</span>
              <span className="font-heading font-bold text-lg text-[#F0F6FC]">
                {data.findings_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Section */}
      <div className="mt-8 bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-lg">
        <div className="bg-[#1C2128] border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-[#F0F6FC] flex items-center gap-2">
            <History className="w-4 h-4 text-[#7EE787]" />
            <span>RECENT SCAN HISTORY</span>
          </h2>
          <span className="font-mono text-xs text-[#8B949E]">
            {data.scans_count} Total Scans
          </span>
        </div>

        <div className="p-6 space-y-3">
          {data.recent_scans?.length ? (
            data.recent_scans.map((s: any) => (
              <Link
                key={s.id}
                to={`/scan/${s.id}`}
                className="flex items-center justify-between bg-[#0D1117] border border-[#30363D] hover:border-[#7EE787]/50 rounded-xl p-4 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-center font-mono text-xs text-[#7EE787] font-bold">
                    #{s.id.slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#F0F6FC] group-hover:text-[#7EE787] transition">
                      Scan #{s.id.slice(0, 8)}
                    </h3>
                    <p className="font-mono text-xs text-[#8B949E] mt-0.5">
                      Target: {s.deployment_target || 'Vercel'} · {s.findings_count} Findings
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded font-mono text-xs font-bold border ${
                      s.status === 'READY'
                        ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30'
                        : 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/30'
                    }`}
                  >
                    {s.status}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#8B949E] group-hover:text-[#7EE787] transition" />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 font-mono text-xs text-[#8B949E] border border-dashed border-[#30363D] rounded-xl">
              <p>NO SCANS EXECUTED YET</p>
              <Link
                to="/"
                className="inline-block mt-3 px-4 py-2 rounded bg-[#7EE787] text-[#0D1117] font-bold hover:bg-[#a7f3ad] transition"
              >
                START YOUR FIRST SCAN →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
