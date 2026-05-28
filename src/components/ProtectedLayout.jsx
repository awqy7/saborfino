import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getUserRole, ROLE_DONO, ROLE_ATENDENTE } from '../lib/roles';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import POS from '../pages/POS';
import Caixa from '../pages/Caixa';
import Relatorios from '../pages/Relatorios';
import Settings from '../pages/Settings';
import Cozinha from '../pages/Cozinha';

const ProtectedLayout = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          const userRole = await getUserRole(session.user.id, session.user.email);
          setRole(userRole);
        }
      } catch (err) {
        console.error('ProtectedLayout init error:', err);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const userRole = await getUserRole(session.user.id, session.user.email);
        setRole(userRole);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
          Carregando sistema...
        </span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!role) {
    return (
      <div className="loading" style={{ flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: 64, height: 64,
          background: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-full)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
          Acesso não autorizado
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Seu usuário não possui permissão de acesso ao sistema.
          <br />Entre em contato com o administrador.
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => supabase.auth.signOut()}
          style={{ marginTop: '1rem' }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const allowedRoutes = role === ROLE_ATENDENTE
    ? ['/pos', '/cozinha']
    : ['/', '/pos', '/cozinha', '/caixa', '/relatorios', '/settings'];

  const currentPath = location.pathname;
  const isAllowed = allowedRoutes.some(route => {
    const appRoute = route === '/' ? '/app' : `/app${route}`;
    return currentPath === appRoute || currentPath.startsWith(appRoute + '/');
  });

  if (currentPath.startsWith('/app') && !isAllowed) {
    return <Navigate to={`/app${allowedRoutes[0]}`} replace />;
  }

  return (
    <div className="container">
      <Sidebar role={role} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {role === ROLE_DONO && (
            <>
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}
          <Route path="/pos" element={<POS />} />
          <Route path="/cozinha" element={<Cozinha />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default ProtectedLayout;
