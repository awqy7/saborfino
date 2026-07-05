import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { connect, disconnect, printOrder, getStatus, onStatusChange } from '../lib/printer';
import { Bluetooth, BluetoothConnected, Printer, CheckCircle, X, AlertCircle, Clock } from 'lucide-react';

const PrintMonitor = () => {
  const [printerConnected, setPrinterConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  const addLog = (msg, type = 'info') => {
    const entry = { msg, type, time: new Date().toLocaleTimeString('pt-BR') };
    setLogs(prev => [...prev.slice(-50), entry]);
  };

  useEffect(() => {
    setPrinterConnected(getStatus().connected);
    const unsub = onStatusChange(s => setPrinterConnected(s.connected));
    return unsub;
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const channel = supabase.channel('print-monitor')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos', filter: 'status=eq.pendente' },
        async (payload) => {
          const order = payload.new;
          addLog(`Pedido detectado: Mesa ${order.mesa || 'Balcão'} — ${order.cliente_nome || '?'}`, 'info');
          if (getStatus().connected) {
            try {
              await printOrder(order);
              addLog(`Impresso com sucesso!`, 'success');
            } catch (err) {
              addLog(`Erro ao imprimir: ${err.message}`, 'error');
            }
          } else {
            addLog(`Impressora desconectada — pedido na fila`, 'warn');
          }
        }
      )
      .subscribe();

    addLog('Monitor iniciado. Aguardando pedidos...', 'info');
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConnect = useCallback(async () => {
    if (printerConnected) {
      await disconnect();
      addLog('Impressora desconectada', 'warn');
      return;
    }
    setConnecting(true);
    setError('');
    try {
      await connect();
      addLog('Impressora conectada com sucesso!', 'success');
    } catch (err) {
      setError(err.message || 'Falha ao conectar');
      addLog(`Erro: ${err.message || 'Falha ao conectar'}`, 'error');
    } finally {
      setConnecting(false);
    }
  }, [printerConnected]);

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
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 1rem', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: printerConnected ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${printerConnected ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
          }}>
            {printerConnected ? <BluetoothConnected size={36} color="#22c55e" /> : <Bluetooth size={36} color="#94a3b8" />}
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Monitor de Impressão</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Imprime automaticamente todos os pedidos
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '1rem', borderRadius: '12px',
            border: `2px solid ${printerConnected ? '#22c55e' : 'rgba(255,132,14,0.3)'}`,
            background: printerConnected ? 'rgba(34,197,94,0.08)' : 'rgba(255,132,14,0.06)',
            color: printerConnected ? '#22c55e' : '#ff8507',
            cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
            transition: 'all 0.15s',
          }}
        >
          {connecting ? (
            <span>Conectando...</span>
          ) : printerConnected ? (
            <><BluetoothConnected size={20} /> Impressora Conectada — Clique para desconectar</>
          ) : (
            <><Bluetooth size={20} /> Conectar Impressora Térmica</>
          )}
        </button>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem',
            padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#ef4444',
            background: 'rgba(239,68,68,0.08)', borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <AlertCircle size={12} /> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
          </div>
        )}

        <div style={{
          flex: 1, marginTop: '1.5rem', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', minHeight: 200 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#525252', fontSize: '0.85rem' }}>
                <Printer size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                Nenhuma atividade ainda<br />Conecte a impressora e aguarde pedidos
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

        {printerConnected && (
          <div style={{
            marginTop: '1rem', textAlign: 'center', padding: '0.75rem',
            background: 'rgba(34,197,94,0.06)', borderRadius: '10px',
            border: '1px solid rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            fontSize: '0.85rem', fontWeight: 600, color: '#22c55e',
          }}>
            <CheckCircle size={16} /> Monitorando pedidos em tempo real
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintMonitor;