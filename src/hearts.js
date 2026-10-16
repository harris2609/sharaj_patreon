import * as THREE from 'three';

// Hearts: the tap-anywhere burst, and the finale where they gather into one.

const PALETTE = ['#38bdf8', '#7dd3fc', '#f43f5e', '#fda4af', '#f59e0b', '#ffffff'];

function heartTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 60);
  g.scale(3.2, 3.2);
  g.beginPath();
  g.moveTo(0, 12);
  g.bezierCurveTo(-18, -2, -8, -16, 0, -7);
  g.bezierCurveTo(8, -16, 18, -2, 0, 12);
  g.fillStyle = '#fff';
  g.shadowColor = 'rgba(255,255,255,.9)';
  g.shadowBlur = 10;
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const texture = heartTexture();

const heartSprite = (color, opacity = 1) =>
  new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, opacity }));

export class HeartBurst {
  constructor(parent, max = 60) {
    this.pool = [];
    for (let i = 0; i < max; i++) {
      const s = heartSprite(PALETTE[i % PALETTE.length], 0);
      s.visible = false;
      parent.add(s);
      this.pool.push({ s, life: 0, ttl: 1, v: new THREE.Vector3(), size: 0.3 });
    }
    this.cursor = 0;
  }

  burst(at, n = 10) {
    for (let i = 0; i < n; i++) {
      const p = this.pool[this.cursor++ % this.pool.length];
      p.life = 0;
      p.ttl = 1.4 + Math.random() * 0.8;
      p.v.set((Math.random() - 0.5) * 1.6, 1 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6);
      p.size = 0.18 + Math.random() * 0.22;
      p.s.position.copy(at);
      p.s.visible = true;
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.s.visible) continue;
      p.life += dt;
      const k = p.life / p.ttl;
      if (k >= 1) { p.s.visible = false; continue; }
      p.s.position.addScaledVector(p.v, dt);
      p.v.y -= dt * 0.35;
      const sc = p.size * (1 + k * 0.6);
      p.s.scale.set(sc, sc, 1);
      p.s.material.opacity = (1 - k) * 0.95;
    }
  }
}

// Points on the classic heart curve, scaled to roughly 3 units wide.
function heartPoint(u) {
  const t = u * Math.PI * 2;
  return new THREE.Vector3(
    16 * Math.pow(Math.sin(t), 3) * 0.1,
    (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.1,
    0,
  );
}

export class HeartGather {
  constructor(parent, count = 96) {
    this.group = new THREE.Group();
    this.items = [];
    for (let i = 0; i < count; i++) {
      const s = heartSprite(PALETTE[i % PALETTE.length], 0);
      const from = new THREE.Vector3().randomDirection().multiplyScalar(5 + Math.random() * 7);
      const to = heartPoint(i / count).add(new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.4));
      this.items.push({ s, from, to, size: 0.22 + Math.random() * 0.14, ph: Math.random() * 6.28 });
      this.group.add(s);
    }
    parent.add(this.group);
    this.progress = 0; // 0 = scattered, 1 = heart
  }

  update(t, opacity) {
    this.group.visible = opacity > 0.01;
    if (!this.group.visible) return;
    const k = this.progress;
    const e = k * k * (3 - 2 * k);
    const beat = 1 + Math.sin(t * 2.2) * 0.04 * e;
    for (const it of this.items) {
      it.s.position.lerpVectors(it.from, it.to, e).multiplyScalar(beat);
      it.s.position.y += Math.sin(t * 1.3 + it.ph) * 0.06 * (1 - e * 0.6);
      const sc = it.size * (0.6 + 0.4 * e);
      it.s.scale.set(sc, sc, 1);
      it.s.material.opacity = opacity * (0.55 + 0.45 * e);
    }
  }
}
