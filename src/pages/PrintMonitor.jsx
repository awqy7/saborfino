import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { connect, disconnect, splitAndPrint, getStatus, onStatusChange } from '../lib/printer';
import { Bluetooth, BluetoothConnected, Printer, AlertCircle, Clock } from 'lucide-react';

const STATIONS = [
  { id: 'cozinha', label: 'Cozinha', icon: 'K', color: '#22c55e' },
  { id: 'barcaixa', label: 'Caixa', icon: 'C', color: '#ff8507' },
];

function StationCard({ station, onLog }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConnected(getStatus(station.id).connected);
    const unsub = onStatusChange(station.id, s => setConnected(s.connected));
    return unsub;
  }, [station.id]);

  const handleConnect = useCallback(async () => {
    if (connected) {
      await disconnect(station.id);
      onLog(`${station.label}: Impressora desconectada`, 'warn');
      return;
    }
    setConnecting(true);
    setError('');
    try {
      await connect(station.id);
      onLog(`${station.label}: Impressora conectada!`, 'success');
    } catch (err) {
      setError('Falha ao conectar');
      onLog(`${station.label}: Falha ao conectar`, 'error');
    } finally {
      setConnecting(false);
    }
  }, [connected, station.id, onLog]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
      border: `1px solid ${connected ? station.color + '40' : 'rgba(255,255,255,0.08)'}`,
      padding: '1.25rem', flex: 1, minWidth: 220,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: connected ? `${station.color}18` : 'rgba(255,255,255,0.04)',
          border: `2px solid ${connected ? station.color : 'rgba(255,255,255,0.1)'}`,
          color: connected ? station.color : '#666',
          fontWeight: 800, fontSize: '1.1rem',
        }}>
          {station.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f4f0e9' }}>{station.label}</div>
          <div style={{ fontSize: '0.78rem', color: connected ? station.color : '#666', fontWeight: 600 }}>
            {connected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          width: '100%', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
          border: `1px solid ${connected ? station.color + '50' : 'rgba(255,255,255,0.15)'}`,
          background: connected ? `${station.color}12` : 'rgba(255,255,255,0.04)',
          color: connected ? station.color : '#bbb',
          transition: 'all 0.15s',
        }}
      >
        {connecting ? 'Conectando...' : connected ? (
          <><BluetoothConnected size={16} /> Desconectar</>
        ) : (
          <><Bluetooth size={16} /> Conectar</>
        )}
      </button>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem',
          padding: '0.4rem 0.6rem', fontSize: '0.72rem', color: '#ef4444',
          background: 'rgba(239,68,68,0.08)', borderRadius: '6px',
        }}>
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}

const PrintMonitor = () => {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { msg, type, time: new Date().toLocaleTimeString('pt-BR') }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function getNewItems(oldItens, newItens) {
    const oldQty = {};
    (oldItens || []).forEach(i => {
      const key = i.cartKey || `${i.id}-${i.name}`;
      oldQty[key] = (oldQty[key] || 0) + (i.quantity || 1);
    });

    const newQty = {};
    (newItens || []).forEach(i => {
      const key = i.cartKey || `${i.id}-${i.name}`;
      newQty[key] = (newQty[key] || 0) + (i.quantity || 1);
    });

    const result = [];
    const handled = new Set();
    (newItens || []).forEach(i => {
      const key = i.cartKey || `${i.id}-${i.name}`;
      if (handled.has(key)) return;
      handled.add(key);
      const diff = (newQty[key] || 0) - (oldQty[key] || 0);
      if (diff > 0) {
        result.push({ ...i, quantity: diff });
      }
    });

    return result;
  }

  useEffect(() => {
    const channel = supabase.channel('print-monitor')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos', filter: 'status=eq.pendente' },
        async (payload) => {
          const order = payload.new;
          addLog(`Novo pedido: Mesa ${order.mesa || 'Balcão'}`, 'info');
          try {
            await splitAndPrint(order);
            addLog(`Impresso!`, 'success');
          } catch (err) {
            addLog('Erro ao imprimir', 'error');
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        async (payload) => {
          const { old: oldOrder, new: newOrder } = payload;
          if (oldOrder.status !== newOrder.status) return;
          if (!oldOrder.itens || !newOrder.itens) return;
          if (oldOrder.itens.length > newOrder.itens.length) return;

          const added = getNewItems(oldOrder.itens, newOrder.itens);
          if (added.length === 0) return;

          addLog(`Adição: Mesa ${newOrder.mesa} (${added.length} item(ns))`, 'info');
          try {
            await splitAndPrint({ ...newOrder, itens: added, total: 0 });
            addLog(`Impresso!`, 'success');
          } catch (err) {
            addLog('Erro ao imprimir', 'error');
          }
        }
      )
      .subscribe();

    addLog('Monitor iniciado. Aguardando pedidos...', 'info');
    return () => { supabase.removeChannel(channel); };
  }, [addLog]);

  const logColor = (type) => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', background: '#090909', color: '#f4f0e9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={24} /> Monitor de Impressão
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Imprime automaticamente nas impressoras da Cozinha e do Bar
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STATIONS.map(s => (
            <StationCard key={s.id} station={s} onLog={addLog} />
          ))}
        </div>

        <div style={{
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8',
          }}>
            <Clock size={14} /> Últimas Atividades
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', minHeight: 200, maxHeight: 400 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#525252', fontSize: '0.85rem' }}>
                <Printer size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                Nenhuma atividade ainda<br />Conecte as impressoras e aguarde pedidos
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.5rem', padding: '0.35rem 0.5rem',
                  fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ color: '#525252', flexShrink: 0, fontFamily: 'monospace' }}>{log.time}</span>
                  <span style={{ color: logColor(log.type), flex: 1 }}>{log.msg}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintMonitor;