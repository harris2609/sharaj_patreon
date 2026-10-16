import * as THREE from 'three';
import { buildCards } from './photos.js';
import { Sea, buildPalm } from './sea.js';
import { buildRidges, Snow } from './peaks.js';
import { Glints } from './particles.js';

const ease = (k) => k * k * (3 - 2 * k);

// A chapter is a group parked somewhere along -z with its photo cards and set
// dressing. `reveal` (0..1, tweened by the scroll timeline) flies the cards out
// of a point in the dark into their layout.
class Chapter {
  constructor(data, z, layout, cardOpts) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.z = z;
    this.z = z;
    this.cards = buildCards(data, cardOpts);
    this.layout = layout;
    this.cardHost = this.group;
    this.reveal = 0;
    this.sx = 1; // horizontal squeeze on narrow screens
    this.from = new THREE.Vector3(0, 0.6, -8);
  }

  mount(parent) {
    this.cards.forEach((c) => this.cardHost.add(c.group));
    parent.add(this.group);
  }

  load() {
    this.cards.forEach((c) => c.load());
  }

  get hits() {
    return this.reveal > 0.5 ? this.cards.map((c) => c.photo) : [];
  }

  fit(aspect) {
    this.sx = THREE.MathUtils.clamp(aspect / 1.45, 0.6, 1);
  }

  update(dt, t) {
    const e = ease(this.reveal);
    this.group.visible = this.reveal > 0.001;
    if (!this.group.visible) return;
    this.cards.forEach((c, i) => {
      const l = this.layout[i];
      const g = c.group;
      g.position.set(l.x * this.sx, l.y + Math.sin(t * 0.9 + i * 1.7) * 0.05, l.z).lerp(this.from, 1 - e);
      g.rotation.set(l.rx || 0, (l.ry || 0) * this.sx, (l.rz || 0) + Math.sin(t * 0.6 + i) * 0.012);
      const s = (l.s || 1) * (0.15 + 0.85 * e);
      g.scale.set(s, s, s);
      c.fade(e);
    });
    this.dress(dt, t, e);
  }

  dress() {}
}

// 2018: two polaroids pegged to a string.
class College extends Chapter {
  constructor(data, z) {
    super(data, z, [
      { x: -1.9, y: 0.7, z: 0, rz: 0.05 },
      { x: 1.9, y: 0.6, z: 0.2, rz: -0.06 },
    ], { polaroid: true, frame: '#fbf6ee' });
    this.cards.forEach((c) => c.tint('#e9cdb0'));
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-6.5, 3.0, 0), new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(6.5, 3.0, 0),
    );
    this.string = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
      new THREE.LineBasicMaterial({ color: '#c9a27a' }),
    );
    const peg = new THREE.MeshBasicMaterial({ color: '#b98a5a' });
    this.pegs = this.layout.map((l) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.1), peg);
      m.position.set(l.x, l.y + 1.3, l.z + 0.03); // straddles the top edge of the polaroid
      return m;
    });
    this.group.add(this.string, ...this.pegs);
  }

  dress(dt, t, e) {
    this.string.material.opacity = e;
    this.string.material.transparent = true;
    this.pegs.forEach((p, i) => {
      p.position.x = this.layout[i].x * this.sx;
      p.visible = e > 0.9;
    });
  }
}

// Dec 2023: cards floating over the sea, a palm on the right.
class Andaman extends Chapter {
  constructor(data, z) {
    const front = [-5.2, -2.6, 0, 2.6, 5.2].map((x, i) => ({ x, y: 0.3 + (i % 2) * 0.3, z: 0, ry: -x * 0.05 }));
    const back = [-6.8, -4, -1.3, 1.3, 4, 6.8].map((x) => ({ x, y: 2.9, z: -5.5, ry: -x * 0.04, s: 0.8 }));
    super(data, z, [...front, ...back], { frame: '#f3fbff' });
    this.sea = new Sea(this.group);
    this.palm = buildPalm();
    this.palm.position.set(7.2, -1.5, -5);
    this.palm.scale.setScalar(1.25);
    this.group.add(this.palm);
  }

  dress(dt, t, e) {
    this.sea.update(t);
    this.sea.mesh.material.opacity = 0.92 * e;
    this.palm.position.x = 7.2 * this.sx;
    this.palm.scale.setScalar(1.25 * e);
  }
}

// 2024: a trail climbing across layered ridges, under light snow.
class Mountains extends Chapter {
  constructor(data, z) {
    const layout = [-5.8, -3.5, -1.2, 1.2, 3.5, 5.8].map((x, i) => ({
      x, y: -1 + i * 0.5, z: (i % 2) * -1.4, ry: -x * 0.03, rz: (i % 2 ? -1 : 1) * 0.03,
    }));
    super(data, z, layout, { frame: '#eef4ff' });
    this.ridges = buildRidges(this.group);
    this.snow = new Snow(this.group);
  }

  dress(dt, t, e) {
    this.ridges.forEach((r) => { r.material.transparent = true; r.material.opacity = e; });
    this.snow.update(dt, t, e);
  }
}

// 2025-26: the cards orbit a warm light.
class Chennai extends Chapter {
  constructor(data, z) {
    const n = data.photos.length;
    const layout = data.photos.map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return { x: Math.sin(a) * 3.8, y: 0.6 + Math.cos(a * 2) * 0.3, z: Math.cos(a) * 3.8 - 1 };
    });
    super(data, z, layout, { frame: '#fff3e0' });
    this.ring = new THREE.Group();
    this.ring.position.z = 1;
    this.ring.rotation.x = 0.12;
    this.group.add(this.ring);
    this.cardHost = this.ring;
    this.glints = new Glints(this.group, 110, ['#ffd27a', '#ffb347', '#fff2cc', '#ffffff']);
    this.glints.points.position.y = 0.6;
  }

  update(dt, t) {
    super.update(dt, t);
    if (!this.group.visible) return;
    this.ring.rotation.y += dt * 0.1;
    // cards travel with the ring but keep facing the camera
    this.cards.forEach((c) => { c.group.rotation.y -= this.ring.rotation.y; });
  }

  dress(dt, t, e) {
    this.glints.update(t, e);
  }
}

export function buildChapters(chapters, zs) {
  const kinds = { college: College, andaman: Andaman, mountains: Mountains, chennai: Chennai };
  return chapters.map((c) => new kinds[c.id](c, zs[c.id]));
}
