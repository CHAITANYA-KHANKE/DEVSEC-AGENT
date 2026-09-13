import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GitBranch, LockKeyhole, Network, Server, Sparkles, Terminal, ShieldAlert } from "lucide-react";

interface IntroHeroProps {
  onAnalyze: (url: string, target: string) => void;
}

const TARGETS = [
  { name: "Vercel", icon: Network },
  { name: "Netlify", icon: Server },
  { name: "Render", icon: LockKeyhole },
];

export const IntroHero: React.FC<IntroHeroProps> = ({ onAnalyze }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("Vercel");
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowIntro(false), 1600);
    return () => {
      window.clearTimeout(introTimer);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = repoUrl.trim();
    if (!normalizedUrl) return;
    onAnalyze(normalizedUrl, selectedTarget);
  };

  return (
    <main className="relative isolate min-h-[calc(100vh-65px)] flex items-center justify-center overflow-hidden bg-transparent text-[#F4F7FB]">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#070A0E]/95 backdrop-blur-2xl text-[#F4F7FB]"
            onClick={() => setShowIntro(false)}
          >
            <div className="absolute h-[420px] w-[680px] max-w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(126,231,135,0.3),transparent_68%)] blur-3xl pointer-events-none" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative mb-6 flex items-center gap-3"
            >
              {[0, 1, 2, 3, 4].map((dot) => (
                <motion.span
                  key={dot}
                  className="h-2.5 w-2.5 rounded-full bg-[#7EE787] shadow-[0_0_16px_rgba(126,231,135,0.9)]"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.12 }}
                />
              ))}
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative font-heading text-5xl font-black text-[#7EE787] drop-shadow-[0_0_36px_rgba(126,231,135,0.6)] sm:text-7xl tracking-tight"
            >
              DevSec Agent
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="relative mt-4 text-xs font-mono font-semibold uppercase tracking-widest text-[#8B949E]"
            >
              Secure code before it ships
            </motion.p>

            <span className="absolute bottom-8 text-[11px] font-mono uppercase text-[#607080] tracking-wider">
              Click anywhere to start
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: showIntro ? 0 : 1,
          y: showIntro ? 16 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center sm:px-6"
      >
        {/* Glowing Title Section */}
        <div className="relative mb-2">
          <div className="absolute -inset-6 rounded-full bg-[#7EE787]/15 blur-3xl pointer-events-none" />
          <h1 className="relative font-heading text-4xl sm:text-6xl md:text-7xl font-black leading-tight text-[#7EE787] drop-shadow-[0_0_32px_rgba(126,231,135,0.45)] tracking-tight">
            DevSec Agent
          </h1>
          <p className="relative mt-2 text-xs sm:text-sm font-mono font-semibold uppercase tracking-widest text-[#8B949E]">
            Secure code before it ships
          </p>
        </div>

        {/* Glassmorphic Scanner Launch Card */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 sm:mt-8 w-full max-w-2xl rounded-2xl border border-[#30363D]/80 bg-[#101720]/80 p-4 sm:p-7 text-left shadow-[0_16px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition hover:border-[#7EE787]/50 relative group"
        >
          {/* Subtle Cyber Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(126,231,135,0.1),transparent_70%)] pointer-events-none" />

          <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-[#AAB6C4]" htmlFor="repo-url">
            Enter GitHub repository URL
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <GitBranch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7EE787]" />
              <input
                id="repo-url"
                type="url"
                required
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#30363D] bg-[#070A0E]/90 pl-10 pr-3 font-mono text-xs text-[#F4F7FB] outline-none transition placeholder:text-[#667282] focus:border-[#7EE787] focus:ring-2 focus:ring-[#7EE787]/20 shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7EE787] to-[#3FB950] px-6 text-xs font-heading font-bold text-[#07110A] shadow-[0_0_20px_rgba(126,231,135,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(126,231,135,0.55)] active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Start scan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-[#30363D]/60">
            <p className="mb-2.5 text-xs font-mono font-medium text-[#8B949E]">Deployment target</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {TARGETS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedTarget(name)}
                  className={`flex h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border px-2 sm:px-3 text-xs font-heading font-semibold transition cursor-pointer ${
                    selectedTarget === name
                      ? "border-[#7EE787] bg-[#7EE787]/15 text-[#7EE787] shadow-[0_0_14px_rgba(126,231,135,0.25)]"
                      : "border-[#30363D]/80 bg-[#0D131B]/70 text-[#8B949E] hover:border-[#484F58] hover:text-[#F4F7FB]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </motion.section>
    </main>
  );
};

