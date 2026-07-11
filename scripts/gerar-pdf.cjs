const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const IMAGE_BASE = path.resolve(__dirname, '..', 'public');
const HERO_IMG = path.resolve(__dirname, '..', 'src', 'assets', 'hero.png');

function resolveImage(rawPath) {
  if (!rawPath) return '';
  const localPath = path.resolve(IMAGE_BASE, rawPath.replace(/^\//, ''));
  if (fs.existsSync(localPath)) return 'file://' + localPath.replace(/\\/g, '/');
  return '';
}

function fmt(n) {
  return n > 0
    ? 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : '';
}

const menu = [
  {
    category: 'Chapas',
    items: [
      {
        name: 'Picanha (na Chapa)',
        desc: 'Picanha na chapa, batata frita c/ queijo e bacon e mandioca cozida na manteiga de garrafa',
        image: '/images/dishes/sabor.webp',
        variants: [
          { label: '400g', price: 120 },
          { label: '600g', price: 150 },
          { label: '800g', price: 190 },
          { label: '1kg', price: 220 },
        ],
      },
      {
        name: 'Chapa de Contra Filé',
        desc: 'Contra filé na chapa, batata frita c/ queijo e bacon e mandioca cozida na manteiga de garrafa',
        image: '/images/dishes/sabor.webp',
        variants: [
          { label: '400g', price: 75 },
          { label: '800g', price: 140 },
        ],
      },
    ],
  },
  {
    category: 'Espetos 500g/1kg',
    items: [
      {
        name: 'Picanha',
        desc: 'Espeto de picanha na brasa',
        image: '/images/dishes/espeto-picanha-churrasco.webp',
        variants: [
          { label: 'Completa 1kg', price: 210 },
          { label: 'Completa 500g', price: 120 },
          { label: 'Tradicional 1kg', price: 160 },
          { label: 'Tradicional 500g', price: 85 },
        ],
      },
      {
        name: 'Contra Filé',
        desc: 'Espeto de contra filé na brasa',
        image: '/images/dishes/espeto-contrafile-churrasco.webp',
        variants: [
          { label: 'Completo 1kg', price: 180 },
          { label: 'Completo 500g', price: 95 },
          { label: 'Tradicional 1kg', price: 140 },
          { label: 'Tradicional 500g', price: 70 },
        ],
      },
      {
        name: 'Alcatra',
        desc: 'Espeto de alcatra na brasa',
        image: '/images/dishes/espeto-contrafile-churrasco.webp',
        variants: [
          { label: 'Completa 1kg', price: 180 },
          { label: 'Completa 500g', price: 95 },
          { label: 'Tradicional 1kg', price: 140 },
          { label: 'Tradicional 500g', price: 70 },
        ],
      },
      {
        name: 'Maçã de Peito',
        desc: 'Espeto de maçã de peito na brasa',
        image: '/images/dishes/espeto-fraldinha-churrasco.webp',
        variants: [
          { label: 'Completa 1kg', price: 120 },
          { label: 'Completa 500g', price: 65 },
          { label: 'Tradicional 1kg', price: 90 },
          { label: 'Tradicional 500g', price: 50 },
        ],
      },
      {
        name: 'Fraldinha',
        desc: 'Espeto de fraldinha na brasa',
        image: '/images/dishes/espeto-fraldinha-churrasco.webp',
        variants: [
          { label: 'Completa 1kg', price: 120 },
          { label: 'Completa 500g', price: 65 },
          { label: 'Tradicional 1kg', price: 90 },
          { label: 'Tradicional 500g', price: 50 },
        ],
      },
    ],
  },
  {
    category: 'Porções',
    items: [
      { name: 'Filé com Fritas', desc: '400g de filé acebolado na chapa com fritas crocantes', price: 70, image: '/images/dishes/porcao-contrafile.webp' },
      { name: 'Linguiça', desc: '400g de linguiça, 200g de fritas e 200g de mandioca cozida na manteiga', price: 35, image: '/images/dishes/linp.webp' },
      { name: 'Isca de Tilápia', desc: 'Filé de tilápia empanado com fritas', price: 70, image: '/images/dishes/tilapia-frita.webp' },
      { name: 'Torresmo de Rolo', desc: 'Crocante com geleia de pimenta e aperitivos', price: 50, image: '/images/dishes/torresmo-rolo.webp' },
      { name: 'Torresmo com Mandioca', desc: 'Torresmo pururuca crocante com mandioca cozida na manteiga', price: 40, image: '/images/dishes/torresmop.webp' },
      { name: 'Calabresa', image: '/images/dishes/calabresa.webp', variants: [{ label: 'Calabresa 400g', price: 30 }, { label: 'Calabresa com Fritas', price: 45 }] },
      { name: 'Macaxeira', desc: 'Carne de sol com mandioca cozida na manteiga', price: 70, image: '/images/dishes/macaxeira.webp' },
    ],
  },
  {
    category: 'Entradas',
    items: [
      { name: 'Bolinho de Bacalhau', desc: '10 unidades de bolinho de bacalhau crocante por fora e macio por dentro', price: 30, image: '/images/dishes/bolinho3.webp' },
      { name: 'Camarão do Cabeça', desc: '10 unidades de camarão do cabeça', price: 70, image: '/images/dishes/camafeu.webp' },
      { name: 'Bolinho de Mandioca c/ Carne Seca', desc: '10 unidades de bolinho de mandioca recheado com carne seca desfiada e requeijão', price: 30, image: '/images/dishes/bolinho2.webp' },
      { name: 'Bolinho de Costela Recheado', desc: '10 unidades de bolinho de costela gaúcha recheada com queijo minas', price: 50, image: '/images/dishes/bolinhodecostela.webp' },
      { name: 'Bolinho de Camarão', desc: '10 unidades de bolinho de camarão com cream cheese', price: 40, image: '/images/dishes/bolinhocamarao.webp' },
      { name: 'Croquete de Bacalhau', desc: '10 unidades de croquete de bacalhau com requeijão cremoso', price: 45, image: '/images/dishes/croquete.webp' },
    ],
  },
  {
    category: 'Espetinhos',
    items: [
      { name: 'Boi', image: '/images/dishes/espeto-boi.webp' },
      { name: 'Porco', image: '/images/dishes/espeto-porco.webp' },
      { name: 'Linguiça', image: '/images/dishes/espeto-linguica.webp' },
      { name: 'Coração', image: '/images/dishes/espeto-coracao.webp' },
      { name: 'Medalhão de Frango', image: '/images/dishes/espeto-frango.webp' },
      { name: 'Medalhão de Boi', image: '/images/dishes/espeto-medalhao-boi.webp' },
      { name: 'Meio da Asa', image: '/images/dishes/espeto-asa.webp' },
      { name: 'Picanha Bovina', image: '/images/dishes/espeto-picanha.webp' },
      { name: 'Kafta', image: '/images/dishes/espeto-kafta.webp' },
      { name: 'Queijo Coalho', image: '/images/dishes/coalho.webp' },
    ],
  },
  {
    category: 'Guarnicões',
    items: [
      { name: 'Arroz com Alho Torrado', image: '/images/dishes/arroz2.webp', variants: [{ label: '01 pessoa', price: 0 }, { label: '02 pessoas', price: 0 }] },
      { name: 'Arroz Branco', image: '/images/dishes/arroz2.webp', variants: [{ label: '01 pessoa', price: 0 }, { label: '02 pessoas', price: 0 }] },
      { name: 'Tropeiro', image: '/images/dishes/tropeiro.webp', variants: [{ label: 'Pequeno', price: 0 }, { label: 'Grande', price: 0 }] },
      { name: 'Vinagrete', desc: 'Vinagrete tradicional com tomate, cebola, pimentão e cheiro verde', image: '/images/dishes/vinagrete.webp' },
      { name: 'Farofa', desc: 'Farofa temperada com manteiga, cebola e bacon', image: '/images/dishes/farofa.webp' },
    ],
  },
  {
    category: 'Pães de Alho',
    items: [
      { name: 'Tradicional c/ Provolone', image: '/images/dishes/paoalho2.webp' },
      { name: 'Poró c/ Provolone', image: '/images/dishes/paoalho2.webp' },
      { name: 'Frango c/ Requeijão', image: '/images/dishes/paoalho2.webp' },
      { name: 'Quatro Queijos', image: '/images/dishes/paoalho2.webp' },
      { name: 'Quatro Queijos c/ Mel', image: '/images/dishes/paoalho2.webp' },
    ],
  },
  {
    category: 'Bebidas',
    items: [
      { name: 'Coca-Cola', image: '/images/dishes/bebida-coca.webp', variants: [{ label: '220ml', price: 0 }, { label: '350ml', price: 0 }, { label: '600ml', price: 0 }, { label: '1L', price: 0 }, { label: '2L', price: 0 }, { label: 'KS 290ml', price: 0 }, { label: '200ml Pitulinha', price: 0 }, { label: '220ml Zero', price: 0 }, { label: '350ml Zero', price: 0 }, { label: '600ml Zero', price: 0 }, { label: 'KS 290ml Zero', price: 0 }, { label: '200ml Pitulinha Zero', price: 0 }] },
      { name: 'Guaraná Antártica', image: '/images/dishes/bebida-guarana.webp', variants: [{ label: '269ml', price: 0 }, { label: '350ml', price: 0 }, { label: '600ml', price: 0 }, { label: '1L', price: 0 }, { label: '1.5L', price: 0 }, { label: '2L', price: 0 }, { label: '200ml Pitulinha', price: 0 }] },
      { name: 'Fanta', image: '/images/dishes/bebida-fanta.webp', variants: [{ label: 'Laranja 220ml', price: 0 }, { label: 'Laranja KS 290ml', price: 0 }, { label: 'Laranja 600ml', price: 0 }, { label: 'Uva 220ml', price: 0 }, { label: 'Uva 600ml', price: 0 }, { label: '2L', price: 0 }] },
      { name: 'Sprite', image: '/images/dishes/bebida-sprite.webp', variants: [{ label: '220ml', price: 0 }, { label: '600ml', price: 0 }, { label: '2L', price: 0 }, { label: 'KS 290ml', price: 0 }] },
      { name: 'Kuat', image: '/images/dishes/bebida-kuat.webp' },
      { name: 'Mate Cola', image: '/images/dishes/bebida-mate.webp', variants: [{ label: '200ml', price: 0 }, { label: '1.5L', price: 0 }] },
      { name: 'Suco Del Valle', image: '/images/dishes/bebida-delvalle.webp', variants: [{ label: 'Pêssego', price: 0 }, { label: 'Uva', price: 0 }, { label: 'Manga', price: 0 }, { label: 'Goiaba', price: 0 }, { label: 'Maracujá', price: 0 }] },
    ],
  },
  {
    category: 'Cervejas',
    items: [
      { name: 'Brahma', image: '/images/dishes/cerveja-brahma.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Heineken', image: '/images/dishes/cerveja-heineken.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Stella Artois', image: '/images/dishes/cerveja-stella.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Skol', image: '/images/dishes/cerveja-skol.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Skol Beats', image: '/images/dishes/cerveja-skolbeats.webp', variants: [{ label: 'Red Mix Lata 269ml', price: 0 }, { label: 'Red Mix Long Neck', price: 0 }, { label: 'GT Lata 269ml', price: 0 }, { label: 'GT Long Neck', price: 0 }] },
      { name: 'Antarctica Original', image: '/images/dishes/cerveja-antartica.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Budweiser', image: '/images/dishes/cerveja-budweiser.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
      { name: 'Corona', image: '/images/dishes/corona.webp', variants: [{ label: 'Lata 350ml', price: 0 }, { label: 'Long Neck 600ml', price: 0 }] },
    ],
  },
  {
    category: 'Doses',
    items: [
      { name: 'Red Label', desc: 'Whisky', price: 15, image: '/images/dishes/dose-redlabel.webp' },
      { name: 'Black Label', desc: 'Whisky 12 Anos', price: 25, image: '/images/dishes/dose-blacklabel.webp' },
      { name: 'Chivas Regal', desc: 'Whisky 12 Anos', price: 23, image: '/images/dishes/dose-chivas.webp' },
      { name: 'Old Parr', desc: 'Whisky 12 Anos', price: 23, image: '/images/dishes/dose-oldparr.webp' },
      { name: 'Buchanan\'s', desc: 'Whisky 12 Anos', price: 25, image: '/images/dishes/dose-buchanan.webp' },
      { name: 'Passport', desc: 'Whisky', price: 10, image: '/images/dishes/dose-passport.webp' },
      { name: 'Cavalo Branco', desc: 'Whisky', price: 15, image: '/images/dishes/dose-whitehorse.webp' },
      { name: 'Ballantine\'s', desc: 'Whisky', price: 13, image: '/images/dishes/dose-ballantines.webp' },
      { name: 'Tanqueray', desc: 'Gin', price: 20, image: '/images/dishes/dose-tanqueray.webp' },
      { name: 'Beefeater', desc: 'Gin', price: 20, image: '/images/dishes/dose-beefeater.webp' },
      { name: 'Beefeater Strawberry', desc: 'Gin', price: 20, image: '/images/dishes/dose-beefeaterstrawberry.webp' },
      { name: 'Gordon\'s', desc: 'Gin', price: 15, image: '/images/dishes/dose-gordon.webp' },
      { name: 'Gilbe\'s', desc: 'Gin', price: 13, image: '/images/dishes/dose-gilbes.webp' },
      { name: 'Bombay', desc: 'Gin', price: 20, image: '/images/dishes/dose-bombay.webp' },
      { name: 'José Cuervo', desc: 'Tequila', image: '/images/dishes/dose-jose-cuervo.webp' },
      { name: 'El Loco', desc: 'Tequila', image: '/images/dishes/dose-el-loco.webp' },
      { name: 'Licor 43', desc: 'Licor', price: 23, image: '/images/dishes/dose-licor43.webp' },
      { name: 'Campari', desc: 'Aperitivo', price: 15, image: '/images/dishes/dose-campari.webp' },
      { name: 'Bacardi', desc: 'Rum', price: 10, image: '/images/dishes/dose-bacardi.webp' },
      { name: 'Absolut', desc: 'Vodka', price: 20, image: '/images/dishes/dose-absolut.webp' },
      { name: 'Smirnoff', desc: 'Vodka', price: 15, image: '/images/dishes/dose-smirnoff.webp' },
      { name: 'Orloff', desc: 'Vodka', price: 10, image: '/images/dishes/dose-orloff.webp' },
      { name: 'Martini', desc: 'Vermute', image: '/images/dishes/dose-martini.webp' },
    ],
  },
  {
    category: 'Vinhos',
    items: [
      { name: 'Reservado Malbec', desc: 'Vinho', image: '/images/dishes/dose-reservado-malbec.webp' },
      { name: 'Metropolitano', desc: 'Vinho', image: '/images/dishes/dose-metropolitano.webp' },
      { name: 'Reservado Carmenere', desc: 'Vinho', image: '/images/dishes/dose-reservado-carmenere.webp' },
      { name: 'Reservado Merlot', desc: 'Vinho', image: '/images/dishes/dose-reservado-merlot.webp' },
      { name: 'Pérgola', desc: 'Vinho', image: '/images/dishes/dose-pergola.webp' },
    ],
  },
  {
    category: 'Drinks',
    items: [
      { name: 'Wood Smoke', desc: 'Whisky 50ml, Mel 20ml, Limão, Água com Gás, Casca de Laranja', price: 45, image: '/images/dishes/drink-woodsmoke.webp' },
      { name: 'Bitter Crush', desc: 'Campari 50ml, Suco de Laranja 100ml, Limão 20ml', price: 25, image: '/images/dishes/drink-bittercrush.webp' },
      { name: 'Sunset Spritz', desc: 'Gin 50ml, Tônica 120ml, Suco de Laranja 30ml', price: 35, image: '/images/dishes/drink-sunsetspritz.webp' },
      { name: 'Velvet 43', desc: 'Licor 43 50ml, Tônica 100ml, Morango, Hortelã', price: 35, image: '/images/dishes/drink-velvet43.webp' },
      { name: 'Sake Estilo', desc: 'Campari 60ml, Espumante Seco 90ml, Água com Gás', price: 30, image: '/images/dishes/drink-soleestivo.webp' },
      { name: 'Berry Bliss', desc: 'Gin 50ml, Tônica 100ml, Xarope de Morango 30ml, Limão', price: 35, image: '/images/dishes/drink-berrybliss.webp' },
      { name: 'Lemon Gold', desc: 'Gin 50ml, Tônica 100ml, Licor 43 25ml, Limão', price: 45, image: '/images/dishes/drink-lemongold.webp' },
      { name: 'Ruby Tonic', desc: 'Gin 50ml, Tônica 100ml, Campari 25ml, Frutas Vermelhas', price: 40, image: '/images/dishes/drink-rubytonic.webp' },
      { name: 'Gin Tônica', desc: 'Gin 50ml, Tônica 120ml, Limão', price: 35, image: '/images/dishes/drink-gintonica.webp' },
      { name: 'Moscow Mule', desc: 'Vodka 50ml, Limão 15ml, Ginger Beer 120ml, Hortelã', price: 35, image: '/images/dishes/drink-moscowmule.webp' },
      { name: 'Caipirinha', desc: 'Cachaça 50ml, Limão, Açúcar, Gelo', price: 20, image: '/images/dishes/drink-caipirinha.webp' },
      { name: 'Margarita', desc: 'Tequila 50ml, Licor de Laranja 25ml, Suco de Limão 15ml', price: 35, image: '/images/dishes/drink-margarita.webp' },
      { name: 'Mojito', desc: 'Rum Branco 50ml, Limão, Açúcar, Água com Gás, Hortelã', price: 25, image: '/images/dishes/drink-mojito.webp' },
      { name: 'Sunset Spritz Aperol', desc: 'Gin 50ml, Tônica 100ml, Aperol 30ml, Laranja', price: 35, image: '/images/dishes/drink-sunsetaperol.webp' },
      { name: 'Gin Rickey', desc: 'Gin 50ml, Limão 25ml, Água com Gás', price: 30, image: '/images/dishes/drink-ginrickey.webp' },
      { name: 'Gin e Lemon', desc: 'Gin 50ml, Soda Limonada 100ml', price: 30, image: '/images/dishes/drink-ginlemon.webp' },
      { name: 'Capi Vodka', desc: 'Vodka 50ml, Limão, Açúcar, Gelo', price: 25, image: '/images/dishes/drink-capivodka.webp' },
      { name: 'Pina Colada', desc: 'Rum 50ml, Abacaxi, Leite de Coco, Gelo', price: 25, image: '/images/dishes/drink-pinacolada.webp' },
      { name: 'Sex on the Beach', desc: 'Vodka 50ml, Licor de Pêssego, Laranja, Cranberry', price: 25, image: '/images/dishes/drink-sexonthebeach.webp' },
      { name: 'Negroni', desc: 'Gin 30ml, Campari 30ml, Vermute Rosso 30ml', price: 35, image: '/images/dishes/drink-negroni.webp' },
      { name: 'Dry Martini', desc: 'Gin, Vermute Seco', price: 10, image: '/images/dishes/dry-martini.webp' },
      { name: 'Canarinho', desc: 'Vodka, Caramelo, Maracujá, Limão', price: 25, image: '/images/dishes/drink-canarinho.webp' },
      { name: 'Cuba', desc: 'Bacardi, Coca-Cola, Gelo', price: 15, image: '/images/dishes/drink-cuba.webp' },
    ],
  },
];

function renderItems(items) {
  return items.map((item) => {
    const img = resolveImage(item.image);
    const imgTag = img
      ? `<div class="item-img-wrap"><img src="${img}" alt="${item.name}" /></div>`
      : '';

    let variantsHtml = '';
    if (item.variants && item.variants.length > 0) {
      const rows = item.variants
        .map((v) => {
          const p = v.price > 0
            ? `<span class="v-price">${fmt(v.price)}</span>`
            : '';
          return `<div class="variant-row"><span class="v-label">${v.label}</span>${p}</div>`;
        })
        .join('');
      variantsHtml = `<div class="variants">${rows}</div>`;
    } else if (item.price > 0) {
      variantsHtml = `<div class="item-price-tag">${fmt(item.price)}</div>`;
    }

    const priceTag =
      !item.variants && item.price > 0
        ? `<div class="item-price-tag">${fmt(item.price)}</div>`
        : '';

    const desc = item.desc
      ? `<div class="item-desc">${item.desc}</div>`
      : '';

    return `<div class="menu-item">
      ${imgTag}
      <div class="item-content">
        <div class="item-top">
          <span class="item-name">${item.name}</span>
          ${!item.variants && item.price > 0 ? `<span class="item-price">${fmt(item.price)}</span>` : ''}
        </div>
        ${desc}
        ${item.variants && item.variants.length > 0 ? variantsHtml : ''}
      </div>
    </div>`;
  }).join('');
}

const heroUrl = fs.existsSync(HERO_IMG) ? 'file://' + HERO_IMG.replace(/\\/g, '/') : '';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #2c1810;
    background: #faf6f1;
  }

  /* ── CAPA ── */
  .cover {
    width: 210mm;
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1a0a05 0%, #3d1a10 40%, #5c2a1a 100%);
    color: #faf6f1;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }

  .cover::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%);
    animation: none;
  }

  .cover-pattern {
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px),
      repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px);
  }

  .cover-border {
    position: absolute;
    inset: 20mm;
    border: 2px solid rgba(250, 246, 241, 0.3);
    border-radius: 4px;
  }

  .cover-border-inner {
    position: absolute;
    inset: 24mm;
    border: 1px solid rgba(250, 246, 241, 0.15);
    border-radius: 2px;
  }

  .cover-content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 40mm;
  }

  .cover-symbol {
    font-size: 48pt;
    color: #d4a574;
    margin-bottom: 15mm;
    letter-spacing: 8px;
    font-family: 'Georgia', serif;
  }

  .cover h1 {
    font-size: 42pt;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #faf6f1;
    margin-bottom: 8mm;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  }

  .cover-divider {
    width: 60mm;
    height: 1px;
    background: linear-gradient(to right, transparent, #d4a574, transparent);
    margin: 8mm auto;
  }

  .cover-subtitle {
    font-size: 14pt;
    color: #d4a574;
    letter-spacing: 8px;
    text-transform: uppercase;
    font-family: 'Arial', sans-serif;
    font-weight: 300;
  }

  .cover-footer {
    position: absolute;
    bottom: 35mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    color: rgba(250, 246, 241, 0.5);
    letter-spacing: 3px;
    font-family: 'Arial', sans-serif;
  }

  /* ── CONTEÚDO ── */
  .page {
    padding: 18mm 15mm;
    page-break-after: always;
  }

  .page-header {
    text-align: center;
    margin-bottom: 15mm;
    padding-bottom: 8mm;
    border-bottom: 2px solid #8B4513;
    position: relative;
  }

  .page-header::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 30mm;
    height: 2px;
    background: #d4a574;
  }

  .page-header h1 {
    font-size: 18pt;
    color: #3d1a10;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .page-header .tagline {
    font-size: 8pt;
    color: #8B4513;
    letter-spacing: 3px;
    margin-top: 3mm;
    font-family: 'Arial', sans-serif;
  }

  /* ── SEÇÕES ── */
  .section {
    margin-bottom: 12mm;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 6mm;
    margin-bottom: 6mm;
    padding-bottom: 3mm;
    border-bottom: 1px solid #e8ddd0;
  }

  .section-header h2 {
    font-size: 14pt;
    color: #3d1a10;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 700;
    white-space: nowrap;
  }

  .section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, #d4a574, transparent);
  }

  /* ── ITENS DO MENU ── */
  .menu-item {
    display: flex;
    gap: 4mm;
    padding: 3mm 0;
    border-bottom: 1px dashed #e8ddd0;
    align-items: flex-start;
  }

  .menu-item:last-child {
    border-bottom: none;
  }

  .item-img-wrap {
    width: 14mm;
    height: 14mm;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #d4a574;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .item-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 3mm;
  }

  .item-name {
    font-size: 10pt;
    font-weight: 700;
    color: #2c1810;
    font-family: 'Arial', sans-serif;
  }

  .item-price {
    font-size: 10pt;
    font-weight: 700;
    color: #8B4513;
    white-space: nowrap;
    font-family: 'Arial', sans-serif;
  }

  .item-desc {
    font-size: 7.5pt;
    color: #7a6a5a;
    margin-top: 1.5mm;
    line-height: 1.4;
    font-family: 'Arial', sans-serif;
    font-style: italic;
  }

  .item-price-tag {
    font-size: 10pt;
    font-weight: 700;
    color: #8B4513;
    margin-top: 1mm;
    font-family: 'Arial', sans-serif;
  }

  /* ── VARIANTS ── */
  .variants {
    margin-top: 2mm;
    display: flex;
    flex-wrap: wrap;
    gap: 2mm;
  }

  .variant-row {
    display: inline-flex;
    align-items: center;
    gap: 2mm;
    background: #f5ede4;
    padding: 1mm 3mm;
    border-radius: 3px;
    font-size: 7.5pt;
    font-family: 'Arial', sans-serif;
  }

  .v-label {
    color: #5a4a3a;
  }

  .v-price {
    color: #8B4513;
    font-weight: 700;
  }

  /* ── 2 COLUNAS ── */
  .two-col {
    display: flex;
    gap: 8mm;
  }

  .two-col .col {
    flex: 1;
  }

  /* ── RODAPÉ ── */
  .page-footer {
    position: fixed;
    bottom: 10mm;
    left: 15mm;
    right: 15mm;
    text-align: center;
    font-size: 7pt;
    color: #aaa;
    border-top: 1px solid #eee;
    padding-top: 3mm;
    font-family: 'Arial', sans-serif;
  }
</style>
</head>
<body>

  <!-- ═══ CAPA ═══ -->
  <div class="cover">
    <div class="cover-pattern"></div>
    <div class="cover-border"></div>
    <div class="cover-border-inner"></div>
    <div class="cover-content">
      <div class="cover-symbol">✦ ✦ ✦</div>
      <h1>Sabor Fino</h1>
      <div class="cover-divider"></div>
      <div class="cover-subtitle">Cardápio</div>
    </div>
    <div class="cover-footer">—  ESPETOS &amp; CHAPAS  —</div>
  </div>

  <!-- ═══ PÁGINAS DO CARDÁPIO ═══ -->
  <div class="page">
    <div class="page-header">
      <h1>Sabor Fino</h1>
      <div class="tagline">Espetos · Chapas · Porções · Bebidas</div>
    </div>

    ${menu.map((s) => {
      const itemsHtml = renderItems(s.items);
      return `
        <div class="section">
          <div class="section-header">
            <h2>${s.category}</h2>
            <div class="section-line"></div>
          </div>
          ${itemsHtml}
        </div>
      `;
    }).join('')}
  </div>

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'cardapio-para-imprimir.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await browser.close();
  console.log('PDF gerado com sucesso!');
})();
