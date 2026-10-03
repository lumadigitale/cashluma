// public/ altındaki uygulama ikonlarını SVG'den üretir: npm run icons
import sharp from 'sharp';

const svg = (size) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1f1f26"/><stop offset="1" stop-color="#0a0a0c"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <rect x="300" y="120" width="70" height="200" rx="26" fill="#4cd964" transform="rotate(14 335 220)"/>
  <rect x="262" y="128" width="70" height="200" rx="26" fill="#3db8ff" transform="rotate(7 297 228)"/>
  <rect x="224" y="136" width="70" height="200" rx="26" fill="#ffd60a"/>
  <rect x="96" y="196" width="250" height="170" rx="36" fill="#f4f4f6"/>
  <text x="128" y="318" font-family="Segoe UI, Arial, sans-serif" font-size="110" font-weight="800" fill="#0a0a0c">₺</text>
  <rect x="214" y="290" width="100" height="16" rx="8" fill="#0a0a0c" opacity=".25"/>
</svg>`);

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(svg(size)).png().toFile(`public/${name}`);
  console.log('yazıldı', name);
}
