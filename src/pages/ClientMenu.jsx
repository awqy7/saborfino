import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Minus, ShoppingCart, CheckCircle, Clock, Utensils, Send, User, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import CARDAPIO from '../data/cardapio';

const ClientMenu = () => {
  const { tableId } = useParams();
  const [cart, setCart] = useState([]);
  const [clientName, setClientName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [category, setCategory] = useState('Todas');
  const [view, setView] = useState('menu'); // 'menu', 'cart', 'status'
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = category === 'Todas'
    ? CARDAPIO
    : CARDAPIO.filter(s => s.category === category);

  // Session Persistence
  useEffect(() => {
    const savedSession = localStorage.getItem(`fino_sabor_table_${tableId}`);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.clientName) {
          setClientName(parsed.clientName);
          setIsNameSet(true);
        }
        if (parsed.currentOrderId) {
          setCurrentOrderId(parsed.currentOrderId);
          setView('status');
        }
      } catch (e) {
        console.error('Erro ao ler sessão local', e);
      }
    }
  }, [tableId]);

  // Subscribe to order changes when order is placed
  useEffect(() => {
    if (!currentOrderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase.from('pedidos').select('status, itens, total').eq('id', currentOrderId).single();
      if (data) {
        setOrderStatus(data.status);
        setOrderItems(data.itens || []);
        setOrderTotal(data.total || 0);
      }
    };
    
    fetchOrder();

    const channel = supabase
      .channel(`pedido_${currentOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${currentOrderId}` }, (payload) => {
        setOrderStatus(payload.new.status);
        setOrderItems(payload.new.itens || []);
        setOrderTotal(payload.new.total || 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrderId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const q = i.quantity + delta;
      return q < 1 ? null : { ...i, quantity: q };
    }).filter(Boolean));
  };

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const formatPrice = (price) =>
    price > 0 ? `R$ ${price.toFixed(2).replace(".", ",")}` : 'Sob consulta';

  const handleSetName = () => {
    if (clientName.trim()) {
      setIsNameSet(true);
      localStorage.setItem(`fino_sabor_table_${tableId}`, JSON.stringify({
        clientName: clientName.trim(),
        currentOrderId: null
      }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!clientName.trim() || cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Se a pessoa já tem um pedido aberto nesta mesa, vamos ADICIONAR os itens
      if (currentOrderId) {
        const { data: existingOrder } = await supabase
          .from('pedidos')
          .select('itens, total, status')
          .eq('id', currentOrderId)
          .single();
          
        if (existingOrder && existingOrder.status !== 'pago' && existingOrder.status !== 'cancelado') {
          const newItens = [...existingOrder.itens, ...cart];
          const newTotal = Number(existingOrder.total) + total;
          
          await supabase.from('pedidos').update({
            itens: newItens,
            total: newTotal,
            status: 'pendente' // Retorna pra fila da cozinha com os novos itens
          }).eq('id', currentOrderId);
          
          setOrderItems(newItens);
          setOrderTotal(newTotal);
          setOrderStatus('pendente');
          setView('status');
          setCart([]);
          setIsSubmitting(false);
          return;
        }
      }

      // Caso contrário, cria um novo pedido
      const orderData = {
        mesa: tableId || 'Balcão',
        cliente_nome: clientName,
        status: 'pendente',
        itens: cart,
        total: total,
        tipo: 'mesa'
      };

      const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
      
      if (error) throw error;
      
      setCurrentOrderId(data.id);
      setOrderItems(cart);
      setOrderTotal(total);
      setOrderStatus('pendente');
      setView('status');
      setCart([]);
      
      // Salva na sessão
      localStorage.setItem(`fino_sabor_table_${tableId}`, JSON.stringify({
        clientName: clientName.trim(),
        currentOrderId: data.id
      }));
      
    } catch (err) {
      console.error("Erro ao fazer pedido:", err);
      alert("Houve um erro ao enviar seu pedido. Chame um garçom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePedirMais = () => {
    setView('menu');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return { bg: '#fef3c7', text: '#b45309', label: 'Na Fila da Cozinha' };
      case 'preparando': return { bg: '#e0e7ff', text: '#4338ca', label: 'Sendo Preparado' };
      case 'pronto': return { bg: '#d1fae5', text: '#059669', label: 'Pronto para Servir!' };
      case 'entregue': return { bg: '#f3f4f6', text: '#374151', label: 'Entregue' };
      default: return { bg: '#f3f4f6', text: '#374151', label: status };
    }
  };

  // Welcome Screen to get Name
  if (!isNameSet) {
    return (
      <div style={{ minHeight: '100vh', background: '#090909', backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.82), rgba(0,0,0,0.45)), url(/images/fino-sabor-hero-background.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem', background: 'rgba(9,9,9,0.9)', border: '1px solid rgba(255,132,14,0.32)', color: '#f4f0e9', boxShadow: '0 24px 70px rgba(0,0,0,0.5)' }}
        >
          <div style={{ width: 64, height: 64, background: 'rgba(255,132,14,0.14)', border: '1px solid rgba(255,132,14,0.42)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ff8507' }}>
            <Utensils size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8f4ef', marginBottom: '0.5rem' }}>Bem-vindo!</h1>
          <p style={{ color: '#cfc8c1', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Mesa <strong>{tableId || 'Balcão'}</strong><br/>
            Como podemos te chamar?
          </p>
          <div className="input-wrap" style={{ marginBottom: '1.5rem' }}>
            <div className="input-icon"><User size={18} /></div>
            <input 
              type="text" 
              className="form-input has-icon"
              placeholder="Seu nome" 
              value={clientName} 
              onChange={e => setClientName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && clientName.trim() && handleSetName()}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleSetName}
            disabled={!clientName.trim()}
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}
          >
            Ver Cardápio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #090909 0%, #111211 52%, #0d0e0e 100%)', color: '#f4f0e9', paddingBottom: '100px' }}>
      {/* Header */}
      <header style={{ background: 'rgba(7,7,7,0.94)', padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,132,14,0.22)', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 18px 44px rgba(0,0,0,0.32)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8f4ef' }}>Olá, {clientName}!</h1>
            <p style={{ fontSize: '0.85rem', color: '#c6bdb5' }}>Mesa {tableId || 'Balcão'}</p>
          </div>
          {currentOrderId && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setView('status')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)', color: '#ff8507', borderColor: 'rgba(255,132,14,0.38)', background: 'rgba(255,132,14,0.12)' }}
            >
              <Clock size={16} /> Ver Comanda
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.25rem 1rem' }}>
        
        {view === 'menu' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Categories */}
            <div className="tabs" style={{ marginBottom: '1.25rem', width: '100%', overflowX: 'auto', flexWrap: 'nowrap', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,132,14,0.18)' }}>
              {['Todas', ...CARDAPIO.map(s => s.category)].map(cat => (
                <button
                  key={cat}
                  className={`tab-btn${category === cat ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Sections */}
            {sections.map(section => (
              <div key={section.category} style={{ marginBottom: '2rem' }}>
                <div style={{
                  position: 'relative',
                  height: 130,
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `url(${section.image}) center/cover no-repeat`,
                    filter: 'brightness(0.45) saturate(1.3)',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, rgba(28,25,23,0.8) 0%, rgba(28,25,23,0.1) 100%)',
                  }} />
                  <div style={{
                    position: 'relative', zIndex: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.25rem',
                  }}>
                    <h3 style={{
                      fontFamily: 'Sora, sans-serif',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '-0.02em',
                    }}>
                      {section.category}
                    </h3>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {section.items.map(item => {
                    const inCart = cart.find(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        style={{
                          background: 'linear-gradient(110deg, rgba(18,18,18,0.96), rgba(8,8,8,0.98))',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.14)',
                          padding: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                          minHeight: 96,
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{
                          width: 88,
                          height: 78,
                          borderRadius: 8,
                          background: `url(${item.image}) center/cover no-repeat`,
                          boxShadow: '12px 0 24px rgba(0,0,0,0.32)',
                          flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f4f0e9', lineHeight: 1.25 }}>
                            {item.name}
                          </div>
                          {item.desc && (
                            <p style={{ fontSize: '0.73rem', color: '#bdb5ae', marginTop: '0.22rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.desc}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.75rem', flexShrink: 0 }}>
                          {inCart && (
                            <div
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                              style={{
                                width: 24, height: 24,
                                borderRadius: '50%',
                                background: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '1rem', fontWeight: 700, lineHeight: 1,
                                userSelect: 'none',
                              }}
                            >
                              −
                            </div>
                          )}
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff8507', whiteSpace: 'nowrap' }}>
                            {formatPrice(item.price)}
                          </span>
                          {inCart && (
                            <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 800, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {view === 'cart' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Carrinho</h2>
            {cart.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <ShoppingCart size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600 }}>Seu carrinho está vazio</p>
                <button onClick={() => setView('menu')} className="btn btn-ghost" style={{ marginTop: '1rem', color: 'var(--primary)' }}>
                  Voltar ao cardápio
                </button>
              </div>
            ) : (
              <>
                <div className="card" style={{ padding: '0.5rem 1.5rem', marginBottom: '1.5rem' }}>
                  {cart.map((item, idx) => (
                    <div key={item.id} style={{ borderBottom: idx < cart.length - 1 ? '1px solid var(--border)' : 'none', padding: '1rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.quantity}x {item.name}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                            <Minus size={14} />
                          </button>
                          <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px dashed var(--border)', margin: '0.5rem 0 1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total a Adicionar</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isSubmitting ? 'Finalizando...' : <><Send size={20} /> Finalizar Pedido</>}
                </button>
              </>
            )}
          </motion.div>
        )}

        {view === 'status' && currentOrderId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1.5rem' }}>
              {orderStatus === 'pronto' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--sage-100)', color: 'var(--sage-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle size={40} />
                </motion.div>
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: getStatusColor(orderStatus).bg, color: getStatusColor(orderStatus).text, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Clock size={40} />
                </div>
              )}
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Status da Comanda</h2>
              
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', background: getStatusColor(orderStatus).bg, color: getStatusColor(orderStatus).text, fontWeight: 800, fontSize: '1rem', marginTop: '0.5rem', border: `2px solid ${getStatusColor(orderStatus).text}30` }}>
                {getStatusColor(orderStatus).label}
              </div>

              <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Tudo certo com a sua mesa!<br/>
                Caso queira pedir mais coisas, é só clicar abaixo.
              </p>

              <button 
                onClick={handlePedirMais}
                className="btn btn-primary"
                style={{ marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} /> Pedir Mais Itens
              </button>
            </div>

            {/* ITENS DA COMANDA */}
            {orderItems && orderItems.length > 0 && (
              <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <Receipt size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Itens Solicitados</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {orderItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity}x {formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '2px dashed var(--border)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total da Conta</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>R$ {orderTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating Cart Button */}
      {view === 'menu' && itemCount > 0 && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1.25rem', background: 'linear-gradient(to top, var(--bg-app) 80%, transparent)', zIndex: 20 }}
        >
          <button 
            className="btn btn-primary"
            onClick={() => setView('cart')}
            style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-xl)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{itemCount}</div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Finalizar Pedido</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>R$ {total.toFixed(2)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ClientMenu;
