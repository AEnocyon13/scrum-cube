/*
 * player.js
 * Three.js による 3D キューブ描画（CubeViewer）と、
 * 手順の再生・一時停止・コマ送りを担う AlgPlayer、その操作 UI。
 * 依存: three.js r128（グローバル THREE）, cube-model.js（グローバル CubeModel）
 */
(function (global) {
  'use strict';
  const C = global.CubeModel;
  const GRAY = '#8b938a';
  const STICKER_SIZE = 0.84;

  function roundedSquare(size, r) {
    const s = size / 2;
    const sh = new THREE.Shape();
    sh.moveTo(-s + r, -s);
    sh.lineTo(s - r, -s);
    sh.quadraticCurveTo(s, -s, s, -s + r);
    sh.lineTo(s, s - r);
    sh.quadraticCurveTo(s, s, s - r, s);
    sh.lineTo(-s + r, s);
    sh.quadraticCurveTo(-s, s, -s, s - r);
    sh.lineTo(-s, -s + r);
    sh.quadraticCurveTo(-s, -s, -s + r, -s);
    return new THREE.ShapeGeometry(sh, 6);
  }

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // ====================================================================
  // CubeViewer: 状態をそのまま描画し、1 手ぶんの回転アニメーションを行う
  // ====================================================================
  class CubeViewer {
    constructor(host, opts = {}) {
      this.host = host;
      this.onPick = opts.onPick || null;
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
      host.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      this.view = { theta: 0.62, phi: 0.98, r: 13 };
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      const key = new THREE.DirectionalLight(0xffffff, 0.55);
      key.position.set(5, 9, 7);
      this.scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.25);
      fill.position.set(-6, -4, -5);
      this.scene.add(fill);

      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.cubies = new Map();
      this._build();

      this.stickerMode = () => 'c';
      this.selected = null;
      this.state = C.createSolved();
      this.anim = null;
      this.setState(this.state);

      this._bindPointer();
      this._resize();
      if (global.ResizeObserver) new ResizeObserver(() => this._resize()).observe(host);
      this._tick = this._tick.bind(this);
      requestAnimationFrame(this._tick);
    }

    _build() {
      const bodyGeo = new THREE.BoxGeometry(0.97, 0.97, 0.97);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x141218, roughness: 0.7 });
      const stGeo = roundedSquare(STICKER_SIZE, 0.13);
      const zAxis = new THREE.Vector3(0, 0, 1);
      for (const p of C.createSolved().pieces) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.userData.home = p.home;
        g.add(body);
        const stickers = [];
        for (const s of C.homeStickers(p.home)) {
          const mat = new THREE.MeshStandardMaterial({ color: C.FACE_COLORS[s.face], roughness: 0.42, metalness: 0 });
          const m = new THREE.Mesh(stGeo, mat);
          const n = new THREE.Vector3(...s.normal);
          m.position.copy(n.clone().multiplyScalar(0.487));
          m.quaternion.setFromUnitVectors(zAxis, n);
          m.userData.home = p.home;
          g.add(m);
          stickers.push({ mesh: m, face: s.face, normal: s.normal });
        }
        this.root.add(g);
        this.cubies.set(C.key(p.home), { group: g, home: p.home, stickers });
      }
    }

    _resize() {
      const w = this.host.clientWidth || 300;
      const h = this.host.clientHeight || 300;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      // 縦長の画面でもキューブが収まるように距離を調整
      this.view.r = w < h ? 13 * Math.max(1, (h / w) * 0.9) : 13;
      this.camera.updateProjectionMatrix();
    }

    // 'top' = 上面・前面・右面が見える標準視点 / 'bottom' = 下面が見える視点
    resetView(kind = this.viewKind || 'top') {
      this.viewKind = kind;
      this.view.theta = 0.62;
      this.view.phi = kind === 'bottom' ? 2.1 : 0.98;
    }

    _bindPointer() {
      const el = this.renderer.domElement;
      let down = null;
      el.addEventListener('pointerdown', (e) => {
        down = { x: e.clientX, y: e.clientY, t: this.view.theta, p: this.view.phi, moved: false };
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
        this.view.theta = down.t - dx * 0.009;
        this.view.phi = Math.min(Math.PI - 0.12, Math.max(0.12, down.p - dy * 0.009));
      });
      el.addEventListener('pointerup', (e) => {
        if (down && !down.moved) this._pick(e);
        down = null;
      });
      el.addEventListener('pointercancel', () => (down = null));
    }

    _pick(e) {
      if (!this.onPick) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(v, this.camera);
      const hit = ray.intersectObjects(this.root.children, true)[0];
      this.onPick(hit ? hit.object.userData.home : null);
    }

    // ---- 状態の描画 ----
    _placeCubie(cubie, piece, axis, angle) {
      const pos = new THREE.Vector3(...piece.pos);
      const basis = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(...piece.ori[0]), new THREE.Vector3(...piece.ori[1]), new THREE.Vector3(...piece.ori[2]));
      const q = new THREE.Quaternion().setFromRotationMatrix(basis);
      if (angle) {
        const ax = new THREE.Vector3(axis === 0 ? 1 : 0, axis === 1 ? 1 : 0, axis === 2 ? 1 : 0);
        pos.applyAxisAngle(ax, angle);
        q.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, angle));
      }
      cubie.group.position.copy(pos);
      cubie.group.quaternion.copy(q);
    }

    setState(st) {
      this.cancel();
      this.state = st;
      for (const p of st.pieces) this._placeCubie(this.cubies.get(C.key(p.home)), p, 0, 0);
    }

    // mode(home, face) が 'c'(色) / 'g'(灰) を返す
    setStickering(fn) {
      this.stickerMode = fn;
      this.refreshColors();
    }
    select(home) {
      this.selected = home;
      this.refreshColors();
    }
    refreshColors() {
      const col = new THREE.Color();
      for (const c of this.cubies.values()) {
        const isSel = this.selected && C.eq(this.selected, c.home);
        const dimOthers = this.selected && !isSel;
        for (const s of c.stickers) {
          const m = this.stickerMode(c.home, s.face);
          col.set(m === 'g' ? GRAY : C.FACE_COLORS[s.face]);
          if (dimOthers) col.lerp(new THREE.Color(0x2d322c), 0.7);
          s.mesh.material.color.copy(col);
          s.mesh.material.emissive.set(isSel ? 0x333333 : 0x000000);
        }
      }
    }

    // ---- アニメーション ----
    animate(move, duration, done) {
      this.cancel();
      const ids = this.state.pieces.filter((p) => move.layers.includes(p.pos[move.axis]));
      this.anim = { move, ids, start: performance.now(), duration, done, target: C.applyMove(this.state, move) };
    }
    get animating() {
      return !!this.anim;
    }
    cancel() {
      if (!this.anim) return;
      const a = this.anim;
      this.anim = null;
      this.state = a.target;
      for (const p of a.target.pieces) this._placeCubie(this.cubies.get(C.key(p.home)), p, 0, 0);
    }

    _tick(now) {
      requestAnimationFrame(this._tick);
      const a = this.anim;
      if (a) {
        const t = Math.min(1, (now - a.start) / a.duration);
        const angle = easeInOut(t) * a.move.q * (Math.PI / 2);
        for (const p of a.ids) this._placeCubie(this.cubies.get(C.key(p.home)), p, a.move.axis, angle);
        if (t >= 1) {
          this.cancel();
          if (a.done) a.done();
        }
      }
      const { theta, phi, r } = this.view;
      this.camera.position.set(r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.cos(theta));
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ====================================================================
  // ステッカー表示モード
  // ====================================================================
  const isCenter = (h) => C.pieceType(h) === 'center';
  const STICKERINGS = {
    full: { label: 'フルカラー', fn: () => () => 'c' },
    affected: {
      label: '変化するパーツだけ',
      fn: (ctx) => (h) => (isCenter(h) || ctx.changed.has(C.key(h)) ? 'c' : 'g'),
    },
    touched: {
      label: '途中で動くパーツ',
      fn: (ctx) => (h) => (isCenter(h) || ctx.touched.has(C.key(h)) ? 'c' : 'g'),
    },
    cross: { label: 'クロス', fn: () => (h) => (isCenter(h) || (h[1] === -1 && C.pieceType(h) === 'edge') ? 'c' : 'g') },
    layer1: { label: '1層目', fn: () => (h) => (isCenter(h) || h[1] === -1 ? 'c' : 'g') },
    f2l: { label: 'F2L', fn: () => (h) => (isCenter(h) || h[1] <= 0 ? 'c' : 'g') },
    f2lpair: {
      label: 'F2L（FRスロット）',
      fn: () => (h) => {
        if (isCenter(h)) return 'c';
        if (h[1] === -1 && C.pieceType(h) === 'edge') return 'c';
        if (h[0] === 1 && h[2] === 1 && h[1] <= 0) return 'c';
        return 'g';
      },
    },
    oll: { label: 'OLL（黄色だけ）', fn: () => (h, face) => (isCenter(h) || (h[1] === 1 && face === 'U') ? 'c' : 'g') },
    eoll: {
      label: '上面エッジの黄色',
      fn: () => (h, face) => (isCenter(h) || (h[1] === 1 && C.pieceType(h) === 'edge' && face === 'U') ? 'c' : 'g'),
    },
    ocll: {
      label: '上面コーナーの黄色',
      fn: () => (h, face) => (isCenter(h) || (h[1] === 1 && face === 'U') ? 'c' : 'g'),
    },
    pll: { label: 'PLL（上の層）', fn: () => (h) => (isCenter(h) || h[1] === 1 ? 'c' : 'g') },
    cll: { label: '上面コーナー', fn: () => (h) => (isCenter(h) || (h[1] === 1 && C.pieceType(h) === 'corner') ? 'c' : 'g') },
    ell: { label: '上面エッジ', fn: () => (h) => (isCenter(h) || (h[1] === 1 && C.pieceType(h) === 'edge') ? 'c' : 'g') },
    fb: { label: 'Roux 第1ブロック', fn: () => (h) => (isCenter(h) || (h[0] === -1 && h[1] <= 0) ? 'c' : 'g') },
    blocks: { label: 'Roux 両ブロック', fn: () => (h) => (isCenter(h) || (h[0] !== 0 && h[1] <= 0) ? 'c' : 'g') },
    cmll: {
      label: 'Roux CMLL',
      fn: () => (h) => (isCenter(h) || (h[0] !== 0 && h[1] <= 0) || (h[1] === 1 && C.pieceType(h) === 'corner') ? 'c' : 'g'),
    },
    lse: { label: 'Roux LSE（M列＋UL/UR）', fn: () => (h) => (isCenter(h) || h[0] === 0 || (h[1] === 1 && C.pieceType(h) === 'edge') ? 'c' : 'g') },
    eo: { label: 'エッジだけ', fn: () => (h) => (isCenter(h) || C.pieceType(h) === 'edge' ? 'c' : 'g') },
    eoline: {
      label: 'EOLine',
      fn: () => (h) => (isCenter(h) || (h[0] === 0 && h[1] === -1) ? 'c' : C.pieceType(h) === 'edge' ? 'c' : 'g'),
    },
  };

  // ====================================================================
  // AlgPlayer: 手順の状態列を持ち、再生・コマ送りを管理
  // ====================================================================
  class AlgPlayer {
    constructor(viewer) {
      this.viewer = viewer;
      this.moves = [];
      this.states = [C.createSolved()];
      this.index = 0;
      this.playing = false;
      this.speed = 1;
      this.loop = false;
      this.free = false;
      this.stickering = 'full';
      this.listeners = [];
      this._timer = null;
    }

    on(fn) {
      this.listeners.push(fn);
    }
    _emit() {
      for (const fn of this.listeners) fn(this);
    }

    // alg: 解く手順。setup を省略すると「alg の逆手順」で崩した状態から始まる
    load({ alg, setup, stickering, startAt }) {
      this._stop();
      this.moves = C.parseAlg(alg);
      const setupMoves = setup != null ? C.parseAlg(setup) : C.invertMoves(this.moves);
      this.states = [C.applyMoves(C.createSolved(), setupMoves)];
      for (const m of this.moves) this.states.push(C.applyMove(this.states[this.states.length - 1], m));
      const changed = new Set(C.analyzeEffect(this.moves).changed.map(C.key));
      this.ctx = { changed, touched: C.touchedPieces(this.states[0], this.moves) };
      this.free = false;
      this.viewer.resetView(['cross', 'layer1'].includes(stickering) ? 'bottom' : 'top');
      this.index = startAt === 'end' ? this.moves.length : 0;
      this.viewer.setState(this.states[this.index]);
      this.setStickering(stickering || this.stickering);
      this._emit();
    }

    setStickering(mode) {
      this.stickering = STICKERINGS[mode] ? mode : 'full';
      this.viewer.setStickering(STICKERINGS[this.stickering].fn(this.ctx || { changed: new Set(), touched: new Set() }));
      this._emit();
    }

    get duration() {
      return 380 / this.speed;
    }

    _stop() {
      clearTimeout(this._timer);
      this.playing = false;
      if (this.viewer.animating) this.viewer.cancel();
      // アニメーション途中で止めた場合は、表示中の状態と index を一致させる
      if (!this.free) this.viewer.setState(this.states[this.index]);
    }

    _leaveFree() {
      if (this.free) {
        this.free = false;
        this.viewer.setState(this.states[this.index]);
      }
    }

    play() {
      this._leaveFree();
      if (this.index >= this.moves.length) this.jump(0);
      this.playing = true;
      this._emit();
      this._advance();
    }
    pause() {
      this._stop();
      this._emit();
    }
    toggle() {
      this.playing ? this.pause() : this.play();
    }

    _advance() {
      if (!this.playing) return;
      if (this.index >= this.moves.length) {
        if (this.loop) {
          this._timer = setTimeout(() => {
            this.jump(0, true);
            this._timer = setTimeout(() => this._advance(), 500);
          }, 900);
        } else {
          this.playing = false;
          this._emit();
        }
        return;
      }
      const i = this.index;
      this.viewer.animate(this.moves[i], this.duration, () => {
        this.index = i + 1;
        this._emit();
        this._timer = setTimeout(() => this._advance(), 60 / this.speed);
      });
      this._emit();
    }

    next() {
      this._stop();
      this._leaveFree();
      if (this.index >= this.moves.length) return this._emit();
      const i = this.index;
      this.viewer.animate(this.moves[i], this.duration, () => {
        this.index = i + 1;
        this._emit();
      });
      this.index = i + 1; // 連打しても破綻しないよう先に進める
      this._emit();
    }
    prev() {
      this._stop();
      this._leaveFree();
      if (this.index <= 0) return this._emit();
      const i = this.index - 1;
      this.viewer.animate(C.invertMove(this.moves[i]), this.duration, () => this._emit());
      this.index = i;
      this._emit();
    }
    jump(i, keepPlaying) {
      if (!keepPlaying) this._stop();
      else if (this.viewer.animating) this.viewer.cancel();
      this.free = false;
      this.index = Math.max(0, Math.min(this.moves.length, i));
      this.viewer.setState(this.states[this.index]);
      this._emit();
    }

    // 自分で回す（手順とは独立に状態を動かす）
    userMove(token) {
      const mv = C.parseAlg(token)[0];
      if (!mv) return;
      if (!this.free) {
        this._stop();
        this.free = true;
      } else if (this.viewer.animating) this.viewer.cancel();
      this.viewer.animate(mv, 220, () => this._emit());
      this._emit();
    }
    resetFree() {
      this._leaveFree();
      this._emit();
    }
  }

  // ====================================================================
  // UI（Material 3 のコンポーネント構成）
  // ====================================================================
  const icon = (name) => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const PAD_MOVES = ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'", 'M', "M'", 'x', 'y'];
  const KEY_MAP = { u: 'U', d: 'D', r: 'R', l: 'L', f: 'F', b: 'B', m: 'M', e: 'E', s: 'S', x: 'x', y: 'y', z: 'z' };

  function createPlayer(host, opts = {}) {
    const root = el(`
      <div class="player">
        <div class="player-stage">
          <div class="player-canvas"></div>
          <div class="player-top">
            <span class="player-title label-large"></span>
            <button class="icon-btn" data-act="view" title="視点をリセット">${icon('3d_rotation')}</button>
          </div>
          <div class="player-hint body-small">ドラッグで視点を回転・パーツをタップで追跡</div>
          <div class="player-now">
            <span class="player-now-move"></span>
            <span class="player-now-desc body-medium"></span>
          </div>
        </div>
        <div class="player-moves" role="list"></div>
        <div class="player-progress"><div class="player-progress-bar"></div></div>
        <div class="player-controls">
          <button class="icon-btn" data-act="start" title="最初へ">${icon('first_page')}</button>
          <button class="icon-btn tonal" data-act="prev" title="1手戻る">${icon('chevron_left')}</button>
          <button class="fab-btn" data-act="play" title="再生 / 一時停止">${icon('play_arrow')}</button>
          <button class="icon-btn tonal" data-act="next" title="1手進む">${icon('chevron_right')}</button>
          <button class="icon-btn" data-act="end" title="最後へ">${icon('last_page')}</button>
        </div>
        <div class="player-options">
          <label class="field">
            <span class="label-medium">速度 <b class="speed-val">1.0x</b></span>
            <input type="range" class="slider" min="0.2" max="3" step="0.1" value="1" data-act="speed">
          </label>
          <label class="field">
            <span class="label-medium">色の表示</span>
            <select class="select" data-act="sticker"></select>
          </label>
          <div class="chip-row">
            <button class="chip filter" data-act="loop">${icon('repeat')}<span>ループ</span></button>
            <button class="chip filter" data-act="pad">${icon('back_hand')}<span>自分で回す</span></button>
          </div>
        </div>
        <div class="player-pad" hidden>
          <p class="body-small pad-help">ボタンか、キーボード（U D R L F B M x y・Shiftで逆回転）でも回せます。</p>
          <div class="pad-grid"></div>
          <button class="btn text" data-act="reset">${icon('restart_alt')}<span>手順の状態に戻す</span></button>
        </div>
      </div>`);
    host.appendChild(root);

    const $ = (s) => root.querySelector(s);
    const viewer = new CubeViewer($('.player-canvas'), { onPick: (h) => opts.onPick && opts.onPick(h) });
    const player = new AlgPlayer(viewer);
    if (opts.stickerOptions !== false) {
      const sel = $('[data-act="sticker"]');
      for (const [k, v] of Object.entries(STICKERINGS)) sel.appendChild(el(`<option value="${k}">${v.label}</option>`));
    }

    const pad = $('.pad-grid');
    for (const m of PAD_MOVES) {
      const b = el(`<button class="btn tonal mono">${m}</button>`);
      b.addEventListener('click', () => player.userMove(m));
      pad.appendChild(b);
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
      const act = b.dataset.act;
      if (act === 'play') player.toggle();
      if (act === 'next') player.next();
      if (act === 'prev') player.prev();
      if (act === 'start') player.jump(0);
      if (act === 'end') player.jump(player.moves.length);
      if (act === 'view') viewer.resetView();
      if (act === 'reset') player.resetFree();
      if (act === 'loop') {
        player.loop = !player.loop;
        b.classList.toggle('selected', player.loop);
      }
      if (act === 'pad') {
        const p = $('.player-pad');
        p.hidden = !p.hidden;
        b.classList.toggle('selected', !p.hidden);
      }
      if (act === 'jump') player.jump(parseInt(b.dataset.i, 10));
    });
    $('[data-act="speed"]').addEventListener('input', (e) => {
      player.speed = parseFloat(e.target.value);
      $('.speed-val').textContent = player.speed.toFixed(1) + 'x';
    });
    $('[data-act="sticker"]').addEventListener('change', (e) => player.setStickering(e.target.value));

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      const padOpen = !$('.player-pad').hidden;
      if (padOpen && KEY_MAP[e.key.toLowerCase()]) {
        player.userMove(KEY_MAP[e.key.toLowerCase()] + (e.shiftKey ? "'" : ''));
        e.preventDefault();
        return;
      }
      if (e.key === ' ') { player.toggle(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { player.next(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { player.prev(); e.preventDefault(); }
    });

    let lastMovesKey = null;
    player.on(() => {
      const movesKey = player.moves.map((m) => m.label).join(' ');
      const wrap = $('.player-moves');
      if (movesKey !== lastMovesKey) {
        lastMovesKey = movesKey;
        wrap.innerHTML = player.moves
          .map((m, i) => `<button class="move-token mono" role="listitem" data-act="jump" data-i="${i + 1}">${m.label}</button>`)
          .join('');
      }
      wrap.querySelectorAll('.move-token').forEach((t, i) => {
        t.classList.toggle('done', !player.free && i < player.index);
        t.classList.toggle('current', !player.free && i === player.index - 1);
      });
      const cur = wrap.querySelector('.current');
      // ページ全体はスクロールさせず、手順リストの中だけを追従させる
      if (cur && (cur.offsetTop < wrap.scrollTop || cur.offsetTop + cur.offsetHeight > wrap.scrollTop + wrap.clientHeight)) {
        wrap.scrollTop = cur.offsetTop - 4;
      }
      $('.player-progress-bar').style.width = player.moves.length ? (player.index / player.moves.length) * 100 + '%' : '0';
      $('[data-act="play"]').innerHTML = icon(player.playing ? 'pause' : 'play_arrow');
      $('[data-act="sticker"]').value = player.stickering;

      const nowMove = $('.player-now-move');
      const nowDesc = $('.player-now-desc');
      if (player.free) {
        nowMove.textContent = '自由回転';
        nowDesc.textContent = '「手順の状態に戻す」で解説に戻れます';
      } else if (player.index === 0) {
        nowMove.textContent = '開始';
        nowDesc.textContent = player.moves.length ? '次: ' + player.moves[0].label + ' — ' + C.describeMove(player.moves[0]) : '';
      } else {
        const m = player.moves[player.index - 1];
        nowMove.textContent = `${player.index}/${player.moves.length}  ${m.label}`;
        nowDesc.textContent = C.describeMove(m);
      }
    });

    return {
      player,
      viewer,
      root,
      load(cfg) {
        $('.player-title').textContent = cfg.title || '';
        player.load(cfg);
      },
    };
  }

  global.CubePlayer = { CubeViewer, AlgPlayer, createPlayer, STICKERINGS };
})(window);
