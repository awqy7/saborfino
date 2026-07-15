import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getUserRole, ROLE_DONO, ROLE_ATENDENTE, ROLE_CHURRASQUEIRO } from '../lib/roles';
import Sidebar from './Sidebar';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const POS = lazy(() => import('../pages/POS'));
const Caixa = lazy(() => import('../pages/Caixa'));
const Relatorios = lazy(() => import('../pages/Relatorios'));
const Settings = lazy(() => import('../pages/Settings'));
const Cozinha = lazy(() => import('../pages/Cozinha'));
const PrintMonitor = lazy(() => import('../pages/PrintMonitor'));
const Balanca = lazy(() => import('../pages/Balanca'));
import { ShoppingCart, UtensilsCrossed, LayoutDashboard, Receipt, BarChart3, Settings as SettingsIcon, Scale } from 'lucide-react';

const ProtectedLayout = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;
    const scrollY = main.scrollTop;
    if (scrollY < 40) {
      setNavHidden(false);
    } else if (scrollY > lastScrollY.current + 10) {
      setNavHidden(true);
    } else if (scrollY < lastScrollY.current - 10) {
      setNavHidden(false);
    }
    lastScrollY.current = scrollY;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          const userRole = await getUserRole(session.user.id, session.user.email);
          setRole(userRole);
        }
      } catch {}
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
          Acesso não disponível
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Não foi possível carregar o sistema.
          <br />Tente novamente mais tarde.
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

  if (role === ROLE_ATENDENTE) {
    return (
      <Suspense fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        <Routes>
          <Route path="/pos" element={<POS />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (role === ROLE_CHURRASQUEIRO) {
    return (
      <Suspense fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        <Routes>
          <Route path="/balanca" element={<Balanca />} />
          <Route path="*" element={<Navigate to="/balanca" replace />} />
        </Routes>
      </Suspense>
    );
  }

  const allowedRoutes = role === ROLE_ATENDENTE
    ? ['/pos', '/cozinha']
    : role === ROLE_CHURRASQUEIRO
    ? ['/balanca']
    : ['/', '/pos', '/balanca', '/cozinha', '/caixa', '/relatorios', '/settings', '/print-monitor'];

  const currentPath = location.pathname;
  const isAllowed = allowedRoutes.some(route => {
    const appRoute = route === '/' ? '/app' : '/app' + route;
    return currentPath === appRoute || currentPath.startsWith(appRoute + '/');
  });

  if (currentPath.startsWith('/app') && !isAllowed) {
    return <Navigate to={'/app' + allowedRoutes[0]} replace />;
  }

  const allNavItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard, roles: [ROLE_DONO] },
    { name: 'Pedidos', path: '/app/pos', icon: ShoppingCart, roles: [ROLE_DONO, ROLE_ATENDENTE] },
    { name: 'Balança', path: '/app/balanca', icon: Scale, roles: [ROLE_DONO] },
    { name: 'Cozinha', path: '/app/cozinha', icon: UtensilsCrossed, roles: [ROLE_DONO, ROLE_ATENDENTE] },
    { name: 'Caixa', path: '/app/caixa', icon: Receipt, roles: [ROLE_DONO] },
    { name: 'Relatórios', path: '/app/relatorios', icon: BarChart3, roles: [ROLE_DONO] },
    { name: 'Config.', path: '/app/settings', icon: SettingsIcon, roles: [ROLE_DONO] },
  ];

  const mobileNavItems = allNavItems.filter(item => item.roles.includes(role)).slice(0, 4);

  return (
    <div className="container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar role={role} sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {!currentPath.includes('/pos') && (
      <nav className={'mobile-bottom-nav' + (navHidden ? ' mobile-bottom-nav-hidden' : '')}>
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const active = (item.path === '/app' && (currentPath === '/app' || currentPath === '/app/'))
            ? true
            : currentPath.startsWith(item.path) && item.path !== '/app';
          return (
            <button
              key={item.path}
              className={'mobile-bottom-nav-item' + (active ? ' active' : '')}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
      )}

      <main className="main-content" ref={mainRef} onScroll={handleScroll}>
        <Suspense fallback={<div className="loading"><div className="loading-spinner" /></div>}>
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
            <Route path="/balanca" element={<Balanca />} />
            <Route path="/cozinha" element={<Cozinha />} />
            <Route path="/print-monitor" element={<PrintMonitor />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default ProtectedLayout;
