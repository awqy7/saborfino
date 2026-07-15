import { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

const QrScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const detectorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Leitor QR não disponível neste navegador. Use Chrome no Android.');
        setScanning(false);
        return;
      }
      try {
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        setError('Leitor QR não disponível');
        setScanning(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError('Permissão de câmera negada');
        setScanning(false);
      }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!scanning || !detectorRef.current) return;
    let active = true;
    const loop = async () => {
      while (active && scanning) {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length > 0 && active) {
            const raw = codes[0].rawValue;
            active = false;
            stopCamera();
            onScan(raw);
            return;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 400));
      }
    };
    const timer = setTimeout(loop, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [scanning]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: '1rem',
        textAlign: 'center',
      }}>
        <div style={{
          color: '#fff', fontWeight: 700, fontSize: '1rem',
          marginBottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}>
          <Camera size={20} /> Escaneie o QR Code da Comanda
        </div>

        {error ? (
          <div style={{
            padding: '2rem', background: 'rgba(239,68,68,0.15)',
            borderRadius: 'var(--radius-lg)', color: '#f87171',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
          }}>
            <AlertCircle size={32} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{error}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Digite o código manualmente</span>
          </div>
        ) : (
          <div style={{
            width: 280, height: 280, margin: '0 auto',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)',
            position: 'relative',
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid #22c55e',
              borderRadius: 'var(--radius-md)',
              margin: '1.5rem',
              pointerEvents: 'none',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            }} />
          </div>
        )}

        <button
          onClick={() => { stopCamera(); onClose(); }}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            border: 'none', borderRadius: '99px',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <X size={16} /> Cancelar
        </button>
      </div>
    </div>
  );
};

export default QrScanner;
