import { useMemo } from 'react';
import { ayKey, ayOzeti, birikim, borcDurumu, gunKey, gunToplami } from '../data';
import { renkOf } from '../categorize';
import { ayAdi, tl, isaretli } from '../format';
import { Icon, Money, Progress, SegmentBar, TxRow } from '../components/ui';

export default function Home({ raw, tx, yukleniyor, yenile, ekle, git, tanimsiz }) {
  const bugun = new Date();
  const ay = ayKey(bugun);
  const o = useMemo(() => ayOzeti(raw, tx, ay, bugun), [raw, tx, ay]);
  const borc = useMemo(() => borcDurumu(raw, tx), [raw, tx]);
  const bir = useMemo(() => birikim(raw, tx, bugun), [raw, tx]);
  const bugunHarcanan = gunToplami(tx, gunKey(bugun));
  const son = tx.slice(0, 5);

  return (
    <>
      <header className="top">
        <div>
          <small>{ayAdi(ay)} {ay.slice(0, 4)}</small>
          <h1>Merhaba Mehmet</h1>
        </div>
        <button className={`iconbtn ${yukleniyor ? 'spin' : ''}`} onClick={yenile} aria-label="Yenile">
          {Icon.refresh}
        </button>
      </header>

      <section className="hero">
        <div className="stack" aria-hidden>
          <i style={{ background: '#ffd60a' }} />
          <i style={{ background: '#3db8ff' }} />
          <i style={{ background: '#4cd964' }} />
        </div>
        <small>{ayAdi(ay)} neti</small>
        <Money n={o.net} />
        <div className="hero-row">
          <span className="pill up">↑ {tl(o.gelir)}</span>
          <span className="pill down">↓ {tl(o.gider)}</span>
        </div>
        {o.bekleyen.length > 0 && <p className="muted">Ay sonu beklenen: {tl(o.ayKapanisi)}</p>}
      </section>

      <div className="actions">
        <button className="primary" onClick={() => ekle('gider')}>
          {Icon.minus} Gider
        </button>
        <button className="ghost" onClick={() => ekle('gelir')}>
          {Icon.plus} Gelir
        </button>
      </div>

      {tanimsiz > 0 && (
        <button className="banner" onClick={() => git('tx', 'tanimsiz')}>
          <b>{tanimsiz} harcamayı tanımadım</b>
          <span>Kategorisini bir kere söyle, sonra kendim bilirim →</span>
        </button>
      )}

      <div className="grid2">
        <div className="card">
          <small>Bugün</small>
          <Money n={bugunHarcanan} size="md" />
          <span className="muted">harcandı</span>
        </div>
        <button className="card" onClick={() => git('analysis')}>
          <small>Bu ay gider</small>
          <Money n={o.gider} size="md" />
          <SegmentBar items={o.kategoriler} />
        </button>
      </div>

      {o.kategoriler.length > 0 && (
        <button className="card list" onClick={() => git('analysis')}>
          <div className="card-head">
            <b>Nereye gitti</b>
            <span className="muted">{ayAdi(ay)}</span>
          </div>
          {o.kategoriler.slice(0, 4).map((k) => (
            <div className="catrow" key={k.ad}>
              <i style={{ background: renkOf(k.ad) }} />
              <span>{k.ad}</span>
              <b>{tl(k.tutar)}</b>
            </div>
          ))}
        </button>
      )}

      <div className="grid2">
        <div className="card">
          <small>Kart borcu</small>
          <b className="big">{tl(borc.kalan)}</b>
          <Progress value={borc.odenen} max={borc.baslangic} renk="#ff4f8b" />
          <span className="muted">{tl(borc.odenen)} ödendi</span>
        </div>
        <div className="card">
          <small>Eve çıkış birikimi</small>
          <b className="big">{tl(bir.toplam)}</b>
          <Progress value={bir.toplam} max={bir.hedef} renk="#4cd964" />
          <span className="muted">hedef {tl(bir.hedef)}</span>
        </div>
      </div>

      {o.bekleyen.length > 0 && (
        <div className="card list">
          <div className="card-head">
            <b>Bu ay gelecekler</b>
          </div>
          {o.bekleyen.map((s) => (
            <div className="catrow" key={s.ad}>
              <i style={{ background: s.tur === 'gelir' ? '#4cd964' : '#ff4f8b' }} />
              <span>
                {s.ad} <span className="muted">· {s.gun} {ayAdi(ay)}</span>
              </span>
              <b className={s.tur === 'gelir' ? 'pos' : ''}>{isaretli(s.tur === 'gelir' ? s.tutar : -s.tutar)}</b>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="card-head">
          <b>Son işlemler</b>
          <button className="link" onClick={() => git('tx', 'tum')}>
            Tümü
          </button>
        </div>
        {son.length === 0 && <p className="muted empty">Henüz kayıt yok. Eylem Düğmesi ya da + ile başla.</p>}
        {son.map((x) => (
          <TxRow key={x.id} x={x} onClick={() => git('tx', 'tum')} />
        ))}
      </div>
    </>
  );
}
