// public/ altındaki uygulama ikonlarını SVG'den üretir: npm run icons
// Görsel: siyah zemin, parlak koyu gri kart, Harcama kartındaki dört renkli hap.
import sharp from 'sharp';

const svg = (size) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4a4a4c"/><stop offset=".5" stop-color="#262628"/><stop offset="1" stop-color="#161618"/></linearGradient></defs>
  <rect width="512" height="512" fill="#000"/>
  <rect x="76" y="132" width="360" height="248" rx="44" fill="url(#g)" stroke="#ffffff" stroke-opacity=".08" stroke-width="3"/>
  <rect x="112" y="298" width="96" height="44" rx="22" fill="#7b3ff2"/>
  <rect x="218" y="298" width="64" height="44" rx="22" fill="#ef5350"/>
  <rect x="292" y="298" width="44" height="44" rx="22" fill="#f2c200"/>
  <rect x="346" y="298" width="44" height="44" rx="22" fill="#2f80ed"/>
  <rect x="112" y="176" width="120" height="22" rx="11" fill="#fff"/>
  <rect x="112" y="214" width="76" height="16" rx="8" fill="#8e8e93"/>
</svg>`);

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(svg(size)).png().toFile(`public/${name}`);
  console.log('yazıldı', name);
}
