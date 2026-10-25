import { useState } from 'react';
import { getCfg, setCfg, demoMu } from '../api';
import { sayiOku, tl } from '../format';
import { Ico } from '../components/icons';

const HEDEFLER = [
  ['kumbara_hedefi', 'Kumbara hedefi', 'Ne kadar biriktirmek istiyorsun', 'sayi'],
  ['kumbara_tarih', 'Hedef tarihi', 'YYYY-AA-GG', 'tarih'],
  ['is_adi', 'İş düğmesinin adı', 'Ör. iş yerinin adı (boşsa "İş")', 'metin'],
  ['is_ucret', 'Günlük ücret', 'Bir vardiya kaç ₺', 'sayi'],
  ['sigara_metin', 'Sigara kaydının yazısı', 'Ör. markası (boşsa "Sigara")', 'metin'],
  ['sigara_fiyat', 'Sigara düğmesi', 'Bir paket kaç ₺', 'sayi'],
  ['baslangic_ay', 'Takip başlangıcı', 'YYYY-AA, boşsa ilk kaydın ayı', 'ay'],
];

export default function Settings({ raw, kur, yenile, islem }) {
  const [cfg, setLocal] = useState(getCfg());
  const [kayitli, setKayitli] = useState(false);

  const baglan = async (e) => {
    e.preventDefault();
    setCfg({ url: cfg.url.trim(), key: cfg.key.trim() });
    setKayitli(true);
    await yenile();
  };

  const bagli = !!(getCfg().url && getCfg().key);

  // CetOS ana ekran uygulaması Cashluma'nın depolamasını göremez (iPhone her ana ekran uygulamasını ayırır);
  // bağlantı panoya kopyalanır, CetOS Ayarlar'a yapıştırılır.
  const [kopyalandi, setKopyalandi] = useState(false);
  const cetosKopyala = async () => {
    const { url, key } = getCfg();
    await navigator.clipboard.writeText(JSON.stringify({ cashluma: 1, url, key }));
    setKopyalandi(true);
  };
  const baglanti = (
      <form className="card" onSubmit={baglan} style={{ gap: 12 }}>
        <span className="card-title">Google Sheets bağlantısı</span>
        <label className="field">
          <small>Apps Script adresi (/exec)</small>
          <input className="input" value={cfg.url} onChange={(e) => setLocal({ ...cfg, url: e.target.value })} autoCapitalize="off" autoCorrect="off" />
        </label>
        <label className="field">
          <small>Anahtar</small>
          <input className="input" type="password" value={cfg.key} onChange={(e) => setLocal({ ...cfg, key: e.target.value })} autoCapitalize="off" autoCorrect="off" />
        </label>
        <button className="btn white">{kayitli ? 'Kaydedildi, yeniden bağlan' : 'Kaydet ve bağlan'}</button>
        <small className="muted">Adres ve anahtar yalnız bu telefonda saklanır.</small>
        {bagli && (
          <button type="button" className="btn dark" onClick={cetosKopyala}>
            {kopyalandi ? 'Kopyalandı, CetOS Ayarlar’a yapıştır' : 'CetOS için kopyala'}
          </button>
        )}
      </form>
  );

  const gelirSabit = raw.sabitler.filter((s) => s.tur === 'gelir');
  const giderSabit = raw.sabitler.filter((s) => s.tur === 'gider');

  return (
    <>
      <header className="top">
        <h1>Ayarlar</h1>
      </header>

      {demoMu() && <p className="muted">Önizleme: bellekte geçici tablo, yenileyince sıfırlanır.</p>}
      {!bagli && baglanti}

      <div className="card">
        <div className="card-head">
          <span className="card-title">Hedef ve düğmeler</span>
        </div>
        {HEDEFLER.map(([k, ad, ipucu, tip]) => (
          <HedefSatiri key={k} ad={ad} ipucu={ipucu} tip={tip} deger={raw.ayarlar[k]} kaydet={(v) => islem('setting', { anahtar: k, deger: v })} />
        ))}
      </div>

      <SabitListesi baslik="Düzenli gelirler" ornek="burs, aile desteği" tur="gelir" liste={gelirSabit} islem={islem} kur={kur} />
      <SabitListesi baslik="Sabit giderler" ornek="kira, telefon, abonelik" tur="gider" liste={giderSabit} islem={islem} kur={kur} />

      {raw.kurallar.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Öğrettiğin kelimeler</span>
          </div>
          {raw.kurallar.map((r) => (
            <div className="catrow" key={r.kelime}>
              <span>{r.kelime}</span>
              <b>{r.kategori}</b>
            </div>
          ))}
        </div>
      )}

      {bagli && baglanti}

      <p className="muted center">
        Sürüm {__SURUM__}
        <br />
        {kur ? `1 $ = ${kur.deger.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺ · ${new Date(kur.zaman).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Dolar kuru henüz alınamadı'}
        <br />
        {raw.okundu ? `Son okuma ${new Date(raw.okundu).toLocaleString('tr-TR')}` : 'Henüz okunmadı'}
      </p>
    </>
  );
}

function HedefSatiri({ ad, ipucu, tip, deger, kaydet }) {
  const goster = deger === undefined || deger === '' ? '' : tip === 'sayi' ? tl(Number(deger)) : tip === 'metin' ? String(deger) : String(deger).slice(0, tip === 'tarih' ? 10 : 7);
  const [acik, setAcik] = useState(false);
  const [v, setV] = useState('');

  if (!acik)
    return (
      <button className="catrow" style={{ minHeight: 44 }} onClick={() => (setV(deger ?? ''), setAcik(true))}>
        <span>{ad}</span>
        <b className={goster ? '' : 'muted'}>{goster || 'Gir'}</b>
      </button>
    );
  return (
    <form
      className="row"
      style={{ padding: '6px 0' }}
      onSubmit={(e) => {
        e.preventDefault();
        kaydet(tip === 'sayi' ? sayiOku(v) : String(v).trim());
        setAcik(false);
      }}
    >
      <input className="input" autoFocus inputMode={tip === 'sayi' ? 'decimal' : 'text'} placeholder={ipucu} value={v} onChange={(e) => setV(e.target.value)} />
      <button className="btn white" style={{ flex: '0 0 84px', height: 46 }}>
        Kaydet
      </button>
    </form>
  );
}

function SabitListesi({ baslik, ornek, tur, liste, islem, kur }) {
  const [form, setForm] = useState(null);
  const tamam = form && form.ad.trim() && sayiOku(form.tutar) > 0 && Number(form.gun) >= 1 && Number(form.gun) <= 31;

  const ekle = (e) => {
    e.preventDefault();
    if (!tamam) return;
    islem('sabit_ekle', { ad: form.ad.trim(), tur, tutar: sayiOku(form.tutar), gun: Number(form.gun), birim: form.birim });
    setForm(null);
  };

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">{baslik}</span>
        {!form && (
          <button className="linkbtn" onClick={() => setForm({ ad: '', tutar: '', gun: '', birim: 'TL' })}>
            + Ekle
          </button>
        )}
      </div>
      {liste.length === 0 && !form && <span className="muted">Henüz yok ({ornek}). Her ay kendiliğinden sayılır.</span>}
      {liste.map((s) => (
        <div className="catrow" key={s.ad}>
          <span>
            {s.ad} <span className="muted">· her ayın {s.gun}. günü</span>
          </span>
          <b className={tur === 'gelir' ? 'pos' : ''}>
            {tur === 'gelir' ? '+' : '−'}
            {s.birim === 'USD' ? `$${s.tutar}` : tl(s.tutar)}
            {s.birim === 'USD' && kur && <span className="muted"> ≈{tl(s.tutar * kur.deger)}</span>}
          </b>
          <button className="delbtn" aria-label={`${s.ad} sil`} onClick={() => confirm(`${s.ad} silinsin mi?`) && islem('sabit_sil', { ad: s.ad })}>
            <Ico n="x" size={16} />
          </button>
        </div>
      ))}
      {form && (
        <form onSubmit={ekle} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          <input className="input" autoFocus placeholder="Ad" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} />
          <div className="row">
            <input className="input" inputMode="decimal" placeholder={form.birim === 'USD' ? 'Tutar $' : 'Tutar ₺'} value={form.tutar} onChange={(e) => setForm({ ...form, tutar: e.target.value })} />
            <input className="input" inputMode="numeric" placeholder="Ayın kaçı (1-31)" value={form.gun} onChange={(e) => setForm({ ...form, gun: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div className="seg">
            <button type="button" className={form.birim === 'TL' ? 'on' : ''} onClick={() => setForm({ ...form, birim: 'TL' })}>
              ₺ TL
            </button>
            <button type="button" className={form.birim === 'USD' ? 'on' : ''} onClick={() => setForm({ ...form, birim: 'USD' })}>
              $ Dolar
            </button>
          </div>
          <div className="row">
            <button type="button" className="btn dark" onClick={() => setForm(null)}>
              Vazgeç
            </button>
            <button className="btn white" disabled={!tamam}>
              Ekle
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
