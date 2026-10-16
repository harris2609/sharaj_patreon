import * as THREE from 'three';
import { softTexture } from './cake.js';

// Smoke puff released when the candle goes out. Particles live on their own
// clock, so they keep drifting even if the viewer stops scrolling.
export class Smoke {
  constructor(parent, max = 70) {
    this.pool = [];
    this.origin = new THREE.Vector3();
    const tex = softTexture('rgba(235,222,230,1)');
    for (let i = 0; i < max; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }),
      );
      s.visible = false;
      parent.add(s);
      this.pool.push({ s, life: 0, ttl: 1, vx: 0, vy: 0, vz: 0, size: 0.3, rot: 0 });
    }
    this.cursor = 0;
    this.carry = 0;
  }

  emit(n) {
    this.carry += n;
    while (this.carry >= 1) {
      this.carry -= 1;
      const p = this.pool[this.cursor++ % this.pool.length];
      p.life = 0;
      p.ttl = 2.4 + Math.random() * 1.6;
      p.vx = (Math.random() - 0.3) * 0.28 + 0.12; // drifts the way she blew
      p.vy = 0.45 + Math.random() * 0.4;
      p.vz = (Math.random() - 0.5) * 0.12;
      p.size = 0.22 + Math.random() * 0.2;
      p.s.position.copy(this.origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.06));
      p.s.material.rotation = Math.random() * 6;
      p.s.visible = true;
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.s.visible) continue;
      p.life += dt;
      const k = p.life / p.ttl;
      if (k >= 1) {
        p.s.visible = false;
        continue;
      }
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt * (1 - k * 0.6);
      p.s.position.z += p.vz * dt;
      p.s.material.rotation += dt * 0.25;
      const sc = p.size * (1 + k * 3.2);
      p.s.scale.set(sc, sc, 1);
      p.s.material.opacity = Math.sin(Math.min(k * 6, 1) * Math.PI * 0.5) * (1 - k) * 0.42;
    }
  }
}

// A slow cloud of glints around the cake. Colour is tinted per point.
export class Glints {
  constructor(parent, count = 140, colors = ['#ffffff', '#ffd0e0', '#ff8fb4', '#ffc76b']) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    this.seed = new Float32Array(count * 3);
    const palette = colors.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.4 + Math.random() * 3.2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = -0.5 + Math.random() * 5;
      pos[i * 3 + 2] = Math.sin(a) * r - 1;
      this.seed.set([Math.random() * 6.28, 0.2 + Math.random() * 0.5, 0.3 + Math.random()], i * 3);
      const c = palette[i % palette.length];
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.base = pos.slice();
    this.mat = new THREE.PointsMaterial({
      size: 0.16,
      map: softTexture('rgba(255,255,255,1)'),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    parent.add(this.points);
    this.count = count;
  }

  update(t, opacity) {
    this.mat.opacity = 0.9 * opacity;
    this.points.visible = opacity > 0.01;
    if (!this.points.visible) return;
    const p = this.points.geometry.attributes.position;
    for (let i = 0; i < this.count; i++) {
      const [ph, sp, am] = [this.seed[i * 3], this.seed[i * 3 + 1], this.seed[i * 3 + 2]];
      p.array[i * 3] = this.base[i * 3] + Math.sin(t * sp + ph) * 0.18 * am;
      p.array[i * 3 + 1] = this.base[i * 3 + 1] + Math.sin(t * sp * 0.8 + ph * 2) * 0.25 * am;
    }
    p.needsUpdate = true;
  }
}
