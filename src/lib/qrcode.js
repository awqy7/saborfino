import QRCode from 'qrcode';

const BASE_URL = 'https://finosabor.netlify.app';

export function comandaUrl(codigo) {
  return BASE_URL + '/comanda/' + codigo;
}

export async function generateComandaQR(codigo, options = {}) {
  const url = comandaUrl(codigo);
  const dataUrl = await QRCode.toDataURL(url, {
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.dark || '#000000',
      light: options.light || '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  });
  return dataUrl;
}

export async function generateComandaQRAsBlob(codigo, options = {}) {
  const dataUrl = await generateComandaQR(codigo, options);
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function tryScanQR() {
  if (!('BarcodeDetector' in window)) {
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 640, height: 480 }
    });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    await video.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    let result = null;
    for (let i = 0; i < 30; i++) {
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          result = codes[0].rawValue;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    stream.getTracks().forEach(t => t.stop());
    video.remove();
    return result;
  } catch {
    return null;
  }
}
