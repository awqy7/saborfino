const FOOD_CATEGORIES = ['Chapas', 'Espetos 500g/1kg', 'Porções', 'Entradas', 'Espetinhos', 'Guarnições', 'Pães de Alho'];
const DRINK_CATEGORIES = ['Drinks'];

const LABELS = {
  kitchen: { name: 'COZINHA', icon: 'K' },
  bar: { name: 'BAR', icon: 'B' },
};

function createStation() {
  return { port: null, listeners: [], queue: [], printing: false };
}

const stations = {
  kitchen: createStation(),
  bar: createStation(),
};

function getStationForItem(item) {
  if (DRINK_CATEGORIES.includes(item?.category)) return 'bar';
  return 'kitchen';
}

function getStatusFor(station) {
  return { connected: station.port !== null };
}

function notify(station) {
  station.listeners.forEach(l => l(getStatusFor(station)));
}

export function splitOrder(order) {
  const items = order.itens || [];
  const kitchen = items.filter(i => getStationForItem(i) === 'kitchen');
  const bar = items.filter(i => getStationForItem(i) === 'bar');
  return { kitchen, bar };
}

export function getStatus(station) {
  const s = stations[station];
  if (!s) return { connected: false };
  return getStatusFor(s);
}

export function onStatusChange(station, cb) {
  const s = stations[station];
  if (!s) return () => {};
  s.listeners.push(cb);
  return () => { s.listeners = s.listeners.filter(l => l !== cb); };
}

export async function connect(station) {
  const s = stations[station];
  if (!s) throw new Error(`Estação inválida: ${station}`);
  if (!navigator.serial) throw new Error('Web Serial API não disponível. Use Chrome ou Edge.');
  if (s.port) throw new Error(`Impressora da ${LABELS[station]?.name || station} já está conectada`);
  try {
    const selected = await navigator.serial.requestPort();
    for (const [key, st] of Object.entries(stations)) {
      if (key !== station && st.port && st.port === selected) {
        throw new Error(`Esta porta já está em uso pela estação ${LABELS[key]?.name || key}. Desconecte-a primeiro.`);
      }
    }
    await selected.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
    s.port = selected;
    notify(s);
    return true;
  } catch (err) {
    s.port = null;
    throw err;
  }
}

export async function disconnect(station) {
  const s = stations[station];
  if (!s) return;
  if (s.port) {
    try { await s.port.close(); } catch {}
    s.port = null;
    notify(s);
  }
}

export async function printOrder(order, station) {
  const s = stations[station];
  if (!s) throw new Error(`Estação inválida: ${station}`);
  if (!s.port) throw new Error(`Impressora da ${LABELS[station]?.name || station} não conectada`);
  return new Promise((resolve, reject) => {
    s.queue.push({ order, resolve, reject });
    processQueue(station);
  });
}

export async function splitAndPrint(order) {
  const { kitchen, bar } = splitOrder(order);
  const promises = [];
  if (kitchen.length > 0 && stations.kitchen.port) {
    promises.push(printOrder({ ...order, itens: kitchen }, 'kitchen').catch(() => {}));
  }
  if (bar.length > 0 && stations.bar.port) {
    promises.push(printOrder({ ...order, itens: bar }, 'bar').catch(() => {}));
  }
  await Promise.allSettled(promises);
}

async function processQueue(station) {
  const s = stations[station];
  if (s.printing || s.queue.length === 0) return;
  s.printing = true;
  const job = s.queue.shift();
  try {
    const data = buildReceipt(job.order, station);
    const writer = s.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
    job.resolve();
  } catch (err) {
    job.reject(err);
  } finally {
    s.printing = false;
    processQueue(station);
  }
}

function txt(s) {
  const str = s + '';
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    buf[i] = code <= 255 ? code : 63;
  }
  return buf;
}

function buildReceipt(order, station) {
  const ESC = 0x1B, GS = 0x1D;
  const C = {
    init: [ESC, 0x40],
    center: [ESC, 0x61, 0x01],
    left: [ESC, 0x61, 0x00],
    cut: [GS, 0x56, 0x00],
  };

  const label = LABELS[station]?.name || station.toUpperCase();
  const buf = [];
  const S = '-'.repeat(32);

  buf.push(C.init);
  buf.push(txt('\n'));
  buf.push(C.center);
  buf.push(txt(`${label}\n`));
  buf.push(txt('FINO SABOR\n'));
  buf.push(txt('\n'));
  buf.push(C.left);
  buf.push(txt(`Pedido: ${(order.id || '').toString().slice(0, 8)}    Mesa: ${order.mesa || 'Balcão'}\n`));
  buf.push(txt(`Cliente: ${order.cliente_nome || ''}\n`));
  buf.push(txt(new Date().toLocaleString('pt-BR') + '\n'));
  buf.push(txt(S + '\n'));

  const itens = order.itens || [];
  itens.forEach(item => {
    const name = item.quantity != null ? `${item.quantity}x ${item.name}` : item.name;
    buf.push(txt(name + '\n'));
    if (item.desc && item.desc.trim() && item.category !== 'Drinks') {
      const parts = item.desc.trim()
        .split(/\s+e\s+/)
        .flatMap(p => p.split(/,\s*/))
        .map(s => s.trim())
        .filter(Boolean);
      parts.forEach(p => buf.push(txt('  ' + p + '\n')));
    }
  });

  if (order.observacao) {
    buf.push(txt('\nObs: ' + order.observacao + '\n'));
  }

  buf.push(txt('\n\n'));
  buf.push(C.center);
  buf.push(txt('Obrigado!\n'));
  buf.push(txt('\n\n'));
  buf.push(C.cut);

  const totalLen = buf.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const b of buf) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}
