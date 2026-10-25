// Hermes'in Telegram'a gönderdiği özet metinleri. Uygulamayla aynı hesap kurallarını kullanır.
// Boş metin = o saatte gönderilecek bir şey yok.
import { ayKey, ayOzeti, cuzdan, gunKey, harcamalar, isGunleri, kumbara, borcDurumu, etkinTarih } from './data.js';
import { HARIC } from './categorize.js';
import { tl } from './format.js';

const topla = (l) => l.reduce((s, x) => s + (Number(x.tutar) || 0), 0);
const gunAdi = (gun, ek = {}) => new Date(gun + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...ek });
const gunEkle = (gun, n) => {
  const d = new Date(gun + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return gunKey(d);
};

function kategoriSatiri(liste, adet = 4) {
  const m = {};
  liste.forEach((x) => (m[x.kategori] = (m[x.kategori] || 0) + x.tutar));
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, adet)
    .map(([ad, t]) => `${ad} ${tl(t)}`)
    .join(', ');
}

// Belirli günlerde düşecek sabit giderler
function odemeler(raw, gunler, kur) {
  return gunler.flatMap((gun) => {
    const gunNo = Number(gun.slice(8));
    const son = new Date(Number(gun.slice(0, 4)), Number(gun.slice(5, 7)), 0).getDate();
    return raw.sabitler
      .filter((s) => s.aktif && s.tur === 'gider' && Math.min(s.gun, son) === gunNo)
      .map((s) => `${s.ad} ${s.birim === 'USD' ? `$${s.tutar}${kur ? ` (≈${tl(s.tutar * kur)})` : ''}` : tl(s.tutar)}`);
  });
}

// zaman: 'gece' (çalışılmayan gün, 00:00) ya da 'vardiya' (iş günü, vardiya sonrası).
// Gece kuralı yüzünden 00:00 ve 03:30'da gunKey biten günü verir.
export function gunOzeti(raw, tx, simdi, zaman, kur = null) {
  const gun = gunKey(simdi);
  const isGunu = isGunleri(tx).has(gun);
  if (zaman === 'gece' && isGunu) return '';
  if (zaman === 'vardiya' && !isGunu) return '';

  const bugunH = harcamalar(tx).filter((x) => gunKey(x.tarih) === gun);
  const toplam = topla(bugunH);
  const ay = ayKey(simdi);
  const o = ayOzeti(raw, tx, ay, simdi, kur);
  const ortalama = o.degiskenGider / etkinTarih(simdi).getDate();
  const satirlar = [`${gunAdi(gun, { weekday: 'long' })} özeti`];

  if (toplam > 0) satirlar.push(`Bugün ${tl(toplam)} harcadın: ${kategoriSatiri(bugunH)}.`);
  else satirlar.push('Bugün hiç harcama kaydı yok. Gerçekten mi, yoksa kaydetmeyi mi unuttun?');
  satirlar.push(`${ayAdiBuyuk(ay)} günlük ortalaman ${tl(ortalama)}.`);

  const gelir = tx.filter((x) => x.tur === 'gelir' && gunKey(x.tarih) === gun);
  if (gelir.length) satirlar.push(`Gelir: ${gelir.map((x) => `${x.kategori || 'Diğer'} +${tl(x.tutar)}`).join(', ')}.`);

  const kayip = topla(bugunH.filter((x) => x.kategori === 'Kayıp nakit'));
  if (kayip > 0) satirlar.push(`Cüzdan sayımında ${tl(kayip)} eksik çıktı.`);

  const c = cuzdan(tx);
  const nakitVar = tx.some((x) => x.tur === 'nakit_cek' || x.nakit);
  const sayildi = tx.some((x) => x.tur === 'sayim' && gunKey(x.tarih) === gun);
  if (nakitVar && !sayildi) satirlar.push(`Cüzdanı saymadın; olması gereken ${tl(c.bakiye)}. Eylem Düğmesi'nden "cüzdan" yazıp say.`);

  const yarin = odemeler(raw, [gunEkle(gun, 1)], kur);
  if (yarin.length) satirlar.push(`Yarın ödenecek: ${yarin.join(', ')}.`);

  return satirlar.join('\n');
}

export function haftaOzeti(raw, tx, simdi, kur = null) {
  const bugun = gunKey(simdi);
  const bas = gunEkle(bugun, -6);
  const oncekiBas = gunEkle(bugun, -13);
  const h = harcamalar(tx);
  const buHafta = h.filter((x) => gunKey(x.tarih) >= bas && gunKey(x.tarih) <= bugun);
  const gecen = h.filter((x) => gunKey(x.tarih) >= oncekiBas && gunKey(x.tarih) < bas);
  const toplam = topla(buHafta);
  const satirlar = [`Haftalık özet (${gunAdi(bas)} – ${gunAdi(bugun)})`];

  const fark = toplam - topla(gecen);
  satirlar.push(`Harcama ${tl(toplam)}${gecen.length ? ` (önceki haftadan ${fark >= 0 ? '+' : '−'}${tl(Math.abs(fark))})` : ''}.`);
  if (buHafta.length) satirlar.push(`En çok: ${kategoriSatiri(buHafta, 3)}.`);

  const kayip = topla(buHafta.filter((x) => x.kategori === 'Kayıp nakit'));
  if (kayip > 0) satirlar.push(`Kayıp nakit: ${tl(kayip)}.`);

  const isler = tx.filter((x) => x.is && gunKey(x.tarih) >= bas && gunKey(x.tarih) <= bugun);
  if (isler.length) satirlar.push(`${isler[0].kategori}: ${isler.length} vardiya, ${tl(topla(isler))}.`);

  const haric = tx.filter((x) => x.tur === 'gider' && HARIC.includes(x.kategori) && gunKey(x.tarih) >= bas && gunKey(x.tarih) <= bugun);
  if (haric.length) satirlar.push(`Harcama sayılmayan (borç ver/öde): ${tl(topla(haric))}.`);

  const k = kumbara(raw, tx);
  if (k.hedef > 0) {
    const kalan = Math.max(0, k.hedef - k.toplam);
    let s = `Kumbara ${tl(k.toplam)} / ${tl(k.hedef)}, kalan ${tl(kalan)}`;
    if (kalan > 0 && k.tarih) {
      const hafta = Math.max(1, Math.ceil((new Date(k.tarih + 'T12:00:00') - simdi) / (7 * 864e5)));
      const haftalik = kalan / hafta;
      const ucret = Number(raw.ayarlar?.is_ucret) || 0;
      s += `. ${gunAdi(k.tarih)} için haftada ${tl(haftalik)} atman lazım${ucret ? ` (≈${Math.ceil(haftalik / ucret)} vardiyanın kazancı)` : ''}`;
    }
    satirlar.push(s + '.');
  } else if (k.toplam) satirlar.push(`Kumbara: ${tl(k.toplam)}.`);

  const b = borcDurumu(raw).son;
  if (!b) satirlar.push('Kart borcunu henüz girmedin; Cashluma → Kart borcu.');
  else if (simdi - new Date(b.tarih) > 7 * 864e5) satirlar.push(`Kart borcu ${tl(b.bakiye)} (son giriş ${gunAdi(gunKey(b.tarih))}); bu haftanın bakiyesini gir.`);
  else satirlar.push(`Kart borcu ${tl(b.bakiye)}.`);

  const gelecek = odemeler(raw, Array.from({ length: 7 }, (_, i) => gunEkle(bugun, i + 1)), kur);
  if (gelecek.length) satirlar.push(`Önümüzdeki 7 gün ödenecek: ${gelecek.join(', ')}.`);

  return satirlar.join('\n');
}

function ayAdiBuyuk(ay) {
  const s = new Date(ay + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long' });
  return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
}
