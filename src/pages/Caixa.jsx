import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import {
  CreditCard, CheckCircle, Clock, TrendingUp,
  X, Search, Camera, ChevronRight, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { parseComandaCode, getComandaData, closeComanda, cancelComanda, getOpenComandasResumo } from '../lib/comandas';
import { printComandaReceipt } from '../lib/printer';
import QrScanner from '../components/QrScanner';

const Caixa = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [comandaResult, setComandaResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [openComandas, setOpenComandas] = useState([]);
  const [loadingOpen, setLoadingOpen] = useState(true);
  const searchInputRef = useRef(null);
  const successTimer = useRef(null);
  const openTimer = useRef(null);

  const loadOpenComandas = async () => {
    try {
      const list = await getOpenComandasResumo();
      setOpenComandas(list);
    } catch {}
    setLoadingOpen(false);
  };

  useEffect(() => {
    loadOpenComandas();
    openTimer.current = setInterval(loadOpenComandas, 15000);
    return () => clearInterval(openTimer.current);
  }, []);

  const selectOpenComanda = (codigo) => {
    setSearchTerm(codigo);
    searchComanda(codigo);
  };

  const handleQRScan = async (rawValue) => {
    const code = parseComandaCode(rawValue);
    if (code) {
      setSearchTerm(code);
      await searchComanda(code);
    } else {
      setError('QR Code inválido');
    }
    setShowScanner(false);
  };

  const searchComanda = async (codigo) => {
    if (!codigo) return;
    setError('');
    setComandaResult(null);
    setLoading(true);
    try {
      const data = await getComandaData(codigo);
      if (!data) {
        setError('Comanda ' + codigo + ' não encontrada');
        setLoading(false);
        return;
      }
      setComandaResult(data);
    } catch (err) {
      setError('Erro ao buscar: ' + (err.message || ''));
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const code = parseComandaCode(searchTerm);
    if (code) {
      setSearchTerm(code);
      searchComanda(code);
    } else if (searchTerm.trim()) {
      setError('Código inválido. Use formato C000');
    }
  };

  const handleCloseComanda = async () => {
    if (!comandaResult) return;
    const savedComanda = comandaResult.comanda;
    const savedPedidos = comandaResult.pedidos;
    setLoading(true);
    try {
      await closeComanda(savedComanda.codigo);
      setSuccessMsg('Comanda ' + savedComanda.codigo + ' paga e liberada!');
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccessMsg(''), 4000);
      setComandaResult(null);
      setSearchTerm('');
      setShowConfirmClose(false);
      loadOpenComandas();
      printComandaReceipt(savedComanda, savedPedidos).catch(() => {});
    } catch (err) {
      setError('Erro ao fechar: ' + (err.message || ''));
    }
    setLoading(false);
  };

  const handleCancelComanda = async () => {
    if (!comandaResult) return;
    if (!window.confirm('Cancelar comanda ' + comandaResult.comanda.codigo + '?')) return;
    setLoading(true);
    try {
      await cancelComanda(comandaResult.comanda.codigo);
      setSuccessMsg('Comanda ' + comandaResult.comanda.codigo + ' cancelada');
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccessMsg(''), 4000);
      setComandaResult(null);
      setSearchTerm('');
      loadOpenComandas();
    } catch (err) {
      setError('Erro ao cancelar: ' + (err.message || ''));
    }
    setLoading(false);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  };

  const comanda = comandaResult?.comanda;
  const pedidos = comandaResult?.pedidos || [];
  const allItens = pedidos.flatMap(p => p.itens || []);
  const totalBuffet = pedidos.filter(p => p.tipo === 'buffet').reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const totalBebidas = pedidos.filter(p => p.tipo === 'mesa').reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const totalGeral = totalBuffet + totalBebidas;
  const pesoTotal = allItens.filter(i => i.peso).reduce((acc, i) => acc + (i.peso || 0), 0);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Caixa</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Busque a comanda pelo código e finalize o pagamento
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)',
          background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #dcfce7',
        }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          Código da Comanda
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ex: C042"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              style={{
                width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem',
                fontSize: '1.5rem', fontWeight: 800, textAlign: 'center',
                border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
                background: 'var(--surface)', color: 'var(--text-primary)',
                fontFamily: "'Sora', sans-serif", outline: 'none',
                letterSpacing: '0.08em',
              }}
            />
          </div>
          <button onClick={() => setShowScanner(true)} style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}>
            <Camera size={22} />
          </button>
          <button onClick={handleSearch} disabled={!searchTerm.trim()} className="btn btn-primary" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ChevronRight size={20} /> Buscar
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>

      {/* Open Comandas List */}
      {!comanda && !loadingOpen && openComandas.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} /> Comandas em Aberto ({openComandas.length})
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {openComandas.map(c => (
              <button
                key={c.codigo}
                onClick={() => selectOpenComanda(c.codigo)}
                className="card"
                style={{
                  padding: '0.75rem 1rem', cursor: 'pointer', textAlign: 'left',
                  border: '2px solid var(--border)', transition: 'border-color 0.2s',
                  background: 'var(--surface)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Sora', sans-serif" }}>
                  {c.codigo}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {formatDate(c.created_at)} {formatTime(c.created_at)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.pedidos_count} pedido{c.pedidos_count !== 1 ? 's' : ''}</span>
                  {c.total > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(c.total)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!comanda && !loadingOpen && openComandas.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Nenhuma comanda em aberto
        </div>
      )}

      {/* Comanda Result */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Buscando comanda...
        </div>
      )}

      {comanda && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Status Card */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Sora', sans-serif" }}>
                  {comanda.codigo}
                </span>
                <span style={{
                  marginLeft: '0.5rem', padding: '0.2rem 0.7rem', borderRadius: '99px',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: comanda.status === 'aberta' ? '#fef3c7' : '#f3f4f6',
                  color: comanda.status === 'aberta' ? '#b45309' : '#374151',
                  verticalAlign: 'middle',
                }}>
                  {comanda.status === 'aberta' ? 'Aberta' : comanda.status === 'fechada' ? 'Paga' : 'Cancelada'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {formatDate(comanda.created_at)} às {formatTime(comanda.created_at)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Preço/kg: <strong>R$ {Number(comanda.preco_kg || 48.90).toFixed(2).replace('.', ',')}</strong></span>
              <span>Pedidos: <strong>{pedidos.length}</strong></span>
              <span>Itens: <strong>{allItens.reduce((s, i) => s + (i.quantity || 1), 0)}</strong></span>
            </div>
          </div>

          {/* Items by type */}
          {pedidos.map((pedido, pi) => (
            <div key={pedido.id} className="card" style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: pedido.tipo === 'buffet' ? '#d97706' : 'var(--text-secondary)',
                }}>
                  {pedido.tipo === 'buffet' ? 'Buffet por Quilo' : 'Comanda'}
                </span>
                <span>{formatTime(pedido.created_at)}</span>
              </div>
              {(pedido.itens || []).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.4rem 0', borderBottom: idx < (pedido.itens || []).length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '0.9rem',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.quantity}x {item.name}</span>
                    {item.peso && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                        ({Number(item.peso).toFixed(3).replace('.', ',')} kg)
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Total */}
          <div className="card" style={{
            padding: '1.25rem', marginBottom: '1rem',
            border: '2px solid var(--primary)', background: 'var(--primary-light)',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {pedidos.length > 1 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <span>Buffet: {formatPrice(totalBuffet)}</span>
                  <span>Bebidas/Extras: {formatPrice(totalBebidas)}</span>
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Sora', sans-serif" }}>
                {formatPrice(totalGeral)}
              </span>
            </div>
            {pesoTotal > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Peso total: {pesoTotal.toFixed(3).replace('.', ',')} kg
              </div>
            )}
          </div>

          {/* Actions */}
          {comanda.status === 'aberta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {showConfirmClose ? (
                <div className="card" style={{ padding: '1.25rem', border: '2px solid #16a34a' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                    Cobrar <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{formatPrice(totalGeral)}</strong> na maquininha e fechar a comanda?
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowConfirmClose(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                      Voltar
                    </button>
                    <button onClick={handleCloseComanda} disabled={loading} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={18} /> {loading ? 'Fechando...' : 'Confirmar Pagamento'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setShowConfirmClose(true)} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.05rem' }}>
                    <CreditCard size={20} /> Fechar Comanda — {formatPrice(totalGeral)}
                  </button>
                  <button onClick={handleCancelComanda} disabled={loading} className="btn btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: '#ef4444' }}>
                    <X size={16} /> Cancelar Comanda
                  </button>
                </>
              )}
            </div>
          )}

          {comanda.status === 'fechada' && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <CheckCircle size={20} /> Comanda paga em {comanda.closed_at ? formatDate(comanda.closed_at) + ' às ' + formatTime(comanda.closed_at) : ''}
            </div>
          )}
        </motion.div>
      )}

      {!comanda && !loading && !error && !loadingOpen && openComandas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>Digite o código da comanda ou escaneie o QR Code</p>
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && <QrScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default Caixa;
