# Cashluma

Kişisel gelir-gider paneli. iPhone'da "Ana Ekrana Ekle" ile uygulama gibi çalışan bir PWA.
Veriler Google Sheets'te durur; arada küçük bir Apps Script köprüsü var.

```
iPhone Eylem Düğmesi ──► Google Form ──► "Harcama Kaydı" tablosu ◄──► Apps Script ◄──► Cashluma (PWA)
```

## Özellikler
- Ay neti (gelir − gider), bugün harcanan, kategori dağılımı
- Serbest yazıdan otomatik kategori ("kola zero bar" → İçecek); tanımadığını sorar, öğrenir
- Sabit gelir/giderler (KYK, yurt, abonelikler) her ay kendiliğinden sayılır
- Gece vardiyası kuralı: 05:00'ten önceki işlem önceki güne yazılır
- Kart borcu ve birikim hedefi takibi
- Çevrimdışı: internet yokken girilen kayıt kuyrukta bekler, bağlantı gelince gider

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
