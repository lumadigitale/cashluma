import { kategorize, komut, HARIC, isAdi, isKategorisi } from './categorize.js';

const pad = (n) => String(n).padStart(2, '0');
const topla = (list) => list.reduce((s, x) => s + (Number(x.tutar) || 0), 0);

// Gece vardiyası (17:00-03:00): 05:00'ten önceki işlem önceki güne yazılır.
export function etkinTarih(d) {
  const x = new Date(d);
  if (x.getHours() < 5) x.setDate(x.getDate() - 1);
  return x;
}
export const gunKey = (d) => {
  const x = etkinTarih(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const ayKey = (d) => gunKey(d).slice(0, 7);

export function ayEkle(ay, n) {
  const [y, m] = ay.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
const ayinGunu = (ay) => {
  const [y, m] = ay.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

// Yazıdan tür çıkar: "nakit çektim", "bahşiş", "kumbara", "cüzdan", "döner nakit" ...
function yazidan(x, kurallar, ayarlar) {
  const k = komut(x.metin, ayarlar);
  if (k.tur === 'gider') return { ...x, tur: 'gider', nakit: x.nakit || k.nakit, kategori: kategorize(x.metin || x.kategori, kurallar), hamTutar: x.tutar };
  return { ...x, tur: k.tur, tutar: Math.abs(x.tutar) * k.isaret, nakit: !!k.nakit, kategori: k.kategori || '', hamTutar: x.tutar };
}

// Eski form satırları + Kayıtlar sekmesi → tek liste. tur: gider · gelir · nakit_cek · kumbara · sayim
// Eylem Düğmesi doğrudan Apps Script'e "gider" olarak yazar; bu yüzden Kayıtlar'daki giderler de yazıdan okunur.
export function islemler(raw) {
  const ay = raw.ayarlar || {};
  const f = raw.form.map((x) => ({ ...yazidan(x, raw.kurallar, ay), kaynak: 'form' }));
  const a = raw.kayitlar.map((x) => (x.tur === 'gider' ? yazidan(x, raw.kurallar, ay) : x));
  // İş geliri işaretlenir ve Ayarlar'daki adla gösterilir
  const tx = [...f, ...a]
    .map((x) => (x.tur === 'gelir' && isKategorisi(x.kategori, ay) ? { ...x, kategori: isAdi(ay), is: true } : x))
    .filter((x) => x.tarih && !isNaN(new Date(x.tarih)))
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  // Sayım satırında ne kadar eksik çıktığı görünsün
  const kayip = new Map(cuzdan(tx).kayiplar.map((k) => [k.id, k.tutar]));
  return tx.map((x) => (x.tur === 'sayim' && kayip.has('kayip:' + x.id) ? { ...x, kayip: kayip.get('kayip:' + x.id) } : x));
}

// Cüzdan: nakit çekim ve nakit gelir (bahşiş) girer, nakit gider çıkar. Sayımda beklenen ile sayılan
// arasındaki fark "Kayıp nakit" olur ve o günün harcamasına yazılır. Sayım sonrası bakiye = sayılan.
export function cuzdan(tx) {
  const sirali = [...tx].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
  let bakiye = 0;
  let sayildi = false;
  const kayiplar = [];
  for (const x of sirali) {
    if (x.tur === 'nakit_cek' || (x.tur === 'gelir' && x.nakit)) bakiye += x.tutar;
    else if (x.tur === 'gider' && x.nakit) bakiye -= x.tutar;
    else if (x.tur === 'sayim') {
      const fark = Math.round((bakiye - x.tutar) * 100) / 100;
      if (fark > 0)
        kayiplar.push({ id: 'kayip:' + x.id, tarih: x.tarih, tur: 'gider', metin: 'Kayıp nakit', kategori: 'Kayıp nakit', tutar: fark, turetilmis: true });
      bakiye = x.tutar;
      sayildi = true;
    }
  }
  return { bakiye, sayildi, kayiplar };
}

// Harcama listesi: düz giderler + cüzdan sayımından çıkan kayıp nakit. Alacak ve borç ödemesi hariç.
export function harcamalar(tx) {
  const { kayiplar } = cuzdan(tx);
  return [...tx.filter((x) => x.tur === 'gider' && !HARIC.includes(x.kategori)), ...kayiplar];
}

export function kumbara(raw, tx) {
  return {
    toplam: topla(tx.filter((x) => x.tur === 'kumbara')),
    hedef: Number(raw.ayarlar.kumbara_hedefi) || 0,
    tarih: raw.ayarlar.kumbara_tarih ? String(raw.ayarlar.kumbara_tarih).slice(0, 10) : '',
  };
}

// Kart borcu haftalık elle girilir; harcamalarla hiç karışmaz.
export function borcDurumu(raw) {
  const liste = [...(raw.borc || [])].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  return { son: liste[0] || null, liste, odenenToplam: topla(liste.map((b) => ({ tutar: b.odenen }))) };
}

// Sabitin TL karşılığı. Dolar sabitler kurla çevrilir; kur yoksa tutar bilinmiyor (null).
export function sabitTL(s, kur) {
  if (s.birim !== 'USD') return s.tutar;
  return kur ? s.tutar * kur : null;
}

// Takip başlangıcı: ayarda yazıyorsa o, yoksa ilk kaydın ayı, o da yoksa bu ay.
export function baslangicAy(raw, bugun = new Date()) {
  if (raw.ayarlar.baslangic_ay) return String(raw.ayarlar.baslangic_ay).slice(0, 7);
  const ilk = [...raw.form, ...raw.kayitlar].map((x) => x.tarih).filter(Boolean).sort()[0];
  return ilk ? ayKey(ilk) : ayKey(bugun);
}

// Sabit gelir/giderler her ay kendiliğinden sayılır. Bu ay için günü gelmişse gerçekleşti,
// gelmemişse "bu ay gelecekler"de bekler. 31'i olmayan ayda ayın son günü sayılır.
export function sabitKalemleri(raw, ay, bugun = new Date(), kur = null) {
  const bas = baslangicAy(raw, bugun);
  const buAy = ayKey(bugun);
  if (ay < bas || ay > buAy) return [];
  const gun = etkinTarih(bugun).getDate();
  const son = ayinGunu(ay);
  return raw.sabitler
    .filter((s) => s.aktif)
    .map((s) => {
      const g = Math.min(s.gun, son);
      return { ...s, gun: g, tl: sabitTL(s, kur), gerceklesti: ay < buAy || g <= gun };
    });
}

export function ayOzeti(raw, tx, ay, bugun = new Date(), kur = null) {
  const ayH = harcamalar(tx).filter((x) => ayKey(x.tarih) === ay);
  const gelirTx = tx.filter((x) => x.tur === 'gelir' && ayKey(x.tarih) === ay);
  const sabit = sabitKalemleri(raw, ay, bugun, kur);
  const olan = sabit.filter((s) => s.gerceklesti);
  const sabitGider = topla(olan.filter((s) => s.tur === 'gider').map((s) => ({ tutar: s.tl })));
  const sabitGelir = topla(olan.filter((s) => s.tur === 'gelir').map((s) => ({ tutar: s.tl })));
  const bekleyen = sabit.filter((s) => !s.gerceklesti).sort((a, b) => a.gun - b.gun);

  const degiskenGider = topla(ayH);
  const gelir = topla(gelirTx) + sabitGelir;
  const gider = degiskenGider + sabitGider;

  const kat = {};
  ayH.forEach((x) => (kat[x.kategori] = (kat[x.kategori] || 0) + x.tutar));
  if (sabitGider) kat.Sabit = sabitGider;
  const kategoriler = Object.entries(kat)
    .map(([ad, tutar]) => ({ ad, tutar }))
    .sort((a, b) => b.tutar - a.tutar);

  const gt = {};
  gelirTx.forEach((x) => (gt[x.kategori] = (gt[x.kategori] || 0) + x.tutar));
  olan.filter((s) => s.tur === 'gelir').forEach((s) => (gt[s.ad] = (gt[s.ad] || 0) + s.tl));
  const gelirTurleri = Object.entries(gt)
    .map(([ad, tutar]) => ({ ad, tutar }))
    .sort((a, b) => b.tutar - a.tutar);

  return {
    ay,
    gelir,
    gider,
    net: gelir - gider,
    degiskenGider,
    sabitGider,
    sabitGelir,
    bekleyen,
    kurEksik: sabit.some((s) => s.tl === null),
    kategoriler,
    gelirTurleri,
    haric: tx.filter((x) => ayKey(x.tarih) === ay && x.tur === 'gider' && HARIC.includes(x.kategori)),
  };
}

// Günlük harcama (sabitler hariç: onlar ayın tek bir gününe yığılıp günü bozmasın)
export function gunToplami(tx, gun) {
  return topla(harcamalar(tx).filter((x) => gunKey(x.tarih) === gun));
}

// O gün iş geliri kaydı varsa iş günü
export function isGunleri(tx) {
  return new Set(tx.filter((x) => x.is).map((x) => gunKey(x.tarih)));
}

export function gunlukSeri(tx, ay) {
  const h = harcamalar(tx);
  const is = isGunleri(tx);
  return Array.from({ length: ayinGunu(ay) }, (_, i) => {
    const gun = `${ay}-${pad(i + 1)}`;
    return { gun, tutar: topla(h.filter((x) => gunKey(x.tarih) === gun)), isGunu: is.has(gun) };
  });
}

// İş günü / izin günü ortalaması (yalnız bugüne kadar geçen günler)
export function gunTipiOrtalama(tx, ay, bugun = new Date()) {
  const bugunKey = gunKey(bugun);
  const gunler = gunlukSeri(tx, ay).filter((g) => g.gun <= bugunKey);
  const ort = (l) => (l.length ? topla(l) / l.length : 0);
  const is = gunler.filter((g) => g.isGunu);
  const izin = gunler.filter((g) => !g.isGunu);
  return { is: ort(is), isSayi: is.length, izin: ort(izin), izinSayi: izin.length };
}

export const bosVeri = () => ({ form: [], kayitlar: [], sabitler: [], borc: [], kurallar: [], ayarlar: {} });
