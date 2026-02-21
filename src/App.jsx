import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { FaTwitter, FaMailBulk, FaSearch, FaTimes, FaLinkedin, FaBalanceScale, FaChartBar } from 'react-icons/fa';
import { FiGithub, FiGlobe, FiAlertCircle } from 'react-icons/fi';
import { fetchData } from './fetchData';

const Background = lazy(() => import('./Background'));
const DiplomaModal = lazy(() => import('./DiplomaModal'));
const AvatarModal = lazy(() => import('./AvatarModal'));
const ShareModal = lazy(() => import('./ShareModal'));
const CompareModal = lazy(() => import('./CompareModal'));
const AnalyticsModal = lazy(() => import('./AnalyticsModal'));
import { applyTheme, loadSavedTheme } from './themes';

/* ─── Hook: count-up animado ────────────────────────── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target || target === '—') { setValue(target); return; }
    const num = typeof target === 'string' ? parseInt(target.replace(/,/g, ''), 10) : target;
    if (isNaN(num)) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(num * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return typeof value === 'number' ? value.toLocaleString('es') : value;
}

/* ─── Hook: tilt 3D en tarjeta ──────────────────────── */
function useTilt(maxDeg = 6) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg) scale(1.01)`;
    el.style.transition = 'transform 0.1s ease';
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
  };
  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}

/* ─── Stat animado ──────────────────────────────────── */
function AnimatedStat({ label, value }) {
  const displayed = useCountUp(value);
  return (
    <div className="stat-pill">
      <div className="stat-value">{displayed}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Icono social ──────────────────────────────────── */
function SocialIcon({ social }) {
  const map = {
    twitter: { href: `https://twitter.com/intent/user?user_id=${social.id}`, icon: <FaTwitter size={13} />, title: 'X / Twitter' },
    'google-oauth2': { href: null, icon: <FaMailBulk size={13} />, title: social.id },
    github: { href: `https://github.com/${social.id}`, icon: <FiGithub size={13} />, title: 'GitHub' },
    website: { href: social.id, icon: <FiGlobe size={13} />, title: 'Sitio web' },
  };
  const cfg = map[social.type];
  if (!cfg) return null;
  return cfg.href
    ? <a href={cfg.href} target="_blank" rel="noreferrer" className="social-btn" title={cfg.title}>{cfg.icon}</a>
    : <span className="social-btn" title={cfg.title}>{cfg.icon}</span>;
}

/* ─── Helpers URL ───────────────────────────────────── */
function getUserFromURL() {
  return new URLSearchParams(window.location.search).get('u') || 'Jucamhc';
}
function setUserInURL(user) {
  const url = new URL(window.location.href);
  url.searchParams.set('u', user);
  window.history.replaceState({}, '', url);
}

/* ════════════════════════════════════════════════════════
   APP
   ════════════════════════════════════════════════════════ */
export default function App() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState('');
  const [showDeprecated, setShowDeprecated] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [pulseKey, setPulseKey]   = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { applyTheme(loadSavedTheme()); }, []);

  const tilt = useTilt(5);

  /* ── Búsqueda ── */
  const search = useCallback(async (user) => {
    if (!user) return;
    setLoading(true);
    setScanning(true);
    setError(null);
    setPulseKey(k => k + 1);
    try {
      const result = await fetchData(user);
      if (result?.error) throw new Error(result.error);
      setData(result);
      setUserInURL(user);
      setFilter('');
    } catch (e) {
      setError(e.message || 'No se pudo cargar el perfil.');
      setData(null);
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(false), 1500);
    }
  }, []);

  const handleSearch = () => {
    const val = inputRef.current?.value?.trim();
    if (val) { search(val); inputRef.current.value = ''; }
  };

  useEffect(() => { search(getUserFromURL()); }, [search]);

  /* ── Cursos filtrados ── */
  const filteredCourses = (data?.courses ?? []).filter(c => {
    if (!showDeprecated && c.deprecated) return false;
    if (!filter) return true;
    return c.title.toLowerCase().includes(filter.toLowerCase());
  });

  const deprecatedCount = (data?.courses ?? []).filter(c => c.deprecated).length;

  /* ── Stats ── */
  const stats = [
    { label: 'Puntos',     value: data?.points     ?? '—' },
    { label: 'Respuestas', value: data?.answers    ?? '—' },
    { label: 'Preguntas',  value: data?.questions  ?? '—' },
    { label: 'Cursos',     value: data?.courses?.length ?? '—' },
  ];

  const socials = data?.socials
    ? [...new Map(data.socials.map(s => [`${s.type}-${s.id}`, s])).values()]
    : [];

  /* ════════ JSX ════════ */
  return (
    <>
      <Suspense fallback={<div className="fixed inset-0" style={{ background: 'var(--dark)', zIndex: 0 }} />}>
        <Background />
      </Suspense>

      {/* Pulse wave al buscar */}
      {scanning && <div key={pulseKey} className="pulse-wave" />}

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 gap-5">

        {/* ── Barra de búsqueda ── */}
        <div className="glass glow-green w-full max-w-2xl p-4 fade-up">
          <div className="flex items-center gap-3">
            <span className="logo-pulse" style={{ color: '#0ae98a', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              PLATZI<span style={{ color: '#00d4ff' }}>.</span>PROFILE
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar usuario de Platzi…"
              className="input-neon flex-1 px-4 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
            >
              <FaSearch size={12} />
              {loading ? 'Escaneando…' : 'Buscar'}
            </button>
            <button
              onClick={() => setShowCompare(true)}
              title="Comparar dos perfiles"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg flex-shrink-0 transition-all"
              style={{
                border: '1px solid rgba(0,212,255,0.45)',
                background: 'rgba(0,212,255,0.07)',
                color: '#00d4ff',
                fontWeight: 600,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              <FaBalanceScale size={13} />
              Comparar
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="glass w-full max-w-2xl px-5 py-4 flex items-center gap-4 fade-up"
            style={{ borderColor: 'rgba(255,80,80,0.4)', background: 'rgba(255,30,30,0.08)' }}
          >
            <FiAlertCircle size={22} style={{ color: '#ff6b6b', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ff6b6b' }}>No encontrado</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,150,150,0.75)' }}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto social-btn"
              style={{ borderColor: 'rgba(255,80,80,0.4)', color: '#ff6b6b' }}
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && !data && (
          <div className="glass w-full max-w-2xl p-6 fade-up">
            <div className="flex gap-6">
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(10,233,138,0.1)', animation: 'pulse 1.5s infinite' }} />
              <div className="flex-1 flex flex-col gap-3">
                <div style={{ height: 14, width: '35%', borderRadius: 6, background: 'rgba(10,233,138,0.1)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 28, width: '65%', borderRadius: 6, background: 'rgba(10,233,138,0.08)', animation: 'pulse 1.5s infinite 0.15s' }} />
                <div className="grid grid-cols-4 gap-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 56, borderRadius: 12, background: 'rgba(10,233,138,0.07)', animation: `pulse 1.5s infinite ${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
           TARJETA DE PERFIL — con tilt 3D
           ══════════════════════════════════════════════ */}
        {data && (
          <div
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            className="glass glow-green tilt-card w-full max-w-2xl p-6 fade-up relative overflow-hidden"
          >
            {scanning && <div className="scan-line" />}

            <div className="flex gap-6 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div
                  className="avatar-ring float-anim"
                  onClick={() => setShowAvatar(true)}
                  style={{ cursor: 'pointer' }}
                  title="Ver avatar"
                >
                  <img
                    src={data.avatar}
                    alt={data.username}
                    className="rounded-full"
                    style={{ width: 88, height: 88, objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {socials.map((s, i) => <SocialIcon key={i} social={s} />)}
                </div>
                {data.flag && (
                  <img src={data.flag} alt="flag" style={{ width: 24, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="glitch-text text-xs" style={{ color: '#0ae98a', letterSpacing: '0.15em' }}>
                    @{data.username}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAnalytics(true)}
                      className="analytics-profile-btn"
                    >
                      <FaChartBar size={13} />
                      Analítica
                    </button>
                    <button
                      onClick={() => setShowShare(true)}
                      className="share-profile-btn"
                    >
                      <FaLinkedin size={13} />
                      Compartir
                    </button>
                  </div>
                </div>
                <h1 className="text-2xl font-bold glow-text mb-3" style={{ lineHeight: 1.2 }}>
                  {data.name}
                </h1>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {stats.map(s => <AnimatedStat key={s.label} {...s} />)}
                </div>

                {data.bio && (
                  <div className="glass-sm px-4 py-3">
                    <p style={{ fontSize: '0.82rem', color: 'rgba(226,240,255,0.75)', lineHeight: 1.6 }}>
                      {data.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
           CURSOS — con stagger + progress bar
           ══════════════════════════════════════════════ */}
        {data?.courses?.length > 0 && (
          <div className="glass w-full max-w-2xl fade-up">
            {/* Header + filtros */}
            <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#0ae98a' }}>
                  ◈ Cursos completados
                </span>
                <span className="glass-sm px-3 py-1 text-xs" style={{ color: '#00d4ff' }}>
                  {filteredCourses.length}
                  {filter || !showDeprecated ? ` / ${data.courses.length}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <FaSearch
                    size={11}
                    style={{
                      position: 'absolute', left: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(10,233,138,0.5)',
                    }}
                  />
                  <input
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filtrar cursos…"
                    className="input-neon w-full text-xs py-2"
                    style={{ paddingLeft: 32, paddingRight: filter ? 32 : 12 }}
                  />
                  {filter && (
                    <button
                      onClick={() => setFilter('')}
                      style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(226,240,255,0.4)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {deprecatedCount > 0 && (
                  <button
                    onClick={() => setShowDeprecated(v => !v)}
                    className="text-xs px-3 py-2 rounded-lg flex-shrink-0 transition-all"
                    style={{
                      border: `1px solid ${showDeprecated ? 'rgba(255,159,67,0.4)' : 'rgba(226,240,255,0.15)'}`,
                      background: showDeprecated ? 'rgba(255,159,67,0.08)' : 'transparent',
                      color: showDeprecated ? '#ff9f43' : 'rgba(226,240,255,0.35)',
                    }}
                  >
                    {showDeprecated ? `Ocultar ${deprecatedCount} deprecados` : `Mostrar ${deprecatedCount} deprecados`}
                  </button>
                )}
              </div>
            </div>

            <div className="neon-divider mx-5" />

            {/* Lista de cursos */}
            <div className="overflow-auto px-4 pb-4" style={{ maxHeight: '420px' }}>
              {filteredCourses.length === 0 ? (
                <div className="py-8 text-center" style={{ color: 'rgba(226,240,255,0.3)' }}>
                  <p className="text-sm">No se encontraron cursos</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  {filteredCourses.map((course, idx) => (
                    <div
                      key={course.id ?? course.slug ?? idx}
                      className="course-card stagger-in"
                      style={{
                        cursor: course.diploma_image ? 'pointer' : 'default',
                        animationDelay: `${Math.min(idx * 0.04, 1.5)}s`,
                      }}
                      onClick={() => course.diploma_image && setSelectedCourse(course)}
                      title={course.diploma_image ? 'Ver diploma' : undefined}
                    >
                      <img
                        src={course.badge}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug" style={{ color: '#e2f0ff' }}>
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {course.deprecated && <span className="deprecated-badge">deprecado</span>}
                          <span className="text-xs" style={{ color: 'rgba(10,233,138,0.6)' }}>
                            {course.completed}%
                          </span>
                          {course.approved_date && (
                            <span className="text-xs" style={{ color: 'rgba(226,240,255,0.3)' }}>
                              · {new Date(course.approved_date).toLocaleDateString('es', { year: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {/* Barra de progreso animada */}
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${course.completed ?? 0}%` }}
                          />
                        </div>
                      </div>

                      {course.diploma_image && (
                        <span
                          className="diploma-btn flex-shrink-0"
                          onClick={e => { e.stopPropagation(); setSelectedCourse(course); }}
                        >
                          Ver diploma
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center pb-2" style={{ color: 'rgba(226,240,255,0.15)', letterSpacing: '0.1em' }}>
          PLATZI PROFILE EXPLORER · 2050
        </p>
      </div>

      <Suspense fallback={null}>
        {selectedCourse && (
          <DiplomaModal
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />
        )}

        {showAvatar && data && (
          <AvatarModal
            src={data.avatar}
            name={data.name}
            username={data.username}
            onClose={() => setShowAvatar(false)}
          />
        )}

        {showShare && data && (
          <ShareModal
            data={data}
            onClose={() => setShowShare(false)}
          />
        )}

        {showCompare && (
          <CompareModal
            initialUser={data?.username || ''}
            onClose={() => setShowCompare(false)}
          />
        )}

        {showAnalytics && data && (
          <AnalyticsModal
            data={data}
            onClose={() => setShowAnalytics(false)}
          />
        )}
      </Suspense>
    </>
  );
}
