import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildCake } from './cake.js';
import { Smoke, Glints } from './particles.js';
import { createBlowGame } from './blow.js';

gsap.registerPlugin(ScrollTrigger);
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ scene */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);

const hemi = new THREE.HemisphereLight('#fff0f5', '#ffb3cd', 0.9);
const key = new THREE.DirectionalLight('#fff4ec', 2.4);
key.position.set(4, 7, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -4; key.shadow.camera.right = 4;
key.shadow.camera.top = 5; key.shadow.camera.bottom = -3;
key.shadow.bias = -0.0004;
const rim = new THREE.DirectionalLight('#ff8db5', 1.4);
rim.position.set(-5, 3, -4);
scene.add(hemi, key, rim);

const { root, cake, candle, flame, topY } = buildCake();
cake.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
scene.add(root);

const smoke = new Smoke(scene);
const glints = new Glints(scene);

/* ------------------------------------------------------------------ state
   Everything the scroll timeline animates lives here. The render loop only
   reads it, so scrubbing forwards and backwards always stays consistent. */
const S = {
  lift: 6,        // candle height above its resting spot
  flame: 0,       // 0 = out, 1 = lit
  lean: 0,        // flame bending away from the breath
  puff: 0,        // drives smoke emission
  dark: 0,        // 0 = bright pink world, 1 = lights out
  camZ: 9.4, camY: 3.4, lookY: 1.5,
  spin: 0.32,
};

const LIGHT_A = new THREE.Color('#ffe3ec'), DARK_A = new THREE.Color('#2b0a1a');
const LIGHT_B = new THREE.Color('#ffb3cd'), DARK_B = new THREE.Color('#0f0309');
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
const tipPos = new THREE.Vector3();
let lastPuff = 0;

/* -------------------------------------------------- the wish: scroll is held
   Scrolling stops at LOCK (just before the flame starts to lean) until the
   candle is blown out. blowOut() then plays the blow-out by scrolling the page
   itself, so the same timeline drives it forwards, backwards and live. */
const T_END = 110, T_LOCK = 75.4, T_DARK_REST = 91, SCROLL_VH = 6.8;
const scrollAt = (time) => (time / T_END) * innerHeight * SCROLL_VH; // timeline second -> px
const track = document.getElementById('track');
let locked = true;

// While locked the page is physically too short to scroll past the wish, so no
// device (wheel, touch momentum, keyboard End) can skip it.
function sizeTrack() {
  track.style.height = `${scrollAt(locked ? T_LOCK : T_END) + innerHeight}px`;
}
sizeTrack();

const blow = createBlowGame({ onBlown: blowOut });

function onScroll() {
  blow.setVisible(scrollY > scrollAt(T_LOCK) - 160);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { sizeTrack(); onScroll(); });

function blowOut() {
  locked = false;
  sizeTrack();
  const p = { y: scrollY };
  gsap.to(p, {
    y: scrollAt(T_DARK_REST),
    duration: 5,
    ease: 'power1.inOut',
    onUpdate: () => scrollTo(0, p.y),
  });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let last = performance.now();
let t = 0;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  t += dt;

  cake.rotation.y += dt * S.spin;

  // candle + flame
  candle.position.y = topY + S.lift;
  candle.visible = S.lift < 5.8;
  const f = S.flame;
  flame.group.visible = f > 0.01;
  if (flame.group.visible) {
    const breath = blow.breath;
    const flick = 1 + (Math.sin(t * 17) * 0.05 + Math.sin(t * 9.1) * 0.04 + Math.sin(t * 27) * 0.02) * (1 + breath * 3.5);
    const l = Math.max(S.lean, breath * 0.8);
    flame.group.scale.set(f * (1 - l * 0.35) * (2 - flick), f * flick * (1 - l * 0.45), f * (1 - l * 0.35));
    flame.group.rotation.z = -l * 0.95 + Math.sin(t * 6) * 0.05 * (1 - l);
    flame.glow.material.opacity = 0.85 * f * flick;
    flame.light.intensity = 3.2 * f * flick;
  }

  // smoke follows the wick and is released as the puff value rises
  candle.localToWorld(tipPos.set(0, 1.12, 0));
  smoke.origin.copy(tipPos);
  const dp = S.puff - lastPuff;
  if (dp > 0) smoke.emit(dp * 85);
  lastPuff = S.puff;
  smoke.update(dt);
  blow.update(dt);

  // lights-out
  const d = S.dark;
  scene.environmentIntensity = 0.6 * (1 - 0.96 * d);
  hemi.intensity = 0.9 * (1 - 0.97 * d);
  key.intensity = 2.4 * (1 - 0.97 * d);
  rim.intensity = 1.4 * (1 - 0.75 * d);
  tmpA.copy(LIGHT_A).lerp(DARK_A, d);
  tmpB.copy(LIGHT_B).lerp(DARK_B, d);
  document.documentElement.style.setProperty('--bg-a', '#' + tmpA.getHexString());
  document.documentElement.style.setProperty('--bg-b', '#' + tmpB.getHexString());

  glints.update(t, reduceMotion ? 0 : 1 - d);

  // camera (pulled back on narrow screens so the cake always fits)
  const fit = camera.aspect < 1 ? 1 + (1 - camera.aspect) * 1.25 : 1;
  camera.position.set(0, S.camY * (0.8 + 0.2 * fit), S.camZ * fit);
  camera.lookAt(0, S.lookY, 0);

  renderer.render(scene, camera);
});

/* ------------------------------------------------------------ DOM helpers */
const $ = (s) => document.querySelector(s);

// flourishes: draw each curl as a stroke
document.querySelectorAll('.curl').forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = len;
});

// petals for the finale
const petalHost = $('#petals');
if (!reduceMotion) {
  for (let i = 0; i < 38; i++) {
    const el = document.createElement('i');
    el.className = 'petal';
    petalHost.appendChild(el);
    const s = 0.7 + Math.random() * 1.1;
    gsap.set(el, { x: Math.random() * innerWidth, scale: s, opacity: 0.9, rotation: Math.random() * 360 });
    gsap.to(el, {
      y: innerHeight * 1.2,
      x: `+=${(Math.random() - 0.5) * 220}`,
      rotation: `+=${200 + Math.random() * 300}`,
      duration: 6 + Math.random() * 6,
      delay: -Math.random() * 10,
      repeat: -1,
      ease: 'none',
    });
  }
}

/* --------------------------------------------------------------- timeline
   One scrubbed timeline, 110 "seconds" long, mapped onto the page scroll. */
gsap.set('#b-arrive', { opacity: 1 });
// opening moment: the corner curls draw themselves once, on load
gsap.to('.flourish .curl', { strokeDashoffset: 0, duration: 2.4, stagger: 0.15, ease: 'power2.inOut', delay: 0.3 });
gsap.set(petalHost, { opacity: 0 });

const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '#track',
    start: 'top top',
    end: () => `+=${scrollAt(T_END)}`,
    invalidateOnRefresh: true,
    scrub: 0.9,
  },
});

const fadeIn = (sel, at, dur = 3) =>
  tl.fromTo(sel, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: dur, ease: 'power2.out' }, at);
const fadeOut = (sel, at, dur = 3) =>
  tl.to(sel, { opacity: 0, y: -22, duration: dur, ease: 'power2.in' }, at);

// 0-20  Arrival: the cake turns, curls draw themselves around the screen
fadeOut('#b-arrive', 14);
tl.to(S, { camZ: 8.6, duration: 20 }, 0);

// 22-36 The candle slides down onto the top tier
fadeIn('#b-candle', 21);
tl.to(S, { lift: 0, duration: 12, ease: 'bounce.out' }, 22);
fadeOut('#b-candle', 35);

// 42-56 The flame catches; the room goes a little dusky
fadeIn('#b-flame', 41);
tl.to(S, { flame: 1, duration: 5, ease: 'power2.out' }, 42);
tl.to(S, { dark: 0.32, duration: 8, ease: 'power1.inOut' }, 44);
fadeOut('#b-flame', 55);

// 54-75 Lean in and make a wish (the page holds here until she blows)
tl.to(S, { camZ: 6.6, camY: 3.6, lookY: 2.72, spin: 0.1, duration: 20, ease: 'power1.inOut' }, 54);
fadeIn('#b-wish', 58);
fadeOut('#b-wish', 78.5, 2.5);

// 76-90 Blow (played when the mic hears it): flame bends, dies, smoke puffs out, everything goes dark
tl.to(S, { lean: 1, duration: 4, ease: 'power2.in' }, 76);
tl.to(S, { flame: 0, duration: 2, ease: 'power1.in' }, 79);
tl.to(S, { puff: 1, duration: 8 }, 79.4);
tl.to(S, { dark: 1, duration: 6, ease: 'power2.inOut' }, 79.5);
tl.to('.flourish', { opacity: 0, duration: 4 }, 80);
fadeIn('#b-dark', 89);
fadeOut('#b-dark', 96, 2);

// 98-110 One more scroll: the whole screen blooms bright
tl.to('#bloom', { opacity: 1, duration: 1.5, ease: 'power1.out' }, 98);
tl.to('#bloom', { clipPath: 'circle(80% at 50% 50%)', duration: 6, ease: 'power2.in' }, 98);
tl.to('.flourish', { opacity: 0.9, duration: 4 }, 103);
tl.fromTo('#b-reveal', { opacity: 0 }, { opacity: 1, duration: 3, ease: 'power2.out' }, 102);
tl.fromTo('.hb', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 3, ease: 'power2.out' }, 102);
tl.fromTo('.name', { scale: 0.82, opacity: 0 }, { scale: 1, opacity: 1, duration: 4, ease: 'back.out(1.6)' }, 103);
tl.to('.underswirl .curl', { strokeDashoffset: 0, duration: 4, ease: 'power1.inOut' }, 105);
tl.fromTo('.wish', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 3, ease: 'power2.out' }, 107);
tl.to(petalHost, { opacity: 1, duration: 3 }, 104);
tl.to({}, { duration: 1 }, 109); // pad the end so the reveal rests before the page does
