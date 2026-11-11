// Vendor script of the ReelBox projector, from 2014. No npm package, no types.
// Loading it adds a ReelBox global to the page. You do not need to modify this file.
const reels = {
  'R-1975': { title: 'Jaws', year: 1975, minutes: 124 },
  'R-2001': { title: 'Spirited Away', year: 2001, minutes: 125 },
  'R-1993': { title: 'Jurassic Park', year: 1993, minutes: 127 },
}

globalThis.ReelBox = {
  version: '4.0.2',
  // the film on a reel, or null when the reel is not in the box
  film(reel) {
    return reels[reel] ?? null
  },
  dimLights(level) {
    return Math.max(0, Math.min(100, level))
  },
}
