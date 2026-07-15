import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';

const CATEGORY_ICONS = {
  Chapas: '🍖',
  'Espetos 500g/1kg': '🥩',
  'Porções': '🍟',
  'Entradas': '🥗',
  'Espetinhos': '🍢',
  'Guarnições': '🥔',
  'Pães de Alho': '🥖',
  'Bebidas': '🥤',
  'Cervejas': '🍺',
  'Doses': '🥃',
  'Vinhos': '🍷',
  'Drinks': '🍸',
  'Buffet': '🍽️',
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
  const pedidos = (comandaData?.pedidos || []).filter(p => p.status === 'pendente');
  const allItens = pedidos.flatMap(p => p.itens || []);
  const total = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const pesoTotal = allItens.filter(i => i.peso).reduce((acc, i) => acc + (i.peso || 0), 0);
  const hasItems = allItens.length > 0;

  return (
    <div className="cv-page">
      <style>{`
        .cv-page, .cv-page * { box-sizing: border-box; }

        .cv-page {
          --orange: #ff8507;
          --orange-hot: #ff6b00;
          --orange-soft: #c87517;
          --line: rgba(255, 136, 12, 0.34);
          --text: #f4f0e9;
          --muted: #beb9b2;
          --panel: rgba(12, 12, 12, 0.92);
          min-height: 100vh;
          background:
            radial-gradient(circle at 44% -12%, rgba(255, 119, 0, 0.08), transparent 24%),
            linear-gradient(180deg, #080808 0%, #111211 52%, #0e0f0f 100%);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .cv-page svg { width: 1em; height: 1em; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

        .cv-header {
          position: relative;
          background:
            radial-gradient(circle at 78% 38%, rgba(255, 132, 14, 0.12), transparent 27%),
            radial-gradient(circle at 13% 26%, rgba(255, 103, 0, 0.12), transparent 23%),
            linear-gradient(180deg, #030303 0%, #090909 100%);
          padding: 2rem 1.25rem 1.5rem;
          text-align: center;
          overflow: hidden;
          isolation: isolate;
        }

        .cv-header::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -3;
          background:
            radial-gradient(circle at 50% 20%, rgba(74, 38, 16, 0.52), transparent 24%),
            radial-gradient(circle at 14% 38%, rgba(123, 42, 6, 0.28), transparent 19%),
            linear-gradient(90deg, #030303 0%, #0a0806 42%, #060606 100%);
        }

        .cv-header::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.52) 0%, rgba(0, 0, 0, 0.02) 38%, rgba(0, 0, 0, 0) 68%, rgba(0, 0, 0, 0.42) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0) 39%, rgba(0, 0, 0, 0.04) 78%, rgba(0, 0, 0, 0.58) 100%);
        }

        .cv-brand-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 0.75rem;
          background: linear-gradient(135deg, rgba(255,133,7,0.2), rgba(255,107,0,0.1));
          border: 1px solid rgba(255,133,7,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 0 20px rgba(255,107,0,0.15);
        }

        .cv-brand-name {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.6rem;
          letter-spacing: 0;
          color: #f8f4ef;
          text-shadow: 0 4px 22px rgba(0, 0, 0, 0.46);
          margin: 0 0 0.1rem;
        }

        .cv-brand-name span { color: var(--orange); }

        .cv-brand-sub {
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 2px;
          font-weight: 600;
          margin: 0;
        }

        .cv-comanda-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: -1.25rem;
          padding: 0.6rem 1.5rem;
          background: rgba(7,7,7,0.9);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          backdrop-filter: blur(14px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.4);
          font-weight: 800;
          font-size: 1.1rem;
          color: #f8f4ef;
          position: relative;
          z-index: 2;
        }

        .cv-comanda-pill-code {
          font-family: Georgia, "Times New Roman", serif;
        }

        .cv-comanda-pill-status {
          font-size: 0.6rem;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .cv-comanda-pill-status.aberta {
          background: rgba(255,133,7,0.15);
          color: var(--orange);
          border: 1px solid rgba(255,133,7,0.3);
        }

        .cv-comanda-pill-status.fechada {
          background: rgba(255,255,255,0.06);
          color: var(--muted);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .cv-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem 1rem 2rem;
        }

        .cv-empty {
          text-align: center;
          padding: 3rem 1.5rem;
          margin: 1rem 0;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 16px;
        }

        .cv-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .cv-empty h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.15rem;
          color: #f5eee8;
          margin: 0 0 0.35rem;
        }
        .cv-empty p {
          color: var(--muted);
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.4;
        }

        .cv-loading {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
        }

        .cv-loading-spinner {
          width: 36px;
          height: 36px;
          margin: 0 auto 1rem;
          border: 3px solid rgba(255,255,255,0.08);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: cvspin 0.7s linear infinite;
        }

        @keyframes cvspin { to { transform: rotate(360deg); } }

        .cv-pedido-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0)),
            linear-gradient(110deg, rgba(18,18,18,0.95), rgba(10,10,10,0.98));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          margin-bottom: 0.75rem;
          transition: border-color 200ms ease;
        }

        .cv-pedido-card:hover {
          border-color: rgba(255,132,14,0.3);
        }

        .cv-pedido-card::after {
          content: '';
          position: absolute;
          inset: auto 0 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,132,14,0.13), transparent);
        }

        .cv-pedido-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.7rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .cv-pedido-type {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--orange-soft);
        }

        .cv-pedido-type.buffet { color: var(--orange); }

        .cv-pedido-time {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--muted);
        }

        .cv-item-row {
          display: flex;
          align-items: center;
          padding: 0.55rem 1rem;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .cv-item-row:last-child { border-bottom: none; }

        .cv-item-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,133,7,0.08);
          border: 1px solid rgba(255,133,7,0.15);
          border-radius: 8px;
          font-size: 1rem;
        }

        .cv-item-icon.buffet {
          background: rgba(255,133,7,0.12);
          border-color: rgba(255,133,7,0.25);
        }

        .cv-item-info {
          flex: 1;
          min-width: 0;
        }

        .cv-item-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: #f5eee8;
          line-height: 1.3;
        }

        .cv-item-peso {
          font-size: 0.7rem;
          color: var(--muted);
          margin-left: 0.3rem;
        }

        .cv-item-price {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--orange);
          white-space: nowrap;
        }

        .cv-total-card {
          margin-top: 0.75rem;
          padding: 1rem 1.25rem;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0)),
            linear-gradient(110deg, rgba(18,18,18,0.95), rgba(10,10,10,0.98));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .cv-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cv-total-label {
          font-size: 1rem;
          font-weight: 700;
          color: var(--muted);
          font-family: Georgia, "Times New Roman", serif;
        }

        .cv-total-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--orange);
          letter-spacing: -0.02em;
        }

        .cv-peso-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--muted);
          margin-bottom: 0.35rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .cv-footer-note {
          text-align: center;
          padding: 1rem;
          font-size: 0.72rem;
          color: #5e5a56;
        }

        .cv-states {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          padding: 2rem;
          text-align: center;
        }

        .cv-states-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .cv-states h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.2rem;
          color: #f5eee8;
          margin: 0 0 0.35rem;
        }

        .cv-states p {
          color: var(--muted);
          font-size: 0.85rem;
          margin: 0;
        }

        .cv-error-card {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
        }

        .cv-error-card p { color: #f87171; }

        /* Mobile */
        @media (max-width: 500px) {
          .cv-header { padding: 1.5rem 1rem 1.25rem; }
          .cv-brand-name { font-size: 1.35rem; }
          .cv-brand-icon { width: 40px; height: 40px; font-size: 1.25rem; }
          .cv-comanda-pill { font-size: 0.95rem; padding: 0.5rem 1.1rem; }
          .cv-content { padding: 0.75rem 0.75rem 1.5rem; }
          .cv-pedido-header { padding: 0.6rem 0.85rem; }
          .cv-item-row { padding: 0.5rem 0.85rem; gap: 0.6rem; }
          .cv-item-icon { width: 28px; height: 28px; font-size: 0.85rem; }
          .cv-item-name { font-size: 0.8rem; }
          .cv-item-price { font-size: 0.8rem; }
          .cv-total-card { padding: 0.85rem 1rem; }
          .cv-total-value { font-size: 1.25rem; }
        }
      `}</style>

      <div className="cv-header">
        <div className="cv-brand-icon">🍖</div>
        <h1 className="cv-brand-name">Fino <span>Sabor</span></h1>
        <p className="cv-brand-sub">CHURRASCARIA</p>
      </div>

      {isValidCodigo && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="cv-comanda-pill">
            <span>#</span>
            <span className="cv-comanda-pill-code">{comanda?.codigo || codigo}</span>
            {comanda && (
              <span className={'cv-comanda-pill-status ' + (comanda.status === 'aberta' ? 'aberta' : 'fechada')}>
                {comanda.status === 'aberta' ? 'ABERTA' : 'FECHADA'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="cv-content">
        {!isValidCodigo ? (
          <div className="cv-states">
            <div className="cv-states-icon">📋</div>
            <h2>Comanda inválida</h2>
            <p>Escaneie o QR Code da sua comanda</p>
          </div>
        ) : loading ? (
          <div className="cv-loading">
            <div className="cv-loading-spinner" />
            <p>Carregando comanda...</p>
          </div>
        ) : error ? (
          <div className="cv-states">
            <div className="cv-states-icon">⚠️</div>
            <h2>Erro ao carregar</h2>
            <p>Não foi possível carregar os dados. Atualize a página.</p>
          </div>
        ) : comanda === null ? (
          <div className="cv-states">
            <div className="cv-states-icon">🔍</div>
            <h2>Comanda não encontrada</h2>
            <p>Escaneie o QR Code novamente ou vá até o caixa</p>
          </div>
        ) : !hasItems ? (
          <div className="cv-states">
            <div className="cv-states-icon">🛒</div>
            <h2>Nenhum item ainda</h2>
            <p>Seu pedido aparecerá aqui em instantes</p>
          </div>
        ) : (
          <>
            {pedidos.map(pedido => (
              <div key={pedido.id} className="cv-pedido-card" style={{ position: 'relative' }}>
                <div className="cv-pedido-header">
                  <span className={'cv-pedido-type' + (pedido.tipo === 'buffet' ? ' buffet' : '')}>
                    {pedido.tipo === 'buffet' ? '🍽️ Buffet por Quilo' : '📋 Comanda'}
                  </span>
                  <span className="cv-pedido-time">
                    {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  {(pedido.itens || []).map((item, idx) => {
                    const icon = CATEGORY_ICONS[item.category] || '📦';
                    const isBuffet = item.category === 'Buffet';
                    return (
                      <div key={idx} className="cv-item-row">
                        <div className={'cv-item-icon' + (isBuffet ? ' buffet' : '')}>{icon}</div>
                        <div className="cv-item-info">
                          <span className="cv-item-name">
                            {item.quantity}x {item.name}
                          </span>
                          {item.peso && (
                            <span className="cv-item-peso">
                              ({Number(item.peso).toFixed(3).replace('.', ',')} kg)
                            </span>
                          )}
                        </div>
                        <span className="cv-item-price">
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="cv-total-card">
              {pesoTotal > 0 && (
                <div className="cv-peso-info">
                  <span>Peso total</span>
                  <span>{pesoTotal.toFixed(3).replace('.', ',')} kg</span>
                </div>
              )}
              <div className="cv-total-row">
                <span className="cv-total-label">Total</span>
                <span className="cv-total-value">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="cv-footer-note">
              Os valores são atualizados automaticamente
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComandaView;
