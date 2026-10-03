// Apps Script ile konuşma + çevrimdışı kuyruk + önbellek.
// Anahtar ve adres yalnız bu telefonda (localStorage) durur, kodda yok.

const K = { cfg: 'cashluma.cfg', cache: 'cashluma.cache', queue: 'cashluma.queue' };

function oku(k, vars) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : vars;
  } catch {
    return vars;
  }
}
function yaz(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* gizli sekme vb. */
  }
}

export const getCfg = () => oku(K.cfg, { url: '', key: '' });
export const setCfg = (cfg) => yaz(K.cfg, cfg);
export const getCache = () => oku(K.cache, null);
export const getQueue = () => oku(K.queue, []);

let demo = null;
export const demoMu = () => !!demo;

export async function baslat() {
  const cfg = getCfg();
  // Geliştirme önizlemesi: anahtar yoksa örnek veri. Yayındaki sürüme girmez.
  if (import.meta.env.DEV && (!cfg.url || !cfg.key)) {
    const m = await import('./dev-sample.js');
    demo = m.demoApi();
  }
}

export async function call(action, payload = {}) {
  if (demo) return demo(action, payload);
  const { url, key } = getCfg();
  if (!url || !key) throw new Error('ayar_yok');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ key, action, ...payload }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'hata');
  yaz(K.cache, j.data);
  return j.data;
}

// Kayıt: önce kuyruğa, sonra göndermeyi dene. İnternet yoksa kuyrukta bekler.
export async function ekle(item) {
  const q = getQueue();
  q.push({ ...item, tarih: item.tarih || new Date().toISOString(), qid: Date.now() + Math.random() });
  yaz(K.queue, q);
  return gonder();
}

// Aynı anda tek gönderim: açılıştaki yenileme ile kaydet aynı anda kuyruğu boşaltırsa kayıt çiftleniyordu
// (2026-10-03, "Dömf · 150" tabloya iki kez düştü).
let gonderiliyor = null;
export function gonder() {
  if (!gonderiliyor) {
    gonderiliyor = (async () => {
      let data = null;
      while (getQueue().length) {
        const { qid, ...body } = getQueue()[0];
        data = await call('add', body);
        yaz(K.queue, getQueue().filter((x) => x.qid !== qid));
      }
      return data;
    })().finally(() => (gonderiliyor = null));
  }
  return gonderiliyor;
}
