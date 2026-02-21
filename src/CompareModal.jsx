import { useState, useRef } from 'react';
import { FaTimes, FaSearch, FaArrowRight } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { fetchData } from './fetchData';

/* ── Barra comparativa ── */
function CompareBar({ valA, valB, label }) {
  const max = Math.max(valA, valB, 1);
  const pctA = (valA / max) * 100;
  const pctB = (valB / max) * 100;
  const diff = valA - valB;

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: '#0ae98a', fontWeight: 700 }}>{(valA ?? 0).toLocaleString('es')}</span>
        <span style={{ color: 'rgba(226,240,255,0.4)', letterSpacing: '0.1em', fontSize: '0.7rem' }}>{label}</span>
        <span style={{ color: '#00d4ff', fontWeight: 700 }}>{(valB ?? 0).toLocaleString('es')}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Barra A — crece hacia la derecha desde el centro */}
        <div className="flex-1 flex justify-end">
          <div
            style={{
              height: 8, borderRadius: 4,
              width: `${pctA}%`,
              background: diff >= 0
                ? 'linear-gradient(90deg,rgba(10,233,138,0.3),#0ae98a)'
                : 'linear-gradient(90deg,rgba(10,233,138,0.2),rgba(10,233,138,0.5))',
              transition: 'width 0.6s ease',
              boxShadow: diff > 0 ? '0 0 8px rgba(10,233,138,0.5)' : 'none',
            }}
          />
        </div>
        <div style={{ width: 2, height: 14, background: 'rgba(226,240,255,0.15)', borderRadius: 2, flexShrink: 0 }} />
        {/* Barra B — crece hacia la derecha */}
        <div className="flex-1">
          <div
            style={{
              height: 8, borderRadius: 4,
              width: `${pctB}%`,
              background: diff <= 0
                ? 'linear-gradient(90deg,rgba(0,212,255,0.3),#00d4ff)'
                : 'linear-gradient(90deg,rgba(0,212,255,0.2),rgba(0,212,255,0.5))',
              transition: 'width 0.6s ease',
              boxShadow: diff < 0 ? '0 0 8px rgba(0,212,255,0.5)' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Avatar futurista con anillo orbital ── */
function FuturisticAvatar({ src, alt, color, size = 96, loading = false }) {
  const pad = 14;
  const total = size + pad * 2;

  if (loading) {
    return (
      <div style={{ position: 'relative', width: total, height: total, flexShrink: 0 }}>
        {/* Anillo exterior girando rápido */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `2px dashed ${color}55`,
          animation: 'orbit-fast 1s linear infinite',
        }} />
        {/* Anillo medio girando lento inverso */}
        <div style={{
          position: 'absolute', inset: 6, borderRadius: '50%',
          border: `2px solid transparent`,
          borderTopColor: color,
          borderRightColor: `${color}66`,
          animation: 'orbit-slow 1.6s linear infinite reverse',
        }} />
        {/* Centro pulsando */}
        <div style={{
          position: 'absolute', inset: pad,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, rgba(2,8,18,0.8) 70%)`,
          animation: 'pulse-glow 1.5s ease-in-out infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: total, height: total, flexShrink: 0 }}>
      {/* Anillo exterior cónico girando */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 60%, ${color} 100%)`,
        animation: 'orbit-fast 3s linear infinite',
        padding: 2,
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#020812' }} />
      </div>
      {/* Anillo punteado medio */}
      <div style={{
        position: 'absolute', inset: 4, borderRadius: '50%',
        border: `1px dashed ${color}44`,
        animation: 'orbit-slow 6s linear infinite reverse',
      }} />
      {/* Glow base */}
      <div style={{
        position: 'absolute', inset: pad - 2, borderRadius: '50%',
        boxShadow: `0 0 18px ${color}66, inset 0 0 10px ${color}22`,
        border: `2px solid ${color}`,
        overflow: 'hidden',
      }}>
        {src ? (
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', borderRadius: '50%',
              animation: 'avatar-appear 0.5s cubic-bezier(0.22,1,0.36,1) both',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `${color}22` }} />
        )}
        {/* Scan line */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `linear-gradient(180deg, transparent 40%, ${color}18 50%, transparent 60%)`,
          animation: 'scan-line 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

/* ── Tarjeta mini de perfil ── */
function MiniProfile({ data, color, loading = false }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
      <FuturisticAvatar src={data?.avatar} alt={data?.username} color={color} size={96} loading={loading} />
      {!loading && data && (
        <div className="text-center min-w-0 w-full px-1" style={{ animation: 'avatar-appear 0.4s ease both 0.2s' }}>
          <p className="text-sm font-bold truncate" style={{ color: '#e2f0ff' }}>{data.name}</p>
          <p className="text-xs truncate" style={{ color, letterSpacing: '0.05em' }}>@{data.username}</p>
          <p className="text-xs mt-1" style={{ color: `${color}99` }}>
            {(data.points ?? 0).toLocaleString('es')} pts
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Deducción de la diferencia de puntos ── */
function buildDeduction(a, b) {
  const winner = a.points >= b.points ? a : b;
  const loser  = a.points >= b.points ? b : a;
  const diff   = (winner.points ?? 0) - (loser.points ?? 0);

  if (diff === 0) return ['🤝 ¡Ambos perfiles tienen exactamente los mismos puntos!'];

  const reasons = [];

  const courseDiff  = (winner.courses?.length ?? 0) - (loser.courses?.length ?? 0);
  const answerDiff  = (winner.answers  ?? 0) - (loser.answers  ?? 0);
  const questionDiff= (winner.questions ?? 0) - (loser.questions ?? 0);

  reasons.push(`🏆 @${winner.username} lleva ventaja de ${diff.toLocaleString('es')} puntos sobre @${loser.username}.`);

  if (courseDiff > 0)
    reasons.push(`📚 Completó ${courseDiff} curso${courseDiff > 1 ? 's' : ''} más, lo que genera puntos por progreso y diplomas.`);
  else if (courseDiff < 0)
    reasons.push(`📚 Tiene ${Math.abs(courseDiff)} curso${Math.abs(courseDiff) > 1 ? 's' : ''} menos que su rival, pero aún así lidera en puntos.`);

  if (answerDiff > 0)
    reasons.push(`💬 Respondió ${answerDiff.toLocaleString('es')} pregunta${answerDiff > 1 ? 's' : ''} más en la comunidad — cada respuesta suma puntos.`);

  if (questionDiff > 0)
    reasons.push(`❓ Hizo ${questionDiff.toLocaleString('es')} pregunta${questionDiff > 1 ? 's' : ''} más — participar en el foro también suma.`);

  if (reasons.length === 1)
    reasons.push('📈 La diferencia de puntos proviene de la actividad acumulada en cursos y comunidad.');

  return reasons;
}

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════ */
export default function CompareModal({ initialUser, onClose }) {
  const [userA, setUserA] = useState(initialUser || '');
  const [userB, setUserB] = useState('');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);
  const [comparing, setComparing] = useState(false);

  const overlayRef = useRef(null);

  const fetchProfile = async (user, setData, setLoading, setError) => {
    if (!user.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchData(user.trim());
      if (res?.error) throw new Error(res.error);
      setData(res);
    } catch (e) {
      setError(e.message || 'No se encontró el perfil');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    await Promise.all([
      fetchProfile(userA, setDataA, setLoadingA, setErrorA),
      fetchProfile(userB, setDataB, setLoadingB, setErrorB),
    ]);
    setComparing(false);
  };

  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose(); };
  const handleKey = (e) => { if (e.key === 'Enter') handleCompare(); };

  const bothReady = dataA && dataB;
  const stats = [
    { label: 'PUNTOS',     a: dataA?.points     ?? 0, b: dataB?.points     ?? 0 },
    { label: 'CURSOS',     a: dataA?.courses?.length ?? 0, b: dataB?.courses?.length ?? 0 },
    { label: 'RESPUESTAS', a: dataA?.answers    ?? 0, b: dataB?.answers    ?? 0 },
    { label: 'PREGUNTAS',  a: dataA?.questions  ?? 0, b: dataB?.questions  ?? 0 },
  ];

  const deduction = bothReady ? buildDeduction(dataA, dataB) : [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(2,8,18,0.9)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="glass glow-green relative flex flex-col"
        style={{ width: '100%', maxWidth: 680, maxHeight: '94vh', overflow: 'hidden', borderRadius: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#0ae98a' }}>
            ◈ Comparar perfiles
          </span>
          <button onClick={onClose} className="social-btn" title="Cerrar"><FaTimes size={13} /></button>
        </div>
        <div className="neon-divider mx-5" />

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">

          {/* Inputs */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={userA}
                onChange={e => setUserA(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Usuario A…"
                className="input-neon w-full text-sm px-4 py-2"
                style={{ borderColor: 'rgba(10,233,138,0.5)' }}
              />
            </div>

            <div style={{ color: 'rgba(226,240,255,0.3)', flexShrink: 0 }}>
              <FaArrowRight size={14} />
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={userB}
                onChange={e => setUserB(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Usuario B…"
                className="input-neon w-full text-sm px-4 py-2"
                style={{ borderColor: 'rgba(0,212,255,0.5)' }}
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={!userA.trim() || !userB.trim() || comparing}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 flex-shrink-0"
              style={{ opacity: (!userA.trim() || !userB.trim()) ? 0.4 : 1 }}
            >
              <FaSearch size={11} />
              {comparing ? 'Cargando…' : 'Comparar'}
            </button>
          </div>

          {/* Errores */}
          {(errorA || errorB) && (
            <div className="flex flex-col gap-2">
              {errorA && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(255,30,30,0.08)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b' }}>
                  <FiAlertCircle size={13} /> Usuario A: {errorA}
                </div>
              )}
              {errorB && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(255,30,30,0.08)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b' }}>
                  <FiAlertCircle size={13} /> Usuario B: {errorB}
                </div>
              )}
            </div>
          )}

          {/* Avatares — visibles siempre (loading o loaded) */}
          {(comparing || bothReady) && (
            <div className="glass-sm rounded-xl p-5 flex items-center gap-4">
              <MiniProfile data={dataA} color="#0ae98a" loading={comparing || loadingA} />

              {/* VS badge */}
              <div
                className="flex-shrink-0 flex flex-col items-center gap-1"
                style={{ minWidth: 44 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '1px solid rgba(226,240,255,0.12)',
                  background: 'rgba(226,240,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(226,240,255,0.5)', fontSize: '0.7rem', fontWeight: 800,
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 12px rgba(226,240,255,0.04)',
                }}>
                  VS
                </div>
              </div>

              <MiniProfile data={dataB} color="#00d4ff" loading={comparing || loadingB} />
            </div>
          )}

          {/* Resultados */}
          {bothReady && !comparing && (
            <>

              {/* Barras comparativas */}
              <div className="glass-sm rounded-xl px-5 py-3">
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(226,240,255,0.35)' }}>
                  Estadísticas
                </p>
                {stats.map(s => (
                  <CompareBar key={s.label} label={s.label} valA={s.a} valB={s.b} />
                ))}
                {/* Leyenda */}
                <div className="flex justify-between mt-2">
                  <span className="text-xs" style={{ color: '#0ae98a' }}>● @{dataA.username}</span>
                  <span className="text-xs" style={{ color: '#00d4ff' }}>● @{dataB.username}</span>
                </div>
              </div>

              {/* Deducción */}
              <div
                className="rounded-xl px-5 py-4 flex flex-col gap-2"
                style={{ background: 'rgba(10,233,138,0.04)', border: '1px solid rgba(10,233,138,0.12)' }}
              >
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#0ae98a' }}>
                  ◈ Análisis de puntos
                </p>
                {deduction.map((line, i) => (
                  <p key={i} className="text-sm" style={{ color: 'rgba(226,240,255,0.8)', lineHeight: 1.6 }}>
                    {line}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes orbit-fast {
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-60%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(60%);  opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50%       { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes avatar-appear {
          from { opacity: 0; transform: scale(0.7) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1)   rotate(0deg);  }
        }
      `}</style>
    </div>
  );
}
