const Sprites = {
  flame: [
    ['..o..', '.ooo.', '.oyo.', 'oyyyo', 'oywyo', '.oyo.', '..o..'],
    ['...o.', '.ooo.', '.oyo.', 'oyyyo', 'oywyo', '.oyo.', '..o..'],
  ],
  spark: [
    ['.g.', 'gwg', '.g.'],
    ['g.g', '.w.', 'g.g'],
  ],
};

function blit(ctx, rows, x, y) {
  const map = { o: Config.colors.ember, y: Config.colors.gold, g: Config.colors.gold, w: Config.colors.cream };
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch !== '.') { ctx.fillStyle = map[ch]; ctx.fillRect(x + c, y + r, 1, 1); }
    }
}

class Player {
  constructor(x, y) { this.x = x; this.y = y; }
  update(dt, tx, ty) {
    const k = Math.min(1, dt * 9);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
  }
  draw(ctx, clock) {
    blit(ctx, Sprites.flame[Math.floor(clock * 8) % 2], Math.round(this.x) - 2, Math.round(this.y) - 3);
  }
}

class Drop {
  constructor(x, y, speed) { this.x = x; this.y = y; this.speed = speed; }
  update(dt) { this.y += this.speed * dt; }
  draw(ctx) {
    ctx.fillStyle = Config.colors.rain;
    ctx.fillRect(Math.round(this.x), Math.round(this.y) - 4, 1, 4);
    ctx.fillStyle = Config.colors.rainLight;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 2);
  }
}

class Spark {
  constructor(x, y) { this.x = x; this.y = y; this.life = Config.sparkLife; }
  draw(ctx, clock) {
    if (this.life < 2.5 && Math.floor(clock * 8) % 2) return; // blink before it fades
    blit(ctx, Sprites.spark[Math.floor(clock * 4) % 2], Math.round(this.x) - 1, Math.round(this.y) - 1);
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color) {
    Object.assign(this, { x, y, vx, vy, life, color });
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
  draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 1); }
}
