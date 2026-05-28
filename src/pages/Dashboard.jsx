import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Flame,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const stagger = {
  show: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Vendas Hoje',
      value: 'R$ 1.250',
      change: '+12%',
      up: true,
      icon: DollarSign,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    },
    {
      label: 'Pedidos Ativos',
      value: '8',
      change: 'em andamento',
      up: true,
      icon: ShoppingCart,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      accent: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    },
    {
      label: 'Clientes Hoje',
      value: '42',
      change: '+5%',
      up: true,
      icon: Users,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      accent: 'linear-gradient(90deg, #22c55e, #4ade80)',
    },
    {
      label: 'Ticket Médio',
      value: 'R$ 29,76',
      change: '-2%',
      up: false,
      icon: TrendingUp,
      iconBg: '#fdf2f8',
      iconColor: '#9333ea',
      accent: 'linear-gradient(90deg, #a855f7, #c084fc)',
    },
  ];

  const recentOrders = [
    { id: 101, mesa: 'Mesa 04', total: 145.50, status: 'Preparando', tempo: '12 min' },
    { id: 102, mesa: 'Mesa 12', total: 89.90, status: 'Pendente', tempo: '5 min' },
    { id: 103, mesa: 'Viagem', total: 56.00, status: 'Pronto', tempo: '18 min' },
    { id: 104, mesa: 'Mesa 07', total: 210.00, status: 'Preparando', tempo: '8 min' },
  ];

  const statusConfig = {
    'Preparando': { cls: 'badge-warning', label: 'Preparando' },
    'Pendente': { cls: 'badge-info', label: 'Pendente' },
    'Pronto': { cls: 'badge-success', label: 'Pronto' },
  };

  const topItems = [
    { name: 'Picanha Premium', count: 124, emoji: '🥩' },
    { name: 'Cerveja Artesanal', count: 89, emoji: '🍺' },
    { name: 'Costela no Bafo', count: 67, emoji: '🍖' },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Bem-vindo de volta 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Acompanhe as métricas do seu restaurante em tempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <Clock size={14} />
            Hoje
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/pos')}>
            Novo Pedido
            <ArrowUpRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} variants={fadeUp} className="stat-card">
              <div className="stat-card-accent" style={{ background: s.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div className="stat-icon-wrap" style={{ background: s.iconBg }}>
                  <Icon size={20} color={s.iconColor} strokeWidth={2} />
                </div>
                <span className={`stat-change ${s.up ? 'up' : 'down'}`}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.change}
                </span>
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}
      >
        {/* Recent Orders */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pedidos Recentes</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Últimas transações</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/caixa')}>
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div>
            {recentOrders.map((order, i) => {
              const cfg = statusConfig[order.status];
              return (
                <motion.div
                  key={order.id}
                  whileHover={{ backgroundColor: 'var(--neutral-50)' }}
                  style={{ 
                    display: 'grid', gridTemplateColumns: '50px 1fr auto auto auto',
                    alignItems: 'center', gap: '1rem',
                    padding: '0.875rem 1.5rem',
                    borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ 
                    width: 36, height: 36, background: 'var(--amber-50)', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--amber-600)', fontWeight: 700, fontSize: '0.75rem'
                  }}>
                    #{order.id}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.mesa}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <Clock size={11} /> {order.tempo}
                    </div>
                  </div>
                  <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    R$ {order.total.toFixed(2)}
                  </span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top items */}
          <motion.div variants={fadeUp} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={16} color="var(--terra-500)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Mais Vendidos</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {topItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1.5rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.count} vendas</div>
                  </div>
                  <div style={{ 
                    width: 28, height: 28, background: `hsl(${[43,210,145][i]},80%,94%)`,
                    color: `hsl(${[43,210,145][i]},60%,38%)`,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.7rem'
                  }}>
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick action */}
          <motion.div
            variants={fadeUp}
            onClick={() => navigate('/pos')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(245,158,11,0.3)'
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(245,158,11,0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '6rem', opacity: 0.12 }}>🥩</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Novo Pedido</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginBottom: '1rem' }}>Abrir ponto de venda</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>
                Ir para POS <ArrowUpRight size={14} />
              </div>
            </div>
          </motion.div>

          {/* Rating placeholder */}
          <motion.div variants={fadeUp} className="card" style={{ textAlign: 'center' }}>
            <Star size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Avaliação do Dia</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={18} fill={s <= 4 ? '#f59e0b' : 'none'} color={s <= 4 ? '#f59e0b' : 'var(--border-strong)'} />
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4.0 · 42 avaliações hoje</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
