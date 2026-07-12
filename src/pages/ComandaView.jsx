import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { UtensilsCrossed, Coffee, Beer, Wine, GlassWater, ChefHat, Pizza, Beef, ShoppingCart } from 'lucide-react';

const CATEGORY_ICONS = {
  Chapas: ChefHat,
  'Espetos 500g/1kg': Beef,
  Porções: Pizza,
  Entradas: UtensilsCrossed,
  Espetinhos: Beef,
  Guarnições: Coffee,
  'Pães de Alho': ChefHat,
  Bebidas: Coffee,
  Cervejas: Beer,
  Doses: GlassWater,
  Vinhos: Wine,
  Drinks: Wine,
};

const ComandaView = () => {
  const { tableId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tableNum = parseInt(tableId, 10);
  const isValidTable = tableNum >= 1 && tableNum <= 8;

  useEffect(() => {
    if (!isValidTable) {
      setLoading(false);
      return;
    }

    fetchOrders();

    // Polling seguro via RPC (em vez de realtime público)
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [tableNum, isValidTable]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .rpc('get_table_orders', { table_num: tableNum });

      if (err) throw err;
      setOrders(data || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Merge all active orders into one item list
  const allItens = orders.flatMap(o => o.itens || []);
  const total = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const hasItems = allItens.length > 0;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente': return { label: 'Na fila', color: '#b45309', bg: '#fef3c7' };
      case 'pago': return { label: 'Pago', color: '#059669', bg: '#d1fae5' };

      default: return { label: status, color: '#374151', bg: '#f3f4f6' };
    }
  };

  if (!isValidTable) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#faf9f7', padding: '2rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <UtensilsCrossed size={48} color="#a8a29e" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1917' }}>
            Mesa inválida
          </h2>
          <p style={{ color: '#78716c', fontSize: '0.9rem' }}>
            Escaneie o QR code da sua mesa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#faf9f7',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: '2rem',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        padding: '2.5rem 1.5rem 1.5rem',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.75rem',
        }}>
          <UtensilsCrossed size={28} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.15rem' }}>
          FINO SABOR
        </h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Churrascaria</p>
      </div>

      {/* Table Number */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: '-1.25rem',
      }}>
        <div style={{
          background: 'white', padding: '0.75rem 2rem', borderRadius: '99px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          fontWeight: 800, fontSize: '1.25rem', color: '#1c1917',
          border: '1px solid #e7e5e4',
        }}>
          Mesa {tableNum}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#a8a29e' }}>
          Carregando...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#a8a29e' }}>
          Erro ao carregar comanda. Atualize a página.
        </div>
      ) : !hasItems ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1.5rem', margin: '1.5rem',
          background: 'white', borderRadius: '16px',
          border: '1px dashed #d6d3d1',
        }}>
          <ShoppingCart size={48} color="#d6d3d1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#78716c', marginBottom: '0.25rem' }}>
            Mesa disponível
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#a8a29e' }}>
            Nenhum pedido ativo no momento
          </p>
        </div>
      ) : (
        <>
          {/* Items grouped by order */}
          <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => {
              const status = getStatusLabel(order.status);
              return (
                <div key={order.id} style={{
                  background: 'white', borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e7e5e4',
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #f5f5f4',
                  }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, color: '#78716c',
                    }}>
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '99px',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: status.bg, color: status.color,
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ padding: '0.5rem 0' }}>
                    {(order.itens || []).map((item, idx) => {
                      const Icon = CATEGORY_ICONS[item.category] || ShoppingCart;
                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center',
                          padding: '0.6rem 1rem', gap: '0.75rem',
                          borderBottom: idx < (order.itens || []).length - 1 ? '1px solid #f5f5f4' : 'none',
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: '#fef3c7', color: '#f59e0b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: '0.7rem',
                          }}>
                            <Icon size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1917' }}>
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span style={{
                            fontWeight: 700, fontSize: '0.9rem', color: '#1c1917',
                            whiteSpace: 'nowrap',
                          }}>
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{
            margin: '0 1rem', padding: '1rem 1.25rem',
            background: 'white', borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e7e5e4',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#57534e' }}>
              Total
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
              {formatPrice(total)}
            </span>
          </div>

          {/* Note */}
          <div style={{
            textAlign: 'center', padding: '1rem', fontSize: '0.75rem',
            color: '#a8a29e',
          }}>
            Os valores são atualizados automaticamente
          </div>
        </>
      )}
    </div>
  );
};

export default ComandaView;
