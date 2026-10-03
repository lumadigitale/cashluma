import { useMemo, useState } from 'react';
import { ayEkle, ayKey, ayOzeti, gunlukSeri } from '../data';
import { renkOf } from '../categorize';
import { ayAdi, tl, isaretli } from '../format';
import { Ico } from '../components/icons';

export default function Analysis({ raw, tx }) {
  const buAy = ayKey(new Date());
  const [ay, setAy] = useState(buAy);
  const o = useMemo(() => ayOzeti(raw, tx, ay), [raw, tx, ay]);
  const onceki = useMemo(() => ayOzeti(raw, tx, ayEkle(ay, -1)), [raw, tx, ay]);
  const alti = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ayOzeti(raw, tx, ayEkle(ay, i - 5))),
    [raw, tx, ay],
  );
  const gunluk = useMemo(() => gunlukSeri(tx, ay), [tx, ay]);
  const fark = o.gider - onceki.gider;

  return (
    <>
      <header className="top">
        <h1>Analiz</h1>
        <div className="monthpick">
          <button className="iconbtn" onClick={() => setAy(ayEkle(ay, -1))} aria-label="Önceki ay">
            <Ico n="chevL" size={18} />
          </button>
          <span>{ayAdi(ay)}</span>
          <button className="iconbtn" disabled={ay >= buAy} onClick={() => setAy(ayEkle(ay, 1))} aria-label="Sonraki ay">
            <Ico n="chevR" size={18} />
          </button>
        </div>
      </header>

      <div className="grid3">
        <div className="card">
          <small className="muted">Gelir</small>
          <b className="pos">{tl(o.gelir)}</b>
        </div>
        <div className="card">
          <small className="muted">Gider</small>
          <b>{tl(o.gider)}</b>
        </div>
        <div className="card">
          <small className="muted">Net</small>
          <b className={o.net >= 0 ? 'pos' : 'neg'}>{isaretli(o.net)}</b>
        </div>
      </div>

      {onceki.gider > 0 && (
        <p className="insight">
          {ayAdi(ayEkle(ay, -1))} ayına göre gider <b className={fark > 0 ? 'neg' : 'pos'}>{isaretli(fark)}</b>
          {ay === buAy && ' (ay daha bitmedi)'}
        </p>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-title">Son 6 ay</span>
          <span className="legend">
            <i className="pos-bg" /> gelir <i className="neg-bg" /> gider
          </span>
        </div>
        <Bars6 data={alti} secili={ay} />
      </div>

      <div className="card list">
        <div className="card-head">
          <span className="card-title">Kategoriler</span>
          <span className="muted">{tl(o.gider)}</span>
        </div>
        {o.kategoriler.length === 0 && <p className="muted">Bu ay gider yok.</p>}
        {o.kategoriler.map((k) => (
          <div className="catbar" key={k.ad}>
            <div className="catrow">
              <i style={{ background: renkOf(k.ad) }} />
              <span>{k.ad}</span>
              <span className="muted">%{Math.round((k.tutar / o.gider) * 100)}</span>
              <b>{tl(k.tutar)}</b>
            </div>
            <div className="bar">
              <div style={{ width: `${(k.tutar / o.kategoriler[0].tutar) * 100}%`, background: renkOf(k.ad) }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Günlük harcama</span>
          <span className="muted">sabitler hariç</span>
        </div>
        <Daily data={gunluk} />
      </div>

      {o.gelirTurleri.length > 0 && (
        <div className="card list">
          <div className="card-head">
            <span className="card-title">Gelir kaynakları</span>
          </div>
          {o.gelirTurleri.map((k) => (
            <div className="catrow" key={k.ad}>
              <i style={{ background: renkOf(k.ad) }} />
              <span>{k.ad}</span>
              <b className="pos">{tl(k.tutar)}</b>
            </div>
          ))}
        </div>
      )}

      {o.haric.length > 0 && (
        <div className="card list">
          <div className="card-head">
            <span className="card-title">Harcama sayılmayanlar</span>
          </div>
          {o.haric.map((x) => (
            <div className="catrow" key={x.id}>
              <i style={{ background: renkOf(x.kategori) }} />
              <span>
                {x.metin} <span className="muted">· {x.kategori}</span>
              </span>
              <b>{tl(x.tutar)}</b>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Bars6({ data, secili }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.gelir, d.gider]));
  const W = 320, H = 140, bw = 14;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 22}`}>
      {data.map((d, i) => {
        const x = 18 + i * ((W - 36) / 5);
        const hg = (d.gelir / max) * H;
        const hd = (d.gider / max) * H;
        return (
          <g key={d.ay} opacity={d.ay === secili ? 1 : 0.55}>
            <rect x={x - bw - 1} y={H - hg} width={bw} height={Math.max(hg, 1)} rx="4" fill="var(--pos)" />
            <rect x={x + 1} y={H - hd} width={bw} height={Math.max(hd, 1)} rx="4" fill="var(--neg)" />
            <text x={x} y={H + 16} textAnchor="middle">
              {ayAdi(d.ay, false)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Daily({ data }) {
  const max = Math.max(1, ...data.map((d) => d.tutar));
  const W = 320, H = 90;
  const bw = W / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 18}`}>
      {data.map((d, i) => {
        const h = (d.tutar / max) * H;
        return (
          <g key={d.gun}>
            <rect x={i * bw + 1.5} y={H - h} width={bw - 3} height={Math.max(h, 1.5)} rx="2" fill={d.tutar ? 'var(--accent)' : 'var(--line)'}>
              <title>{`${d.gun}: ${tl(d.tutar)}`}</title>
            </rect>
            {(d.gun === 1 || d.gun % 5 === 0) && (
              <text x={i * bw + bw / 2} y={H + 14} textAnchor="middle">
                {d.gun}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
