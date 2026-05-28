import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Lock, Mail, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserRole, ROLE_DONO, ROLE_ATENDENTE } from '../lib/roles';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#faf9f7',
      overflow: 'hidden',
    }}>
      {/* Left panel - decorative */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #1c1917 0%, #292524 60%, #3d2b1f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(249,115,22,0.06)', bottom: -80, left: -80 }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🍖</div>
          <h2 style={{
            fontFamily: 'Sora, sans-serif',
            color: 'white',
            fontSize: '2.25rem',
            fontWeight: 800,
            marginBottom: '1rem',
            letterSpacing: '-0.03em',
          }}>
            Fino Sabor
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', maxWidth: 280, lineHeight: 1.6 }}>
            O sistema de gestão completo para o seu restaurante
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
            {[['🥩', 'Cardápio'], ['💰', 'Caixa'], ['📊', 'Relatórios']].map(([emoji, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{emoji}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
        background: 'white',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.05)'
      }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}>
              <UtensilsCrossed size={22} color="white" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.1rem', color: '#1c1917' }}>Fino Sabor</div>
              <div style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 500 }}>Sistema de Gestão</div>
            </div>
          </div>

          <h1 style={{ fontFamily: 'Sora', fontSize: '1.625rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1c1917', letterSpacing: '-0.025em' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: '#78716c', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Entre com suas credenciais para continuar
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-wrap">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className="form-input has-icon"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input has-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '0.875rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', padding: 0
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#9f1239',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar no sistema
                </>
              )}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
            >
              ← Voltar ao Cardápio
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            © 2026 Fino Sabor · Todos os direitos reservados
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
