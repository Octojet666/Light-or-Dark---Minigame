
const Lighting = (() => {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const LEVELS = [0.05, 0.38, 0.7, 1];
  const DARK = [13, 15, 26];

  function apply(ctx, cx, cy, radius) {
    const { W, H } = Config;
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    radius = Math.max(radius, 1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = Math.hypot(x - cx, y - cy) / radius;
        let level = 0;
        if (t < 1) {
          const l = t <= 0.3 ? 1 : (1 - t) / 0.7;
          level = Math.floor(l * 3 + BAYER[(y & 3) * 4 + (x & 3)] / 16);
        }
        if (level >= 3) continue;
        const f = LEVELS[level], i = (y * W + x) * 4;
        d[i] = DARK[0] + (d[i] - DARK[0]) * f;
        d[i + 1] = DARK[1] + (d[i + 1] - DARK[1]) * f;
        d[i + 2] = DARK[2] + (d[i + 2] - DARK[2]) * f;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return { apply };
})();
