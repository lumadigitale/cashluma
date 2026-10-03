// Tek renk çizgi ikonlar (emoji yok). Hepsi 24x24, stroke = currentColor.
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  chart: 'M5 20V11M12 20V4M19 20v-6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  chevL: 'm15 18-6-6 6-6',
  chevR: 'm9 18 6-6-6-6',
  x: 'M6 6l12 12M18 6 6 18',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  // kategoriler
  food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9',
  drink: 'M6 4h12l-1.5 16h-9zM6.5 9h11',
  smoke: 'M3 15h14v3H3zM17 15h4v3h-4M18 11c0-2-2-2-2-4s2-2 2-4',
  cart: 'M3 4h2l2.5 11h10L20 7H6.5M9 20h.01M17 20h.01',
  bus: 'M5 4h14v12H5zM5 10h14M7.5 19v-3M16.5 19v-3M8 13h.01M16 13h.01',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18.5 14.5c1.8.8 2.8 2.6 3 5.5',
  ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.8-4 4-6 8-6s7.2 2 8 6',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  pin: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  arrowUpR: 'M7 17 17 7M8 7h9v9',
  glass: 'M6 3h12l-6 8zM12 11v9M8 21h8',
  coins: 'M9 8a6 3 0 1 0 0 .01M3 8v4c0 1.7 2.7 3 6 3s6-1.3 6-3V8M9 15v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3',
  cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
};

export function Ico({ n, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d={P[n] || P.dots} />
    </svg>
  );
}
