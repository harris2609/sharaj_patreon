import * as THREE from 'three';
import { softTexture } from './cake.js';
import { CHAPTERS, FINALE } from './story.js';
import { buildChapters } from './chapters.js';
import { HeartBurst, HeartGather } from './hearts.js';

// Everything after the reveal: the world turns sky-blue, the cake sinks away
// and the camera flies through one chapter after another, ending on the brand.

const Z = { college: -34, andaman: -70, mountains: -106, chennai: -142, promises: -178, finale: -214 };
const CAM_BACK = 12;
const LOOK_Y = 1.9; // the headline sits above this, the cards below it

// Backdrop pair per stop (CSS --bg-a / --bg-b), blended over the pink by S.brand
const SKY = {
  college: ['#2a1c14', '#120c09'],
  andaman: ['#0c4a70', '#041a2c'],
  mountains: ['#1b2a44', '#080d18'],
  chennai: ['#4a2a0c', '#160c04'],
  promises: ['#0f172a', '#090d16'],
  finale: ['#0f2a44', '#090d16'],
};

// Chapter beats are built from story.js so the copy lives in one place
function chapterBeat(c) {
  const s = document.createElement('section');
  s.className = 'beat chapter';
  s.id = `b-${c.id}`;
  s.innerHTML = `<p class="year">${c.year}</p><p class="script mid sky">${c.title}</p><p class="serif light">${c.line}</p>`;
  return s;
}

function starField(parent) {
  const n = 900;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos.set([(Math.random() - 0.5) * 90, -6 + Math.random() * 30, -5 - Math.random() * 240], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.12, map: softTexture('rgba(255,255,255,1)'), transparent: true, depthWrite: false, opacity: 0,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  parent.add(pts);
  return mat;
}

export class Journey {
  constructor({ scene, camera, S, audio, lightbox, promises }) {
    this.scene = scene;
    this.camera = camera;
    this.S = S;
    this.audio = audio;
    this.lightbox = lightbox;
    this.promises = promises;
    this.world = new THREE.Group();
    scene.add(this.world);

    this.chapters = buildChapters(CHAPTERS, Z);
    this.chapters.forEach((c) => c.mount(this.world));
    this.stars = starField(this.world);
    this.bursts = new HeartBurst(scene);
    this.heart = new HeartGather(this.world);
    // big enough to ring the logo and the headline
    this.heart.group.position.set(0, LOOK_Y + 0.2, Z.finale);
    this.heart.group.scale.setScalar(2.3);
    this.heartOpacity = 0;

    const stage = document.getElementById('stage');
    const anchor = document.getElementById('b-promises');
    CHAPTERS.forEach((c) => stage.insertBefore(chapterBeat(c), anchor));
    this.fillFinale();

    this.ray = new THREE.Raycaster();
    this.pointer = { x: 0, y: 0 };
    this.listenForTilt();
  }

  fillFinale() {
    const f = document.getElementById('b-finale');
    f.querySelector('.headline').textContent = FINALE.headline;
    f.querySelector('.sub').textContent = FINALE.sub;
    const a = f.querySelector('a');
    a.href = FINALE.link;
    a.textContent = FINALE.linkLabel;
  }

  // Adds the post-reveal segments to the scrubbed timeline. Returns the end time.
  schedule(tl, fadeIn, fadeOut) {
    const S = this.S;
    const flyTo = (z, at, dur = 10) =>
      tl.to(S, { camZ: z + CAM_BACK, lookZ: z, duration: dur, ease: 'power2.inOut' }, at);
    const skyTo = (key, at, dur = 8) => {
      const [a, b] = SKY[key].map((c) => new THREE.Color(c));
      tl.to(S.bgA, { r: a.r, g: a.g, b: a.b, duration: dur }, at);
      tl.to(S.bgB, { r: b.r, g: b.g, b: b.b, duration: dur }, at);
    };

    // 113-126 the pink world lets go: bloom out, cake sinks, palette turns
    tl.to('#bloom', { opacity: 0, duration: 6, ease: 'power1.inOut' }, 113);
    tl.to('#b-reveal', { opacity: 0, duration: 4 }, 113);
    tl.to('#petals', { opacity: 0, duration: 4 }, 113);
    tl.to('.flourish', { opacity: 0, duration: 4 }, 113);
    tl.to(S, { brand: 1, duration: 8, ease: 'power1.inOut' }, 114);
    tl.to(S, { cakeDrop: 1, duration: 8, ease: 'power2.in' }, 114);
    tl.to(S, { camY: LOOK_Y + 0.4, lookY: LOOK_Y, spin: 0, duration: 10, ease: 'power2.inOut' }, 114);
    tl.to(this.stars, { opacity: 0.85, duration: 10 }, 116);
    skyTo('college', 113, 10);

    const stops = [
      { c: this.chapters[0], key: 'college', fly: 114, dur: 12 },
      { c: this.chapters[1], key: 'andaman', fly: 142 },
      { c: this.chapters[2], key: 'mountains', fly: 174 },
      { c: this.chapters[3], key: 'chennai', fly: 206 },
    ];
    for (const { c, key, fly, dur = 10 } of stops) {
      flyTo(c.z, fly, dur);
      skyTo(key, fly);
      tl.to(c, { reveal: 1, duration: 8, ease: 'power2.out' }, fly + dur - 4);
      fadeIn(`#b-${key}`, fly + dur);
      fadeOut(`#b-${key}`, fly + dur + 16);
      tl.to(c, { reveal: 0, duration: 6, ease: 'power2.in' }, fly + 28 + (dur - 10));
    }

    // 240-278 promises, in the dark under the stars
    flyTo(Z.promises, 240);
    skyTo('promises', 240);
    fadeIn('#b-promises', 248, 4);
    this.promiseWindow = [248, 276];
    fadeOut('#b-promises', 276, 3);

    // 278-306 the hearts gather and the brand arrives
    flyTo(Z.finale, 278);
    skyTo('finale', 278);
    tl.to(this, { heartOpacity: 1, duration: 4 }, 282);
    tl.to(this.heart, { progress: 1, duration: 12, ease: 'power2.inOut' }, 286);
    tl.fromTo('#b-finale', { opacity: 0 }, { opacity: 1, duration: 4 }, 292);
    tl.fromTo('#b-finale .logo', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 5, ease: 'back.out(1.4)' }, 293);
    tl.fromTo('#b-finale .headline', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 4 }, 296);
    tl.fromTo('#b-finale .sub, #b-finale a', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 4, stagger: 1 }, 299);
    tl.to({}, { duration: 2 }, 304);
    return 306;
  }

  // Called from the scroll handler with the current timeline second.
  onTime(time) {
    if (!this.promiseWindow) return;
    const [a, b] = this.promiseWindow;
    this.promises.setLive(time > a && time < b);
    document.getElementById('b-finale').classList.toggle('live', time > 292);
  }

  preload() {
    this.chapters[0].load();
  }

  update(dt, t) {
    const camZ = this.S.camZ;
    for (const c of this.chapters) {
      if (c.z > camZ - 70) c.load(); // fetch photos one chapter ahead
      c.update(dt, t);
    }
    this.bursts.update(dt);
    this.heart.update(t, this.heartOpacity);
  }

  resize(aspect) {
    this.chapters.forEach((c) => c.fit(aspect));
    this.heart.group.scale.setScalar(2.3 * THREE.MathUtils.clamp(aspect / 1.1, 0.65, 1));
  }

  // A tap on a photo opens it; a tap on anything else lets a few hearts go.
  tap(ndcX, ndcY) {
    if (this.lightbox.open) return;
    this.ray.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const hits = this.ray.intersectObjects(this.chapters.flatMap((c) => c.hits));
    if (hits.length) return this.lightbox.show(hits[0].object.userData.card.data);
    const at = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(this.camera)
      .sub(this.camera.position).normalize().multiplyScalar(6).add(this.camera.position);
    this.bursts.burst(at);
  }

  // Pointer position, or the phone's tilt, nudges the camera for a little parallax.
  listenForTilt() {
    addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      this.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    });
    const onTilt = (e) => {
      if (e.gamma === null) return;
      this.pointer.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      this.pointer.y = THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1);
    };
    const DOE = window.DeviceOrientationEvent;
    if (DOE?.requestPermission) {
      // iOS: has to be asked from a gesture, and only once
      addEventListener('pointerup', () => {
        DOE.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onTilt); }).catch(() => {});
      }, { once: true });
    } else if (DOE) {
      addEventListener('deviceorientation', onTilt);
    }
  }
}
