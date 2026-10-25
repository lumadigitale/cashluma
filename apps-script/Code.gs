// Cashluma API v2 — "Harcama Kaydı" tablosuna bağlı Apps Script.
// Kurulum: tabloyu aç → Uzantılar → Apps Script → bu dosyayı yapıştır → kurulum() çalıştır
// → Dağıt → Dağıtımları yönet → mevcut dağıtımı düzenle → Sürüm: Yeni sürüm (adres aynı kalır).

const TABS = {
  form: 'Form Yanıtları 1', // eski Google Form yanıtları (Tarih, Metin, Tutar); yazıdan okunur
  kayit: 'Kayıtlar', // uygulamadan ve Eylem Düğmesi kestirmesinden girilenler
  sabit: 'Sabitler',
  borc: 'Borç',
  kural: 'Kurallar',
  ayar: 'Ayarlar',
};

const HEADERS = {
  kayit: ['Tarih', 'Tür', 'Açıklama', 'Tutar', 'Kategori', 'Nakit'],
  sabit: ['Ad', 'Tür', 'Tutar', 'Gün', 'Aktif', 'Birim'],
  borc: ['Tarih', 'Bakiye', 'Ödenen'],
  kural: ['Kelime', 'Kategori'],
  ayar: ['Anahtar', 'Değer'],
};

// gider · gelir · nakit_cek (ATM'den cüzdana) · kumbara (+ attım, − aldım) · sayim (cüzdanda sayılan)
const TURLER = ['gider', 'gelir', 'nakit_cek', 'kumbara', 'sayim'];

function kurulum() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach((k) => {
    let sh = ss.getSheetByName(TABS[k]);
    if (!sh) {
      sh = ss.insertSheet(TABS[k]);
      sh.appendRow(HEADERS[k]);
      sh.setFrozenRows(1);
    } else if (sh.getLastColumn() < HEADERS[k].length) {
      // v1'den kalan sekmeye eksik başlıkları ekle (Sabitler'e "Birim")
      sh.getRange(1, 1, 1, HEADERS[k].length).setValues([HEADERS[k]]);
    }
  });

  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('API_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_KEY', key);
  }
  // Hermes gibi yalnız okuması gerekenler için ikinci anahtar: yalnız "all" çalışır, yazamaz, silemez
  let oku = props.getProperty('OKU_KEY');
  if (!oku) {
    oku = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('OKU_KEY', oku);
  }
  Logger.log('Cashluma anahtarın: ' + key);
  Logger.log('Salt okunur anahtar (Hermes için): ' + oku);
}

// Her şeyi sil, başlıklar kalsın. Bilerek elle çalıştırılır (Çalıştır → sifirla).
function sifirla() {
  const ss = SpreadsheetApp.getActive();
  Object.values(TABS).forEach((name) => {
    const sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  Logger.log('Tüm kayıtlar silindi, başlıklar duruyor.');
}

// Tüm istekler POST + text/plain: tarayıcı ön kontrol (CORS preflight) yapmaz, anahtar URL'ye düşmez.
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ ok: false, error: 'bad_json' });
  }
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('API_KEY');
  const oku = props.getProperty('OKU_KEY');
  const tamYetki = !!key && body.key === key;
  const okuYetki = !!oku && body.key === oku;
  if (!tamYetki && !okuYetki) return out_({ ok: false, error: 'unauthorized' });
  if (!tamYetki && body.action !== 'all') return out_({ ok: false, error: 'salt_okunur' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (body.action) {
      case 'all':
        break;
      case 'add':
        add_(body);
        break;
      case 'delete':
        delete_(body);
        break;
      case 'rule':
        upsert_(TABS.kural, String(body.kelime).toLocaleLowerCase('tr').trim(), body.kategori);
        break;
      case 'setting':
        upsert_(TABS.ayar, body.anahtar, body.deger);
        break;
      case 'sabit_ekle':
        sabitEkle_(body);
        break;
      case 'sabit_sil':
        sabitSil_(body.ad);
        break;
      case 'borc_ekle':
        borcEkle_(body);
        break;
      default:
        return out_({ ok: false, error: 'unknown_action' });
    }
    return out_({ ok: true, data: readAll_() });
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function add_(b) {
  const tutar = Number(b.tutar);
  // kumbaradan alınan para eksi, cüzdan sayımı 0 olabilir
  const gecerli = b.tur === 'kumbara' ? tutar !== 0 : b.tur === 'sayim' ? tutar >= 0 : tutar > 0;
  if (!gecerli || isNaN(tutar)) throw new Error('tutar_gecersiz');
  if (TURLER.indexOf(b.tur) < 0) throw new Error('tur_gecersiz');
  const tarih = b.tarih ? new Date(b.tarih) : new Date();
  SpreadsheetApp.getActive()
    .getSheetByName(TABS.kayit)
    .appendRow([tarih, b.tur, String(b.metin || '').trim(), tutar, String(b.kategori || ''), b.nakit === true]);
}

// id = "<sekme>:<satır>". Satır kaymış olabilir diye tutarı da doğrularız.
function delete_(b) {
  const [sekme, rowStr] = String(b.id).split(':');
  const ad = sekme === 'form' ? TABS.form : sekme === 'kayit' ? TABS.kayit : sekme === 'borc' ? TABS.borc : null;
  if (!ad) throw new Error('silinemez');
  const sh = SpreadsheetApp.getActive().getSheetByName(ad);
  const row = Number(rowStr);
  if (!(row >= 2) || row > sh.getLastRow()) throw new Error('satir_yok');
  const kolon = sekme === 'form' ? 3 : sekme === 'kayit' ? 4 : 2;
  if (num_(sh.getRange(row, kolon).getValue()) !== Number(b.tutar)) throw new Error('satir_degismis');
  sh.deleteRow(row);
}

function sabitEkle_(b) {
  const ad = String(b.ad || '').trim();
  const tutar = Number(b.tutar);
  const gun = Math.min(31, Math.max(1, Number(b.gun) || 1));
  const birim = b.birim === 'USD' ? 'USD' : 'TL';
  if (!ad || !(tutar > 0) || (b.tur !== 'gelir' && b.tur !== 'gider')) throw new Error('sabit_gecersiz');
  sabitSil_(ad, true);
  SpreadsheetApp.getActive().getSheetByName(TABS.sabit).appendRow([ad, b.tur, tutar, gun, true, birim]);
}

function sabitSil_(ad, sessiz) {
  const sh = SpreadsheetApp.getActive().getSheetByName(TABS.sabit);
  for (let r = sh.getLastRow(); r >= 2; r--) {
    if (String(sh.getRange(r, 1).getValue()) === String(ad)) {
      sh.deleteRow(r);
      return;
    }
  }
  if (!sessiz) throw new Error('sabit_yok');
}

// Haftalık elle giriş: "kart borcum şu an X, bu hafta Y ödedim"
function borcEkle_(b) {
  const bakiye = Number(b.bakiye);
  const odenen = Number(b.odenen) || 0;
  if (!(bakiye >= 0) || odenen < 0) throw new Error('borc_gecersiz');
  SpreadsheetApp.getActive().getSheetByName(TABS.borc).appendRow([new Date(), bakiye, odenen]);
}

function upsert_(name, k, v) {
  if (!k) throw new Error('anahtar_bos');
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  const last = sh.getLastRow();
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(k)) {
        sh.getRange(i + 2, 2).setValue(v);
        return;
      }
    }
  }
  sh.appendRow([k, v]);
}

function readAll_() {
  const form = rows_(TABS.form)
    .map(({ row, c }) => ({ id: 'form:' + row, tarih: iso_(c[0]), metin: String(c[1] || '').trim(), tutar: num_(c[2]) }))
    .filter((x) => x.metin || x.tutar); // boş satırlar kurulum testidir
  const kayitlar = rows_(TABS.kayit).map(({ row, c }) => ({
    id: 'kayit:' + row,
    tarih: iso_(c[0]),
    tur: String(c[1]),
    metin: String(c[2] || '').trim(),
    tutar: num_(c[3]),
    kategori: String(c[4] || ''),
    nakit: c[5] === true || String(c[5]).toUpperCase() === 'TRUE',
  }));
  const sabitler = rows_(TABS.sabit).map(({ c }) => ({
    ad: String(c[0]),
    tur: String(c[1]),
    tutar: num_(c[2]),
    gun: Number(c[3]) || 1,
    aktif: c[4] === true || String(c[4]).toUpperCase() === 'TRUE',
    birim: String(c[5] || 'TL').toUpperCase() === 'USD' ? 'USD' : 'TL',
  }));
  const borc = rows_(TABS.borc).map(({ row, c }) => ({ id: 'borc:' + row, tarih: iso_(c[0]), bakiye: num_(c[1]), odenen: num_(c[2]) }));
  const kurallar = rows_(TABS.kural).map(({ c }) => ({ kelime: String(c[0]), kategori: String(c[1]) }));
  const ayarlar = {};
  // Tablo "2026-12-01" yazısını tarihe çevirir; UTC'ye dönerse bir gün kayar, o yüzden yerel gün olarak oku
  rows_(TABS.ayar).forEach(
    ({ c }) => (ayarlar[String(c[0])] = c[1] instanceof Date ? Utilities.formatDate(c[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : c[1]),
  );
  return { form, kayitlar, sabitler, borc, kurallar, ayarlar, okundu: new Date().toISOString() };
}

function rows_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh
    .getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn())
    .getValues()
    .map((c, i) => ({ row: i + 2, c }));
}

function iso_(v) {
  return v instanceof Date ? v.toISOString() : String(v || '');
}

// "130", "1.500", "1.500,50", "12,5", "-200" → sayı
function num_(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').trim().replace(/[^\d.,-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
