import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const COUNT = isMobile ? 150 : 300;
const CONN_DIST = isMobile ? 20 : 24;
const MAX_LINES = isMobile ? 300 : 700;
const MOUSE_R = 35;
const MOUSE_F = 0.25;

const PALETTE = [
  new THREE.Color(0x0ae98a),
  new THREE.Color(0x00d4ff),
  new THREE.Color(0x7b00ff),
];

/* ── Shaders para partículas con tamaño y color variable ── */
const VERT = `
  attribute float aSize;
  attribute vec3  aColor;
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (180.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
    vAlpha = smoothstep(250.0, 40.0, -mv.z);
  }
`;
const FRAG = `
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, glow * vAlpha * 0.9);
  }
`;

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
    renderer.setSize(W(), H());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020812);
    scene.fog = new THREE.FogExp2(0x020812, 0.005);

    const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 500);
    camera.position.z = 80;

    /* ── Post-processing: Bloom ── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomRes = isMobile
      ? new THREE.Vector2(Math.floor(W() / 2), Math.floor(H() / 2))
      : new THREE.Vector2(W(), H());
    const bloom = new UnrealBloomPass(bloomRes, 1.1, 0.45, 0.12);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    /* ═══════════════════════════════════════════════════
       PARTÍCULAS — multicolor, tamaño variable, interactivas
       ═══════════════════════════════════════════════════ */
    const particles = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 160,
      z: (Math.random() - 0.5) * 60 - 10,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
    }));

    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const siz = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      siz[i] = Math.random() * 3.5 + 0.8;
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    ptGeo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
    ptGeo.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1));

    const ptMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(ptGeo, ptMat));

    /* ── Líneas de conexión ── */
    const lnPos = new Float32Array(MAX_LINES * 6);
    const lnGeo = new THREE.BufferGeometry();
    lnGeo.setAttribute('position', new THREE.BufferAttribute(lnPos, 3));
    lnGeo.setDrawRange(0, 0);
    const lnMat = new THREE.LineBasicMaterial({
      color: 0x0ae98a, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.LineSegments(lnGeo, lnMat));

    /* ═══════════════════════════════════════════════════
       GEOMETRÍA WIREFRAME — torus, torusKnot, dodecaedro
       ═══════════════════════════════════════════════════ */
    const wireMat = (c, o) => new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: o, wireframe: true,
      blending: THREE.AdditiveBlending,
    });

    const torusSeg = isMobile ? 60 : 100;
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(45, 0.2, 6, torusSeg),
      wireMat(0x00d4ff, 0.055),
    );
    torus.rotation.x = Math.PI / 3;
    scene.add(torus);

    const knotSeg = isMobile ? 50 : 80;
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(18, 0.15, knotSeg, 6, 2, 3),
      wireMat(0x0ae98a, 0.035),
    );
    knot.position.set(38, 15, -20);
    scene.add(knot);

    const dodeca = new THREE.Mesh(
      new THREE.DodecahedronGeometry(12, 0),
      wireMat(0x7b00ff, 0.055),
    );
    dodeca.position.set(-40, -12, -15);
    scene.add(dodeca);

    /* ── Grid cyberpunk ── */
    const gridDiv = isMobile ? 30 : 50;
    const grid = new THREE.GridHelper(300, gridDiv, 0x0ae98a, 0x0ae98a);
    grid.material.transparent = true;
    grid.material.opacity = 0.025;
    grid.material.blending = THREE.AdditiveBlending;
    grid.position.y = -55;
    scene.add(grid);

    /* ── Wisps luminosos orbitando ── */
    const wispGeo = new THREE.SphereGeometry(0.5, 8, 6);
    const wisps = PALETTE.map((color, i) => {
      const m = new THREE.Mesh(wispGeo, new THREE.MeshBasicMaterial({ color }));
      m.userData.ph = i * 2.1;
      scene.add(m);
      return m;
    });

    /* ── Mouse ── */
    let mx = 0, my = 0;
    const onMouse = (e) => {
      mx = (e.clientX / W() - 0.5) * 2;
      my = -(e.clientY / H() - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    /* ═══════════════════════════════════════════════════
       LOOP DE ANIMACIÓN
       ═══════════════════════════════════════════════════ */
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = Date.now() * 0.0003;
      const mwx = mx * 90, mwy = my * 70;

      /* ── Partículas: repulsión del mouse + drift ── */
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const dx = p.x - mwx, dy = p.y - mwy;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_R * MOUSE_R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((MOUSE_R - d) / MOUSE_R) * MOUSE_F;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.x) > 100) p.vx *= -1;
        if (Math.abs(p.y) > 80)  p.vy *= -1;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      }
      ptGeo.attributes.position.needsUpdate = true;

      /* ── Conexiones ── */
      let seg = 0;
      for (let i = 0; i < COUNT && seg < MAX_LINES; i++) {
        for (let j = i + 1; j < COUNT && seg < MAX_LINES; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (Math.abs(dx) > CONN_DIST || Math.abs(dy) > CONN_DIST) continue;
          if (dx * dx + dy * dy < CONN_DIST * CONN_DIST) {
            const b = seg * 6;
            lnPos[b]   = particles[i].x; lnPos[b+1] = particles[i].y; lnPos[b+2] = particles[i].z;
            lnPos[b+3] = particles[j].x; lnPos[b+4] = particles[j].y; lnPos[b+5] = particles[j].z;
            seg++;
          }
        }
      }
      lnGeo.attributes.position.needsUpdate = true;
      lnGeo.setDrawRange(0, seg * 2);

      /* ── Rotaciones ── */
      torus.rotation.z = t * 0.4;
      torus.rotation.y = t * 0.15;
      knot.rotation.x  = t * 0.6;
      knot.rotation.y  = t * 0.3;
      dodeca.rotation.x = t * 0.5;
      dodeca.rotation.z = t * 0.25;

      /* ── Wisps ── */
      wisps.forEach(w => {
        const ph = w.userData.ph;
        w.position.set(
          Math.sin(t * 0.8 + ph) * 35,
          Math.cos(t * 0.6 + ph) * 25,
          Math.sin(t * 0.4 + ph) * 15,
        );
      });

      /* ── Camera parallax ── */
      camera.position.x += (mx * 8 - camera.position.x) * 0.02;
      camera.position.y += (my * 5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      composer.render();
    };
    tick();

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
      composer.setSize(W(), H());
    };
    window.addEventListener('resize', onResize);

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      composer.dispose();
      ptGeo.dispose(); ptMat.dispose();
      lnGeo.dispose(); lnMat.dispose();
      torus.geometry.dispose(); torus.material.dispose();
      knot.geometry.dispose();  knot.material.dispose();
      dodeca.geometry.dispose(); dodeca.material.dispose();
      grid.geometry.dispose(); grid.material.dispose();
      wispGeo.dispose();
      wisps.forEach(w => w.material.dispose());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
