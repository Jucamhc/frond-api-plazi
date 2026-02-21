export const THEMES = [
  { id: 'cyberpunk',  name: 'Cyberpunk',  g: '#0ae98a', c: '#00d4ff', p: '#7b00ff', d: '#020812' },
  { id: 'matrix',     name: 'Matrix',     g: '#00ff41', c: '#39ff14', p: '#008f11', d: '#000a00' },
  { id: 'neon-red',   name: 'Neon Red',   g: '#ff073a', c: '#ff6b6b', p: '#ff0a54', d: '#0a0000' },
  { id: 'vaporwave',  name: 'Vaporwave',  g: '#ff71ce', c: '#01cdfe', p: '#b967ff', d: '#0d0221' },
  { id: 'ice',        name: 'Ice',        g: '#a5f3fc', c: '#67e8f9', p: '#22d3ee', d: '#020617' },
  { id: 'gold',       name: 'Gold',       g: '#ffd700', c: '#f0c040', p: '#b8860b', d: '#0a0800' },
];

export function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--green', t.g); r.setProperty('--cyan', t.c);
  r.setProperty('--purple', t.p); r.setProperty('--dark', t.d);
  document.body.style.backgroundColor = t.d;
  localStorage.setItem('platzi_theme', t.id);
}

export function loadSavedTheme() {
  const id = localStorage.getItem('platzi_theme');
  return THEMES.find(t => t.id === id) || THEMES[0];
}
