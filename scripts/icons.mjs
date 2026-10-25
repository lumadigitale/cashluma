// public/ altındaki uygulama ikonlarını SVG'den üretir: npm run icons
// Görsel: tüm simgeyi kaplayan buzlu cam (altında renkli ışık lekeleri); ortada mor→mavi gradyanlı
// açık bir "C" halkası ve açıklığında parlayan bir ışık (luma). iOS köşeleri kendisi yuvarlar;
// C ortadaki güvenli alanda kalır (maskable).
import sharp from 'sharp';

const svg = (size) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="mor" gradientUnits="userSpaceOnUse" cx="40" cy="40" r="380">
      <stop offset="0" stop-color="#7c4dff" stop-opacity=".9"/><stop offset="1" stop-color="#7c4dff" stop-opacity="0"/></radialGradient>
    <radialGradient id="mavi" gradientUnits="userSpaceOnUse" cx="500" cy="170" r="300">
      <stop offset="0" stop-color="#00c2ff" stop-opacity=".6"/><stop offset="1" stop-color="#00c2ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="pembe" gradientUnits="userSpaceOnUse" cx="430" cy="520" r="340">
      <stop offset="0" stop-color="#ff40a0" stop-opacity=".6"/><stop offset="1" stop-color="#ff40a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="cam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>
    <linearGradient id="halka" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b08cff"/><stop offset=".55" stop-color="#5b7bff"/><stop offset="1" stop-color="#14c8ff"/></linearGradient>
    <radialGradient id="isik" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffd6ec"/><stop offset="1" stop-color="#ff5fb0" stop-opacity="0"/></radialGradient>
    <filter id="parilti" filterUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>

  <rect width="512" height="512" fill="#0a0814"/>
  <rect width="512" height="512" fill="url(#mor)"/>
  <rect width="512" height="512" fill="url(#mavi)"/>
  <rect width="512" height="512" fill="url(#pembe)"/>

  <!-- tüm simgeyi kaplayan buzlu cam -->
  <rect width="512" height="512" fill="url(#cam)"/>

  <!-- C halkası: açıklık sağda. Parıltı ayrı katmanda: bulanıklık döndürülmüş öğeye uygulanınca kenarı kesiliyordu -->
  <g filter="url(#parilti)" opacity=".55">
    <g transform="rotate(42 256 256)">
      <circle cx="256" cy="256" r="118" fill="none" stroke="url(#halka)" stroke-width="54" stroke-linecap="round"
        stroke-dasharray="${(2 * Math.PI * 118 * 0.77).toFixed(1)} 999"/>
    </g>
  </g>
  <g transform="rotate(42 256 256)">
    <circle cx="256" cy="256" r="118" fill="none" stroke="url(#halka)" stroke-width="54" stroke-linecap="round"
      stroke-dasharray="${(2 * Math.PI * 118 * 0.77).toFixed(1)} 999"/>
  </g>

  <!-- açıklıktaki ışık -->
  <circle cx="382" cy="256" r="60" fill="url(#isik)"/>
  <path d="M382 216 L389 249 L422 256 L389 263 L382 296 L375 263 L342 256 L375 249 Z" fill="#fff"/>
</svg>`);

// Önce 2048 px'de çiz, sonra küçült: yumuşak geçişlerde basamaklanma ve kenar tırtığı olmasın
const buyuk = await sharp(svg(2048)).png().toBuffer();
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['icon-1024.png', 1024]]) {
  await sharp(buyuk).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`public/${name}`);
  console.log('yazıldı', name);
}
