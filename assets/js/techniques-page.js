(function () {
  'use strict';
  const C = window.CubeModel;
  const TECH = window.TECHNIQUES;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (n) => `<span class="material-symbols-rounded">${n}</span>`;

  // "UFR" → [1,1,1]
  function nameToHome(name) {
    const v = [0, 0, 0];
    for (const ch of name) {
      if (ch === 'U') v[1] = 1;
      if (ch === 'D') v[1] = -1;
      if (ch === 'F') v[2] = 1;
      if (ch === 'B') v[2] = -1;
      if (ch === 'R') v[0] = 1;
      if (ch === 'L') v[0] = -1;
    }
    return v;
  }
  const swatches = (h) =>
    C.homeStickers(h).map((s) => `<span class="swatch" style="background:${C.FACE_COLORS[s.face]}"></span>`).join('');

  const sel = { id: TECH[0].id, from: 'solved', focus: [], picked: null };
  let moves = [];
  let start = null;

  const ui = CubePlayer.createPlayer($('#player'), {
    onPick: (h) => {
      if (!h || C.pieceType(h) === 'center') {
        setPicked(null);
        return;
      }
      const name = C.posName(h);
      if (!sel.focus.includes(name)) sel.focus.push(name);
      setPicked(name);
      renderTracker();
    },
  });
  const tech = () => TECH.find((t) => t.id === sel.id);

  function setPicked(name) {
    sel.picked = sel.picked === name ? null : name;
    ui.viewer.select(sel.picked ? nameToHome(sel.picked) : null);
    renderFocusChips();
    renderTracker();
  }

  function renderChips() {
    $('#tech-chips').innerHTML = TECH.map(
      (t) => `<button class="chip ${t.id === sel.id ? 'selected' : ''}" data-tech="${t.id}">
        ${t.id === sel.id ? icon('check') : ''}<span>${esc(t.name)}</span></button>`
    ).join('');
  }

  function load() {
    const t = tech();
    moves = C.parseAlg(t.alg);
    const setup = sel.from === 'solved' ? '' : undefined;
    ui.load({ alg: t.alg, setup, stickering: t.stick, title: t.name });
    start = ui.player.states[0];
    sel.focus = t.focus.slice();
    sel.picked = null;
    ui.viewer.select(null);

    $('#tech-head').innerHTML = `
      <h2 class="headline-medium">${esc(t.name)}</h2>
      <p class="mono title-large" style="margin:8px 0 12px;color:var(--md-primary)">${esc(t.alg)}</p>
      <div class="prose">${t.intro}</div>`;

    $('#tech-steps').innerHTML = moves.length && t.steps.length
      ? moves.map((m, i) => `<div class="step-card" data-jump="${i + 1}">
          <div class="step-move">${esc(m.label)}</div>
          <div class="step-body"><p class="label-medium on-variant">${i + 1}手目 — ${esc(C.describeMove(m))}</p>
          <p>${t.steps[i] || ''}</p>${autoMoved(i)}</div></div>`).join('')
      : `<p class="body-medium on-variant">この手順は手数が多いので、1手ずつの解説の代わりに下の追跡表で動きを確認してください。</p>`;

    $('#tech-points').innerHTML = t.points;
    renderEffect();
    renderFocusChips();
    renderTracker();
    syncActive();
  }

  // i 手目で実際に動いたパーツ（focus のもの）を自動表示
  function autoMoved(i) {
    const before = ui.player.states[i];
    const after = ui.player.states[i + 1];
    const items = sel.focus
      .map((n) => {
        const h = nameToHome(n);
        const a = C.posName(C.findPiece(before, h).pos);
        const b = C.posName(C.findPiece(after, h).pos);
        return a === b ? null : `<span class="pc">${n}</span> ${a}→${b}`;
      })
      .filter(Boolean);
    return items.length ? `<p class="body-small on-variant cycle" style="margin-top:6px">${icon('route')}${items.join('　')}</p>` : '';
  }

  function renderEffect() {
    const eff = C.analyzeEffect(moves);
    const ord = C.order(moves);
    const cyc = (list, label) =>
      list.length
        ? list.map((cy) => `<div class="cycle"><span class="label-medium on-variant" style="min-width:64px">${label}</span>${cy
            .map((p) => `<span class="pc ${p.oriented ? '' : 'bad'}" title="${p.oriented ? '向きOK' : '向きがずれる'}">${p.from}</span>`)
            .join(icon('arrow_forward'))}${icon('arrow_forward')}<span class="pc">${cy[0].from}</span></div>`).join('')
        : '';
    const twist = eff.cornerTwists.map((t) => `<span class="pc bad">${t.name}</span>（${t.dir === 'cw' ? '時計回り' : '反時計回り'}にねじれ）`).join(' ');
    const flip = eff.edgeFlips.map((t) => `<span class="pc bad">${t.name}</span>（反転）`).join(' ');
    $('#tech-effect').innerHTML = `
      <p class="body-medium">揃った状態にこの手順を1回かけたとき、何が起きるか（自動計算）。
      <span class="pc" style="font-size:12px">UFR</span> は元の場所、矢印は「そのパーツがどこへ行くか」。
      <span style="color:var(--md-error)">赤枠</span>は向きがずれて到着するパーツ。</p>
      <div style="margin-top:12px">
        ${cyc(eff.corners, 'コーナー')}${cyc(eff.edges, 'エッジ')}
        ${twist ? `<div class="cycle"><span class="label-medium on-variant" style="min-width:64px">その場</span>${twist}</div>` : ''}
        ${flip ? `<div class="cycle"><span class="label-medium on-variant" style="min-width:64px">その場</span>${flip}</div>` : ''}
      </div>
      <hr class="divider">
      <p class="body-medium">変化するパーツ：<b>${eff.changed.length}個</b>　／　繰り返すと <b>${ord}回</b> で元に戻る</p>`;
  }

  function renderFocusChips() {
    const eff = C.analyzeEffect(moves);
    const suggest = eff.changed.map(C.posName).filter((n) => !sel.focus.includes(n));
    $('#focus-chips').innerHTML =
      sel.focus.map((n) => `<button class="chip piece-chip ${n === sel.picked ? 'selected' : ''}" data-pick="${n}">
        ${swatches(nameToHome(n))}<span class="mono">${n}</span>
        <span class="material-symbols-rounded" data-remove="${n}" title="外す" style="margin:0 -8px 0 0">close</span></button>`).join('') +
      suggest.map((n) => `<button class="chip" data-add="${n}">${icon('add')}<span class="mono">${n}</span></button>`).join('');
  }

  function renderTracker() {
    const idx = ui.player.free ? -1 : ui.player.index;
    const head = `<tr><th>パーツ</th><th class="${idx === 0 ? 'col-on' : ''}">開始</th>${moves
      .map((m, i) => `<th class="mono ${idx === i + 1 ? 'col-on' : ''}">${i + 1}. ${esc(m.label)}</th>`).join('')}</tr>`;
    const rows = sel.focus.map((n) => {
      const h = nameToHome(n);
      const tr = C.trace(start, moves, h);
      return `<tr class="${n === sel.picked ? 'active' : ''}"><td><button class="chip piece-chip ${n === sel.picked ? 'selected' : ''}" data-pick="${n}">${swatches(h)}<span class="mono">${n}</span></button></td>${tr
        .map((s, i) => {
          const off = s.twist || s.flipped;
          return `<td class="mono ${idx === i ? 'col-on' : ''}" style="${s.moved ? 'font-weight:500' : 'opacity:.55'}">${s.pos}${
            off ? '<span style="color:var(--md-error)" title="向きがずれている">*</span>' : ''}</td>`;
        }).join('')}</tr>`;
    });
    $('#tracker').innerHTML = `<table class="data">${head}${rows.join('')}</table>`;
    const on = $('#tracker th.col-on');
    const wrap = $('#tracker');
    if (on && (on.offsetLeft < wrap.scrollLeft + 90 || on.offsetLeft > wrap.scrollLeft + wrap.clientWidth - 60)) {
      wrap.scrollLeft = on.offsetLeft - 120;
    }
  }

  function syncActive() {
    const idx = ui.player.free ? -1 : ui.player.index;
    document.querySelectorAll('#tech-steps .step-card').forEach((c, i) => c.classList.toggle('active', i === idx - 1));
    renderTracker();
  }
  ui.player.on(syncActive);

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tech]');
    if (t) {
      sel.id = t.dataset.tech;
      history.replaceState(null, '', '#' + sel.id);
      renderChips();
      load();
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      sel.focus = sel.focus.filter((n) => n !== rm.dataset.remove);
      if (sel.picked === rm.dataset.remove) setPicked(rm.dataset.remove);
      renderFocusChips();
      renderTracker();
      return;
    }
    const pk = e.target.closest('[data-pick]');
    if (pk) return setPicked(pk.dataset.pick);
    const add = e.target.closest('[data-add]');
    if (add) {
      sel.focus.push(add.dataset.add);
      renderFocusChips();
      renderTracker();
      return;
    }
    const j = e.target.closest('[data-jump]');
    if (j) ui.player.jump(parseInt(j.dataset.jump, 10));
    const fr = e.target.closest('[data-from]');
    if (fr) {
      sel.from = fr.dataset.from;
      document.querySelectorAll('[data-from]').forEach((b) => b.classList.toggle('selected', b === fr));
      load();
    }
  });

  const fromHash = location.hash.replace('#', '');
  if (TECH.some((t) => t.id === fromHash)) sel.id = fromHash;
  renderChips();
  load();
})();
