
const World = (() => {
  const layer = document.createElement('canvas');
  layer.width = Config.W;
  layer.height = Config.H;
  const tips = []; 

  function rng(seed) { 
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build() {
    const { W, H, colors: col } = Config;
    const c = layer.getContext('2d'), r = rng(7);
    c.fillStyle = col.bg; c.fillRect(0, 0, W, H);

    for (let i = 0; i < 260; i++) { // rock speckle
      c.fillStyle = col.rock;
      c.fillRect((r() * W) | 0, (r() * H) | 0, 1 + ((r() * 3) | 0), 1 + ((r() * 2) | 0));
    }
    for (let i = 0; i < 45; i++) { // pale mineral flecks
      c.fillStyle = col.vein;
      c.fillRect((r() * W) | 0, (r() * H) | 0, 1, 1);
    }

    c.fillStyle = col.deep; // ceiling and stalactites
    c.fillRect(0, 0, W, 8);
    for (let x = 0; x < W; ) {
      const w = 8 + ((r() * 9) | 0), h = 10 + ((r() * 12) | 0);
      for (let row = 0; row < h; row++) {
        const half = Math.max(0, Math.round((w / 2) * (1 - row / h)));
        c.fillRect(x + ((w / 2) | 0) - half, row, half * 2 || 1, 1);
      }
      tips.push({ x: x + ((w / 2) | 0), y: h });
      x += w;
    }

    c.fillStyle = col.deep; // floor
    c.fillRect(0, H - 6, W, 6);
    for (let x = 0; x < W; x += 5 + ((r() * 6) | 0)) c.fillRect(x, H - 9, 3 + ((r() * 4) | 0), 3);
  }

  return { build, tips, draw: (ctx) => ctx.drawImage(layer, 0, 0) };
})();
