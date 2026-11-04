// Mouse / touch position, converted into the game's 320x180 pixel space.
const Input = {
  x: Config.W / 2,
  y: Config.H / 2,
  onPress: null,

  attach(canvas) {
    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      this.x = Math.max(0, Math.min(Config.W - 1, ((e.clientX - r.left) / r.width) * Config.W));
      this.y = Math.max(0, Math.min(Config.H - 1, ((e.clientY - r.top) / r.height) * Config.H));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', (e) => { move(e); if (this.onPress) this.onPress(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'm' || e.key === 'M') Sound.toggleMute(); });
  },
};
