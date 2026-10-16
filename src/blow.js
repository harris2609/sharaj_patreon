// Blow-to-extinguish: microphone detector + the meter UI that sits over the cake.
//
// Breath on a microphone shows up as low-frequency rumble (20-350 Hz). We measure
// that band, compare it with the room's own noise floor (learned in the first
// 0.7 s), and turn the difference into a 0..1 strength. The candle only goes out
// when strength stays above THRESHOLD for HOLD seconds, so one cough or a bump
// of the desk is not enough.

export const THRESHOLD = 0.55;
export const HOLD = 0.5;

const CALIBRATE_MS = 700;
const DB_DEADZONE = 6;   // dB above the floor that still counts as zero
const DB_RANGE = 22;     // dB above the deadzone that counts as full strength

class BlowDetector {
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    await this.ctx.resume();
    this.stream = stream;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.4;
    this.ctx.createMediaStreamSource(stream).connect(this.analyser);
    this.bins = new Float32Array(this.analyser.frequencyBinCount);
    const binHz = this.ctx.sampleRate / this.analyser.fftSize;
    this.lo = Math.max(1, Math.round(20 / binHz));
    this.hi = Math.round(350 / binHz);
    this.floor = null;
    this.samples = [];
    this.startedAt = performance.now();
    this.level = 0;
  }

  get calibrating() {
    return this.floor === null;
  }

  update() {
    this.analyser.getFloatFrequencyData(this.bins);
    let power = 0;
    for (let i = this.lo; i <= this.hi; i++) power += Math.pow(10, this.bins[i] / 10);
    const db = 10 * Math.log10(power / (this.hi - this.lo + 1) + 1e-12);

    if (this.floor === null) {
      this.samples.push(db);
      if (performance.now() - this.startedAt > CALIBRATE_MS) {
        this.floor = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
      }
      return 0;
    }
    if (db < this.floor + 3) this.floor += (db - this.floor) * 0.02; // follow a quieter or drifting room

    const target = Math.min(1, Math.max(0, (db - this.floor - DB_DEADZONE) / DB_RANGE));
    this.level += (target - this.level) * (target > this.level ? 0.5 : 0.12);
    return this.level;
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
  }
}

// Press-and-hold fallback: holding the button ramps the level like a breath,
// so it works with no microphone at all and still uses the same hold timer.
const HOLD_RAMP = 1.6; // level per second while held

export function createBlowGame({ onBlown }) {
  const ui = document.getElementById('blow-ui');
  const micBtn = document.getElementById('mic-btn');
  const holdBtn = document.getElementById('hold-btn');
  const fill = document.getElementById('meter-fill');
  const hint = document.getElementById('blow-hint');
  const wishLine = document.querySelector('#b-wish .serif');

  const detector = new BlowDetector();
  let state = 'ask'; // ask | listening | denied
  let blown = false;
  let hold = 0;
  let level = 0;
  let fake = null;
  let holding = false;

  const setState = (s) => {
    state = s;
    ui.dataset.state = s;
  };
  setState('ask');
  hint.textContent = 'allow the microphone and blow, or press and hold';

  const finish = () => {
    if (blown) return;
    blown = true;
    ui.classList.remove('on');
    detector.stop();
    onBlown();
  };

  micBtn.addEventListener('click', async () => {
    micBtn.disabled = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      hint.textContent = "This browser can't use a microphone.";
      setState('denied');
      return;
    }
    try {
      await detector.start();
      setState('listening');
      wishLine.textContent = 'blow into your microphone';
      hint.textContent = 'getting ready…';
    } catch {
      hint.textContent = 'No microphone, no problem. Press and hold instead.';
      setState('denied');
    }
  });

  const release = () => { holding = false; };
  holdBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    holdBtn.setPointerCapture?.(e.pointerId);
    holding = true;
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) holdBtn.addEventListener(ev, release);
  holdBtn.addEventListener('contextmenu', (e) => e.preventDefault()); // long-press menu on phones
  holdBtn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); holding = true; } });
  holdBtn.addEventListener('keyup', release);
  holdBtn.addEventListener('blur', release);

  // Local testing only: window.__blow.setLevel(0..1) stands in for the microphone.
  if (import.meta.env.DEV) {
    window.__blow = {
      setLevel(v) {
        fake = v;
        if (v !== null && state !== 'listening') {
          setState('listening');
          wishLine.textContent = 'blow into your microphone';
        }
      },
    };
  }

  return {
    // Show or hide the whole control as the page reaches the wish.
    setVisible(on) {
      if (!blown) ui.classList.toggle('on', on);
    },
    // 0..1 strength of the current breath (or hold), for the flame to lean on.
    get breath() {
      return blown ? 0 : level;
    },
    update(dt) {
      if (blown || !ui.classList.contains('on')) return;

      if (holding) {
        level = Math.min(1, level + HOLD_RAMP * dt);
      } else if (fake !== null) {
        level += (fake - level) * 0.4;
      } else if (state === 'listening' && !detector.calibrating) {
        level = detector.update();
      } else {
        if (state === 'listening') detector.update(); // still calibrating
        level = Math.max(0, level - dt * 2.5);
      }

      fill.style.width = `${Math.round(level * 100)}%`;
      ui.classList.toggle('over', level >= THRESHOLD);

      hold = level >= THRESHOLD ? hold + dt : Math.max(0, hold - dt * 1.5);
      if (hold >= HOLD) return finish();

      if (holding) hint.textContent = 'keep holding…';
      else if (state !== 'listening') return;
      else if (level >= THRESHOLD) hint.textContent = 'keep going!';
      else if (level > 0.12) hint.textContent = 'a little harder…';
      else hint.textContent = 'take a deep breath and blow, or press and hold';
    },
  };
}
