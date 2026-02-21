import { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

/* ══════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════ */

const CAT_KW = {
  'Desarrollo Web': ['javascript','typescript','react','angular','vue','next','node','express','html','css','webpack','frontend','backend','web','rest','svelte','tailwind','sass','dom','responsive','php','laravel','http','api rest'],
  'Python': ['python','django','flask','fastapi'],
  'Data & AI': ['data','machine learning','inteligencia artificial','deep learning','tensorflow','pandas','numpy','estadística','análisis','big data','ciencia de datos','nlp'],
  'Cloud & DevOps': ['aws','azure','google cloud','docker','kubernetes','devops','terraform','jenkins','linux','servidor','nube','cloud','infraestructura'],
  'Bases de Datos': ['sql','mysql','postgresql','mongodb','firebase','base de datos','database','redis'],
  'Mobile': ['android','ios','swift','kotlin','flutter','react native','mobile','móvil'],
  'Diseño & UX': ['diseño','design','figma','ux','ui','photoshop','illustrator','creatividad','prototipo'],
  'Marketing': ['marketing','seo','growth','redes sociales','community','contenido','copywriting','email','marca','publicidad'],
  'Inglés': ['inglés','english'],
  'Negocios': ['negocio','emprendimiento','startup','finanzas','liderazgo','gestión','management','product','scrum','agile','proyecto','estrategia'],
  'Seguridad': ['seguridad','security','ethical','hacking','ciberseguridad','pentesting'],
  'Herramientas': ['git','github','terminal','vs code','vim','command line','npm','paquete','línea de comando'],
};

function categorize(title) {
  const t = title.toLowerCase();
  for (const [cat, kws] of Object.entries(CAT_KW)) {
    if (kws.some(k => t.includes(k))) return cat;
  }
  return 'Otros';
}

const LEVELS = [
  { name: 'Novato',     min: 0,      color: '#666',    icon: '🌱' },
  { name: 'Aprendiz',   min: 1000,   color: '#4ecdc4', icon: '📘' },
  { name: 'Intermedio', min: 5000,   color: '#0ae98a', icon: '⚙️' },
  { name: 'Avanzado',   min: 12000,  color: '#00d4ff', icon: '🔷' },
  { name: 'Experto',    min: 25000,  color: '#7b00ff', icon: '💠' },
  { name: 'Maestro',    min: 50000,  color: '#ff6b6b', icon: '🏆' },
  { name: 'Leyenda',    min: 100000, color: '#ffd700', icon: '👑' },
];

const THEMES = [
  { id: 'cyberpunk',  name: 'Cyberpunk',  g: '#0ae98a', c: '#00d4ff', p: '#7b00ff', d: '#020812' },
  { id: 'matrix',     name: 'Matrix',     g: '#00ff41', c: '#39ff14', p: '#008f11', d: '#000a00' },
  { id: 'neon-red',   name: 'Neon Red',   g: '#ff073a', c: '#ff6b6b', p: '#ff0a54', d: '#0a0000' },
  { id: 'vaporwave',  name: 'Vaporwave',  g: '#ff71ce', c: '#01cdfe', p: '#b967ff', d: '#0d0221' },
  { id: 'ice',        name: 'Ice',        g: '#a5f3fc', c: '#67e8f9', p: '#22d3ee', d: '#020617' },
  { id: 'gold',       name: 'Gold',       g: '#ffd700', c: '#f0c040', p: '#b8860b', d: '#0a0800' },
];

/* ══════════════════════════════════════════════════════
   CÁLCULOS
   ══════════════════════════════════════════════════════ */

function calcLevel(data) {
  const c = data.courses?.length ?? 0;
  const score = (data.points ?? 0) + c * 100 + (data.answers ?? 0) * 50 + (data.questions ?? 0) * 30;
  let lvl = LEVELS[0], next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) { lvl = LEVELS[i]; next = LEVELS[i + 1] || null; break; }
  }
  const pct = next ? Math.min(((score - lvl.min) / (next.min - lvl.min)) * 100, 100) : 100;
  return { score, level: lvl, next, progress: pct };
}

function calcAchievements(data) {
  const courses = data.courses ?? [];
  const n = courses.length;
  const dep = courses.filter(c => c.deprecated).length;
  const pts = data.points ?? 0;
  const ans = data.answers ?? 0;
  const qs = data.questions ?? 0;
  const dates = courses.filter(c => c.approved_date).map(c => new Date(c.approved_date)).sort((a, b) => a - b);

  const mc = {};
  dates.forEach(d => { const k = `${d.getFullYear()}-${d.getMonth()}`; mc[k] = (mc[k] || 0) + 1; });
  const maxM = Math.max(0, ...Object.values(mc));
  const cats = new Set(courses.map(c => categorize(c.title)));

  const sorted = [...new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth()}`))].sort();
  let best = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [y1, m1] = sorted[i - 1].split('-').map(Number);
    const [y2, m2] = sorted[i].split('-').map(Number);
    if ((y2 * 12 + m2) - (y1 * 12 + m1) === 1) { run++; best = Math.max(best, run); }
    else run = 1;
  }
  const yrs = dates.length > 0 ? (Date.now() - dates[0]) / (365.25 * 24 * 3600000) : 0;

  return [
    { id: 'first',    name: 'Primeros Pasos',    desc: 'Completar el primer curso',         icon: '🎯', ok: n >= 1 },
    { id: 'ten',      name: 'En Racha',           desc: '10 cursos completados',             icon: '🔥', ok: n >= 10 },
    { id: 'fifty',    name: 'Medio Centenar',     desc: '50 cursos completados',             icon: '⭐', ok: n >= 50 },
    { id: 'century',  name: 'Centenario',         desc: '100 cursos completados',            icon: '💯', ok: n >= 100 },
    { id: 'marathon', name: 'Maratonista',        desc: '5+ cursos en un mes',               icon: '🏃', ok: maxM >= 5 },
    { id: 'ultra',    name: 'Ultra Maratonista',  desc: '10+ cursos en un mes',              icon: '🚀', ok: maxM >= 10 },
    { id: 'veteran',  name: 'Veterano',           desc: 'Primer curso hace 2+ años',         icon: '🏅', ok: yrs >= 2 },
    { id: 'explorer', name: 'Explorador',         desc: 'Cursos en 3+ categorías',           icon: '🧭', ok: cats.size >= 3 },
    { id: 'allround', name: 'Todoterreno',        desc: 'Cursos en 5+ categorías',           icon: '🌍', ok: cats.size >= 5 },
    { id: 'helper',   name: 'Ayudante',           desc: '20+ respuestas en comunidad',       icon: '🤝', ok: ans >= 20 },
    { id: 'curious',  name: 'Preguntón',          desc: '10+ preguntas realizadas',          icon: '❓', ok: qs >= 10 },
    { id: 'dedicated',name: 'Dedicado',           desc: '10,000+ puntos',                    icon: '💎', ok: pts >= 10000 },
    { id: 'legend',   name: 'Leyenda Platzi',     desc: '20,000+ puntos',                    icon: '👑', ok: pts >= 20000 },
    { id: 'streak',   name: 'Imparable',          desc: '6+ meses consecutivos aprendiendo', icon: '⚡', ok: best >= 6 },
    { id: 'updated',  name: 'Actualizado',        desc: '<10% cursos deprecados',            icon: '🔄', ok: n > 0 && dep / n < 0.1 },
  ];
}

function calcCategories(courses) {
  const map = {};
  courses.forEach(c => { const cat = categorize(c.title); map[cat] = (map[cat] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

function calcRhythm(courses) {
  const ts = courses.filter(c => c.approved_date).map(c => new Date(c.approved_date).getTime()).sort((a, b) => a - b);
  if (ts.length < 2) return { avg: 0, fast: 0, slow: 0, perMonth: '0' };
  const diffs = [];
  for (let i = 1; i < ts.length; i++) diffs.push((ts[i] - ts[i - 1]) / 864e5);
  const totalDays = (ts[ts.length - 1] - ts[0]) / 864e5;
  return {
    avg: Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length),
    fast: Math.round(Math.min(...diffs)),
    slow: Math.round(Math.max(...diffs)),
    perMonth: totalDays > 0 ? (ts.length / (totalDays / 30)).toFixed(1) : '0',
  };
}

function calcRecommendations(courses) {
  const cats = {};
  courses.forEach(c => { const cat = categorize(c.title); cats[cat] = (cats[cat] || 0) + 1; });
  const all = Object.keys(CAT_KW);
  const recs = [];
  all.filter(c => !cats[c]).forEach(cat =>
    recs.push({ cat, type: 'new', msg: `No tienes cursos de ${cat}. ¡Explora esta área!` }));
  all.filter(c => cats[c] && cats[c] < 3).sort((a, b) => (cats[a] || 0) - (cats[b] || 0))
    .forEach(cat => recs.push({ cat, type: 'improve', msg: `Solo ${cats[cat]} curso${cats[cat] > 1 ? 's' : ''} de ${cat}. ¡Profundiza!` }));
  return recs.slice(0, 8);
}

function buildHeatmap(courses) {
  const counts = {};
  courses.forEach(c => {
    if (!c.approved_date) return;
    const d = new Date(c.approved_date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    counts[k] = (counts[k] || 0) + 1;
  });
  const days = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ date: k, count: counts[k] || 0, dow: d.getDay() });
  }
  return days;
}

function buildTimeline(courses) {
  const dated = courses.filter(c => c.approved_date)
    .map(c => ({ ...c, _d: new Date(c.approved_date) }))
    .sort((a, b) => a._d - b._d);
  const months = {};
  dated.forEach(c => {
    const k = `${c._d.getFullYear()}-${String(c._d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[k]) months[k] = { key: k, label: c._d.toLocaleDateString('es', { year: 'numeric', month: 'short' }), items: [] };
    months[k].items.push(c);
  });
  return Object.values(months);
}

/* Leaderboard via localStorage */
function loadBoard() { try { return JSON.parse(localStorage.getItem('platzi_lb') || '[]'); } catch { return []; } }
function saveToBoard(data) {
  const b = loadBoard();
  const i = b.findIndex(e => e.u.toLowerCase() === data.username.toLowerCase());
  const entry = { u: data.username, n: data.name, p: data.points ?? 0, c: data.courses?.length ?? 0, a: data.avatar, t: Date.now() };
  if (i >= 0) b[i] = entry; else b.push(entry);
  b.sort((a, b2) => b2.p - a.p);
  const top = b.slice(0, 15);
  localStorage.setItem('platzi_lb', JSON.stringify(top));
  return top;
}

/* Themes */
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

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTES
   ══════════════════════════════════════════════════════ */

function Section({ title, icon, children }) {
  return (
    <div className="analytics-section">
      <h3 className="analytics-section-title">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function StatMini({ label, value, color = 'var(--green)' }) {
  return (
    <div className="analytics-stat-mini">
      <span className="analytics-stat-val" style={{ color }}>{value}</span>
      <span className="analytics-stat-lbl">{label}</span>
    </div>
  );
}

function HeatmapGrid({ days }) {
  const weeks = [];
  let week = new Array(7).fill(null);
  days.forEach((d, i) => {
    week[d.dow] = d;
    if (d.dow === 6 || i === days.length - 1) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  });

  const intensity = (count) => {
    if (count === 0) return 'rgba(226,240,255,0.04)';
    if (count === 1) return 'var(--green)44';
    if (count === 2) return 'var(--green)88';
    return 'var(--green)';
  };

  return (
    <div className="analytics-heatmap-scroll">
      <div className="analytics-heatmap-grid">
        {weeks.map((w, wi) => (
          <div key={wi} className="analytics-heatmap-col">
            {w.map((cell, di) => (
              <div
                key={di}
                className="analytics-heatmap-cell"
                style={{ background: cell ? intensity(cell.count) : 'transparent' }}
                title={cell ? `${cell.date}: ${cell.count} curso${cell.count !== 1 ? 's' : ''}` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end text-xs" style={{ color: 'rgba(226,240,255,0.3)' }}>
        <span>Menos</span>
        {[0, 1, 2, 3].map(n => (
          <div key={n} className="analytics-heatmap-cell" style={{ background: intensity(n), display: 'inline-block' }} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EXPORT IMAGE
   ══════════════════════════════════════════════════════ */

async function exportAnalyticsImage(data, levelInfo, achievements, categories) {
  const W = 1200, H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const F = 'Inter, Segoe UI, Arial, sans-serif';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#020812'); bg.addColorStop(0.5, '#081830'); bg.addColorStop(1, '#020a14');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(10,233,138,0.025)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const neon = ctx.createLinearGradient(0, 0, W, 0);
  neon.addColorStop(0, '#0ae98a'); neon.addColorStop(0.5, '#00d4ff'); neon.addColorStop(1, '#7b00ff');

  ctx.strokeStyle = neon; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(W, 2); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2f0ff'; ctx.font = `bold 48px ${F}`;
  ctx.fillText(`${data.name} — Analíticas`, W / 2, 70);
  ctx.fillStyle = '#0ae98a'; ctx.font = `24px ${F}`;
  ctx.fillText(`@${data.username}`, W / 2, 105);

  ctx.font = `bold 64px ${F}`;
  ctx.fillText(levelInfo.level.icon, W / 2, 190);
  ctx.fillStyle = levelInfo.level.color; ctx.font = `bold 36px ${F}`;
  ctx.fillText(levelInfo.level.name, W / 2, 240);
  ctx.fillStyle = 'rgba(226,240,255,0.5)'; ctx.font = `20px ${F}`;
  ctx.fillText(`Score: ${levelInfo.score.toLocaleString('es')}`, W / 2, 270);

  const stats = [
    { l: 'PUNTOS', v: (data.points ?? 0).toLocaleString('es') },
    { l: 'CURSOS', v: String(data.courses?.length ?? 0) },
    { l: 'RESPUESTAS', v: String(data.answers ?? 0) },
    { l: 'PREGUNTAS', v: String(data.questions ?? 0) },
  ];
  const pw = 220, pg = 24, sy = 310;
  let px = (W - (pw * 4 + pg * 3)) / 2;
  stats.forEach(s => {
    ctx.fillStyle = 'rgba(10,233,138,0.06)';
    ctx.beginPath();
    const r = 14, x = px, y = sy, w = pw, h = 90;
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,233,138,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ae98a'; ctx.font = `bold 42px ${F}`;
    ctx.fillText(s.v, px + pw / 2, sy + 48);
    ctx.fillStyle = 'rgba(226,240,255,0.4)'; ctx.font = `bold 13px ${F}`;
    ctx.fillText(s.l, px + pw / 2, sy + 74);
    px += pw + pg;
  });

  const unlocked = achievements.filter(a => a.ok);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0ae98a'; ctx.font = `bold 20px ${F}`;
  ctx.fillText(`◈ LOGROS (${unlocked.length}/${achievements.length})`, 60, 460);

  const cols = 5, aSize = 42;
  unlocked.slice(0, 15).forEach((a, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const ax = 60 + col * 220, ay = 480 + row * 60;
    ctx.font = `${aSize}px serif`; ctx.fillText(a.icon, ax, ay + aSize);
    ctx.fillStyle = '#e2f0ff'; ctx.font = `bold 16px ${F}`;
    ctx.fillText(a.name, ax + 50, ay + 20);
    ctx.fillStyle = 'rgba(226,240,255,0.4)'; ctx.font = `13px ${F}`;
    ctx.fillText(a.desc, ax + 50, ay + 38);
    ctx.fillStyle = '#0ae98a';
  });

  const catY = 680;
  ctx.fillStyle = '#0ae98a'; ctx.font = `bold 20px ${F}`;
  ctx.fillText('◈ CATEGORÍAS', 60, catY);
  const maxC = categories[0]?.count || 1;
  categories.slice(0, 8).forEach((c, i) => {
    const y = catY + 30 + i * 48;
    ctx.fillStyle = 'rgba(226,240,255,0.6)'; ctx.font = `15px ${F}`;
    ctx.fillText(c.name, 60, y + 16);
    const barW = (c.count / maxC) * 600;
    ctx.fillStyle = 'rgba(10,233,138,0.15)';
    ctx.fillRect(250, y, 600, 28);
    const grad = ctx.createLinearGradient(250, 0, 250 + barW, 0);
    grad.addColorStop(0, '#0ae98a'); grad.addColorStop(1, '#00d4ff');
    ctx.fillStyle = grad; ctx.fillRect(250, y, barW, 28);
    ctx.fillStyle = '#e2f0ff'; ctx.font = `bold 14px ${F}`;
    ctx.textAlign = 'right'; ctx.fillText(String(c.count), 240, y + 20); ctx.textAlign = 'left';
  });

  ctx.strokeStyle = neon; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H - 3); ctx.lineTo(W, H - 3); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#0ae98a'; ctx.font = `bold 18px ${F}`;
  ctx.shadowColor = '#0ae98a'; ctx.shadowBlur = 8;
  ctx.fillText('PLATZI.PROFILE', 50, H - 30); ctx.shadowBlur = 0;
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(226,240,255,0.3)'; ctx.font = `15px ${F}`;
  ctx.fillText(`platzi.com/p/${data.username}`, W - 50, H - 30);

  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `analytics_${data.username}.png`; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════ */

export default function AnalyticsModal({ data, onClose }) {
  const overlayRef = useRef(null);
  const [activeTheme, setActiveTheme] = useState(loadSavedTheme);
  const [exporting, setExporting] = useState(false);

  const courses = data.courses ?? [];
  const levelInfo = useMemo(() => calcLevel(data), [data]);
  const achievements = useMemo(() => calcAchievements(data), [data]);
  const categories = useMemo(() => calcCategories(courses), [courses]);
  const rhythm = useMemo(() => calcRhythm(courses), [courses]);
  const recs = useMemo(() => calcRecommendations(courses), [courses]);
  const heatmap = useMemo(() => buildHeatmap(courses), [courses]);
  const timeline = useMemo(() => buildTimeline(courses), [courses]);
  const [board, setBoard] = useState([]);

  useEffect(() => { setBoard(saveToBoard(data)); }, [data]);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const deprecated = courses.filter(c => c.deprecated).length;
  const active = courses.length - deprecated;
  const depPct = courses.length > 0 ? Math.round((deprecated / courses.length) * 100) : 0;
  const engagement = (data.answers ?? 0) + (data.questions ?? 0);
  const ratio = (data.questions ?? 0) > 0 ? ((data.answers ?? 0) / (data.questions ?? 0)).toFixed(1) : '∞';
  const unlockedCount = achievements.filter(a => a.ok).length;

  const handleExport = async () => {
    setExporting(true);
    try { await exportAnalyticsImage(data, levelInfo, achievements, categories); }
    finally { setExporting(false); }
  };

  const handleTheme = (t) => { applyTheme(t); setActiveTheme(t); };
  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose(); };

  return (
    <div ref={overlayRef} onClick={handleOverlay} className="analytics-overlay">
      {/* Top bar */}
      <div className="analytics-topbar">
        <span className="analytics-topbar-title">◈ Analítica de Perfil</span>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting} className="share-btn share-btn-download text-xs flex items-center gap-2">
            <FaDownload size={11} /> {exporting ? 'Generando…' : 'Exportar'}
          </button>
          <button onClick={onClose} className="social-btn"><FaTimes size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="analytics-body">
        <div className="analytics-inner">

          {/* ═══ 1. NIVEL & SCORE ═══ */}
          <Section title="Nivel & Score" icon="🎮">
            <div className="analytics-level-hero">
              <div className="analytics-level-icon">{levelInfo.level.icon}</div>
              <div className="analytics-level-name" style={{ color: levelInfo.level.color }}>
                {levelInfo.level.name}
              </div>
              <div className="analytics-level-score">Score: {levelInfo.score.toLocaleString('es')}</div>
              <div className="analytics-level-bar-bg">
                <div className="analytics-level-bar-fill" style={{ width: `${levelInfo.progress}%`, background: levelInfo.level.color }} />
              </div>
              {levelInfo.next && (
                <div className="analytics-level-next">
                  Siguiente: <strong style={{ color: levelInfo.next.color }}>{levelInfo.next.name}</strong> ({Math.round(levelInfo.progress)}%)
                </div>
              )}
            </div>
          </Section>

          {/* ═══ 2 & 3 & 6. ENGAGEMENT + RITMO + DEPRECADOS ═══ */}
          <div className="analytics-grid-3">
            <Section title="Engagement" icon="💬">
              <div className="flex flex-col gap-3">
                <StatMini label="Participación total" value={engagement} />
                <StatMini label="Respuestas" value={data.answers ?? 0} />
                <StatMini label="Preguntas" value={data.questions ?? 0} />
                <StatMini label="Ratio resp/preg" value={ratio} color="var(--cyan)" />
                <div className="text-xs mt-1" style={{ color: 'rgba(226,240,255,0.35)' }}>
                  {Number(ratio) > 2 ? '¡Gran ayudante de la comunidad!' :
                   Number(ratio) > 1 ? 'Buen balance participación' :
                   'Participa más respondiendo preguntas'}
                </div>
              </div>
            </Section>

            <Section title="Ritmo" icon="⏱️">
              <div className="flex flex-col gap-3">
                <StatMini label="Promedio entre cursos" value={`${rhythm.avg} días`} />
                <StatMini label="Más rápido" value={`${rhythm.fast} días`} color="var(--cyan)" />
                <StatMini label="Más lento" value={`${rhythm.slow} días`} color="#ff9f43" />
                <StatMini label="Cursos / mes" value={rhythm.perMonth} color="var(--green)" />
              </div>
            </Section>

            <Section title="Vigencia" icon="📊">
              <div className="flex flex-col gap-3 items-center">
                <div className="analytics-donut" style={{
                  background: `conic-gradient(var(--green) 0% ${100 - depPct}%, #ff9f43 ${100 - depPct}% 100%)`,
                }}>
                  <div className="analytics-donut-inner">
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '1.3rem' }}>{active}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(226,240,255,0.4)' }}>VIGENTES</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: 'var(--green)' }}>● {active} vigentes</span>
                  <span style={{ color: '#ff9f43' }}>● {deprecated} deprecados</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(226,240,255,0.35)' }}>
                  {depPct < 10 ? '¡Excelente! Tus cursos están actualizados' :
                   depPct < 30 ? 'Buen estado, considera actualizar algunos' :
                   'Muchos cursos deprecados, busca alternativas actuales'}
                </div>
              </div>
            </Section>
          </div>

          {/* ═══ 4. CATEGORÍAS ═══ */}
          <Section title="Distribución por Categorías" icon="📂">
            <div className="flex flex-col gap-2">
              {categories.map((c, i) => {
                const maxVal = categories[0]?.count || 1;
                const pct = (c.count / maxVal) * 100;
                return (
                  <div key={c.name} className="analytics-cat-row" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className="analytics-cat-name">{c.name}</span>
                    <div className="analytics-cat-bar-bg">
                      <div className="analytics-cat-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="analytics-cat-count">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ═══ 7. HEATMAP ═══ */}
          <Section title="Actividad (últimos 365 días)" icon="🗓️">
            <HeatmapGrid days={heatmap} />
          </Section>

          {/* ═══ 5. TIMELINE ═══ */}
          <Section title="Línea de Tiempo" icon="📈">
            <div className="analytics-timeline-scroll">
              <div className="analytics-timeline">
                {timeline.map((month, mi) => (
                  <div key={month.key} className="analytics-timeline-month">
                    <div className="analytics-timeline-dot" />
                    <div className="analytics-timeline-label">{month.label}</div>
                    <div className="analytics-timeline-count">{month.items.length} curso{month.items.length > 1 ? 's' : ''}</div>
                    <div className="analytics-timeline-courses">
                      {month.items.slice(0, 3).map((c, ci) => (
                        <div key={ci} className="analytics-timeline-course" title={c.title}>
                          {c.badge && <img src={c.badge} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
                          <span className="truncate text-xs">{c.title}</span>
                        </div>
                      ))}
                      {month.items.length > 3 && (
                        <span className="text-xs" style={{ color: 'rgba(226,240,255,0.3)' }}>+{month.items.length - 3} más</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ 11. LOGROS ═══ */}
          <Section title={`Logros (${unlockedCount}/${achievements.length})`} icon="🏆">
            <div className="analytics-achievements-grid">
              {achievements.map(a => (
                <div key={a.id} className={`analytics-achievement ${a.ok ? 'unlocked' : 'locked'}`}>
                  <span className="analytics-achievement-icon">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="analytics-achievement-name">{a.name}</div>
                    <div className="analytics-achievement-desc">{a.desc}</div>
                  </div>
                  {a.ok && <span className="analytics-achievement-check">✓</span>}
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ 10. RECOMENDACIONES ═══ */}
          <Section title="Recomendaciones" icon="💡">
            {recs.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(226,240,255,0.5)' }}>
                ¡Impresionante! Cubres todas las áreas.
              </p>
            ) : (
              <div className="analytics-recs-grid">
                {recs.map((r, i) => (
                  <div key={i} className={`analytics-rec ${r.type}`}>
                    <span className="analytics-rec-badge">{r.type === 'new' ? '🆕' : '📈'}</span>
                    <div>
                      <div className="analytics-rec-cat">{r.cat}</div>
                      <div className="analytics-rec-msg">{r.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ═══ 9. RANKING LOCAL ═══ */}
          <Section title="Ranking (perfiles visitados)" icon="🥇">
            <div className="analytics-board">
              {board.map((e, i) => (
                <div key={e.u} className={`analytics-board-row ${e.u.toLowerCase() === data.username.toLowerCase() ? 'current' : ''}`}>
                  <span className="analytics-board-pos">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  {e.a && <img src={e.a} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate block" style={{ color: '#e2f0ff' }}>{e.n}</span>
                    <span className="text-xs" style={{ color: 'rgba(226,240,255,0.4)' }}>@{e.u}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>{e.p.toLocaleString('es')}</span>
                    <span className="text-xs block" style={{ color: 'rgba(226,240,255,0.35)' }}>{e.c} cursos</span>
                  </div>
                </div>
              ))}
              {board.length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: 'rgba(226,240,255,0.3)' }}>
                  Visita más perfiles para construir el ranking
                </p>
              )}
            </div>
          </Section>

          {/* ═══ 12. TEMAS ═══ */}
          <Section title="Tema visual" icon="🎨">
            <div className="analytics-themes-grid">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTheme(t)}
                  className={`analytics-theme-btn ${activeTheme.id === t.id ? 'active' : ''}`}
                  style={{ '--tg': t.g, '--tc': t.c, '--tp': t.p, '--td': t.d }}
                >
                  <div className="analytics-theme-preview">
                    <div style={{ background: t.g, width: '33%', height: '100%' }} />
                    <div style={{ background: t.c, width: '33%', height: '100%' }} />
                    <div style={{ background: t.p, width: '34%', height: '100%' }} />
                  </div>
                  <span className="analytics-theme-name">{t.name}</span>
                </button>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
