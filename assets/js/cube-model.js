/*
 * cube-model.js
 * 3x3x3 キューブの「論理モデル」。描画とは独立して、
 * 各パーツの位置と向きを整数ベクトルで管理する。
 *
 * 座標系: x = 右(R) / y = 上(U) / z = 前(F)。各パーツは -1,0,1 の座標を持つ。
 * 向き(ori)は「元の x,y,z 軸がいまどちらを向いているか」の 3 本の列ベクトル。
 */
(function (global) {
  'use strict';

  // dir: 正の軸まわりの回転方向（右手系）。R はx軸まわりに -90°。
  const MOVE_DEFS = {
    R: { axis: 0, layers: [1], dir: -1 },
    L: { axis: 0, layers: [-1], dir: 1 },
    U: { axis: 1, layers: [1], dir: -1 },
    D: { axis: 1, layers: [-1], dir: 1 },
    F: { axis: 2, layers: [1], dir: -1 },
    B: { axis: 2, layers: [-1], dir: 1 },
    M: { axis: 0, layers: [0], dir: 1 },
    E: { axis: 1, layers: [0], dir: 1 },
    S: { axis: 2, layers: [0], dir: -1 },
    x: { axis: 0, layers: [-1, 0, 1], dir: -1 },
    y: { axis: 1, layers: [-1, 0, 1], dir: -1 },
    z: { axis: 2, layers: [-1, 0, 1], dir: -1 },
    r: { axis: 0, layers: [0, 1], dir: -1 },
    l: { axis: 0, layers: [-1, 0], dir: 1 },
    u: { axis: 1, layers: [0, 1], dir: -1 },
    d: { axis: 1, layers: [-1, 0], dir: 1 },
    f: { axis: 2, layers: [0, 1], dir: -1 },
    b: { axis: 2, layers: [-1, 0], dir: 1 },
  };

  // 面の色（黄色上・緑前の配色）
  const FACE_COLORS = {
    U: '#ffd500', D: '#f4f4f4', F: '#00a651', B: '#0b5cd5', R: '#ff6a00', L: '#d1102a',
  };
  const FACE_JA = { U: '上', D: '下', F: '前', B: '後', R: '右', L: '左' };
  const COLOR_JA = { U: '黄', D: '白', F: '緑', B: '青', R: 'オレンジ', L: '赤' };

  // ---- ベクトル演算 ----
  function rot90(v, axis) {
    const [x, y, z] = v;
    if (axis === 0) return [x, -z, y];
    if (axis === 1) return [z, y, -x];
    return [-y, x, z];
  }
  function rotate(v, axis, q) {
    let n = ((q % 4) + 4) % 4;
    let r = v;
    while (n--) r = rot90(r, axis);
    return r;
  }
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  const key = (v) => v.join(',');
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const scale = (v, s) => [v[0] * s, v[1] * s, v[2] * s];
  const IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  // ---- 手順のパース ----
  const TOKEN_RE = /([RLUDFBMESxyzrludfb])(w?)(\d*)('?)/g;

  function makeMove(base, amount) {
    const def = MOVE_DEFS[base];
    let a = ((amount % 4) + 4) % 4;
    if (a === 3) a = -1;
    if (a === 0) return null;
    return { base, amount: a, axis: def.axis, layers: def.layers, dir: def.dir, q: def.dir * a, label: moveLabel(base, a) };
  }

  function moveLabel(base, amount) {
    let b = base;
    if (/[rludfb]/.test(base)) b = base; // 小文字表記を採用（r = Rw）
    if (amount === 2 || amount === -2) return b + '2';
    if (amount === -1) return b + "'";
    return b;
  }

  function expandRepeats(str) {
    // "(R U R' U')×6" や "(R U R' U')*6" を展開
    let s = str;
    const re = /\(([^()]*)\)\s*[×*](\d+)/;
    let m;
    while ((m = s.match(re))) {
      s = s.replace(m[0], Array(parseInt(m[2], 10)).fill(m[1]).join(' '));
    }
    return s;
  }

  function parseAlg(str) {
    if (!str) return [];
    const s = expandRepeats(String(str).replace(/[’′`]/g, "'")).replace(/[()\[\]]/g, ' ');
    const out = [];
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(s))) {
      let base = m[1];
      if (m[2] === 'w') base = base.toLowerCase();
      let amount = m[3] ? parseInt(m[3], 10) : 1;
      if (m[4]) amount = -amount;
      const mv = makeMove(base, amount);
      if (mv) out.push(mv);
    }
    return out;
  }

  function invertMove(mv) {
    return makeMove(mv.base, -mv.amount);
  }
  function invertMoves(moves) {
    return moves.slice().reverse().map(invertMove);
  }
  function movesToString(moves) {
    return moves.map((m) => m.label).join(' ');
  }

  // ---- 状態 ----
  function createSolved() {
    const pieces = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (!x && !y && !z) continue;
          pieces.push({ home: [x, y, z], pos: [x, y, z], ori: IDENTITY.map((c) => c.slice()) });
        }
    return { pieces };
  }

  function cloneState(st) {
    return { pieces: st.pieces.map((p) => ({ home: p.home, pos: p.pos.slice(), ori: p.ori.map((c) => c.slice()) })) };
  }

  function applyMove(st, mv) {
    return {
      pieces: st.pieces.map((p) => {
        if (!mv.layers.includes(p.pos[mv.axis])) return p;
        return { home: p.home, pos: rotate(p.pos, mv.axis, mv.q), ori: p.ori.map((c) => rotate(c, mv.axis, mv.q)) };
      }),
    };
  }

  function applyMoves(st, moves) {
    return moves.reduce(applyMove, st);
  }

  function pieceType(v) {
    const n = (v[0] ? 1 : 0) + (v[1] ? 1 : 0) + (v[2] ? 1 : 0);
    return n === 3 ? 'corner' : n === 2 ? 'edge' : 'center';
  }

  function faceOfNormal(n) {
    if (n[0] === 1) return 'R';
    if (n[0] === -1) return 'L';
    if (n[1] === 1) return 'U';
    if (n[1] === -1) return 'D';
    if (n[2] === 1) return 'F';
    return 'B';
  }

  // 位置ベクトル → "UFR" のような名前（U/D → F/B → R/L の順）
  function posName(v) {
    let s = '';
    if (v[1]) s += v[1] > 0 ? 'U' : 'D';
    if (v[2]) s += v[2] > 0 ? 'F' : 'B';
    if (v[0]) s += v[0] > 0 ? 'R' : 'L';
    return s;
  }

  // パーツの元の位置に貼られたステッカー: [{normal, face}]
  function homeStickers(home) {
    const out = [];
    for (let a = 0; a < 3; a++) {
      if (!home[a]) continue;
      const n = [0, 0, 0];
      n[a] = home[a];
      out.push({ normal: n, face: faceOfNormal(n) });
    }
    return out;
  }

  // 元の法線 n のステッカーが、現在どちらを向いているか
  function currentNormal(piece, n) {
    for (let a = 0; a < 3; a++) if (n[a]) return scale(piece.ori[a], n[a]);
    return n;
  }

  function findPiece(st, home) {
    return st.pieces.find((p) => eq(p.home, home));
  }
  function pieceAt(st, pos) {
    return st.pieces.find((p) => eq(p.pos, pos));
  }

  // 持ち替え・スライスによるセンターのずれを打ち消して「相対的な状態」に揃える
  function normalize(st) {
    const cx = findPiece(st, [1, 0, 0]).pos;
    const cy = findPiece(st, [0, 1, 0]).pos;
    const cz = findPiece(st, [0, 0, 1]).pos;
    // R = [cx cy cz]（列）。R^T を適用
    const inv = (v) => [dot(cx, v), dot(cy, v), dot(cz, v)];
    return { pieces: st.pieces.map((p) => ({ home: p.home, pos: inv(p.pos), ori: p.ori.map(inv) })) };
  }

  function isOriIdentity(p) {
    return eq(p.ori[0], IDENTITY[0]) && eq(p.ori[1], IDENTITY[1]) && eq(p.ori[2], IDENTITY[2]);
  }

  // コーナーのねじれ: 0 = 正しい, 'cw' = 時計回り, 'ccw' = 反時計回り
  // 基準は U/D 色のステッカーが U/D 面を向いているか
  function cornerTwist(p) {
    const ud = [0, p.home[1], 0];
    const n = currentNormal(p, ud);
    if (n[1] !== 0) return 0;
    const posUD = [0, p.pos[1], 0];
    const c = dot(cross(posUD, n), p.pos);
    return c < 0 ? 'cw' : 'ccw';
  }

  // エッジの向き（ZZ / CFOP で使う F/B 基準の定義）
  function edgeFlipped(p) {
    const h = p.home;
    const prim = h[1] ? [0, h[1], 0] : [0, 0, h[2]];
    const n = currentNormal(p, prim);
    if (p.pos[1]) return n[1] === 0;
    return n[2] === 0;
  }

  // 解いた状態に手順を適用したときの「正味の効果」
  function analyzeEffect(moves) {
    const end = normalize(applyMoves(createSolved(), moves));
    const res = { corners: [], edges: [], cornerTwists: [], edgeFlips: [], changed: [] };
    const visited = new Set();
    for (const type of ['corner', 'edge']) {
      const list = end.pieces.filter((p) => pieceType(p.home) === type);
      for (const p of list) {
        const changed = !eq(p.pos, p.home) || !isOriIdentity(p);
        if (changed) res.changed.push(p.home);
        if (eq(p.pos, p.home)) {
          if (type === 'corner' && cornerTwist(p)) res.cornerTwists.push({ name: posName(p.home), dir: cornerTwist(p) });
          if (type === 'edge' && !isOriIdentity(p)) res.edgeFlips.push({ name: posName(p.home) });
          continue;
        }
        if (visited.has(key(p.home))) continue;
        // サイクル: h → p.pos → (そこにいたパーツの行き先) → ...
        const cycle = [];
        let cur = p;
        while (cur && !visited.has(key(cur.home))) {
          visited.add(key(cur.home));
          cycle.push({
            from: posName(cur.home),
            to: posName(cur.pos),
            oriented: type === 'corner' ? cornerTwist(cur) === 0 : !edgeFlipped(cur),
          });
          cur = list.find((q) => eq(q.home, cur.pos));
        }
        (type === 'corner' ? res.corners : res.edges).push(cycle);
      }
    }
    return res;
  }

  // 手順を何回繰り返すと元に戻るか
  function order(moves, limit = 1260) {
    if (!moves.length) return 1;
    let st = createSolved();
    for (let i = 1; i <= limit; i++) {
      st = applyMoves(st, moves);
      const n = normalize(st);
      if (n.pieces.every((p) => eq(p.pos, p.home) && (pieceType(p.home) === 'center' || isOriIdentity(p)))) return i;
    }
    return null;
  }

  // 1手ごとのパーツの軌跡
  function trace(startState, moves, home) {
    const steps = [];
    let st = startState;
    const rec = (mv) => {
      const p = findPiece(st, home);
      const info = { move: mv ? mv.label : null, pos: posName(p.pos), moved: false };
      if (pieceType(home) === 'corner') info.twist = cornerTwist(p);
      if (pieceType(home) === 'edge') info.flipped = edgeFlipped(p);
      info.stickers = homeStickers(home).map((s) => ({ face: s.face, facing: faceOfNormal(currentNormal(p, s.normal)) }));
      return info;
    };
    steps.push(rec(null));
    for (const mv of moves) {
      const before = findPiece(st, home).pos;
      st = applyMove(st, mv);
      const info = rec(mv);
      info.moved = !eq(before, findPiece(st, home).pos) || mv.layers.includes(before[mv.axis]);
      steps.push(info);
    }
    return steps;
  }

  // 手順中に一度でも動くパーツ
  function touchedPieces(startState, moves) {
    const set = new Set();
    let st = startState;
    for (const mv of moves) {
      for (const p of st.pieces) if (mv.layers.includes(p.pos[mv.axis])) set.add(key(p.home));
      st = applyMove(st, mv);
    }
    return set;
  }

  // 手の日本語説明
  const MOVE_JA = {
    R: ['右面', '前→上'], L: ['左面', '上→前'], U: ['上面', '前→左'], D: ['下面', '前→右'],
    F: ['前面', '上→右'], B: ['後面', '上→左'], M: ['M（中層・L と同じ向き）', '上→前'],
    E: ['E（中層・D と同じ向き）', '前→右'], S: ['S（中層・F と同じ向き）', '上→右'],
    x: ['キューブ全体（R の向きに持ち替え）', '前→上'], y: ['キューブ全体（U の向きに持ち替え）', '前→左'],
    z: ['キューブ全体（F の向きに持ち替え）', '上→右'],
    r: ['右2層（R＋M\'）', '前→上'], l: ['左2層（L＋M）', '上→前'], u: ['上2層', '前→左'],
    d: ['下2層', '前→右'], f: ['前2層', '上→右'], b: ['後2層', '上→左'],
  };
  function describeMove(mv) {
    const [name, arrow] = MOVE_JA[mv.base];
    const rev = arrow.split('→').reverse().join('→');
    if (mv.amount === 2 || mv.amount === -2) return `${name}を180°回す`;
    if (mv.amount === -1) return `${name}を反時計回りに90°（${rev}）`;
    return `${name}を時計回りに90°（${arrow}）`;
  }

  const api = {
    MOVE_DEFS, FACE_COLORS, FACE_JA, COLOR_JA,
    parseAlg, invertMove, invertMoves, movesToString, makeMove,
    createSolved, cloneState, applyMove, applyMoves, normalize,
    pieceType, posName, homeStickers, currentNormal, faceOfNormal, findPiece, pieceAt,
    cornerTwist, edgeFlipped, isOriIdentity, analyzeEffect, order, trace, touchedPieces,
    describeMove, key, eq,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CubeModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
