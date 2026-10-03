import { kategorize, HARIC } from './categorize';

const pad = (n) => String(n).padStart(2, '0');
const topla = (list) => list.reduce((s, x) => s + (Number(x.tutar) || 0), 0);

// Gece vardiyası (17:00-04:00): 05:00'ten önceki işlem önceki güne yazılır.
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

export function islemler(raw) {
  const g = raw.giderler.map((x) => ({ ...x, tur: 'gider', kategori: kategorize(x.metin, raw.kurallar) }));
  const i = raw.gelirler.map((x) => ({ ...x, tur: 'gelir' }));
  return [...g, ...i]
    .filter((x) => x.tarih && !isNaN(new Date(x.tarih)))
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
}

// Sabit gelir/giderler (KYK, yurt, abonelikler) her ay kendiliğinden sayılır.
// Bu ay için: günü gelmişse gerçekleşti, gelmemişse "bekleyen".
// Takip başlangıcı: ayarda yazıyorsa o, yoksa ilk kaydın ayı, o da yoksa bu ay.
export function baslangicAy(raw, bugun = new Date()) {
  if (raw.ayarlar.baslangic_ay) return String(raw.ayarlar.baslangic_ay).slice(0, 7);
  const ilk = [...raw.giderler, ...raw.gelirler].map((x) => x.tarih).filter(Boolean).sort()[0];
  return ilk ? ayKey(ilk) : ayKey(bugun);
}

function sabitKalemleri(raw, ay, bugun) {
  const bas = baslangicAy(raw, bugun);
  const buAy = ayKey(bugun);
  if (ay < bas || ay > buAy) return [];
  const gun = etkinTarih(bugun).getDate();
  return raw.sabitler.filter((s) => s.aktif).map((s) => ({ ...s, gerceklesti: ay < buAy || s.gun <= gun }));
}

export function ayOzeti(raw, tx, ay, bugun = new Date()) {
  const ayTx = tx.filter((x) => ayKey(x.tarih) === ay);
  const giderTx = ayTx.filter((x) => x.tur === 'gider' && !HARIC.includes(x.kategori));
  const gelirTx = ayTx.filter((x) => x.tur === 'gelir');
  const sabit = sabitKalemleri(raw, ay, bugun);
  const sabitGider = topla(sabit.filter((s) => s.tur === 'gider' && s.gerceklesti));
  const sabitGelir = topla(sabit.filter((s) => s.tur === 'gelir' && s.gerceklesti));
  const bekleyen = sabit.filter((s) => !s.gerceklesti).sort((a, b) => a.gun - b.gun);

  const degiskenGider = topla(giderTx);
  const gelir = topla(gelirTx) + sabitGelir;
  const gider = degiskenGider + sabitGider;
  const net = gelir - gider;

  const kat = {};
  giderTx.forEach((x) => (kat[x.kategori] = (kat[x.kategori] || 0) + x.tutar));
  if (sabitGider) kat.Sabit = sabitGider;
  const kategoriler = Object.entries(kat)
    .map(([ad, tutar]) => ({ ad, tutar }))
    .sort((a, b) => b.tutar - a.tutar);

  const gt = {};
  gelirTx.forEach((x) => (gt[x.kategori] = (gt[x.kategori] || 0) + x.tutar));
  sabit.filter((s) => s.tur === 'gelir' && s.gerceklesti).forEach((s) => (gt[s.ad] = (gt[s.ad] || 0) + s.tutar));
  const gelirTurleri = Object.entries(gt)
    .map(([ad, tutar]) => ({ ad, tutar }))
    .sort((a, b) => b.tutar - a.tutar);

  const bekleyenNet = topla(bekleyen.filter((s) => s.tur === 'gelir')) - topla(bekleyen.filter((s) => s.tur === 'gider'));

  return {
    ay,
    gelir,
    gider,
    net,
    degiskenGider,
    sabitGider,
    sabitGelir,
    bekleyen,
    ayKapanisi: net + bekleyenNet,
    kategoriler,
    gelirTurleri,
    haric: ayTx.filter((x) => HARIC.includes(x.kategori)),
    giderSayisi: giderTx.length,
  };
}

export function gunToplami(tx, gun) {
  return topla(tx.filter((x) => x.tur === 'gider' && !HARIC.includes(x.kategori) && gunKey(x.tarih) === gun));
}

export function gunlukSeri(tx, ay) {
  const [y, m] = ay.split('-').map(Number);
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) => {
    const gun = `${ay}-${pad(i + 1)}`;
    return { gun: i + 1, tutar: gunToplami(tx, gun) };
  });
}

export function borcDurumu(raw, tx) {
  const baslangic = Number(raw.ayarlar.borc_baslangic) || 0;
  const odenen = topla(tx.filter((x) => x.kategori === 'Borç ödeme'));
  return { baslangic, odenen, kalan: Math.max(0, baslangic - odenen) };
}

// Başlangıç ayından bu yana gerçekleşen netlerin toplamı = elde kalması gereken para (yaklaşık).
export function birikim(raw, tx, bugun = new Date()) {
  const hedef = Number(raw.ayarlar.birikim_hedefi) || 0;
  const bas = baslangicAy(raw, bugun);
  const son = ayKey(bugun);
  let toplam = 0;
  for (let ay = bas; ay <= son; ay = ayEkle(ay, 1)) toplam += ayOzeti(raw, tx, ay, bugun).net;
  return { toplam, hedef, tarih: raw.ayarlar.hedef_tarih };
}

export const bosVeri = () => ({ giderler: [], gelirler: [], sabitler: [], kurallar: [], ayarlar: {} });
