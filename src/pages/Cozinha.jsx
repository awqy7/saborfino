import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Check, Utensils, GlassWater, AlertCircle, Printer, Bluetooth, BluetoothConnected, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { connect, disconnect, printOrder, getStatus, onStatusChange } from '../lib/printer';

const FOOD_CATEGORIES = ['Chapas', 'Espetos 500g/1kg', 'Porções', 'Entradas', 'Espetinhos', 'Guarnições', 'Pães de Alho'];
const DRINK_CATEGORIES = ['Drinks'];

function getStationForItem(item) {
  if (DRINK_CATEGORIES.includes(item?.category)) return 'bar';
  return 'kitchen';
}

const TABS = [
  { id: 'kitchen', label: 'Cozinha', icon: Utensils },
  { id: 'bar', label: 'Bar', icon: GlassWater },
];

function PrinterSection({ station, label, icon: Icon }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConnected(getStatus(station).connected);
    const unsub = onStatusChange(station, s => setConnected(s.connected));
    return unsub;
  }, [station]);

  const handleConnect = useCallback(async () => {
    if (connected) {
      await disconnect(station);
      return;
    }
    setConnecting(true);
    setError('');
    try {
      await connect(station);
    } catch (err) {
      setError(err.message || 'Falha ao conectar');
    } finally {
      setConnecting(false);
    }
  }, [connected, station]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={handleConnect}
        disabled={connecting}
        title={connected ? `Desconectar impressora ${label}` : `Conectar impressora ${label}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem',
          borderRadius: '8px', border: `1px solid ${connected ? '#22c55e' : 'var(--border)'}`,
          background: connected ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
          color: connected ? '#22c55e' : 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
        }}
      >
        {connecting ? (
          <span>...</span>
        ) : connected ? (
          <><BluetoothConnected size={16} /> {label}</>
        ) : (
          <><Bluetooth size={16} /> {label}</>
        )}
      </button>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}

const Cozinha = () => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const handlePrintOrder = useCallback(async (order) => {
    try {
      await printOrder(order, activeTab);
    } catch (err) {
      alert('Erro ao imprimir: ' + (err.message || ''));
    }
  }, [activeTab]);

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
      setFetchError(true);
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

  const getWaitTime = (isoString) => {
    if (!isoString) return 0;
    const diff = Math.floor((new Date() - new Date(isoString)) / 60000);
    return Number.isNaN(diff) ? 0 : diff;
  };

  const filteredOrders = orders
    .map(order => ({
      ...order,
      itens: (order.itens || []).filter(i => getStationForItem(i) === activeTab),
    }))
    .filter(order => order.itens.length > 0);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Utensils size={28} color="var(--primary)" /> Painel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Acompanhe e prepare os pedidos em tempo real
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <PrinterSection station="kitchen" label="Cozinha" icon={Utensils} />
          <PrinterSection station="bar" label="Bar" icon={GlassWater} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.25rem', maxWidth: 400 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = orders
            .filter(o => ['pendente', 'preparando'].includes(o.status))
            .reduce((sum, o) => sum + (o.itens || []).filter(i => getStationForItem(i) === tab.id).length, 0);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', borderRadius: 'calc(var(--radius-lg) - 0.15rem)',
                border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} /> {tab.label}
              {count > 0 && (
                <span style={{ background: isActive ? 'var(--primary)' : 'var(--text-muted)', color: 'white', borderRadius: '99px', padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontWeight: 800, opacity: isActive ? 1 : 0.4 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando pedidos...</div>
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} opacity={0.5} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Erro ao carregar pedidos</h3>
          <p style={{ color: 'var(--text-muted)' }}>Verifique sua conexão e tente novamente.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setLoading(true); setFetchError(false); fetchOrders(); }}>Tentar Novamente</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <Check size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} opacity={0.5} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum pedido na fila</h3>
          <p style={{ color: 'var(--text-muted)' }}>{activeTab === 'kitchen' ? 'A cozinha' : 'O bar'} está tranquilo no momento.</p>
        </div>
      ) : (
        <div className="cozinha-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredOrders.map(order => {
              const isPreparando = order.status === 'preparando';
              const waitTime = getWaitTime(order.created_at);
              const isDelayed = waitTime > 20;
              const printerConnected = getStatus(activeTab).connected;

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
                        style={{ background: '#e0e7ff', color: '#4338ca', width: '100%', fontWeight: 700, padding: '0.75rem', fontSize: '0.9rem' }}
                      >
                        Iniciar Preparo
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(order.id, 'pronto')}
                        className="btn btn-primary" 
                        style={{ width: '100%', fontWeight: 700, background: '#10b981', padding: '0.75rem', fontSize: '0.9rem' }}
                      >
                        <Check size={20} /> Marcar como Pronto
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintOrder(order)}
                      disabled={!printerConnected}
                      title={printerConnected ? 'Imprimir pedido' : 'Conecte a impressora primeiro'}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        padding: '0.5rem', width: '100%',
                        borderRadius: '8px', border: `1px solid ${printerConnected ? 'var(--border)' : 'var(--border)'}`,
                        background: printerConnected ? 'var(--surface)' : 'var(--surface-subtle)',
                        color: printerConnected ? 'var(--text-secondary)' : 'var(--text-muted)',
                        cursor: printerConnected ? 'pointer' : 'not-allowed',
                        fontSize: '0.8rem', fontWeight: 600, opacity: printerConnected ? 1 : 0.5,
                      }}
                    >
                      <Printer size={14} /> Imprimir
                    </button>
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
