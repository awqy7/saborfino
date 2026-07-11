import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Flame,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';

const stagger = {
  show: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    vendasHoje: 0,
    pedidosAtivos: 0,
    clientesHoje: 0,
    ticketMedio: 0,
    recentOrders: [],
    topItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchData();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    try {
      const { start, end } = todayRange();

      const [
        { data: hoje },
        { data: ativos },
        { data: recentes },
      ] = await Promise.all([
        supabase.from('pedidos').select('total, cliente_nome').gte('created_at', start).lte('created_at', end),
        supabase.from('pedidos').select('id').in('status', ['pendente', 'preparando']),
        supabase.from('pedidos').select('*').not('status', 'in', '(' + ['pago', 'cancelado'].map(s => `'${s}'`).join(',') + ')').order('created_at', { ascending: false }).limit(5),
      ]);

      const paidHoje = (hoje || []).filter(o => o.status !== 'cancelado');
      const totalVendas = paidHoje.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      const clientesSet = new Set(paidHoje.map(o => o.cliente_nome).filter(Boolean));
      const ticket = paidHoje.length > 0 ? totalVendas / paidHoje.length : 0;

      const limiteData = new Date(); limiteData.setDate(limiteData.getDate() - 30);
      const { data: allOrders, error: ordErr } = await supabase
        .from('pedidos')
        .select('itens')
        .gte('created_at', limiteData.toISOString())
        .limit(500);
      if (ordErr) console.error('Erro topItems:', ordErr);

      const itemCount = {};
      (allOrders || []).forEach(o => {
        (o.itens || []).forEach(item => {
          const name = item.name || 'Item';
          itemCount[name] = (itemCount[name] || 0) + (item.quantity || 1);
        });
      });
      const topItems = Object.entries(itemCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const recentOrders = (recentes || []).map(o => {
        const diff = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
        const statusMap = { 'pendente': 'Pendente', 'preparando': 'Preparando', 'pronto': 'Pronto' };
        return {
          id: o.id,
          mesa: o.mesa || o.tipo,
          total: o.total,
          status: statusMap[o.status] || o.status,
          tempo: diff < 1 ? 'Agora' : `${diff} min`,
        };
      });

      setData({
        vendasHoje: totalVendas,
        pedidosAtivos: (ativos || []).length,
        clientesHoje: clientesSet.size,
        ticketMedio: ticket,
        recentOrders,
        topItems,
      });
      setError(false);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: 'Vendas Hoje', value: formatPrice(data.vendasHoje), icon: DollarSign, iconBg: '#fef3c7', iconColor: '#d97706', accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { label: 'Pedidos Ativos', value: String(data.pedidosAtivos), icon: ShoppingCart, iconBg: '#eff6ff', iconColor: '#2563eb', accent: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { label: 'Clientes Hoje', value: String(data.clientesHoje), icon: Users, iconBg: '#f0fdf4', iconColor: '#16a34a', accent: 'linear-gradient(90deg, #22c55e, #4ade80)' },
    { label: 'Ticket Médio', value: formatPrice(data.ticketMedio), icon: TrendingUp, iconBg: '#fdf2f8', iconColor: '#9333ea', accent: 'linear-gradient(90deg, #a855f7, #c084fc)' },
  ];

  const statusConfig = {
    'Preparando': { cls: 'badge-warning', label: 'Preparando' },
    'Pendente': { cls: 'badge-info', label: 'Pendente' },
    'Pronto': { cls: 'badge-success', label: 'Pronto' },
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="dash-header"
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
        <div className="dash-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <Clock size={14} />
            Hoje
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/pos')}>
            Novo Pedido
            <ArrowUpRight size={14} />
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Erro ao carregar dados. Verifique sua conexão.
          <button className="btn btn-primary" style={{ marginTop: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={() => { setLoading(true); fetchData(); }}>Tentar Novamente</button>
        </div>
      ) : (
        <>
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
                  </div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="dash-main-grid"
            style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}
          >
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
                {data.recentOrders.length === 0 ? (
                  <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhum pedido ainda hoje
                  </div>
                ) : (
                  data.recentOrders.map((order, i) => {
                    const cfg = statusConfig[order.status] || { cls: 'badge', label: order.status };
                    return (
                      <motion.div
                        key={order.id}
                        whileHover={{ backgroundColor: 'var(--neutral-50)' }}
                        style={{ 
                          display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
                          alignItems: 'center', gap: '1rem',
                          padding: '0.875rem 1.5rem',
                          borderBottom: i < data.recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ 
                          width: 36, height: 36, background: 'var(--amber-50)', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--amber-600)', fontWeight: 700, fontSize: '0.75rem'
                        }}>
                          {String(order.id).slice(0, 4)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.mesa}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <Clock size={11} /> {order.tempo}
                          </div>
                        </div>
                        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {formatPrice(order.total)}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <motion.div variants={fadeUp} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={16} color="var(--terra-500)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Mais Vendidos (30 dias)</h3>
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                  {data.topItems.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhuma venda ainda
                    </div>
                  ) : (
                    data.topItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1.5rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: ['#fef3c7', '#eff6ff', '#f0fdf4'][i],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.8rem',
                          color: ['#b45309', '#2563eb', '#16a34a'][i],
                          flexShrink: 0,
                        }}>
                          #{i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.count} vendas</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

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
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
