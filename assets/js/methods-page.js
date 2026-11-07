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
        ${m.id === 'cfop2' ? '<span class="badge now">あなたは今ここ</span>' : ''}
      </div>
      <h2 class="headline-medium">${esc(m.name)}</h2>
      <p class="body-large on-variant" style="margin-top:8px">${esc(m.summary)}</p>`;
    $('#step-tabs').innerHTML = m.steps
      .map((s, i) => `<button class="tab ${i === sel.step ? 'selected' : ''}" data-step="${i}"><span class="step-num">${i + 1}</span>${esc(s.name)}</button>`)
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
        .map((a, i) => {
          const head = a.group && (i === 0 || s.algs[i - 1].group !== a.group)
            ? `<li class="alg-group"><h4 class="title-small">${esc(a.group)}</h4>${s.groups && s.groups[a.group] ? `<p class="body-medium on-variant">${s.groups[a.group]}</p>` : ''}</li>`
            : '';
          return `${head}<li><button class="list-item ${i === sel.alg ? 'selected' : ''}" data-alg="${i}">
            <span class="li-case">${caseSvg(a, 48)}</span>
            <span class="li-text"><span class="li-head">${esc(a.name)}</span>
            <span class="li-sub mono">${esc(a.alg)}</span></span>
            ${statusIcon(Progress.get(Progress.algId(m, s, a)))}</button></li>`;
        })
        .join('')}</ul>
      <div id="alg-detail" style="margin-top:16px"></div>`;
    loadAlg();
  }

  // ケース図: その手順で解ける状態を、ステッカー表示モードに合わせて描く
  function caseSvg(a, size) {
    const moves = C.parseAlg(a.alg);
    const st = C.applyMoves(C.createSolved(), a.setup != null ? C.parseAlg(a.setup) : C.invertMoves(moves));
    const ctx = { changed: new Set(C.analyzeEffect(moves).changed.map(C.key)), touched: C.touchedPieces(st, moves) };
    const mode = CubePlayer.STICKERINGS[a.stick] || CubePlayer.STICKERINGS.full;
    return CaseDiagram.svg(st, mode.fn(ctx), CaseDiagram.kindFor(a.stick), size);
  }

  function statusIcon(st) {
    if (st === 'learned') return '<span class="material-symbols-rounded status-icon learned" title="習得">check_circle</span>';
    if (st === 'learning') return '<span class="material-symbols-rounded status-icon learning" title="練習中">pending</span>';
    return '<span class="material-symbols-rounded status-icon">view_in_ar</span>';
  }

  function loadAlg() {
    const s = method().steps[sel.step];
    const a = s.algs[sel.alg] || s.algs[0];
    ui.load({ alg: a.alg, setup: a.setup, stickering: a.stick, title: a.name });
    renderDetail();
    const hash = `#${sel.method}/${sel.step}/${sel.alg}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function renderDetail() {
    const s = method().steps[sel.step];
    const a = s.algs[sel.alg] || s.algs[0];
    const moves = C.parseAlg(a.alg);
    const eff = C.analyzeEffect(moves);
    const n = C.order(moves);
    const id = Progress.algId(method(), s, a);
    const st = Progress.get(id);
    $('#alg-detail').innerHTML = `
      <div class="card outlined">
        <div class="detail-head">
          <div class="detail-case">${caseSvg(a, 112)}</div>
          <div>
            <h3 class="title-medium">${esc(a.name)}</h3>
            <p class="mono body-large" style="margin:4px 0 8px">${esc(C.movesToString(moves))}（${moves.length}手）</p>
            ${a.note ? `<p class="body-medium">${esc(a.note)}</p>` : ''}
          </div>
        </div>
        <div class="segmented" style="margin-top:12px" role="group" aria-label="習得状況">
          ${['', 'learning', 'learned'].map((k) => `<button class="seg ${st === k ? 'selected' : ''}" data-status="${k}">${st === k ? '<span class="material-symbols-rounded">check</span>' : ''}${Progress.LABELS[k]}</button>`).join('')}
        </div>
        <hr class="divider">
        <p class="label-large" style="margin-bottom:8px">指使い（一例）</p>
        <div class="finger-row">${moves.map((mv) => `<div class="finger-cell"><span class="mono">${esc(mv.label)}</span><small>${esc(Fingers.short(mv))}</small></div>`).join('')}</div>
        <hr class="divider">
        <p class="body-medium on-variant">揃った状態にこの手順をかけると、
          <b>コーナー${eff.changed.filter((h) => C.pieceType(h) === 'corner').length}個・エッジ${eff.changed.filter((h) => C.pieceType(h) === 'edge').length}個</b>
          が変化し、${n ? `<b>${n}回</b>繰り返すと元に戻ります` : '元に戻るまで多数回かかります'}。
          色表示を「変化するパーツだけ」にすると、影響するパーツだけに色が付きます。</p>
      </div>`;
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
    const stb = e.target.closest('[data-status]');
    if (stb) {
      const s = method().steps[sel.step];
      Progress.set(Progress.algId(method(), s, s.algs[sel.alg]), stb.dataset.status);
      renderDetail();
      const item = document.querySelectorAll('#alg-list .list-item')[sel.alg];
      if (item) item.querySelector('.status-icon').outerHTML = statusIcon(stb.dataset.status);
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
