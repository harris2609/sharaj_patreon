import * as THREE from 'three';

// Andaman: a slow shader sea and a palm silhouette on the right.

const vert = /* glsl */ `
  uniform float uTime;
  varying float vH;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    float h = sin(p.x * 0.35 + uTime * 0.6) * 0.18
            + sin(p.y * 0.5 - uTime * 0.45) * 0.14
            + sin((p.x + p.y) * 0.9 + uTime * 0.9) * 0.06;
    p.z += h;
    vH = h;
    vPos = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform float uTime;
  varying float vH;
  varying vec3 vPos;
  void main() {
    float k = smoothstep(-0.3, 0.35, vH);
    vec3 c = mix(uDeep, uShallow, k);
    // sparse glints that drift across the crests
    float g = sin(vPos.x * 6.0 + uTime * 1.3) * sin(vPos.z * 7.0 - uTime * 0.8);
    c += uFoam * smoothstep(0.86, 1.0, g) * 0.6 * k;
    // fade into the dark toward the horizon
    float dist = clamp((-vPos.z - 60.0) / 40.0, 0.0, 1.0);
    c = mix(c, uDeep * 0.5, dist);
    gl_FragColor = vec4(c, 0.92);
  }
`;

export class Sea {
  constructor(parent, { y = -1.4, size = 90 } = {}) {
    this.uniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#063a5c') },
      uShallow: { value: new THREE.Color('#1f9ad8') },
      uFoam: { value: new THREE.Color('#bfeaff') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 120, 120), mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = y;
    parent.add(this.mesh);
  }

  update(t) {
    this.uniforms.uTime.value = t;
  }
}

export function buildPalm(color = '#07202f') {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.2, 5.2, 7), mat);
  trunk.position.y = 2.6;
  trunk.rotation.z = -0.16;
  g.add(trunk);
  const crown = new THREE.Group();
  crown.position.set(0.8, 5.1, 0);
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.6, 1, 6), mat);
    // bend each frond downward along its length
    const pos = frond.geometry.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v) + 1.3;
      pos.setZ(v, -y * y * 0.12);
      pos.setX(v, pos.getX(v) * (1 - y / 3.2));
    }
    frond.position.y = 1.2;
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 8) * Math.PI * 2;
    pivot.rotation.x = 0.55;
    pivot.add(frond);
    crown.add(pivot);
  }
  g.add(crown);
  return g;
}
