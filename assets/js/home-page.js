(function () {
  'use strict';
  const C = window.CubeModel;
  const ui = CubePlayer.createPlayer(document.getElementById('player'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- ヒーロー: 大きな回転記号を 3D の再生と連動させる ----
  const notation = document.getElementById('hero-notation');
  const caption = document.getElementById('hero-caption');
  let shown = '';
  ui.player.on((p) => {
    const key = p.moves.map((m) => m.label).join(' ');
    if (key !== shown) {
      shown = key;
      notation.innerHTML = p.moves.map((m, i) => `<button data-i="${i + 1}" aria-label="${i + 1}手目 ${m.label}">${m.label}</button>`).join('');
    }
    notation.querySelectorAll('button').forEach((b, i) => {
      b.classList.toggle('done', !p.free && i < p.index);
      b.classList.toggle('current', !p.free && i === p.index - 1);
    });
    const m = p.index > 0 ? p.moves[p.index - 1] : p.moves[0];
    caption.innerHTML = m ? `<b>${m.label}</b>　${C.describeMove(m)}` : '';
  });
  notation.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) ui.player.jump(parseInt(b.dataset.i, 10));
  });

  ui.player.loop = !reduceMotion;
  ui.root.querySelector('[data-act="loop"]').classList.toggle('selected', ui.player.loop);
  ui.load({ alg: "R U R' U'", setup: '', stickering: 'affected', title: 'セクシームーブ' });
  if (!reduceMotion) setTimeout(() => ui.player.play(), 700);

  // ---- 回転記号の一覧 ----
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
    document.getElementById('player').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
})();
