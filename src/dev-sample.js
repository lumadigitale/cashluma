// YALNIZ geliştirme önizlemesi için örnek veri (npm run dev, anahtar girilmemişken).
// Yayın derlemesine girmez; gerçek veri Google Sheets'ten gelir.

const gunOnce = (n, saat = 21) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(saat, 15, 0, 0);
  return d.toISOString();
};

export function demoApi() {
  let row = 2;
  const g = (n, saat, metin, tutar) => ({ id: 'gider:' + row++, tarih: gunOnce(n, saat), metin, tutar });
  const data = {
    giderler: [
      g(0, 13, 'kahve', 120),
      g(0, 2, 'sigara', 130),
      g(1, 23, 'kola zero bar', 90),
      g(1, 19, 'döner', 260),
      g(1, 15, 'metro', 35),
      g(2, 3, 'taksi eve', 420),
      g(2, 1, "Ahmet'e borç verdim", 500),
      g(2, 20, 'ismarladim arkadaşlara', 640),
      g(2, 14, 'migros', 385),
      g(3, 22, 'sigara', 130),
      g(3, 17, 'kart borcu', 2000),
      g(3, 12, 'çorba', 150),
      g(32, 20, 'pizza', 340),
      g(40, 20, 'sigara', 130),
      g(45, 13, 'kıyafet', 900),
    ],
    gelirler: [
      { id: 'gelir:2', tarih: gunOnce(0, 4), metin: '', tutar: 1500, kategori: 'Bar günlüğü' },
      { id: 'gelir:3', tarih: gunOnce(1, 4), metin: '', tutar: 1500, kategori: 'Bar günlüğü' },
      { id: 'gelir:4', tarih: gunOnce(1, 4), metin: 'masa 4', tutar: 300, kategori: 'Bahşiş' },
      { id: 'gelir:5', tarih: gunOnce(33, 4), metin: '', tutar: 1500, kategori: 'Bar günlüğü' },
    ],
    sabitler: [
      { ad: 'Yurt', tur: 'gider', tutar: 2000, gun: 1, aktif: true },
      { ad: 'Telefon', tur: 'gider', tutar: 1500, gun: 1, aktif: true },
      { ad: 'Claude Pro', tur: 'gider', tutar: 1000, gun: 1, aktif: true },
      { ad: 'Gemini', tur: 'gider', tutar: 200, gun: 1, aktif: true },
      { ad: 'Spotify', tur: 'gider', tutar: 55, gun: 1, aktif: true },
      { ad: 'KYK', tur: 'gelir', tutar: 4000, gun: 6, aktif: true },
      { ad: 'Aile', tur: 'gelir', tutar: 10000, gun: 20, aktif: true },
    ],
    kurallar: [],
    ayarlar: { baslangic_ay: '2026-09', borc_baslangic: 10000, birikim_hedefi: 15000, hedef_tarih: '2026-12-01' },
  };

  return async (action, p) => {
    await new Promise((r) => setTimeout(r, 250));
    if (action === 'add') {
      const list = p.tur === 'gider' ? data.giderler : data.gelirler;
      list.push({ id: `${p.tur}:${row++}`, tarih: p.tarih, metin: p.metin || '', tutar: Number(p.tutar), kategori: p.kategori });
    }
    if (action === 'delete') {
      data.giderler = data.giderler.filter((x) => x.id !== p.id);
      data.gelirler = data.gelirler.filter((x) => x.id !== p.id);
    }
    if (action === 'rule') {
      data.kurallar = data.kurallar.filter((r) => r.kelime !== p.kelime).concat({ kelime: p.kelime, kategori: p.kategori });
    }
    if (action === 'setting') data.ayarlar[p.anahtar] = p.deger;
    if (action === 'sabit_ekle') data.sabitler = data.sabitler.filter((s) => s.ad !== p.ad).concat({ ad: p.ad, tur: p.tur, tutar: p.tutar, gun: p.gun, aktif: true });
    if (action === 'sabit_sil') data.sabitler = data.sabitler.filter((s) => s.ad !== p.ad);
    return structuredClone({ ...data, okundu: new Date().toISOString() });
  };
}
