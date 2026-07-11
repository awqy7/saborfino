import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowRight,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const DATE_FILTERS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'tudo', label: 'Tudo' },
];

const Caixa = () => {
  const [activeTab, setActiveTab] = useState('Em Aberto');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingIds, setPayingIds] = useState(new Set());
  const [dateFilter, setDateFilter] = useState('hoje');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('pedidos_caixa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos do caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (id, method) => {
    if (payingIds.has(id)) return;
    setPayingIds(prev => new Set(prev).add(id));
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'pago', metodo_pagamento: method })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      alert('Erro ao registrar pagamento');
    } finally {
      setPayingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  };

  const getDateCutoff = () => {
    if (dateFilter === 'tudo') return null;
    const now = new Date();
    const days = dateFilter === 'hoje' ? 0 : dateFilter === '7d' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  };

  // Filter based on active tab, search, and date
  const displayedOrders = orders.filter(tx => {
    const isAberto = activeTab === 'Em Aberto' && tx.status !== 'pago' && tx.status !== 'cancelado';
    const isPago = activeTab === 'Fechados' && tx.status === 'pago';

    if (!isAberto && !isPago) return false;

    // Date filter (only for Fechados)
    if (isPago) {
      const cutoff = getDateCutoff();
      if (cutoff && new Date(tx.created_at) < cutoff) return false;
    }

    const term = searchTerm.toLowerCase();
    const searchMatch = 
      (tx.mesa && tx.mesa.toLowerCase().includes(term)) ||
      (tx.cliente_nome && tx.cliente_nome.toLowerCase().includes(term)) ||
      String(tx.id).toLowerCase().includes(term);

    return searchMatch;
  });

  const totalEmAberto = orders.filter(o => o.status !== 'pago' && o.status !== 'cancelado').reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalFechadosPeriodo = displayedOrders.filter(o => o.status === 'pago').reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  
  const summaryCards = [
    { label: 'Total Recebido', value: formatPrice(totalFechadosPeriodo), icon: TrendingUp, accent: '#22c55e', iconBg: '#f0fdf4', iconColor: '#16a34a', subtitle: activeTab === 'Fechados' ? `Período: ${DATE_FILTERS.find(f => f.id === dateFilter)?.label}` : undefined },
    { label: 'A Receber (Mesas)', value: formatPrice(totalEmAberto), icon: Clock, accent: '#f59e0b', iconBg: '#fef3c7', iconColor: '#b45309' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendente': return <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>Na Fila</span>;
      case 'preparando': return <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>Cozinha</span>;
      case 'pronto': return <span className="badge badge-success" style={{ background: '#d1fae5', color: '#059669' }}>Pronto</span>;
      case 'pago': return <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>Pago</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Controle de Caixa</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Receba pagamentos das mesas e consulte histórico
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {summaryCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <div className="stat-card-accent" style={{ background: s.accent }} />
              <div className="stat-icon-wrap" style={{ background: s.iconBg, marginBottom: '0.75rem' }}>
                <Icon size={18} color={s.iconColor} strokeWidth={2} />
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              {s.subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.subtitle}</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--surface-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {['Em Aberto', 'Fechados'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.4rem 1rem', border: 'none', borderRadius: 8,
                  background: activeTab === tab ? 'var(--surface)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab === 'Fechados' && (
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-subtle)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
                {DATE_FILTERS.map(df => (
                  <button
                    key={df.id}
                    onClick={() => setDateFilter(df.id)}
                    style={{
                      padding: '0.3rem 0.75rem', border: 'none', borderRadius: 7,
                      background: dateFilter === df.id ? 'var(--surface)' : 'transparent',
                      color: dateFilter === df.id ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: dateFilter === df.id ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer',
                      boxShadow: dateFilter === df.id ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    {df.label}
                  </button>
                ))}
              </div>
            )}
            <div className="search-bar" style={{ width: 220 }}>
              <Filter size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar mesa, nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="caixa-table-wrap" style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table className="data-table caixa-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Origem</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Carregando dados...
                  </td>
                </tr>
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedOrder(expandedOrder === tx.id ? null : tx.id)}
                    >
                      <td data-label="Data">
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {formatDate(tx.created_at)}
                        </span>
                      </td>
                      <td data-label="Horário">
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {formatTime(tx.created_at)}
                        </span>
                      </td>
                      <td data-label="Origem">
                        <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--surface-subtle)', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                          Mesa {tx.mesa || tx.tipo}
                        </span>
                      </td>
                      <td data-label="Cliente" style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.cliente_nome || '-'}</td>
                      <td data-label="Itens" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {tx.itens?.length || 0} itens
                      </td>
                      <td data-label="Status">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td data-label="Total" style={{ textAlign: 'right', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {formatPrice(tx.total)}
                      </td>
                      <td data-label="" style={{ textAlign: 'right' }}>
                        {activeTab === 'Em Aberto' ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); handlePagar(tx.id, 'PIX'); }} disabled={payingIds.has(tx.id)} className="btn btn-primary btn-sm" title="Receber via PIX" style={{ padding: '0.5rem 0.85rem', background: '#10b981', gap: '0.4rem', opacity: payingIds.has(tx.id) ? 0.6 : 1 }}>
                              <QrCode size={16} /> {payingIds.has(tx.id) ? '...' : 'Pagar'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                            <CheckCircle size={14} color="#10b981" />
                            {expandedOrder === tx.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                    {expandedOrder === tx.id && (
                      <tr>
                        <td colSpan={8} style={{ padding: '0 1.5rem 1rem', background: 'var(--surface-subtle)' }}>
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <strong>Mesa:</strong> {tx.mesa || tx.tipo}
                                {tx.cliente_nome && <> · <strong>Cliente:</strong> {tx.cliente_nome}</>}
                                <> · <strong>Data:</strong> {formatDate(tx.created_at)} às {formatTime(tx.created_at)}</>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(tx.itens || []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx < (tx.itens?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                                  <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.quantity}x {item.name}</span>
                                  </div>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                    {formatPrice((item.price || 0) * (item.quantity || 1))}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px dashed var(--border)', fontSize: '1rem', fontWeight: 800 }}>
                              <span>Total</span>
                              <span style={{ color: 'var(--primary)' }}>{formatPrice(tx.total)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Caixa;
