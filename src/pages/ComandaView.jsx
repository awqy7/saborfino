import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { UtensilsCrossed, Coffee, Beer, Wine, GlassWater, ChefHat, Pizza, Beef, ShoppingCart, QrCode } from 'lucide-react';

const CATEGORY_ICONS = {
  Chapas: ChefHat,
  'Espetos 500g/1kg': Beef,
  'Porções': Pizza,
  'Entradas': UtensilsCrossed,
  'Espetinhos': Beef,
  'Guarnições': Coffee,
  'Pães de Alho': ChefHat,
  'Bebidas': Coffee,
  'Cervejas': Beer,
  'Doses': GlassWater,
  'Vinhos': Wine,
  'Drinks': Wine,
  'Buffet': ShoppingCart,
};

const ComandaView = () => {
  const { codigo } = useParams();
  const [comandaData, setComandaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isValidCodigo = /^C\d{3}$/i.test(codigo);

  useEffect(() => {
    if (!isValidCodigo) {
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [codigo]);

  const fetchData = async () => {
    try {
      const { data, error: err } = await supabase.rpc('get_comanda_data', { p_codigo: codigo });
      if (err) throw err;
      setComandaData(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const comanda = comandaData?.comanda;
  const pedidos = comandaData?.pedidos || [];
  const allItens = pedidos.flatMap(p => p.itens || []);
  const total = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const pesoTotal = allItens.filter(i => i.peso).reduce((acc, i) => acc + (i.peso || 0), 0);
  const hasItems = allItens.length > 0;

  if (!isValidCodigo) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#faf9f7', padding: '2rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <QrCode size={48} color="#a8a29e" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1917' }}>
            Comanda inválida
          </h2>
          <p style={{ color: '#78716c', fontSize: '0.9rem' }}>
            Escaneie o QR Code da sua comanda
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
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        padding: '2.5rem 1.5rem 1.5rem', color: 'white', textAlign: 'center',
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

      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: '-1.25rem',
      }}>
        <div style={{
          background: 'white', padding: '0.75rem 2rem', borderRadius: '99px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          fontWeight: 800, fontSize: '1.25rem', color: '#1c1917',
          border: '1px solid #e7e5e4',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <QrCode size={18} color="#f59e0b" />
          {comanda?.codigo || codigo}
          {comanda && (
            <span style={{
              fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '99px',
              fontWeight: 700,
              background: comanda.status === 'aberta' ? '#fef3c7' : '#f3f4f6',
              color: comanda.status === 'aberta' ? '#b45309' : '#374151',
            }}>
              {comanda.status === 'aberta' ? 'Aberta' : 'Fechada'}
            </span>
          )}
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
      ) : comanda === null ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1.5rem', margin: '1.5rem',
          background: 'white', borderRadius: '16px',
          border: '1px dashed #d6d3d1',
        }}>
          <ShoppingCart size={48} color="#d6d3d1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#78716c', marginBottom: '0.25rem' }}>
            Comanda não encontrada
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#a8a29e' }}>
            Escaneie o QR Code novamente ou vá até o caixa
          </p>
        </div>
      ) : !hasItems ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1.5rem', margin: '1.5rem',
          background: 'white', borderRadius: '16px',
          border: '1px dashed #d6d3d1',
        }}>
          <ShoppingCart size={48} color="#d6d3d1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#78716c', marginBottom: '0.25rem' }}>
            Nenhum item ainda
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#a8a29e' }}>
            Seu pedido aparecerá aqui em instantes
          </p>
        </div>
      ) : (
        <>
          <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pedidos.map(pedido => (
              <div key={pedido.id} style={{
                background: 'white', borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e7e5e4',
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #f5f5f4',
                }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.04em', color: pedido.tipo === 'buffet' ? '#d97706' : '#78716c',
                  }}>
                    {pedido.tipo === 'buffet' ? 'Buffet por Quilo' : 'Comanda'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#78716c' }}>
                    {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                  {(pedido.itens || []).map((item, idx) => {
                    const Icon = CATEGORY_ICONS[item.category] || ShoppingCart;
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center',
                        padding: '0.6rem 1rem', gap: '0.75rem',
                        borderBottom: idx < (pedido.itens || []).length - 1 ? '1px solid #f5f5f4' : 'none',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '8px',
                          background: item.category === 'Buffet' ? '#fef3c7' : '#f5f5f4',
                          color: item.category === 'Buffet' ? '#f59e0b' : '#a8a29e',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1917' }}>
                            {item.quantity}x {item.name}
                          </span>
                          {item.peso && (
                            <span style={{ fontSize: '0.7rem', color: '#a8a29e', marginLeft: '0.3rem' }}>
                              ({Number(item.peso).toFixed(3).replace('.', ',')} kg)
                            </span>
                          )}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1917', whiteSpace: 'nowrap' }}>
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            margin: '0 1rem', padding: '1rem 1.25rem',
            background: 'white', borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e7e5e4',
          }}>
            {pesoTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a8a29e', marginBottom: '0.25rem' }}>
                <span>Peso total</span>
                <span>{pesoTotal.toFixed(3).replace('.', ',')} kg</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#57534e' }}>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: '#a8a29e' }}>
            Os valores são atualizados automaticamente
          </div>
        </>
      )}
    </div>
  );
};

export default ComandaView;
