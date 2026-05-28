import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Minus, Search, ShoppingCart,
  Printer, X, CheckCircle, UtensilsCrossed,
  Bike, Hash, MessageSquare, RotateCcw,
  ChevronRight, Trash2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CARDAPIO from '../data/cardapio';

const ORDER_TYPES = [
  { id: 'mesa',    label: 'Mesa',     icon: UtensilsCrossed },
  { id: 'balcao',  label: 'Balcão',   icon: ShoppingCart    },
  { id: 'entrega', label: 'Entrega',  icon: Bike            },
];

const categories = ['Todas', ...CARDAPIO.map(s => s.category)];

const allProducts = CARDAPIO.flatMap(section =>
  section.items.map(item => ({
    ...item,
    category: section.category,
  }))
);

const ProductCard = React.memo(({ product, inCart, onAdd, onRemoveOne }) => {
  const [clicked, setClicked] = useState(false);
  const priceLabel = '';

  const handleClick = () => {
    setClicked(true);
    onAdd(product);
    setTimeout(() => setClicked(false), 150);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: clicked ? 0.96 : 1,
      }}
      transition={{ duration: 0.15 }}
      className={`pos-card${inCart ? ' pos-card-in-cart' : ''}`}
      onClick={handleClick}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className="pos-card-image"
        style={{ backgroundImage: `url(${product.image})` }}
      />
      <div className="pos-card-top">
        <span className="pos-card-cat">{product.category}</span>
      </div>
      <div className="pos-card-name">{product.name}</div>
      <div className="pos-card-bottom">
        <span className="pos-card-price">{priceLabel}</span>
        <div className="pos-card-actions">
          {inCart ? (
            <>
              <button
                className="pos-qty-btn pos-qty-minus"
                onClick={(e) => { e.stopPropagation(); onRemoveOne(product.id); }}
              >
                <Minus size={12} />
              </button>
              <span className="pos-qty-badge">{inCart.quantity}</span>
              <button
                className="pos-qty-btn pos-qty-plus"
                onClick={(e) => { e.stopPropagation(); onAdd(product); }}
              >
                <Plus size={12} />
              </button>
            </>
          ) : (
            <button
              className="pos-add-btn"
              onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const POS = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todas');
  const [orderType, setOrderType] = useState('mesa');
  const [mesa, setMesa] = useState('');
  const [obs, setObs] = useState('');
  const [step, setStep] = useState('cart');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() =>
    allProducts.filter(p =>
      (category === 'Todas' || p.category === category) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [category, searchTerm]
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeOne = (id) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const q = i.quantity - 1;
      return q < 1 ? null : { ...i, quantity: q };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const q = i.quantity + delta;
      return q < 1 ? null : { ...i, quantity: q };
    }).filter(Boolean));
  };

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const canFinalize = cart.length > 0 && (orderType !== 'mesa' || mesa.trim() !== '');

  const handleFinalize = async () => {
    if (!canFinalize || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const mesaLabel = orderType === 'mesa' ? mesa : ORDER_TYPES.find(t => t.id === orderType)?.label;
      const orderData = {
        mesa: mesaLabel,
        cliente_nome: 'Atendente',
        status: 'pendente',
        itens: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: total,
        tipo: orderType,
        observacao: obs || null,
      };
      const { error } = await supabase.from('pedidos').insert([orderData]);
      if (error) throw error;
      setStep('finalized');
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      alert('Erro ao enviar pedido para a cozinha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => window.print();

  const handleNovoPedido = () => {
    setCart([]);
    setMesa('');
    setObs('');
    setOrderType('mesa');
    setStep('cart');
    setSearchTerm('');
    setCategory('Todas');
  };

  const clearCart = () => {
    setCart([]);
    setObs('');
  };

  if (step === 'finalized') {
    return (
      <div className="pos-container">
        <div className="pos-left">
          <div>
            <h1 className="pos-title">Cardápio</h1>
            <p className="pos-subtitle">Pedido finalizado</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="pos-finalized"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="pos-finalized-icon"
            >
              <CheckCircle size={42} />
            </motion.div>
            <h2 className="pos-finalized-title">Pedido Finalizado!</h2>
            <p className="pos-finalized-desc">
              {orderType === 'mesa' ? `Mesa ${mesa}` : ORDER_TYPES.find(t => t.id === orderType)?.label}
              {obs && ` · ${obs}`}
            </p>
            <motion.button
              className="btn btn-secondary"
              style={{ gap: '0.5rem', marginTop: '0.5rem' }}
              onClick={handleNovoPedido}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={15} />
              Novo Pedido
            </motion.button>
          </motion.div>
        </div>

        {/* Finalized right panel */}
        <div className="pos-right">
          <div className="pos-cart-header">
            <div className="pos-cart-header-left">
              <CheckCircle size={18} color="#059669" />
              <span className="pos-cart-title" style={{ color: '#059669' }}>Pedido Confirmado</span>
            </div>
            <span className="pos-cart-time">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="pos-cart-tags">
            <span className="pos-tag pos-tag-order">
              {orderType === 'mesa' && <><UtensilsCrossed size={12} /> Mesa {mesa}</>}
              {orderType === 'balcao' && <><ShoppingCart size={12} /> Balcão</>}
              {orderType === 'entrega' && <><Bike size={12} /> Entrega</>}
            </span>
            {obs && <span className="pos-tag pos-tag-obs"><MessageSquare size={12} /> {obs}</span>}
          </div>
          <div className="pos-cart-items">
            {cart.map(item => (
              <div key={item.id} className="pos-cart-item pos-cart-item-dim">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">{item.name}</div>
                  <div className="pos-cart-item-sub"></div>
                </div>
                <span className="pos-cart-item-qty">×{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pos-cart-footer">
            <div className="pos-total-row">
              <span className="pos-total-label">Total</span>
              <span className="pos-total-value"></span>
            </div>
            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', borderRadius: 'var(--radius-lg)' }}
              onClick={handlePrint}
              whileTap={{ scale: 0.97 }}
            >
              <Printer size={16} />
              Imprimir Comprovante
            </motion.button>
          </div>
        </div>

        {/* Printable receipt */}
        <div id="printable-receipt" className="print-only" style={{ padding: 20, fontFamily: 'monospace', color: 'black', fontSize: 13 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>Fino Sabor</h1>
            <p style={{ margin: '4px 0' }}>Churrascaria</p>
            <p style={{ margin: '4px 0', fontSize: 11 }}>{new Date().toLocaleString('pt-BR')}</p>
            <hr />
          </div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>
            Tipo: {orderType === 'mesa' ? `Mesa ${mesa}` : ORDER_TYPES.find(t => t.id === orderType)?.label}
          </p>
          {obs && <p style={{ marginBottom: 8, fontStyle: 'italic' }}>Obs: {obs}</p>}
          <hr />
          <table style={{ width: '100%', marginBottom: 12 }}>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.quantity}x {item.name}</td>
                  <td style={{ textAlign: 'right' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 8 }}>
            <span>TOTAL:</span>
            <span></span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11 }}>
            <p>Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      {/* ===== LEFT: Product Grid ===== */}
      <div className="pos-left">
        {/* Header */}
        <div className="pos-header">
          <div>
            <h1 className="pos-title">Cardápio</h1>
            <p className="pos-subtitle">
              {category === 'Todas' ? `${filteredProducts.length} itens` : filteredProducts.length > 0 ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'itens'}` : 'Nenhum item'}
            </p>
          </div>
          {itemCount > 0 && (
            <motion.button
              className="pos-cart-btn-desktop"
              onClick={() => setShowMobileCart(true)}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart size={16} />
              <span>{itemCount}</span>
            </motion.button>
          )}
        </div>

        {/* Search */}
        <div className="pos-search">
          <Search size={15} className="pos-search-icon" />
          <input
            type="text"
            placeholder="Buscar prato, bebida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pos-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="pos-search-clear">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="pos-categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pos-cat-btn${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="pos-products">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pos-products-empty"
              >
                <AlertCircle size={24} />
                <p>Nenhum item encontrado</p>
              </motion.div>
            ) : (
              filteredProducts.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inCart={inCart}
                    onAdd={addToCart}
                    onRemoveOne={removeOne}
                  />
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== RIGHT: Cart ===== */}
      <div className="pos-right">
        <div className="pos-cart-header">
          <div className="pos-cart-header-left">
            <ShoppingCart size={18} className="pos-cart-header-icon" />
            <span className="pos-cart-title">Pedido</span>
            {itemCount > 0 && <span className="pos-cart-count">{itemCount}</span>}
          </div>
          {cart.length > 0 && (
            <button className="pos-cart-clear" onClick={clearCart}>
              <Trash2 size={14} />
              Limpar
            </button>
          )}
        </div>

        {/* Order Type */}
        <div className="pos-order-type">
          <span className="pos-label">Tipo de Pedido</span>
          <div className="pos-order-type-row">
            {ORDER_TYPES.map(t => {
              const Icon = t.icon;
              const active = orderType === t.id;
              return (
                <motion.button
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`pos-type-btn${active ? ' active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {orderType === 'mesa' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={`pos-mesa-input${mesa ? ' filled' : ''}`}>
                  <Hash size={14} className="pos-mesa-icon" />
                  <input
                    type="number" min="1" placeholder="Número da mesa"
                    value={mesa} onChange={e => setMesa(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Items */}
        <div className="pos-cart-items">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pos-cart-empty"
              >
                <div className="pos-cart-empty-icon">
                  <ShoppingCart size={22} />
                </div>
                <p className="pos-cart-empty-title">Carrinho vazio</p>
                <p className="pos-cart-empty-desc">Clique nos itens do cardápio</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="pos-cart-item"
                >
                  <div className="pos-cart-item-info">
                    <div className="pos-cart-item-name">{item.name}</div>
                    <div className="pos-cart-item-sub"></div>
                  </div>
                  <div className="pos-cart-qty">
                    <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus size={10} />
                    </button>
                    <span className="pos-cart-qty-val">{item.quantity}</span>
                    <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus size={10} />
                    </button>
                  </div>
                  <button className="pos-cart-remove" onClick={() => removeFromCart(item.id)}>
                    <X size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Obs */}
        {cart.length > 0 && (
          <div className="pos-cart-obs">
            <div className="pos-cart-obs-header">
              <MessageSquare size={13} />
              <span className="pos-label">Observação</span>
            </div>
            <textarea
              rows={1}
              placeholder="Ex: sem cebola, ponto da carne..."
              value={obs}
              onChange={e => setObs(e.target.value)}
              className="pos-obs-input"
            />
          </div>
        )}

        {/* Footer */}
        <div className="pos-cart-footer">
          {cart.length > 0 && (
            <>
              <div className="pos-subtotal">
                <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
                <span></span>
              </div>
              <div className="pos-divider" />
            </>
          )}
          <div className="pos-total-row">
            <span className="pos-total-label">Total</span>
            <span className="pos-total-value"></span>
          </div>
          {cart.length > 0 && orderType === 'mesa' && !mesa.trim() && (
            <p className="pos-hint"><Hash size={11} /> Informe o número da mesa</p>
          )}
          <motion.button
            className="btn btn-primary pos-btn-finalize"
            disabled={!canFinalize || isSubmitting}
            onClick={handleFinalize}
            whileTap={canFinalize ? { scale: 0.97 } : {}}
          >
            {isSubmitting ? 'Enviando...' : <><ChevronRight size={16} /> Finalizar Pedido</>}
          </motion.button>
        </div>
      </div>

      {/* Mobile FAB */}
      {itemCount > 0 && (
        <motion.button
          className="pos-fab"
          onClick={() => setShowMobileCart(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ShoppingCart size={22} />
          <span className="pos-fab-badge">{itemCount}</span>
        </motion.button>
      )}

      {/* Mobile Sheet */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div
              className="pos-sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileCart(false)}
            />
            <motion.div
              className="pos-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            >
              <div className="pos-sheet-handle" onClick={() => setShowMobileCart(false)}>
                <div className="pos-sheet-handle-bar" />
              </div>
              {/* Mobile cart content */}
              <div className="pos-sheet-content">
                <div className="pos-cart-header">
                  <div className="pos-cart-header-left">
                    <ShoppingCart size={18} />
                    <span className="pos-cart-title">Pedido</span>
                    {itemCount > 0 && <span className="pos-cart-count">{itemCount}</span>}
                  </div>
                  {cart.length > 0 && (
                    <button className="pos-cart-clear" onClick={clearCart}>
                      <Trash2 size={14} /> Limpar
                    </button>
                  )}
                </div>
                <div className="pos-order-type">
                  <span className="pos-label">Tipo de Pedido</span>
                  <div className="pos-order-type-row">
                    {ORDER_TYPES.map(t => {
                      const Icon = t.icon;
                      const active = orderType === t.id;
                      return (
                        <motion.button
                          key={t.id}
                          onClick={() => setOrderType(t.id)}
                          whileTap={{ scale: 0.95 }}
                          className={`pos-type-btn${active ? ' active' : ''}`}
                        >
                          <Icon size={16} />
                          <span>{t.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {orderType === 'mesa' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className={`pos-mesa-input${mesa ? ' filled' : ''}`}>
                          <Hash size={14} className="pos-mesa-icon" />
                          <input type="number" min="1" placeholder="Número da mesa" value={mesa} onChange={e => setMesa(e.target.value)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="pos-cart-items">
                  <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                      <div className="pos-cart-empty">
                        <div className="pos-cart-empty-icon"><ShoppingCart size={22} /></div>
                        <p className="pos-cart-empty-title">Carrinho vazio</p>
                        <p className="pos-cart-empty-desc">Clique nos itens do cardápio</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="pos-cart-item"
                        >
                          <div className="pos-cart-item-info">
                            <div className="pos-cart-item-name">{item.name}</div>
                            <div className="pos-cart-item-sub"></div>
                          </div>
                          <div className="pos-cart-qty">
                            <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={10} /></button>
                            <span className="pos-cart-qty-val">{item.quantity}</span>
                            <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={10} /></button>
                          </div>
                          <button className="pos-cart-remove" onClick={() => removeFromCart(item.id)}><X size={14} /></button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
                {cart.length > 0 && (
                  <div className="pos-cart-obs">
                    <div className="pos-cart-obs-header">
                      <MessageSquare size={13} />
                      <span className="pos-label">Observação</span>
                    </div>
                    <textarea rows={2} placeholder="Ex: sem cebola, ponto da carne..." value={obs} onChange={e => setObs(e.target.value)} className="pos-obs-input" />
                  </div>
                )}
                <div className="pos-cart-footer">
                  {cart.length > 0 && (
                    <>
                      <div className="pos-subtotal">
                        <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
                        <span></span>
                      </div>
                      <div className="pos-divider" />
                    </>
                  )}
                  <div className="pos-total-row">
                    <span className="pos-total-label">Total</span>
                    <span className="pos-total-value"></span>
                  </div>
                  {cart.length > 0 && orderType === 'mesa' && !mesa.trim() && (
                    <p className="pos-hint"><Hash size={11} /> Informe o número da mesa</p>
                  )}
                  <motion.button
                    className="btn btn-primary pos-btn-finalize"
                    disabled={!canFinalize || isSubmitting}
                    onClick={() => { handleFinalize(); setShowMobileCart(false); }}
                    whileTap={canFinalize ? { scale: 0.97 } : {}}
                  >
                    {isSubmitting ? 'Enviando...' : <><ChevronRight size={16} /> Finalizar Pedido</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
