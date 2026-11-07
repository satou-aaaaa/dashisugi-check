# AGENTS.md

出しすぎチェック：作り話の SNS の下書き（写真・文・投稿の情報）から、住所・学校・名前・予定がばれる手がかりを見つけて押す1日5投稿の学習ゲーム。`index.html` と `gen.js`（手がかり・場面・投稿の作り方）・`art.js`（絵）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

## push する前の確認

```bash
node qa/run.mjs   # 投稿の作り方（4つの難しさ×6場面×1500）・今日の5つと上級（3年分）・とことんの並び（300回）・通しで遊ぶ・続きから・上級・練習・とことん・手がかり帳・実績・カレンダー・あとから・古いタブ・スマホ幅・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 手がかり（`gen.js` の `LEAKS`）の「なぜ（why、40字以内）」「どうする（fix、30字以内）」は、公的な資料（`SRC`：総務省・京都府警察・北九州市教育委員会）で言われていることから書き、`src` に出典を付ける。新しい手がかりを足すときも、公的な資料で確かめてから足す（作り話で足さない）。法律・医療の相談にしない。
- 人・町・学校・店の名前・電話番号（090-0000-0000）はすべて作り話（`TOWNS`・`SURS`・`GIVEN`・`SHOPS`）。実在の会社・学校・ロゴをまねない。名前は性別に寄らないもの。人の顔は描かない（鏡・学生証は形だけ）。
- 投稿は `make("難しさ:場面|種")` が種から作る。手がかりの数は `SHAPE`（やさしい2・ふつう3・むずかしい3（見落としやすい☆を1つ以上）・上級4（☆2つ以上））。やさしいに☆を出さない。場面の各場所には手がかりと大丈夫な物の両方を置けるようにする（QA が見る）。
- 今日の5つ（やさしい2・ふつう2・むずかしい1、場面は重ねない）・上級（3つ・ヒントなし）は日本時間の日付の種（`dailyTags`・`hardTags`）で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ（QA が数を見る）。`LEAKS`・`SCENES`・名前の一覧・作り方を変えると過去の日の投稿も変わるので、変えた PR に一言書く。足すときは一覧の最後に足す。
- ★はまちがい（大丈夫な物を押す）＋ヒントの数（0で★3・2まで★2・3以上★1）。ヒントは2段（1回目は写真・文・投稿の情報ごとの残りの数、2回目は残りの1つを光らせる）。全部見つけると、手がかりをかくした投稿と直し方を出す。時間制限は付けない。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（2026-11-06 satou さん。寄付で成り立たせるため）。上級・とことん・練習は最初から遊べる。
- とことん（`runs.e`）：やさしい3→ふつう5→むずかしい12→上級30を毎回ちがう種で出し、残りが少なくなれば上級を20ずつ足す（`endlessList`・`moreList`）。1回の中で同じ投稿・続けて同じ場面を出さず、最近の150投稿（`recent`）も避ける。まちがえてもヒントを使っても続き、「ここで降りる」で終わる。自己ベスト `ebest` はまちがいなしで見ぬいた投稿の数。今日の記録・連続・Ko-fi・シェアには数えない（手がかり帳・チェックした投稿には入る）。
- 記録 `dashisugi-v1`：`days`・`hdays`・`adays`（あとから）・`dex`（手がかり帳）・`posts`・`recent`・`runs`（モードごとの途中経過 `d`・`h`・`p`・`e`・`a:日付`）・`ach`・`kofi`・`ebest`。`load` は両側を `fresh()` で補ってから合わせ、`tidy` で形を直す。押す前に、保存した進み具合がこの画面と同じ投稿か（`same`）確かめ、見つけた物・ヒントの数は別のタブの分より減らさない（`keep`。shared-workflows `incidents/2026-11-04-daily-game-save-gaps.md`）。
- 実績（`ACH`、13個）はいまの記録から毎回数える（新しく残すのは知らせ終えた印 `ach` だけ）。続けるは合計の日数（`playedDays`）。連続の日は1以上のときだけ出す。取りこぼした日（きのう〜7日前、`EPOCH` から）はカレンダーからあとから遊べ、連続・今日の記録・Ko-fi・シェアには数えない。
- 共有は遊ぶ人が押したときに開くリンク（X・LINE・Web Share・コピー）だけ。シェアの文に投稿の中身（答え）を出さない（🟢🔶🔺 だけ）。
- 感想は「感想を送る」から GitHub の Issue フォーム（`.github/ISSUE_TEMPLATE/feedback.yml`、name は「感想フォーム」）を開くだけ。名前・メールは聞かない。
- 応援は Ko-fi（https://ko-fi.com/satouaaaaa）へのただのリンクだけ。今日の5つ・上級を初めて全部まちがいなしで終えたときだけ、結果の画面の下に1行。遊ぶのは無料のまま。
- 外へ通信しない。外から読むのは Google Fonts の文字だけ（CSP の `connect-src 'self'` を広げない）。記録は遊ぶ人のブラウザ（localStorage）だけ。
- 見やすさ：`</head>` の前の見やすさの設定（`<!-- a11y:begin -->`〜`end`）は shared-workflows `template/a11y/a11y.html` の写し、`qa/a11y.mjs` も `template/qa/a11y.mjs` の写しで、ここでは直さない。色だけで分けない（手がかりは「✓ 手がかり」と実線、大丈夫は「○ 大丈夫」と点線、ヒントは破線の輪、直した所は「✓ かくした」「✓ 消した」と打ち消し線、取れない星は ☆）。知らせは `#msg`（role=status）。
- 引き継ぎ：`transfer.js` と `qa/transfer-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。`data-keys` は `dashisugi-v1`。記録の形を変えたら QA の `sample` も合わせる。
- 同じ日はどの端末でも同じ投稿にする：乱数は `sort` の比較の中で引かない（QA が見る）。少し遅れて動く処理（setTimeout）は、画面が替わっていたら何もしない。一行の式の途中にコメント `//` を足さない。
- 押せる所は44px以上（写真の中の物も・幅320px）。機能を足す・直すたびに `qa/run.mjs` に検査を足す。乱数で組む部分は何百回も作って確かめる（shared-workflows `incidents/2026-10-31-roppo-empty-village.md`）。
- PWA（`manifest.webmanifest`・`sw.js`・`icon-*.png`）：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、SNS 用の絵 `og.png` は `node tools/make-og.cjs`（今日の投稿を入れない）。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを待ち、手でマージする直前に今の head へのレビューを読み直す（shared-workflows `incidents/2026-11-01-roppo-merged-before-review.md`）。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
