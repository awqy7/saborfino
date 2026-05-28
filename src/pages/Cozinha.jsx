import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Check, Utensils, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Cozinha = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('pedidos_cozinha')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (['pendente', 'preparando'].includes(payload.new.status)) {
            setOrders(prev => [payload.new, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (['pendente', 'preparando'].includes(payload.new.status)) {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          } else {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          }
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
        .in('status', ['pendente', 'preparando'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Optimização otimista
      if (!['pendente', 'preparando'].includes(newStatus)) {
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar pedido');
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Tempo desde a criação
  const getWaitTime = (isoString) => {
    const diff = Math.floor((new Date() - new Date(isoString)) / 60000);
    return diff; // minutos
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Utensils size={28} color="var(--primary)" /> Painel da Cozinha
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Acompanhe e prepare os pedidos em tempo real
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <Check size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} opacity={0.5} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum pedido na fila</h3>
          <p style={{ color: 'var(--text-muted)' }}>A cozinha está tranquila no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {orders.map(order => {
              const isPreparando = order.status === 'preparando';
              const waitTime = getWaitTime(order.created_at);
              const isDelayed = waitTime > 20;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: `2px solid ${isPreparando ? 'var(--primary)' : isDelayed ? 'var(--danger)' : 'var(--border)'}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isPreparando ? '0 10px 25px -5px rgba(37,99,235,0.1)' : 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ padding: '1rem', background: isPreparando ? 'var(--primary-light)' : isDelayed ? '#fef2f2' : 'var(--surface-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ background: isPreparando ? 'var(--primary)' : isDelayed ? 'var(--danger)' : '#1e293b', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
                        {order.mesa}
                      </span>
                      {order.cliente_nome && (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.cliente_nome}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: isDelayed ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Clock size={14} /> {formatTime(order.created_at)}
                      {isDelayed && <AlertCircle size={14} style={{ marginLeft: 4 }} />}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', flex: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {order.itens.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-muted)', background: 'var(--surface-subtle)', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                            {item.quantity}x
                          </span>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{item.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {order.observacao && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fde68a' }}>
                        Obs: {order.observacao}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                    {order.status === 'pendente' ? (
                      <button 
                        onClick={() => updateStatus(order.id, 'preparando')}
                        className="btn" 
                        style={{ background: '#e0e7ff', color: '#4338ca', width: '100%', fontWeight: 700 }}
                      >
                        Iniciar Preparo
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(order.id, 'pronto')}
                        className="btn btn-primary" 
                        style={{ width: '100%', fontWeight: 700, background: '#10b981' }}
                      >
                        <Check size={18} /> Marcar como Pronto
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Cozinha;
