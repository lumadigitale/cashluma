const tam = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

export const tl = (n) => `${n < 0 ? '−' : ''}₺${tam.format(Math.abs(Math.round(n)))}`;
export const isaretli = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}₺${tam.format(Math.abs(Math.round(n)))}`;

export function parcala(n) {
  const abs = Math.abs(n);
  const tamKisim = Math.floor(abs);
  const kurus = Math.round((abs - tamKisim) * 100);
  return { eksi: n < 0, tam: tam.format(tamKisim), kurus: String(kurus).padStart(2, '0') };
}

export function ayAdi(ay, uzun = true) {
  const [y, m] = ay.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: uzun ? 'long' : 'short' }).format(new Date(y, m - 1, 1));
}

export function gunBasligi(gun) {
  const d = new Date(gun + 'T12:00:00');
  const bugun = new Date();
  const dun = new Date();
  dun.setDate(dun.getDate() - 1);
  const ayni = (a, b) => a.toDateString() === b.toDateString();
  if (ayni(d, bugun)) return 'Bugün';
  if (ayni(d, dun)) return 'Dün';
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(d);
}

export const saat = (t) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(t));

// "1.500" / "12,5" klavyeden → sayı
export function sayiOku(s) {
  let v = String(s || '').trim();
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
