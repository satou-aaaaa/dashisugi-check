# 出しすぎチェック

投稿する前にチェック。作り話の SNS の下書きから、住所・学校・名前・予定がばれる手がかり（表札・電柱の住所・制服・「明日から旅行」の一言・写真の位置情報など）を見つけて押す、1日5投稿の学習ゲームです。

- 遊ぶ: <https://satou-aaaaa.github.io/dashisugi-check/>
- 時間制限なし。今日の5つ（だれでも同じ）・上級・練習・とことん（何度でも）・手がかり帳・実績・カレンダー。
- 出てくる人・町・学校・店はすべて作り話です。記録は遊ぶ人のブラウザ（localStorage）だけに置き、外へ送りません。

## 出典（手がかりの説明のもと）

- 総務省「投稿から個人が特定されたことによる被害」 <https://www.soumu.go.jp/use_the_internet_wisely/trouble/case/personal.html>
- 総務省「気をつけてアップしてたはずなのに」 <https://www.soumu.go.jp/use_the_internet_wisely/trouble/case/case17.html>
- 総務省「プライバシーの侵害とは？」 <https://www.soumu.go.jp/main_sosiki/cybersecurity/kokumin/basic/risk/12/>
- 京都府警察「SNS の使い方に気をつけよう」 <https://www.pref.kyoto.jp/fukei/anzen/seiki_h/cyber/documents/7sns.pdf>
- 北九州市教育委員会「写真や動画の投稿から個人が特定される危険」 <https://www.city.kitakyushu.lg.jp/files/000997739.pdf>

## 開発

```bash
bash scripts/setup.sh   # 最初に一度
node qa/run.mjs         # 検査（CI の QA と同じ）
```

決まりは [AGENTS.md](AGENTS.md)。
