// Dolar kuru (USD → TRY): dolarla ödenen sabitler (ChatGPT, Claude) için.
// open.er-api (CORS açık, denendi), olmazsa Frankfurter. Son değer telefonda saklanır;
// internet yokken o kullanılır. 6 saatten yeniyse tekrar sorulmaz.

const K = 'cashluma.kur';
const TAZE = 6 * 60 * 60 * 1000;

const KAYNAKLAR = [
  ['https://open.er-api.com/v6/latest/USD', (j) => j.rates?.TRY],
  ['https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY', (j) => j.rates?.TRY],
];

export function kayitliKur() {
  try {
    return JSON.parse(localStorage.getItem(K)) || null; // { deger, zaman }
  } catch {
    return null;
  }
}

export async function kurGetir() {
  const eski = kayitliKur();
  if (eski && Date.now() - eski.zaman < TAZE) return eski;
  for (const [url, al] of KAYNAKLAR) {
    try {
      const r = await fetch(url);
      const deger = Number(al(await r.json()));
      if (deger > 0) {
        const k = { deger, zaman: Date.now() };
        try {
          localStorage.setItem(K, JSON.stringify(k));
        } catch {
          /* gizli sekme vb. */
        }
        return k;
      }
    } catch {
      /* sıradaki kaynak */
    }
  }
  return eski;
}
