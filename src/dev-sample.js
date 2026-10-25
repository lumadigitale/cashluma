// YALNIZ geliştirme önizlemesi (npm run dev, anahtar girilmemişken): bellekte boş bir sahte tablo.
// Örnek veri yok; sayfa yenilenince sıfırlanır. Yayın derlemesine girmez.

export function demoApi() {
  let row = 2;
  const data = { form: [], kayitlar: [], sabitler: [], borc: [], kurallar: [], ayarlar: {} };

  return async (action, p) => {
    await new Promise((r) => setTimeout(r, 150));
    if (action === 'add') {
      const x = { id: `kayit:${row++}`, tarih: p.tarih, tur: p.tur, metin: p.metin || '', tutar: Number(p.tutar), kategori: p.kategori || '', nakit: p.nakit === true };
      data.kayitlar.push(x);
    }
    // Eylem Düğmesi'ni taklit eder: forma (yazı, tutar) düşer
    if (action === 'form') data.form.push({ id: `form:${row++}`, tarih: p.tarih || new Date().toISOString(), metin: p.metin, tutar: Number(p.tutar) });
    if (action === 'delete') {
      data.form = data.form.filter((x) => x.id !== p.id);
      data.kayitlar = data.kayitlar.filter((x) => x.id !== p.id);
      data.borc = data.borc.filter((x) => x.id !== p.id);
    }
    if (action === 'rule') data.kurallar = data.kurallar.filter((r) => r.kelime !== p.kelime).concat({ kelime: p.kelime, kategori: p.kategori });
    if (action === 'setting') data.ayarlar[p.anahtar] = p.deger;
    if (action === 'sabit_ekle')
      data.sabitler = data.sabitler.filter((s) => s.ad !== p.ad).concat({ ad: p.ad, tur: p.tur, tutar: p.tutar, gun: p.gun, aktif: true, birim: p.birim || 'TL' });
    if (action === 'sabit_sil') data.sabitler = data.sabitler.filter((s) => s.ad !== p.ad);
    if (action === 'borc_ekle') data.borc.push({ id: `borc:${row++}`, tarih: new Date().toISOString(), bakiye: Number(p.bakiye), odenen: Number(p.odenen) || 0 });
    return structuredClone({ ...data, okundu: new Date().toISOString() });
  };
}
