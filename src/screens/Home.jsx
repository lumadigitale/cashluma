import { useMemo } from 'react';
import { ayKey, ayOzeti, birikim, borcDurumu, gunKey, gunToplami, etkinTarih } from '../data';
import { renkOf, ikonOf } from '../categorize';
import { ayAdi, tl } from '../format';
import { Money, Pills, Progress, TxRow } from '../components/ui';
import { Ico } from '../components/icons';

export default function Home({ raw, tx, yenile, ekle, git, tanimsiz }) {
  const bugun = new Date();
  const ay = ayKey(bugun);
  const ayIsim = ayAdi(ay);
  const o = useMemo(() => ayOzeti(raw, tx, ay, bugun), [raw, tx, ay]);
  const borc = useMemo(() => borcDurumu(raw, tx), [raw, tx]);
  const bir = useMemo(() => birikim(raw, tx, bugun), [raw, tx]);
  const bugunHarcanan = gunToplami(tx, gunKey(bugun));
  const gecenGun = etkinTarih(bugun).getDate();
  const ortalama = o.degiskenGider / gecenGun;
  const siradaki = o.bekleyen[0];
  const son = tx.slice(0, 5);

  return (
    <>
      <section className="wallet">
        <div className="wallet-head">
          <b>Cashluma</b>
          <button onClick={() => ekle('gider')} aria-label="Kayıt ekle">
            <Ico n="plus" size={22} />
          </button>
        </div>
        <div className="name">Mehmet</div>
        <div className="amount-big">
          <Money n={o.net} />
        </div>
        <div className="wallet-foot">
          <span>{ayIsim.charAt(0).toLocaleUpperCase('tr') + ayIsim.slice(1)} neti</span>
          <span>
            ↑ {tl(o.gelir)} &nbsp; ↓ {tl(o.gider)}
          </span>
        </div>
      </section>

      <div className="grid2">
        <button className="card" onClick={() => git('analysis')}>
          <span className="card-title">Harcama</span>
          <span className="card-sub">
            {tl(o.gider)} · {ayIsim}
          </span>
          <Pills items={o.kategoriler} />
        </button>
        <button className="card" onClick={() => git('analysis')}>
          <span className="card-title">Gelir</span>
          <span className="card-sub">
            {tl(o.gelir)} · {ayIsim}
          </span>
          <div className="tiles">
            {o.gelirTurleri.length === 0 && <span style={{ background: 'var(--tile)' }} />}
            {o.gelirTurleri.slice(0, 5).map((g) => (
              <span key={g.ad} style={{ background: renkOf(g.ad) }} title={g.ad}>
                <Ico n={ikonOf(g.ad)} size={16} />
              </span>
            ))}
          </div>
        </button>
      </div>

      <div className="quick">
        <div className="quick-col">
          <button className="sq" onClick={() => ekle('gelir')} aria-label="Gelir ekle">
            <Ico n="plus" />
          </button>
          <button className="sq" onClick={yenile} aria-label="Yenile">
            <Ico n="refresh" size={20} />
          </button>
        </div>
        <button className="mid" onClick={() => git('settings')}>
          <span className="icontile">
            <Ico n="card" size={20} />
          </span>
          <div>
            <b>Kart borcu</b>
            {borc.baslangic ? (
              <>
                <div className="val">{tl(borc.kalan)}</div>
                <Progress value={borc.odenen} max={borc.baslangic} />
              </>
            ) : (
              <div className="muted">Ayarla →</div>
            )}
          </div>
        </button>
        <button className="mid" onClick={() => git('settings')}>
          <span className="icontile">
            <Ico n="target" size={20} />
          </span>
          <div>
            <b>Birikim</b>
            {bir.hedef ? (
              <>
                <div className="val">{tl(bir.toplam)}</div>
                <Progress value={bir.toplam} max={bir.hedef} />
              </>
            ) : (
              <div className="muted">Hedef koy →</div>
            )}
          </div>
        </button>
      </div>

      {tanimsiz > 0 && (
        <button className="notice" onClick={() => git('tx', 'tanimsiz')}>
          <span className="icontile">
            <Ico n="dots" />
          </span>
          <div>
            <b>{tanimsiz} kaydı tanımadım</b>
            <span className="muted">Kategorisini bir kere söyle, sonra kendim bilirim</span>
          </div>
          <Ico n="chevR" size={18} />
        </button>
      )}

      <section className="wide">
        <span className="orb" aria-hidden />
        <span className="card-title">Bugün {tl(bugunHarcanan)} harcadın</span>
        <span className="card-sub">
          {ayIsim} günlük ortalaman {tl(ortalama)}.
          {siradaki && ` Sıradaki: ${siradaki.ad} ${siradaki.gun} ${ayIsim}, ${siradaki.tur === 'gelir' ? '+' : '−'}${tl(siradaki.tutar)}.`}
        </span>
        <button className="btn-sm" onClick={() => git('analysis')}>
          Analize bak
        </button>
      </section>

      <div className="panel">
        <div className="card-head">
          <span className="card-title">Son işlemler</span>
          <button className="linkbtn" onClick={() => git('tx', 'tum')}>
            Tümü
          </button>
        </div>
        {son.length === 0 && <p className="muted empty">Henüz kayıt yok. Eylem Düğmesi'yle başla.</p>}
        {son.map((x) => (
          <TxRow key={x.id} x={x} onClick={() => git('tx', 'tum')} />
        ))}
      </div>
    </>
  );
}
