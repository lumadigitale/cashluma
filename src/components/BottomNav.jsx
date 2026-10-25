import { Ico } from './icons';

const ITEMS = [
  ['home', 'Ana sayfa', 'home'],
  ['tx', 'İşlemler', 'list'],
  ['analysis', 'Analiz', 'chart'],
  ['settings', 'Ayarlar', 'gear'],
];

export default function BottomNav({ tab, git }) {
  return (
    <nav className="bottomnav">
      {ITEMS.map(([k, ad, ikon]) => (
        <button key={k} className={tab === k ? 'active' : ''} onClick={() => git(k)}>
          <Ico n={ikon} size={22} />
          <span>{ad}</span>
        </button>
      ))}
    </nav>
  );
}
