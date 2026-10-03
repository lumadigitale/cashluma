import { useEffect, useRef, useState } from 'react';
import { KATEGORILER, GELIR_TURLERI } from '../categorize';
import { sayiOku, tl } from '../format';
import { Ico } from './icons';

const GIDER_SECIM = KATEGORILER.filter((k) => !['Sabit', 'Diğer', 'Alacak'].includes(k.ad));

export default function AddSheet({ tur: ilkTur, kapat, kaydet }) {
  const [tur, setTur] = useState(ilkTur);
  const [tutar, setTutar] = useState('');
  const [kategori, setKategori] = useState(ilkTur === 'gelir' ? 'Bar günlüğü' : '');
  const [metin, setMetin] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, [tur]);

  const turDegis = (t) => {
    setTur(t);
    setKategori(t === 'gelir' ? 'Bar günlüğü' : '');
  };

  const n = sayiOku(tutar);
  // Gider: yazı ya da kategori yeter. Yazı boşsa kategori adı yazılır ki düğme kayıtlarıyla aynı biçimde dursun.
  const tamam = n > 0 && (tur === 'gelir' ? !!kategori : !!(metin.trim() || kategori));

  const gonder = (e) => {
    e.preventDefault();
    if (!tamam) return;
    if (tur === 'gider') {
      const m = metin.trim();
      kaydet({ tur, tutar: n, metin: m || kategori, kategoriIpucu: kategori });
    } else {
      kaydet({ tur, tutar: n, metin: metin.trim(), kategori });
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

        <label className={`amount ${tur}`}>
          <span>₺</span>
          <input
            ref={ref}
            inputMode="decimal"
            placeholder="0"
            value={tutar}
            onChange={(e) => setTutar(e.target.value.replace(/[^\d.,]/g, ''))}
          />
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

        <button className="btn white" disabled={!tamam}>
          {tamam ? `${tl(n)} ${tur === 'gider' ? 'gider' : 'gelir'} kaydet` : 'Tutar gir'}
        </button>
      </form>
    </div>
  );
}
