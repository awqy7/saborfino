import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, CheckCircle, LogOut, Sun, Moon, Camera, QrCode } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { supabase } from '../lib/supabase';
import { getComanda, createComanda, addBuffetToComanda, nextComandaCodigo, parseComandaCode } from '../lib/comandas';
import QrScanner from '../components/QrScanner';

const PRECO_KG_KEY = 'saborfino_preco_kg';
const DEFAULT_PRECO_KG = 48.90;

const Balanca = () => {
  const navigate = useNavigate();
  const [grams, setGrams] = useState(0);
  const [precoKg, setPrecoKg] = useState(() => parseFloat(localStorage.getItem(PRECO_KG_KEY)) || DEFAULT_PRECO_KG);
  const [successMsg, setSuccessMsg] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [comandaInput, setComandaInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [comanda, setComanda] = useState(null);
  const [recentComandas, setRecentComandas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const successTimer = useRef(null);
  const MAX_GRAMS = 999999;

  useEffect(() => {
    loadRecentComandas();
  }, []);

  const loadRecentComandas = async () => {
    try {
      const { data } = await supabase
        .from('comandas')
        .select('codigo, status, created_at')
        .eq('status', 'aberta')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setRecentComandas(data);
    } catch {}
  };

  const handleKey = (key) => {
    if (key === 'C') { setGrams(0); return; }
    if (key === 'BS') { setGrams(Math.floor(grams / 10)); return; }
    const digit = parseInt(key, 10);
    const next = grams * 10 + digit;
    if (next > MAX_GRAMS) return;
    setGrams(next);
  };

  const weight = grams / 1000;
  const total = weight * precoKg;
  const displayKg = (grams / 1000).toFixed(3).replace('.', ',');

  const handleQRScan = (rawValue) => {
    const code = parseComandaCode(rawValue);
    if (code) {
      setComandaInput(code);
      lookupComanda(code);
    } else {
      setError('QR Code inválido');
    }
    setShowScanner(false);
  };

  const lookupComanda = async (codigo) => {
    if (!codigo) return;
    setError('');
    setLoading(true);
    try {
      const c = await createComanda(codigo, precoKg);
      setComanda(c);
    } catch (err) {
      setError(err?.message || 'Erro ao buscar comanda');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (grams <= 0) return;
    if (!comanda) {
      setError('Selecione ou crie uma comanda primeiro');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addBuffetToComanda(comanda.codigo, weight, precoKg);
      setGrams(0);
      setSuccessMsg('Comanda ' + comanda.codigo + ' — ' + formatPrice(total));
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
      loadRecentComandas();
    } catch (err) {
      setError(err?.message || 'Erro ao registrar');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const bg = darkMode ? '#0f0f1a' : '#faf9f7';
  const surface = darkMode ? '#1a1a2e' : 'var(--surface)';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'var(--border)';
  const text = darkMode ? '#e2e8f0' : 'var(--text-primary)';
  const muted = darkMode ? '#64748b' : 'var(--text-muted)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: bg, color: text,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      overflow: 'hidden', userSelect: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', background: surface, borderBottom: '1px solid ' + border,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={20} color="#f59e0b" />
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em' }}>BALANCA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background: 'transparent', border: '1px solid ' + border,
            borderRadius: '8px', width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: muted,
          }}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid ' + border,
            borderRadius: '8px', width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171',
          }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem',
          fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239,68,68,0.15)', color: '#f87171',
          borderBottom: '1px solid rgba(239,68,68,0.2)', flexShrink: 0,
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>X</button>
        </div>
      )}
      {successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          padding: '0.4rem', fontSize: '0.8rem', fontWeight: 800,
          background: 'rgba(34,197,94,0.12)', color: '#4ade80',
          borderBottom: '1px solid rgba(34,197,94,0.15)', flexShrink: 0,
        }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      {/* Comanda Input */}
      <div style={{
        margin: '0.5rem 0.75rem 0.25rem', padding: '0.6rem 0.75rem',
        background: surface, borderRadius: 'var(--radius-md)',
        border: '1px solid ' + border, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {comanda ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>{comanda.codigo}</span>
                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '99px', background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>
                  aberta
                </span>
                <button onClick={() => { setComanda(null); setComandaInput(''); }} style={{
                  background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, marginLeft: 'auto',
                }}>
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Codigo da comanda (C042)"
                  value={comandaInput}
                  onChange={e => setComandaInput(e.target.value.toUpperCase())}
                  onKeyUp={e => { if (e.key === 'Enter') lookupComanda(parseComandaCode(e.target.value.toUpperCase())); }}
                  style={{
                    flex: 1, padding: '0.5rem 0.6rem',
                    background: darkMode ? '#0f0f1a' : 'var(--surface-subtle)',
                    border: '1px solid ' + border, borderRadius: 'var(--radius-sm)',
                    color: text, fontSize: '1rem', fontWeight: 700, fontFamily: "'Sora', sans-serif",
                    outline: 'none', letterSpacing: '0.05em',
                  }}
                />
                <button onClick={() => setShowScanner(true)} style={{
                  background: 'transparent', border: '1px solid ' + border,
                  borderRadius: 'var(--radius-sm)', width: 38, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: muted,
                }}>
                  <Camera size={16} />
                </button>
              </>
            )}
          </div>
          <button
            onClick={async () => {
              try {
                const code = await nextComandaCodigo();
                setComandaInput(code);
                lookupComanda(code);
              } catch (err) {
                setError(err?.message || 'Erro ao gerar código');
              }
            }}
            style={{
              background: 'transparent', border: '1px solid ' + border,
              borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem',
              color: muted, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <QrCode size={12} /> Nova
          </button>
          {!comanda && comandaInput.trim() && (
            <button
              onClick={() => lookupComanda(parseComandaCode(comandaInput))}
              style={{
                background: '#f59e0b', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem',
                color: '#0f0f1a', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              Abrir
            </button>
          )}
        </div>

        {!comanda && recentComandas.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', overflow: 'auto', paddingBottom: '0.2rem' }}>
            {recentComandas.slice(0, 5).map(c => (
              <button key={c.codigo} onClick={() => { setComandaInput(c.codigo); lookupComanda(c.codigo); }} style={{
                padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid ' + border,
                background: 'transparent', color: muted, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                {c.codigo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Weight display */}
      <div style={{
        margin: '0.25rem 0.75rem 0.5rem', padding: '1rem',
        background: surface, borderRadius: 'var(--radius-lg)',
        border: '1px solid ' + border, flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          Peso do Prato
        </div>
        <div style={{
          fontSize: '3.5rem', fontWeight: 800, textAlign: 'center',
          fontFamily: "'Sora', sans-serif", lineHeight: 1.05, marginBottom: '0.5rem',
          color: grams > 0 ? '#fbbf24' : (darkMode ? '#334155' : muted),
          letterSpacing: '-0.02em',
        }}>
          {displayKg} <span style={{ fontSize: '1.2rem', color: muted }}>kg</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.5rem 0.75rem',
          background: darkMode ? 'rgba(0,0,0,0.3)' : 'var(--surface-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: muted }}>
            R$ {precoKg.toFixed(2).replace('.', ',')} / kg
          </span>
          <span style={{
            fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Sora', sans-serif",
            color: grams > 0 ? '#fbbf24' : (darkMode ? '#334155' : muted),
          }}>
            {grams > 0 ? formatPrice(total) : '---'}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.45rem', padding: '0 0.75rem 0.4rem', flexShrink: 0,
      }}>
        {['7','8','9','4','5','6','1','2','3','C','0','BS'].map(key => {
          const isClear = key === 'C';
          const isBS = key === 'BS';
          return (
            <button key={key} onClick={() => handleKey(key)} style={{
              padding: '0.85rem 0', border: 'none', borderRadius: 'var(--radius-md)',
              background: isClear ? (darkMode ? '#450a0a' : '#fef2f2') : (darkMode ? '#16213e' : 'var(--surface)'),
              color: isClear ? '#f87171' : (darkMode ? '#e2e8f0' : 'var(--text-primary)'),
              fontWeight: 800, fontSize: isClear ? '1.1rem' : '1.6rem',
              fontFamily: "'Sora', sans-serif", cursor: 'pointer',
              boxShadow: darkMode ? 'none' : 'var(--shadow-xs)',
              transition: 'all 0.1s', lineHeight: 1,
            }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.opacity = '0.7'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = ''; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = ''; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.opacity = '0.7'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = ''; }}
            >
              {isBS ? '\u232B' : key}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <div style={{ padding: '0 0.75rem 0.4rem', flexShrink: 0 }}>
        <button
          onClick={handleSubmit}
          disabled={grams <= 0 || !comanda || loading}
          style={{
            width: '100%', padding: '0.85rem 0',
            border: 'none', borderRadius: 'var(--radius-lg)',
            background: (grams > 0 && comanda) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : (darkMode ? '#1e293b' : 'var(--surface-subtle)'),
            color: (grams > 0 && comanda) ? '#1a1a2e' : (darkMode ? '#475569' : muted),
            fontWeight: 800, fontSize: '1rem',
            cursor: (grams > 0 && comanda && !loading) ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            fontFamily: 'inherit',
            boxShadow: (grams > 0 && comanda) ? '0 4px 16px rgba(245,158,11,0.25)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <CheckCircle size={18} />
          {loading ? 'Registrando...' : 'LANÇAR'}
          {grams > 0 && comanda && <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>{formatPrice(total)}</span>}
        </button>
      </div>

      {/* Preco edit */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.25rem 0.75rem', flexShrink: 0, marginTop: '0.15rem',
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: muted }}>Preco/kg:</span>
        <input type="number" step="0.01" min="0" value={precoKg}
          onChange={e => {
            const v = parseFloat(e.target.value) || 0;
            setPrecoKg(v);
            localStorage.setItem(PRECO_KG_KEY, String(v));
          }}
          style={{
            width: 80, padding: '0.25rem 0.4rem',
            background: darkMode ? '#1e293b' : 'var(--surface)',
            border: '1px solid ' + border, borderRadius: 'var(--radius-sm)',
            color: text, fontSize: '0.8rem', fontWeight: 700, textAlign: 'center',
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <span style={{ fontSize: '0.6rem', color: muted, marginLeft: 'auto' }}>
          {recentComandas.length} comandas ativas
        </span>
      </div>

      {showScanner && <QrScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default Balanca;
