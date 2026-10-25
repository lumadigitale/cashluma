import { useState } from 'react';
import { cuzdan, kumbara, borcDurumu, gunKey } from '../data';
import { sayiOku, tl } from '../format';
import { Progress } from './ui';

function Sayfa({ kapat, baslik, children }) {
  return (
    <div className="sheet-backdrop" onClick={kapat}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h3>{baslik}</h3>
        {children}
      </div>
    </div>
  );
}

// Tutar + düğme satırı; birden fazla eylem aynı tutarla çalışır
function TutarFormu({ ipucu, eylemler, bosOlabilir = false }) {
  const [v, setV] = useState('');
  const n = sayiOku(v);
  const tamam = bosOlabilir ? v.trim() !== '' : n > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input className="input" inputMode="decimal" placeholder={ipucu} value={v} onChange={(e) => setV(e.target.value.replace(/[^\d.,]/g, ''))} />
      <div className="row">
        {eylemler.map(([ad, f, sinif]) => (
          <button key={ad} type="button" className={`btn ${sinif || 'white'}`} disabled={!tamam} onClick={() => f(n)}>
            {ad}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CuzdanSheet({ tx, kapat, kaydet }) {
  const c = cuzdan(tx);
  const bugun = gunKey(new Date());
  const bugunSayildi = tx.some((x) => x.tur === 'sayim' && gunKey(x.tarih) === bugun);
  return (
    <Sayfa kapat={kapat} baslik="Cüzdan">
      <div className="amount-line">
        <span className="muted">Cüzdanda olması gereken</span>
        <b>{tl(c.bakiye)}</b>
      </div>
      <p className="muted">Nakit çekince buraya yaz. Gün sonunda cüzdanı say; eksik çıkan para "kayıp nakit" olarak harcamaya yazılır.</p>

      <span className="card-title">Nakit çektim</span>
      <TutarFormu ipucu="Çektiğin tutar ₺" eylemler={[['Cüzdana ekle', (n) => kaydet({ tur: 'nakit_cek', tutar: n, metin: '' })]]} />

      <span className="card-title">{bugunSayildi ? 'Tekrar say' : 'Gün sonu: cüzdanda kaç var?'}</span>
      <TutarFormu
        ipucu="Saydığın tutar ₺"
        bosOlabilir
        eylemler={[['Sayımı kaydet', (n) => kaydet({ tur: 'sayim', tutar: n, metin: '' }), 'dark']]}
      />
    </Sayfa>
  );
}

export function KumbaraSheet({ raw, tx, kapat, kaydet }) {
  const k = kumbara(raw, tx);
  return (
    <Sayfa kapat={kapat} baslik="Kumbara">
      <div className="amount-line">
        <span className="muted">Kumbarada</span>
        <b>{tl(k.toplam)}</b>
      </div>
      {k.hedef > 0 && (
        <>
          <Progress value={k.toplam} max={k.hedef} />
          <span className="muted">
            Hedef {tl(k.hedef)}
            {k.tarih && ` · ${new Date(k.tarih + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`} · kalan {tl(Math.max(0, k.hedef - k.toplam))}
          </span>
        </>
      )}
      <TutarFormu
        ipucu="Tutar ₺"
        eylemler={[
          ['Kumbaraya attım', (n) => kaydet({ tur: 'kumbara', tutar: n, metin: '' })],
          ['Kumbaradan aldım', (n) => kaydet({ tur: 'kumbara', tutar: -n, metin: '' }), 'dark'],
        ]}
      />
      <small className="muted">Kumbara harcama sayılmaz. Hedefi Ayarlar’dan değiştirirsin.</small>
    </Sayfa>
  );
}

export function BorcSheet({ raw, kapat, islem }) {
  const b = borcDurumu(raw);
  const [bakiye, setBakiye] = useState(b.son ? String(b.son.bakiye) : '');
  const [odenen, setOdenen] = useState('');
  const tamam = bakiye.trim() !== '' && sayiOku(bakiye) >= 0;
  return (
    <Sayfa kapat={kapat} baslik="Kart borcu">
      <div className="amount-line">
        <span className="muted">{b.son ? `Son giriş ${new Date(b.son.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}` : 'Henüz giriş yok'}</span>
        <b>{b.son ? tl(b.son.bakiye) : '—'}</b>
      </div>
      <p className="muted">Haftada bir gir: kart borcun şu an ne kadar, bu hafta ne kadar ödedin. Harcamalara karışmaz.</p>
      <label className="field">
        <small>Kart borcum şu an</small>
        <input className="input" inputMode="decimal" placeholder="₺" value={bakiye} onChange={(e) => setBakiye(e.target.value.replace(/[^\d.,]/g, ''))} />
      </label>
      <label className="field">
        <small>Bu hafta ödediğim</small>
        <input className="input" inputMode="decimal" placeholder="₺ (yoksa boş)" value={odenen} onChange={(e) => setOdenen(e.target.value.replace(/[^\d.,]/g, ''))} />
      </label>
      <button className="btn white" disabled={!tamam} onClick={() => islem('borc_ekle', { bakiye: sayiOku(bakiye), odenen: sayiOku(odenen) })}>
        Kaydet
      </button>
      {b.liste.length > 0 && (
        <div className="card" style={{ padding: '6px 14px' }}>
          {b.liste.slice(0, 8).map((x) => (
            <div className="catrow" key={x.id}>
              <span className="muted">{new Date(x.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
              <span>{x.odenen > 0 ? `ödedim ${tl(x.odenen)}` : ''}</span>
              <b>{tl(x.bakiye)}</b>
            </div>
          ))}
        </div>
      )}
    </Sayfa>
  );
}
