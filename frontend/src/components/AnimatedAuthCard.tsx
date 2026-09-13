import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedAuthCardProps {
  initialMode?: 'login' | 'register';
}

export const AnimatedAuthCard: React.FC<AnimatedAuthCardProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { detail: text || 'Server returned invalid response' };
      }

      if (!response.ok) {
        let errorMessage = mode === 'login' ? 'Invalid email or password' : 'Registration failed';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMessage = data.detail.map((d: any) => d.msg || d.detail || JSON.stringify(d)).join('; ');
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      localStorage.setItem('token', data.access_token);
      if (data.user?.email) {
        localStorage.setItem('user_email', data.user.email);
      } else {
        localStorage.setItem('user_email', email);
      }
      navigate('/dashboard');
    } catch (error: any) {
      setErr(error.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12 bg-[#0D1117]">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(126,231,135,0.18)_0%,_transparent_70%)] blur-[90px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Outer Glow Frame */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#7EE787]/30 via-[#3FB950]/20 to-[#7EE787]/30 blur-md opacity-75" />

        <div className="relative bg-[#161B22]/90 backdrop-blur-xl border border-[#30363D] rounded-2xl p-8 shadow-2xl overflow-hidden">
          {/* Top Logo Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#7EE787]/15 border border-[#7EE787]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(126,231,135,0.2)]">
              <Shield className="w-6 h-6 text-[#7EE787]" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#F0F6FC] tracking-tight">
              DevSec Agent
            </h2>
            <p className="font-mono text-xs text-[#8B949E] mt-1">
              Secure code before it ships
            </p>
          </div>

          {/* Animated Tab Selector (Sign In vs Register) */}
          <div className="relative bg-[#0D1117] border border-[#30363D] rounded-xl p-1 flex items-center mb-6">
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-[#7EE787] shadow-[0_0_12px_rgba(126,231,135,0.4)]"
              initial={false}
              animate={{
                left: mode === 'login' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            <button
              type="button"
              onClick={() => { setMode('login'); setErr(''); }}
              className={`relative z-10 flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${
                mode === 'login' ? 'text-[#0D1117]' : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              SIGN IN
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setErr(''); }}
              className={`relative z-10 flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${
                mode === 'register' ? 'text-[#0D1117]' : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {err && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-[#FF4D4D]/15 border border-[#FF4D4D]/30 rounded-xl text-[#FF4D4D] font-mono text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{err}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="font-mono text-xs text-[#8B949E] block mb-1.5 font-bold uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-[#8B949E] absolute left-3.5 top-3.5 group-focus-within:text-[#7EE787] transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-3 pl-10 pr-4 font-mono text-xs text-[#F0F6FC] placeholder-[#8B949E]/50 focus:outline-none focus:border-[#7EE787] focus:ring-1 focus:ring-[#7EE787]/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-[#8B949E] block mb-1.5 font-bold uppercase tracking-wider">
                {mode === 'login' ? 'Password' : 'Password (Min 8 Characters)'}
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-[#8B949E] absolute left-3.5 top-3.5 group-focus-within:text-[#7EE787] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-3 pl-10 pr-10 font-mono text-xs text-[#F0F6FC] placeholder-[#8B949E]/50 focus:outline-none focus:border-[#7EE787] focus:ring-1 focus:ring-[#7EE787]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#7EE787] text-[#0D1117] font-heading font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#a7f3ad] transition shadow-[0_0_16px_rgba(126,231,135,0.35)] cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>
                {loading
                  ? mode === 'login'
                    ? 'AUTHENTICATING...'
                    : 'CREATING ACCOUNT...'
                  : mode === 'login'
                  ? 'SIGN IN'
                  : 'CREATE ACCOUNT'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[#30363D]/60 text-center font-mono text-[11px] text-[#8B949E]">
            {mode === 'login' ? (
              <span>
                New to DevSecAgent?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-[#7EE787] hover:underline font-bold"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#7EE787] hover:underline font-bold"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
