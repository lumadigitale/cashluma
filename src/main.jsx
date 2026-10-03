import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

// iPhone ana ekran uygulaması sıfırdan açılmaz, arka plandan geri gelir; güncelleme kontrolü
// yalnız açılışta olursa eski sürüm haftalarca kalır. Bu yüzden: uygulama her öne geldiğinde
// ve açıkken 30 dakikada bir yeni sürüm var mı bak. Varsa yeni sürüm devralır, sayfa yenilenir.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const kontrol = () => {
      if (navigator.onLine) reg.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kontrol();
    });
    setInterval(kontrol, 30 * 60 * 1000);
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
