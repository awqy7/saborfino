import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const Caixa = () => {
  const [activeTab, setActiveTab] = useState('Em Aberto');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'pago' }) // Podemos adicionar coluna 'metodo_pagamento' se existir
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Filter based on active tab and search
  const displayedOrders = orders.filter(tx => {
    const isAberto = activeTab === 'Em Aberto' && tx.status !== 'pago' && tx.status !== 'cancelado';
    const isPago = activeTab === 'Fechados' && tx.status === 'pago';
    
    if (!isAberto && !isPago) return false;

    const term = searchTerm.toLowerCase();
    const searchMatch = 
      (tx.mesa && tx.mesa.toLowerCase().includes(term)) ||
      (tx.cliente_nome && tx.cliente_nome.toLowerCase().includes(term)) ||
      tx.id.toLowerCase().includes(term);

    return searchMatch;
  });

  const totalEmAberto = orders.filter(o => o.status !== 'pago' && o.status !== 'cancelado').reduce((acc, o) => acc + Number(o.total), 0);
  const totalFechados = orders.filter(o => o.status === 'pago').reduce((acc, o) => acc + Number(o.total), 0);
  
  const summaryCards = [
    { label: 'Total Recebido (Hoje)', value: `R$ ${totalFechados.toFixed(2)}`, icon: TrendingUp, accent: '#22c55e', iconBg: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'A Receber (Mesas)', value: `R$ ${totalEmAberto.toFixed(2)}`, icon: Clock, accent: '#f59e0b', iconBg: '#fef3c7', iconColor: '#b45309' },
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
            Receba pagamentos das mesas e pedidos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <Calendar size={14} />
            Hoje
          </button>
          <button className="btn btn-primary btn-sm">
            <Download size={14} />
            Exportar
          </button>
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
          <div className="search-bar" style={{ width: 280 }}>
            <Filter size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar mesa, nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table className="data-table">
            <thead>
              <tr>
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Carregando dados...
                  </td>
                </tr>
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {formatTime(tx.created_at)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--surface-subtle)', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                        Mesa {tx.mesa || tx.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.cliente_nome || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {tx.itens?.length || 0} itens
                    </td>
                    <td>
                      {getStatusBadge(tx.status)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      R$ {Number(tx.total).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {activeTab === 'Em Aberto' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => handlePagar(tx.id, 'PIX')} className="btn btn-primary btn-sm" title="Receber via PIX" style={{ padding: '0.4rem', background: '#10b981' }}>
                            <QrCode size={14} /> Pagar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          <CheckCircle size={14} color="#10b981" /> Fechado
                        </span>
                      )}
                    </td>
                  </motion.tr>
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
