// A synthesized ambient pad and a small chime, no audio files needed.
// The context is created on the first user gesture (browser autoplay rules),
// and the pad only starts after the candle is out so it cannot leak into the
// microphone while she is blowing.

const CHORD = [146.83, 220, 293.66, 369.99]; // D, A, D, F#

export class Ambient {
  constructor(button) {
    this.btn = button;
    this.ctx = null;
    this.muted = false;
    this.padOn = false;
    this.btn.addEventListener('click', () => this.toggle());
    const unlock = () => this.unlock();
    addEventListener('pointerdown', unlock, { once: true });
    addEventListener('keydown', unlock, { once: true });
    this.render();
  }

  unlock() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    if (this.padOn) this.buildPad();
  }

  startPad() {
    this.padOn = true;
    if (this.ctx) this.buildPad();
  }

  buildPad() {
    if (this.pad) return;
    const c = this.ctx;
    c.resume();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.045, c.currentTime + 6);
    lp.connect(g).connect(this.master);
    CHORD.forEach((f, i) => {
      for (const detune of [-5, 5]) {
        const o = c.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = detune;
        const vg = c.createGain();
        vg.gain.value = 0.5;
        // slow swell per voice so the chord breathes
        const lfo = c.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.013;
        const lg = c.createGain();
        lg.gain.value = 0.3;
        lfo.connect(lg).connect(vg.gain);
        o.connect(vg).connect(lp);
        o.start();
        lfo.start();
      }
    });
    this.pad = g;
  }

  // A soft bell. Used for card flips and the lightbox.
  chime(freq = 880, when = 0) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    for (const [mult, amp, dur] of [[1, 0.12, 1.6], [2.01, 0.04, 0.9], [3.0, 0.02, 0.5]]) {
      const o = c.createOscillator();
      o.frequency.value = freq * mult;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur);
    }
  }

  twinkle() {
    [880, 1108, 1318, 1760].forEach((f, i) => this.chime(f, i * 0.14));
  }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime + 0.4);
    this.render();
  }

  render() {
    this.btn.setAttribute('aria-pressed', String(!this.muted));
    this.btn.title = this.muted ? 'Music off' : 'Music on';
    this.btn.classList.toggle('muted', this.muted);
  }
}
