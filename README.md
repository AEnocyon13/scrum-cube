# SCRUM CUBE

ルービックキューブの解法とテクニックを、3Dで1手ずつ分解して理解するための学習サイト。
デザインは [Material Design 3](https://m3.material.io/) に準拠（キューブの緑をシードにした配色、ライトテーマ）。

## ページ

| ページ | 内容 |
| --- | --- |
| `index.html` | トップ。10秒までのロードマップ、回転記号の一覧（タップで3D再生） |
| `methods.html` | 解法ガイド。LBL → 2-Look CFOP → フルCFOP / Roux / ZZ の各ステップと手順 |
| `techniques.html` | テクニック解剖。セクシー・逆セクシー・スレッジハンマー・スーンなどの1手ごとの動き、パーツ追跡表、正味の効果 |

## 3Dプレイヤーでできること

- 再生 / 一時停止 / 1手送り・戻し / 最初・最後へ、速度 0.2x〜3x、ループ
- 手順の記号をタップしてその手へジャンプ
- ドラッグで視点を回転、パーツをタップで強調（テクニック解剖では追跡表に追加）
- 色の表示モード：フルカラー / 変化するパーツだけ / 途中で動くパーツ / クロス / F2L / OLL / PLL / Roux 各段階 など
- 「自分で回す」：ボタンかキーボード（U D R L F B M x y、Shiftで逆回転）
- キーボード：Space で再生、← → でコマ送り

## 構成

```
assets/js/cube-model.js      キューブの論理モデル（位置・向き・手順の解析）。Node からも読み込み可
assets/js/player.js          Three.js の描画と再生コントロール UI
assets/js/data-methods.js    解法ガイドの内容
assets/js/data-techniques.js テクニック解剖の内容
assets/css/style.css         Material 3 のトークンとコンポーネント
```

ビルド不要の静的サイトです。Three.js (r128) は cdnjs から読み込みます。

## ローカルで開く

`index.html` をブラウザで直接開くか、任意の静的サーバーで配信してください。

```bash
python3 -m http.server 8000
```

## 手順を追加する

`data-methods.js` の `algs` に `{ name, alg, stick, note }` を追加するだけです。
3D は「`alg` の逆手順で崩した状態」から再生されるので、セットアップ手順を書く必要はありません（`setup` で上書き可）。

## GitHub Pages で公開

リポジトリの Settings → Pages で、ブランチのルート（`/`）を公開元に指定すれば動きます。
