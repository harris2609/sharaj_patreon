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

export function createBlowGame({ onBlown }) {
  const ui = document.getElementById('blow-ui');
  const micBtn = document.getElementById('mic-btn');
  const skipBtn = document.getElementById('skip-btn');
  const fill = document.getElementById('meter-fill');
  const hint = document.getElementById('blow-hint');
  const wishLine = document.querySelector('#b-wish .serif');

  const detector = new BlowDetector();
  let state = 'ask'; // ask | listening | denied
  let blown = false;
  let hold = 0;
  let level = 0;
  let fake = null;
  let triedFor = 0;

  const setState = (s) => {
    state = s;
    ui.dataset.state = s;
  };
  setState('ask');
  hint.textContent = 'allow the microphone, then blow';

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
      hint.textContent = 'No microphone, no problem.';
      setState('denied');
    }
  });
  skipBtn.addEventListener('click', finish);

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
    // 0..1 strength of the current breath, for the flame to lean on.
    get breath() {
      return state === 'listening' && !blown ? level : 0;
    },
    update(dt) {
      if (blown || state !== 'listening' || !ui.classList.contains('on')) return;

      if (fake !== null) {
        level += (fake - level) * 0.4;
      } else if (detector.calibrating) {
        detector.update();
        return;
      } else {
        level = detector.update();
      }

      fill.style.width = `${Math.round(level * 100)}%`;
      ui.classList.toggle('over', level >= THRESHOLD);

      hold = level >= THRESHOLD ? hold + dt : Math.max(0, hold - dt * 1.5);
      if (hold >= HOLD) return finish();

      if (level >= THRESHOLD) hint.textContent = 'keep going!';
      else if (level > 0.12) hint.textContent = 'a little harder…';
      else hint.textContent = 'take a deep breath, then blow';

      triedFor += dt;
      if (triedFor > 20) ui.dataset.state = 'listening-stuck'; // reveal the tap fallback
    },
  };
}
