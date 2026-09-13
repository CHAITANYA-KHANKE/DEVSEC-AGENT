import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CuteLampAuth: React.FC = () => {
  // Off by default as requested
  const [lampOn, setLampOn] = useState(false);
  const [cordActive, setCordActive] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const eye1Ref = useRef<HTMLDivElement>(null);
  const eye2Ref = useRef<HTMLDivElement>(null);

  // Toggle lamp
  const toggleLamp = () => {
    setCordActive(true);
    setTimeout(() => setCordActive(false), 160);
    setLampOn((prev) => !prev);
  };

  // Eye tracking cursor logic from the exact code provided
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!lampOn) return;

      [eye1Ref.current, eye2Ref.current].forEach((eye) => {
        if (!eye) return;
        const rect = eye.getBoundingClientRect();
        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;

        const deltaX = e.clientX - eyeX;
        const deltaY = e.clientY - eyeY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(3.5, Math.hypot(deltaX, deltaY) / 30);

        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;

        eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [lampOn]);

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
        data = { detail: text || 'Server error' };
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
      setErr(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`cute-lamp-auth-root ${lampOn ? 'is-on' : ''}`}>
      {/* Scoped CSS matching the exact reference code provided by user */}
      <style>{`
        .cute-lamp-auth-root {
          --bg: #0d0f12;
          --lamp-off: #252b31;
          --lamp-on: #56FF98;
          --glow: rgba(86, 255, 152, 0.65);
          --card-bg: rgba(22, 27, 34, 0.85);
          --accent: #3FB950;
          --text: #ffffff;
          --muted: #8b949e;
          --cord: #888888;

          min-height: calc(100vh - 64px);
          background-color: var(--bg);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          perspective: 1000px;
          padding: 2rem 1rem;
        }

        .cute-lamp-auth-root .lamp-main-container {
          display: flex;
          align-items: center;
          gap: 5rem;
          padding: 1.5rem;
          max-width: 950px;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ====== ENHANCED BIGGER LAMP STYLING ====== */
        .cute-lamp-auth-root .lamp-container {
          position: relative;
          width: 260px;
          height: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          flex-shrink: 0;
        }

        /* Light Glow Beam */
        .cute-lamp-auth-root .lamp-glow {
          position: absolute;
          top: 160px;
          width: 380px;
          height: 360px;
          background: radial-gradient(ellipse at top, var(--glow) 0%, rgba(86, 255, 152, 0) 70%);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .cute-lamp-auth-root.is-on .lamp-glow {
          opacity: 1;
        }

        /* Lamp Shade (Scaled Up & Vibrant Glow) */
        .cute-lamp-auth-root .lamp-shade {
          position: relative;
          width: 200px;
          height: 165px;
          background: var(--lamp-off);
          clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%);
          border-radius: 24px 24px 10px 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background 0.4s ease, box-shadow 0.4s ease;
          z-index: 3;
          cursor: pointer;
        }

        .cute-lamp-auth-root.is-on .lamp-shade {
          background: var(--lamp-on);
          box-shadow: 0 0 45px var(--glow), 0 0 90px rgba(86, 255, 152, 0.4);
        }

        /* Lamp Face */
        .cute-lamp-auth-root .lamp-face {
          position: absolute;
          bottom: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .cute-lamp-auth-root .eyes {
          display: flex;
          gap: 44px;
        }

        .cute-lamp-auth-root .eye {
          width: 17px;
          height: 17px;
          background: #111;
          border-radius: 50%;
          transition: transform 0.2s ease, height 0.2s ease;
        }

        /* Closed/Sleeping eyes when OFF */
        .cute-lamp-auth-root:not(.is-on) .eye {
          height: 4px;
          border-radius: 2px;
          transform: translateY(7px);
          background: #777;
        }

        .cute-lamp-auth-root .mouth {
          width: 22px;
          height: 11px;
          border-bottom: 3px solid #777;
          border-radius: 0 0 14px 14px;
          transition: all 0.3s ease;
        }

        /* Happy face state when ON */
        .cute-lamp-auth-root.is-on .mouth {
          width: 27px;
          height: 15px;
          background: #d85c5c;
          border-radius: 0 0 18px 18px;
          border-bottom: none;
          position: relative;
          overflow: hidden;
        }

        .cute-lamp-auth-root.is-on .mouth::after {
          content: "";
          position: absolute;
          bottom: 0;
          right: 2px;
          width: 15px;
          height: 9px;
          background: #ff8e8e;
          border-radius: 50%;
        }

        /* Pole & Base */
        .cute-lamp-auth-root .lamp-pole {
          width: 12px;
          height: 195px;
          background: #4b5563;
          z-index: 2;
        }

        .cute-lamp-auth-root .lamp-base {
          width: 155px;
          height: 22px;
          background: #374151;
          border-radius: 14px 14px 5px 5px;
          z-index: 2;
          box-shadow: 0 6px 14px rgba(0,0,0,0.6);
        }

        /* Pull Cord / String */
        .cute-lamp-auth-root .lamp-cord {
          position: absolute;
          top: 160px;
          left: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          z-index: 4;
          transition: transform 0.15s ease;
        }

        .cute-lamp-auth-root .lamp-cord.active,
        .cute-lamp-auth-root .lamp-cord:active {
          transform: translateY(20px);
        }

        .cute-lamp-auth-root .cord-string {
          width: 2.5px;
          height: 65px;
          background: var(--cord);
          transition: background 0.2s;
        }

        .cute-lamp-auth-root .lamp-cord:hover .cord-string {
          background: var(--lamp-on);
        }

        .cute-lamp-auth-root .cord-handle {
          width: 12px;
          height: 18px;
          background: #e5e7eb;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transition: background 0.2s;
        }

        .cute-lamp-auth-root .lamp-cord:hover .cord-handle {
          background: var(--lamp-on);
        }

        /* ====== LOGIN CARD ====== */
        .cute-lamp-auth-root .login-card {
          background: var(--card-bg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 2.2rem;
          width: 360px;
          max-width: 100%;
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          opacity: 0.15;
          transform: translateX(30px);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .cute-lamp-auth-root.is-on .login-card {
          opacity: 1;
          transform: translateX(0);
          pointer-events: all;
          border-color: rgba(159, 211, 182, 0.25);
          box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 25px rgba(159, 211, 182, 0.15);
        }

        /* Header DevSec Agent text (Bold, No shield icon, No subtitle) */
        .cute-lamp-auth-root .login-card .devsec-title {
          color: var(--text);
          font-size: 1.85rem;
          font-weight: 800;
          margin-bottom: 1.4rem;
          text-align: center;
          letter-spacing: -0.5px;
          font-family: inherit;
        }

        /* Mode toggle bar (Sign In / Register) */
        .cute-lamp-auth-root .mode-toggle-bar {
          display: flex;
          background: #111418;
          border: 1px solid #30363d;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.5rem;
        }

        .cute-lamp-auth-root .mode-btn {
          flex: 1;
          padding: 0.55rem 0.5rem;
          text-align: center;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--muted);
          background: transparent;
        }

        .cute-lamp-auth-root .mode-btn.active {
          background: var(--lamp-on);
          color: #0d0f12;
          box-shadow: 0 0 12px rgba(159, 211, 182, 0.4);
        }

        .cute-lamp-auth-root .input-group {
          margin-bottom: 1.2rem;
          text-align: left;
        }

        .cute-lamp-auth-root .input-group label {
          display: block;
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 0.45rem;
          letter-spacing: 0.5px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .cute-lamp-auth-root .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cute-lamp-auth-root .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--muted);
          pointer-events: none;
        }

        .cute-lamp-auth-root .input-wrapper input {
          width: 100%;
          padding: 0.78rem 1rem 0.78rem 2.7rem;
          background: #111418;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #ffffff;
          outline: none;
          font-size: 0.92rem;
          transition: border-color 0.3s;
          font-family: inherit;
        }

        .cute-lamp-auth-root .input-wrapper input:focus {
          border-color: var(--accent);
        }

        .cute-lamp-auth-root .toggle-password-btn {
          position: absolute;
          right: 0.85rem;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .cute-lamp-auth-root .toggle-password-btn:hover {
          color: #ffffff;
        }

        .cute-lamp-auth-root .login-btn {
          width: 100%;
          padding: 0.85rem;
          margin-top: 0.6rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(88, 166, 121, 0.3);
        }

        .cute-lamp-auth-root .login-btn:hover {
          filter: brightness(1.1);
        }

        .cute-lamp-auth-root .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className={`lamp-main-container ${lampOn ? 'is-on' : ''}`}>
        {/* ====== INTERACTIVE CUTE LAMP ====== */}
        <div className="lamp-container">
          {/* Light Glow Beam */}
          <div className="lamp-glow" />

          {/* Lamp Shade */}
          <div
            className="lamp-shade"
            onClick={toggleLamp}
            title="Click to toggle lamp"
          >
            <div className="lamp-face">
              <div className="eyes">
                <div ref={eye1Ref} className="eye" />
                <div ref={eye2Ref} className="eye" />
              </div>
              <div className="mouth" />
            </div>
          </div>

          {/* Cord to pull/toggle lamp */}
          <div
            className={`lamp-cord ${cordActive ? 'active' : ''}`}
            onClick={toggleLamp}
            title="Click to pull cord"
          >
            <div className="cord-string" />
            <div className="cord-handle" />
          </div>

          <div className="lamp-pole" />
          <div className="lamp-base" />

          {/* Hint text below lamp */}
          <div
            onClick={toggleLamp}
            style={{
              marginTop: '12px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: lampOn ? '#8b949e' : '#9fd3b6',
              cursor: 'pointer',
              fontWeight: lampOn ? 'normal' : 'bold',
            }}
          >
            {lampOn ? '● PULL CORD TO TURN OFF' : '💡 PULL CORD TO TURN ON'}
          </div>
        </div>

        {/* ====== LOGIN CARD ====== */}
        <div
          className="login-card"
          onClick={() => {
            if (!lampOn) toggleLamp();
          }}
        >
          {/* Bold Title without shield icon and without subtitle */}
          <h2 className="devsec-title">DevSec Agent</h2>

          {/* Sign In / Register toggle buttons */}
          <div className="mode-toggle-bar">
            <button
              type="button"
              className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErr('');
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setErr('');
              }}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {err && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '0.65rem',
                    marginBottom: '1rem',
                    background: 'rgba(255, 77, 77, 0.15)',
                    border: '1px solid rgba(255, 77, 77, 0.3)',
                    borderRadius: '8px',
                    color: '#ff6b6b',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">
                {mode === 'login' ? 'PASSWORD' : 'PASSWORD (MIN 8 CHARACTERS)'}
              </label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  minLength={mode === 'register' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                'AUTHENTICATING...'
              ) : mode === 'login' ? (
                'SIGN IN →'
              ) : (
                'CREATE ACCOUNT →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
