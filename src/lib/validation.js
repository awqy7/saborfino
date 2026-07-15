export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&#x?\d+;|&#x[0-9a-f]+;|\\x[0-9a-f]{2}|\\u[0-9a-f]{4}/gi, '')
    .replace(/[<>"']/g, (ch) => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

export function validateEmail(email) {
  if (typeof email !== 'string') return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalized = email.trim().toLowerCase();
  return emailRegex.test(normalized) ? normalized : null;
}

export function validateTableNumber(table) {
  const num = parseInt(table, 10);
  return (!isNaN(num) && num >= 1 && num <= 8) ? num : null;
}

export function validateComandaCodigo(codigo) {
  if (typeof codigo !== 'string') return null;
  const match = codigo.trim().toUpperCase().match(/^C(\d{3})$/);
  return match ? 'C' + match[1] : null;
}

export function validateClientName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().slice(0, 100);
  return trimmed.length > 0 ? trimmed : null;
}

export function validateOrderData(data) {
  const errors = [];

  const hasMesa = data.mesa && data.mesa.trim().length > 0;
  const hasComanda = data.comanda_codigo && data.comanda_codigo.trim().length > 0;

  if (!hasMesa && !hasComanda) {
    errors.push('Mesa ou comanda é obrigatório');
  }

  if (hasMesa && data.tipo === 'mesa') {
    const mesaNum = parseInt(data.mesa, 10);
    if (isNaN(mesaNum) || mesaNum < 1 || mesaNum > 8) {
      errors.push('Número da mesa deve ser entre 1 e 8');
    }
  }

  if (hasComanda) {
    const valid = validateComandaCodigo(data.comanda_codigo);
    if (!valid) errors.push('Código de comanda inválido (use formato C000)');
  }

  if (!data.itens || data.itens.length === 0) {
    errors.push('O pedido deve conter pelo menos um item');
  }

  if (typeof data.total !== 'number' || data.total <= 0) {
    errors.push('Total do pedido deve ser maior que zero');
  }

  if (data.observacao && data.observacao.length > 500) {
    errors.push('Observação deve ter no máximo 500 caracteres');
  }
  if (data.observacao) {
    data.observacao = sanitizeHtml(data.observacao);
  }

  for (const item of data.itens || []) {
    if (!item.name || item.name.trim().length === 0) {
      errors.push('Item sem nome detectado');
      continue;
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push('Preço inválido para item: ' + item.name);
      continue;
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
      errors.push('Quantidade inválida para item: ' + item.name);
      continue;
    }
    if (item.serving_time && !['now', 'with_food'].includes(item.serving_time)) {
      errors.push('serving_time inválido para item: ' + item.name);
      continue;
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePositiveNumber(value, max = 999999.99) {
  const num = parseFloat(value);
  return (!isNaN(num) && num > 0 && num <= max) ? num : null;
}

export function validateInteger(value, min = 1, max = 9999) {
  const num = parseInt(value, 10);
  return (!isNaN(num) && num >= min && num <= max) ? num : null;
}

export function validateCNPJ(cnpj) {
  if (typeof cnpj !== 'string') return null;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return null;

  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(digits[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(digits[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return parseInt(digits[12]) === digit1 && parseInt(digits[13]) === digit2 ? digits : null;
}

export function validateQuantity(qty, max = 99) {
  const num = parseInt(qty, 10);
  return !isNaN(num) && num >= 1 && num <= max;
}
