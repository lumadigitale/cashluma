import { describe, it, expect, beforeEach, vi } from 'vitest';
import { kategorize, anahtarKelime } from '../src/categorize';
import { gunKey, ayKey, ayOzeti, islemler, borcDurumu, baslangicAy, birikim } from '../src/data';
import { sayiOku } from '../src/format';

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

describe('ay özeti', () => {
  const raw = {
    giderler: [
      { id: 'gider:2', tarih: yerel(2026, 10, 2, 20), metin: 'döner', tutar: 200 },
      { id: 'gider:3', tarih: yerel(2026, 10, 3, 1), metin: 'sigara', tutar: 130 },
      { id: 'gider:4', tarih: yerel(2026, 10, 3, 14), metin: "Ali'ye borç verdim", tutar: 500 },
      { id: 'gider:5', tarih: yerel(2026, 10, 4, 14), metin: 'kart borcu', tutar: 3000 },
      { id: 'gider:6', tarih: yerel(2026, 9, 28, 14), metin: 'pizza', tutar: 999 },
    ],
    gelirler: [{ id: 'gelir:2', tarih: yerel(2026, 10, 3, 4), metin: '', tutar: 1500, kategori: 'Bar günlüğü' }],
    sabitler: [
      { ad: 'Yurt', tur: 'gider', tutar: 2000, gun: 1, aktif: true },
      { ad: 'KYK', tur: 'gelir', tutar: 4000, gun: 6, aktif: true },
      { ad: 'Eski', tur: 'gider', tutar: 77, gun: 1, aktif: false },
    ],
    kurallar: [],
    ayarlar: { baslangic_ay: '2026-10', borc_baslangic: 8000 },
  };
  const tx = islemler(raw);
  const bugun = new Date(2026, 9, 5, 12);
  const o = ayOzeti(raw, tx, '2026-10', bugun);

  it('alacak ve borç ödemesi gidere girmez, önceki ay girmez', () => {
    expect(o.degiskenGider).toBe(330);
  });
  it('günü gelen sabit sayılır, gelmeyen bekler, pasif hiç sayılmaz', () => {
    expect(o.sabitGider).toBe(2000);
    expect(o.sabitGelir).toBe(0);
    expect(o.bekleyen.map((s) => s.ad)).toEqual(['KYK']);
  });
  it('net ve ay kapanışı', () => {
    expect(o.gelir).toBe(1500);
    expect(o.gider).toBe(2330);
    expect(o.net).toBe(-830);
    expect(o.ayKapanisi).toBe(-830 + 4000);
  });
  it('başlangıç ayından önce sabit yok', () => {
    expect(ayOzeti(raw, tx, '2026-09', bugun).sabitGider).toBe(0);
  });
  it('borç ödemesi kart borcunu düşürür', () => {
    expect(borcDurumu(raw, tx)).toEqual({ baslangic: 8000, odenen: 3000, kalan: 5000 });
  });
  it('başlangıç ayı yoksa ilk kaydın ayı', () => {
    expect(baslangicAy({ ...raw, ayarlar: {} }, bugun)).toBe('2026-09');
    expect(baslangicAy({ giderler: [], gelirler: [], ayarlar: {} }, bugun)).toBe('2026-10');
  });
  it('birikim = başlangıçtan beri netler', () => {
    expect(birikim(raw, tx, bugun).toplam).toBe(-830);
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
      return { json: async () => ({ ok: true, data: { giderler: [] } }) };
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
      return { json: async () => ({ ok: true, data: { giderler: [] } }) };
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
