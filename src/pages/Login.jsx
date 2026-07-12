import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Lock, Mail, UtensilsCrossed, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserRole, ROLE_DONO, ROLE_ATENDENTE } from '../lib/roles';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loginCooldown, setLoginCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  const getStoredAttempts = () => {
    try {
      const raw = sessionStorage.getItem('loginAttempts');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { count: 0, until: 0 };
  };

  const setStoredAttempts = (count, until) => {
    try {
      sessionStorage.setItem('loginAttempts', JSON.stringify({ count, until }));
    } catch {}
  };

  const clearStoredAttempts = () => {
    try { sessionStorage.removeItem('loginAttempts'); } catch {}
  };

  const getCooldownDuration = (attempts) => {
    if (attempts >= 5) return 60;
    if (attempts >= 3) return 50;
    return attempts * 5; // 1st=5s, 2nd=10s
  };

  const startCooldownTimer = (sec) => {
    clearCooldown();
    setLoginCooldown(sec);
    cooldownTimer.current = setInterval(() => {
      setLoginCooldown(prev => {
        if (prev <= 1) {
          clearCooldown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearCooldown = () => {
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    setLoginCooldown(0);
  };

  useEffect(() => {
    // Restore cooldown from sessionStorage on mount/refresh
    const saved = getStoredAttempts();
    if (saved.until > Date.now()) {
      const remaining = Math.ceil((saved.until - Date.now()) / 1000);
      startCooldownTimer(remaining);
    } else if (saved.until > 0) {
      clearStoredAttempts();
    }
    return () => clearCooldown();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginCooldown > 0) return;
    setLoading(true);
    setError(null);

    // Small random delay to prevent timing attacks
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const saved = getStoredAttempts();
      const attemptCount = saved.count + 1;
      const duration = getCooldownDuration(attemptCount);
      const until = Date.now() + duration * 1000;
      setStoredAttempts(attemptCount, until);
      startCooldownTimer(duration);

      setError('Erro ao fazer login. Verifique suas credenciais.');
      setLoading(false);
      return;
    }

    if (data?.session) {
      clearStoredAttempts();
      clearCooldown();
      const role = await getUserRole(data.session.user.id, data.session.user.email);
      if (role === ROLE_DONO) {
        navigate('/app');
      } else if (role === ROLE_ATENDENTE) {
        navigate('/app/pos');
      } else {
        setError('Seu usuário não possui permissão de acesso ao sistema.');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-brand-content"
        >
          <div className="login-logo-wrap">
            <UtensilsCrossed size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">Fino Sabor</h1>
          <p className="login-subtitle">Sistema de Gestão</p>
          <div className="login-features">
            {[['🥩', 'Cardápio'], ['💰', 'Caixa'], ['📊', 'Relatórios']].map(([emoji, label]) => (
              <span key={label} className="login-feature">
                <span>{emoji}</span>
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="login-form-wrap">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="login-form-card"
        >
          <button className="login-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>

          <h2 className="login-form-title">Bem-vindo de volta</h2>
          <p className="login-form-sub">Entre com suas credenciais</p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">E-mail</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Senha</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="login-pass-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-error"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="login-submit"
              disabled={loading || loginCooldown > 0}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="login-loading" />
              ) : loginCooldown > 0 ? (
                <>Aguarde {loginCooldown}s</>
              ) : (
                <><LogIn size={18} /> Entrar</>
              )}
            </motion.button>
          </form>

          <p className="login-footer">© 2026 Fino Sabor</p>
        </motion.div>
      </div>

      <style>{`
        .login-page {
          min-height: 100dvh;
          display: flex;
          background: #faf9f7;
        }

        .login-brand {
          flex: 1;
          background: linear-gradient(145deg, #1c1917 0%, #292524 60%, #3d2b1f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-brand::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(245,158,11,0.06);
          top: -120px;
          right: -120px;
        }

        .login-brand::after {
          content: '';
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: rgba(249,115,22,0.06);
          bottom: -100px;
          left: -100px;
        }

        .login-brand-content {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .login-logo-wrap {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(245,158,11,0.3);
        }

        .login-title {
          font-family: Georgia, 'Times New Roman', serif;
          color: white;
          font-size: 2.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }

        .login-subtitle {
          color: rgba(255,255,255,0.45);
          font-size: 0.9rem;
          margin: 0 0 2.5rem;
          font-weight: 500;
        }

        .login-features {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }

        .login-feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255,255,255,0.35);
          font-size: 0.72rem;
          font-weight: 600;
        }

        .login-feature span {
          font-size: 1.5rem;
        }

        .login-form-wrap {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: white;
          box-shadow: -20px 0 60px rgba(0,0,0,0.05);
          position: relative;
        }

        .login-form-card {
          width: 100%;
          max-width: 380px;
        }

        .login-back-btn {
          display: none;
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.15s;
        }

        .login-back-btn:active {
          background: var(--surface-subtle);
        }

        .login-form-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #1c1917;
          margin: 0 0 0.35rem;
          letter-spacing: -0.025em;
        }

        .login-form-sub {
          color: #78716c;
          font-size: 0.88rem;
          margin: 0 0 2rem;
        }

        .login-field {
          margin-bottom: 1.125rem;
        }

        .login-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #57534e;
          margin-bottom: 0.4rem;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 0.875rem;
          color: #a8a29e;
          pointer-events: none;
          flex-shrink: 0;
        }

        .login-input {
          width: 100%;
          height: 48px;
          background: #fafaf9;
          border: 1.5px solid #e7e5e4;
          border-radius: 12px;
          padding: 0 1rem 0 2.75rem;
          color: #1c1917;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          -webkit-appearance: none;
          font-family: inherit;
        }

        .login-input:focus {
          border-color: #f59e0b;
          background: white;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }

        .login-input::placeholder {
          color: #a8a29e;
        }

        .login-pass-toggle {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #a8a29e;
          display: flex;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .login-pass-toggle:hover {
          color: #57534e;
          background: #f5f5f4;
        }

        .login-error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #9f1239;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .login-submit {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(180deg, #f59e0b, #d97706);
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(245,158,11,0.35);
          transition: all 0.15s;
          font-family: inherit;
          margin-top: 0.5rem;
        }

        .login-submit:active {
          transform: scale(0.98);
          box-shadow: 0 2px 8px rgba(245,158,11,0.3);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-loading {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          color: #a8a29e;
          font-size: 0.75rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 820px) {
          .login-page {
            flex-direction: column;
            background: white;
          }

          .login-brand {
            padding: 2.5rem 1.5rem 1.5rem;
            min-height: 200px;
          }

          .login-brand::before {
            width: 300px;
            height: 300px;
            top: -80px;
            right: -80px;
          }

          .login-brand::after {
            width: 200px;
            height: 200px;
            bottom: -60px;
            left: -60px;
          }

          .login-logo-wrap {
            width: 52px;
            height: 52px;
            margin-bottom: 1rem;
            border-radius: 14px;
          }

          .login-logo-wrap svg {
            width: 22px;
            height: 22px;
          }

          .login-title {
            font-size: 1.75rem;
            margin-bottom: 0.25rem;
          }

          .login-subtitle {
            font-size: 0.82rem;
            margin-bottom: 1.5rem;
          }

          .login-features {
            gap: 1.25rem;
          }

          .login-feature {
            font-size: 0.68rem;
          }

          .login-feature span {
            font-size: 1.25rem;
          }

          .login-form-wrap {
            width: 100%;
            padding: 0;
            box-shadow: none;
            background: transparent;
            flex: 1;
            align-items: flex-start;
          }

          .login-form-card {
            max-width: 100%;
            padding: 1.5rem 1.25rem 2rem;
            background: white;
            border-radius: 24px 24px 0 0;
            margin-top: -1.25rem;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.06);
          }

          .login-back-btn {
            display: flex;
          }

          .login-form-title {
            font-size: 1.3rem;
          }

          .login-form-sub {
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
          }

          .login-input {
            height: 46px;
            font-size: 0.9rem;
            border-radius: 10px;
          }

          .login-submit {
            height: 48px;
          }
        }

        @media (max-width: 400px) {
          .login-brand {
            padding: 2rem 1rem 1.25rem;
            min-height: 160px;
          }

          .login-logo-wrap {
            width: 44px;
            height: 44px;
            margin-bottom: 0.75rem;
          }

          .login-title {
            font-size: 1.5rem;
          }

          .login-features {
            gap: 1rem;
          }

          .login-form-card {
            padding: 1.25rem 1rem 1.5rem;
          }

          .login-form-title {
            font-size: 1.15rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
