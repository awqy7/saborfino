export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

export function validateEmail(email) {
  if (typeof email !== 'string') return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalized = email.trim().toLowerCase();
  return emailRegex.test(normalized) ? normalized : null;
}

export function validateTableNumber(table) {
  const num = parseInt(table, 10);
  return (!isNaN(num) && num >= 1 && num <= 7) ? num : null;
}

export function validateOrderData(data) {
  const errors = [];
  
  if (!data.mesa || data.mesa.trim().length === 0) {
    errors.push('Mesa/tipo de pedido é obrigatório');
  }
  
  if (data.tipo === 'mesa') {
    const mesaNum = parseInt(data.mesa, 10);
    if (isNaN(mesaNum) || mesaNum < 1 || mesaNum > 7) {
      errors.push('Número da mesa deve ser entre 1 e 7');
    }
  }
  
  if (!data.cliente_nome || data.cliente_nome.trim().length === 0) {
    errors.push('Nome do cliente é obrigatório');
  } else if (data.cliente_nome.trim().length > 100) {
    errors.push('Nome do cliente deve ter no máximo 100 caracteres');
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
  
  for (const item of data.itens || []) {
    if (!item.name || item.name.trim().length === 0) {
      errors.push('Item sem nome detectado');
      continue;
    }
    if (item.variants && item.variants.length > 0) continue;
    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push(`Preço inválido para item: ${item.name}`);
      continue;
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
      errors.push(`Quantidade inválida para item: ${item.name}`);
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