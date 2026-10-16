import { PROMISES } from './story.js';

// Sharaj's promises as flip cards. The front shows the promise, a tap turns it
// over to the note. Pointer events are only enabled while the timeline is on
// this chapter, so the cards never block scrolling elsewhere.
export class PromiseCards {
  constructor(audio) {
    this.host = document.getElementById('promise-grid');
    this.audio = audio;
    PROMISES.forEach((p, i) => this.host.appendChild(this.card(p, i)));
  }

  card(p, i) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'promise';
    el.style.setProperty('--i', i);
    el.innerHTML = `
      <span class="face front"><span class="num">${i + 1}</span><span class="title">${p.title}</span><span class="hint">tap to open</span></span>
      <span class="face back"><span class="note">${p.note}</span><span class="sig">— Sharaj</span></span>`;
    el.addEventListener('click', () => {
      const open = el.classList.toggle('open');
      if (open) this.audio.chime(988 + i * 120);
    });
    return el;
  }

  setLive(on) {
    this.host.parentElement.classList.toggle('live', on);
  }
}
