// Düğmeden gelen serbest yazıyı ("kola zero bar") kategoriye çevirir.
// Tablodaki "Kurallar" sekmesi bu listeyi ezer; uygulamada öğrettiğin her kelime oraya yazılır.

export const HARIC = ['Alacak', 'Borç ödeme']; // harcama sayılmaz, ayrı gösterilir

export const KATEGORILER = [
  { ad: 'Yemek', renk: '#ff8a3d', ikon: '🍔' },
  { ad: 'İçecek', renk: '#3db8ff', ikon: '🥤' },
  { ad: 'Sigara', renk: '#9b9ba6', ikon: '🚬' },
  { ad: 'Market', renk: '#4cd964', ikon: '🛒' },
  { ad: 'Ulaşım', renk: '#ffd60a', ikon: '🚇' },
  { ad: 'Arkadaş', renk: '#ff4f8b', ikon: '🍻' },
  { ad: 'Eğlence', renk: '#a259ff', ikon: '🎮' },
  { ad: 'Kişisel', renk: '#5ee6c8', ikon: '🧴' },
  { ad: 'Faturalar', renk: '#6c7cff', ikon: '📱' },
  { ad: 'Sabit', renk: '#55555f', ikon: '📌' },
  { ad: 'Diğer', renk: '#3a3a42', ikon: '•' },
  { ad: 'Alacak', renk: '#8e8e93', ikon: '↗' },
  { ad: 'Borç ödeme', renk: '#8e8e93', ikon: '💳' },
];

export const GELIR_TURLERI = [
  { ad: 'Bar günlüğü', renk: '#4cd964', ikon: '🍸', varsayilan: 1500 },
  { ad: 'Bahşiş', renk: '#ffd60a', ikon: '🪙' },
  { ad: 'KYK', renk: '#3db8ff', ikon: '🎓' },
  { ad: 'Aile', renk: '#ff4f8b', ikon: '🏠' },
  { ad: 'Diğer', renk: '#8e8e93', ikon: '+' },
];

export const renkOf = (ad) =>
  (KATEGORILER.find((k) => k.ad === ad) || GELIR_TURLERI.find((k) => k.ad === ad) || { renk: '#3a3a42' }).renk;
export const ikonOf = (ad) =>
  (KATEGORILER.find((k) => k.ad === ad) || GELIR_TURLERI.find((k) => k.ad === ad) || { ikon: '•' }).ikon;

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
