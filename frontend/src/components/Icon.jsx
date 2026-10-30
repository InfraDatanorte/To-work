// Ícones locais em SVG: sem biblioteca ou carregamento externo.
const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-7l1-7Z',
  clean: 'm14 3 3 3-7 8-3-3 7-8ZM7 11l-4 8 7 3 4-7M5 17l5 2',
  water: 'M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13ZM8 15a4 4 0 0 0 4 4',
  paint: 'M4 3h12v7H4zM16 6h4v8h-8v7M10 21h4',
  leaf: 'M20 3C7 1 2 7 5 15c8 5 15-1 15-12ZM3 22 15 9',
  computer: 'M3 3h18v13H3zM8 21h8M12 16v5',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  check: 'm5 12 4 4L19 6',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
  bag: 'M3 7h18v14H3zM8 7V3h8v4M3 12a24 24 0 0 0 18 0M12 11v4',
  home: 'm3 10 9-8 9 8v12h-7v-8h-4v8H3V10Z',
  exit: 'M9 4H3v16h6M9 12h12m-5-5 5 5-5 5',
  back: 'M19 12H5m6-6-6 6 6 6',
  message: 'M21 3H3v14h5v5l6-5h7V3ZM7 8h10M7 12h6'
};
export default function Icon({ name, size = 22, className = '' }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid} /></svg>;
}
export function categoryIcon(name) {
  const key = name.toLowerCase();
  if (key.includes('elétr') || key.includes('eletr')) return 'bolt';
  if (key.includes('limp')) return 'clean';
  if (key.includes('hidr')) return 'water';
  if (key.includes('pint')) return 'paint';
  if (key.includes('jard')) return 'leaf';
  if (key.includes('inform')) return 'computer';
  return 'bag';
}
