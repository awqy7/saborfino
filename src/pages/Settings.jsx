import React from 'react';
import { User, Bell, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    title: 'Perfil do Restaurante',
    description: 'Nome, CNPJ, endereço e contato do estabelecimento',
    icon: User,
    iconBg: '#fef3c7',
    iconColor: '#b45309',
    badge: null,
  },
  {
    title: 'Notificações',
    description: 'Alertas de pedidos, fechamento de caixa e avisos do sistema',
    icon: Bell,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    badge: '2 novas',
  },
  {
    title: 'Segurança',
    description: 'Gerenciamento de senhas, acessos e permissões de usuário',
    icon: Shield,
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    badge: null,
  },
];

const Settings = () => {
  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Gerencie as preferências e configurações do sistema
        </p>
      </div>

      {/* Profile quick info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ 
          marginBottom: '1.5rem', 
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.5rem 2rem',
          maxWidth: '720px'
        }}
      >
        <div style={{ 
          width: 64, height: 64,
          background: 'linear-gradient(135deg, var(--amber-500), var(--terra-500))',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          flexShrink: 0
          }}>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.1rem', color: 'white', marginBottom: '0.25rem' }}>
            Fino Sabor
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Plano Premium · Ativo desde 2024
          </div>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>
          Editar perfil
        </button>
      </motion.div>

      {/* Settings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: '720px' }}>
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 + 0.2 }}
              className="card"
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1.125rem',
                cursor: 'pointer', padding: '1.125rem 1.25rem',
                transition: 'all 0.15s'
              }}
              whileHover={{ x: 4 }}
            >
              <div style={{ 
                width: 44, height: 44, borderRadius: 12,
                background: section.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={20} color={section.iconColor} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{section.title}</span>
                  {section.badge && (
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{section.badge}</span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{section.description}</p>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </motion.div>
          );
        })}
      </div>

      {/* Footer info */}
      <div style={{ marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border)', display: 'flex', gap: '2rem', maxWidth: 720 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Versão do sistema
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>v2.1.0</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Última atualização
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Hoje, 20:45</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
