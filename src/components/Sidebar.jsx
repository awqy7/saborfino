import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt,
  BarChart3, 
  Settings, 
  LogOut,
  UtensilsCrossed,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

import { ROLE_DONO, ROLE_ATENDENTE } from '../lib/roles';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard, label: 'Visão Geral', roles: [ROLE_DONO] },
    { name: 'Pedidos', path: '/app/pos', icon: ShoppingCart, label: 'Ponto de Venda', roles: [ROLE_DONO, ROLE_ATENDENTE] },
    { name: 'Cozinha', path: '/app/cozinha', icon: UtensilsCrossed, label: 'Painel da Cozinha', roles: [ROLE_DONO, ROLE_ATENDENTE] },
    { name: 'Caixa', path: '/app/caixa', icon: Receipt, label: 'Controle Financeiro', roles: [ROLE_DONO] },
    { name: 'Relatórios', path: '/app/relatorios', icon: BarChart3, label: 'Análises', roles: [ROLE_DONO] },
    { name: 'Configurações', path: '/app/settings', icon: Settings, label: 'Sistema', roles: [ROLE_DONO] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      {/* Brand */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sidebar-brand"
      >
        <div className="brand-logo">
          <UtensilsCrossed size={20} color="white" strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <div className="brand-name">Fino Sabor</div>
          <div className="brand-sub">Sistema de Gestão</div>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-label">Menu Principal</div>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <NavLink
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span style={{ flex: 1 }}>{item.name}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          background: role === ROLE_DONO ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${role === ROLE_DONO ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
        }}>
          <div style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: role === ROLE_DONO ? 'var(--primary)' : 'var(--info)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: role === ROLE_DONO ? 'var(--amber-400)' : '#60a5fa',
          }}>
            {role === ROLE_DONO ? 'Dono' : 'Atendente'}
          </span>
        </div>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ color: '#f87171', width: '100%' }}
        >
          <span className="nav-icon">
            <LogOut size={18} strokeWidth={2} />
          </span>
          <span style={{ flex: 1 }}>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
