import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  BarChart2,
  Award,
  DollarSign,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const DAYS_ORDER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORY_COLORS = {
  'Chapas': 'var(--primary)',
  'Espetos 500g/1kg': '#f97316',
  'Porções': '#8b5cf6',
  'Entradas': '#3b82f6',
  'Espetinhos': '#ec4899',
  'Guarnições': '#14b8a6',
  'Pães de Alho': '#f59e0b',
  'Bebidas': '#06b6d4',
  'Drinks': '#a855f7',
};
const CATEGORY_FALLBACK_COLORS = ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'];

function getDateRange(days) {
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getCategoryColor(cat, idx) {
  return CATEGORY_COLORS[cat] || CATEGORY_FALLBACK_COLORS[idx % CATEGORY_FALLBACK_COLORS.length];
}

function buildWeekLabels(periodDays) {
  const labels = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push({ date: d.toISOString().slice(0, 10), dayName: DAYS_ORDER[d.getDay()] });
  }
  const grouped = {};
  labels.forEach(l => { grouped[l.dayName] = (grouped[l.dayName] || 0) + 1; });
  return Object.entries(grouped).map(([day]) => day);
}

const Relatorios = () => {
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    categorySales: [],
    weekRevenue: [],
    topProducts: [],
    totalOrders: 0,
    totalRevenue: 0,
    avgTicket: 0,
    busiestDay: null,
    maxRevenue: 1,
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    setLoading(true);
    try {
      const { start, end } = getDateRange(period);

      const { data: orders } = await supabase
        .from('pedidos')
        .select('total, itens, created_at, status')
        .gte('created_at', start)
        .lte('created_at', end);

      if (!orders || orders.length === 0) {
        setData({ categorySales: [], weekRevenue: [], topProducts: [], totalOrders: 0, totalRevenue: 0, avgTicket: 0, busiestDay: null, maxRevenue: 1 });
        setLoading(false);
        return;
      }

      const paidOrders = orders.filter(o => o.status === 'pago');
      const allOrders = orders;

      // Category aggregation from itens
      const catMap = {};
      (allOrders || []).forEach(o => {
        (o.itens || []).forEach(item => {
          const cat = item.category || 'Outros';
          catMap[cat] = (catMap[cat] || 0) + (item.quantity || 1);
        });
      });
      const totalItems = Object.values(catMap).reduce((a, b) => a + b, 0);
      const categorySales = Object.entries(catMap)
        .map(([label, count]) => ({ label, count, pct: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

      // Weekly revenue (by day of week)
      const dayRevenue = {};
      (paidOrders.length > 0 ? paidOrders : allOrders).forEach(o => {
        const d = new Date(o.created_at);
        const dayName = DAYS_ORDER[d.getDay()];
        dayRevenue[dayName] = (dayRevenue[dayName] || 0) + (Number(o.total) || 0);
      });
      const weekRevenue = DAYS_ORDER.map(day => ({
        day,
        revenue: dayRevenue[day] || 0,
      }));
      const maxRevenue = Math.max(...weekRevenue.map(w => w.revenue), 1);

      // Top products
      const prodMap = {};
      (allOrders || []).forEach(o => {
        (o.itens || []).forEach(item => {
          const name = item.name || 'Item';
          prodMap[name] = (prodMap[name] || 0) + (item.quantity || 1);
        });
      });
      const topProducts = Object.entries(prodMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({ rank: i + 1, name, count }));

      // Insights
      const relevantForTicket = paidOrders.length > 0 ? paidOrders : allOrders;
      const totalRev = relevantForTicket.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      const avgTicket = relevantForTicket.length > 0 ? totalRev / relevantForTicket.length : 0;

      // Busiest day (by order count)
      const dayCount = {};
      allOrders.forEach(o => {
        const dayName = DAYS_ORDER[new Date(o.created_at).getDay()];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      });
      const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0] || null;

        setData({
          categorySales,
          weekRevenue,
          topProducts,
          totalOrders: allOrders.length,
          totalRevenue: totalRev,
          avgTicket,
          busiestDay,
          maxRevenue,
        });
    } catch (err) {
      // erro silencioso em produção
    } finally {
      setLoading(false);
    }
  }

  const hasData = data.totalOrders > 0;

  const insights = useMemo(() => {
    const list = [];
    if (!hasData) return list;
    list.push({
      icon: TrendingUp,
      label: `${data.totalOrders} pedidos no período`,
      sub: `${data.categorySales.length} categorias diferentes`,
      color: 'var(--success)',
      bg: 'var(--sage-50)',
    });
    list.push({
      icon: DollarSign,
      label: `Ticket médio ${formatPrice(data.avgTicket)}`,
      sub: `Faturamento total: ${formatPrice(data.totalRevenue)}`,
      color: '#3b82f6',
      bg: '#eff6ff',
    });
    if (data.busiestDay) {
      list.push({
        icon: Award,
        label: `Dia mais movimentado: ${data.busiestDay[0]}`,
        sub: `${data.busiestDay[1]} pedidos`,
        color: '#f59e0b',
        bg: 'var(--amber-50)',
      });
    }
    return list;
  }, [data, hasData]);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Relatórios</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Análise completa do desempenho do restaurante
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(p.value)}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: '0.78rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-success btn-sm" onClick={() => window.print()}>
            <Download size={14} />
            Gerar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Nenhum dado no período</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Tente selecionar um período maior</p>
        </div>
      ) : (
        <>
          <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Vendas por Categoria</h3>
                <BarChart2 size={16} color="var(--text-muted)" />
              </div>
              {data.categorySales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem dados</div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: 140, height: 140,
                      borderRadius: '50%',
                      background: `conic-gradient(${data.categorySales.map((s, i, arr) => {
                        const startPct = arr.slice(0, i).reduce((a, c) => a + c.pct, 0);
                        return `${getCategoryColor(s.label, i)} ${startPct}% ${startPct + s.pct}%`;
                      }).join(', ')})`,
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
                        <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>{data.categorySales[0]?.pct || 0}%</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{data.categorySales[0]?.label?.slice(0, 8) || ''}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.categorySales.slice(0, 6).map((s, i) => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: getCategoryColor(s.label, i), flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Faturamento por Dia da Semana</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--surface-subtle)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                  Últimos {period} dias
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 180, padding: '0 0.5rem' }}>
                {data.weekRevenue.map((w, i) => (
                  <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {formatPrice(w.revenue)}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(w.revenue / data.maxRevenue) * 100}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                      style={{
                        width: '100%',
                        borderRadius: '6px 6px 0 0',
                        background: w.revenue > 0 ? 'linear-gradient(180deg, var(--primary), var(--accent))' : 'var(--amber-100)',
                        minHeight: w.revenue > 0 ? 4 : 2,
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {w.day}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="reports-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Top Produtos</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Ranking de vendas no período</p>
              </div>
              {data.topProducts.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhuma venda no período</div>
              ) : (
                data.topProducts.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: i < data.topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ 
                      width: 32, height: 32, flexShrink: 0,
                      background: i === 0 ? '#fef3c7' : 'var(--surface-subtle)',
                      color: i === 0 ? 'var(--amber-700)' : 'var(--text-muted)',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.75rem', fontFamily: 'Sora'
                    }}>
                      #{p.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.count} vendas</div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {insights.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <BarChart2 size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem' }}>Sem insights disponíveis</p>
                </div>
              ) : (
                insights.map((ins, i) => {
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
                })
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Relatorios;
