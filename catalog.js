// בשן רדיאטורים וחלפים — קטלוג מוצרים B2B
// כל מוצר מקבל מק"ט ייחודי עם קידומת לפי הקטגוריה שלו

const CATEGORIES = [
  { id: 'radiators',    he: 'רדיאטורים',                    prefix: 'RAD', icon: '🌡️', product: 'רדיאטור מים',      base: [350, 950],   perCar: true },
  { id: 'turbo',        he: 'טורבו',                        prefix: 'TRB', icon: '🌀',  product: 'מגדש טורבו',       base: [1800, 4500], perCar: true },
  { id: 'compressors',  he: 'מדחסים',                       prefix: 'CMP', icon: '❄️', product: 'מדחס מזגן',        base: [900, 2200],  perCar: true },
  { id: 'fans',         he: 'מאווררים',                     prefix: 'FAN', icon: '🪭',  product: 'מאוורר קירור',     base: [250, 750],   perCar: true },
  { id: 'condensers',   he: 'מעבים',                        prefix: 'CND', icon: '🧊',  product: 'מעבה מזגן',        base: [400, 1100],  perCar: true },
  { id: 'evaporators',  he: 'מאיידים',                      prefix: 'EVP', icon: '💨',  product: 'מאייד מזגן',       base: [350, 900],   perCar: true },
  { id: 'alternators',  he: 'אלטרנטורים',                   prefix: 'ALT', icon: '⚡',  product: 'אלטרנטור',         base: [600, 1600],  perCar: true },
  { id: 'starters',     he: 'סטרטרים',                      prefix: 'STR', icon: '🔑',  product: 'סטרטר (מתנע)',     base: [500, 1400],  perCar: true },
  { id: 'heater-rads',  he: 'רדיאטור חימום',                prefix: 'RHT', icon: '🔥',  product: 'רדיאטור חימום',    base: [250, 700],   perCar: true },
  { id: 'valves',       he: 'שסתומים למדחסים ומאיידים',     prefix: 'VLV', icon: '🔩',  product: 'שסתום התפשטות',    base: [80, 260],    perCar: true },
  { id: 'gas',          he: 'בלוני גז',                     prefix: 'GAS', icon: '🛢️', product: 'בלון גז קירור',    base: [300, 1500],  perCar: false },
];

// יצרני רכב — כל סוגי הרכבים הנפוצים בישראל (פרטי, מסחרי ומשאיות)
const MAKES = [
  { code: 'TOY', he: 'טויוטה',      en: 'Toyota',     models: [
    { he: 'קורולה', years: [2007, 2025] }, { he: 'יאריס', years: [2009, 2025] }, { he: 'קאמרי', years: [2010, 2024] },
    { he: 'ראב 4', years: [2008, 2025] }, { he: 'היילקס', years: [2006, 2025] }, { he: 'לנד קרוזר', years: [2008, 2024] },
  ]},
  { code: 'HYU', he: 'יונדאי',      en: 'Hyundai',    models: [
    { he: 'i10', years: [2009, 2025] }, { he: 'i20', years: [2009, 2025] }, { he: 'אקסנט i25', years: [2011, 2023] },
    { he: 'i30', years: [2008, 2025] }, { he: 'אלנטרה i35', years: [2011, 2024] }, { he: 'טוסון', years: [2006, 2025] },
    { he: 'סנטה פה', years: [2007, 2025] }, { he: 'איוניק', years: [2016, 2025] },
  ]},
  { code: 'KIA', he: 'קיה',         en: 'Kia',        models: [
    { he: 'פיקנטו', years: [2008, 2025] }, { he: 'ריו', years: [2009, 2024] }, { he: 'סראטו', years: [2009, 2024] },
    { he: "ספורטאז'", years: [2007, 2025] }, { he: 'סורנטו', years: [2009, 2025] }, { he: 'נירו', years: [2016, 2025] },
    { he: 'סטוניק', years: [2017, 2024] },
  ]},
  { code: 'MAZ', he: 'מאזדה',       en: 'Mazda',      models: [
    { he: '2', years: [2008, 2024] }, { he: '3', years: [2006, 2025] }, { he: '6', years: [2007, 2024] },
    { he: 'CX-5', years: [2012, 2025] }, { he: 'CX-30', years: [2019, 2025] }, { he: 'BT-50', years: [2008, 2022] },
  ]},
  { code: 'SKO', he: 'סקודה',       en: 'Skoda',      models: [
    { he: 'פאביה', years: [2008, 2025] }, { he: 'אוקטביה', years: [2006, 2025] }, { he: 'סופרב', years: [2009, 2025] },
    { he: 'קודיאק', years: [2016, 2025] }, { he: 'קארוק', years: [2017, 2025] },
  ]},
  { code: 'VW',  he: 'פולקסווגן',   en: 'Volkswagen', models: [
    { he: 'פולו', years: [2006, 2025] }, { he: 'גולף', years: [2006, 2025] }, { he: 'פאסאט', years: [2006, 2024] },
    { he: 'טיגואן', years: [2008, 2025] }, { he: 'טוראן', years: [2007, 2023] }, { he: 'טרנספורטר', years: [2006, 2025] },
    { he: 'קאדי', years: [2006, 2025] },
  ]},
  { code: 'REN', he: 'רנו',         en: 'Renault',    models: [
    { he: 'קליאו', years: [2006, 2024] }, { he: 'מגאן', years: [2006, 2024] }, { he: "קפצ'ור", years: [2013, 2025] },
    { he: "קדג'אר", years: [2015, 2022] }, { he: 'מאסטר', years: [2006, 2025] }, { he: 'קנגו', years: [2006, 2025] },
  ]},
  { code: 'PEU', he: "פיג'ו",       en: 'Peugeot',    models: [
    { he: '208', years: [2012, 2025] }, { he: '2008', years: [2013, 2025] }, { he: '308', years: [2008, 2025] },
    { he: '3008', years: [2009, 2025] }, { he: '508', years: [2011, 2024] }, { he: 'פרטנר', years: [2008, 2025] },
    { he: 'בוקסר', years: [2006, 2025] },
  ]},
  { code: 'CIT', he: 'סיטרואן',     en: 'Citroen',    models: [
    { he: 'C3', years: [2009, 2025] }, { he: 'C4', years: [2006, 2024] }, { he: 'C5 איירקרוס', years: [2018, 2025] },
    { he: 'ברלינגו', years: [2008, 2025] }, { he: "ג'אמפי", years: [2007, 2024] },
  ]},
  { code: 'FOR', he: 'פורד',        en: 'Ford',       models: [
    { he: 'פיאסטה', years: [2008, 2023] }, { he: 'פוקוס', years: [2006, 2024] }, { he: 'מונדיאו', years: [2007, 2022] },
    { he: 'קוגה', years: [2008, 2025] }, { he: 'טרנזיט', years: [2006, 2025] }, { he: "ריינג'ר", years: [2007, 2025] },
  ]},
  { code: 'CHE', he: 'שברולט',      en: 'Chevrolet',  models: [
    { he: 'ספארק', years: [2010, 2022] }, { he: 'קרוז', years: [2009, 2019] }, { he: 'מאליבו', years: [2012, 2023] },
    { he: 'קפטיבה', years: [2007, 2018] }, { he: 'סילברדו', years: [2007, 2024] },
  ]},
  { code: 'NIS', he: 'ניסאן',       en: 'Nissan',     models: [
    { he: 'מיקרה', years: [2006, 2023] }, { he: 'סנטרה', years: [2013, 2024] }, { he: 'קשקאי', years: [2007, 2025] },
    { he: 'אקסטרייל', years: [2008, 2025] }, { he: "ג'וק", years: [2010, 2024] }, { he: 'נבארה', years: [2006, 2023] },
  ]},
  { code: 'HON', he: 'הונדה',       en: 'Honda',      models: [
    { he: "ג'אז", years: [2006, 2022] }, { he: 'סיוויק', years: [2006, 2025] }, { he: 'אקורד', years: [2008, 2022] },
    { he: 'CR-V', years: [2007, 2025] }, { he: 'HR-V', years: [2015, 2025] },
  ]},
  { code: 'SUZ', he: 'סוזוקי',      en: 'Suzuki',     models: [
    { he: 'אלטו', years: [2009, 2023] }, { he: 'סוויפט', years: [2006, 2025] }, { he: 'בלנו', years: [2016, 2022] },
    { he: 'ויטרה', years: [2006, 2025] }, { he: 'SX4 קרוסאובר', years: [2013, 2021] }, { he: "ג'ימני", years: [2006, 2024] },
  ]},
  { code: 'MIT', he: 'מיצובישי',    en: 'Mitsubishi', models: [
    { he: "אטראז'", years: [2013, 2023] }, { he: 'לנסר', years: [2007, 2017] }, { he: 'ASX', years: [2010, 2023] },
    { he: 'אאוטלנדר', years: [2007, 2025] }, { he: 'טרייטון L200', years: [2006, 2024] }, { he: "פג'רו", years: [2006, 2021] },
  ]},
  { code: 'SUB', he: 'סובארו',      en: 'Subaru',     models: [
    { he: 'אימפרזה', years: [2007, 2023] }, { he: 'XV', years: [2012, 2024] }, { he: 'פורסטר', years: [2008, 2025] },
    { he: 'אאוטבק', years: [2009, 2025] }, { he: 'B4', years: [2006, 2019] },
  ]},
  { code: 'BMW', he: 'ב.מ.וו',      en: 'BMW',        models: [
    { he: 'סדרה 1', years: [2006, 2024] }, { he: 'סדרה 3', years: [2006, 2025] }, { he: 'סדרה 5', years: [2006, 2025] },
    { he: 'X1', years: [2009, 2025] }, { he: 'X3', years: [2006, 2025] }, { he: 'X5', years: [2006, 2025] },
  ]},
  { code: 'MER', he: 'מרצדס',       en: 'Mercedes',   models: [
    { he: 'A-Class', years: [2012, 2025] }, { he: 'C-Class', years: [2007, 2025] }, { he: 'E-Class', years: [2009, 2025] },
    { he: 'GLC', years: [2015, 2025] }, { he: 'ספרינטר', years: [2006, 2025] }, { he: 'ויטו', years: [2006, 2025] },
  ]},
  { code: 'AUD', he: 'אאודי',       en: 'Audi',       models: [
    { he: 'A1', years: [2010, 2024] }, { he: 'A3', years: [2006, 2025] }, { he: 'A4', years: [2007, 2025] },
    { he: 'A6', years: [2008, 2025] }, { he: 'Q3', years: [2011, 2025] }, { he: 'Q5', years: [2008, 2025] },
  ]},
  { code: 'SEA', he: 'סיאט',        en: 'Seat',       models: [
    { he: 'איביזה', years: [2008, 2025] }, { he: 'לאון', years: [2006, 2025] }, { he: 'ארונה', years: [2017, 2025] },
    { he: 'אטקה', years: [2016, 2025] },
  ]},
  { code: 'OPE', he: 'אופל',        en: 'Opel',       models: [
    { he: 'קורסה', years: [2006, 2025] }, { he: 'אסטרה', years: [2006, 2024] }, { he: 'אינסיגניה', years: [2009, 2022] },
    { he: 'מוקה', years: [2012, 2025] }, { he: 'קומבו', years: [2006, 2025] },
  ]},
  { code: 'FIA', he: 'פיאט',        en: 'Fiat',       models: [
    { he: '500', years: [2007, 2024] }, { he: 'פנדה', years: [2006, 2023] }, { he: 'טיפו', years: [2016, 2024] },
    { he: 'דובלו', years: [2006, 2025] }, { he: 'דוקאטו', years: [2006, 2025] },
  ]},
  { code: 'VOL', he: 'וולוו',       en: 'Volvo',      models: [
    { he: 'S60', years: [2010, 2024] }, { he: 'XC40', years: [2018, 2025] }, { he: 'XC60', years: [2008, 2025] },
    { he: 'XC90', years: [2006, 2025] }, { he: 'FH משאית', years: [2006, 2025] },
  ]},
  { code: 'DAC', he: "דאצ'יה",      en: 'Dacia',      models: [
    { he: 'סנדרו', years: [2009, 2025] }, { he: 'דאסטר', years: [2010, 2025] }, { he: 'לוגאן', years: [2008, 2022] },
  ]},
  { code: 'ISU', he: 'איסוזו',      en: 'Isuzu',      models: [
    { he: 'די-מקס', years: [2007, 2025] }, { he: 'NPR משאית', years: [2006, 2025] }, { he: 'NQR משאית', years: [2006, 2025] },
  ]},
  { code: 'MG',  he: 'MG',          en: 'MG',         models: [
    { he: 'ZS', years: [2018, 2025] }, { he: 'HS', years: [2019, 2025] }, { he: 'MG3', years: [2018, 2025] },
  ]},
  { code: 'BYD', he: 'BYD',         en: 'BYD',        models: [
    { he: 'אטו 3', years: [2022, 2025] }, { he: 'סיל', years: [2023, 2025] }, { he: 'דולפין', years: [2023, 2025] },
  ]},
  { code: 'CHR', he: "צ'רי",        en: 'Chery',      models: [
    { he: 'טיגו 7', years: [2021, 2025] }, { he: 'טיגו 8', years: [2021, 2025] },
  ]},
  { code: 'MAN', he: 'מאן',         en: 'MAN',        models: [
    { he: 'TGX משאית', years: [2007, 2025] }, { he: 'TGM משאית', years: [2006, 2025] },
  ]},
  { code: 'SCA', he: 'סקאניה',      en: 'Scania',     models: [
    { he: 'R-Series משאית', years: [2006, 2025] }, { he: 'P-Series משאית', years: [2006, 2025] },
  ]},
  { code: 'IVE', he: 'איווקו',      en: 'Iveco',      models: [
    { he: 'דיילי', years: [2006, 2025] }, { he: 'סטרליס משאית', years: [2007, 2020] },
  ]},
];

// בלוני גז — מוצרים כלליים (לא לפי רכב)
const GAS_PRODUCTS = [
  { name: 'בלון גז קירור R134a — 13.6 ק"ג', desc: 'גז קירור למערכות מיזוג רכב, בלון 13.6 ק"ג' },
  { name: 'בלון גז קירור R134a — 5 ק"ג',    desc: 'גז קירור למערכות מיזוג רכב, בלון קטן 5 ק"ג' },
  { name: 'בלון גז קירור R1234yf — 5 ק"ג',  desc: 'גז קירור לרכבים חדשים (2017+), בלון 5 ק"ג' },
  { name: 'בלון גז קירור R404A — 10.9 ק"ג', desc: 'גז קירור למערכות קירור הובלה ומשאיות קירור' },
  { name: 'בלון גז קירור R410A — 11.3 ק"ג', desc: 'גז קירור למערכות מיזוג ותעשייה' },
  { name: 'בלון גז קירור R407C — 11.3 ק"ג', desc: 'גז קירור חלופי למערכות מיזוג' },
  { name: 'בלון גז קירור R32 — 9 ק"ג',      desc: 'גז קירור ידידותי לסביבה למערכות חדישות' },
];

// hash דטרמיניסטי — כדי שמחיר/מלאי יהיו קבועים לכל מק"ט בין הפעלות
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function priceFor(sku, [min, max]) {
  const p = min + (hash(sku) % (max - min));
  return Math.round(p / 10) * 10;
}

function stockFor(sku) {
  const s = hash('stock:' + sku) % 50;
  return s < 5 ? 0 : s; // חלק מהפריטים בהזמנה מיוחדת
}

function oemFor(sku) {
  const h = hash('oem:' + sku);
  return `${String(h % 90000 + 10000)}-${String(((h >>> 8) % 9000) + 1000)}`;
}

// פיצול טווח שנים לדורות של עד 8 שנים
function generations([from, to]) {
  const gens = [];
  let start = from;
  while (start <= to) {
    const end = Math.min(start + 7, to);
    gens.push([start, end]);
    start = end + 1;
  }
  return gens;
}

function buildProducts() {
  const products = [];
  const counters = {};
  const next = (prefix) => {
    counters[prefix] = (counters[prefix] || 1000) + 1;
    return counters[prefix];
  };

  for (const cat of CATEGORIES) {
    if (!cat.perCar) continue;
    for (const make of MAKES) {
      for (const model of make.models) {
        for (const [y1, y2] of generations(model.years)) {
          const sku = `${cat.prefix}-${make.code}-${next(cat.prefix)}`;
          products.push({
            sku,
            category: cat.id,
            categoryHe: cat.he,
            name: `${cat.product} — ${make.he} ${model.he} ${y1}-${y2}`,
            make: make.code,
            makeHe: make.he,
            model: model.he,
            years: [y1, y2],
            oem: oemFor(sku),
            price: priceFor(sku, cat.base),
            stock: stockFor(sku),
          });
        }
      }
    }
  }

  const gasCat = CATEGORIES.find((c) => c.id === 'gas');
  for (const g of GAS_PRODUCTS) {
    const sku = `${gasCat.prefix}-${String((counters[gasCat.prefix] = (counters[gasCat.prefix] || 1000) + 1))}`;
    products.push({
      sku,
      category: gasCat.id,
      categoryHe: gasCat.he,
      name: g.name,
      desc: g.desc,
      make: null,
      makeHe: null,
      model: null,
      years: null,
      oem: null,
      price: priceFor(sku, gasCat.base),
      stock: stockFor(sku),
    });
  }

  return products;
}

module.exports = { CATEGORIES, MAKES, buildProducts };
