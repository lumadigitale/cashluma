import { Icon } from './ui';

const ITEMS = [
  ['home', 'Ana sayfa', Icon.home],
  ['tx', 'İşlemler', Icon.list],
  null,
  ['analysis', 'Analiz', Icon.chart],
  ['settings', 'Ayarlar', Icon.gear],
];

export default function BottomNav({ tab, git, ekle }) {
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) =>
        it ? (
          <button key={it[0]} className={tab === it[0] ? 'active' : ''} onClick={() => git(it[0])}>
            {it[2]}
            <span>{it[1]}</span>
          </button>
        ) : (
          <button key="add" className="fab" onClick={ekle} aria-label="Ekle">
            {Icon.plus}
          </button>
        ),
      )}
    </nav>
  );
}
