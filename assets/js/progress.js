/*
 * progress.js — 手順の習得状況（ブラウザの localStorage に保存）
 * 状態: '' = 未習得 / 'learning' = 練習中 / 'learned' = 習得
 */
(function (global) {
  'use strict';
  const KEY = 'scrum-cube-progress-v1';
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    data = {};
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* 保存できない環境では、このページを開いている間だけ保持 */
    }
  };
  const algId = (method, step, alg) => `${method.id}/${step.name}/${alg.name}`;

  global.Progress = {
    algId,
    get: (id) => data[id] || '',
    set(id, status) {
      if (status) data[id] = status;
      else delete data[id];
      save();
    },
    // 解法ごとの集計
    summary(method) {
      let total = 0, learning = 0, learned = 0;
      for (const s of method.steps)
        for (const a of s.algs) {
          total++;
          const st = data[algId(method, s, a)];
          if (st === 'learned') learned++;
          else if (st === 'learning') learning++;
        }
      return { total, learning, learned };
    },
    LABELS: { '': '未習得', learning: '練習中', learned: '習得' },
  };
})(window);
