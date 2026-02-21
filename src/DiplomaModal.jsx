import { useEffect, useRef, useState } from 'react';
import { FaTwitter, FaFacebook, FaLinkedin, FaTimes, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

export default function DiplomaModal({ course, onClose }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const overlayRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Cerrar al hacer clic fuera
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const approvedDate = course.approved_date
    ? new Date(course.approved_date).toLocaleDateString('es', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const shareButtons = [
    {
      label: 'Twitter / X',
      href: course.twitter_share,
      icon: <FaTwitter size={14} />,
      color: '#1da1f2',
    },
    {
      label: 'Facebook',
      href: course.facebook_share,
      icon: <FaFacebook size={14} />,
      color: '#1877f2',
    },
    {
      label: 'LinkedIn',
      href: course.linkedin_share,
      icon: <FaLinkedin size={14} />,
      color: '#0a66c2',
    },
  ].filter(b => b.href);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        background: 'rgba(2, 8, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="glass glow-green relative flex flex-col"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '92vh',
          overflow: 'hidden',
          borderRadius: 20,
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 pb-3 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {/* Badge + Título */}
            <div className="flex items-center gap-3 mb-2">
              <img
                src={course.badge}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
              />
              <h2
                className="font-bold leading-snug"
                style={{ fontSize: '0.95rem', color: '#e2f0ff' }}
              >
                {course.title}
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {approvedDate && (
                <span
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(10,233,138,0.1)',
                    border: '1px solid rgba(10,233,138,0.25)',
                    color: '#0ae98a',
                    letterSpacing: '0.06em',
                  }}
                >
                  ✓ Aprobado: {approvedDate}
                </span>
              )}
              {course.deprecated && (
                <span className="deprecated-badge">Curso deprecado</span>
              )}
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="social-btn flex-shrink-0"
            title="Cerrar"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="neon-divider mx-5" />

        {/* ── Imagen del diploma ── */}
        <div
          className="flex-1 overflow-auto"
          style={{ padding: '16px 20px' }}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'rgba(5,20,50,0.5)',
              border: '1px solid rgba(10,233,138,0.15)',
              minHeight: 200,
            }}
          >
            {/* Skeleton mientras carga */}
            {!imgLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(5,20,50,0.8)' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      border: '3px solid rgba(10,233,138,0.3)',
                      borderTopColor: '#0ae98a',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(10,233,138,0.6)' }}>
                    Cargando diploma…
                  </span>
                </div>
              </div>
            )}

            <img
              src={course.diploma_image}
              alt={`Diploma: ${course.title}`}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* ── Footer: share + acciones ── */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3">
          <div className="neon-divider mb-4" />

          <div className="flex items-center justify-between flex-wrap gap-3">

            {/* Share buttons */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs uppercase tracking-widest mr-1"
                style={{ color: 'rgba(226,240,255,0.35)' }}
              >
                Compartir
              </span>
              {shareButtons.map(btn => (
                <a
                  key={btn.label}
                  href={btn.href}
                  target="_blank"
                  rel="noreferrer"
                  title={btn.label}
                  className="social-btn"
                  style={{ color: btn.color, borderColor: btn.color + '55' }}
                >
                  {btn.icon}
                </a>
              ))}
            </div>

            {/* Acciones: ver en Platzi */}
            <div className="flex items-center gap-2">
              {course.diploma_url && (
                <a
                  href={course.diploma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="diploma-btn flex items-center gap-2"
                >
                  <FaExternalLinkAlt size={10} />
                  Ver en Platzi
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
