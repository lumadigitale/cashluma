import { useState } from 'react';
import { getCfg, setCfg, demoMu } from '../api';
import { tl } from '../format';

const AYAR_ALANLARI = [
  ['borc_baslangic', 'Kart borcu (başlangıç)', 'sayi'],
  ['birikim_hedefi', 'Eve çıkış birikim hedefi', 'sayi'],
  ['hedef_tarih', 'Hedef tarih', 'metin'],
  ['baslangic_ay', 'Takip başlangıç ayı (YYYY-AA)', 'metin'],
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

  const ayarDegis = (anahtar, tip) => {
    const eski = raw.ayarlar[anahtar] ?? '';
    const v = prompt('Yeni değer', String(eski));
    if (v === null || v === String(eski)) return;
    islem('setting', { anahtar, deger: tip === 'sayi' ? Number(v.replace(/\./g, '').replace(',', '.')) || 0 : v.trim() });
  };

  return (
    <>
      <header className="top">
        <h1>Ayarlar</h1>
      </header>

      {demoMu() && <p className="banner static">Önizleme modu: örnek veri gösteriliyor. Bağlantıyı kurunca gerçek tablon gelir.</p>}

      <form className="card form" onSubmit={baglan}>
        <div className="card-head">
          <b>Google Sheets bağlantısı</b>
        </div>
        <label>
          <small>Apps Script web uygulaması adresi</small>
          <input
            value={cfg.url}
            placeholder="https://script.google.com/macros/s/…/exec"
            onChange={(e) => setLocal({ ...cfg, url: e.target.value })}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>
        <label>
          <small>Anahtar</small>
          <input
            type="password"
            value={cfg.key}
            onChange={(e) => setLocal({ ...cfg, key: e.target.value })}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>
        <button className="primary big">{kayitli ? 'Kaydedildi, yeniden bağlan' : 'Kaydet ve bağlan'}</button>
        <small className="muted">Adres ve anahtar yalnız bu telefonda saklanır.</small>
      </form>

      <div className="card list">
        <div className="card-head">
          <b>Hedefler</b>
          <span className="muted">dokun, değiştir</span>
        </div>
        {AYAR_ALANLARI.map(([k, ad, tip]) => (
          <button className="catrow tap" key={k} onClick={() => ayarDegis(k, tip)}>
            <span>{ad}</span>
            <b>{raw.ayarlar[k] === undefined ? '—' : tip === 'sayi' ? tl(Number(raw.ayarlar[k])) : String(raw.ayarlar[k]).slice(0, 10)}</b>
          </button>
        ))}
      </div>

      <div className="card list">
        <div className="card-head">
          <b>Sabit gelir ve giderler</b>
          <span className="muted">tablodaki “Sabitler” sekmesinden</span>
        </div>
        {raw.sabitler.map((s) => (
          <div className={`catrow ${s.aktif ? '' : 'off'}`} key={s.ad}>
            <span>
              {s.ad} <span className="muted">· her ayın {s.gun}’i</span>
            </span>
            <b className={s.tur === 'gelir' ? 'pos' : ''}>
              {s.tur === 'gelir' ? '+' : '−'}
              {tl(s.tutar)}
            </b>
          </div>
        ))}
      </div>

      {raw.kurallar.length > 0 && (
        <div className="card list">
          <div className="card-head">
            <b>Öğrettiğin kelimeler</b>
          </div>
          {raw.kurallar.map((r) => (
            <div className="catrow" key={r.kelime}>
              <span>{r.kelime}</span>
              <b>{r.kategori}</b>
            </div>
          ))}
        </div>
      )}

      <p className="muted center">
        Cashluma · {raw.okundu ? `son okuma ${new Date(raw.okundu).toLocaleString('tr-TR')}` : 'henüz okunmadı'}
      </p>
    </>
  );
}
