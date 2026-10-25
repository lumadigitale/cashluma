import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { baslat, call, ekle, getCache, getCfg, getQueue, gonder, demoMu } from './api';
import { bosVeri, islemler } from './data';
import { kategorize, anahtarKelime, etiketOf } from './categorize';
import { kayitliKur, kurGetir } from './kur';
import BottomNav from './components/BottomNav';
import AddSheet from './components/AddSheet';
import { CuzdanSheet, KumbaraSheet, BorcSheet } from './components/Sheets';
import Home from './screens/Home';
import Transactions from './screens/Transactions';
import Analysis from './screens/Analysis';
import Settings from './screens/Settings';

export default function App() {
  const [raw, setRaw] = useState(() => getCache() || bosVeri());
  const [kur, setKur] = useState(() => kayitliKur());
  const [tab, setTab] = useState('home');
  const [sayfa, setSayfa] = useState(null); // { tip: 'ekle', tur } | { tip: 'cuzdan' | 'kumbara' | 'borc' }
  const [txFiltre, setTxFiltre] = useState('tum');
  const [durum, setDurum] = useState({ yukleniyor: false, hata: '' });
  const [kuyruk, setKuyruk] = useState(getQueue());
  const [hazir, setHazir] = useState(false);
  const ekran = useRef(null);

  const yenile = useCallback(async () => {
    setDurum({ yukleniyor: true, hata: '' });
    kurGetir().then((k) => k && setKur(k));
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
    // Eylem Düğmesi'yle girilen kayıt, uygulama öne gelince görünsün
    const gorunur = () => document.visibilityState === 'visible' && (demoMu() || getCfg().key) && yenile();
    window.addEventListener('online', yenile);
    document.addEventListener('visibilitychange', gorunur);
    return () => {
      window.removeEventListener('online', yenile);
      document.removeEventListener('visibilitychange', gorunur);
    };
  }, [yenile]);

  // Kuyrukta bekleyen (henüz gönderilemeyen) kayıtlar da listede görünsün
  const veri = useMemo(() => {
    const bekle = kuyruk.map((q) => ({ ...q, id: 'bekle:' + q.qid, bekliyor: true }));
    return { ...raw, kayitlar: [...raw.kayitlar, ...bekle] };
  }, [raw, kuyruk]);
  const tx = useMemo(() => islemler(veri), [veri]);

  const kaydet = async ({ kategoriIpucu, ...item }) => {
    setSayfa(null);
    // Seçilen kategori otomatik tahminden farklıysa:
    // - kelime hiç tanınmıyorsa öğret ("çorba" → Yemek, bundan sonra hep)
    // - tanınıyorsa yalnız bu kayda etiket koy ("döner #arkadaş"), dönerin genel kuralı bozulmasın
    if (item.tur === 'gider' && kategoriIpucu && item.metin !== kategoriIpucu) {
      const tahmin = kategorize(item.metin, raw.kurallar);
      if (tahmin === 'Diğer') {
        await call('rule', { kelime: anahtarKelime(item.metin), kategori: kategoriIpucu }).catch(() => {});
      } else if (tahmin !== kategoriIpucu) {
        item.metin = `${item.metin} #${etiketOf(kategoriIpucu)}`;
      }
    }
    try {
      const d = await ekle(item);
      if (d) setRaw(d);
      setDurum({ yukleniyor: false, hata: '' });
    } catch {
      setDurum({ yukleniyor: false, hata: 'Kaydedildi, internet gelince gönderilecek.' });
    }
    setKuyruk(getQueue());
  };

  const islem = async (action, payload) => {
    setSayfa(null);
    setDurum({ yukleniyor: true, hata: '' });
    try {
      setRaw(await call(action, payload));
      setDurum({ yukleniyor: false, hata: '' });
    } catch (e) {
      setDurum({ yukleniyor: false, hata: e.message });
    }
  };

  const tanimsiz = tx.filter((x) => x.tur === 'gider' && x.kategori === 'Diğer').length;

  const git = (t, filtre) => {
    if (filtre) setTxFiltre(filtre);
    setTab(t);
    ekran.current?.scrollTo(0, 0);
  };
  const ac = (tip, tur) => setSayfa({ tip, tur });
  const kurDegeri = kur?.deger || null;

  if (!hazir) return <div className="app" />;

  return (
    <div className="app">
      {durum.hata && (
        <div className="toast" onClick={() => setDurum((d) => ({ ...d, hata: '' }))}>
          {hataMetni(durum.hata)}
        </div>
      )}
      <main className="screen" ref={ekran}>
        {tab === 'home' && <Home raw={veri} tx={tx} kur={kurDegeri} ac={ac} kaydet={kaydet} git={git} tanimsiz={tanimsiz} />}
        {tab === 'tx' && <Transactions tx={tx} filtre={txFiltre} setFiltre={setTxFiltre} islem={islem} />}
        {tab === 'analysis' && <Analysis raw={veri} tx={tx} kur={kurDegeri} />}
        {tab === 'settings' && <Settings raw={veri} kur={kur} yenile={yenile} islem={islem} />}
      </main>
      <BottomNav tab={tab} git={git} />
      {sayfa?.tip === 'ekle' && <AddSheet tur={sayfa.tur} kapat={() => setSayfa(null)} kaydet={kaydet} ayarlar={veri.ayarlar} />}
      {sayfa?.tip === 'cuzdan' && <CuzdanSheet tx={tx} kapat={() => setSayfa(null)} kaydet={kaydet} />}
      {sayfa?.tip === 'kumbara' && <KumbaraSheet raw={veri} tx={tx} kapat={() => setSayfa(null)} kaydet={kaydet} />}
      {sayfa?.tip === 'borc' && <BorcSheet raw={veri} kapat={() => setSayfa(null)} islem={islem} />}
    </div>
  );
}

function hataMetni(h) {
  const m = {
    ayar_yok: 'Önce Ayarlar’dan bağlantıyı kur.',
    unauthorized: 'Anahtar yanlış. Ayarlar’ı kontrol et.',
    'Failed to fetch': 'İnternet yok, son kayıtlı veri gösteriliyor.',
    satir_degismis: 'Tablo değişmiş, yenileyip tekrar dene.',
    sabit_gecersiz: 'Ad, tutar ve gün dolu olmalı.',
    borc_gecersiz: 'Borç tutarını kontrol et.',
    tur_gecersiz: 'Apps Script eski sürümde. Yeni kodu yapıştırıp yeni sürüm dağıt.',
    unknown_action: 'Apps Script eski sürümde. Yeni kodu yapıştırıp yeni sürüm dağıt.',
  };
  return m[h] || h;
}
