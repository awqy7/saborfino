const puppeteer = require('puppeteer');
const path = require('path');

const secoes = [
  {
    t: 'CHAPAS',
    i: [
      { n: 'Picanha', v: '400g R$120 · 600g R$150 · 800g R$190 · 1kg R$220', d: 'c/ batata frita c/ queijo e bacon, mandioca na manteiga' },
      { n: 'Contra Fil\u00e9', v: '400g R$75 · 800g R$140', d: 'c/ batata frita c/ queijo e bacon, mandioca na manteiga' },
    ]
  },
  {
    t: 'ESPETOS 500g/1kg',
    i: [
      { n: 'Picanha', v: 'Completa: 1kg R$210 / 500g R$120 | Tradicional: 1kg R$160 / 500g R$85' },
      { n: 'Contra Fil\u00e9', v: 'Completo: 1kg R$180 / 500g R$95 | Tradicional: 1kg R$140 / 500g R$70' },
      { n: 'Alcatra', v: 'Completa: 1kg R$180 / 500g R$95 | Tradicional: 1kg R$140 / 500g R$70' },
      { n: 'Ma\u00e7\u00e3 de Peito', v: 'Completa: 1kg R$120 / 500g R$65 | Tradicional: 1kg R$90 / 500g R$50' },
      { n: 'Fraldinha', v: 'Completa: 1kg R$120 / 500g R$65 | Tradicional: 1kg R$90 / 500g R$50' },
    ]
  },
  {
    t: 'ENTRADAS',
    i: [
      { n: 'Bolinho de Bacalhau', v: 'R$30 · 10 unid' },
      { n: 'Camar\u00e3o do Cabe\u00e7a', v: 'R$70 · 10 unid' },
      { n: 'Bolinho Mandioca c/ Carne Seca', v: 'R$30 · 10 unid' },
      { n: 'Bolinho de Costela Recheado', v: 'R$50 · 10 unid' },
      { n: 'Bolinho de Camar\u00e3o', v: 'R$40 · 10 unid' },
      { n: 'Croquete de Bacalhau', v: 'R$45 · 10 unid' },
    ]
  },
  {
    t: 'POR\u00c7\u00d5ES',
    i: [
      { n: 'Fil\u00e9 com Fritas', v: 'R$70' },
      { n: 'Lingui\u00e7a', v: 'R$35' },
      { n: 'Isca de Til\u00e1pia', v: 'R$70' },
      { n: 'Torresmo de Rolo', v: 'R$50' },
      { n: 'Torresmo c/ Mandioca', v: 'R$40' },
      { n: 'Calabresa', v: '400g R$30 · c/ Fritas R$45' },
      { n: 'Macaxeira', v: 'R$70' },
      { n: 'Fritas R$20 · c/ Cheddar e Bacon R$35' },
    ]
  },
  {
    t: 'ESPETINHOS',
    i: [
      { n: 'Boi · Porco · Lingui\u00e7a · Cora\u00e7\u00e3o' },
      { n: 'Medalh\u00e3o de Frango · Medalh\u00e3o de Boi' },
      { n: 'Meio da Asa · Picanha Bovina · Kafta' },
      { n: 'Queijo Coalho' },
    ]
  },
  {
    t: 'GUARNI\u00c7\u00d5ES',
    i: [
      { n: 'Arroz (01 ou 02 pessoas) · Tropeiro (P ou G)' },
      { n: 'Vinagrete · Farofa' },
    ]
  },
  {
    t: 'P\u00c3ES DE ALHO',
    i: [
      { n: 'Tradicional c/ Provolone · Por\u00f3 c/ Provolone' },
      { n: 'Frango c/ Requeij\u00e3o · Quatro Queijos' },
      { n: 'Quatro Queijos c/ Mel' },
    ]
  },
  {
    t: 'BEBIDAS',
    i: [
      { n: 'Coca-Cola', v: '220ml·350ml·600ml·1L·2L·KS·Pitulinha (+ Zero)' },
      { n: 'Guaran\u00e1 Ant\u00e1rtica', v: '269ml·350ml·600ml·1L·1.5L·2L·Pitulinha' },
      { n: 'Fanta', v: 'Laranja 220ml/KS/600ml | Uva 220ml/600ml | 2L' },
      { n: 'Sprite', v: '220ml·600ml·2L·KS' },
      { n: 'Kuat · Mate Cola (200ml·1.5L)' },
      { n: 'Suco Del Valle', v: 'P\u00eassego·Uva·Manga·Goiaba·Maracuj\u00e1' },
    ]
  },
  {
    t: 'CERVEJAS',
    i: [
      { n: 'Brahma · Heineken · Stella · Skol', v: 'Lata 350ml / Long Neck' },
      { n: 'Skol Beats', v: 'Red Mix / GT' },
      { n: 'Antarctica · Budweiser · Corona', v: 'Lata 350ml / Long Neck' },
    ]
  },
  {
    t: 'DOSES',
    i: [
      { n: 'Red Label R$15 · Black Label R$25 · Chivas R$23 · Old Parr R$23' },
      { n: "Buchanan's R$25 · Passport R$10 · Cavalo Branco R$15" },
      { n: "Ballantine's R$13 · Tanqueray R$20 · Beefeater R$20" },
      { n: 'Beefeater Strawberry R$20 · Gordon\'s R$15 · Gilbe\'s R$13' },
      { n: 'Bombay R$20 · Jos\u00e9 Cuervo · El Loco · Martini' },
      { n: 'Licor 43 R$23 · Campari R$15 · Bacardi R$10' },
      { n: 'Absolut R$20 · Smirnoff R$15 · Orloff R$10' },
    ]
  },
  {
    t: 'VINHOS',
    i: [
      { n: 'Reservado Malbec · Metropolitano · Carmenere' },
      { n: 'Reservado Merlot · P\u00e9rgola' },
    ]
  },
  {
    t: 'DRINKS',
    i: [
      { n: 'Wood Smoke', v: 'R$45' },
      { n: 'Bitter Crush', v: 'R$25' },
      { n: 'Sunset Spritz · Velvet 43 · Berry Bliss', v: 'R$35' },
      { n: 'Lemon Gold', v: 'R$45' },
      { n: 'Ruby Tonic', v: 'R$40' },
      { n: 'Gin T\u00f4nica · Moscow Mule · Margarita', v: 'R$35' },
      { n: 'Caipirinha', v: 'R$20' },
      { n: 'Mojito · Gin Rickey · Gin e Lemon', v: 'R$25 / R$30' },
      { n: 'Capi Vodka · Pina Colada · Sex on the Beach', v: 'R$25' },
      { n: 'Negroni', v: 'R$35' },
      { n: 'Dry Martini R$10 · Canarinho R$25' },
      { n: 'Cuba', v: 'R$15' },
    ]
  },
];

function renderItems(items) {
  return items.map(function(i) {
    var preco = i.v ? ' <span class="pr">' + i.v + '</span>' : '';
    var desc = i.d ? ' <span class="de">' + i.d + '</span>' : '';
    return '<div class="li"><span class="nm">' + i.n + '</span>' + preco + desc + '</div>';
  }).join('');
}

// Distribute sections across 2 columns evenly
var left = [], right = [];
for (var k = 0; k < secoes.length; k++) {
  if (k % 2 === 0) left.push(secoes[k]);
  else right.push(secoes[k]);
}

var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>' +
  '@page { margin: 0; size: A4; }' +
  '* { margin: 0; padding: 0; box-sizing: border-box; }' +
  'body { font-family: "Segoe UI", Arial, sans-serif; color: #2c1810; background: #faf6f1; }' +
  '' +
  '.page { width: 210mm; height: 297mm; padding: 7mm 6mm; display: flex; flex-direction: column; }' +
  '' +
  '.header { text-align: center; margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 2px solid #8B4513; position: relative; }' +
  '.header::after { content: ""; position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%); width: 40mm; height: 2px; background: #d4a574; }' +
  '.header h1 { font-size: 16pt; color: #3d1a10; letter-spacing: 5px; text-transform: uppercase; font-weight: 700; }' +
  '.header .sub { font-size: 6.5pt; color: #8B4513; letter-spacing: 3px; margin-top: 1mm; font-family: Arial; }' +
  '' +
  '.cols { display: flex; gap: 5mm; flex: 1; }' +
  '.col { flex: 1; min-width: 0; display: flex; flex-direction: column; }' +
  '' +
  '.sec { margin-bottom: 2.2mm; page-break-inside: avoid; }' +
  '' +
  '.st { display: flex; align-items: center; gap: 2mm; margin-bottom: 0.8mm; }' +
  '.st span { font-size: 7pt; font-weight: 700; color: #3d1a10; text-transform: uppercase; letter-spacing: 2px; white-space: nowrap; }' +
  '.st .ln { flex: 1; height: 1px; background: linear-gradient(to right, #d4a574, transparent); }' +
  '' +
  '.li { font-size: 5.8pt; line-height: 1.45; color: #2c1810; padding: 0.25mm 0 0.25mm 1mm; }' +
  '.nm { font-weight: 600; color: #2c1810; }' +
  '.pr { color: #8B4513; font-weight: 600; }' +
  '.de { color: #8a7a6a; font-style: italic; font-size: 5.2pt; }' +
  '' +
  '.footer { text-align: center; font-size: 5.5pt; color: #999; border-top: 1px solid #ddd; padding-top: 1.5mm; margin-top: auto; letter-spacing: 1px; }' +
  '</style></head><body>' +
  '<div class="page">' +
    '<div class="header"><h1>Sabor Fino</h1><div class="sub">Espetaria &amp; Churrascaria</div></div>' +
    '<div class="cols">' +
      '<div class="col">' + left.map(function(s) { return '<div class="sec"><div class="st"><span>' + s.t + '</span><div class="ln"></div></div>' + renderItems(s.i) + '</div>'; }).join('') + '</div>' +
      '<div class="col">' + right.map(function(s) { return '<div class="sec"><div class="st"><span>' + s.t + '</span><div class="ln"></div></div>' + renderItems(s.i) + '</div>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="footer">Taxa de servi\u00e7o 10%</div>' +
  '</div></body></html>';

(async function() {
  var browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  var page = await browser.newPage();
  await page.setContent(html, {waitUntil: 'networkidle0'});
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'cardapio-completo.pdf'),
    format: 'A4',
    printBackground: true,
    margin: {top: 0, bottom: 0, left: 0, right: 0}
  });
  await browser.close();
  console.log('PDF gerado!');
})();
