import { describe, it, expect, beforeEach, vi } from 'vitest';
import { kategorize, anahtarKelime, komut } from '../src/categorize';
import { gunKey, ayKey, ayOzeti, islemler, borcDurumu, baslangicAy, cuzdan, kumbara, gunToplami, gunlukSeri, sabitKalemleri } from '../src/data';
import { sayiOku } from '../src/format';
import { gunOzeti, haftaOzeti } from '../src/ozet.js';

const yerel = (y, m, d, h = 12, dk = 0) => new Date(y, m - 1, d, h, dk).toISOString();

describe('kategorize', () => {
  it('serbest yazıdan kategori', () => {
    expect(kategorize('kola zero bar')).toBe('İçecek');
    expect(kategorize('Sigara')).toBe('Sigara');
    expect(kategorize('taksi eve')).toBe('Ulaşım');
    expect(kategorize('dönere')).toBe('Yemek'); // kelime başı eşleşmesi
    expect(kategorize('bilinmeyen şey')).toBe('Diğer');
    expect(kategorize('')).toBe('Diğer');
  });
  it('borç cümleleri harcama dışı kategoriye gider', () => {
    expect(kategorize("Ahmet'e borç verdim")).toBe('Alacak');
    expect(kategorize('kart borcu')).toBe('Borç ödeme');
    expect(kategorize('Ayşe borcumu ödedim')).toBe('Borç ödeme');
  });
  it('#etiket tek kayıt için kazanır', () => {
    expect(kategorize('döner #arkadaş')).toBe('Arkadaş');
    expect(kategorize('kart #borç_ödeme')).toBe('Borç ödeme');
  });
  it('öğretilen kural yerleşik sözlüğü ezer, uzun kelime kazanır', () => {
    const k = [
      { kelime: 'kola', kategori: 'Market' },
      { kelime: 'kola zero', kategori: 'Arkadaş' },
    ];
    expect(kategorize('kola zero bar', k)).toBe('Arkadaş');
    expect(kategorize('kola', k)).toBe('Market');
  });
  it('yalnız kategori adı yazılınca o kategori', () => {
    expect(kategorize('İçecek')).toBe('İçecek');
    expect(kategorize('Faturalar')).toBe('Faturalar');
  });
  it('anahtar kelime ilk anlamlı kelime, etiket hariç', () => {
    expect(anahtarKelime('Mercimek çorbası')).toBe('mercimek');
  });
});

describe('gece vardiyası kuralı', () => {
  it("05:00'ten önce önceki güne yazılır", () => {
    expect(gunKey(yerel(2026, 10, 3, 2, 30))).toBe('2026-10-02');
    expect(gunKey(yerel(2026, 10, 3, 4, 59))).toBe('2026-10-02');
    expect(gunKey(yerel(2026, 10, 3, 5, 0))).toBe('2026-10-03');
  });
  it('ay sınırında da geçerli', () => {
    expect(ayKey(yerel(2026, 11, 1, 3))).toBe('2026-10');
  });
});

describe('Eylem Düğmesi komutları', () => {
  it('yazının başından tür çıkar', () => {
    expect(komut('iş')).toMatchObject({ tur: 'gelir', kategori: 'İş' });
    expect(komut('Kafe', { is_adi: 'Kafe' })).toMatchObject({ tur: 'gelir', kategori: 'Kafe' });
    expect(komut('Kafe')).toMatchObject({ tur: 'gider' }); // ad Ayarlar'da yoksa gider
    expect(komut('bahşiş masa 4')).toMatchObject({ tur: 'gelir', kategori: 'Bahşiş', nakit: true });
    expect(komut('nakit çektim')).toMatchObject({ tur: 'nakit_cek' });
    expect(komut('ATM')).toMatchObject({ tur: 'nakit_cek' });
    expect(komut('kumbara')).toMatchObject({ tur: 'kumbara', isaret: 1 });
    expect(komut('kumbaradan aldım')).toMatchObject({ tur: 'kumbara', isaret: -1 });
    expect(komut('cüzdan')).toMatchObject({ tur: 'sayim' });
  });
  it('gider: "nakit" kelimesi varsa cüzdandan', () => {
    expect(komut('döner nakit')).toMatchObject({ tur: 'gider', nakit: true });
    expect(komut('döner')).toMatchObject({ tur: 'gider', nakit: false });
    expect(komut('işte kola')).toMatchObject({ tur: 'gider' }); // "iş" yalnız tek başına gelir
    expect(kategorize('Camel Blue')).toBe('Sigara');
  });
});

const bos = () => ({ form: [], kayitlar: [], sabitler: [], borc: [], kurallar: [], ayarlar: {} });
let n = 2;
const f = (tarih, metin, tutar) => ({ id: 'form:' + n++, tarih, metin, tutar });
const k = (tarih, tur, tutar, ek = {}) => ({ id: 'kayit:' + n++, tarih, tur, tutar, metin: '', kategori: '', nakit: false, ...ek });

describe('ay özeti', () => {
  const raw = {
    ...bos(),
    form: [
      f(yerel(2026, 10, 2, 20), 'döner', 200),
      f(yerel(2026, 10, 3, 1), 'Camel Blue', 100),
      f(yerel(2026, 10, 3, 14), "Ali'ye borç verdim", 500),
      f(yerel(2026, 10, 4, 14), 'kart borcu', 3000),
      f(yerel(2026, 9, 28, 14), 'pizza', 999),
      f(yerel(2026, 10, 3, 2), 'Kafe', 1000),
      f(yerel(2026, 10, 4, 15), 'kumbara', 1000),
    ],
    sabitler: [
      { ad: 'Kira', tur: 'gider', tutar: 2500, gun: 1, aktif: true, birim: 'TL' },
      { ad: 'Claude', tur: 'gider', tutar: 20, gun: 3, aktif: true, birim: 'USD' },
      { ad: 'Burs', tur: 'gelir', tutar: 3000, gun: 6, aktif: true, birim: 'TL' },
      { ad: 'Eski', tur: 'gider', tutar: 77, gun: 1, aktif: false, birim: 'TL' },
    ],
    ayarlar: { baslangic_ay: '2026-10', is_adi: 'Kafe' },
  };
  const tx = islemler(raw);
  const bugun = new Date(2026, 9, 5, 12);
  const o = ayOzeti(raw, tx, '2026-10', bugun, 40);

  it('alacak, borç ödemesi ve kumbara gidere girmez; önceki ay girmez', () => {
    expect(o.degiskenGider).toBe(300);
  });
  it('günü gelen sabit sayılır, dolar kurla çevrilir, gelmeyen bekler, pasif sayılmaz', () => {
    expect(o.sabitGider).toBe(2500 + 20 * 40);
    expect(o.bekleyen.map((s) => s.ad)).toEqual(['Burs']);
  });
  it('kur yoksa dolar sabit bilinmiyor diye işaretlenir', () => {
    expect(ayOzeti(raw, tx, '2026-10', bugun, null).kurEksik).toBe(true);
  });
  it('Ayarlar\'daki iş adı gelir ve iş günü (gece 02:00 → önceki gün)', () => {
    expect(o.gelir).toBe(1000);
    expect(gunlukSeri(tx, '2026-10').find((g) => g.gun === '2026-10-02').isGunu).toBe(true);
  });
  it('gün 31 olan sabit kısa ayda ayın son günü', () => {
    const r = { ...bos(), sabitler: [{ ad: 'Telefon', tur: 'gider', tutar: 900, gun: 31, aktif: true, birim: 'TL' }], ayarlar: { baslangic_ay: '2026-11' } };
    const s = sabitKalemleri(r, '2026-11', new Date(2026, 10, 30, 12));
    expect(s[0]).toMatchObject({ gun: 30, gerceklesti: true });
  });
  it('başlangıç ayı yoksa ilk kaydın ayı', () => {
    expect(baslangicAy({ ...raw, ayarlar: {} }, bugun)).toBe('2026-09');
    expect(baslangicAy(bos(), bugun)).toBe('2026-10');
  });
  it('kumbara toplamı', () => {
    const t = islemler({ ...raw, kayitlar: [k(yerel(2026, 10, 5), 'kumbara', -300)] });
    expect(kumbara(raw, t).toplam).toBe(700);
  });
});

describe('cüzdan', () => {
  const raw = {
    ...bos(),
    form: [f(yerel(2026, 10, 10, 12), 'nakit çektim', 2000), f(yerel(2026, 10, 10, 20), 'döner nakit', 250), f(yerel(2026, 10, 10, 13), 'kahve', 90)],
    kayitlar: [k(yerel(2026, 10, 11, 3), 'gelir', 300, { kategori: 'Bahşiş', nakit: true }), k(yerel(2026, 10, 11, 4), 'sayim', 1200)],
  };
  const tx = islemler(raw);
  it('çekim + bahşiş − nakit gider; sayımda eksik kayıp nakit olur', () => {
    const c = cuzdan(tx);
    // 2000 + 300 − 250 = 2050 beklenen, 1200 sayıldı → 850 kayıp
    expect(c.kayiplar.map((x) => x.tutar)).toEqual([850]);
    expect(c.bakiye).toBe(1200);
  });
  it('kayıp nakit o günün harcamasına yazılır, kartla kahve de sayılır', () => {
    expect(gunToplami(tx, '2026-10-10')).toBe(250 + 90 + 850);
  });
  it('fazla çıkarsa kayıp yazılmaz', () => {
    const t = islemler({ ...raw, kayitlar: [k(yerel(2026, 10, 11, 4), 'sayim', 5000)] });
    expect(cuzdan(t).kayiplar).toEqual([]);
  });
});

describe('Eylem Düğmesi Kayıtlar sekmesine gider olarak yazar', () => {
  it('yazıdan tür yine çıkar', () => {
    const tx = islemler({
      ...bos(),
      kayitlar: [
        k(yerel(2026, 10, 10, 12), 'gider', 2000, { metin: 'nakit çektim' }),
        k(yerel(2026, 10, 10, 13), 'gider', 300, { metin: 'bahşiş' }),
        k(yerel(2026, 10, 10, 14), 'gider', 250, { metin: 'döner nakit' }),
        k(yerel(2026, 10, 10, 15), 'gelir', 1000, { kategori: 'İş' }),
      ],
    });
    expect(cuzdan(tx).bakiye).toBe(2050);
    expect(tx.filter((x) => x.tur === 'gelir').map((x) => x.kategori).sort()).toEqual(['Bahşiş', 'İş']);
  });
});

describe('Hermes özetleri', () => {
  const raw = {
    ...bos(),
    kayitlar: [
      k(yerel(2026, 10, 24, 13), 'gider', 250, { metin: 'döner' }),
      k(yerel(2026, 10, 24, 15), 'gider', 100, { metin: 'Camel Blue' }),
      k(yerel(2026, 10, 24, 16), 'gider', 2000, { metin: 'nakit çektim' }),
      k(yerel(2026, 10, 23, 18), 'gelir', 1000, { kategori: 'Kafe' }),
      k(yerel(2026, 10, 22, 12), 'kumbara', 2000),
    ],
    sabitler: [{ ad: 'Telefon', tur: 'gider', tutar: 900, gun: 25, aktif: true, birim: 'TL' }],
    ayarlar: { baslangic_ay: '2026-10', kumbara_hedefi: 8000, kumbara_tarih: '2026-12-01', is_adi: 'Kafe', is_ucret: 1000 },
  };
  const tx = islemler(raw);
  it('gece özeti: harcama, yarınki ödeme, sayım hatırlatması', () => {
    const m = gunOzeti(raw, tx, new Date(2026, 9, 25, 0, 0), 'gece');
    expect(m).toContain('₺350');
    expect(m).toContain('Yarın ödenecek: Telefon ₺900');
    expect(m).toContain('Cüzdanı saymadın');
  });
  it('iş günü gece özeti atlanır, vardiya özetinde gelir var', () => {
    expect(gunOzeti(raw, tx, new Date(2026, 9, 24, 0, 0), 'gece')).toBe('');
    expect(gunOzeti(raw, tx, new Date(2026, 9, 24, 3, 30), 'vardiya')).toContain('Kafe +₺1.000');
    expect(gunOzeti(raw, tx, new Date(2026, 9, 25, 3, 30), 'vardiya')).toBe('');
  });
  it('haftalık özet: kumbara hedefi ve borç hatırlatması', () => {
    const m = haftaOzeti(raw, tx, new Date(2026, 9, 25, 12, 0));
    expect(m).toContain('Kumbara ₺2.000 / ₺8.000');
    expect(m).toContain('vardiyanın kazancı');
    expect(m).toContain('Kart borcunu henüz girmedin');
    expect(m).toContain('Kafe: 1 vardiya');
  });
});

describe('kart borcu', () => {
  it('son haftalık giriş geçerli, ödenenler toplanır', () => {
    const b = borcDurumu({ borc: [
      { id: 'borc:2', tarih: yerel(2026, 10, 1), bakiye: 14000, odenen: 0 },
      { id: 'borc:3', tarih: yerel(2026, 10, 8), bakiye: 13000, odenen: 2000 },
    ] });
    expect(b.son.bakiye).toBe(13000);
    expect(b.odenenToplam).toBe(2000);
  });
});

describe('sayı okuma', () => {
  it('Türkçe biçimler', () => {
    expect(sayiOku('1.500')).toBe(1500);
    expect(sayiOku('12,5')).toBe(12.5);
    expect(sayiOku('1.500,50')).toBe(1500.5);
    expect(sayiOku('130')).toBe(130);
    expect(sayiOku('abc')).toBe(0);
  });
});

describe('gönderim kuyruğu', () => {
  let store;
  beforeEach(() => {
    vi.resetModules();
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => (store[k] = String(v)),
    };
    store['cashluma.cfg'] = JSON.stringify({ url: 'https://ornek/exec', key: 'k' });
  });

  it('aynı anda iki gönderim kaydı çiftlemez', async () => {
    const gonderilen = [];
    globalThis.fetch = vi.fn(async (_u, o) => {
      const b = JSON.parse(o.body);
      if (b.action === 'add') gonderilen.push(b.metin);
      await new Promise((r) => setTimeout(r, 20));
      return { json: async () => ({ ok: true, data: { form: [], kayitlar: [] } }) };
    });
    const api = await import('../src/api');
    // açılıştaki yenileme + kaydet aynı anda (2026-10-03 "Dömf" çift kaydı böyle oldu)
    await Promise.all([api.ekle({ tur: 'gelir', tutar: 150, metin: 'Dömf' }), api.gonder(), api.gonder()]);
    expect(gonderilen).toEqual(['Dömf']);
    expect(api.getQueue()).toEqual([]);
  });

  it('internet yoksa kayıt kuyrukta kalır, gelince gider', async () => {
    let cevrimdisi = true;
    globalThis.fetch = vi.fn(async () => {
      if (cevrimdisi) throw new TypeError('Failed to fetch');
      return { json: async () => ({ ok: true, data: { form: [], kayitlar: [] } }) };
    });
    const api = await import('../src/api');
    await expect(api.ekle({ tur: 'gider', tutar: 90, metin: 'kola' })).rejects.toThrow();
    expect(api.getQueue()).toHaveLength(1);
    cevrimdisi = false;
    await api.gonder();
    expect(api.getQueue()).toHaveLength(0);
  });

  it('yanlış anahtar hatası yukarı taşınır', async () => {
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ ok: false, error: 'unauthorized' }) }));
    const api = await import('../src/api');
    await expect(api.call('all')).rejects.toThrow('unauthorized');
  });
});
