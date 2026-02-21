import { useEffect, useRef, useState } from 'react';

export default function AvatarModal({ src, name, username, onClose }) {
  const overlayRef = useRef(null);
  const [phase, setPhase] = useState('enter'); // enter | idle | exit

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const t = setTimeout(() => setPhase('idle'), 1400);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, []);

  const handleClose = () => {
    setPhase('exit');
    setTimeout(onClose, 700);
  };

  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className={`avatar-modal-overlay ${phase}`}
    >
      {/* Estrellas */}
      <div className="stars-layer stars-sm" />
      <div className="stars-layer stars-md" />
      <div className="stars-layer stars-lg" />

      {/* Contenedor central */}
      <div className="avatar-modal-center">

        {/* Anillos orbitales */}
        <div className="orbit-ring ring-1" />
        <div className="orbit-ring ring-2" />
        <div className="orbit-ring ring-3" />

        {/* Halo de energía */}
        <div className="avatar-halo" />

        {/* Avatar con animación warp */}
        <div className={`avatar-warp-container ${phase}`}>
          <img
            src={src}
            alt={name}
            className="avatar-warp-img"
            draggable={false}
          />
        </div>

        {/* Nombre debajo */}
        <div className={`avatar-modal-info ${phase === 'enter' ? 'info-enter' : phase === 'exit' ? 'info-exit' : ''}`}>
          <p className="avatar-modal-name glow-text">{name}</p>
          <p className="avatar-modal-user glitch-text">@{username}</p>
        </div>
      </div>
    </div>
  );
}
