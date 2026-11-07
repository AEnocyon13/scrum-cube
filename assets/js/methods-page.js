(function () {
  'use strict';
  const C = window.CubeModel;
  const METHODS = window.METHODS;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ui = CubePlayer.createPlayer($('#player'));
  const sel = { method: 'cfop2', step: 0, alg: 0 };

  function parseHash() {
    const [m, s, a] = location.hash.replace('#', '').split('/');
    if (METHODS.some((x) => x.id === m)) sel.method = m;
    sel.step = parseInt(s, 10) || 0;
    sel.alg = parseInt(a, 10) || 0;
  }
  const method = () => METHODS.find((m) => m.id === sel.method);

  function renderMethodChips() {
    $('#method-chips').innerHTML = METHODS.map(
      (m) => `<button class="chip ${m.id === sel.method ? 'selected' : ''}" data-method="${m.id}">
        ${m.id === sel.method ? '<span class="material-symbols-rounded">check</span>' : ''}
        <span>${esc(m.name)}</span><span class="chip-badge">${m.levelName}</span></button>`
    ).join('');
  }

  function renderMethod() {
    const m = method();
    $('#method-head').innerHTML = `
      <div class="meta-row">
        <span class="badge lv${m.level}">${m.levelName}</span>
        <span class="badge lv1">${esc(m.time)}</span>
        <span class="badge lv1">${esc(m.moves)}</span>
        ${m.id === 'cfop2' ? '<span class="badge">あなたは今ここ</span>' : ''}
      </div>
      <h2 class="headline-medium">${esc(m.name)}</h2>
      <p class="body-large on-variant" style="margin-top:8px">${esc(m.summary)}</p>`;
    $('#step-tabs').innerHTML = m.steps
      .map((s, i) => `<button class="tab ${i === sel.step ? 'selected' : ''}" data-step="${i}">${i + 1}. ${esc(s.name)}</button>`)
      .join('');
    renderStep();
  }

  function renderStep() {
    const m = method();
    const s = m.steps[sel.step] || m.steps[0];
    $('#step-body').innerHTML = `
      <div class="card secondary">
        <p class="label-large" style="display:flex;gap:8px;align-items:center">
          <span class="material-symbols-rounded">flag</span>このステップのゴール</p>
        <p class="body-large" style="margin-top:4px">${esc(s.goal)}</p>
      </div>
      <div class="prose" style="margin-top:16px">${s.html}</div>
      <h3 class="title-medium" style="margin:24px 0 8px">手順（タップで3D表示）</h3>
      <ul class="list" id="alg-list">${s.algs
        .map(
          (a, i) => `<li><button class="list-item ${i === sel.alg ? 'selected' : ''}" data-alg="${i}">
            <span class="li-lead">${i + 1}</span>
            <span class="li-text"><span class="li-head">${esc(a.name)}</span>
            <span class="li-sub mono">${esc(a.alg)}</span></span>
            <span class="material-symbols-rounded">view_in_ar</span></button></li>`
        )
        .join('')}</ul>
      <div id="alg-detail" style="margin-top:16px"></div>`;
    loadAlg();
  }

  function loadAlg() {
    const s = method().steps[sel.step];
    const a = s.algs[sel.alg] || s.algs[0];
    ui.load({ alg: a.alg, setup: a.setup, stickering: a.stick, title: a.name });
    const moves = C.parseAlg(a.alg);
    const eff = C.analyzeEffect(moves);
    const n = C.order(moves);
    $('#alg-detail').innerHTML = `
      <div class="card outlined">
        <h3 class="title-medium">${esc(a.name)}</h3>
        <p class="mono body-large" style="margin:4px 0 8px">${esc(C.movesToString(moves))}（${moves.length}手）</p>
        ${a.note ? `<p class="body-medium">${esc(a.note)}</p>` : ''}
        <hr class="divider">
        <p class="body-medium on-variant">揃った状態にこの手順をかけると、
          <b>コーナー${eff.changed.filter((h) => C.pieceType(h) === 'corner').length}個・エッジ${eff.changed.filter((h) => C.pieceType(h) === 'edge').length}個</b>
          が変化し、${n ? `<b>${n}回</b>繰り返すと元に戻ります` : '元に戻るまで多数回かかります'}。
          色表示を「変化するパーツだけ」にすると、影響するパーツだけに色が付きます。</p>
      </div>`;
    const hash = `#${sel.method}/${sel.step}/${sel.alg}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  document.addEventListener('click', (e) => {
    const mb = e.target.closest('[data-method]');
    if (mb) {
      sel.method = mb.dataset.method;
      sel.step = 0;
      sel.alg = 0;
      renderMethodChips();
      renderMethod();
      return;
    }
    const sb = e.target.closest('[data-step]');
    if (sb) {
      sel.step = parseInt(sb.dataset.step, 10);
      sel.alg = 0;
      document.querySelectorAll('#step-tabs .tab').forEach((t, i) => t.classList.toggle('selected', i === sel.step));
      renderStep();
      return;
    }
    const ab = e.target.closest('[data-alg]');
    if (ab) {
      sel.alg = parseInt(ab.dataset.alg, 10);
      document.querySelectorAll('#alg-list .list-item').forEach((t, i) => t.classList.toggle('selected', i === sel.alg));
      loadAlg();
      if (window.innerWidth < 960) $('#player').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.addEventListener('hashchange', () => {
    const before = `${sel.method}/${sel.step}/${sel.alg}`;
    parseHash();
    if (before === `${sel.method}/${sel.step}/${sel.alg}`) return;
    renderMethodChips();
    renderMethod();
  });

  parseHash();
  renderMethodChips();
  renderMethod();
})();
