import { useCallback, useEffect, useMemo, useState } from 'react';
import { baslat, call, ekle, getCache, getCfg, getQueue, gonder, demoMu } from './api';
import { bosVeri, islemler } from './data';
import { kategorize, anahtarKelime, etiketOf } from './categorize';
import BottomNav from './components/BottomNav';
import AddSheet from './components/AddSheet';
import Home from './screens/Home';
import Transactions from './screens/Transactions';
import Analysis from './screens/Analysis';
import Settings from './screens/Settings';

export default function App() {
  const [raw, setRaw] = useState(() => getCache() || bosVeri());
  const [tab, setTab] = useState('home');
  const [ekleAcik, setEkleAcik] = useState(null); // 'gider' | 'gelir' | null
  const [txFiltre, setTxFiltre] = useState('tum');
  const [durum, setDurum] = useState({ yukleniyor: false, hata: '' });
  const [kuyruk, setKuyruk] = useState(getQueue());
  const [hazir, setHazir] = useState(false);

  const yenile = useCallback(async () => {
    setDurum({ yukleniyor: true, hata: '' });
    try {
      const d = (await gonder()) || (await call('all'));
      setRaw(d);
      setDurum({ yukleniyor: false, hata: '' });
    } catch (e) {
      setDurum({ yukleniyor: false, hata: e.message });
    }
    setKuyruk(getQueue());
  }, []);

  useEffect(() => {
    baslat().then(() => {
      setHazir(true);
      const cfg = getCfg();
      if (demoMu() || (cfg.url && cfg.key)) yenile();
      else setTab('settings');
    });
    const onl = () => yenile();
    window.addEventListener('online', onl);
    return () => window.removeEventListener('online', onl);
  }, [yenile]);

  // Kuyrukta bekleyen (henüz gönderilemeyen) kayıtlar da listede görünsün
  const veri = useMemo(() => {
    const bekle = (t) =>
      kuyruk.filter((q) => q.tur === t).map((q) => ({ ...q, id: 'bekle:' + q.qid, bekliyor: true }));
    return { ...raw, giderler: [...raw.giderler, ...bekle('gider')], gelirler: [...raw.gelirler, ...bekle('gelir')] };
  }, [raw, kuyruk]);
  const tx = useMemo(() => islemler(veri), [veri]);

  const kaydet = async ({ kategoriIpucu, ...item }) => {
    setEkleAcik(null);
    // Seçilen kategori otomatik tahminden farklıysa:
    // - kelime hiç tanınmıyorsa öğret ("çorba" → Yemek, bundan sonra hep)
    // - tanınıyorsa yalnız bu kayda etiket koy ("döner #arkadaş"), dönerin genel kuralı bozulmasın
    const tahmin = item.tur === 'gider' ? kategorize(item.metin, raw.kurallar) : null;
    if (kategoriIpucu && tahmin !== kategoriIpucu) {
      if (tahmin === 'Diğer') {
        await call('rule', { kelime: anahtarKelime(item.metin), kategori: kategoriIpucu }).catch(() => {});
      } else {
        item.metin = `${item.metin} #${etiketOf(kategoriIpucu)}`;
      }
    }
    try {
      const d = await ekle(item);
      if (d) setRaw(d);
      setDurum({ yukleniyor: false, hata: '' });
    } catch (e) {
      setDurum({ yukleniyor: false, hata: 'Kaydedildi, internet gelince gönderilecek.' });
    }
    setKuyruk(getQueue());
  };

  const islem = async (action, payload) => {
    setDurum({ yukleniyor: true, hata: '' });
    try {
      setRaw(await call(action, payload));
      setDurum({ yukleniyor: false, hata: '' });
    } catch (e) {
      setDurum({ yukleniyor: false, hata: e.message });
    }
  };

  const tanimsiz = tx.filter((x) => x.tur === 'gider' && kategorize(x.metin, veri.kurallar) === 'Diğer').length;

  const git = (t, filtre) => {
    if (filtre) setTxFiltre(filtre);
    setTab(t);
    window.scrollTo(0, 0);
  };

  if (!hazir) return <div className="app" />;

  return (
    <div className="app">
      {durum.hata && (
        <div className="toast" onClick={() => setDurum((d) => ({ ...d, hata: '' }))}>
          {hataMetni(durum.hata)}
        </div>
      )}
      <main className="screen">
        {tab === 'home' && (
          <Home raw={veri} tx={tx} yukleniyor={durum.yukleniyor} yenile={yenile} ekle={setEkleAcik} git={git} tanimsiz={tanimsiz} />
        )}
        {tab === 'tx' && <Transactions raw={veri} tx={tx} filtre={txFiltre} setFiltre={setTxFiltre} islem={islem} />}
        {tab === 'analysis' && <Analysis raw={veri} tx={tx} />}
        {tab === 'settings' && <Settings raw={veri} yenile={yenile} islem={islem} />}
      </main>
      <BottomNav tab={tab} git={git} ekle={() => setEkleAcik('gider')} />
      {ekleAcik && <AddSheet tur={ekleAcik} kapat={() => setEkleAcik(null)} kaydet={kaydet} />}
    </div>
  );
}

function hataMetni(h) {
  const m = {
    ayar_yok: 'Önce Ayarlar’dan bağlantıyı kur.',
    unauthorized: 'Anahtar yanlış. Ayarlar’ı kontrol et.',
    'Failed to fetch': 'İnternet yok, son kayıtlı veri gösteriliyor.',
    satir_degismis: 'Tablo değişmiş, yenileyip tekrar dene.',
  };
  return m[h] || h;
}
