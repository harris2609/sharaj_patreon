# For Shagufta · sha2.life

A scroll-driven 3D birthday surprise that turns into the sha2.life launch page.
Three.js + GSAP ScrollTrigger, built with Vite.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## The story (one scrubbed timeline)
**Part one, the cake (pink)** – `src/main.js`
1. Arrival: the pink cake turns, curls draw themselves in the corners
2. The candle slides down onto the top tier, the flame catches
3. The page holds at "make a wish" until she blows into the microphone
   (or taps the fallback). The flame dies, smoke, lights out
4. One more scroll: "Happy Birthday Shagufta"

**Part two, the journey (sky blue)** – `src/journey.js`
5. The bloom fades, the cake sinks away, the palette turns to the brand's
   midnight/sky blue and the stars come out
6. The camera flies through four chapters; the photos fly out of the dark
   into each scene:
   - 2018 College: sepia polaroids pegged to a string
   - Dec 2023 Andaman: cards floating over a shader sea, palm on the right
   - 2024 Up north: layered ridges, snowfall, a trail of cards climbing
   - 2025-26 Chennai: cards orbiting in a warm golden glow
7. Four promise cards (tap to flip)
8. Finale: hearts gather into one around the SHA² logo, with a link to sha2.life

**Guide** (`src/guide.js`): whenever she pauses for ~2 s a small pill at the
bottom says what to do at that point (scroll, tap a photo, tap a card) with a
"next" button that scrolls to the following moment. It stays out of the way
while scrolling, while the blow control is up, in the lightbox and at the end.
Messages and stops are two small tables at the top of the file.

Throughout the journey: tap a photo to open it full-screen with its caption;
tap anywhere else to let a few hearts go. Moving the pointer, or tilting the
phone, nudges the camera for parallax. A soft synthesized pad starts after the
candle is out (so it cannot leak into the microphone); the note button top-right
mutes it.

## Edit the words and photos
Everything she reads is in **`src/story.js`**: chapter titles, lines, the
caption for every photo, the four promises and the finale text. Photos live in
`public/photos/<chapter>/`. To add one, drop the file in and add a `photo(...)`
line to that chapter; `w`/`h` is just the aspect ratio (default 3:4).

## Blow detection (`src/blow.js`)
Measures 20-350 Hz energy (breath rumble) against the room's noise floor, learned
in the first 0.7 s. `THRESHOLD` (0.55) and `HOLD` (0.5 s) set how hard and how
long she has to blow. A "press & hold to blow" button is always there as the
fallback: holding it ramps the meter like a breath and uses the same hold timer,
so it works with no microphone at all. Microphones need HTTPS (Vercel is fine)
or localhost.

In `npm run dev`, `window.__blow.setLevel(1)` stands in for the microphone.
To jump around the timeline while testing: `scrollTo(0, seconds * innerHeight * 6.8 / 110)`
(college ≈ 134, Andaman ≈ 165, mountains ≈ 197, Chennai ≈ 229, promises ≈ 262, finale ≈ 305).

## Deploy
`vercel` from this folder (framework preset: Vite, output `dist`). The page is
marked `noindex`; share the link directly.

## Files
- `src/main.js` – renderer, lights, the cake timeline, camera, tap handling
- `src/journey.js` – everything after the reveal: chapter stops, camera flights, finale
- `src/chapters.js` – the four chapter scenes and their card layouts
- `src/photos.js` – a framed 3D photo card with lazy texture loading
- `src/sea.js`, `src/peaks.js` – Andaman water + palm, mountain ridges + snow
- `src/hearts.js` – the tap burst and the finale heart
- `src/promises.js`, `src/lightbox.js`, `src/audio.js` – DOM cards, viewer, music
- `src/story.js` – all copy, captions and photo lists
- `src/cake.js`, `src/blow.js`, `src/particles.js` – the original cake, mic, smoke
