// Düğmeden gelen serbest yazıyı ("kola zero bar") kategoriye çevirir.
// Tablodaki "Kurallar" sekmesi bu listeyi ezer; uygulamada öğrettiğin her kelime oraya yazılır.

export const HARIC = ['Alacak', 'Borç ödeme']; // harcama sayılmaz, ayrı gösterilir

export const KATEGORILER = [
  { ad: 'Yemek', renk: '#ef5350', ikon: 'food' },
  { ad: 'İçecek', renk: '#2f80ed', ikon: 'drink' },
  { ad: 'Sigara', renk: '#8e8e93', ikon: 'smoke' },
  { ad: 'Market', renk: '#f2c200', ikon: 'cart' },
  { ad: 'Ulaşım', renk: '#26c6a6', ikon: 'bus' },
  { ad: 'Arkadaş', renk: '#7b3ff2', ikon: 'users' },
  { ad: 'Eğlence', renk: '#ff7a45', ikon: 'ticket' },
  { ad: 'Kişisel', renk: '#e573c7', ikon: 'user' },
  { ad: 'Faturalar', renk: '#5b6cff', ikon: 'receipt' },
  { ad: 'Sabit', renk: '#48484a', ikon: 'pin' },
  { ad: 'Diğer', renk: '#3a3a3c', ikon: 'dots' },
  { ad: 'Alacak', renk: '#636366', ikon: 'arrowUpR' },
  { ad: 'Borç ödeme', renk: '#636366', ikon: 'card' },
];

export const GELIR_TURLERI = [
  { ad: 'Bar günlüğü', renk: '#7b3ff2', ikon: 'glass', varsayilan: 1500 },
  { ad: 'Bahşiş', renk: '#f2c200', ikon: 'coins' },
  { ad: 'KYK', renk: '#2f80ed', ikon: 'cap' },
  { ad: 'Aile', renk: '#ef5350', ikon: 'home' },
  { ad: 'Diğer', renk: '#8e8e93', ikon: 'plus' },
];

export const renkOf = (ad) =>
  (KATEGORILER.find((k) => k.ad === ad) || GELIR_TURLERI.find((k) => k.ad === ad) || { renk: '#3a3a3c' }).renk;
export const ikonOf = (ad) =>
  (KATEGORILER.find((k) => k.ad === ad) || GELIR_TURLERI.find((k) => k.ad === ad) || { ikon: 'dots' }).ikon;

// Önce cümleler (borç), sonra kelimeler. Kelime, yazıdaki bir kelimenin başıyla eşleşir: "kolaya" → kola.
const CUMLELER = [
  ['borç verdim', 'Alacak'],
  ['borc verdim', 'Alacak'],
  ['borcumu', 'Borç ödeme'],
  ['kart borcu', 'Borç ödeme'],
  ['borç ödedim', 'Borç ödeme'],
  ['meyve suyu', 'İçecek'],
];

const KELIMELER = {
  Sigara: ['sigara', 'marlboro', 'parliament', 'camel', 'winston', 'tütün', 'tutun', 'muratti', 'lm'],
  İçecek: ['kola', 'coca', 'pepsi', 'su', 'kahve', 'çay', 'cay', 'bira', 'ayran', 'redbull', 'enerji', 'soda', 'gazoz', 'starbucks', 'latte'],
  Yemek: ['yemek', 'döner', 'doner', 'dürüm', 'durum', 'tost', 'burger', 'hamburger', 'pizza', 'simit', 'kahvaltı', 'lahmacun', 'pide', 'köfte', 'tavuk', 'makarna', 'yemeksepeti', 'kumpir', 'börek', 'poğaça', 'sandviç', 'çiğköfte', 'mantı', 'pilav'],
  Market: ['market', 'migros', 'bim', 'a101', 'şok', 'carrefour', 'getir', 'bakkal'],
  Ulaşım: ['taksi', 'uber', 'metro', 'otobüs', 'otobus', 'istanbulkart', 'marmaray', 'vapur', 'bitaksi', 'dolmuş', 'minibüs', 'metrobüs', 'scooter', 'martı'],
  Arkadaş: ['ısmarladım', 'ismarladim', 'ikram', 'hediye', 'doğumgünü'],
  Eğlence: ['sinema', 'oyun', 'konser', 'steam', 'netflix', 'bilet', 'maç'],
  Kişisel: ['berber', 'kuaför', 'kıyafet', 'tişört', 'ayakkabı', 'ilaç', 'eczane', 'şampuan', 'deodorant'],
  Faturalar: ['fatura', 'telefon', 'internet', 'abonelik', 'claude', 'gemini', 'spotify', 'turkcell', 'vodafone'],
};

const lower = (s) => String(s || '').toLocaleLowerCase('tr');
export const etiketOf = (ad) => lower(ad).replace(/\s+/g, '_');

export function kategorize(metin, kurallar = []) {
  const t = lower(metin);
  if (!t) return 'Diğer';
  // Tek seferlik etiket: "döner #arkadaş" → bu kayıt Arkadaş, kural değişmez
  const etiket = t.match(/#([^\s#]+)/);
  if (etiket) {
    const k = KATEGORILER.find((x) => etiketOf(x.ad) === etiket[1]);
    if (k) return k.ad;
  }
  // Kullanıcı kuralları önce, en uzun kelime kazanır ("kola zero" > "kola")
  const user = [...kurallar].sort((a, b) => b.kelime.length - a.kelime.length);
  for (const r of user) if (r.kelime && t.includes(lower(r.kelime))) return r.kategori;
  for (const [c, k] of CUMLELER) if (t.includes(c)) return k;
  const adla = KATEGORILER.find((k) => lower(k.ad) === t.trim());
  if (adla) return adla.ad; // uygulamadan yalnız kategori seçilerek girilen kayıt
  const words = t.split(/[^a-zçğıöşü0-9]+/i).filter(Boolean);
  for (const [kat, list] of Object.entries(KELIMELER)) {
    if (list.some((kw) => words.some((w) => (kw.length <= 2 ? w === kw : w.startsWith(kw))))) return kat;
  }
  return 'Diğer';
}

// Öğretmek için en anlamlı kelime: ilk kelime (genelde "ne aldın"ın cevabı)
export function anahtarKelime(metin) {
  const words = lower(metin).split(/[^a-zçğıöşü0-9]+/i).filter((w) => w.length > 1);
  return words[0] || lower(metin).trim();
}
