import gsap from 'gsap';

// A gentle guide at the bottom of the screen. It appears when she pauses,
// says what to do at this point of the story, and offers a "next" that
// scrolls to the following moment for anyone who would rather tap than scroll.

const IDLE_MS = 2200;

// Where "next" takes her, in timeline seconds. Stops past the lock only
// become reachable once the candle is out.
const STOPS = [24, 44, 68, 75.4, 107, 134, 165, 197, 229, 262, 305];

// What to say, by timeline second. First match wins.
const MESSAGES = [
  [0, 'scroll down slowly'],
  [12, 'keep scrolling'],
  [60, 'scroll until the candle is close'],
  [76, 'keep scrolling, the dark is part of it'],
  [96, 'one more scroll'],
  [108, 'keep scrolling, there is more'],
  [126, 'tap a photo to open it · scroll for the next chapter'],
  [246, 'tap a card to turn it over · scroll on'],
  [292, null],
];

export class Guide {
  constructor({ scrollAt, timeAt, isLocked }) {
    this.scrollAt = scrollAt;
    this.timeAt = timeAt;
    this.isLocked = isLocked;
    this.el = document.getElementById('guide');
    this.text = this.el.querySelector('.guide-text');
    this.next = this.el.querySelector('.guide-next');
    this.blocked = false;
    this.timer = null;
    this.next.addEventListener('click', () => this.goNext());
    addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();
  }

  get time() {
    return this.timeAt(scrollY);
  }

  // Every scroll hides the guide and restarts the idle clock.
  onScroll() {
    this.hide();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), IDLE_MS);
  }

  // The blow control and the lightbox have their own instructions.
  setBlocked(on) {
    this.blocked = on;
    if (on) this.hide();
  }

  show() {
    if (this.blocked) return;
    const msg = this.messageFor(this.time);
    if (!msg) return this.hide();
    this.text.textContent = msg;
    this.next.hidden = this.nextStop() === null;
    this.el.classList.add('on');
  }

  hide() {
    this.el.classList.remove('on');
  }

  messageFor(t) {
    let msg = null;
    for (const [at, m] of MESSAGES) if (t >= at) msg = m;
    return msg;
  }

  nextStop() {
    const t = this.time;
    const limit = this.isLocked() ? 75.4 : Infinity;
    return STOPS.find((s) => s > t + 1.5 && s <= limit) ?? null;
  }

  goNext() {
    const stop = this.nextStop();
    if (stop === null) return;
    this.hide();
    const p = { y: scrollY };
    gsap.to(p, {
      y: this.scrollAt(stop),
      duration: Math.min(4, 1.2 + (stop - this.time) * 0.09),
      ease: 'power2.inOut',
      onUpdate: () => scrollTo(0, p.y),
    });
  }
}
