import * as THREE from 'three';

// Palette (kept in sync with style.css)
export const COLORS = {
  petal: '#ffe3ec',
  baby: '#ffc4d8',
  rose: '#e8548a',
  deep: '#a81f55',
  cream: '#fff6f9',
  gold: '#ffc76b',
  cherry: '#c2123f',
  leaf: '#7fb88a',
};

const sugar = (color, o = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    clearcoat: 0.55,
    clearcoatRoughness: 0.32,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#ffd6e4'),
    ...o,
  });

export function softTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function candleTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#fff4f7';
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = COLORS.rose;
  g.lineWidth = 22;
  for (let i = -4; i < 14; i++) {
    g.beginPath();
    g.moveTo(-20, i * 32);
    g.lineTo(148, i * 32 + 90);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function flower(color, centre = COLORS.gold, scale = 1) {
  const f = new THREE.Group();
  const petalMat = sugar(color, { roughness: 0.38 });
  const geo = new THREE.SphereGeometry(0.1, 20, 14);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(geo, petalMat);
    const a = (i / 6) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.115, 0.02, Math.sin(a) * 0.115);
    p.scale.set(1, 0.55, 1);
    f.add(p);
  }
  const mid = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    sugar(centre, { roughness: 0.3, metalness: 0.2 }),
  );
  mid.position.y = 0.06;
  f.add(mid);
  f.scale.setScalar(scale);
  return f;
}

function cherry(scale = 1) {
  const g = new THREE.Group();
  const fruit = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 28, 20),
    sugar(COLORS.cherry, { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
  );
  fruit.position.y = 0.14;
  g.add(fruit);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6),
    new THREE.MeshStandardMaterial({ color: '#6b8f4e' }),
  );
  stem.position.set(0.04, 0.34, 0);
  stem.rotation.z = -0.35;
  g.add(stem);
  g.scale.setScalar(scale);
  return g;
}

export function buildCake() {
  const root = new THREE.Group();
  const cake = new THREE.Group();
  root.add(cake);

  const frostWhite = sugar(COLORS.cream);
  const frostRose = sugar(COLORS.rose, { roughness: 0.36 });
  const spongeLow = sugar('#ff9fc3');
  const spongeUp = sugar('#ffbcd4');

  // ----- Cake stand -----
  const stand = new THREE.Group();
  const standMat = sugar('#fff0f5', { roughness: 0.25, clearcoat: 0.9 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.4, 0.12, 96), standMat);
  plate.position.y = -0.06;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.05, 16, 120), sugar(COLORS.rose, { metalness: 0.25 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.02;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.8, 40), standMat);
  stem.position.y = -0.52;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.1, 80), standMat);
  foot.position.y = -0.95;
  stand.add(plate, rim, stem, foot);
  cake.add(stand);

  // ----- Tiers -----
  const R1 = 1.7, H1 = 1.0;
  const R2 = 1.1, H2 = 0.82;
  const y1 = H1;           // top of bottom tier
  const y2 = H1 + H2;      // top of upper tier

  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(R1, R1, H1, 96), spongeLow);
  t1.position.y = H1 / 2;
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(R2, R2, H2, 96), spongeUp);
  t2.position.y = y1 + H2 / 2;
  cake.add(t1, t2);

  // Frosting caps + drips
  const addFrosting = (R, topY, mat, drips, minL, maxL, seed) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.09, 96), mat);
    cap.position.y = topY - 0.02;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.05, 16, 120), mat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = topY + 0.025;
    cake.add(cap, lip);
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const g = new THREE.CapsuleGeometry(0.075, 1, 8, 16);
    for (let i = 0; i < drips; i++) {
      const a = (i / drips) * Math.PI * 2 + rnd() * 0.12;
      const len = minL + rnd() * (maxL - minL);
      const d = new THREE.Mesh(g, mat);
      const w = 0.8 + rnd() * 0.7;
      d.scale.set(w, len, w);
      d.position.set(Math.cos(a) * (R + 0.03), topY - 0.02 - len / 2, Math.sin(a) * (R + 0.03));
      cake.add(d);
    }
  };
  addFrosting(R1, y1, frostWhite, 34, 0.12, 0.5, 7);
  addFrosting(R2, y2, frostRose, 24, 0.1, 0.42, 19);

  // Piped rosettes round the base of each tier
  const bead = new THREE.SphereGeometry(0.1, 20, 14);
  const ring = (R, y, n, mat, sc = 1) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const m = new THREE.Mesh(bead, mat);
      m.position.set(Math.cos(a) * (R + 0.04), y, Math.sin(a) * (R + 0.04));
      m.scale.set(sc, sc * 0.85, sc);
      cake.add(m);
    }
  };
  ring(R1, 0.08, 30, frostWhite, 1.05);
  ring(R2, y1 + 0.07, 22, frostRose, 0.9);

  // Pearl swags on the bottom tier
  const pearlMat = sugar('#ffffff', { roughness: 0.2, clearcoat: 1, sheen: 0 });
  const pearl = new THREE.SphereGeometry(0.045, 14, 10);
  const swags = 14;
  for (let s = 0; s < swags; s++) {
    const a0 = (s / swags) * Math.PI * 2;
    const a1 = ((s + 1) / swags) * Math.PI * 2;
    for (let k = 0; k <= 7; k++) {
      const u = k / 7;
      const a = a0 + (a1 - a0) * u;
      const y = 0.62 - Math.sin(u * Math.PI) * 0.17;
      const p = new THREE.Mesh(pearl, pearlMat);
      p.position.set(Math.cos(a) * (R1 + 0.04), y, Math.sin(a) * (R1 + 0.04));
      cake.add(p);
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), frostRose);
    dot.position.set(Math.cos(a0) * (R1 + 0.05), 0.64, Math.sin(a0) * (R1 + 0.05));
    cake.add(dot);
  }

  // Flowers on the shelf of the bottom tier
  const flowerCols = ['#ff8fb4', '#fff6f9', '#e8548a', '#ffc4d8'];
  const nF = 9;
  for (let i = 0; i < nF; i++) {
    const a = (i / nF) * Math.PI * 2 + 0.2;
    const f = flower(flowerCols[i % flowerCols.length], COLORS.gold, 1.05);
    f.position.set(Math.cos(a) * 1.4, y1 + 0.07, Math.sin(a) * 1.4);
    f.rotation.y = a;
    cake.add(f);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), sugar(COLORS.leaf));
    leaf.scale.set(1.8, 0.35, 0.8);
    const la = a + 0.17;
    leaf.position.set(Math.cos(la) * 1.4, y1 + 0.07, Math.sin(la) * 1.4);
    leaf.rotation.y = -la;
    cake.add(leaf);
  }

  // Cherries on the top tier
  const nC = 6;
  for (let i = 0; i < nC; i++) {
    const a = (i / nC) * Math.PI * 2 + 0.5;
    const c = cherry(0.85);
    c.position.set(Math.cos(a) * 0.8, y2 + 0.03, Math.sin(a) * 0.8);
    cake.add(c);
  }
  ring(R2 * 0.55, y2 + 0.07, 12, frostWhite, 0.55);

  // ----- Candle (origin = candle base, so it can drop onto the cake) -----
  const candle = new THREE.Group();
  const CH = 0.95;
  const ct = candleTexture();
  ct.repeat.set(1, 1);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, CH, 32),
    new THREE.MeshStandardMaterial({ map: ct, roughness: 0.55 }),
  );
  body.position.y = CH / 2;
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6),
    new THREE.MeshStandardMaterial({ color: '#2b1a1f' }),
  );
  wick.position.y = CH + 0.04;
  candle.add(body, wick);

  // ----- Flame -----
  const flame = new THREE.Group();
  flame.position.y = CH + 0.08;
  const profile = [
    [0.0, 0.0], [0.06, 0.03], [0.1, 0.12], [0.095, 0.26], [0.055, 0.42], [0.0, 0.62],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const outer = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 28),
    new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.9, depthWrite: false }),
  );
  const inner = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 28),
    new THREE.MeshBasicMaterial({ color: '#fff3c6', transparent: true, opacity: 1, depthWrite: false }),
  );
  inner.scale.set(0.55, 0.7, 0.55);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softTexture('rgba(255,190,110,1)'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8,
    }),
  );
  glow.scale.set(1.5, 1.5, 1);
  glow.position.y = 0.28;
  flame.add(outer, inner, glow);
  flame.visible = false;
  candle.add(flame);

  const light = new THREE.PointLight('#ffb35c', 0, 9, 1.6);
  light.position.y = 0.3;
  flame.add(light);

  candle.position.y = y2 + 0.05;
  cake.add(candle);

  return { root, cake, candle, flame: { group: flame, outer, inner, glow, light }, topY: y2 + 0.05, candleHeight: CH };
}
