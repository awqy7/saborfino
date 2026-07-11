import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Utensils, GlassWater, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../lib/format';

const FOOD_CATEGORIES = ['Chapas', 'Espetos 500g/1kg', 'Porções', 'Entradas', 'Espetinhos', 'Guarnições', 'Pães de Alho'];
const DRINK_CATEGORIES = ['Drinks', 'Bebidas'];

function getStationForItem(item) {
  if (DRINK_CATEGORIES.includes(item?.category)) return 'bar';
  return 'kitchen';
}

const TABS = [
  { id: 'kitchen', label: 'Cozinha', icon: Utensils },
  { id: 'bar', label: 'Bar', icon: GlassWater },
];

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

const Cozinha = () => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('pedidos_cozinha')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.status !== 'pago' && payload.new.status !== 'cancelado') {
            setOrders(prev => [payload.new, ...prev]);
            if (loadedRef.current) playNotificationSound();
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'pago' || payload.new.status === 'cancelado') {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          } else {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
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
        .not('status', 'in', '("pago","cancelado")')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      loadedRef.current = true;
      setLoading(false);
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
    .filter(order => order.itens.length > 0)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Utensils size={28} color="var(--primary)" /> Painel ao Vivo
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Pedidos ativos — somem automaticamente ao serem pagos no Caixa
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.25rem', maxWidth: 400 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = orders
            .map(o => ({ ...o, itens: (o.itens || []).filter(i => getStationForItem(i) === tab.id) }))
            .filter(o => o.itens.length > 0).length;
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
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <Utensils size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} opacity={0.5} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum pedido ativo</h3>
          <p style={{ color: 'var(--text-muted)' }}>{activeTab === 'kitchen' ? 'A cozinha' : 'O bar'} está tranquilo no momento.</p>
        </div>
      ) : (
        <div className="cozinha-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredOrders.map(order => {
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
                    border: `2px solid ${isDelayed ? 'var(--danger)' : 'var(--primary)'}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDelayed ? '0 10px 25px -5px rgba(239,68,68,0.15)' : 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ padding: '1rem', background: isDelayed ? '#fef2f2' : 'var(--primary-light)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ background: isDelayed ? 'var(--danger)' : 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
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

                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>Total: {formatPrice(order.total)}</span>
                    <span>{waitTime < 1 ? 'Agora' : `${waitTime} min atrás`}</span>
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
