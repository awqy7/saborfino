const puppeteer = require('puppeteer');
const path = require('path');

const drinks = [
  {n:'Wood Smoke', p:45, d:'Whisky · Mel · Limao · Agua com Gas'},
  {n:'Bitter Crush', p:25, d:'Campari · Suco de Laranja · Limao'},
  {n:'Sunset Spritz', p:35, d:'Gin · Tonica · Suco de Laranja'},
  {n:'Velvet 43', p:35, d:'Licor 43 · Tonica · Morango · Hortela'},
  {n:'Sake Estilo', p:30, d:'Campari · Espumante Seco'},
  {n:'Berry Bliss', p:35, d:'Gin · Xarope de Morango · Limao'},
  {n:'Lemon Gold', p:45, d:'Gin · Licor 43 · Limao'},
  {n:'Ruby Tonic', p:40, d:'Gin · Campari · Frutas Vermelhas'},
  {n:'Gin Tonica', p:35, d:'Gin · Tonica · Limao'},
  {n:'Moscow Mule', p:35, d:'Vodka · Ginger Beer · Limao'},
  {n:'Caipirinha', p:20, d:'Cachaca · Limao · Acucar'},
  {n:'Margarita', p:35, d:'Tequila · Licor de Laranja · Limao'},
  {n:'Mojito', p:25, d:'Rum · Hortela · Limao · Acucar'},
  {n:'Sunset Spritz Aperol', p:35, d:'Gin · Aperol · Laranja'},
  {n:'Gin Rickey', p:30, d:'Gin · Limao · Agua com Gas'},
  {n:'Gin e Lemon', p:30, d:'Gin · Soda Limonada'},
  {n:'Capi Vodka', p:25, d:'Vodka · Limao · Acucar'},
  {n:'Pina Colada', p:25, d:'Rum · Abacaxi · Leite de Coco'},
  {n:'Sex on the Beach', p:25, d:'Vodka · Pessego · Laranja'},
  {n:'Negroni', p:35, d:'Gin · Campari · Vermute Rosso'},
  {n:'Dry Martini', p:10, d:'Gin · Vermute Seco'},
  {n:'Canarinho', p:25, d:'Vodka · Caramelo · Maracuja'},
  {n:'Cuba', p:15, d:'Bacardi · Coca-Cola'},
];

const doses = [
  {n:'Red Label', p:15, t:'Whisky'},
  {n:'Black Label', p:25, t:'Whisky 12 Anos'},
  {n:'Chivas Regal', p:23, t:'Whisky 12 Anos'},
  {n:'Old Parr', p:23, t:'Whisky 12 Anos'},
  {n:"Buchanan's", p:25, t:'Whisky 12 Anos'},
  {n:'Passport', p:10, t:'Whisky'},
  {n:'Cavalo Branco', p:15, t:'Whisky'},
  {n:"Ballantine's", p:13, t:'Whisky'},
  {n:'Tanqueray', p:20, t:'Gin'},
  {n:'Beefeater', p:20, t:'Gin'},
  {n:'Beefeater Strawberry', p:20, t:'Gin'},
  {n:"Gordon's", p:15, t:'Gin'},
  {n:"Gilbe's", p:13, t:'Gin'},
  {n:'Bombay', p:20, t:'Gin'},
  {n:'Jose Cuervo', t:'Tequila'},
  {n:'El Loco', t:'Tequila'},
  {n:'Licor 43', p:23, t:'Licor'},
  {n:'Campari', p:15, t:'Aperitivo'},
  {n:'Bacardi', p:10, t:'Rum'},
  {n:'Absolut', p:20, t:'Vodka'},
  {n:'Smirnoff', p:15, t:'Vodka'},
  {n:'Orloff', p:10, t:'Vodka'},
  {n:'Martini', t:'Vermute'},
];

function fmt(v) {
  return v > 0 ? 'R$ ' + v.toFixed(2).replace('.', ',') : '\u2014';
}

function renderItems(items, hasType) {
  return items.map(function(i) {
    var price = fmt(i.p);
    var typeHtml = hasType && i.t ? '<span class="type">' + i.t + '</span>' : '';
    var descHtml = i.d ? '<span class="desc">' + i.d + '</span>' : '';
    return '<div class="item">' +
      '<div class="item-left">' +
        '<span class="name">' + i.n + '</span>' +
        typeHtml +
        descHtml +
      '</div>' +
      '<span class="price">' + price + '</span>' +
    '</div>';
  }).join('');
}

var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>' +
  '@page { margin: 0; size: A4; }' +
  '* { margin: 0; padding: 0; box-sizing: border-box; }' +
  'body { font-family: Arial, sans-serif; background: #faf6f1; color: #2c1810; }' +
  '.page { width: 210mm; min-height: 297mm; padding: 20mm 18mm; }' +
  '.header { text-align: center; margin-bottom: 12mm; padding-bottom: 6mm; border-bottom: 2px solid #8B4513; }' +
  '.header h1 { font-size: 20pt; color: #3d1a10; letter-spacing: 4px; text-transform: uppercase; }' +
  '.header .sub { font-size: 8pt; color: #8B4513; letter-spacing: 2px; margin-top: 2mm; }' +
  '.section { margin-bottom: 10mm; page-break-inside: avoid; }' +
  '.section h2 { font-size: 13pt; color: #3d1a10; text-transform: uppercase; letter-spacing: 3px; border-bottom: 1px solid #d4a574; padding-bottom: 3mm; margin-bottom: 4mm; }' +
  '.item { display: flex; justify-content: space-between; align-items: center; padding: 2.5mm 0; border-bottom: 1px dotted #e0d5c8; }' +
  '.item-left { flex: 1; }' +
  '.name { font-size: 9.5pt; font-weight: 700; color: #2c1810; }' +
  '.type { display: block; font-size: 7.5pt; color: #8B4513; margin-top: 0.5mm; }' +
  '.desc { display: block; font-size: 7pt; color: #7a6a5a; margin-top: 0.5mm; font-style: italic; }' +
  '.price { font-size: 10pt; font-weight: 700; color: #8B4513; white-space: nowrap; margin-left: 8mm; }' +
  '.footer { position: fixed; bottom: 15mm; left: 18mm; right: 18mm; text-align: center; font-size: 7pt; color: #aaa; border-top: 1px solid #eee; padding-top: 3mm; }' +
  '</style></head><body>' +
  '<div class="page">' +
    '<div class="header"><h1>Sabor Fino</h1><div class="sub">Doses &amp; Drinks</div></div>' +
    '<div class="section"><h2>Doses</h2>' + renderItems(doses, true) + '</div>' +
    '<div class="section"><h2>Drinks</h2>' + renderItems(drinks, false) + '</div>' +
  '</div></body></html>';

(async function() {
  var browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  var page = await browser.newPage();
  await page.setContent(html, {waitUntil: 'networkidle0'});
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'cardapio-doses-drinks.pdf'),
    format: 'A4',
    printBackground: true,
    margin: {top: 0, bottom: 0, left: 0, right: 0}
  });
  await browser.close();
  console.log('PDF gerado!');
})();
