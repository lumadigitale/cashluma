import { useState } from 'react';
import { getCfg, setCfg, demoMu } from '../api';
import { sayiOku, tl } from '../format';
import { Ico } from '../components/icons';

const HEDEFLER = [
  ['borc_baslangic', 'Kart borcu', 'Şu anki toplam borcun', 'sayi'],
  ['birikim_hedefi', 'Birikim hedefi', 'Ne kadar biriktirmek istiyorsun', 'sayi'],
  ['baslangic_ay', 'Takip başlangıcı', 'YYYY-AA, boşsa ilk kaydın ayı', 'metin'],
];

export default function Settings({ raw, yenile, islem }) {
  const [cfg, setLocal] = useState(getCfg());
  const [kayitli, setKayitli] = useState(false);

  const baglan = async (e) => {
    e.preventDefault();
    setCfg({ url: cfg.url.trim(), key: cfg.key.trim() });
    setKayitli(true);
    await yenile();
  };

  const bagli = !!(getCfg().url && getCfg().key);
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
      </form>
  );

  const gelirSabit = raw.sabitler.filter((s) => s.tur === 'gelir');
  const giderSabit = raw.sabitler.filter((s) => s.tur === 'gider');

  return (
    <>
      <header className="top">
        <h1>Ayarlar</h1>
      </header>

      {demoMu() && <p className="muted">Önizleme: örnek veri gösteriliyor.</p>}
      {!bagli && baglanti}

      <div className="card">
        <div className="card-head">
          <span className="card-title">Hedefler</span>
        </div>
        {HEDEFLER.map(([k, ad, ipucu, tip]) => (
          <HedefSatiri key={k} ad={ad} ipucu={ipucu} tip={tip} deger={raw.ayarlar[k]} kaydet={(v) => islem('setting', { anahtar: k, deger: v })} />
        ))}
      </div>

      <SabitListesi baslik="Düzenli gelirler" ornek="KYK, aile" tur="gelir" liste={gelirSabit} islem={islem} />
      <SabitListesi baslik="Sabit giderler" ornek="yurt, telefon, abonelik" tur="gider" liste={giderSabit} islem={islem} />

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
        <Olcum />
        <br />
        {raw.okundu ? `Son okuma ${new Date(raw.okundu).toLocaleString('tr-TR')}` : 'Henüz okunmadı'}
      </p>
    </>
  );
}

function HedefSatiri({ ad, ipucu, tip, deger, kaydet }) {
  const goster = deger === undefined || deger === '' ? '' : tip === 'sayi' ? tl(Number(deger)) : String(deger).slice(0, 7);
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

function SabitListesi({ baslik, ornek, tur, liste, islem }) {
  const [form, setForm] = useState(null);
  const tamam = form && form.ad.trim() && sayiOku(form.tutar) > 0 && Number(form.gun) >= 1 && Number(form.gun) <= 28;

  const ekle = (e) => {
    e.preventDefault();
    if (!tamam) return;
    islem('sabit_ekle', { ad: form.ad.trim(), tur, tutar: sayiOku(form.tutar), gun: Number(form.gun) });
    setForm(null);
  };

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">{baslik}</span>
        {!form && (
          <button className="linkbtn" onClick={() => setForm({ ad: '', tutar: '', gun: '' })}>
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
            {tl(s.tutar)}
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
            <input className="input" inputMode="decimal" placeholder="Tutar ₺" value={form.tutar} onChange={(e) => setForm({ ...form, tutar: e.target.value })} />
            <input className="input" inputMode="numeric" placeholder="Ayın kaçı (1-28)" value={form.gun} onChange={(e) => setForm({ ...form, gun: e.target.value.replace(/\D/g, '') })} />
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

// GEÇİCİ: iPhone ana ekran modunda alt menü yerleşimini teşhis için ölçüler (2026-10-03)
function Olcum() {
  const [m, setM] = useState('');
  useState(() => {
    setTimeout(() => {
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
      document.body.appendChild(p);
      const cs = getComputedStyle(p);
      const app = document.querySelector('.app')?.getBoundingClientRect();
      const nav = document.querySelector('.bottomnav')?.getBoundingClientRect();
      const st = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      setM(
        `ölçüm st=${st ? 1 : 0} iH=${innerHeight} sH=${screen.height} vv=${Math.round(window.visualViewport?.height || 0)} ` +
          `cH=${document.documentElement.clientHeight} app=${Math.round(app?.height || 0)} nav=${Math.round(nav?.top || 0)}-${Math.round(nav?.bottom || 0)} ` +
          `üst=${parseFloat(cs.paddingTop)} alt=${parseFloat(cs.paddingBottom)}`,
      );
      p.remove();
    }, 300);
  });
  return <span>{m}</span>;
}
