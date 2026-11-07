/*
 * diagram.js — ケース認識用の図（SVG）
 *  top    : 最終層を真上から見た図（上面 3×3 ＋ 側面の帯）。OLL / PLL 用
 *  iso    : 上・前・右の3面を斜め上から見た図。F2L 用
 *  isoDown: 下・前・右の3面を斜め下から見た図。クロス用
 */
(function (global) {
  'use strict';
  const C = global.CubeModel;
  const GRAY = '#8b938a';
  const BODY = '#1b1f1b';

  function colorer(state, stick) {
    const map = C.stickerMap(state);
    return (pos, normal) => {
      const s = map.get(C.key(pos) + '|' + C.key(normal));
      if (!s) return GRAY;
      return stick(s.home, s.face) === 'g' ? GRAY : C.FACE_COLORS[s.face];
    };
  }

  const rect = (x, y, w, h, fill, r = 1.2) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

  function topView(col) {
    const cell = 10, strip = 3.6, gap = 1;
    const o = strip + gap; // 上面の開始位置
    let out = rect(o - 0.6, o - 0.6, cell * 3 + 1.2, cell * 3 + 1.2, BODY, 2);
    for (let x = -1; x <= 1; x++)
      for (let z = -1; z <= 1; z++) {
        out += rect(o + (x + 1) * cell + 0.6, o + (z + 1) * cell + 0.6, cell - 1.2, cell - 1.2, col([x, 1, z], [0, 1, 0]));
      }
    for (let i = -1; i <= 1; i++) {
      const p = o + (i + 1) * cell + 0.8;
      out += rect(p, 0, cell - 1.6, strip, col([i, 1, -1], [0, 0, -1]), 0.8); // 後
      out += rect(p, o + cell * 3 + gap, cell - 1.6, strip, col([i, 1, 1], [0, 0, 1]), 0.8); // 前
      out += rect(0, p, strip, cell - 1.6, col([-1, 1, i], [-1, 0, 0]), 0.8); // 左
      out += rect(o + cell * 3 + gap, p, strip, cell - 1.6, col([1, 1, i], [1, 0, 0]), 0.8); // 右
    }
    const size = o * 2 + cell * 3;
    return { body: out, view: `0 0 ${size} ${size}` };
  }

  // 等角投影。s = 1 で上から、-1 で下から
  function isoView(col, s) {
    const P = (x, y, z) => [(x - z) * 0.866, (x + z) * 0.5 * s - y];
    const faces = [
      { n: [0, s, 0], u: [1, 0, 0], v: [0, 0, 1] },
      { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
      { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    ];
    const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.map((c) => c.toFixed(2)).join(',')).join(' ')}" fill="${fill}" stroke="${fill === BODY ? BODY : 'none'}" stroke-linejoin="round"/>`;
    let out = '';
    for (const f of faces) {
      const c = f.n.map((k) => k * 1.5);
      const corner = (a, b) => P(c[0] + f.u[0] * a + f.v[0] * b, c[1] + f.u[1] * a + f.v[1] * b, c[2] + f.u[2] * a + f.v[2] * b);
      out += poly([corner(-1.5, -1.5), corner(1.5, -1.5), corner(1.5, 1.5), corner(-1.5, 1.5)], BODY);
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++) {
          const pos = [0, 1, 2].map((i) => f.n[i] + f.u[i] * a + f.v[i] * b);
          const k = 0.42;
          out += poly([corner(a - k, b - k), corner(a + k, b - k), corner(a + k, b + k), corner(a - k, b + k)], col(pos, f.n));
        }
    }
    return { body: out, view: '-2.75 -3.1 5.5 6.2' };
  }

  function svg(state, stick, kind = 'iso', size = 48) {
    const col = colorer(state, stick);
    const d = kind === 'top' ? topView(col) : isoView(col, kind === 'isoDown' ? -1 : 1);
    return `<svg class="case-svg" viewBox="${d.view}" width="${size}" height="${size}" aria-hidden="true">${d.body}</svg>`;
  }

  // ステッカー表示モードからふさわしい図の種類を選ぶ
  function kindFor(stick) {
    if (['oll', 'eoll', 'ocll', 'pll', 'cll', 'ell', 'cmll', 'lse'].includes(stick)) return 'top';
    if (['cross', 'layer1'].includes(stick)) return 'isoDown';
    return 'iso';
  }

  global.CaseDiagram = { svg, kindFor };
})(window);
