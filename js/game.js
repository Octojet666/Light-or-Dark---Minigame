const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.state = 'menu'; // menu | play | over
    this.player = new Player(Config.W / 2, Config.H / 2);
    this.light = Config.light.start;
    this.clock = 0;
    this.time = 0;
    this.overTime = 0;
    this.newBest = false;
    this.best = 0;
    this.runId = 0;
    this.submitState = 'idle'; // idle | sending | done | error | skipped
    this.rank = null;
    try { this.best = +localStorage.getItem(Config.storageKey) || 0; } catch (e) {}
    this.reset();
  }

  reset() {
    this.drops = []; this.sparks = []; this.parts = [];
    this.dropTimer = 0.5; this.sparkTimer = 0.2;
    this.shake = 0; this.hitstop = 0;
  }

  start() {
    this.reset();
    this.runId++;
    Leaderboard.hidePrompt();
    this.state = 'play';
    this.time = 0;
    this.light = Config.light.start;
    Sound.start();
  }

  die() {
    this.state = 'over';
    this.overTime = 0;
    this.drops = []; this.sparks = [];
    this.newBest = this.time > this.best;
    if (this.newBest) {
      this.best = this.time;
      try { localStorage.setItem(Config.storageKey, this.best); } catch (e) {}
    }
    Sound.over();

    this.submitState = 'idle'; this.rank = null;
    if (Config.api && this.time >= Config.minSubmit) {
      const name = Leaderboard.name();
      if (name) this.sendScore(name);
      else Leaderboard.prompt((n) => (n ? this.sendScore(n) : (this.submitState = 'skipped')));
    }
  }

  sendScore(name) {
    const run = this.runId, score = +this.time.toFixed(1);
    this.submitState = 'sending';
    Leaderboard.submit(name, score)
      .then((r) => { if (run !== this.runId) return; this.rank = r.rank; this.submitState = 'done'; })
      .catch(() => { if (run === this.runId) this.submitState = 'error'; });
  }

  press() {
    Sound.init();
    if (this.state === 'menu' || (this.state === 'over' && this.overTime > 0.7)) this.start();
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(15, 55);
      this.parts.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.3, 0.7), color));
    }
  }

  update(dt) {
    this.clock += dt;
    if (this.state === 'play' && this.hitstop > 0) { this.hitstop -= dt; return; }

    this.player.update(dt, Input.x, Input.y);
    if (this.state !== 'over' && Math.random() < dt * 30) {
      this.parts.push(new Particle(this.player.x + rand(-2, 2), this.player.y, rand(-6, 6), rand(-24, -12), 0.7,
        Math.random() < 0.5 ? Config.colors.ember : Config.colors.gold));
    }
    this.parts.forEach((p) => p.update(dt));
    this.parts = this.parts.filter((p) => p.life > 0);
    this.shake = Math.max(0, this.shake - dt * 12);

    if (this.state === 'over') { this.overTime += dt; return; }
    if (this.state !== 'play') return;

    const { light: L, rain } = Config;
    this.time += dt;
    const k = Math.min(this.time / Config.rampSeconds, 1);
    this.light -= dt * (L.decayBase + L.decayRamp * k);

    this.dropTimer -= dt;
    if (this.dropTimer <= 0) {
      this.dropTimer = lerp(rain.gapStart, rain.gapEnd, k);
      const tip = World.tips[Math.floor(Math.random() * World.tips.length)];
      this.drops.push(new Drop(tip.x, tip.y, lerp(rain.slowest, rain.fastest, k) * rand(0.8, 1.2)));
    }
    this.sparkTimer -= dt;
    if (this.sparkTimer <= 0) {
      this.sparkTimer = 1.5;
      if (this.sparks.length < Config.maxSparks)
        this.sparks.push(new Spark(rand(20, Config.W - 20), rand(36, Config.H - 16)));
    }

    const p = this.player;
    this.drops = this.drops.filter((d) => {
      d.update(dt);
      if (Math.hypot(d.x - p.x, d.y - p.y) < 5) {
        this.light -= L.dropDamage;
        this.hitstop = 0.05; this.shake = 3;
        this.burst(p.x, p.y, Config.colors.rainLight, 10);
        Sound.hit();
        return false;
      }
      return d.y < Config.H;
    });
    this.sparks = this.sparks.filter((s) => {
      s.life -= dt;
      if (Math.hypot(s.x - p.x, s.y - p.y) < 10) {
        this.light = Math.min(L.max, this.light + L.sparkGain);
        this.burst(s.x, s.y, Config.colors.gold, 8);
        Sound.pickup();
        return false;
      }
      return s.life > 0;
    });

    Sound.music(dt, k);
    if (this.light < L.min) this.die();
  }

  draw() {
    const ctx = this.ctx, col = Config.colors, p = this.player;
    const radius = this.state === 'play' ? this.light : Config.light.start;

    ctx.save();
    if (this.shake > 0.5) ctx.translate(Math.round(rand(-this.shake, this.shake)), Math.round(rand(-this.shake, this.shake)));
    World.draw(ctx);
    this.drops.forEach((d) => d.draw(ctx));
    this.sparks.forEach((s) => s.draw(ctx, this.clock));
    ctx.restore();

    Lighting.apply(ctx, Math.round(p.x), Math.round(p.y), radius);

    // faint glints so you can catch rain and sparks out in the dark
    const flick = Math.floor(this.clock * 12) % 3 === 0;
    for (const d of this.drops) {
      if (flick && Math.hypot(d.x - p.x, d.y - p.y) > radius) { ctx.fillStyle = col.rain; ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 2); }
    }
    for (const s of this.sparks) {
      if (Math.floor(this.clock * 3) % 2 && Math.hypot(s.x - p.x, s.y - p.y) > radius) { ctx.fillStyle = col.gold; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    }

    this.parts.forEach((q) => q.draw(ctx));
    if (this.state !== 'over') p.draw(ctx, this.clock);
    this.drawUI(ctx);
  }

  drawUI(ctx) {
    const { W, H, colors: col } = Config;
    const blink = Math.floor(this.clock * 2) % 2 === 0;
    if (this.state === 'play') {
      Font.shadowed(ctx, this.time.toFixed(1), W / 2, 12, 2, col.cream, col.dark, 'center');
      if (this.best > 0) Font.shadowed(ctx, 'BEST ' + this.best.toFixed(1), W - 6, H - 16, 1, col.vein, col.dark, 'right');
    } else if (this.state === 'menu') {
      Font.shadowed(ctx, 'EMBER', W / 2, 34, 8, col.ember, col.red, 'center');
      Font.shadowed(ctx, 'KEEP THE LAST LIGHT BURNING', W / 2, 104, 1, col.cream, col.dark, 'center');
      Font.shadowed(ctx, 'CATCH THE SPARKS - DODGE THE RAIN', W / 2, 116, 1, col.vein, col.dark, 'center');
      if (blink) Font.shadowed(ctx, 'CLICK TO START', W / 2, 138, 2, col.gold, col.dark, 'center');
      if (this.best > 0) Font.shadowed(ctx, 'BEST ' + this.best.toFixed(1), W / 2, 160, 1, col.vein, col.dark, 'center');
      Font.shadowed(ctx, 'M - SOUND ' + (Sound.isMuted() ? 'OFF' : 'ON'), 6, H - 12, 1, col.vein, col.dark);
    } else {
      Font.shadowed(ctx, 'LIGHTS OUT', W / 2, 40, 5, col.ember, col.red, 'center');
      Font.shadowed(ctx, 'YOU BURNED ' + this.time.toFixed(1) + ' SECONDS', W / 2, 96, 1, col.cream, col.dark, 'center');
      if (this.newBest) { if (blink) Font.shadowed(ctx, 'NEW BEST!', W / 2, 112, 2, col.gold, col.dark, 'center'); }
      else Font.shadowed(ctx, 'BEST ' + this.best.toFixed(1), W / 2, 112, 1, col.vein, col.dark, 'center');
      const st = this.submitState;
      if (st === 'sending') Font.shadowed(ctx, 'SAVING SCORE...', W / 2, 124, 1, col.vein, col.dark, 'center');
      else if (st === 'done') Font.shadowed(ctx, this.rank ? 'WORLD RANK ' + this.rank : 'NOT IN THE TOP 50', W / 2, 124, 1, col.rainLight, col.dark, 'center');
      else if (st === 'error') Font.shadowed(ctx, 'LEADERBOARD OFFLINE', W / 2, 124, 1, col.red, col.dark, 'center');
      if (this.overTime > 0.7 && blink) Font.shadowed(ctx, 'CLICK TO RELIGHT', W / 2, 140, 1, col.gold, col.dark, 'center');
    }
  }
}
