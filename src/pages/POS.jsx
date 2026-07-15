import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Minus, CheckCircle,
  ChevronRight, ArrowLeft, LogOut,
  ShoppingCart, UtensilsCrossed, Coffee,
  Beer, Wine, GlassWater, ChefHat, Pizza,
  Beef, Camera, QrCode,
} from 'lucide-react';
import CARDAPIO from '../data/cardapio';
import { formatPrice } from '../lib/format';
import { validateOrderData } from '../lib/validation';
import { getComanda, createComanda, parseComandaCode, nextComandaCodigo } from '../lib/comandas';
import QrScanner from '../components/QrScanner';

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
};

const MULTI_ITEM_CATEGORIES = ['Bebidas', 'Cervejas', 'Drinks', 'Doses'];

const categories = CARDAPIO.map(s => s.category);

const allProducts = CARDAPIO.flatMap(section =>
  section.items.map(item => ({ ...item, category: section.category }))
);

const POS = () => {
  const [view, setView] = useState('comandaInput');
  const [comanda, setComanda] = useState(null);
  const [comandaInput, setComandaInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [recentComandas, setRecentComandas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [comandaPedidos, setComandaPedidos] = useState([]);
  const [existingItems, setExistingItems] = useState([]);
  const lastSubmitRef = useRef(0);
  const SUBMIT_COOLDOWN = 2000;
  const successTimer = useRef(null);

  useEffect(() => {
    loadRecentComandas();
    const channel = supabase
      .channel('pos_comandas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas' }, () => {
        loadRecentComandas();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const loadRecentComandas = async () => {
    try {
      const { data } = await supabase
        .from('comandas')
        .select('codigo, status, created_at')
        .eq('status', 'aberta')
        .order('created_at', { ascending: false })
        .limit(15);
      if (data) setRecentComandas(data);
    } catch {}
  };

  const loadComandaPedidos = async (codigo) => {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('comanda_codigo', codigo)
        .order('created_at', { ascending: true });
      if (data) {
        setComandaPedidos(data);
        const all = data.flatMap(p => p.itens || []);
        setExistingItems(all);
      }
    } catch {}
  };

  const handleQRScan = async (rawValue) => {
    const code = parseComandaCode(rawValue);
    if (code) {
      setComandaInput(code);
      await lookupComanda(code);
    } else {
      setError('QR Code inválido');
    }
    setShowScanner(false);
  };

  const lookupComanda = async (codigo) => {
    if (!codigo) return;
    setError('');
    try {
      let c = await getComanda(codigo);
      if (!c) {
        c = await createComanda(codigo);
      }
      if (c.status !== 'aberta') {
        setError('Comanda ' + codigo + ' já foi ' + c.status);
        return;
      }
      setComanda(c);
      await loadComandaPedidos(codigo);
      setView('categories');
    } catch (err) {
      setError(err?.message || 'Erro ao buscar comanda');
    }
  };

  const handleBackToInput = () => {
    setView('comandaInput');
    setComanda(null);
    setCart([]);
    setComandaPedidos([]);
    setExistingItems([]);
    setSelectedCategory(null);
    setSuccessMsg('');
    setError('');
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setView('items');
  };

  const handleItemClick = (item) => {
    const cat = selectedCategory || item.category;
    const key = item.cartKey || item.id + '-' + Date.now();
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
    if (cart.length === 0 || isSubmitting || !comanda) return;
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN) return;
    lastSubmitRef.current = now;
    setIsSubmitting(true);

    const orderData = {
      comanda_codigo: comanda.codigo,
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
      setError(validation.errors.join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: result, error: insertError } = await supabase
        .from('pedidos')
        .insert([orderData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (result) {
        setCart([]);
        setSuccessMsg('Itens adicionados à comanda ' + comanda.codigo);
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
        await loadComandaPedidos(comanda.codigo);
        setTimeout(() => setView('categories'), 800);
      }
    } catch (err) {
      setError('Erro ao enviar pedido: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- VIEW: Comanda Input ---------- */
  const renderComandaInput = () => (
    <div className="pos" style={{ paddingBottom: '2rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UtensilsCrossed size={22} color="var(--primary)" />
          SABOR FINO
        </h1>
        <button onClick={() => supabase.auth.signOut()} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div style={{ padding: '1.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          Código da Comanda
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Ex: C042"
            value={comandaInput}
            onChange={e => setComandaInput(e.target.value.toUpperCase())}
            onKeyUp={e => { if (e.key === 'Enter') lookupComanda(parseComandaCode(e.target.value.toUpperCase())); }}
            autoFocus
            style={{
              flex: 1, padding: '0.85rem 1rem', fontSize: '1.5rem', fontWeight: 800,
              border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontFamily: "'Sora', sans-serif", outline: 'none', letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          />
          <button onClick={() => setShowScanner(true)} style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}>
            <Camera size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button onClick={async () => {
            try {
              const code = await nextComandaCodigo();
              setComandaInput(code);
              lookupComanda(code);
            } catch (err) {
              setError(err?.message || 'Erro ao gerar código');
            }
          }} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.75rem' }}>
            <QrCode size={16} /> Nova Comanda
          </button>
          <button onClick={() => lookupComanda(parseComandaCode(comandaInput))} disabled={!comandaInput.trim()} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.75rem' }}>
            <ChevronRight size={16} /> Abrir
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>

      {/* Recent comandas */}
      {recentComandas.length > 0 && (
        <div style={{ padding: '0 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Comandas Abertas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {recentComandas.map(c => (
              <button key={c.codigo} onClick={() => { setComandaInput(c.codigo); lookupComanda(c.codigo); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', width: '100%', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{c.codigo}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ---------- VIEW: Categories ---------- */
  const renderCategories = () => (
    <div className="pos" style={{ paddingBottom: '6rem' }}>
      <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.6rem', padding: '0 1rem' }}>
        <button onClick={handleBackToInput} className="btn btn-ghost btn-sm" style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
          fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
        }}>
          <ArrowLeft size={16} /> Comandas
        </button>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
          {comanda?.codigo}
        </span>
      </div>

      {successMsg && (
        <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', borderBottom: '1px solid #dcfce7' }}>
          <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
          {successMsg}
        </div>
      )}

      {/* Existing items summary */}
      {existingItems.length > 0 && (
        <div style={{ margin: '0.75rem 1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-subtle)', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            Itens anteriores ({existingItems.reduce((s, i) => s + (i.quantity || 1), 0)})
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {existingItems.slice(0, 5).map((item, i) => (
              <span key={i}>{item.quantity}x {item.name}{i < Math.min(existingItems.length, 5) - 1 ? ', ' : ''}</span>
            ))}
            {existingItems.length > 5 && <span> ...</span>}
          </div>
        </div>
      )}

      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {categories.map(cat => {
          const IconCat = CATEGORY_ICONS[cat] || UtensilsCrossed;
          return (
            <button key={cat} onClick={() => handleCategoryClick(cat)} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
              fontFamily: 'inherit', color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-xs)', transition: 'all 0.15s',
              textAlign: 'left', width: '100%',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

  /* ---------- VIEW: Items ---------- */
  const renderItems = () => {
    const section = CARDAPIO.find(s => s.category === selectedCategory);
    const items = section ? section.items : [];
    return (
      <div className="pos" style={{ paddingBottom: '6rem' }}>
        <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.6rem', padding: '0 1rem' }}>
          <button onClick={() => setView('categories')} className="btn btn-ghost btn-sm" style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
            fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}>
            <ArrowLeft size={16} /> Seções
          </button>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
            {comanda?.codigo}
          </span>
        </div>

        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => {
            const inCart = cart.find(i => i.id === item.id && i.category === selectedCategory);
            const qty = inCart ? inCart.quantity : 0;
            return (
              <button key={item.id} onClick={() => handleItemClick(item)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (qty > 0 ? 'var(--primary)' : 'var(--border)'),
                background: qty > 0 ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = qty > 0 ? 'var(--primary)' : 'var(--border)'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatPrice(item.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
                  {qty > 0 && (
                    <button onClick={e => { e.stopPropagation(); handleQuantity(inCart.cartKey, -1); }} style={{
                      width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                      background: 'var(--surface)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                    }}>
                      <Minus size={14} />
                    </button>
                  )}
                  {qty > 0 && <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{qty}</span>}
                  <button onClick={e => { e.stopPropagation(); handleItemClick(item); }} style={{
                    width: qty > 0 ? 32 : 40, height: qty > 0 ? 32 : 40, borderRadius: '50%',
                    border: 'none', background: 'var(--primary)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700,
                  }}>
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

  /* ---------- Cart Bar ---------- */
  const renderCartBar = () => {
    if (cartCount === 0) return null;
    return (
      <>
        <div onClick={cartCount > 0 ? () => setView('drinkTiming') : undefined} style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '0.85rem 1.25rem', background: 'var(--surface)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          zIndex: 20, cursor: 'pointer',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingCart size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {cartCount} {cartCount === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginRight: '0.5rem' }}>
            {formatPrice(cartTotal)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleFinishOrderClick(); }}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          >
            {isSubmitting ? 'Enviando...' : <><ChevronRight size={18} /> Finalizar</>}
          </button>
        </div>
      </>
    );
  };

  /* ---------- VIEW: Drink Timing ---------- */
  const renderDrinkTiming = () => {
    const drinkItems = cart.filter(i => MULTI_ITEM_CATEGORIES.includes(i.category));
    const nonDrinkItems = cart.filter(i => !MULTI_ITEM_CATEGORIES.includes(i.category));
    const allNow = drinkItems.every(i => i.serving_time === 'now');
    const allWithFood = drinkItems.every(i => i.serving_time === 'with_food');

    return (
      <div className="pos" style={{ paddingBottom: '6rem' }}>
        <div className="pos-topbar" style={{ justifyContent: 'flex-start', gap: '0.6rem', padding: '0 1rem' }}>
          <button onClick={() => setView('items')} className="btn btn-ghost btn-sm" style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
            fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
            {comanda?.codigo}
          </span>
        </div>

        <div style={{ padding: '1.25rem 1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Quando servir as bebidas?
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Toque para alternar entre Agora / Com a Comida
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button onClick={() => setAllDrinkTiming('now')} style={{
              flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
              border: '2px solid ' + (allNow ? 'var(--primary)' : 'var(--border)'),
              background: allNow ? 'var(--primary-light)' : 'transparent',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              color: allNow ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'inherit',
            }}>
              Todas Agora
            </button>
            <button onClick={() => setAllDrinkTiming('with_food')} style={{
              flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
              border: '2px solid ' + (allWithFood ? 'var(--primary)' : 'var(--border)'),
              background: allWithFood ? 'var(--primary-light)' : 'transparent',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              color: allWithFood ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'inherit',
            }}>
              Todas c/ Comida
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drinkItems.map(item => (
              <button key={item.cartKey} onClick={() => toggleDrinkTiming(item.cartKey)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
                border: '2px solid ' + (item.serving_time === 'now' ? '#3b82f6' : '#f59e0b'),
                background: item.serving_time === 'now' ? '#eff6ff' : '#fffbeb',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {item.quantity}x {item.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
                <div style={{
                  padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 800, fontSize: '0.8rem',
                  background: item.serving_time === 'now' ? '#3b82f6' : '#f59e0b', color: 'white',
                }}>
                  {item.serving_time === 'now' ? 'Agora' : 'Com Comida'}
                </div>
              </button>
            ))}
          </div>

          {/* Non-drink items summary */}
          {nonDrinkItems.length > 0 && (
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Itens de comida ({nonDrinkItems.reduce((s, i) => s + i.quantity, 0)})
              </div>
              {nonDrinkItems.map(item => (
                <div key={item.cartKey} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.15rem 0' }}>
                  {item.quantity}x {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '1rem 1.25rem', background: 'var(--surface)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 20,
        }}>
          <button onClick={submitOrder} disabled={isSubmitting} className="btn btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
            {isSubmitting ? 'Imprimindo...' : <><ChevronRight size={20} /> Confirmar e Imprimir</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {view === 'comandaInput' && renderComandaInput()}
      {view === 'categories' && renderCategories()}
      {view === 'items' && renderItems()}
      {view === 'drinkTiming' && renderDrinkTiming()}

      {showScanner && <QrScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default POS;
