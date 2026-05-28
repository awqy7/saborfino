import React from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Download,
  BarChart2,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const Relatorios = () => {
  const topProducts = [
    { name: 'Picanha Premium', sales: 124, revenue: 11147.60, growth: '+12%', up: true, emoji: '🥩' },
    { name: 'Cerveja Artesanal', sales: 89, revenue: 1602.00, growth: '+5%', up: true, emoji: '🍺' },
    { name: 'Costela no Bafo', sales: 67, revenue: 4355.00, growth: '-2%', up: false, emoji: '🍖' },
    { name: 'Suco Natural', sales: 45, revenue: 540.00, growth: '+8%', up: true, emoji: '🥤' },
    { name: 'Arroz Carreteiro', sales: 38, revenue: 836.00, growth: '+3%', up: true, emoji: '🍚' },
  ];

  const weekData = [45, 60, 35, 80, 55, 90, 75];
  const maxWeek = Math.max(...weekData);
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const donutSegments = [
    { label: 'Carnes', pct: 60, color: 'var(--primary)' },
    { label: 'Bebidas', pct: 25, color: '#3b82f6' },
    { label: 'Acompanham.', pct: 15, color: '#a855f7' },
  ];

  const insights = [
    { icon: TrendingUp, label: 'Ticket médio subiu', sub: '+15% nesta semana', color: 'var(--success)', bg: 'var(--sage-50)' },
    { icon: TrendingDown, label: 'Espera no sábado', sub: 'Tempo médio aumentou', color: 'var(--danger)', bg: '#fff1f2' },
    { icon: Award, label: 'Melhor dia: Sábado', sub: 'R$ 2.340 em vendas', color: '#f59e0b', bg: 'var(--amber-50)' },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Relatórios</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Análise completa do desempenho do restaurante
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <Calendar size={14} />
            Últimos 30 dias
          </button>
          <button className="btn btn-success btn-sm">
            <Download size={14} />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Vendas por Categoria</h3>
            <BarChart2 size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'conic-gradient(var(--primary) 0% 60%, #3b82f6 60% 85%, #a855f7 85% 100%)',
              position: 'relative',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 80, height: 80,
                background: 'white', borderRadius: '50%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px var(--border)'
              }}>
                <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>60%</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>carnes</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {donutSegments.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Faturamento Semanal</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, background: 'var(--sage-50)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
              <ArrowUpRight size={11} style={{ display: 'inline' }} /> +18% vs semana passada
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 180, padding: '0 0.5rem' }}>
            {weekData.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {Math.round(h * 40 / 10) * 10}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(h / maxWeek) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    borderRadius: '6px 6px 0 0',
                    background: i === 5 
                      ? 'linear-gradient(180deg, var(--primary), var(--accent))'
                      : 'var(--amber-100)',
                    minHeight: 4,
                    transition: 'background 0.2s'
                  }}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: i === 5 ? 700 : 500, color: i === 5 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {days[i]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Top Produtos</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Ranking de vendas no período</p>
          </div>
          {topProducts.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ 
                width: 32, height: 32, flexShrink: 0,
                background: i === 0 ? '#fef3c7' : 'var(--surface-subtle)',
                color: i === 0 ? 'var(--amber-700)' : 'var(--text-muted)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.75rem', fontFamily: 'Sora'
              }}>
                #{i + 1}
              </div>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sales} vendas</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.9rem' }}>R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, fontSize: '0.72rem', fontWeight: 700, color: p.up ? 'var(--success)' : 'var(--danger)' }}>
                  {p.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {p.growth}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: ins.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={ins.color} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{ins.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ins.sub}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Relatorios;
