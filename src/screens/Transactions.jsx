import { useMemo, useState } from 'react';
import { gunKey } from '../data';
import { KATEGORILER, anahtarKelime } from '../categorize';
import { gunBasligi, tl } from '../format';
import { TxRow } from '../components/ui';
import { Ico } from '../components/icons';

const FILTRELER = [
  ['tum', 'Tümü'],
  ['gider', 'Gider'],
  ['gelir', 'Gelir'],
  ['tanimsiz', 'Tanınmayan'],
];

const ATANABILIR = KATEGORILER.filter((k) => k.ad !== 'Sabit');

export default function Transactions({ tx, filtre, setFiltre, islem }) {
  const [ara, setAra] = useState('');
  const [secili, setSecili] = useState(null);

  const liste = useMemo(() => {
    const q = ara.toLocaleLowerCase('tr');
    return tx.filter((x) => {
      if (filtre === 'gider' && x.tur !== 'gider') return false;
      if (filtre === 'gelir' && x.tur !== 'gelir') return false;
      if (filtre === 'tanimsiz' && !(x.tur === 'gider' && x.kategori === 'Diğer')) return false;
      if (q && !`${x.metin} ${x.kategori}`.toLocaleLowerCase('tr').includes(q)) return false;
      return true;
    });
  }, [tx, filtre, ara]);

  const gruplar = useMemo(() => {
    const m = new Map();
    liste.forEach((x) => {
      const k = gunKey(x.tarih);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    });
    return [...m.entries()];
  }, [liste]);

  const ogret = async (kategori) => {
    const x = secili;
    setSecili(null);
    await islem('rule', { kelime: anahtarKelime(x.metin), kategori });
  };

  const sil = async () => {
    const x = secili;
    setSecili(null);
    if (confirm(`${x.metin || x.kategori} · ${tl(x.tutar)} silinsin mi?`)) await islem('delete', { id: x.id, tutar: x.tutar });
  };

  return (
    <>
      <header className="top">
        <h1>İşlemler</h1>
      </header>
      <label className="search">
        <Ico n="search" size={18} />
        <input placeholder="Ara" value={ara} onChange={(e) => setAra(e.target.value)} />
      </label>
      <div className="chips scroll">
        {FILTRELER.map(([k, ad]) => (
          <button key={k} className={`chip ${filtre === k ? 'on' : ''}`} onClick={() => setFiltre(k)}>
            {ad}
          </button>
        ))}
      </div>

      {gruplar.length === 0 && <p className="muted empty">Bu filtrede kayıt yok.</p>}
      {gruplar.map(([gun, items]) => {
        const gider = items.filter((x) => x.tur === 'gider').reduce((s, x) => s + x.tutar, 0);
        return (
          <div className="panel" key={gun}>
            <div className="card-head">
              <span className="card-title">{gunBasligi(gun)}</span>
              {gider > 0 && <span className="muted">−{tl(gider)}</span>}
            </div>
            {items.map((x) => (
              <TxRow key={x.id} x={x} onClick={() => !x.bekliyor && setSecili(x)} />
            ))}
          </div>
        );
      })}

      {secili && (
        <div className="sheet-backdrop" onClick={() => setSecili(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <h3>{secili.metin || secili.kategori}</h3>
            <p className="muted">
              {tl(secili.tutar)} · {secili.kategori}
            </p>
            {secili.tur === 'gider' && (
              <>
                <small className="muted">“{anahtarKelime(secili.metin)}” hangi kategori?</small>
                <div className="chips">
                  {ATANABILIR.map((k) => (
                    <button
                      key={k.ad}
                      className={`chip ${secili.kategori === k.ad ? 'on' : ''}`}
                      onClick={() => ogret(k.ad)}
                    >
                      <Ico n={k.ikon} size={16} /> {k.ad}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button className="btn red" onClick={sil}>
              Sil
            </button>
          </div>
        </div>
      )}
    </>
  );
}
