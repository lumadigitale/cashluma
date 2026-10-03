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

// Ana ekrandan açılınca (standalone) uygulama tüm ekranı kaplar; iOS ise sayfaya bazen daha kısa
// bir yükseklik bildiriyor ve alt menü havada kalıyordu. O modda yüksekliği ekranın kendisinden al.
function yukseklikAyarla() {
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const h = standalone ? Math.max(window.screen.height, window.innerHeight) : window.innerHeight;
  document.documentElement.style.setProperty('--app-h', `${h}px`);
}
yukseklikAyarla();
window.addEventListener('resize', yukseklikAyarla);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
