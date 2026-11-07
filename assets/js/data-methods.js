/*
 * data-methods.js — 解法ガイドの内容
 * 各手順 alg は「その手順で解ける状態」から再生される（逆手順でセットアップ）。
 * stick はステッカー表示モード（player.js の STICKERINGS）。
 */
(function (global) {
  'use strict';

  const METHODS = [
    // =================================================================
    {
      id: 'lbl',
      level: 1,
      levelName: '初級',
      name: 'LBL法（層ごと解法）',
      short: 'LBL',
      time: '目安 1〜2分',
      moves: '約100〜120手',
      summary:
        '下の層→真ん中の層→上の層と、1段ずつ揃える一番基本の解法。覚える手順は5つ程度。CFOPはこの考え方を「速く・少ない手数で」発展させたものです。',
      steps: [
        {
          name: '白クロス',
          goal: '白いエッジ4つを下面に揃え、側面の色をセンターと合わせる',
          html: `<p>最初は手順ではなく<strong>考えて揃える</strong>ステップ。白のエッジを1つずつ、側面の色が合う位置へ運びます。</p>
<p>コツは「エッジを上の層に持ってきて、合う色のセンターの上で <code>F2</code> などで下ろす」こと。慣れたら最初から下面に作り、8手以内を目指します。</p>`,
          algs: [
            { name: '上にあるエッジを下ろす', alg: 'F2', stick: 'cross', note: '上面にある白エッジを、色の合うセンターの上に合わせてから180°。' },
            { name: '横向きのエッジを入れる', alg: "F' R' D' ", setup: "D R F", stick: 'cross', note: '中層にあるエッジは、横の面を回して直接下ろせます。' },
            { name: '向きが逆のエッジを直す', alg: "F' D R' D'", stick: 'cross', note: '白が横を向いてしまったときの修正例。' },
          ],
        },
        {
          name: '1層目のコーナー',
          goal: '白のコーナーを入れて、1層目を完成',
          html: `<p>入れたいコーナーを、入れたい場所の真上（右前上 UFR）に持ってきて、<strong>セクシームーブ <code>R U R' U'</code> を白が下を向くまで繰り返します</strong>（最大5回）。</p>
<p>なぜ繰り返すだけで入るのか？ セクシームーブは「下段では右前下のコーナーにしか影響しない」から。他の完成部分を壊さずに、そのコーナーだけを少しずつねじって入れ替えています。詳しくは「テクニック解剖」で。</p>`,
          algs: [
            { name: '白が右を向いている', alg: "R U R' U'", stick: 'layer1', note: '1回で入る形。' },
            { name: '白が前を向いている', alg: "(R U R' U')×5", stick: 'layer1', note: '5回。慣れてきたら、F2Lの考え方でもっと短く入れられるようになります。' },
            { name: '白が上を向いている', alg: "(R U R' U')×3", stick: 'layer1', note: '3回で入る。' },
          ],
        },
        {
          name: '2層目のエッジ',
          goal: '真ん中の層のエッジ4つを入れる',
          html: `<p>キューブをひっくり返して白を下に。上の層にある「黄色を含まないエッジ」を、側面の色が合うように合わせてから右か左に入れます。</p>
<p>この手順は<strong>「逆セクシー + 左手版」</strong>の組み合わせ。前半の <code>U R U' R'</code> でコーナーごとエッジを取り出し、後半の <code>U' F' U F</code> でペアを戻しているのが分かると覚えやすくなります。</p>`,
          algs: [
            { name: '右に入れる', alg: "U R U' R' U' F' U F", stick: 'f2l', note: '前面の色を合わせて、エッジを右前へ。' },
            { name: '左に入れる', alg: "U' L' U L U F U' F'", stick: 'f2l', note: '左右反転版。' },
          ],
        },
        {
          name: '黄色クロス',
          goal: '上面に黄色の十字を作る（向きだけ）',
          html: `<p><code>F R U R' U' F'</code> は「F でフタをして、セクシームーブで中身を入れ替え、F' でフタを戻す」構造。点 → L字 → 線 → 十字 と進みます。</p>`,
          algs: [
            { name: '線（横一列）', alg: "F R U R' U' F'", stick: 'eoll', note: '線を横向きに持って1回。' },
            { name: 'L字', alg: "F R U R' U' F' F R U R' U' F'", stick: 'eoll', note: 'L字を左奥に置いて2回（または f R U R\' U\' f\' 1回）。' },
          ],
        },
        {
          name: '黄色の面',
          goal: '上面をすべて黄色にする',
          html: `<p>ここで<strong>スーン <code>R U R' U R U2 R'</code></strong> が登場。上面のコーナーを3つまとめてねじる手順です。魚の形（黄色コーナー1つ）を左前に置くと1回で完成します。</p>`,
          algs: [
            { name: 'スーン（魚形）', alg: "R U R' U R U2 R'", stick: 'oll', note: '黄色コーナーが1つ。それを左前に。' },
            { name: 'アンチスーン', alg: "R U2 R' U' R U' R'", stick: 'oll', note: 'スーンの逆。魚が逆向きのとき。' },
          ],
        },
        {
          name: 'コーナーの位置',
          goal: '上面コーナーを正しい位置へ',
          html: `<p>側面にヘッドライト（同じ色2つ）を探し、それを奥に置いて <strong>A perm</strong>。コーナー3つが回転します。</p>`,
          algs: [
            { name: 'Aa perm', alg: "x R' U R' D2 R U' R' D2 R2 x'", stick: 'pll', note: '奥の2つは固定で、残り3つを回す。' },
          ],
        },
        {
          name: 'エッジの位置',
          goal: '上面エッジを揃えて完成',
          html: `<p>1面揃っている側を奥にして <strong>U perm</strong>。3つのエッジを回転させます。向きに合わせて Ua / Ub を使い分け。</p>`,
          algs: [
            { name: 'Ua perm', alg: "R U' R U R U R U' R' U' R2", stick: 'pll', note: '時計回りの3点交換。' },
            { name: 'Ub perm', alg: "R2 U R U R' U' R' U' R' U R'", stick: 'pll', note: '反時計回り。' },
          ],
        },
      ],
    },

    // =================================================================
    {
      id: 'cfop2',
      level: 2,
      levelName: '中級',
      name: 'CFOP（2-Look）',
      short: '簡易CFOP',
      time: '目安 20〜40秒',
      moves: '約60〜70手',
      summary:
        '今あなたが使っている段階。クロス→F2L（2層同時）→OLLを2回→PLLを2回。覚える手順は約16個。ここで大事なのは手順の数より、F2Lを「考えて」解けるようになること。',
      steps: [
        {
          name: 'クロス（下面）',
          goal: '白クロスを下面に、8手以内で',
          html: `<p>LBLとの違いは<strong>最初から下面に作り、観察時間の15秒で全部計画すること</strong>。上面で作ってひっくり返す癖は早めに卒業しましょう。</p>`,
          algs: [
            { name: 'クロス例 1', alg: "D' R2 F' D", setup: "D' F R2 D", stick: 'cross', note: 'エッジ同士の相対位置を見て、まとめて入れる。' },
            { name: 'クロス例 2', alg: "F R' D' F2", stick: 'cross', note: 'Rで出して、Dでずらして、F2で戻す。' },
          ],
        },
        {
          name: 'F2L',
          goal: 'コーナーとエッジのペアを作って同時に入れる',
          html: `<p>F2Lの本質は<strong>「ペアを作る → 入れる」</strong>の2段階だけ。どのケースも、基本の挿入 <code>R U R'</code> / <code>R U' R'</code> に帰着します。</p>
<ul><li>空いているスロット（右前）を<strong>R で持ち上げ、U でペアをずらし、R' で戻す</strong>と、ペアが上で作れます。</li>
<li>入れたスロットの上を動かさないよう、<strong>U でペアを逃がしてから</strong>回すのが原則。</li></ul>`,
          algs: [
            { name: '基本挿入（右）', alg: "R U R'", stick: 'f2lpair', note: 'ペアが完成していて右上にある形。' },
            { name: '基本挿入（逆セクシー）', alg: "U R U' R'", stick: 'f2lpair', note: 'コーナーとエッジが離れた位置に並ぶ形。' },
            { name: '分かれたペアを作る', alg: "U' R U' R' U R U R'", stick: 'f2lpair', note: 'R U\' R\' で一度ペアを作り、U でずらして入れる。' },
            { name: '白が上を向いたコーナー', alg: "R U2 R' U' R U R'", stick: 'f2lpair', note: 'U2 で白を横向きに変えてから基本挿入。' },
            { name: 'スロットに両方入っている', alg: "R U' R' U R U2 R' U R U' R'", stick: 'f2lpair', note: '一度取り出してペアを作り直す。' },
          ],
        },
        {
          name: 'F2L ケース分類',
          goal: '「コーナーとエッジがどこにあるか」で6グループに分けて、考え方で解く',
          html: `<p>F2L は41ケースありますが、丸暗記は不要です。<strong>コーナーとエッジの場所（上の層か、スロットか）と、白の向き</strong>で6グループに分ければ、どのグループも「A の基本形に持ち込む」だけ。</p>
<p>リストの小さな図は<strong>上・前・右の3面を斜めから見た図</strong>です。灰色は今は気にしなくてよいパーツ。各ケースを再生して、ペアがどこで「できる」かを見てください。</p>
<p>ケース名の「白が前／右／上」は右前上（UFR）にあるコーナーの白の向き、「エッジが後ろ」などはエッジが上の層のどこにあるかを表します（「反転」はエッジの右面の色が上を向いている形）。</p>`,
          groups: {
            'A. すぐ入る基本形': `<code>R U R'</code>・<code>U R U' R'</code> とその前面版（<code>F' U' F</code>・<code>U' F' U F</code>）でそのまま入る形。他のグループは、すべてこの4つの形に持ち込んで終わります。`,
            'B. 上でペアを作る（白が横向き）': `コーナーとエッジがどちらも上の層にあり、白が横を向いている形。<strong>R で開けて U でエッジをずらし R' で閉じる</strong>とペアができる、またはA の形に移動できます。`,
            'C. 白が上を向いたコーナー': `白が真上を向いていると、そのままではペアにできません。<strong>U2 や R U2 R' で白を横向きに変えてから</strong> B か A の形にします。`,
            'D. エッジがスロットにある': `エッジだけスロットに入っている形。<strong>コーナーを上でエッジの位置に合わせてから</strong>取り出し、ペアにして入れ直します。`,
            'E. コーナーがスロットにある': `コーナーが下にある形。<strong>R U R' や R U' R' でコーナーを持ち上げて</strong>エッジとペアにします。白が下なら、エッジを入れるだけ（2層目エッジと同じ手順）。`,
            'F. 両方スロットに入っている（向きが違う）': `スロットの中で向きが間違っている形。<strong>一度ペアごと取り出して</strong>、A〜C のどれかに変えて入れ直します。`,
          },
          algs: [
            { group: 'A. すぐ入る基本形', name: '右から3手', alg: "R U R'", stick: 'f2lpair' },
            { group: 'A. すぐ入る基本形', name: '右から4手（逆セクシー）', alg: "U R U' R'", stick: 'f2lpair' },
            { group: 'A. すぐ入る基本形', name: '前から3手', alg: "F' U' F", stick: 'f2lpair' },
            { group: 'A. すぐ入る基本形', name: '前から4手', alg: "U' F' U F", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が前・エッジが後ろ', alg: "U' R U R' U2 R U' R'", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が右・エッジが左（反転）', alg: "U F' U' F U2 F' U F", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が前・エッジが左', alg: "U' R U2 R' U2 R U' R'", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が右・エッジが後ろ（反転）', alg: "U F' U2 F U2 F' U F", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が右・エッジが左', alg: "U' R U R' U R U R'", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が右・エッジが左（別解）', alg: "U F' U F U' R U R'", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が前・エッジが後ろ（反転）', alg: "U' R U' R' U F' U' F", stick: 'f2lpair' },
            { group: 'B. 上でペアを作る（白が横向き）', name: '白が前・エッジが後ろ（反転・別解）', alg: "U F' U' F U' F' U' F", stick: 'f2lpair' },
            { group: 'C. 白が上を向いたコーナー', name: 'エッジが右', alg: "R U2 R' U' R U R'", stick: 'f2lpair' },
            { group: 'C. 白が上を向いたコーナー', name: 'エッジが前', alg: "F' U2 F U F' U' F", stick: 'f2lpair' },
            { group: 'C. 白が上を向いたコーナー', name: 'エッジが後ろ', alg: "U R U2 R' U R U' R'", stick: 'f2lpair' },
            { group: 'C. 白が上を向いたコーナー', name: 'エッジが左（前から）', alg: "U' F' U2 F U' F' U F", stick: 'f2lpair' },
            { group: 'C. 白が上を向いたコーナー', name: 'エッジが左', alg: "U2 R U R' U R U' R'", stick: 'f2lpair' },
            { group: 'D. エッジがスロットにある', name: '白が前', alg: "U' R U' R' U2 R U' R'", stick: 'f2lpair' },
            { group: 'D. エッジがスロットにある', name: '白が上', alg: "R U R' U' R U R' U' R U R'", stick: 'f2lpair' },
            { group: 'E. コーナーがスロットにある', name: '白が右', alg: "R U R' U' R U R'", stick: 'f2lpair' },
            { group: 'E. コーナーがスロットにある', name: '白が前', alg: "R U' R' U R U' R'", stick: 'f2lpair' },
            { group: 'E. コーナーがスロットにある', name: '白が下・エッジが右', alg: "U' F' U F U R U' R'", stick: 'f2lpair' },
            { group: 'E. コーナーがスロットにある', name: '白が下・エッジが前', alg: "U R U' R' U' F' U F", stick: 'f2lpair' },
            { group: 'F. 両方スロットに入っている（向きが違う）', name: '白が右', alg: "R U' R' U R U2 R' U R U' R'", stick: 'f2lpair' },
            { group: 'F. 両方スロットに入っている（向きが違う）', name: '白が右（別解）', alg: "R U R' U2 R U' R' U R U R'", stick: 'f2lpair' },
            { group: 'F. 両方スロットに入っている（向きが違う）', name: '白が前', alg: "R U' R' U' R U R' U2 R U' R'", stick: 'f2lpair' },
            { group: 'F. 両方スロットに入っている（向きが違う）', name: 'エッジだけ反転', alg: "R2 U2 F R2 F' U2 R' U R'", stick: 'f2lpair' },
          ],
        },
        {
          name: 'OLL 1：エッジ',
          goal: '上面に黄色クロスを作る',
          html: `<p>LBLの黄色クロスと同じ。ただし L字は <code>f R U R' U' f'</code>（2層回し）で1回にすると速いです。</p>`,
          algs: [
            { name: '線', alg: "F R U R' U' F'", stick: 'eoll' },
            { name: 'L字', alg: "f R U R' U' f'", stick: 'eoll' },
            { name: '点', alg: "F R U R' U' F' f R U R' U' f'", stick: 'eoll' },
          ],
        },
        {
          name: 'OLL 2：コーナー',
          goal: '上面をすべて黄色に（7パターン）',
          html: `<p>7パターンのうち2つがスーン/アンチスーン。残りもスーンと同じ「<strong>R系の手でコーナーを持ち上げてねじる</strong>」動きが多いです。</p>`,
          algs: [
            { name: 'スーン', alg: "R U R' U R U2 R'", stick: 'oll' },
            { name: 'アンチスーン', alg: "R U2 R' U' R U' R'", stick: 'oll' },
            { name: 'H', alg: "R U R' U R U' R' U R U2 R'", stick: 'oll' },
            { name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R", stick: 'oll' },
            { name: 'ヘッドライト（U）', alg: "R2 D R' U2 R D' R' U2 R'", stick: 'oll' },
            { name: 'T', alg: "r U R' U' r' F R F'", stick: 'oll' },
            { name: '蝶ネクタイ（L）', alg: "F' r U R' U' r' F R", stick: 'oll' },
          ],
        },
        {
          name: 'PLL 1：コーナー',
          goal: 'コーナーの位置を揃える',
          html: `<p>ヘッドライトがあれば A perm（隣同士の交換）、なければ Y perm（対角の交換）。</p>`,
          algs: [
            { name: 'Aa perm（隣）', alg: "x R' U R' D2 R U' R' D2 R2 x'", stick: 'pll' },
            { name: 'Y perm（対角）', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", stick: 'pll' },
          ],
        },
        {
          name: 'PLL 2：エッジ',
          goal: 'エッジを揃えて完成',
          html: `<p>Ua / Ub / H / Z の4つ。H と Z は <code>M2</code> を多用するので、M列は薬指と人差し指で弾く練習を。</p>`,
          algs: [
            { name: 'Ua', alg: "R U' R U R U R U' R' U' R2", stick: 'pll' },
            { name: 'Ub', alg: "R2 U R U R' U' R' U' R' U R'", stick: 'pll' },
            { name: 'H', alg: "M2 U M2 U2 M2 U M2", stick: 'pll' },
            { name: 'Z', alg: "M' U M2 U M2 U M' U2 M2", stick: 'pll' },
          ],
        },
      ],
    },

    // =================================================================
    {
      id: 'cfop',
      level: 3,
      levelName: '上級',
      name: 'フルCFOP',
      short: 'CFOP',
      time: '目安 8〜15秒',
      moves: '約55手',
      summary:
        '世界のトップ選手の多くが使う解法。OLL 57個・PLL 21個を1回で決め、F2L中に次のペアを探す「先読み（ルックアヘッド）」で止まらずに回し続けます。10秒を目指すならまずここ。',
      steps: [
        {
          name: 'クロス＋先読み',
          goal: 'クロス中に最初のF2Lペアを見つける',
          html: `<p>上級者は観察で<strong>クロスと最初のペアの位置</strong>まで決めます。余裕があれば X-cross（クロスと同時に1ペア目を入れる）も。</p>`,
          algs: [
            { name: 'X-cross 例', alg: "R' F R D' L2 U' L' ", setup: "L U L2 D R' F' R", stick: 'f2l', note: 'クロスの手順の中にペア作りを混ぜる。' },
          ],
        },
        {
          name: 'F2L（上級テク）',
          goal: '持ち替えを減らし、奥のスロットも直接入れる',
          html: `<p>y持ち替えの代わりに <strong>奥のスロット用の手順</strong>や <code>d</code> 回し、そしてペアを壊さずに次のペアを準備する「マルチスロット」を使います。</p>`,
          algs: [
            { name: '右奥スロット', alg: "R' U' R", setup: "R' U R", stick: 'f2l', note: '持ち替えずに右奥に入れる。' },
            { name: 'スレッジハンマー挿入', alg: "R' F R F'", stick: 'f2lpair', note: '「向きだけ違う」形を一発で直す。' },
            { name: 'キーホール', alg: "U' R U R' d R' U' R", stick: 'f2l', note: '空きスロットを利用してエッジを入れる発想。' },
          ],
        },
        {
          name: 'OLL（57）',
          goal: '1回で上面を黄色に',
          html: `<p>2-Look OLL の手順は、すべてフルOLLにそのまま含まれます。まず<strong>エッジが十字になっている7個（OCLL）</strong>は習得済み。次はT/P/Fish系など、セクシー・スレッジハンマーの組み合わせで書けるものから覚えると効率的です。</p>`,
          algs: [
            { name: 'OLL 45（T形）', alg: "F R U R' U' F'", stick: 'oll' },
            { name: 'OLL 44（P形）', alg: "f R U R' U' f'", stick: 'oll' },
            { name: 'OLL 33（T 形）', alg: "R U R' U' R' F R F'", stick: 'oll', note: 'セクシー＋スレッジハンマー！' },
            { name: 'OLL 37（Fish）', alg: "F R' F' R U R U' R'", stick: 'oll', note: 'スレッジの逆＋セクシー。' },
            { name: 'OLL 21（H）', alg: "R U2 R' U' R U R' U' R U' R'", stick: 'oll' },
          ],
        },
        {
          name: 'PLL（21）',
          goal: '1回で完成',
          html: `<p>T perm・J perm など、<strong>セクシーとスレッジハンマーの組み合わせで出来ている</strong>ものが多いので、「固まり」で覚えると速く覚えられます。</p>`,
          algs: [
            { name: 'T perm', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", stick: 'pll', note: 'セクシー → スレッジ風 → 戻し。' },
            { name: 'Jb perm', alg: "R U R' F' R U R' U' R' F R2 U' R'", stick: 'pll' },
            { name: 'Ja perm', alg: "x R2 F R F' R U2 r' U r U2 x'", stick: 'pll' },
            { name: 'Ra perm', alg: "R U' R' U' R U R D R' U' R D' R' U2 R'", stick: 'pll' },
            { name: 'V perm', alg: "R' U R' U' y R' F' R2 U' R' U R' F R F y'", stick: 'pll' },
          ],
        },
      ],
    },

    // =================================================================
    {
      id: 'roux',
      level: 3,
      levelName: '上級',
      name: 'Roux法',
      short: 'Roux',
      time: '目安 8〜15秒',
      moves: '約45手',
      summary:
        '左右に1×2×3のブロックを作り、最後にM列と上面だけで解く。手数が少なく、持ち替えがほぼない。直感的なブロック作りと M 列の操作が鍵。',
      steps: [
        {
          name: '第1ブロック（FB）',
          goal: '左下に 1×2×3 のブロック',
          html: `<p>クロスのように<strong>直感で作る</strong>ステップ。左下の中心＋エッジ3つ＋コーナー2つを組み立てます。</p>`,
          algs: [
            { name: 'ペアを付けて完成', alg: "U' R' F' L' ", setup: "L F R U", stick: 'fb', note: 'M列とR面は自由に使ってOK。' },
          ],
        },
        {
          name: '第2ブロック（SB）',
          goal: '右下に 1×2×3 のブロック',
          html: `<p>左ブロックを壊さないよう、<strong>R・r・U・M</strong> だけで作ります。F2Lと似た「ペアを作って入れる」動き。</p>`,
          algs: [
            { name: 'ペアを入れる', alg: "R U R'", stick: 'blocks' },
            { name: 'r でエッジを運ぶ', alg: "r U' r' R U R'", stick: 'blocks', note: 'M列を使ってエッジを下ろしてからペアを入れる。' },
          ],
        },
        {
          name: 'CMLL',
          goal: '上面コーナー4つを向きも位置も揃える',
          html: `<p>M列が自由なので、<strong>OLL の手順の多くがそのまま使えます</strong>（例：スーン）。42ケース、2-Look なら約10手順。</p>`,
          algs: [
            { name: 'スーン（CMLL）', alg: "R U R' U R U2 R'", stick: 'cmll' },
            { name: 'H 系', alg: "F R U R' U' R U R' U' R U R' U' F'", stick: 'cmll' },
          ],
        },
        {
          name: 'LSE（残り6エッジ）',
          goal: 'M と U だけで最後の6エッジ',
          html: `<p>エッジの向きを揃える (EO) → UL/UR を入れる → M列を揃える の3段階。すべて <code>M</code> と <code>U</code> だけなので、慣れると目をつぶっても回せる速さになります。</p>`,
          algs: [
            { name: 'EO の基本形', alg: "M' U M U'", stick: 'lse', note: 'M\' で下ろし、U でずらし、M で戻す。最後の U\' はコーナー合わせ。' },
            { name: 'UL/UR を入れる', alg: "M2 U M2 U'", stick: 'lse', note: 'M2 で下ろして U でずらし、M2 で戻す。' },
            { name: 'M列の交換', alg: "M' U2 M U2", stick: 'lse', note: '上面の前後エッジを入れ替える基本形。' },
          ],
        },
      ],
    },

    // =================================================================
    {
      id: 'zz',
      level: 3,
      levelName: '上級',
      name: 'ZZ法',
      short: 'ZZ',
      time: '目安 9〜15秒',
      moves: '約55手',
      summary:
        '最初にエッジの向き（EO）を全部揃えると、その後は R・U・L だけで回せる。持ち替えゼロで、先読みしやすい。',
      steps: [
        {
          name: 'EOLine',
          goal: 'すべてのエッジの向きを揃え、下面に縦のライン',
          html: `<p>「悪いエッジ」は <code>F</code> か <code>B</code> を90°回したときだけ向きが変わります。悪いエッジを F 面に4つ集めて <code>F</code> 1回で直すのが基本。</p>`,
          algs: [
            { name: '4つ集めて F', alg: "F", stick: 'eo', note: 'F/F\' で4つのエッジの向きが同時に変わる。' },
            { name: 'EOLine 例', alg: "F' L' B D'", stick: 'eoline' },
          ],
        },
        {
          name: 'ZZF2L',
          goal: 'R・U・L だけで左右のブロック',
          html: `<p>EOが揃っているので、エッジは必ず「良い向き」で現れます。その分F2Lのケースが減り、<strong>R U だけで高速に回せる</strong>のが強み。</p>`,
          algs: [
            { name: 'R U だけで入れる', alg: "R U' R' U R U R'", stick: 'f2l' },
            { name: '左側', alg: "L' U L U' L' U' L", stick: 'f2l' },
          ],
        },
        {
          name: 'LL（COLL / ZBLL）',
          goal: '最終層。エッジは必ず十字',
          html: `<p>エッジの向きが揃っているので OLL はコーナーの7ケース（OCLL）だけ。上級者は ZBLL（493個）で最終層を1回で揃えます。</p>`,
          algs: [
            { name: 'スーン', alg: "R U R' U R U2 R'", stick: 'oll' },
            { name: 'T perm', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", stick: 'pll' },
          ],
        },
      ],
    },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = METHODS;
  else global.METHODS = METHODS;
})(typeof window !== 'undefined' ? window : globalThis);
