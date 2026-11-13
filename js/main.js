(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;

  // scale the 320x180 screen up by whole numbers
  function fit() {
    const s = Math.max(1, Math.floor(Math.min(innerWidth / Config.W, innerHeight / Config.H)));
    canvas.style.width = Config.W * s + 'px';
    canvas.style.height = Config.H * s + 'px';
  }
  addEventListener('resize', fit);
  fit();

  World.build();
  Input.attach(canvas);
  const game = new Game(ctx);
  Input.onPress = () => game.press();

  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    game.update(dt);
    game.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
