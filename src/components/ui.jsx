import { parcala, tl, saat } from '../format';
import { renkOf, ikonOf } from '../categorize';
import { Ico } from './icons';

export function Money({ n }) {
  const p = parcala(n);
  return (
    <>
      {p.eksi && '−'}₺{p.tam}
      <small>,{p.kurus}</small>
    </>
  );
}

export function Progress({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="progress">
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pills({ items }) {
  const total = items.reduce((s, x) => s + x.tutar, 0);
  if (!total)
    return (
      <div className="pills empty">
        <i />
      </div>
    );
  return (
    <div className="pills">
      {items.slice(0, 5).map((x) => (
        <i key={x.ad} style={{ flex: `${Math.sqrt(x.tutar)} 1 0`, background: renkOf(x.ad) }} />
      ))}
    </div>
  );
}

// Gider dışı kayıtların görünüşü
const TUR = {
  nakit_cek: { baslik: 'Nakit çekildi', alt: 'cüzdana', ikon: 'wallet', isaret: '' },
  kumbara: { baslik: 'Kumbara', alt: 'kumbaraya attım', ikon: 'piggy', isaret: '' },
  sayim: { baslik: 'Cüzdan sayıldı', alt: 'sayım', ikon: 'wallet', isaret: '' },
};

export function TxRow({ x, onClick }) {
  const gelir = x.tur === 'gelir';
  const ozel = TUR[x.tur];
  let baslik, alt, ikon, renk, tutar;
  if (ozel) {
    baslik = x.tur === 'kumbara' && x.tutar < 0 ? 'Kumbaradan aldım' : ozel.baslik;
    alt = x.tur === 'kumbara' && x.tutar < 0 ? 'harcama sayılmaz' : x.kayip ? `${tl(x.kayip)} eksik çıktı` : ozel.alt;
    ikon = ozel.ikon;
    renk = '#636366';
    tutar = tl(Math.abs(x.tutar)).replace('−', '');
  } else {
    baslik = gelir ? x.kategori : x.metin.replace(/\s*#\S+/g, '') || x.kategori;
    alt = gelir ? x.metin || 'Gelir' : x.kategori;
    if (x.nakit) alt += ' · nakit';
    ikon = ikonOf(x.kategori);
    renk = renkOf(x.kategori);
    tutar = (gelir ? '+' : '−') + tl(x.tutar).replace('−', '');
  }
  return (
    <button className={`txrow ${x.bekliyor ? 'pending' : ''}`} onClick={onClick}>
      <span className="txicon">
        <Ico n={ikon} size={20} />
        <i style={{ background: renk }} />
      </span>
      <span className="txmain">
        <b>{baslik}</b>
        <small>
          {x.bekliyor ? 'gönderilmeyi bekliyor' : alt} · {saat(x.tarih)}
        </small>
      </span>
      <span className={`txamt ${gelir ? 'pos' : ''} ${x.kategori === 'Diğer' && x.tur === 'gider' ? 'unk' : ''}`}>{tutar}</span>
    </button>
  );
}
