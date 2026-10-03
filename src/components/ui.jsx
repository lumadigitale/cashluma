import { parcala, tl, saat } from '../format';
import { renkOf, ikonOf } from '../categorize';

export function Money({ n, size = 'xl' }) {
  const p = parcala(n);
  return (
    <span className={`money money-${size}`}>
      {p.eksi && '−'}₺{p.tam}
      <small>,{p.kurus}</small>
    </span>
  );
}

export function Progress({ value, max, renk = 'var(--accent)' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="progress">
      <div style={{ width: `${pct}%`, background: renk }} />
    </div>
  );
}

export function SegmentBar({ items }) {
  const total = items.reduce((s, x) => s + x.tutar, 0);
  if (!total) return <div className="segbar empty" />;
  return (
    <div className="segbar">
      {items.map((x) => (
        <div key={x.ad} title={x.ad} style={{ flexGrow: x.tutar, background: renkOf(x.ad) }} />
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
      <span className="txicon" style={{ background: renkOf(x.kategori) + '26', color: renkOf(x.kategori) }}>
        {ikonOf(x.kategori)}
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

export const Icon = {
  home: (
    <svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
  ),
  list: (
    <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V4M19 20v-6" /></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
  ),
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  minus: <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>,
  refresh: (
    <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
  ),
  search: (
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  chevL: <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>,
  chevR: <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>,
};
