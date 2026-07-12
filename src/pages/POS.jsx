import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Minus, CheckCircle, RotateCcw,
  ChevronRight, ChevronLeft, ChevronUp,
  ShoppingCart, UtensilsCrossed, Coffee,
  Beer, Wine, GlassWater, ChefHat, Pizza,
  Beef, ArrowLeft, LogOut, Receipt, X,
  Divide, Users,
} from 'lucide-react';
import CARDAPIO from '../data/cardapio';
import { formatPrice } from '../lib/format';
import { validateOrderData } from '../lib/validation';
import { splitAndPrint } from '../lib/printer';

const MAX_TABLES = 8;

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

const MULTI_ITEM_CATEGORIES = ['Bebidas', 'Cervejas', 'Drinks', 'Doses'];

const categories = CARDAPIO.map(s => s.category);

const allProducts = CARDAPIO.flatMap(section =>
  section.items.map(item => ({ ...item, category: section.category }))
);

const POS = () => {
  const [view, setView] = useState('tableGrid');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [existingOrder, setExistingOrder] = useState(null);
  const [activeTables, setActiveTables] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [splitMode, setSplitMode] = useState('igual');
  const [splitPeople, setSplitPeople] = useState(2);
  const [splitPersonItems, setSplitPersonItems] = useState({});
  const lastSubmitRef = useRef(0);
  const SUBMIT_COOLDOWN = 2000;

  useEffect(() => {
    fetchActiveTables();

    const channel = supabase
      .channel('pos_tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchActiveTables();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchActiveTables = async () => {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('id, mesa, status, total, itens, created_at')
        .not('status', 'eq', 'pago')
        .order('created_at', { ascending: false });
      if (!data) return;
      const grouped = {};
      data.forEach(o => {
        const mesa = parseInt(o.mesa, 10);
        if (mesa >= 1 && mesa <= MAX_TABLES) {
          if (!grouped[mesa] || new Date(o.created_at) > new Date(grouped[mesa].created_at)) {
            grouped[mesa] = {
              id: o.id,
              total: o.total,
              itens: o.itens,
              status: o.status,
              created_at: o.created_at,
            };
          }
        }
      });
      setActiveTables(grouped);
    } catch {}
  };

  const handleTableClick = async (tableNum) => {
    setSelectedTable(tableNum);
    setCart([]);
    setExistingOrder(null);
    setSelectedCategory(null);
    setOrderSuccess(false);

    const existing = activeTables[tableNum];
    if (existing) {
      setExistingOrder(existing);
      setView('existingOrder');
    } else {
      setView('categories');
    }
  };

  const handleBackToGrid = () => {
    setView('tableGrid');
    setSelectedTable(null);
    setCart([]);
    setExistingOrder(null);
    setSelectedCategory(null);
    setOrderSuccess(false);
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setView('items');
  };

  const handleItemClick = (item) => {
    const cat = selectedCategory || item.category;
    const key = item.cartKey || `${item.id}-${Date.now()}`;

    setCart(prev => {
      const idx = prev.findIndex(i => i.id === item.id && i.category === cat);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, category: cat, cartKey: key, quantity: 1, serving_time: 'with_food' }];
    });

    if (!MULTI_ITEM_CATEGORIES.includes(cat)) {
      setTimeout(() => setView('categories'), 100);
    }
  };

  const handleQuantity = (cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const q = i.quantity + delta;
      return q < 1 ? null : { ...i, quantity: q };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const hasDrinks = cart.some(i => MULTI_ITEM_CATEGORIES.includes(i.category));

  const handleFinishOrderClick = () => {
    if (cart.length === 0) return;
    if (hasDrinks) {
      setView('drinkTiming');
    } else {
      submitOrder();
    }
  };

  const setAllDrinkTiming = (timing) => {
    setCart(prev => prev.map(i => {
      if (MULTI_ITEM_CATEGORIES.includes(i.category)) {
        return { ...i, serving_time: timing };
      }
      return i;
    }));
  };

  const toggleDrinkTiming = (cartKey) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      return { ...i, serving_time: i.serving_time === 'now' ? 'with_food' : 'now' };
    }));
  };

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN) return;
    // Cross-tab cooldown via localStorage
    const globalLast = parseInt(localStorage.getItem('lastSubmit') || '0', 10);
    if (now - globalLast < SUBMIT_COOLDOWN) return;
    lastSubmitRef.current = now;
    localStorage.setItem('lastSubmit', String(now));
    setIsSubmitting(true);

    const mesaLabel = String(selectedTable);
    const orderData = {
      mesa: mesaLabel,
      status: 'pendente',
      itens: cart.map(i => ({
        id: i.id,
        name: i.name,
        desc: i.desc || '',
        price: i.price,
        quantity: i.quantity,
        category: i.category,
        cartKey: i.cartKey,
        serving_time: i.serving_time || 'with_food',
        variants: i.variants || null,
      })),
      total: cartTotal,
      tipo: 'mesa',
      observacao: null,
    };

    const validation = validateOrderData(orderData);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      let result;

      if (existingOrder && existingOrder.id) {
        const { data: current } = await supabase
          .from('pedidos')
          .select('itens, total, status')
          .eq('id', existingOrder.id)
          .single();

        if (current && current.status !== 'pago') {
          const newItens = [...(current.itens || []), ...orderData.itens];
          const newTotal = Number(current.total || 0) + cartTotal;

          const { data: updated } = await supabase
            .from('pedidos')
            .update({ itens: newItens, total: newTotal })
            .eq('id', existingOrder.id)
            .neq('status', 'pago')
            .select()
            .single();

          if (updated) {
            result = updated;
          } else {
            alert('Este pedido já foi pago. Não é possível adicionar itens.');
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (!result) {
        const { data: inserted } = await supabase
          .from('pedidos')
          .insert([orderData])
          .select()
          .single();

        result = inserted;
      }

      if (result) {
        await splitAndPrint({ ...result });
        setOrderSuccess(true);
        fetchActiveTables();
        setTimeout(() => {
          handleBackToGrid();
        }, 1500);
      }
    } catch (err) {
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastPayRef = useRef(0);
  const PAY_COOLDOWN = 2000;

  const handlePayNow = async () => {
    if (!existingOrder || !existingOrder.id || isSubmitting) return;
    const now = Date.now();
    if (now - lastPayRef.current < PAY_COOLDOWN) return;
    const globalPay = parseInt(localStorage.getItem('lastPay') || '0', 10);
    if (now - globalPay < PAY_COOLDOWN) return;
    lastPayRef.current = now;
    localStorage.setItem('lastPay', String(now));
    setIsSubmitting(true);
    try {
      await supabase
        .from('pedidos')
        .update({ status: 'pago' })
        .eq('id', existingOrder.id)
        .neq('status', 'pago');

      setShowPayment(false);
      setOrderSuccess(true);
      fetchActiveTables();
      setTimeout(() => {
        handleBackToGrid();
      }, 1200);
    } catch {
      alert('Erro ao registrar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSplit = () => {
    setSplitMode('igual');
    setSplitPeople(2);
    const items = existingOrder?.itens || [];
    const perPerson = {};
    items.forEach((_, idx) => { perPerson[idx] = 'A'; });
    setSplitPersonItems(perPerson);
  };

  const handleSplitItemPerson = (itemIdx, person) => {
    setSplitPersonItems(prev => ({ ...prev, [itemIdx]: person }));
  };

  const getSplitTotals = () => {
    if (!existingOrder) return {};
    const itens = existingOrder.itens || [];
    if (splitMode === 'igual') {
      const total = Number(existingOrder.total) || 0;
      const perPerson = total / splitPeople;
      const persons = {};
      for (let i = 0; i < splitPeople; i++) {
        const label = String.fromCharCode(65 + i);
        persons[label] = { items: [], subtotal: perPerson };
      }
      return persons;
    }
    const persons = {};
    itens.forEach((item, idx) => {
      const person = splitPersonItems[idx] || 'A';
      if (!persons[person]) persons[person] = { items: [], subtotal: 0 };
      persons[person].subtotal += (item.price || 0) * (item.quantity || 1);
    });
    return persons;
  };

  const getTableStatus = (num) => {
    const order = activeTables[num];
    if (!order) return 'livre';
    return 'ativa';
  };

  const getWaitTime = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h${diff % 60}`;
  };

  const tableItemCount = (num) => {
    const order = activeTables[num];
    if (!order || !order.itens) return 0;
    return order.itens.reduce((acc, i) => acc + (i.quantity || 1), 0);
  };

  /* ---------------------------------------------------------- */
  /*  VIEW: Table Grid                                           */
  /* ---------------------------------------------------------- */
  const renderTableGrid = () => (
    <div className="pos-tablegrid">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UtensilsCrossed size={22} color="var(--primary)" />
          SABOR FINO
        </h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {Object.keys(activeTables).length} mesas ativas
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem', padding: '0.75rem',
      }}>
        {Array.from({ length: MAX_TABLES }, (_, i) => i + 1).map(num => {
          const status = getTableStatus(num);
          const isAtiva = status === 'ativa';
          const order = activeTables[num];

          return (
            <button
              key={num}
              onClick={() => handleTableClick(num)}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isAtiva ? 'var(--primary)' : 'var(--border)'}`,
                background: isAtiva ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem',
                fontSize: '2rem', fontWeight: 800,
                color: isAtiva ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: isAtiva ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                transition: 'all 0.15s',
                position: 'relative',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span>{num}</span>
              {isAtiva && (
                <>
                  <div style={{
                    display: 'flex', gap: '0.2rem', fontSize: '0.75rem',
                    color: 'var(--text-secondary)', fontWeight: 600,
                  }}>
                    <span>{tableItemCount(num)} itens</span>
                  </div>
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)',
                  }}>
                    {formatPrice(order.total)}
                  </div>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500,
                  }}>
                    {getWaitTime(order.created_at)}
                  </div>
                </>
              )}
              {!isAtiva && (
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  LIVRE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom quick actions for all tables */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '1rem 1.25rem',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.75rem',
      }}>
        <button
          onClick={() => supabase.auth.signOut()}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <LogOut size={14} /> Sair
        </button>
        <span style={{ flex: 1 }} />
        <button
          onClick={fetchActiveTables}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RotateCcw size={14} /> Atualizar
        </button>
      </div>
    </div>
  );

  /* ---------------------------------------------------------- */
  /*  VIEW: Categories                                           */
  /* ---------------------------------------------------------- */
  const renderCategories = () => (
    <div className="pos" style={{ paddingBottom: '6rem' }}>
      <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0 1rem' }}>
        <button
          onClick={handleBackToGrid}
          className="btn btn-ghost btn-sm"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
            fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} /> Mesas
        </button>
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
          Mesa {selectedTable}
        </span>
        {existingOrder && (
          <span style={{
            fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '99px',
            background: 'var(--primary-light)', color: 'var(--primary)',
            fontWeight: 700,
          }}>
            + adicionar
          </span>
        )}
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {categories.map(cat => {
          const IconCat = CATEGORY_ICONS[cat] || UtensilsCrossed;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                fontSize: '1rem', fontWeight: 700,
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.15s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCat size={20} />
              </div>
              <span style={{ flex: 1 }}>{cat}</span>
              <ChevronRight size={18} color="var(--text-muted)" />
            </button>
          );
        })}
      </div>

      {renderCartBar()}
    </div>
  );

  /* ---------------------------------------------------------- */
  /*  VIEW: Items                                                */
  /* ---------------------------------------------------------- */
  const renderItems = () => {
    const section = CARDAPIO.find(s => s.category === selectedCategory);
    const items = section ? section.items : [];

    return (
      <div className="pos" style={{ paddingBottom: '6rem' }}>
        <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0 1rem' }}>
          <button
            onClick={() => setView('categories')}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={16} /> Seções
          </button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Mesa {selectedTable}
          </span>
        </div>

        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => {
            const inCart = cart.find(i => i.id === item.id && i.category === selectedCategory);
            const qty = inCart ? inCart.quantity : 0;
            const hasVariants = item.variants?.length > 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (hasVariants) {
                    // For items with variants, we could show a variant picker
                    // Simple approach: just add the base item
                  }
                  handleItemClick(item);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${qty > 0 ? 'var(--primary)' : 'var(--border)'}`,
                  background: qty > 0 ? 'var(--primary-light)' : 'var(--surface)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = qty > 0 ? 'var(--primary)' : 'var(--border)'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {formatPrice(item.price)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
                  {qty > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantity(inCart.cartKey, -1); }}
                      style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-secondary)',
                        fontWeight: 700, fontSize: '1rem',
                      }}
                    >
                      <Minus size={14} />
                    </button>
                  )}
                  {qty > 0 && (
                    <span style={{
                      minWidth: 24, textAlign: 'center', fontWeight: 800,
                      fontSize: '1.1rem', color: 'var(--primary)',
                    }}>
                      {qty}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                    style={{
                      width: qty > 0 ? 32 : 40, height: qty > 0 ? 32 : 40,
                      borderRadius: 'var(--radius-full)',
                      border: 'none', background: 'var(--primary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'white', fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    <Plus size={qty > 0 ? 14 : 18} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>

        {renderCartBar()}
      </div>
    );
  };

  /* ---------------------------------------------------------- */
  /*  Cart floating bar (used in categories + items view)        */
  /* ---------------------------------------------------------- */
  const renderCartBar = () => {
    const show = cartCount > 0 || existingOrder;
    if (!show) return null;
    const combinedCount = cartCount + (existingOrder?.itens?.reduce((s, i) => s + (i.quantity || 1), 0) || 0);
    const combinedTotal = cartTotal + (existingOrder?.total || 0);
    return (
      <>
        <div
          onClick={() => setShowCartSheet(true)}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '0.85rem 1.25rem',
            background: 'var(--surface)',
            borderTop: '2px solid var(--border)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            zIndex: 20, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShoppingCart size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {combinedCount} {combinedCount === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginRight: '0.5rem' }}>
            {formatPrice(combinedTotal)}
          </span>

          {existingOrder && (
            <button
              onClick={(e) => { e.stopPropagation(); setSplitMode('simples'); setShowPayment(true); }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              <Receipt size={16} /> Pagar
            </button>
          )}

          {cartCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleFinishOrderClick(); }}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              {isSubmitting ? 'Enviando...' : <><ChevronRight size={18} /> Finalizar</>}
            </button>
          )}
          <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Cart Sheet */}
        {showCartSheet && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
            onClick={() => setShowCartSheet(false)}
          >
            <div style={{
              width: '100%', maxWidth: '500px', maxHeight: '70vh',
              background: 'var(--surface)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              overflow: 'auto', padding: '1.5rem',
            }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {existingOrder ? 'Comanda Mesa ' + selectedTable : 'Carrinho'}
                </h3>
                <button onClick={() => setShowCartSheet(false)} className="btn btn-ghost btn-sm" style={{ padding: '0.3rem' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Existing order items (if any) */}
              {existingOrder?.itens?.map((item, idx) => (
                <div key={`eo-${idx}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
                  opacity: 0.7,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.quantity}x {item.name}
                    </span>
                    {item.serving_time === 'with_food' && (
                      <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '99px', background: 'var(--amber-100)', color: 'var(--amber-700)', fontWeight: 700, marginLeft: '0.35rem', verticalAlign: 'middle' }}>
                        Comida
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {formatPrice((item.price || 0) * (item.quantity || 1))}
                  </span>
                </div>
              ))}

              {/* Cart items (new additions) */}
              {cart.map((item, idx) => (
                <div key={item.cartKey || idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.name}
                    </span>
                    {item.serving_time === 'with_food' && item.serving_time && (
                      <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '99px', background: 'var(--amber-100)', color: 'var(--amber-700)', fontWeight: 700, marginLeft: '0.35rem', verticalAlign: 'middle' }}>
                        Comida
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {formatPrice(item.price)} cada
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
                    <button
                      onClick={() => handleQuantity(item.cartKey, -1)}
                      style={{
                        width: 30, height: 30, borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-secondary)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleItemClick({ ...item, cartKey: undefined })}
                      style={{
                        width: 30, height: 30, borderRadius: 'var(--radius-full)',
                        border: 'none', background: 'var(--primary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 50, textAlign: 'right' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{
                borderTop: '2px dashed var(--border)', marginTop: '0.75rem',
                paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between',
                fontSize: '1.1rem', fontWeight: 800,
              }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>
                  {formatPrice(cartTotal + (existingOrder?.total || 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  /* ---------------------------------------------------------- */
  /*  VIEW: Drink Timing                                         */
  /* ---------------------------------------------------------- */
  const renderDrinkTiming = () => {
    const drinkItems = cart.filter(i => MULTI_ITEM_CATEGORIES.includes(i.category));
    const allNow = drinkItems.every(i => i.serving_time === 'now');
    const allWithFood = drinkItems.every(i => i.serving_time === 'with_food');

    return (
      <div className="pos" style={{ paddingBottom: '6rem' }}>
        <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0 1rem' }}>
          <button
            onClick={() => setView('items')}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Mesa {selectedTable}
          </span>
        </div>

        <div style={{ padding: '1.25rem 1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Quando servir as bebidas?
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Toque para alternar entre Agora / Com a Comida
          </p>

          {/* Quick-select all */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setAllDrinkTiming('now')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                border: `2px solid ${allNow ? 'var(--primary)' : 'var(--border)'}`,
                background: allNow ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                color: allNow ? 'var(--primary)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              Todas Agora
            </button>
            <button
              onClick={() => setAllDrinkTiming('with_food')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                border: `2px solid ${allWithFood ? 'var(--primary)' : 'var(--border)'}`,
                background: allWithFood ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                color: allWithFood ? 'var(--primary)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              Todas c/ Comida
            </button>
          </div>

          {/* Individual drink items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drinkItems.map(item => (
              <button
                key={item.cartKey}
                onClick={() => toggleDrinkTiming(item.cartKey)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${item.serving_time === 'now' ? 'var(--info)' : 'var(--amber-400)'}`,
                  background: item.serving_time === 'now' ? '#eff6ff' : 'var(--amber-50)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', width: '100%',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {item.quantity}x {item.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
                <div style={{
                  padding: '0.3rem 0.75rem', borderRadius: '99px',
                  fontWeight: 800, fontSize: '0.8rem',
                  background: item.serving_time === 'now' ? 'var(--info)' : 'var(--amber-400)',
                  color: 'white',
                }}>
                  {item.serving_time === 'now' ? 'Agora' : 'Com Comida'}
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <p style={{
              fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem',
              textAlign: 'center',
            }}>
              Itens de comida não são afetados (sempre vão pra cozinha)
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '1rem 1.25rem',
          background: 'var(--surface)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          zIndex: 20,
        }}>
          <button
            onClick={submitOrder}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            {isSubmitting ? 'Imprimindo...' : <><ChevronRight size={20} /> Confirmar e Imprimir</>}
          </button>
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------- */
  /*  VIEW: Existing Order                                       */
  /* ---------------------------------------------------------- */
  const renderExistingOrder = () => {
    if (!existingOrder) return null;
    const itens = existingOrder.itens || [];
    const total = existingOrder.total || 0;

    return (
      <div className="pos" style={{ paddingBottom: '6rem' }}>
        <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0 1rem' }}>
          <button
            onClick={handleBackToGrid}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={16} /> Mesas
          </button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Mesa {selectedTable}
          </span>
        </div>

        <div style={{ padding: '1.25rem 1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
            Comanda Mesa {selectedTable}
          </h2>

          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            {itens.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: idx < itens.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {item.quantity}x {item.name}
                  </span>
                  {item.serving_time === 'with_food' && (
                    <span style={{
                      fontSize: '0.65rem', padding: '0.1rem 0.4rem',
                      borderRadius: '99px', background: 'var(--amber-100)',
                      color: 'var(--amber-700)', fontWeight: 700, marginLeft: '0.4rem',
                      verticalAlign: 'middle',
                    }}>
                      Comida
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {formatPrice((item.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: '2px dashed var(--border)', marginTop: '0.75rem',
              paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between',
              fontSize: '1.05rem', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => { setView('categories'); }}
              className="btn btn-primary"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
            >
              <Plus size={18} /> Adicionar mais Itens
            </button>
            <button
              onClick={() => { setSplitMode('simples'); setShowPayment(true); }}
              className="btn btn-secondary"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
            >
              <Receipt size={18} /> Hora de Pagar
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
            onClick={() => setShowPayment(false)}
          >
            <div style={{
              width: '100%', maxWidth: '500px', maxHeight: '90vh',
              background: 'var(--surface)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              overflow: 'auto', padding: '1.5rem',
            }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
                Pagamento — Mesa {selectedTable}
              </h3>

              <div style={{ marginBottom: '1.25rem' }}>
                {itens.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0', borderBottom: '1px solid var(--border)',
                    fontSize: '0.9rem',
                  }}>
                    <span style={{ fontWeight: 600 }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {formatPrice((item.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '2px dashed var(--border)', paddingTop: '1rem',
                marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
                fontSize: '1.25rem', fontWeight: 800,
              }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
              </div>

              {/* Mode Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setSplitMode('simples')}
                  style={{
                    flex: 1, padding: '0.5rem 1rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 0.15rem)',
                    background: splitMode === 'simples' ? 'var(--surface)' : 'transparent',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    color: splitMode === 'simples' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: splitMode === 'simples' ? 'var(--shadow-sm)' : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <CheckCircle size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Simples
                </button>
                <button
                  onClick={handleOpenSplit}
                  style={{
                    flex: 1, padding: '0.5rem 1rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 0.15rem)',
                    background: splitMode !== 'simples' ? 'var(--surface)' : 'transparent',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    color: splitMode !== 'simples' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: splitMode !== 'simples' ? 'var(--shadow-sm)' : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <Users size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Dividir Conta
                </button>
              </div>

              {splitMode === 'simples' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Cobrar na maquininha e marcar como pago no sistema
                  </p>
                  <button
                    onClick={handlePayNow}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
                  >
                    {isSubmitting ? 'Processando...' : <><CheckCircle size={20} /> Pago</>}
                  </button>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="btn btn-ghost"
                    style={{ width: '100%' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Igual / Por Itens tabs */}
                  <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button
                      onClick={() => setSplitMode('igual')}
                      style={{
                        flex: 1, padding: '0.5rem 1rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 0.15rem)',
                        background: splitMode === 'igual' ? 'var(--surface)' : 'transparent',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        color: splitMode === 'igual' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: splitMode === 'igual' ? 'var(--shadow-sm)' : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Users size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                      Igual
                    </button>
                    <button
                      onClick={() => setSplitMode('itens')}
                      style={{
                        flex: 1, padding: '0.5rem 1rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 0.15rem)',
                        background: splitMode === 'itens' ? 'var(--surface)' : 'transparent',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        color: splitMode === 'itens' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: splitMode === 'itens' ? 'var(--shadow-sm)' : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Divide size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                      Por Itens
                    </button>
                  </div>

                  {(() => {
                    if (splitMode === 'igual') {
                      return (
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Número de pessoas
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                              onClick={() => setSplitPeople(p => Math.max(2, p - 1))}
                              className="btn btn-secondary btn-sm"
                              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={16} />
                            </button>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, minWidth: 40, textAlign: 'center' }}>
                              {splitPeople}
                            </span>
                            <button
                              onClick={() => setSplitPeople(p => Math.min(10, p + 1))}
                              className="btn btn-secondary btn-sm"
                              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                          Clique em cada item para atribuir a uma pessoa
                        </p>
                        {itens.map((item, idx) => {
                          const current = splitPersonItems[idx] || 'A';
                          const persons = ['A', 'B', 'C', 'D'];
                          return (
                            <div key={idx} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.6rem 0', borderBottom: '1px solid var(--border)',
                            }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {item.quantity}x {item.name} — {formatPrice((item.price || 0) * (item.quantity || 1))}
                              </span>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {persons.map(p => (
                                  <button
                                    key={p}
                                    onClick={() => handleSplitItemPerson(idx, p)}
                                    style={{
                                      width: 32, height: 32, borderRadius: 'var(--radius-full)',
                                      border: `2px solid ${current === p ? 'var(--primary)' : 'var(--border)'}`,
                                      background: current === p ? 'var(--primary-light)' : 'transparent',
                                      cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                      color: current === p ? 'var(--primary)' : 'var(--text-muted)',
                                      fontFamily: 'inherit',
                                    }}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Split summary */}
                  {(() => {
                    const totals = getSplitTotals();
                    return (
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                          {splitMode === 'igual' ? `Divisão em ${splitPeople} partes:` : 'Divisão por pessoa:'}
                        </h4>
                        {Object.entries(totals).map(([person, data]) => (
                          <div key={person} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.6rem 0.75rem', marginBottom: '0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-subtle)',
                          }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              Pessoa {person}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                              {formatPrice(data.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Cobrar o total na maquininha externa e marcar como pago
                    </p>
                    <button
                      onClick={handlePayNow}
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
                    >
                      {isSubmitting ? 'Processando...' : <><CheckCircle size={20} /> Pago</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------- */
  /*  VIEW: Order Success                                        */
  /* ---------------------------------------------------------- */
  const renderOrderSuccess = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-full)',
        background: 'var(--sage-100)', color: 'var(--sage-600)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <CheckCircle size={40} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        {existingOrder ? 'Itens Adicionados!' : 'Pedido Enviado!'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        Mesa {selectedTable} — impressão em andamento
      </p>
    </div>
  );

  /* ---------------------------------------------------------- */
  /*  MAIN RENDER                                                */
  /* ---------------------------------------------------------- */
  if (orderSuccess) return renderOrderSuccess();

  switch (view) {
    case 'tableGrid':
      return renderTableGrid();
    case 'categories':
      return renderCategories();
    case 'items':
      return renderItems();
    case 'drinkTiming':
      return renderDrinkTiming();
    case 'existingOrder':
      return renderExistingOrder();
    default:
      return renderTableGrid();
  }
};

export default POS;
