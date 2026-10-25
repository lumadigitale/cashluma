import { useMemo } from 'react';
import { ayKey, ayOzeti, borcDurumu, cuzdan, gunKey, gunToplami, kumbara } from '../data';
import { ayAdi, tl } from '../format';
import { Money, Pills, Progress, TxRow } from '../components/ui';
import { Ico } from '../components/icons';
import { isAdi } from '../categorize';

export default function Home({ raw, tx, kur, ac, kaydet, git, tanimsiz }) {
  const bugun = new Date();
  const ay = ayKey(bugun);
  const ayIsim = ayAdi(ay);
  const o = useMemo(() => ayOzeti(raw, tx, ay, bugun, kur), [raw, tx, ay, kur]);
  const c = useMemo(() => cuzdan(tx), [tx]);
  const k = useMemo(() => kumbara(raw, tx), [raw, tx]);
  const borc = borcDurumu(raw).son;
  const bugunHarcanan = gunToplami(tx, gunKey(bugun));
  // Hızlı düğmelerin adı, metni ve tutarı Ayarlar'dan; girilmemişse kayıt sayfası açılır
  const isUcret = Number(raw.ayarlar.is_ucret) || 0;
  const sigara = Number(raw.ayarlar.sigara_fiyat) || 0;
  const sigaraMetin = String(raw.ayarlar.sigara_metin || '').trim() || 'Sigara';
  const son = tx.slice(0, 6);

  return (
    <>
      <section className="wallet">
        <div className="wallet-head">
          <b>Bugün</b>
          <button onClick={() => ac('ekle', 'gider')} aria-label="Kayıt ekle">
            <Ico n="plus" size={22} />
          </button>
        </div>
        <div className="amount-big">
          <Money n={bugunHarcanan} />
        </div>
        <div className="wallet-foot">
          <span>{ayIsim.charAt(0).toLocaleUpperCase('tr') + ayIsim.slice(1)} harcaması</span>
          <span>{tl(o.gider)}</span>
        </div>
      </section>

      <div className="grid4">
        <button className="qbtn" onClick={() => (isUcret ? kaydet({ tur: 'gelir', tutar: isUcret, metin: '', kategori: isAdi(raw.ayarlar), nakit: false }) : ac('ekle', 'gelir'))}>
          <Ico n="glass" size={20} />
          <span>{isAdi(raw.ayarlar)}</span>
          <small>{isUcret ? '+' + tl(isUcret) : 'Ayarlar’da gir'}</small>
        </button>
        <button className="qbtn" onClick={() => (sigara ? kaydet({ tur: 'gider', tutar: sigara, metin: sigaraMetin }) : ac('ekle', 'gider'))}>
          <Ico n="smoke" size={20} />
          <span>Sigara</span>
          <small>{sigara ? tl(sigara) : 'Ayarlar’da gir'}</small>
        </button>
        <button className="qbtn" onClick={() => ac('ekle', 'gider')}>
          <Ico n="minus" size={20} />
          <span>Gider</span>
          <small>&nbsp;</small>
        </button>
        <button className="qbtn" onClick={() => ac('ekle', 'gelir')}>
          <Ico n="plus" size={20} />
          <span>Gelir</span>
          <small>&nbsp;</small>
        </button>
      </div>

      <div className="grid3">
        <button className="mid" onClick={() => ac('cuzdan')}>
          <span className="icontile">
            <Ico n="wallet" size={20} />
          </span>
          <div>
            <b>Cüzdan</b>
            <div className="val">{tl(c.bakiye)}</div>
          </div>
        </button>
        <button className="mid" onClick={() => ac('kumbara')}>
          <span className="icontile">
            <Ico n="piggy" size={20} />
          </span>
          <div>
            <b>Kumbara</b>
            <div className="val">{tl(k.toplam)}</div>
            {k.hedef > 0 && <Progress value={k.toplam} max={k.hedef} />}
          </div>
        </button>
        <button className="mid" onClick={() => ac('borc')}>
          <span className="icontile">
            <Ico n="card" size={20} />
          </span>
          <div>
            <b>Kart borcu</b>
            {borc ? <div className="val">{tl(borc.bakiye)}</div> : <div className="muted">Gir →</div>}
          </div>
        </button>
      </div>

      <button className="card" onClick={() => git('analysis')}>
        <div className="card-head">
          <span className="card-title">Bu ay</span>
          <span className="card-sub">
            gelir {tl(o.gelir)} · gider {tl(o.gider)}
          </span>
        </div>
        <Pills items={o.kategoriler} />
      </button>

      {o.bekleyen.length > 0 && (
        <div className="panel">
          <div className="card-head">
            <span className="card-title">Bu ay gelecekler</span>
          </div>
          {o.bekleyen.map((s) => (
            <div className="catrow" key={s.ad} style={{ minHeight: 38 }}>
              <span>
                {s.ad} <span className="muted">· {s.gun} {ayIsim}</span>
              </span>
              <b className={s.tur === 'gelir' ? 'pos' : ''}>
                {s.tur === 'gelir' ? '+' : '−'}
                {s.tl === null ? `$${s.tutar}` : tl(s.tl).replace('−', '')}
              </b>
            </div>
          ))}
          <div style={{ height: 10 }} />
        </div>
      )}

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
