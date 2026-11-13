const Leaderboard = (() => {
  let box = null;
  const clean = (n) => String(n).toUpperCase().replace(/[^A-Z0-9 _.-]/g, '').trim().slice(0, 12);

  function name() {
    try { return clean(localStorage.getItem(Config.nameKey) || ''); } catch (e) { return ''; }
  }

  async function submit(n, score) {
    try { localStorage.setItem(Config.nameKey, n); } catch (e) {}
    const r = await fetch(Config.api + '/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: n, score }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function build() {
    box = document.createElement('div');
    box.id = 'namebox';
    box.innerHTML = '<span>NAME</span><input maxlength="12" placeholder="YOUR NAME" autocomplete="off" spellcheck="false">' +
      '<button class="ok">SAVE</button><button class="skip">SKIP</button>';
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(box);
  }

  function prompt(done) {
    if (!box) build();
    const input = box.querySelector('input');
    const finish = (v) => { box.style.display = 'none'; done(v); };
    const save = () => { const n = clean(input.value); if (n) finish(n); };
    box.querySelector('.ok').onclick = save;
    box.querySelector('.skip').onclick = () => finish('');
    input.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') save(); };
    input.value = '';
    box.style.display = 'flex';
    input.focus();
  }

  function hidePrompt() { if (box) box.style.display = 'none'; }

  return { name, submit, prompt, hidePrompt };
})();
