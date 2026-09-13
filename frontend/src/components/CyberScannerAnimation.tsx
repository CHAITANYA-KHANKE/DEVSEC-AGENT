import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Terminal, Shield, KeyRound, Bug, CheckCircle2, Sparkles } from 'lucide-react';

interface CyberScannerAnimationProps {
  statusText?: string;
  target?: string;
}

export const CyberScannerAnimation: React.FC<CyberScannerAnimationProps> = ({
  statusText = 'Analyzing repository AST structure, secrets, and security posture...',
  target = 'Vercel / Cloud',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const steps = [
    { title: 'ISOLATING SANDBOX', desc: 'Cloning repository in ephemeral memory-safe sandbox...' },
    { title: 'AST SYNTAX & ARCHITECTURE', desc: 'Validating Abstract Syntax Tree and codebase structure...' },
    { title: 'SECRETS & LEAKS AUDIT', desc: 'Detecting committed .env files, credentials, and API keys...' },
    { title: 'SAST & VULNERABILITY HEURISTICS', desc: 'Inspecting SQL queries, command execution, and auth flows...' },
    { title: 'AI CONTEXT & REMEDIATION', desc: 'Compiling security ratings, health metrics, and unified diffs...' },
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2400);
    return () => clearInterval(stepInterval);
  }, [steps.length]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#30363D] bg-gradient-to-b from-[#161B22] via-[#10141A] to-[#0D1117] p-6 sm:p-10 shadow-2xl">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#30363D_1px,transparent_1px)] [background-size:22px_22px] opacity-35 pointer-events-none" />

      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(126,231,135,0.14)_0%,_transparent_70%)] blur-[90px] pointer-events-none" />

      {/* Top Status Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#30363D]/60 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#7EE787]/15 border border-[#7EE787]/30 text-[#7EE787]">
            <Cpu className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7EE787] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7EE787]" />
            </span>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#F0F6FC] tracking-wide flex items-center gap-2">
              SECURITY AUDIT IN PROGRESS
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#7EE787]/10 text-[#7EE787] border border-[#7EE787]/20 font-normal">
                LIVE PIPELINE
              </span>
            </h3>
            <p className="font-mono text-[11px] text-[#8B949E]">
              Target: <span className="text-[#7EE787] font-semibold">{target}</span> · Sandboxed SAST & Architecture Analyzer
            </p>
          </div>
        </div>

        {/* Live Radar Animation */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#8B949E]">
          <div className="relative w-7 h-7 rounded-full border border-[#7EE787]/40 bg-[#0D1117] flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(126,231,135,0.2)]">
            <div className="absolute w-2 h-2 rounded-full bg-[#7EE787]/30" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(126,231,135,0.7)_60deg,_transparent_60deg)] rounded-full"
            />
            <div className="w-1.5 h-1.5 rounded-full bg-[#7EE787] z-10 shadow-[0_0_6px_#7EE787]" />
          </div>
          <span className="hidden sm:inline text-[11px] text-[#7EE787] font-semibold">
            SCANNING TELEMETRY
          </span>
        </div>
      </div>

      {/* 3D ISOMETRIC CUBE SCANNER ANIMATION */}
      <div className="relative z-10 my-6 sm:my-8 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] overflow-hidden">
        {/* Floating Telemetry Badge Particles */}
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none overflow-hidden hidden sm:block">
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: -380, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: 'linear', delay: 0.2 }}
            className="absolute top-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF4D4D]/15 border border-[#FF4D4D]/40 text-[#FF4D4D] font-mono text-[10px]"
          >
            <Shield className="w-3 h-3" />
            <span>SAST_QUERY_INSPECTION</span>
          </motion.div>

          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: -380, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ repeat: Infinity, duration: 5.4, ease: 'linear', delay: 1.9 }}
            className="absolute top-16 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF9F43]/15 border border-[#FF9F43]/40 text-[#FF9F43] font-mono text-[10px]"
          >
            <KeyRound className="w-3 h-3" />
            <span>AUDITING_ENV_LEAKS</span>
          </motion.div>

          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: -380, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ repeat: Infinity, duration: 5.1, ease: 'linear', delay: 3.4 }}
            className="absolute top-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7EE787]/15 border border-[#7EE787]/40 text-[#7EE787] font-mono text-[10px]"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>AST_PARSER_ACTIVE</span>
          </motion.div>
        </div>

        {/* 3D Isometric Rubik's Cube Root Container */}
        <div className="isometric-cube-wrapper scale-[0.82] sm:scale-100 origin-center transition-transform">
          <style>{`
            .isometric-cube-wrapper {
              position: relative;
              width: 220px;
              height: 220px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .cube-scene {
              position: relative;
              width: 120px;
              height: 120px;
              transform-style: preserve-3d;
              transform: rotateX(60deg) rotateZ(45deg);
              animation: cube-spin 8s infinite linear;
            }

            @keyframes cube-spin {
              0% { transform: rotateX(60deg) rotateZ(45deg); }
              100% { transform: rotateX(60deg) rotateZ(405deg); }
            }

            .cube-layer {
              position: absolute;
              inset: 0;
              transform-style: preserve-3d;
            }

            .layer-h1 { transform: translateZ(44px); }
            .layer-h2 { transform: translateZ(0px); }
            .layer-h3 { transform: translateZ(-44px); }

            .isometric-cube {
              position: absolute;
              width: 32px;
              height: 32px;
              transform-style: preserve-3d;
              animation: cube-pulse 2.2s infinite ease-in-out alternate;
            }

            @keyframes cube-pulse {
              0%, 100% {
                transform: scale3d(1, 1, 1);
              }
              50% {
                transform: scale3d(0.85, 0.85, 1.25);
              }
            }

            /* Positioning 3x3 grid per layer */
            .pos-1-1 { top: 0px; left: 0px; animation-delay: 0.1s; }
            .pos-1-2 { top: 0px; left: 40px; animation-delay: 0.2s; }
            .pos-1-3 { top: 0px; left: 80px; animation-delay: 0.3s; }
            
            .pos-2-1 { top: 40px; left: 0px; animation-delay: 0.2s; }
            .pos-2-2 { top: 40px; left: 40px; animation-delay: 0.3s; }
            .pos-2-3 { top: 40px; left: 80px; animation-delay: 0.4s; }

            .pos-3-1 { top: 80px; left: 0px; animation-delay: 0.3s; }
            .pos-3-2 { top: 80px; left: 40px; animation-delay: 0.4s; }
            .pos-3-3 { top: 80px; left: 80px; animation-delay: 0.5s; }

            .cube-face {
              position: absolute;
              width: 32px;
              height: 32px;
              border: 1px solid rgba(126, 231, 135, 0.4);
              box-shadow: 0 0 10px rgba(126, 231, 135, 0.2) inset;
              backface-visibility: visible;
            }

            /* Top Face: Glowing Green */
            .cube-face.face-top {
              background: linear-gradient(135deg, rgba(126, 231, 135, 0.95), rgba(63, 185, 80, 0.85));
              transform: translateZ(32px);
              box-shadow: 0 0 12px rgba(126, 231, 135, 0.5);
            }

            /* Left Face: Cyan / Darker Emerald */
            .cube-face.face-left {
              background: linear-gradient(180deg, rgba(35, 134, 54, 0.9), rgba(16, 70, 30, 0.95));
              transform: rotateY(-90deg) translateZ(0px);
              transform-origin: left;
            }

            /* Right Face: Teal / Amber Highlight */
            .cube-face.face-right {
              background: linear-gradient(180deg, rgba(46, 160, 67, 0.85), rgba(20, 90, 40, 0.95));
              transform: rotateX(90deg) translateZ(-32px);
              transform-origin: top;
            }

            /* Ambient Base Shadow */
            .isometric-base-glow {
              position: absolute;
              width: 140px;
              height: 140px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(126, 231, 135, 0.35) 0%, transparent 70%);
              transform: rotateX(60deg) rotateZ(45deg) translateZ(-70px);
              filter: blur(12px);
            }
          `}</style>

          {/* Glowing Shadow Disc under the 3D scene */}
          <div className="isometric-base-glow" />

          {/* 3D Scene */}
          <div className="cube-scene">
            {/* Top Tier: Layer 1 */}
            <div className="cube-layer layer-h1">
              {['pos-1-1', 'pos-1-2', 'pos-1-3', 'pos-2-1', 'pos-2-2', 'pos-2-3', 'pos-3-1', 'pos-3-2', 'pos-3-3'].map((posClass, idx) => (
                <div key={`h1-${idx}`} className={`isometric-cube ${posClass}`}>
                  <div className="cube-face face-top" />
                  <div className="cube-face face-left" />
                  <div className="cube-face face-right" />
                </div>
              ))}
            </div>

            {/* Middle Tier: Layer 2 */}
            <div className="cube-layer layer-h2">
              {['pos-1-1', 'pos-1-2', 'pos-1-3', 'pos-2-1', 'pos-2-2', 'pos-2-3', 'pos-3-1', 'pos-3-2', 'pos-3-3'].map((posClass, idx) => (
                <div key={`h2-${idx}`} className={`isometric-cube ${posClass}`}>
                  <div className="cube-face face-top" />
                  <div className="cube-face face-left" />
                  <div className="cube-face face-right" />
                </div>
              ))}
            </div>

            {/* Bottom Tier: Layer 3 */}
            <div className="cube-layer layer-h3">
              {['pos-1-1', 'pos-1-2', 'pos-1-3', 'pos-2-1', 'pos-2-2', 'pos-2-3', 'pos-3-1', 'pos-3-2', 'pos-3-3'].map((posClass, idx) => (
                <div key={`h3-${idx}`} className={`isometric-cube ${posClass}`}>
                  <div className="cube-face face-top" />
                  <div className="cube-face face-left" />
                  <div className="cube-face face-right" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Step Status Caption */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#7EE787] animate-ping" />
            <p className="font-mono text-xs text-[#F0F6FC] font-bold">
              {steps[currentStep].title}
              <span className="text-[#7EE787]">{dots}</span>
            </p>
          </div>
          <p className="font-mono text-[11px] text-[#8B949E] mt-2 max-w-md mx-auto">
            {steps[currentStep].desc}
          </p>
        </div>
      </div>

      {/* Terminal Telemetry Log Box */}
      <div className="relative z-10 mt-6 rounded-xl border border-[#30363D] bg-[#0D1117] p-4 shadow-inner">
        <div className="flex items-center justify-between border-b border-[#30363D]/60 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#7EE787]" />
            <span className="font-mono text-[11px] text-[#8B949E] font-bold tracking-wider">
              REAL-TIME SCAN ENGINE LOGS
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#7EE787]">
            STEP {currentStep + 1} OF {steps.length}
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 transition-opacity duration-300 ${
                  isCurrent
                    ? 'text-[#7EE787] font-bold'
                    : isDone
                    ? 'text-[#8B949E]'
                    : 'text-[#484F58] opacity-50'
                }`}
              >
                <span>{isDone ? '✔' : isCurrent ? '►' : '○'}</span>
                <span className="truncate">{step.title}</span>
                {isCurrent && (
                  <span className="text-[10px] bg-[#7EE787]/15 text-[#7EE787] px-1.5 py-0.2 rounded border border-[#7EE787]/30">
                    RUNNING
                  </span>
                )}
                {isDone && <span className="text-[10px] text-[#3FB950]">PASSED</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
