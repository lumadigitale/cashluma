# Cashluma

Kişisel gelir-gider paneli. iPhone'da "Ana Ekrana Ekle" ile uygulama gibi çalışan bir PWA.
Veriler Google Sheets'te durur; arada küçük bir Apps Script köprüsü var.

```
iPhone Eylem Düğmesi ──► Apps Script ◄──► "Harcama Kaydı" tablosu
                          ▲
                     Cashluma (PWA)
```

## Özellikler (v2)
- Bugün ve bu ay ne kadar harcandı; kategori dağılımı; iş günleri ile diğer günlerin ortalaması
- Serbest yazıdan otomatik kategori ("kola zero bar" → İçecek); tanımadığını sorar, öğrenir
- Sabit gelir/giderler günlerinde kendiliğinden sayılır, günü gelmeyen "bu ay gelecekler"de bekler; dolar sabitler güncel kurla
- Cüzdan: nakit çekim + bahşiş − nakit harcama; gün sonu sayımında eksik çıkan "kayıp nakit" harcamaya yazılır
- Kumbara (harcama sayılmaz) ve hedef çubuğu; kart borcu haftalık elle girilir, harcamaya karışmaz
- Gece vardiyası kuralı: 05:00'ten önceki işlem önceki güne yazılır
- Çevrimdışı: internet yokken girilen kayıt kuyrukta bekler, bağlantı gelince gider

## Eylem Düğmesi yazıları
Kestirme Apps Script'e (yazı, tutar) gönderir; gider olarak gelen kaydın gerçek türü yazının başından anlaşılır.
İş düğmesinin adı, günlük ücret ve sigara düğmesinin yazısı/fiyatı uygulamada Ayarlar'dan girilir; kodda durmaz.

| Yazı | Anlamı |
|---|---|
| `iş` (ya da Ayarlar'daki iş adı) · tutar | iş geliri, o gün iş günü |
| `bahşiş` · 300 | gelir, cüzdana girer |
| `nakit çektim` · 2000 | cüzdana para girişi (harcama değil) |
| `döner nakit` · 200 | nakitle harcama, cüzdandan düşer |
| `kumbara` · 500 / `kumbaradan` · 500 | kumbaraya at / kumbaradan al |
| `cüzdan` · 450 | gün sonu cüzdan sayımı |
| `sigara` · tutar | sigara (her kelime gibi kategoriye düşer) |
| diğer her şey | kartla gider |

## Geliştirme
```bash
npm install
npm run dev     # anahtar girilmemişse örnek veriyle açılır (yalnız geliştirmede)
npm run build
```

## Kurulum (Google tarafı)
1. "Harcama Kaydı" tablosunu aç → Uzantılar → Apps Script
2. `apps-script/Code.gs` içeriğini yapıştır, kaydet
3. `kurulum` fonksiyonunu çalıştır (izin ver) → Yürütme günlüğünde anahtar yazar
4. Dağıt → Yeni dağıtım → Web uygulaması · Yürüten: Ben · Erişim: Herkes → adresi kopyala
5. Uygulamada Ayarlar → adres + anahtar → Kaydet ve bağlan

v1'den geçerken: yeni `Code.gs`'i yapıştır → `kurulum` → Dağıtımları yönet → mevcut dağıtımı düzenle → Yeni sürüm (adres aynı kalır). Temiz başlangıç için `sifirla` çalıştır. Uygulama ancak bundan sonra yayınlanmalı; eski script'le açılırsa "Apps Script eski sürümde" der.

## Hermes özetleri (Telegram)
`scripts/ozet.mjs` tabloyu **salt okunur** anahtarla okur ve özet metnini yazdırır; Hermes bunu zamanlanmış görevle çalıştırıp Telegram'a gönderir.
Salt okunur anahtar `kurulum` çalışınca günlükte yazar (`OKU_KEY`); yalnız `all` çalışır, yazamaz, silemez.

| Komut | Ne zaman | Ne yapar |
|---|---|---|
| `node scripts/ozet.mjs gece` | her gün 00:00 | çalışılmayan günün özeti; o gün iş kaydı varsa boş |
| `node scripts/ozet.mjs vardiya` | her gün 03:30 | iş gününün özeti; değilse boş |
| `node scripts/ozet.mjs hafta` | Pazar 12:00 | haftalık özet, kumbara hedefi, borç, yaklaşan ödemeler |

Ortam: `CASHLUMA_URL`, `CASHLUMA_KEY` (salt okunur), `TZ=Europe/Istanbul`. Boş çıktı = mesaj gönderme.
