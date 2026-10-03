// Cashluma API — "Harcama Kaydı" tablosuna bağlı Apps Script.
// Kurulum: tabloyu aç → Uzantılar → Apps Script → bu dosyayı yapıştır → kurulum() çalıştır
// → Dağıt → Yeni dağıtım → Web uygulaması (Ben olarak yürüt, Herkes erişebilir).

const TABS = {
  gider: 'Form Yanıtları 1', // iPhone Eylem Düğmesi kestirmesi buraya yazar
  gelir: 'Gelirler',
  sabit: 'Sabitler',
  kural: 'Kurallar',
  ayar: 'Ayarlar',
};

const HEADERS = {
  gelir: ['Tarih', 'Açıklama', 'Tutar', 'Tür'],
  sabit: ['Ad', 'Tür', 'Tutar', 'Gün', 'Aktif'],
  kural: ['Kelime', 'Kategori'],
  ayar: ['Anahtar', 'Değer'],
};

function kurulum() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach((k) => {
    if (!ss.getSheetByName(TABS[k])) {
      const sh = ss.insertSheet(TABS[k]);
      sh.appendRow(HEADERS[k]);
      sh.setFrozenRows(1);
    }
  });

  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('API_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_KEY', key);
  }
  Logger.log('Cashluma anahtarın: ' + key);
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
  const key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!key || body.key !== key) return out_({ ok: false, error: 'unauthorized' });

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
  if (!(tutar > 0)) throw new Error('tutar_gecersiz');
  const tarih = b.tarih ? new Date(b.tarih) : new Date();
  const ss = SpreadsheetApp.getActive();
  if (b.tur === 'gider') {
    ss.getSheetByName(TABS.gider).appendRow([tarih, String(b.metin || '').trim(), tutar]);
  } else if (b.tur === 'gelir') {
    ss.getSheetByName(TABS.gelir).appendRow([tarih, String(b.metin || '').trim(), tutar, b.kategori || 'Diğer']);
  } else {
    throw new Error('tur_gecersiz');
  }
}

// id = "<tür>:<satır>". Satır kaymış olabilir diye tutarı da doğrularız.
function delete_(b) {
  const [tur, rowStr] = String(b.id).split(':');
  if (tur !== 'gider' && tur !== 'gelir') throw new Error('silinemez');
  const sh = SpreadsheetApp.getActive().getSheetByName(TABS[tur]);
  const row = Number(rowStr);
  if (!(row >= 2) || row > sh.getLastRow()) throw new Error('satir_yok');
  const tutar = num_(sh.getRange(row, 3).getValue());
  if (tutar !== Number(b.tutar)) throw new Error('satir_degismis');
  sh.deleteRow(row);
}

function sabitEkle_(b) {
  const ad = String(b.ad || '').trim();
  const tutar = Number(b.tutar);
  const gun = Math.min(28, Math.max(1, Number(b.gun) || 1));
  if (!ad || !(tutar > 0) || (b.tur !== 'gelir' && b.tur !== 'gider')) throw new Error('sabit_gecersiz');
  sabitSil_(ad, true);
  SpreadsheetApp.getActive().getSheetByName(TABS.sabit).appendRow([ad, b.tur, tutar, gun, true]);
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
  const giderler = rows_(TABS.gider)
    .map(({ row, c }) => ({ id: 'gider:' + row, tarih: iso_(c[0]), metin: String(c[1] || '').trim(), tutar: num_(c[2]) }))
    .filter((x) => x.metin || x.tutar); // boş satırlar kurulum testidir
  const gelirler = rows_(TABS.gelir).map(({ row, c }) => ({
    id: 'gelir:' + row,
    tarih: iso_(c[0]),
    metin: String(c[1] || '').trim(),
    tutar: num_(c[2]),
    kategori: String(c[3] || 'Diğer'),
  }));
  const sabitler = rows_(TABS.sabit).map(({ c }) => ({
    ad: String(c[0]),
    tur: String(c[1]),
    tutar: num_(c[2]),
    gun: Number(c[3]) || 1,
    aktif: c[4] === true || String(c[4]).toUpperCase() === 'TRUE',
  }));
  const kurallar = rows_(TABS.kural).map(({ c }) => ({ kelime: String(c[0]), kategori: String(c[1]) }));
  const ayarlar = {};
  rows_(TABS.ayar).forEach(({ c }) => (ayarlar[String(c[0])] = c[1] instanceof Date ? iso_(c[1]) : c[1]));
  return { giderler, gelirler, sabitler, kurallar, ayarlar, okundu: new Date().toISOString() };
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

// "130", "1.500", "1.500,50", "12,5" → sayı
function num_(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').trim().replace(/[^\d.,-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
