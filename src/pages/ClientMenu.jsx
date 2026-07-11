import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Minus, ShoppingCart, CheckCircle, Clock, Utensils, Send, User, Receipt, X } from 'lucide-react';
import { motion } from 'framer-motion';
import CARDAPIO from '../data/cardapio';
import { formatPrice } from '../lib/format';
import { splitAndPrint } from '../lib/printer';

const ClientMenu = () => {
  const { tableId: urlTable } = useParams();
  const [tableId, setTableId] = useState('');
  const [showTableInput, setShowTableInput] = useState(true);

  useEffect(() => {
    if (urlTable) {
      const num = parseInt(urlTable.replace(/\D/g, ''), 10);
      if (num >= 1 && num <= 7) {
        setTableId(String(num));
        setShowTableInput(false);
      }
    }
  }, [urlTable]);
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
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(() => {
    const saved = localStorage.getItem('fino_last_order_time');
    return saved ? Number(saved) : 0;
  });
  const [variantModal, setVariantModal] = useState(null);

  // Gera ou recupera client_token UUID único por sessão (não precisa de login)
  const [clientToken] = useState(() => {
    let token = localStorage.getItem('fino_client_token');
    if (!token) {
      // crypto.randomUUID() disponível em todos navegadores modernos
      token = crypto.randomUUID();
      localStorage.setItem('fino_client_token', token);
    }
    return token;
  });

  const mesaValida = tableId.trim() !== '' && parseInt(tableId, 10) >= 1 && parseInt(tableId, 10) <= 7;

  const sections = category === 'Todas'
    ? CARDAPIO
    : CARDAPIO.filter(s => s.category === category);

  // Session Persistence
  useEffect(() => {
    if (!tableId) return;
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
      setIsLoadingOrder(true);
      const { data } = await supabase
        .from('pedidos')
        .select('status, itens, total, client_token')
        .eq('id', currentOrderId)
        .maybeSingle();
      setIsLoadingOrder(false);
      if (data) {
        if (data.client_token === clientToken) {
          setOrderStatus(data.status);
          setOrderItems(data.itens || []);
          setOrderTotal(data.total || 0);
        } else {
          setCurrentOrderId(null);
          setView('menu');
        }
      }
    };
    
    fetchOrder();

    const channel = supabase
      .channel(`pedido_${currentOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${currentOrderId}` }, (payload) => {
        if (!payload.new) return;
        if (payload.new.client_token !== clientToken) return;
        setOrderStatus(payload.new.status);
        setOrderItems(payload.new.itens || []);
        setOrderTotal(payload.new.total || 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrderId, clientToken]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === product.cartKey);
      if (existing) return prev.map(i => i.cartKey === product.cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addVariantToCart = (item, variant) => {
    addToCart({
      ...item,
      name: `${item.name} ${variant.label}`,
      price: variant.price,
      category: item.category,
      cartKey: `${item.id}-${variant.label}`,
    });
    setVariantModal(null);
  };

  const updateQuantity = (cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const q = i.quantity + delta;
      return q < 1 ? null : { ...i, quantity: q };
    }).filter(Boolean));
  };

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);


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
    if (!mesaValida) { alert('Mesa inválida. Escolha uma mesa de 1 a 7.'); return; }

    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      alert('Aguarde 30 segundos entre os pedidos.');
      return;
    }

    setIsSubmitting(true);
    try {
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
            status: 'preparando'
          }).eq('id', currentOrderId);

          setOrderItems(newItens);
          setOrderTotal(newTotal);
          setOrderStatus('preparando');
          setView('status');
          setCart([]);
          localStorage.setItem('fino_last_order_time', String(now));
          setLastSubmitTime(now);
          setIsSubmitting(false);
          splitAndPrint({ ...existingOrder, id: currentOrderId, itens: cart, cliente_nome: clientName, mesa: tableId, total, tipo: 'mesa', observacao: null });
          return;
        }
      }

      const orderData = {
        mesa: tableId,
        cliente_nome: clientName,
        status: 'preparando',
        itens: cart,
        total: total,
        tipo: 'mesa',
        client_token: clientToken
      };

      const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();

      if (error) throw error;

      setCurrentOrderId(data.id);
      setOrderItems(cart);
      setOrderTotal(total);
      setOrderStatus('preparando');
      setView('status');
      setCart([]);

      splitAndPrint({ ...data });

      localStorage.setItem(`fino_sabor_table_${tableId}`, JSON.stringify({
        clientName: clientName.trim(),
        currentOrderId: data.id
      }));
      localStorage.setItem('fino_last_order_time', String(now));
      setLastSubmitTime(now);

    } catch (err) {
      console.error("Erro ao fazer pedido:", err);
      if (err.message && err.message.includes('violates row-level security')) {
        alert('Erro de permissão. Recarregue a página e tente novamente.');
      } else if (err.message && err.message.includes('Preço inválido')) {
        alert('Erro de segurança: preço inválido detectado. Recarregue a página.');
      } else if (err.message && err.message.includes('Total do pedido não confere')) {
        alert('Erro de segurança: total adulterado detectado.');
      } else {
        alert("Houve um erro ao enviar seu pedido. Chame um garçom.");
      }
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

  // Table input screen (shown when no tableId in URL)
  if (showTableInput) {
    return (
      <div className="client-hero welcome-hero">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem', background: 'rgba(9,9,9,0.9)', border: '1px solid rgba(255,132,14,0.32)', color: '#f4f0e9', boxShadow: '0 24px 70px rgba(0,0,0,0.5)' }}
        >
          <div style={{ width: 64, height: 64, background: 'rgba(255,132,14,0.14)', border: '1px solid rgba(255,132,14,0.42)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ff8507' }}>
            <Utensils size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8f4ef', marginBottom: '0.5rem' }}>Qual sua mesa?</h1>
          <p style={{ color: '#cfc8c1', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Informe o número da mesa para fazer seu pedido
          </p>
          <div className="input-wrap" style={{ marginBottom: '1.5rem' }}>
            <div className="input-icon"><Utensils size={18} /></div>
            <input 
              type="number" min="1" max="7"
              className="form-input has-icon"
              placeholder="Nº da mesa" 
              value={tableId} 
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '');
                if (v === '' || (parseInt(v, 10) >= 1 && parseInt(v, 10) <= 7)) {
                  setTableId(v);
                }
              }}
              onKeyDown={e => e.key === 'Enter' && mesaValida && setShowTableInput(false)}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => mesaValida && setShowTableInput(false)}
            disabled={!mesaValida}
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}
          >
            Entrar
          </button>
        </motion.div>
      </div>
    );
  }

  // Welcome Screen to get Name
  if (!isNameSet) {
    return (
      <div className="client-hero welcome-hero">
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
            Mesa <strong>{tableId}</strong><br/>
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
    <div className="client-menu-container">
      {/* Header */}
      <header className="client-menu-header">
        <div className="client-menu-header-content">
          <div className="client-menu-header-info">
            <h1 className="client-menu-header-title">Olá, {clientName}!</h1>
            <p className="client-menu-header-subtitle">Mesa {tableId}</p>
          </div>
          {currentOrderId && (
            <button 
              className="btn btn-secondary btn-sm client-menu-comanda-btn"
              onClick={() => setView('status')}
            >
              <Clock size={16} /> Ver Comanda
            </button>
          )}
        </div>
      </header>

      <main className="client-menu-main">
        
        {view === 'menu' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Categories */}
            <div className="client-menu-tabs">
              {['Todas', ...CARDAPIO.map(s => s.category)].map(cat => (
                <button
                  key={cat}
                  className={`client-menu-tab${category === cat ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Sections */}
            {sections.map(section => (
              <div key={section.category} className="client-section-wrapper">
                <div className="client-section-header">
                  <div className="client-section-banner" style={{ backgroundImage: `url(${section.image})` }} />
                  <div className="client-section-overlay" />
                  <h3 className="client-section-title">{section.category}</h3>
                </div>
                <div className="client-menu-items">
                  {section.items.map(item => {
                    const inCart = cart.find(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="client-menu-item"
                        onClick={() => {
                          if (item.variants?.length > 0) {
                            setVariantModal({ ...item, category: section.category });
                          } else {
                            addToCart({ ...item, category: section.category, cartKey: `${item.id}-${Date.now()}` });
                          }
                        }}
                      >
                        {item.image ? (
                          <div className="client-menu-item-image" style={{ backgroundImage: `url(${item.image})` }} />
                        ) : (
                          <div className="client-menu-item-image client-menu-item-image-placeholder" />
                        )}
                        <div className="client-menu-item-content">
                          <div className="client-menu-item-name">{item.name}</div>
                          {item.price > 0 && (
                            <p className="client-menu-item-desc" style={{ fontWeight: 800, color: 'var(--primary)', marginTop: '0.15rem' }}>{formatPrice(item.price)}</p>
                          )}
                          {item.desc && !item.variants && (
                            <p className="client-menu-item-desc">{item.desc}</p>
                          )}
                          {item.variantLabel && (
                            <p className="client-menu-item-desc" style={{ color: 'var(--primary)', fontWeight: 700, marginTop: '0.25rem' }}>{item.variantLabel}</p>
                          )}
                        </div>
                        <div className="client-menu-item-actions">
                          {inCart && (
                            <button
                              className="client-menu-item-btn-remove"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(inCart.cartKey, -1); }}
                              type="button"
                            >
                              −
                            </button>
                          )}
                          {inCart && (
                            <span className="client-menu-item-qty">
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
                    <div key={item.cartKey || item.id} style={{ borderBottom: idx < cart.length - 1 ? '1px solid var(--border)' : 'none', padding: '1rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.quantity}x {item.name}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateQuantity(item.cartKey, -1)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                            <Minus size={14} />
                          </button>
                          <button onClick={() => updateQuantity(item.cartKey, 1)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px dashed var(--border)', margin: '0.5rem 0 1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total a Adicionar</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatPrice(total)}</span>
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
            {isLoadingOrder ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Carregando comanda...</p>
              </div>
            ) : (
              <>
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
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            )}
              </>
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
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{formatPrice(total)}</span>
          </button>
            </motion.div>
          )}

          {/* Variant Selection Modal */}
          {variantModal && (
            <div className="pos-overlay pos-overlay-cart" onClick={() => setVariantModal(null)}>
              <div className="pos-drawer" onClick={e => e.stopPropagation()}>
                <div className="pos-drawer-header">
                  <div className="pos-drawer-handle" onClick={() => setVariantModal(null)}>
                    <div className="pos-drawer-handle-bar" />
                  </div>
                  <div className="pos-drawer-title-row">
                    <h3 className="pos-drawer-title">{variantModal.name}</h3>
                    <button className="pos-drawer-close" onClick={() => setVariantModal(null)}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="pos-drawer-body">
                  <div style={{ padding: '1rem 0' }}>
                    {variantModal.variants && variantModal.variants.map((v, idx) => (
                      <button
                        key={idx}
                        className="pos-existing-item"
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                        onClick={() => addVariantToCart(variantModal, v)}
                      >
                        <span>{v.label}</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(v.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default ClientMenu;
