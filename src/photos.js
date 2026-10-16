import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// A framed photo in 3D. The texture is only fetched when load() is called, so
// each chapter pulls its images as the camera approaches it.
export class PhotoCard {
  constructor(data, { frame = '#fff8fb', polaroid = false, size = 1 } = {}) {
    this.data = data;
    this.group = new THREE.Group();
    const s = size / Math.max(data.w, data.h) * 2.4;
    const w = data.w * s, h = data.h * s;
    const pad = 0.08 * size, lip = polaroid ? 0.42 * size : pad;

    // unlit so the frame colour is exactly what the chapter asked for
    const frameMat = new THREE.MeshBasicMaterial({ color: frame, transparent: true });
    this.frame = new THREE.Mesh(new THREE.BoxGeometry(w + pad * 2, h + pad + lip, 0.05), frameMat);
    this.frame.position.y = (pad - lip) / 2;

    this.mat = new THREE.MeshBasicMaterial({ color: '#d9d2d8', toneMapped: false, transparent: true });
    this.photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.photo.position.z = 0.03;
    this.photo.userData.card = this; // picked up by the raycaster

    this.group.add(this.frame, this.photo);
    this.loaded = false;
    this.tintColor = '#ffffff';
  }

  load() {
    if (this.loaded) return;
    this.loaded = true;
    loader.load(this.data.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      this.mat.map = tex;
      this.mat.color.set(this.tintColor);
      this.mat.needsUpdate = true;
    });
  }

  // Multiplied over the photo once it loads (sepia for the college polaroids)
  tint(color) {
    this.tintColor = color;
  }

  fade(opacity) {
    this.mat.opacity = opacity;
    this.frame.material.opacity = opacity;
  }
}

export const buildCards = (chapter, opts) => chapter.photos.map((p) => new PhotoCard(p, opts));
