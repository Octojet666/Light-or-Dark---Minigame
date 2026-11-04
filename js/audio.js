const Sound = (() => {
  let ac = null, master = null, pulse = null, noiseBuf = null, muted = false;
  let step = 0, acc = 0;
  const BASS = [110, 110, 131, 110, 98, 98, 123, 98]; // A A C A  G G B G

  function makePulse(duty) { 
    const n = 24, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      im[k] = (2 / (k * Math.PI)) * (1 - Math.cos(k * Math.PI * duty));
    }
    return ac.createPeriodicWave(re, im);
  }

  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ac.destination);
      pulse = makePulse(0.25);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }

  function tone(freq, dur, { wave = 'pulse', vol = 0.2, slide = 0, delay = 0 } = {}) {
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    if (wave === 'pulse') o.setPeriodicWave(pulse); else o.type = wave;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur);
  }

  function noise(dur, vol) {
    if (!ac) return;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(); s.stop(ac.currentTime + dur);
  }

  return {
    init,
    pickup() { tone(880, 0.07, { vol: 0.15 }); tone(1320, 0.1, { vol: 0.15, delay: 0.07 }); },
    hit() { noise(0.18, 0.35); tone(180, 0.25, { wave: 'square', slide: -120, vol: 0.18 }); },
    start() { [330, 440, 660].forEach((f, i) => tone(f, 0.1, { delay: i * 0.06 })); },
    over() { [330, 262, 196, 147].forEach((f, i) => tone(f, i === 3 ? 0.45 : 0.14, { delay: i * 0.14 })); },
    music(dt, intensity) {
      if (!ac || muted) return;
      acc += dt;
      const beat = 0.32 - 0.14 * intensity;
      if (acc >= beat) {
        acc -= beat;
        tone(BASS[step % 8], beat * 0.85, { wave: 'triangle', vol: 0.22 });
        if (step % 4 === 0 && intensity > 0.5) noise(0.04, 0.05);
        step++;
      }
    },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; },
    isMuted: () => muted,
  };
})();
