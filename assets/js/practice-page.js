(function () {
  'use strict';
  const C = window.CubeModel;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'scrum-cube-solves-v1';
  const OPT_KEY = 'scrum-cube-timer-options-v1';

  // ---------------- 保存 ----------------
  const load = (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || d;
    } catch (e) {
      return d;
    }
  };
  const store = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      /* 保存できない環境ではこのページを開いている間だけ保持 */
    }
  };
  let solves = load(KEY, []);
  const opts = Object.assign({ inspection: true }, load(OPT_KEY, {}));

  // ---------------- スクランブル ----------------
  // ランダムな20手（同じ面の連続、同じ軸の3連続を避ける）。公式大会はランダム状態方式。
  const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
  const AXIS = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
  function makeScramble(n = 20) {
    const out = [];
    while (out.length < n) {
      const f = FACES[Math.floor(Math.random() * 6)];
      const a = out[out.length - 1];
      const b = out[out.length - 2];
      if (a && a[0] === f) continue;
      if (a && b && AXIS[a[0]] === AXIS[f] && AXIS[b[0]] === AXIS[f]) continue;
      out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)]);
    }
    return out.join(' ');
  }

  const ui = CubePlayer.createPlayer($('#scramble-player'));
  ui.root.classList.add('compact');
  let scramble = '';
  function newScramble() {
    scramble = makeScramble();
    $('#scramble').textContent = scramble;
    // WCA の持ち方（白上・緑前）で表示するため、先に z2 で持ち替える
    ui.load({ alg: '', setup: 'z2 ' + scramble, stickering: 'full', title: '' });
  }

  // ---------------- 時間の表示と統計 ----------------
  const fmt = (ms) => {
    if (ms == null) return '—';
    if (ms === Infinity) return 'DNF';
    const s = ms / 1000;
    if (s < 60) return s.toFixed(2);
    return Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0');
  };
  const value = (sv) => (sv.pen === 'DNF' ? Infinity : sv.t + (sv.pen === '+2' ? 2000 : 0));

  // WCA 方式の平均: 最良・最悪を除いて平均（DNF が2つ以上なら DNF）
  function avg(n) {
    if (solves.length < n) return null;
    const v = solves.slice(-n).map(value).sort((a, b) => a - b);
    const cut = n === 5 ? 1 : Math.ceil(n * 0.05);
    const mid = v.slice(cut, n - cut);
    if (mid.some((x) => x === Infinity)) return Infinity;
    return mid.reduce((a, b) => a + b, 0) / mid.length;
  }

  function renderStats() {
    const vals = solves.map(value).filter((x) => x !== Infinity);
    const best = vals.length ? Math.min(...vals) : null;
    $('#stats').innerHTML = [
      ['ベスト', fmt(best)],
      ['Ao5', fmt(avg(5))],
      ['Ao12', fmt(avg(12))],
      ['回数', String(solves.length)],
    ].map(([k, v]) => `<div class="stat"><span class="label-medium on-variant">${k}</span><span class="stat-val mono">${v}</span></div>`).join('');
    $('#solves').innerHTML = solves.length
      ? solves.slice().reverse().map((sv, ri) => {
          const i = solves.length - 1 - ri;
          return `<tr><td class="on-variant">${i + 1}</td><td class="mono"><b>${fmt(value(sv))}</b>${sv.pen === '+2' ? ' <span class="on-variant">(+2)</span>' : ''}</td>
            <td><div class="chip-row">
              <button class="chip ${sv.pen === '+2' ? 'selected' : ''}" data-pen="+2" data-i="${i}">+2</button>
              <button class="chip ${sv.pen === 'DNF' ? 'selected' : ''}" data-pen="DNF" data-i="${i}">DNF</button>
              <button class="icon-btn" data-del="${i}" title="削除"><span class="material-symbols-rounded">delete</span></button>
            </div></td><td class="mono body-small on-variant scr-cell">${esc(sv.scr)}</td></tr>`;
        }).join('')
      : '<tr><td colspan="4" class="on-variant">まだ記録がありません。スペースキー（スマホは下の枠をタップ）で始めましょう。</td></tr>';
  }

  // ---------------- タイマー ----------------
  // 状態: idle → (inspect) → holding → ready → running → idle
  const T = { state: 'idle', start: 0, inspectStart: 0, holdStart: 0, raf: 0, penalty: '' };
  const pad = $('#timer');
  const disp = $('#time');
  const label = $('#timer-label');

  function setState(st) {
    T.state = st;
    pad.dataset.state = st;
    label.textContent = {
      idle: opts.inspection ? 'スペースキー（またはタップ）で観察開始' : 'スペースキーを押し続けて、離すとスタート',
      inspect: '観察中…押し続けて離すとスタート',
      holding: 'そのまま押し続けて…',
      ready: '離すとスタート',
      running: '何かキーを押すとストップ',
    }[st];
  }

  function tick() {
    const now = performance.now();
    if (T.state === 'running') disp.textContent = fmt(now - T.start);
    if (T.state === 'inspect' || ((T.state === 'holding' || T.state === 'ready') && T.inspectStart)) {
      const el = (now - T.inspectStart) / 1000;
      T.penalty = el > 17 ? 'DNF' : el > 15 ? '+2' : '';
      if (T.state === 'inspect') disp.textContent = el > 17 ? 'DNF' : el > 15 ? '+2' : String(Math.ceil(15 - el));
    }
    if (T.state !== 'idle') T.raf = requestAnimationFrame(tick);
  }

  function press() {
    if (T.state === 'running') {
      const t = performance.now() - T.start;
      solves.push({ t: Math.round(t), pen: T.penalty, scr: scramble, at: Date.now() });
      store(KEY, solves);
      disp.textContent = fmt(value(solves[solves.length - 1]));
      T.inspectStart = 0;
      setState('idle');
      renderStats();
      newScramble();
      return;
    }
    if (T.state === 'idle' && opts.inspection) {
      T.inspectStart = performance.now();
      T.penalty = '';
      setState('inspect');
      cancelAnimationFrame(T.raf);
      T.raf = requestAnimationFrame(tick);
      return;
    }
    if (T.state === 'idle' || T.state === 'inspect') {
      T.holdStart = performance.now();
      if (!opts.inspection) T.penalty = '';
      setState('holding');
      disp.textContent = '0.00';
      // 0.3秒押し続けたら準備完了（押し間違いでスタートしないように）
      clearTimeout(T.readyTimer);
      T.readyTimer = setTimeout(() => T.state === 'holding' && setState('ready'), 300);
      cancelAnimationFrame(T.raf);
      T.raf = requestAnimationFrame(tick);
    }
  }
  function release() {
    if (T.state === 'ready') {
      T.start = performance.now();
      setState('running');
    } else if (T.state === 'holding') {
      setState(T.inspectStart ? 'inspect' : 'idle');
      if (!T.inspectStart) disp.textContent = solves.length ? fmt(value(solves[solves.length - 1])) : '0.00';
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.repeat) return e.preventDefault();
    if (T.state === 'running' || e.code === 'Space') {
      e.preventDefault();
      press();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      release();
    }
  });
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    press();
  });
  pad.addEventListener('pointerup', release);

  // ---------------- 操作 ----------------
  document.addEventListener('click', (e) => {
    // ボタンにフォーカスが残るとスペースキーでボタンが押されてしまうので外す
    const btn = e.target.closest('button');
    if (btn) btn.blur();
    if (e.target.closest('#new-scramble')) newScramble();
    const ins = e.target.closest('#opt-inspection');
    if (ins) {
      opts.inspection = !opts.inspection;
      ins.classList.toggle('selected', opts.inspection);
      store(OPT_KEY, opts);
      setState('idle');
    }
    const pen = e.target.closest('[data-pen]');
    if (pen) {
      const sv = solves[+pen.dataset.i];
      sv.pen = sv.pen === pen.dataset.pen ? '' : pen.dataset.pen;
      store(KEY, solves);
      renderStats();
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      solves.splice(+del.dataset.del, 1);
      store(KEY, solves);
      renderStats();
    }
    if (e.target.closest('#clear-all') && confirm('記録をすべて削除しますか？')) {
      solves = [];
      store(KEY, solves);
      renderStats();
    }
  });

  // ---------------- 習得状況 ----------------
  function renderProgress() {
    $('#progress').innerHTML = METHODS.map((m) => {
      const p = Progress.summary(m);
      const pct = (n) => (p.total ? (n / p.total) * 100 : 0);
      return `<a class="card filled state progress-card" href="methods.html#${m.id}/0/0">
        <div class="meta-row"><span class="badge lv${m.level}">${m.levelName}</span><span class="title-medium">${esc(m.name)}</span></div>
        <div class="bar"><span class="bar-done" style="width:${pct(p.learned)}%"></span><span class="bar-learning" style="width:${pct(p.learning)}%"></span></div>
        <p class="body-small on-variant">習得 ${p.learned} ／ 練習中 ${p.learning} ／ 全 ${p.total} 手順</p></a>`;
    }).join('');
  }

  $('#opt-inspection').classList.toggle('selected', opts.inspection);
  setState('idle');
  newScramble();
  renderStats();
  renderProgress();
})();
