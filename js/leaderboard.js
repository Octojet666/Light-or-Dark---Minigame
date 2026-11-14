const Leaderboard = (() => {
  let box = null, label = null, link = null;

  function build() {
    box = document.createElement('div');
    box.id = 'namebox';
    box.innerHTML = '<span>SCORE <b></b></span><a class="ok" target="_blank" rel="noopener">SUBMIT SCORE</a><button class="skip">HIDE</button>';
    label = box.querySelector('b');
    link = box.querySelector('a');
    box.querySelector('.skip').onclick = hidePrompt;
    link.addEventListener('click', () => setTimeout(hidePrompt, 100));
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(box);
  }

  function offer(score) {
    if (!box) build();
    label.textContent = score.toFixed(1) + 'S';
    link.href = 'https://github.com/' + Config.repo + '/issues/new?title=' +
      encodeURIComponent('SCORE|' + score.toFixed(1)) +
      '&body=' + encodeURIComponent('Submitting my Ember score. Just press "Submit new issue" and the leaderboard updates in about a minute.');
    box.style.display = 'flex';
  }

  function hidePrompt() { if (box) box.style.display = 'none'; }

  return { offer, hidePrompt };
})();
