import { useEffect, useRef, useState } from 'react';
import { KATEGORILER, gelirTurleri, isAdi } from '../categorize';
import { sayiOku, tl } from '../format';
import { Ico } from './icons';

const GIDER_SECIM = KATEGORILER.filter((k) => !['Sabit', 'Diğer', 'Alacak', 'Kayıp nakit'].includes(k.ad));

export default function AddSheet({ tur: ilkTur, kapat, kaydet, ayarlar = {} }) {
  const [tur, setTur] = useState(ilkTur);
  // Gelir açılınca iş seçili ve Ayarlar'daki günlük ücret dolu gelir (en sık kayıt)
  const isUcret = Number(ayarlar.is_ucret) ? String(ayarlar.is_ucret) : '';
  const GELIR_TURLERI = gelirTurleri(ayarlar);
  const [tutar, setTutar] = useState(ilkTur === 'gelir' ? isUcret : '');
  const [kategori, setKategori] = useState(ilkTur === 'gelir' ? isAdi(ayarlar) : '');
  const [metin, setMetin] = useState('');
  const [nakit, setNakit] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, [tur]);

  const turDegis = (t) => {
    setTur(t);
    setKategori(t === 'gelir' ? isAdi(ayarlar) : '');
    setTutar(t === 'gelir' ? isUcret : '');
    setNakit(false);
  };

  const n = sayiOku(tutar);
  // Gider: yazı ya da kategori yeter. Yazı boşsa kategori adı yazılır ki düğme kayıtlarıyla aynı biçimde dursun.
  const tamam = n > 0 && (tur === 'gelir' ? !!kategori : !!(metin.trim() || kategori));
  const gelirNakit = GELIR_TURLERI.find((k) => k.ad === kategori)?.nakit;

  const gonder = (e) => {
    e.preventDefault();
    if (!tamam) return;
    if (tur === 'gider') {
      const m = metin.trim();
      kaydet({ tur, tutar: n, metin: m || kategori, kategoriIpucu: kategori, nakit });
    } else {
      kaydet({ tur, tutar: n, metin: metin.trim(), kategori, nakit: !!gelirNakit });
    }
  };

  const secenekler = tur === 'gider' ? GIDER_SECIM : GELIR_TURLERI;

  return (
    <div className="sheet-backdrop" onClick={kapat}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={gonder}>
        <div className="grabber" />
        <div className="seg">
          <button type="button" className={tur === 'gider' ? 'on' : ''} onClick={() => turDegis('gider')}>
            Gider
          </button>
          <button type="button" className={tur === 'gelir' ? 'on' : ''} onClick={() => turDegis('gelir')}>
            Gelir
          </button>
        </div>

        <label className="amount">
          <span>₺</span>
          <input ref={ref} inputMode="decimal" placeholder="0" value={tutar} onChange={(e) => setTutar(e.target.value.replace(/[^\d.,]/g, ''))} />
        </label>

        <div className="chips">
          {secenekler.map((k) => (
            <button
              type="button"
              key={k.ad}
              className={`chip ${kategori === k.ad ? 'on' : ''}`}
              onClick={() => {
                setKategori(kategori === k.ad ? '' : k.ad);
                if (k.varsayilan && !tutar) setTutar(String(k.varsayilan));
              }}
            >
              <Ico n={k.ikon} size={16} /> {k.ad}
            </button>
          ))}
        </div>

        <input
          className="input"
          placeholder={tur === 'gider' ? 'Ne aldın? (örn. döner, taksi eve)' : 'Not (isteğe bağlı)'}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
        />

        {tur === 'gider' && (
          <div className="seg">
            <button type="button" className={!nakit ? 'on' : ''} onClick={() => setNakit(false)}>
              Kart
            </button>
            <button type="button" className={nakit ? 'on' : ''} onClick={() => setNakit(true)}>
              Nakit
            </button>
          </div>
        )}
        {tur === 'gelir' && gelirNakit && <small className="muted center">Bahşiş cüzdana eklenir.</small>}

        <button className="btn white" disabled={!tamam}>
          {tamam ? `${tl(n)} ${tur === 'gider' ? (nakit ? 'nakit gider' : 'gider') : 'gelir'} kaydet` : 'Tutar gir'}
        </button>
      </form>
    </div>
  );
}
