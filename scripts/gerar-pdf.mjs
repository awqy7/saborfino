import puppeteer from 'puppeteer';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

const IMAGE_BASE = resolve(root, 'public');
const OUTPUT = resolve(root, 'public', 'cardapio-para-imprimir.pdf');

async function getMenuData() {
  const server = await createServer({ root, server: { middlewareMode: true } });
  const module = await server.ssrLoadModule('/src/data/cardapio.js');
  await server.close();
  return module.MENU_DISPLAY;
}

function resolveImage(rawPath) {
  if (!rawPath) return '';
  const localPath = resolve(IMAGE_BASE, rawPath.replace(/^\//, ''));
  if (existsSync(localPath)) {
    return 'file://' + localPath.replace(/\\/g, '/');
  }
  return '';
}

function formatPrice(price) {
  return price > 0 ? `R$ ${price.toFixed(2).replace('.', ',')}` : '';
}

function buildHTML(menu) {
  const rows = menu.map(section => {
    const items = section.items.map(item => {
      const img = resolveImage(item.image);
      const imgTag = img ? `<img src="${img}" alt="${item.name}" />` : '';

      let variantsHtml = '';
      if (item.variants && item.variants.length > 0) {
        const rows = item.variants.map(v => {
          const price = formatPrice(v.price);
          return `<tr><td>${v.label}</td><td class="price">${price}</td></tr>`;
        }).join('');
        variantsHtml = `<table class="variants">${rows}</table>`;
      } else {
        const price = formatPrice(item.price);
        if (price) {
          variantsHtml = `<div class="single-price">${price}</div>`;
        }
      }

      return `
        <div class="item">
          ${imgTag}
          <div class="item-body">
            <div class="item-header">
              <span class="item-name">${item.name}</span>
              ${!item.variants && formatPrice(item.price) ? `<span class="item-price">${formatPrice(item.price)}</span>` : ''}
            </div>
            ${item.desc ? `<div class="item-desc">${item.desc}</div>` : ''}
            ${variantsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="section">
        <h2 class="section-title">${section.category}</h2>
        <div class="items">${items}</div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 10mm; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #8B0000; }
  .header h1 { font-size: 28pt; color: #8B0000; letter-spacing: 2px; }
  .header p { font-size: 10pt; color: #666; margin-top: 4px; }
  .section { margin-bottom: 30px; page-break-inside: avoid; }
  .section-title { font-size: 16pt; color: #8B0000; border-bottom: 2px solid #ddd; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1.5px; }
  .items { display: flex; flex-wrap: wrap; gap: 10px; }
  .item { display: flex; gap: 12px; width: 100%; border-bottom: 1px solid #eee; padding: 8px 0; align-items: flex-start; }
  .item img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .item-body { flex: 1; min-width: 0; }
  .item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .item-name { font-size: 10pt; font-weight: 700; color: #222; }
  .item-price { font-size: 10pt; font-weight: 700; color: #8B0000; white-space: nowrap; }
  .item-desc { font-size: 8pt; color: #666; margin-top: 2px; line-height: 1.3; }
  .variants { width: 100%; margin-top: 4px; border-collapse: collapse; }
  .variants td { font-size: 8.5pt; padding: 2px 4px; border-bottom: 1px dotted #ddd; }
  .variants td.price { text-align: right; font-weight: 600; color: #8B0000; white-space: nowrap; }
  .single-price { font-size: 10pt; font-weight: 700; color: #8B0000; margin-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>SABOR FINO</h1>
    <p>Cardápio</p>
  </div>
  ${rows}
</body>
</html>`;
}

const menu = await getMenuData();
const html = buildHTML(menu);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.pdf({ path: OUTPUT, format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
await browser.close();

console.log('PDF gerado:', OUTPUT);
