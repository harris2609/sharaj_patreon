// Full-screen viewer for a tapped photo.
export class Lightbox {
  constructor(audio) {
    this.el = document.getElementById('lightbox');
    this.img = this.el.querySelector('img');
    this.cap = this.el.querySelector('.caption');
    this.audio = audio;
    this.el.addEventListener('click', () => this.close());
    addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
  }

  get open() {
    return this.el.classList.contains('on');
  }

  show({ src, caption }) {
    this.img.src = src;
    this.cap.textContent = caption;
    this.el.classList.add('on');
    this.audio.chime(1174);
    this.onChange?.(true);
  }

  close() {
    if (!this.open) return;
    this.el.classList.remove('on');
    this.onChange?.(false);
  }
}
