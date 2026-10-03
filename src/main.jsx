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

// iPhone ana ekran modu (ölçüldü, 2026-10-03, ekran 956): sayfaya 894 veriyor, aradaki 62 (saat çubuğu
// kadar) ekranın altında görünmeyen bölge kalıyor ve oraya çizilen kesiliyor. Çentik boşluğu (34) o
// gizli bölgenin içinde. Bu yüzden: yükseklik = sayfanın bildirdiği yükseklik; menünün alt boşluğu =
// çentik boşluğunun gizli bölgeye sığmayan kısmı (hatasız cihazda tam çentik boşluğu).
function guvenliAlan() {
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(p);
  const alt = parseFloat(getComputedStyle(p).paddingBottom) || 0;
  p.remove();
  return alt;
}
function yukseklikAyarla() {
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const h = window.innerHeight;
  const gizli = standalone ? Math.max(0, window.screen.height - h) : 0;
  const altBosluk = Math.max(6, guvenliAlan() - gizli);
  document.documentElement.style.setProperty('--app-h', `${h}px`);
  document.documentElement.style.setProperty('--nav-alt', `${altBosluk}px`);
}
yukseklikAyarla();
window.addEventListener('resize', yukseklikAyarla);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
