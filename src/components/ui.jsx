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

export function TxRow({ x, onClick }) {
  const gelir = x.tur === 'gelir';
  const baslik = gelir ? x.kategori : x.metin.replace(/\s*#\S+/g, '') || x.kategori;
  const alt = gelir ? x.metin || 'Gelir' : x.kategori;
  return (
    <button className={`txrow ${x.bekliyor ? 'pending' : ''}`} onClick={onClick}>
      <span className="txicon">
        <Ico n={ikonOf(x.kategori)} size={20} />
        <i style={{ background: renkOf(x.kategori) }} />
      </span>
      <span className="txmain">
        <b>{baslik}</b>
        <small>
          {x.bekliyor ? 'gönderilmeyi bekliyor' : alt} · {saat(x.tarih)}
        </small>
      </span>
      <span className={`txamt ${gelir ? 'pos' : ''} ${x.kategori === 'Diğer' && !gelir ? 'unk' : ''}`}>
        {gelir ? '+' : '−'}
        {tl(x.tutar).replace('−', '')}
      </span>
    </button>
  );
}
