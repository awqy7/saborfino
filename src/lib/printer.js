let port = null;
let listeners = [];

export function getStatus() {
  return { connected: port !== null };
}

export function onStatusChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() {
  listeners.forEach(l => l(getStatus()));
}

export async function connect() {
  if (!navigator.serial) throw new Error('Web Serial API não disponível. Use Chrome ou Edge.');
  try {
    const ports = await navigator.serial.getPorts();
    if (ports.length > 0) {
      port = ports[0];
    } else {
      port = await navigator.serial.requestPort();
    }
    await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
    notify();
    return true;
  } catch (err) {
    port = null;
    throw err;
  }
}

export async function disconnect() {
  if (port) {
    try { await port.close(); } catch {}
    port = null;
    notify();
  }
}

export async function printOrder(order) {
  if (!port) throw new Error('Impressora não conectada');
  const data = buildReceipt(order);
  const writer = port.writable.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

function txt(s) {
  return new TextEncoder().encode(s + '');
}

function buildReceipt(order) {
  const ESC = 0x1B, GS = 0x1D;
  const C = {
    init: [ESC, 0x40],
    center: [ESC, 0x61, 0x01],
    left: [ESC, 0x61, 0x00],
    cut: [GS, 0x56, 0x00],
  };

  const buf = [];
  const S = '='.repeat(32);

  buf.push(C.init);
  buf.push(txt('\n'));
  buf.push(C.center);
  buf.push(txt('FINO SABOR\n'));
  buf.push(txt('Churrascaria\n'));
  buf.push(txt('\n'));
  buf.push(txt(S + '\n'));
  buf.push(C.left);
  buf.push(txt(`Pedido: ${order.id || ''}\n`));
  buf.push(txt(`Mesa: ${order.mesa || 'Balcão'}\n`));
  buf.push(txt(`Cliente: ${order.cliente_nome || ''}\n`));
  buf.push(txt(new Date().toLocaleString('pt-BR') + '\n'));
  buf.push(txt(S + '\n'));

  const itens = order.itens || [];
  itens.forEach(item => {
    const line = item.quantity != null ? `${item.quantity}x ${item.name}` : item.name;
    buf.push(txt(line + '\n'));
  });

  if (order.total != null) {
    buf.push(txt(S + '\n'));
    buf.push(txt(`Total: R$ ${Number(order.total).toFixed(2).replace('.', ',')}\n`));
  }

  if (order.observacao) {
    buf.push(txt('\n'));
    buf.push(txt(`Obs: ${order.observacao}\n`));
  }

  buf.push(txt('\n'));
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
