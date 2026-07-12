import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Utensils } from 'lucide-react';
import { formatPrice } from '../lib/format';

const Cozinha = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('pedidos_historico')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      // erro silencioso em produção
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Utensils size={22} color="var(--primary)" /> Histórico do Dia
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
          Todos os pedidos de hoje — {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <Utensils size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum pedido hoje</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map(order => {
            const isPaid = order.status === 'pago';
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid var(--border)`,
                  opacity: isPaid ? 0.7 : 1,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '0.75rem 1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  background: isPaid ? 'var(--surface-subtle)' : 'var(--primary-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      background: isPaid ? 'var(--text-muted)' : 'var(--primary)',
                      color: 'white', padding: '0.15rem 0.6rem', borderRadius: '6px',
                      fontWeight: 800, fontSize: '1rem',
                    }}>
                      {order.mesa}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />
                      {formatTime(order.created_at)}
                    </span>
                    {isPaid && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAGO</span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {formatPrice(order.total)}
                  </span>
                </div>

                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(order.itens || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', minWidth: 24 }}>
                        {item.quantity}x
                      </span>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Cozinha;