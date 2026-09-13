import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntroHero } from '../components/IntroHero';
import { SplashCursor } from '../components/SplashCursor';

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((item: any) => item.msg || item.detail || fallback).join('; ');
    }
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async (url: string, deploymentTarget: string) => {
    setErr('');
    if (!url.match(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/)) {
      setErr('Please enter a valid GitHub URL, for example https://github.com/owner/repository');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const r1 = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, deployment_target: deploymentTarget }),
      });
      
      if (!r1.ok) {
        throw new Error(await readApiError(r1, 'Failed to connect repository'));
      }
      
      const repo = await r1.json();
      const r2 = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repository_id: repo.id }),
      });
      
      if (!r2.ok) {
        throw new Error(await readApiError(r2, 'Failed to initiate security scan'));
      }
      const scan = await r2.json();
      navigate(`/scan/${scan.id}`);
    } catch (e: any) {
      setErr(e.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070A0E] overflow-hidden">
      {/* Interactive WebGL Fluid Splash Cursor Background from ReactBits */}
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={15}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE
        COLOR="#054f2a"
      />

      {err && (
        <div className="fixed left-1/2 top-20 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl border border-[#FF6B6B]/40 bg-[#2A1417]/95 px-5 py-3 text-sm text-[#FFD1D1] shadow-2xl shadow-black/40 backdrop-blur-lg">
          {err}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070A0E]/90 backdrop-blur-md">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#7EE787]/20 border-t-[#7EE787] shadow-[0_0_20px_rgba(126,231,135,0.4)]" />
          <p className="text-sm font-semibold text-[#7EE787] tracking-wider font-mono">
            INITIALIZING SCAN WORKSPACE...
          </p>
        </div>
      )}

      <IntroHero onAnalyze={handleAnalyze} />
    </div>
  );
}
