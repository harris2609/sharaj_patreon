# For Shaguftha

A scroll-driven 3D birthday surprise (Three.js + GSAP ScrollTrigger, built with Vite).

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## The story (one scrubbed timeline, `src/main.js`)
1. Arrival: the pink cake turns, curls draw themselves in the corners
2. The candle slides down onto the top tier
3. The flame catches and the room goes dusky
4. Lean in and make a wish. The page holds here until she blows
5. Blow into the microphone: the flame leans with her breath, and once she blows
   hard enough for half a second it dies into a smoke puff and everything goes dark
6. One more scroll: the screen blooms bright with "Happy Birthday Shaguftha"

## Blow detection (`src/blow.js`)
Measures 20-350 Hz energy (breath rumble) against the room's noise floor, learned
in the first 0.7 s. `THRESHOLD` (0.55) and `HOLD` (0.5 s) set how hard and how
long she has to blow. If the mic is denied or unavailable, a "tap to blow it out"
button appears. Microphones need HTTPS (Vercel is fine) or localhost.
In `npm run dev`, `window.__blow.setLevel(0..1)` simulates the mic for testing.

## Deploy
`vercel` from this folder (framework preset: Vite, output `dist`).

## Files
- `src/cake.js` – the cake, stand, candle and flame, built from code
- `src/blow.js` – microphone blow detector and the meter UI
- `src/particles.js` – smoke puff and drifting glints
- `src/main.js` – renderer, lights, scroll timeline
- `src/style.css` / `index.html` – type, flourishes and story text

## Next step: photo gallery
Drop photos into `public/photos/`. The gallery goes after the reveal: extend the
timeline past `110` and add the photo layer in `src/main.js`.
# sharaj_patreon
