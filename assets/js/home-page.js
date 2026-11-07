(function () {
  'use strict';
  const C = window.CubeModel;
  const ui = CubePlayer.createPlayer(document.getElementById('player'));
  ui.player.loop = true;
  ui.root.querySelector('[data-act="loop"]').classList.add('selected');
  ui.load({ alg: "R U R' U'", setup: '', stickering: 'affected', title: 'セクシームーブ' });
  setTimeout(() => ui.player.play(), 600);

  const list = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'R2', 'M', 'E', 'S', 'r', 'x', 'y', 'z'];
  const grid = document.getElementById('notation-grid');
  grid.innerHTML = list
    .map((t) => {
      const m = C.parseAlg(t)[0];
      return `<button class="list-item" data-n="${t}"><span class="li-lead mono">${m.label}</span>
        <span class="li-text"><span class="li-sub">${C.describeMove(m)}</span></span></button>`;
    })
    .join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-n]');
    if (!b) return;
    grid.querySelectorAll('.list-item').forEach((x) => x.classList.toggle('selected', x === b));
    ui.player.loop = false;
    ui.root.querySelector('[data-act="loop"]').classList.remove('selected');
    ui.load({ alg: b.dataset.n, setup: '', stickering: 'full', title: b.dataset.n });
    ui.player.play();
    document.getElementById('player').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
