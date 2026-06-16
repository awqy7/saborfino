import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Minus, Search, ShoppingCart,
  Printer, X, CheckCircle, UtensilsCrossed,
  Bike, Hash, MessageSquare, RotateCcw,
  ChevronRight, Trash2, AlertCircle, User,
  LayoutList, PanelRightOpen
} from 'lucide-react';
import CARDAPIO from '../data/cardapio';
import { formatPrice } from '../lib/format';

const ORDER_TYPES = [
  { id: 'mesa',    label: 'Mesa',     icon: UtensilsCrossed },
  { id: 'balcao',  label: 'Balcão',   icon: ShoppingCart    },
  { id: 'entrega', label: 'Entrega',  icon: Bike            },
];

const categories = ['Todas', ...CARDAPIO.map(s => s.category)];

const allProducts = CARDAPIO.flatMap(section =>
  section.items.map(item => ({ ...item, category: section.category }))
);

function ProductCard({ product, inCart, onAdd, onRemoveOne }) {
  return (
    <div className={`pcard${inCart ? ' pcard-incart' : ''}`} onClick={() => onAdd(product)}>
      <div className="pcard-img" style={{ backgroundImage: `url(${product.image})` }} />
      <div className="pcard-body">
        <span className="pcard-name">{product.name}</span>
        <span className="pcard-price">{formatPrice(product.price)}</span>
      </div>
      <div className="pcard-action">
        {inCart ? (
          <>
            <span className="pcard-qty">{inCart.quantity}</span>
            <button className="pcard-btn pcard-btn-minus" onClick={e => { e.stopPropagation(); onRemoveOne(product.id); }}>
              <Minus size={12} />
            </button>
          </>
        ) : (
          <span className="pcard-btn pcard-btn-add">
            <Plus size={14} />
          </span>
        )}
      </div>
    </div>
  );
}

const POS = ({ onToggleSidebar }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todas');
  const [orderType, setOrderType] = useState('mesa');
  const [mesa, setMesa] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [obs, setObs] = useState('');
  const [step, setStep] = useState('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrders, setExistingOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showCart, setShowCart] = useState(true);
  const [cartMobileOpen, setCartMobileOpen] = useState(false);

  const mesaNum = mesa.trim();

  useEffect(() => {
    if (orderType === 'mesa' && mesaNum.length > 0) {
      const timer = setTimeout(() => fetchExistingOrders(mesa), 400);
      return () => clearTimeout(timer);
    } else {
      setExistingOrders([]);
    }
  }, [mesa, orderType]);

  const fetchExistingOrders = async (num) => {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('id, mesa, cliente_nome, status, total, itens, created_at')
        .eq('mesa', num)
        .not('status', 'eq', 'pago')
        .not('status', 'eq', 'cancelado')
        .order('created_at', { ascending: false });
      setExistingOrders(data || []);
    } catch {
      setExistingOrders([]);
    }
  };

  const filteredProducts = useMemo(() =>
    allProducts.filter(p =>
      (category === 'Todas' || p.category === category) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [category, searchTerm]
  );

  const groupedProducts = useMemo(() => {
    if (category !== 'Todas') return null;
    return CARDAPIO
      .map(s => ({ ...s, items: s.items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())) }))
      .filter(s => s.items.length > 0);
  }, [category, searchTerm]);

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeOne = (id) => setCart(prev => prev.map(i => i.id === id ? (i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : null) : i).filter(Boolean));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const canFinalize = cart.length > 0 && (orderType !== 'mesa' || mesaNum !== '');

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    setClienteNome(order.cliente_nome || '');
  };

  const handleFinalize = async () => {
    if (!canFinalize || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const mesaLabel = orderType === 'mesa' ? mesa : ORDER_TYPES.find(t => t.id === orderType)?.label;
      const orderData = {
        mesa: mesaLabel,
        cliente_nome: clienteNome.trim() || 'Atendente',
        status: 'pendente',
        itens: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total,
        tipo: orderType,
        observacao: obs || null,
      };

      if (selectedOrderId) {
        const { data: existing } = await supabase.from('pedidos').select('itens, total, status').eq('id', selectedOrderId).single();
        if (existing && existing.status !== 'pago' && existing.status !== 'cancelado') {
          await supabase.from('pedidos').update({
            itens: [...(existing.itens || []), ...orderData.itens],
            total: Number(existing.total || 0) + total,
            status: 'pendente'
          }).eq('id', selectedOrderId);
          setStep('finalized');
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from('pedidos').insert([orderData]);
      if (error) throw error;
      setStep('finalized');
    } catch {
      alert('Erro ao enviar pedido para a cozinha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNovoPedido = () => {
    setCart([]);
    setMesa(''); setClienteNome(''); setObs('');
    setOrderType('mesa'); setStep('cart');
    setSearchTerm(''); setCategory('Todas');
    setSelectedOrderId(null); setExistingOrders([]);
  };

  if (step === 'finalized') {
    return (
      <div className="pos-finalized-screen">
        <div className="pos-finalized-card">
          <div className="pos-finalized-icon-wrap"><CheckCircle size={48} /></div>
          <h2>Pedido Finalizado!</h2>
          <p>{orderType === 'mesa' ? `Mesa ${mesa}` : ORDER_TYPES.find(t => t.id === orderType)?.label}{clienteNome ? ` · ${clienteNome}` : ''}</p>
          <div className="pos-finalized-total">{formatPrice(total)}</div>
          <button className="btn btn-primary" onClick={handleNovoPedido} style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
            <RotateCcw size={16} /> Novo Pedido
          </button>
          <button className="btn btn-ghost" onClick={window.print} style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>
    );
  }

  const renderProducts = () => (
    <div className="pos-products-area">
      {category === 'Todas' && groupedProducts ? (
        groupedProducts.map(section => (
          <div key={section.category}>
            <div className="pos-cat-head"><span>{section.category}</span></div>
            <div className="pcard-grid">
              {section.items.map(product => (
                <ProductCard key={product.id} product={product} inCart={cart.find(i => i.id === product.id)} onAdd={addToCart} onRemoveOne={removeOne} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="pcard-grid">
          {filteredProducts.length === 0 ? (
            <div className="pos-empty"><AlertCircle size={24} /><p>Nenhum item encontrado</p></div>
          ) : (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} inCart={cart.find(i => i.id === product.id)} onAdd={addToCart} onRemoveOne={removeOne} />
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderCart = () => (
    <div className="pos-cart">
      <div className="pos-cart-inner">
        <div className="pos-cart-section">
          <div className="pos-cart-order-type">
            {ORDER_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`pos-order-btn${orderType === t.id ? ' active' : ''}`} onClick={() => setOrderType(t.id)}>
                  <Icon size={15} /><span>{t.label}</span>
                </button>
              );
            })}
          </div>
          {orderType === 'mesa' && (
            <div className="pos-mesa-wrap">
              <Hash size={14} className="pos-mesa-icon" />
              <input type="number" min="1" placeholder="Nº da mesa" value={mesa} onChange={e => { setMesa(e.target.value); setSelectedOrderId(null); }} className="pos-mesa-field" />
              {selectedOrderId && <span className="pos-mesa-badge">+</span>}
            </div>
          )}
          {existingOrders.length > 0 && (
            <div className="pos-existing">
              <div className="pos-existing-title">Pedidos nesta mesa:</div>
              {existingOrders.map(order => (
                <button key={order.id} className={`pos-existing-item${selectedOrderId === order.id ? ' selected' : ''}`} onClick={() => handleSelectOrder(order)}>
                  <span>{order.cliente_nome || 'Sem nome'} · {order.itens?.length || 0} itens</span>
                  <span className="pos-existing-total">{formatPrice(order.total)}</span>
                </button>
              ))}
              {selectedOrderId && <div className="pos-existing-hint">Itens serão adicionados</div>}
            </div>
          )}
        </div>

        <div className="pos-cart-section">
          <div className="pos-cart-field">
            <User size={14} />
            <input type="text" placeholder="Nome do cliente" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
          </div>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <ShoppingCart size={28} />
              <p>Carrinho vazio</p>
              <span>Clique nos itens do cardápio</span>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pos-cart-row">
                <div className="pos-cart-row-info">
                  <div className="pos-cart-row-name">{item.name}</div>
                  <div className="pos-cart-row-sub">{formatPrice(item.price)}</div>
                </div>
                <div className="pos-cart-row-qty">
                  <button className="pos-cart-row-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={10} /></button>
                  <span className="pos-cart-row-val">{item.quantity}</span>
                  <button className="pos-cart-row-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={10} /></button>
                </div>
                <button className="pos-cart-row-rm" onClick={() => removeFromCart(item.id)}><X size={13} /></button>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-field" style={{ margin: '0 1rem 0.5rem' }}>
          <MessageSquare size={14} />
          <input type="text" placeholder="Observação (ex: sem cebola)" value={obs} onChange={e => setObs(e.target.value)} />
        </div>

        <div className="pos-cart-footer">
          <div className="pos-cart-total-row">
            <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            <span className="pos-cart-total-val">{formatPrice(total)}</span>
          </div>
          <button className="pos-cart-finalize" disabled={!canFinalize || isSubmitting} onClick={handleFinalize}>
            {isSubmitting ? 'Enviando...' : <><ChevronRight size={18} /> Finalizar Pedido</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pos">
      <div className="pos-topbar">
        <div className="pos-topbar-left">
          <button className="pos-topbar-menu-btn" onClick={onToggleSidebar} aria-label="Abrir menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <UtensilsCrossed size={18} className="pos-topbar-icon" />
          <span className="pos-topbar-title">Cardápio</span>
          <span className="pos-topbar-count">{allProducts.length} itens</span>
        </div>
        <div className="pos-topbar-right">
          <button className="pos-topbar-cart-btn" onClick={() => setCartMobileOpen(true)}>
            <ShoppingCart size={16} />
            {itemCount > 0 && <span className="pos-topbar-badge">{itemCount > 99 ? '99+' : itemCount}</span>}
          </button>
        </div>
      </div>

      <div className="pos-search-wrap">
        <Search size={16} className="pos-search-icon" />
        <input className="pos-search-field" type="text" placeholder="Buscar prato, bebida..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {searchTerm && <button className="pos-search-clear" onClick={() => setSearchTerm('')}><X size={15} /></button>}
      </div>

      <div className="pos-cats">
        {categories.map(cat => (
          <button key={cat} className={`pos-cat${category === cat ? ' active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      <div className="pos-body">
        <div className="pos-body-main">
          {renderProducts()}
        </div>
        <div className="pos-body-cart">
          {renderCart()}
        </div>
      </div>

      {itemCount > 0 && (
        <div className="pos-bar" onClick={() => setCartMobileOpen(true)}>
          <div className="pos-bar-info">
            <ShoppingCart size={16} />
            <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          </div>
          <div className="pos-bar-right">
            <span className="pos-bar-total">{formatPrice(total)}</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}

      {cartMobileOpen && (
        <div className="pos-overlay" onClick={() => setCartMobileOpen(false)}>
          <div className="pos-drawer" onClick={e => e.stopPropagation()}>
            <div className="pos-drawer-handle" onClick={() => setCartMobileOpen(false)}>
              <div className="pos-drawer-handle-bar" />
            </div>
            <div className="pos-drawer-body">
              {renderCart()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
