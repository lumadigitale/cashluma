// Hermes için: Cashluma tablosunu salt okunur anahtarla okur, özet metnini yazdırır.
//   node scripts/ozet.mjs gece      → çalışılmayan günün özeti (00:00); iş günüyse boş
//   node scripts/ozet.mjs vardiya   → iş gününün özeti (vardiya sonrası); değilse boş
//   node scripts/ozet.mjs hafta     → haftalık özet (Pazar)
// Ortam: CASHLUMA_URL (Apps Script /exec), CASHLUMA_KEY (salt okunur anahtar).
// Çıktı boşsa gönderecek bir şey yok. Hata olursa stderr'e yazar, çıkış kodu 1.
import { islemler } from '../src/data.js';
import { gunOzeti, haftaOzeti } from '../src/ozet.js';

// Sunucu UTC'de çalışır; gün sınırı ve gece kuralı (05:00) İstanbul saatine göre olmalı.
// Node, çalışırken TZ değişince saat dilimini yeniden okur; tarih hesapları aşağıda başlıyor.
process.env.TZ = 'Europe/Istanbul';

const mod = process.argv[2];
if (!['gece', 'vardiya', 'hafta'].includes(mod)) {
  console.error('kullanım: node scripts/ozet.mjs gece|vardiya|hafta');
  process.exit(2);
}
const { CASHLUMA_URL: url, CASHLUMA_KEY: key } = process.env;
if (!url || !key) {
  console.error('CASHLUMA_URL ve CASHLUMA_KEY gerekli');
  process.exit(2);
}

async function kurAl() {
  try {
    const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
    return Number(j.rates?.TRY) || null;
  } catch {
    return null;
  }
}

try {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ key, action: 'all' }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'hata');
  const raw = j.data;
  const tx = islemler(raw);
  const kur = await kurAl();
  const simdi = new Date();
  const metin = mod === 'hafta' ? haftaOzeti(raw, tx, simdi, kur) : gunOzeti(raw, tx, simdi, mod, kur);
  if (metin) console.log(metin);
} catch (e) {
  console.error('Cashluma okunamadı: ' + e.message);
  process.exit(1);
}
