import { useEffect, useRef, useState } from 'react';
import { FaLinkedin, FaTimes, FaDownload, FaCopy, FaCheck } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || '';

function proxyUrl(src) {
  if (!src) return '';
  return `${API_BASE}/api_profile/proxy-image?url=${encodeURIComponent(src)}`;
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('no src'));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.crossOrigin = 'anonymous';
      fallback.onload = () => resolve(fallback);
      fallback.onerror = reject;
      fallback.src = src;
    };
    img.src = proxyUrl(src);
  });
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function circleImg(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function posOnArc(cx, cy, radius, total, i, skipDeg = 90) {
  const skipRad = (skipDeg * Math.PI) / 180;
  const arcLen = 2 * Math.PI - skipRad;
  const start = Math.PI / 2 + skipRad / 2;
  const step = arcLen / total;
  const angle = start + step * (i + 0.5);
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function neonGrad(ctx, w) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.2, '#0ae98a');
  g.addColorStop(0.5, '#00d4ff');
  g.addColorStop(0.8, '#0ae98a');
  g.addColorStop(1, 'transparent');
  return g;
}

/* ══════════════════════════════════════════════════════
   GENERA IMAGEN — formato seleccionable
   ══════════════════════════════════════════════════════ */
async function generateImage(data, format) {
  const W = 1200;
  const H = format === 'square' ? 1200 : 627;
  const isSquare = format === 'square';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const F = 'Inter, Segoe UI, Arial, sans-serif';
  const CX = W / 2;

  /* ══ FONDO ══ */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#020812');
  bg.addColorStop(0.4, '#081830');
  bg.addColorStop(1, '#020a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Grid */
  ctx.strokeStyle = 'rgba(10,233,138,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  /* Glow central — centrado vertical del bloque completo */
  const AY_CENTER = isSquare ? 555 : 268;
  const glow = ctx.createRadialGradient(CX, AY_CENTER, 0, CX, AY_CENTER, 500);
  glow.addColorStop(0, 'rgba(10,233,138,0.1)');
  glow.addColorStop(0.3, 'rgba(0,212,255,0.04)');
  glow.addColorStop(0.6, 'rgba(123,0,255,0.02)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const neon = neonGrad(ctx, W);
  ctx.strokeStyle = neon;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(W, 2); ctx.stroke();

  /* ══ BADGES — 3 anillos en arco (sin tapar el nombre) ══ */
  const courses = data.courses ?? [];
  const AR = isSquare ? 105 : 78;

  const rings = isSquare ? [
    { r: 180, size: 48, max: 8,  skip: 110, glow: '#0ae98a', border: 'rgba(10,233,138,0.3)',  bg: 'rgba(5,20,50,0.75)' },
    { r: 270, size: 42, max: 14, skip: 140, glow: '#00d4ff', border: 'rgba(0,212,255,0.25)',  bg: 'rgba(5,20,50,0.65)' },
    { r: 355, size: 36, max: 18, skip: 155, glow: '#7b00ff', border: 'rgba(123,0,255,0.25)', bg: 'rgba(5,20,50,0.55)' },
  ] : [
    { r: 145, size: 38, max: 8,  skip: 110, glow: '#0ae98a', border: 'rgba(10,233,138,0.3)',  bg: 'rgba(5,20,50,0.75)' },
    { r: 220, size: 32, max: 14, skip: 145, glow: '#00d4ff', border: 'rgba(0,212,255,0.25)',  bg: 'rgba(5,20,50,0.65)' },
  ];

  /* Repartir cursos en anillos */
  let remaining = courses.length;
  let offset = 0;
  const ringData = rings.map(ring => {
    const count = Math.min(remaining, ring.max);
    const slice = courses.slice(offset, offset + count);
    offset += count;
    remaining -= count;
    return { ...ring, count, courses: slice };
  });

  /* Cargar todas las imágenes de badges */
  const allBadgeCourses = ringData.flatMap(r => r.courses);
  const badgeImgs = await Promise.all(
    allBadgeCourses.map(c => c.badge ? loadImg(c.badge).catch(() => null) : Promise.resolve(null)),
  );

  /* Dibujar arcos de órbita */
  const drawArcRing = (radius, skipDeg, color) => {
    const skipRad = (skipDeg * Math.PI) / 180;
    const startA = Math.PI / 2 + skipRad / 2;
    const endA = startA + (2 * Math.PI - skipRad);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CX, AY_CENTER, radius, startA, endA);
    ctx.stroke();
  };

  ringData.forEach(r => {
    if (r.count > 0) drawArcRing(r.r, r.skip, r.border.replace(/0\.\d+\)/, '0.07)'));
  });

  /* Líneas de conexión */
  ringData.forEach(r => {
    for (let i = 0; i < r.count; i++) {
      const p = posOnArc(CX, AY_CENTER, r.r, r.count, i, r.skip);
      ctx.strokeStyle = 'rgba(10,233,138,0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(CX, AY_CENTER); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  });

  /* Dibujar badges por anillo */
  let imgIdx = 0;
  ringData.forEach(ring => {
    for (let i = 0; i < ring.count; i++) {
      const p = posOnArc(CX, AY_CENTER, ring.r, ring.count, i, ring.skip);
      const s = ring.size;
      const badge = badgeImgs[imgIdx++];

      ctx.shadowColor = ring.glow;
      ctx.shadowBlur = 10;
      ctx.fillStyle = ring.bg;
      ctx.beginPath(); ctx.arc(p.x, p.y, s / 2 + 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ring.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, s / 2 + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      if (badge) {
        try {
          ctx.save();
          ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(badge, p.x - s / 2, p.y - s / 2, s, s);
          ctx.restore();
        } catch { /* skip */ }
      }
    }
  });

  /* ══ AVATAR ══ */
  try {
    const avatar = await loadImg(data.avatar);
    circleImg(ctx, avatar, CX, AY_CENTER, AR);
  } catch { /* skip */ }

  ctx.strokeStyle = '#0ae98a';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#0ae98a';
  ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(CX, AY_CENTER, AR + 4, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;

  /* ══ NOMBRE (encima de la línea divisora) ══ */
  const nameFont = isSquare ? 54 : 42;
  const DY = AY_CENTER + (isSquare ? 195 : 145);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2f0ff';
  ctx.font = `bold ${nameFont}px ${F}`;
  ctx.fillText(data.name, CX, DY - (isSquare ? 16 : 12));

  /* ══ DIVIDER ══ */
  ctx.strokeStyle = neon;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(80, DY); ctx.lineTo(W - 80, DY); ctx.stroke();

  /* ══ @USERNAME + cursos (debajo de la línea) ══ */
  const totalShown = ringData.reduce((a, r) => a + r.count, 0);
  const extra = courses.length - totalShown;
  const userFont = isSquare ? 26 : 20;
  const cursosFont = isSquare ? 20 : 16;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0ae98a';
  ctx.shadowColor = '#0ae98a';
  ctx.shadowBlur = 10;
  ctx.font = `${userFont}px ${F}`;
  ctx.fillText(`@${data.username}`, CX, DY + (isSquare ? 30 : 22));
  ctx.shadowBlur = 0;

  if (extra > 0) {
    ctx.fillStyle = 'rgba(0,212,255,0.4)';
    ctx.font = `${cursosFont}px ${F}`;
    ctx.fillText(`${courses.length} cursos completados`, CX, DY + (isSquare ? 56 : 42));
  }

  /* ══ STATS ══ */
  const statsArr = [
    { label: 'PUNTOS', val: (data.points ?? 0).toLocaleString('es') },
    { label: 'CURSOS', val: String(courses.length) },
    { label: 'RESPUESTAS', val: String(data.answers ?? 0) },
    { label: 'PREGUNTAS', val: String(data.questions ?? 0) },
  ];

  const valFont = isSquare ? 64 : 48;
  const lblFont = isSquare ? 16 : 13;
  const SY = DY + (isSquare ? 80 : 58);
  const pillH = isSquare ? 110 : 80;
  const pillGap = isSquare ? 24 : 16;

  ctx.font = `bold ${valFont}px ${F}`;
  const pillWidths = statsArr.map(s => {
    const vw = ctx.measureText(s.val).width;
    return Math.max(vw + 50, isSquare ? 200 : 150);
  });
  const totalPillW = pillWidths.reduce((a, b) => a + b, 0) + pillGap * 3;
  let px = (W - totalPillW) / 2;

  statsArr.forEach((s, i) => {
    const pw = pillWidths[i];

    rrect(ctx, px, SY, pw, pillH, isSquare ? 16 : 12);
    ctx.fillStyle = 'rgba(10,233,138,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,233,138,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ae98a';
    ctx.shadowColor = '#0ae98a';
    ctx.shadowBlur = 16;
    ctx.font = `bold ${valFont}px ${F}`;
    ctx.fillText(s.val, px + pw / 2, SY + (isSquare ? 58 : 44));
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(226,240,255,0.4)';
    ctx.font = `bold ${lblFont}px ${F}`;
    ctx.fillText(s.label, px + pw / 2, SY + (isSquare ? 88 : 66));

    px += pw + pillGap;
  });

  /* ══ BRANDING ══ */
  ctx.strokeStyle = neon;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H - 3); ctx.lineTo(W, H - 3); ctx.stroke();

  const BY = H - (isSquare ? 50 : 30);

  ctx.textAlign = 'left';
  ctx.font = `bold ${isSquare ? 22 : 16}px ${F}`;
  ctx.fillStyle = '#0ae98a';
  ctx.shadowColor = '#0ae98a';
  ctx.shadowBlur = 8;
  ctx.fillText('PLATZI', 50, BY);
  const plw = ctx.measureText('PLATZI').width;
  ctx.fillStyle = '#00d4ff';
  ctx.fillText('.', 50 + plw, BY);
  ctx.fillStyle = '#0ae98a';
  ctx.fillText('PROFILE', 50 + plw + ctx.measureText('.').width, BY);
  ctx.shadowBlur = 0;

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(226,240,255,0.18)';
  ctx.font = `${isSquare ? 18 : 14}px ${F}`;
  ctx.fillText(`platzi.com/p/${data.username}`, W - 50, BY);
  ctx.textAlign = 'left';

  return canvas;
}

/* ── Texto para LinkedIn ── */
function buildShareText(data) {
  const courses = (data.courses ?? []).slice(0, 8);
  const list = courses.map(c => `  • ${c.title}`).join('\n');
  return [
    `🚀 Mi perfil en Platzi\n`,
    `📊 Stats:`,
    `  • ${(data.points ?? 0).toLocaleString('es')} puntos de experiencia`,
    `  • ${data.courses?.length ?? 0} cursos completados`,
    `  • ${data.answers ?? 0} respuestas en la comunidad\n`,
    `🎓 Algunos de mis cursos:`,
    list,
    `\n🔗 Perfil: https://platzi.com/p/${data.username}/`,
    `\n#Platzi #NuncaParesDeAprender #Desarrollo #Tech`,
  ].join('\n');
}

/* ══════════════════════════════════════════════════════ */
export default function ShareModal({ data, onClose }) {
  const overlayRef = useRef(null);
  const [canvasUrl, setCanvasUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState('square');

  const generate = (fmt) => {
    setGenerating(true);
    setCanvasUrl(null);
    generateImage(data, fmt)
      .then(c => setCanvasUrl(c.toDataURL('image/png')))
      .catch(err => console.warn('[share]', err))
      .finally(() => setGenerating(false));
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    generate(format);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const switchFormat = (fmt) => {
    if (fmt === format) return;
    setFormat(fmt);
    generate(fmt);
  };

  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose(); };
  const shareText = buildShareText(data);

  const openLinkedIn = () => {
    if (canvasUrl) {
      const a = document.createElement('a');
      a.href = canvasUrl;
      a.download = `platzi-${data.username}-${format}.png`;
      a.click();
    }
    navigator.clipboard.writeText(shareText).catch(() => {});
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`, '_blank');
    }, 600);
  };

  const downloadImage = () => {
    if (!canvasUrl) return;
    const a = document.createElement('a');
    a.href = canvasUrl;
    a.download = `platzi-${data.username}-${format}.png`;
    a.click();
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(2,8,18,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div className="glass glow-green relative flex flex-col" style={{ width: '100%', maxWidth: 700, maxHeight: '94vh', overflow: 'hidden', borderRadius: 20 }}>

        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#0ae98a' }}>
            ◈ Compartir perfil
          </span>
          <button onClick={onClose} className="social-btn" title="Cerrar"><FaTimes size={13} /></button>
        </div>

        {/* Selector de formato */}
        <div className="flex items-center gap-2 px-5 pb-3">
          {[
            { id: 'square', label: '1200×1200', sub: 'Cuadrado' },
            { id: 'landscape', label: '1200×627', sub: 'Enlace' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => switchFormat(f.id)}
              className="text-xs px-3 py-2 rounded-lg transition-all"
              style={{
                border: `1px solid ${format === f.id ? 'rgba(10,233,138,0.5)' : 'rgba(226,240,255,0.1)'}`,
                background: format === f.id ? 'rgba(10,233,138,0.12)' : 'transparent',
                color: format === f.id ? '#0ae98a' : 'rgba(226,240,255,0.35)',
              }}
            >
              {f.label} <span style={{ opacity: 0.6 }}>· {f.sub}</span>
            </button>
          ))}
        </div>

        <div className="neon-divider mx-5" />

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(10,233,138,0.15)', background: 'rgba(2,8,18,0.6)' }}>
            {generating ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(10,233,138,0.3)', borderTopColor: '#0ae98a', animation: 'spin 1s linear infinite' }} />
                  <span className="text-xs" style={{ color: 'rgba(10,233,138,0.5)' }}>Generando…</span>
                </div>
              </div>
            ) : canvasUrl ? (
              <img src={canvasUrl} alt="Share card" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              <div className="p-5 text-center">
                <p className="text-sm" style={{ color: 'rgba(226,240,255,0.4)' }}>No se pudo generar</p>
              </div>
            )}
          </div>

          <div className="glass-sm p-4 rounded-xl" style={{ maxHeight: 120, overflow: 'auto' }}>
            <p className="text-xs mb-2 font-bold tracking-widest uppercase" style={{ color: 'rgba(226,240,255,0.35)' }}>Texto</p>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'rgba(226,240,255,0.7)', fontFamily: 'inherit', lineHeight: 1.5 }}>
              {shareText}
            </pre>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 pb-5 pt-2">
          <div className="neon-divider mb-4" />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={openLinkedIn} className="share-btn share-btn-linkedin flex items-center gap-2 flex-1 justify-center flex-col py-3">
              <span className="flex items-center gap-2"><FaLinkedin size={16} /> Compartir en LinkedIn</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Descarga imagen + copia texto + abre LinkedIn</span>
            </button>
            <button onClick={downloadImage} disabled={generating || !canvasUrl} className="share-btn share-btn-download flex items-center gap-2">
              <FaDownload size={13} />
              Descargar
            </button>
            <button onClick={copyText} className="share-btn share-btn-copy flex items-center gap-2">
              {copied ? <FaCheck size={13} /> : <FaCopy size={13} />}
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
