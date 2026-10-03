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

// Sigara ve İstanbulkart bilerek yok: onları düğmeyle giriyorsun, burada da olursa iki kez sayılır.
const SABIT_TOHUM = [
  ['Yurt', 'gider', 2000, 1, true],
  ['Telefon', 'gider', 1500, 1, true],
  ['Claude Pro', 'gider', 1000, 1, true],
  ['Gemini', 'gider', 200, 1, true],
  ['Spotify', 'gider', 55, 1, true],
  ['KYK', 'gelir', 4000, 6, true],
  ['Aile', 'gelir', 10000, 20, true],
];

const AYAR_TOHUM = [
  ['baslangic_ay', '2026-10'],
  ['borc_baslangic', 10000],
  ['birikim_hedefi', 15000],
  ['hedef_tarih', '2026-12-01'],
];

function kurulum() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach((k) => {
    if (!ss.getSheetByName(TABS[k])) {
      const sh = ss.insertSheet(TABS[k]);
      sh.appendRow(HEADERS[k]);
      sh.setFrozenRows(1);
    }
  });
  tohumla_(TABS.sabit, SABIT_TOHUM);
  tohumla_(TABS.ayar, AYAR_TOHUM);

  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('API_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_KEY', key);
  }
  Logger.log('Cashluma anahtarın: ' + key);
}

function tohumla_(name, rows) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (sh.getLastRow() > 1) return;
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
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
