import * as THREE from 'three';
import { softTexture } from './cake.js';

// Uttarkashi: layered ridge silhouettes with parallax, and a slow snowfall.

// Smooth 1D value noise, enough for a mountain profile.
function profile(seed, octaves = 3) {
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return (x) => {
    let v = 0, amp = 1, f = 1;
    for (let o = 0; o < octaves; o++) {
      const xi = Math.floor(x * f), fr = x * f - xi;
      const s = fr * fr * (3 - 2 * fr);
      v += (rnd(xi) * (1 - s) + rnd(xi + 1) * s) * amp;
      amp *= 0.45;
      f *= 2.1;
    }
    return v;
  };
}

function ridge(width, base, height, seed, color) {
  const noise = profile(seed);
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -6);
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const x = -width / 2 + (i / steps) * width;
    shape.lineTo(x, base + noise(i / steps * 4) * height);
  }
  shape.lineTo(width / 2, -6);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color }));
}

export function buildRidges(parent) {
  const layers = [
    { z: -26, base: 4.6, h: 3.2, color: '#2a3d66', seed: 3 },
    { z: -16, base: 2.4, h: 3.6, color: '#1c2a4a', seed: 7 },
    { z: -7, base: 0.2, h: 3.0, color: '#111a30', seed: 11 },
  ];
  return layers.map((l) => {
    const m = ridge(80, l.base, l.h, l.seed, l.color);
    m.position.z = l.z;
    parent.add(m);
    return m;
  });
}

export class Snow {
  constructor(parent, count = 260, box = { x: 24, y: 12, z: 16 }) {
    this.box = box;
    this.count = count;
    const pos = new Float32Array(count * 3);
    this.speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * box.x;
      pos[i * 3 + 1] = Math.random() * box.y - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * box.z;
      this.speed[i] = 0.4 + Math.random() * 0.7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({
      size: 0.09,
      map: softTexture('rgba(255,255,255,1)'),
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    parent.add(this.points);
  }

  update(dt, t, opacity) {
    this.mat.opacity = 0.8 * opacity;
    this.points.visible = opacity > 0.01;
    if (!this.points.visible) return;
    const p = this.points.geometry.attributes.position;
    for (let i = 0; i < this.count; i++) {
      let y = p.array[i * 3 + 1] - this.speed[i] * dt;
      if (y < -2) y += this.box.y;
      p.array[i * 3 + 1] = y;
      p.array[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.15;
    }
    p.needsUpdate = true;
  }
}
