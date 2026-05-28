export const IMAGES = {
  hero: '/images/fino-sabor-hero-background.png',
  reference: '/images/fino-sabor-reference.png',
  bannerEntradas: '/images/fino-sabor-category-background.png',
  bannerEspetos400: '/images/fino-sabor-category-background.png',
  bannerChapas: '/images/fino-sabor-category-background.png',
  bannerGramatura: '/images/fino-sabor-category-background.png',
  bannerEspetos: '/images/fino-sabor-category-background.png',
  bannerPaes: '/images/fino-sabor-category-background.png',
  bannerIndividuais: '/images/fino-sabor-category-background.png',
  bannerPorcoes: '/images/fino-sabor-category-background.png',
  bannerGuarnicoes: '/images/fino-sabor-category-background.png',
  dishHero: '/images/fino-sabor-hero-background.png',
  dishBanner: '/images/fino-sabor-category-background.png',
  dishChapa1: '/images/fino-sabor-dish-chapa-1.png',
  dishChapa2: '/images/fino-sabor-dish-chapa-2.png',
  dishChapa3: '/images/fino-sabor-dish-chapa-3.png',
  dishChapa4: '/images/fino-sabor-dish-chapa-4.png',
};

const dishImages = [
  IMAGES.dishChapa1,
  IMAGES.dishChapa2,
  IMAGES.dishChapa3,
  IMAGES.dishChapa4,
];

const itemImage = (sectionIndex, itemIndex) =>
  dishImages[(sectionIndex + itemIndex) % dishImages.length];

const sections = [
  {
    category: 'Chapas',
    image: IMAGES.bannerChapas,
    items: [
      { id: 16, name: 'Chapa Mista do Fino Sabor (Opção 1)', desc: '400g de picanha, 200g de batata frita c/ queijo e bacon e 200g de mandioca cozida na manteiga de garrafa', price: 89.9, image: IMAGES.dishChapa1 },
      { id: 17, name: 'Chapa Mista do Fino Sabor (Opção 2)', desc: '600g de picanha, 200g de batata frita c/ queijo e bacon e 200g de mandioca cozida na manteiga de garrafa', price: 119.9, image: IMAGES.dishChapa2 },
      { id: 18, name: 'Chapa Mista do Fino Sabor (Opção 3)', desc: '800g de picanha, 300g de batata frita c/ queijo e bacon e 300g de mandioca cozida na manteiga de garrafa', price: 149.9, image: IMAGES.dishChapa3 },
      { id: 19, name: 'Chapa Mista do Fino Sabor (Opção 4)', desc: '1kg de picanha, 300g de batata frita c/ queijo e bacon e 300g de mandioca cozida na manteiga de garrafa', price: 179.9, image: IMAGES.dishChapa4 },
    ],
  },
  {
    category: 'Churrasco na Gramatura',
    image: IMAGES.bannerGramatura,
    items: [
      { id: 20, name: 'Picanha Importada', desc: 'Pedido mínimo de 400g', price: 0 },
      { id: 21, name: 'Fraldinha', desc: 'Pedido mínimo de 400g', price: 0 },
      { id: 22, name: 'Picanha Suína', desc: 'Pedido mínimo de 400g', price: 0 },
      { id: 23, name: 'Frango c/ Catupiry', desc: 'Pedido mínimo de 400g', price: 0 },
      { id: 24, name: 'Contra Filé', desc: 'Pedido mínimo de 400g', price: 0 },
    ],
  },
  {
    category: 'Pratos Individuais',
    image: IMAGES.bannerIndividuais,
    items: [
      { id: 40, name: 'Picanha', desc: 'Arroz, feijão ou tropeiro, batata frita, ovo frito e salada - fins de semana e feriados', price: 0 },
      { id: 41, name: 'Contra Filé', desc: 'Arroz, feijão ou tropeiro, batata frita, ovo frito e salada - fins de semana e feriados', price: 0 },
      { id: 42, name: 'Prato Executivo', desc: 'Arroz, feijão, batata frita e salada - fins de semana e feriados', price: 0 },
      { id: 43, name: 'Bife de Boi ou Isca de Tilápia', desc: 'Arroz, feijão, fritas ou macarrão e salada - fins de semana e feriados', price: 0 },
    ],
  },
  {
    category: 'Porções',
    image: IMAGES.bannerPorcoes,
    items: [
      { id: 44, name: 'Contra Filé 400g', desc: 'Com fritas ou mandioca 400g', price: 0 },
      { id: 45, name: 'Linguiça 200g', desc: 'Com fritas ou mandioca 200g', price: 0 },
      { id: 46, name: 'Lombo 200g', desc: 'Com fritas ou mandioca 200g', price: 0 },
      { id: 47, name: 'Isca de Tilápia 400g', desc: 'Com fritas 400g', price: 0 },
      { id: 48, name: 'Torresmo de Barriga 400g', desc: 'Com fritas 400g', price: 0 },
      { id: 49, name: 'Isca de Tilápia 400g', price: 0 },
      { id: 50, name: 'Fritas 400g', price: 0 },
      { id: 51, name: 'Fritas com Queijo 400g', price: 0 },
      { id: 52, name: 'Fritas com Bacon 400g', price: 0 },
      { id: 53, name: 'Fritas com Queijo e Bacon 400g', price: 0 },
      { id: 54, name: 'Mandioca na Manteiga de Garrafa 400g', desc: 'Cozida ou frita', price: 0 },
    ],
  },
  {
    category: 'Guarnições',
    image: IMAGES.bannerGuarnicoes,
    items: [
      { id: 55, name: 'Arroz com Alho Torrado', desc: 'Opções para 01 pessoa ou 02 pessoas', price: 0 },
      { id: 56, name: 'Arroz Branco', desc: 'Opções para 01 pessoa ou 02 pessoas', price: 0 },
      { id: 57, name: 'Tropeiro', desc: 'Opções pequeno ou grande', price: 0 },
      { id: 58, name: 'Vinagrete', price: 0 },
      { id: 59, name: 'Farofa', price: 0 },
    ],
  },
  {
    category: 'Entradas',
    image: IMAGES.bannerEntradas,
    items: [
      { id: 1, name: 'Bolinho de Bacalhau (10 unid.)', price: 0 },
      { id: 2, name: 'Bolinho de Linguiça com Queijo (10 unid.)', price: 0 },
      { id: 3, name: 'Kibe com Alho Poró (10 unid.)', price: 0 },
      { id: 4, name: 'Torresmo (300g)', price: 0 },
    ],
  },
  {
    category: 'Espetos 400g',
    image: IMAGES.bannerEspetos400,
    items: [
      { id: 5, name: 'Picanha Completa', desc: 'Arroz ao alho, farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 6, name: 'Picanha', desc: 'Vinagrete, farofa, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga', price: 0 },
      { id: 7, name: 'Contra Filé Completo', desc: 'Arroz ao alho, farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 8, name: 'Contra Filé', desc: 'Farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 9, name: 'Fraldinha Completa', desc: 'Arroz ao alho, farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 10, name: 'Fraldinha', desc: 'Farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 11, name: 'Picanha Família 600g', desc: 'Arroz ao alho, batata frita, tropeiro, vinagrete, farofa e cebola assada', price: 0 },
      { id: 12, name: 'Frango c/ Catupiry Completa', desc: 'Arroz ao alho, farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 13, name: 'Frango c/ Catupiry', desc: 'Farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 14, name: 'Picanha Suína Completa', desc: 'Arroz ao alho, farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
      { id: 15, name: 'Picanha Suína', desc: 'Farofa, vinagrete, cebola assada e fritas c/ bacon e queijo ou mandioca cozida na manteiga de garrafa', price: 0 },
    ],
  },
  {
    category: 'Espetos',
    image: IMAGES.bannerEspetos,
    items: [
      { id: 25, name: 'Boi', price: 0 },
      { id: 26, name: 'Porco', price: 0 },
      { id: 27, name: 'Almôndega', price: 0 },
      { id: 28, name: 'Linguiça', price: 0 },
      { id: 29, name: 'Coração', price: 0 },
      { id: 30, name: 'Medalhão de Frango', price: 0 },
      { id: 31, name: 'Medalhão de Muçarela', price: 0 },
      { id: 32, name: 'Meio da Asa', price: 0 },
      { id: 33, name: 'Picanha Bovina', price: 0 },
      { id: 34, name: 'Kafta', price: 0 },
    ],
  },
  {
    category: 'Pães de Alho',
    image: IMAGES.bannerPaes,
    items: [
      { id: 35, name: 'Pão de Alho Tradicional c/ Provolone', price: 0 },
      { id: 36, name: 'Pão de Alho Poró c/ Provolone', price: 0 },
      { id: 37, name: 'Pão de Frango c/ Requeijão', price: 0 },
      { id: 38, name: 'Pão Quatro Queijos', price: 0 },
      { id: 39, name: 'Pão Quatro Queijos c/ Mel', price: 0 },
    ],
  },
];

const CARDAPIO = sections.map((section, sectionIndex) => ({
  ...section,
  items: section.items.map((item, itemIndex) => ({
    ...item,
    image: item.image || itemImage(sectionIndex, itemIndex),
  })),
}));

export default CARDAPIO;

export const CATEGORIES = ['Todas', ...CARDAPIO.map(s => s.category)];

export const PRODUCTS = CARDAPIO.flatMap(section =>
  section.items.map(item => ({
    id: item.id,
    name: item.name,
    desc: item.desc || '',
    price: item.price,
    category: section.category,
    image: item.image,
  }))
);
