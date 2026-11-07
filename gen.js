// 出しすぎチェックの問題（架空の投稿）を作る（ブラウザと node の両方で使う）。
// 1つの投稿は「写真（場面と6つの物）」「文（3つのことば）」「投稿の情報（写真の位置情報など）」でできている。
// その中に、住所・学校・名前・予定などがばれる手がかり（leak）を決まった数だけまぜる。ほかは大丈夫なもの。
// 人・町・学校・店の名前はすべて作り話。乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。
// 同じ tag（"難しさ:場面|種"）なら、どの端末でも同じ投稿になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい", "上級"];

  // ---- 出典（遊び方・このゲームについて・手がかり帳に出す）----
  const SRC = {
    S1: { t: "総務省「投稿から個人が特定されたことによる被害」", u: "https://www.soumu.go.jp/use_the_internet_wisely/trouble/case/personal.html" },
    S2: { t: "総務省「気をつけてアップしてたはずなのに」（インターネットトラブル事例集）", u: "https://www.soumu.go.jp/use_the_internet_wisely/trouble/case/case17.html" },
    S3: { t: "京都府警察「SNS の使い方に気をつけよう」", u: "https://www.pref.kyoto.jp/fukei/anzen/seiki_h/cyber/documents/7sns.pdf" },
    S4: { t: "北九州市教育委員会「写真や動画の投稿から個人が特定される危険」", u: "https://www.city.kitakyushu.lg.jp/files/000997739.pdf" },
    S5: { t: "総務省「プライバシーの侵害とは？」", u: "https://www.soumu.go.jp/main_sosiki/cybersecurity/kokumin/basic/risk/12/" },
  };

  // ---- 作り話の名前（実在の人・店・学校をまねない）----
  const TOWNS = ["ひばり野", "みなと台", "さくら坂", "こもれび町", "あおぞら台", "ほしかげ町", "かざみ野", "しずく町", "つばめ台", "ゆうなぎ町"];
  const SURS = ["高野", "森", "川口", "青木", "小林", "中村", "石川", "大野", "林", "西田"];
  const GIVEN = ["ゆう", "あおい", "ひかる", "まこと", "かなた", "みずき", "はる", "るい"];
  const SHOPS = ["まるや", "ふじみ堂", "こむぎ亭", "ひだまり", "あさひ屋", "くるみ堂"];
  const SCHOOLS = ["小学校", "中学校", "高校"];

  // ---- ばれる手がかり：名前・何がばれるか（cat）・なぜ・どうする・出典・見落としやすい（sub）・どこに出るか（kind）----
  // why は40字以内、fix は30字以内（やさしい日本語。QA が見る）
  const LEAKS = {
    // 写真
    nameplate: { kind: "photo", sub: 0, cat: "名前と家", src: "S1", name: (t) => `表札「${t.sur}」`, why: "名字と家の見た目がわかり、家をさがす手がかりになる。", fix: "表札が写らない向きで撮る。" },
    addrplate: { kind: "photo", sub: 0, cat: "住所", src: "S1", name: (t) => `電柱の住所「${t.town}3-12」`, why: "町の名前と番地で、住んでいる所がほぼわかる。", fix: "電柱や看板の文字を写さない。" },
    stationsign: { kind: "photo", sub: 0, cat: "よく行く場所", src: "S4", name: (t) => `駅名の看板「${t.station}」`, why: "いつも使う駅がわかり、暮らしている所がしぼられる。", fix: "駅名の看板が入らないように撮る。" },
    busstop: { kind: "photo", sub: 0, cat: "家の近く", src: "S4", name: (t) => `バス停「${t.town}二丁目」`, why: "家の近くのバス停から、住んでいるあたりがわかる。", fix: "バス停の名前を写さない。" },
    schoolgate: { kind: "photo", sub: 0, cat: "学校", src: "S3", name: (t) => `校門の名前「${t.school}」`, why: "学校がわかると、帰り道を待ちぶせされるおそれがある。", fix: "校門や学校名を写さない。" },
    uniform: { kind: "photo", sub: 0, cat: "学校", src: "S1", name: () => "校章のついた制服", why: "制服や校章の形から、通っている学校がわかる。", fix: "制服や校章が写らないようにする。" },
    nametag: { kind: "photo", sub: 0, cat: "名前と学校", src: "S1", name: (t) => `名札「${t.g}年 ${t.sur}」`, why: "名前と学年が書いてあり、本人がわかってしまう。", fix: "名札は外すか、写さない。" },
    zekken: { kind: "photo", sub: 0, cat: "名前と学校", src: "S1", name: (t) => `体操服のゼッケン「${t.g}-${t.c} ${t.sur}」`, why: "名前とクラスが、そのまま読めてしまう。", fix: "名前の書いた服を写さない。" },
    parcel: { kind: "photo", sub: 0, cat: "住所と名前", src: "S5", name: () => "宅配便の伝票", why: "住所と名前と電話番号が、そのまま書いてある。", fix: "伝票ははがすか、写さない。" },
    letter: { kind: "photo", sub: 0, cat: "住所と名前", src: "S5", name: (t) => `封筒のあて名「${t.town} ${t.sur}様」`, why: "あて名に、住所と名前が書いてある。", fix: "手紙や封筒を写さない。" },
    studentid: { kind: "photo", sub: 0, cat: "名前と学校", src: "S5", name: (t) => `学生証「${t.school}」`, why: "学校と名前と顔写真が、1まいでわかってしまう。", fix: "カードや身分証を写さない。" },
    carplate: { kind: "photo", sub: 0, cat: "家の近く", src: "S4", name: () => "車のナンバー", why: "ナンバーの地名や番号が、場所や人の手がかりになる。", fix: "ナンバーが写らないようにする。" },
    parksign: { kind: "photo", sub: 0, cat: "家の近く", src: "S4", name: (t) => `公園の名前「${t.town}公園」`, why: "近所の公園の名前で、住んでいる町がわかる。", fix: "看板の名前が入らないように撮る。" },
    landmark: { kind: "photo", sub: 1, cat: "家の場所", src: "S4", name: () => "窓の外の目立つ塔", why: "目立つ建物の見え方で、家のだいたいの場所や階がわかる。", fix: "窓の外の景色を写さない。" },
    manhole: { kind: "photo", sub: 1, cat: "住んでいる町", src: "S1", name: () => "町の絵がらのマンホール", why: "町ごとに絵がらがちがうことがあり、市や町がわかる。", fix: "足もとの絵がらも見なおす。" },
    receipt: { kind: "photo", sub: 1, cat: "よく行く場所", src: "S1", name: (t) => `レシート「${t.shop} ${t.town}店」`, why: "店の名前と時刻で、よく行く所と時間がわかる。", fix: "レシートは写さない。" },
    phonenote: { kind: "photo", sub: 1, cat: "名前と予定", src: "S1", name: (t) => `スマホの通知「${t.given}さん：あした${t.station}で」`, why: "画面の通知に、名前や会う予定が見えている。", fix: "画面の通知が写らないようにする。" },
    mirror: { kind: "photo", sub: 1, cat: "顔と部屋", src: "S1", name: () => "鏡に映った顔と部屋", why: "鏡や窓に、顔や部屋の中が映りこむことがある。", fix: "鏡やガラスの映りこみを見なおす。" },
    calendar: { kind: "photo", sub: 1, cat: "留守の予定", src: "S4", name: () => "「8日〜14日 旅行」のカレンダー", why: "家にだれもいない日がわかり、空き巣のおそれがある。", fix: "予定を書いた物を写さない。" },
    shopsign: { kind: "photo", sub: 1, cat: "家の近く", src: "S4", name: (t) => `店の看板「${t.shop} ${t.town}店」`, why: "店の名前と町の名前で、いる場所がわかる。", fix: "店の名前が入らないように撮る。" },
    // 文
    cls: { kind: "text", sub: 0, cat: "学校", src: "S4", name: (t) => `${t.g}年${t.c}組のみんなと`, why: "学年とクラスで、学校の中の本人までしぼられる。", fix: "学年やクラスは書かない。" },
    school: { kind: "text", sub: 0, cat: "学校", src: "S4", name: (t) => `${t.school}の運動会`, why: "学校の行事から、通っている学校がわかる。", fix: "学校名や行事の名前は書かない。" },
    trip: { kind: "text", sub: 0, cat: "留守の予定", src: "S4", name: () => "明日から1週間、家族で旅行", why: "家にだれもいない日がわかり、空き巣のおそれがある。", fix: "旅行の話は、帰ってから書く。" },
    now: { kind: "text", sub: 0, cat: "今いる場所", src: "S4", name: (t) => `いま${t.station}前のカフェ`, why: "今いる場所がわかると、会いに来られてしまう。", fix: "その場で書かず、帰ってから書く。" },
    meet: { kind: "text", sub: 0, cat: "予定", src: "S4", name: (t) => `3時に${t.station}で待ち合わせ`, why: "いつ、どこにいるかが前もってわかってしまう。", fix: "会う場所と時間は書かない。" },
    fullname: { kind: "text", sub: 0, cat: "名前", src: "S5", name: (t) => `${t.sur}${t.given}です`, why: "本名は、学校や住所と結びつけられる手がかり。", fix: "本名は書かない。" },
    phone: { kind: "text", sub: 0, cat: "連絡先", src: "S5", name: () => "連絡は090-0000-0000まで", why: "電話番号は、知らない人からの連絡や悪用につながる。", fix: "電話番号は書かない。" },
    routine: { kind: "text", sub: 1, cat: "毎日の行動", src: "S1", name: () => "毎朝7時半に家を出る", why: "毎日の時間がわかると、待ちぶせされやすい。", fix: "毎日の時間は書かない。" },
    near: { kind: "text", sub: 1, cat: "家の近く", src: "S1", name: () => "家から歩いて3分の公園", why: "写真とあわせると、家の場所までしぼられる。", fix: "家からの近さは書かない。" },
    alone: { kind: "text", sub: 1, cat: "留守の予定", src: "S4", name: () => "今夜は家にひとり", why: "ひとりでいる時間がわかると、ねらわれやすい。", fix: "ひとりの時間は書かない。" },
    birthday: { kind: "text", sub: 1, cat: "本人の情報", src: "S3", name: () => "誕生日は5月3日", why: "名前とあわせると、なりすましの手がかりになる。", fix: "誕生日は友だちにだけ伝える。" },
    // 投稿の情報
    gps: { kind: "meta", sub: 0, cat: "位置情報", src: "S4", name: () => "写真の位置情報：オン", why: "写真に撮った場所が記録され、家の場所がわかることがある。", fix: "カメラの位置情報をオフにする。" },
    pin: { kind: "meta", sub: 0, cat: "今いる場所", src: "S3", name: (t) => `場所：${t.town}`, why: "投稿に場所をつけると、いる町がそのまま伝わる。", fix: "投稿に場所をつけない。" },
  };
  const LEAK_IDS = Object.keys(LEAKS);
  // 大丈夫なもの（押すとまちがいに数える。なぜ大丈夫かを一言出す）
  const SAFE = {
    cat: "ネコ", cake: "ケーキ", mug: "無地のマグカップ", book: "本", plant: "植木ばち", flower: "花", cloud: "雲と空", tree: "木", ball: "ボール", plush: "ぬいぐるみ",
    poster: "星空のポスター", clock: "かべ時計", bird: "鳥", moon: "月", umbrella: "かさ",
  };
  const SAFE_TEXT = { sky: "今日はいい天気", cakeok: "ケーキがおいしかった", sunset: "夕焼けがきれい", read: "本を読み終えた", did: "よくがんばった！", catok: "ネコがかわいい", rain: "雨が上がった", relax: "ちょっと休けい", night: "おやすみなさい", fun: "楽しかった" };
  const GPS_OFF = "写真の位置情報：オフ";
  const safeWhy = (name) => `${name}だけでは、どこのだれかはわからない。`;

  // ---- 場面：背景と、物を置く6つの場所（x・y・幅・高さは％）。置ける物は場所ごとに決める ----
  const SCENES = {
    room: { name: "自分の部屋", slots: [
      { x: 3, y: 5, w: 33, h: 40, can: ["landmark", "stationsign", "shopsign", "cloud", "bird", "moon"] },
      { x: 40, y: 5, w: 26, h: 40, can: ["uniform", "zekken", "mirror", "calendar", "poster", "clock"] },
      { x: 70, y: 5, w: 27, h: 40, can: ["uniform", "zekken", "mirror", "calendar", "poster", "clock"] },
      { x: 3, y: 56, w: 30, h: 38, can: ["nametag", "parcel", "letter", "studentid", "receipt", "phonenote", "cake", "mug", "book", "plant", "plush"] },
      { x: 35, y: 56, w: 30, h: 38, can: ["nametag", "parcel", "letter", "studentid", "receipt", "phonenote", "cake", "mug", "book", "plant", "plush"] },
      { x: 67, y: 56, w: 30, h: 38, can: ["nametag", "parcel", "letter", "studentid", "receipt", "phonenote", "cake", "mug", "book", "plant", "plush"] } ] },
    front: { name: "家の前", slots: [
      { x: 3, y: 4, w: 28, h: 34, can: ["landmark", "cloud", "bird", "moon"] },
      { x: 35, y: 20, w: 28, h: 34, can: ["nameplate", "parcel", "flower", "plant"] },
      { x: 70, y: 4, w: 27, h: 52, can: ["addrplate", "busstop", "tree"] },
      { x: 3, y: 62, w: 30, h: 34, can: ["carplate", "manhole", "cat", "ball", "flower", "umbrella"] },
      { x: 35, y: 62, w: 30, h: 34, can: ["carplate", "manhole", "cat", "ball", "flower", "umbrella"] },
      { x: 67, y: 62, w: 30, h: 34, can: ["carplate", "manhole", "cat", "ball", "flower", "umbrella"] } ] },
    station: { name: "駅のホーム", slots: [
      { x: 3, y: 4, w: 26, h: 32, can: ["landmark", "cloud", "bird", "moon"] },
      { x: 32, y: 4, w: 36, h: 32, can: ["stationsign", "shopsign", "poster"] },
      { x: 71, y: 4, w: 26, h: 32, can: ["landmark", "cloud", "bird", "moon"] },
      { x: 3, y: 54, w: 30, h: 40, can: ["nametag", "studentid", "receipt", "phonenote", "book", "mug", "plush", "umbrella"] },
      { x: 35, y: 54, w: 30, h: 40, can: ["nametag", "studentid", "receipt", "phonenote", "book", "mug", "plush", "umbrella"] },
      { x: 67, y: 54, w: 30, h: 40, can: ["manhole", "cat", "umbrella", "ball"] } ] },
    cafe: { name: "カフェ", slots: [
      { x: 3, y: 5, w: 44, h: 40, can: ["landmark", "busstop", "shopsign", "stationsign", "cloud", "bird", "tree"] },
      { x: 52, y: 5, w: 45, h: 40, can: ["mirror", "calendar", "poster", "clock"] },
      { x: 3, y: 56, w: 30, h: 38, can: ["receipt", "phonenote", "studentid", "nametag", "cake", "mug", "book", "plant"] },
      { x: 35, y: 56, w: 30, h: 38, can: ["receipt", "phonenote", "studentid", "nametag", "cake", "mug", "book", "plant"] },
      { x: 67, y: 56, w: 30, h: 38, can: ["receipt", "phonenote", "studentid", "nametag", "cake", "mug", "book", "plant"] } ] },
    park: { name: "近所の公園", slots: [
      { x: 3, y: 26, w: 28, h: 34, can: ["parksign", "poster"] },
      { x: 35, y: 4, w: 28, h: 32, can: ["landmark", "cloud", "bird", "moon"] },
      { x: 70, y: 4, w: 27, h: 54, can: ["addrplate", "busstop", "tree"] },
      { x: 3, y: 64, w: 30, h: 32, can: ["manhole", "carplate", "cat", "ball", "flower", "umbrella"] },
      { x: 35, y: 64, w: 30, h: 32, can: ["zekken", "cat", "ball", "flower", "plush"] },
      { x: 67, y: 64, w: 30, h: 32, can: ["manhole", "carplate", "cat", "ball", "flower", "umbrella"] } ] },
    school: { name: "学校の帰り道", slots: [
      { x: 3, y: 8, w: 36, h: 46, can: ["schoolgate", "tree"] },
      { x: 43, y: 4, w: 24, h: 30, can: ["landmark", "cloud", "bird", "moon"] },
      { x: 71, y: 4, w: 26, h: 52, can: ["addrplate", "busstop", "tree"] },
      { x: 3, y: 64, w: 30, h: 32, can: ["carplate", "manhole", "cat", "flower", "umbrella"] },
      { x: 35, y: 60, w: 30, h: 36, can: ["uniform", "zekken", "nametag", "ball", "umbrella", "plush"] },
      { x: 67, y: 64, w: 30, h: 32, can: ["carplate", "manhole", "cat", "flower", "umbrella"] } ] },
  };
  const SCENE_IDS = Object.keys(SCENES);
  // 難しさごとの手がかりの数・見落としやすい手がかりの数（最低）
  const SHAPE = [{ n: 2, sub: 0, maxSub: 0 }, { n: 3, sub: 0, maxSub: 1 }, { n: 3, sub: 1, maxSub: 2 }, { n: 4, sub: 2, maxSub: 3 }];

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1つの投稿を作る。tag は "難しさ:場面|種"（例 "1:room|2026-11-07:d2"）
  function make(tag) {
    const m = /^([0-3]):([a-z]+)\|(.+)$/.exec(String(tag));
    if (!m || !SCENES[m[2]]) return null;
    const lv = +m[1], sc = SCENES[m[2]], shp = SHAPE[lv], R = rng(seedOf(tag));
    const town = pick(R, TOWNS), t = { town, sur: pick(R, SURS), given: pick(R, GIVEN), shop: pick(R, SHOPS), g: ri(R, 1, 3), c: ri(R, 1, 4), school: pick(R, TOWNS) + pick(R, SCHOOLS), station: pick(R, TOWNS) + "駅" };
    for (let tries = 0; tries < 400; tries++) {
      // 手がかりの置き場所の数：文に0〜1（むずかしい・上級は0〜2）、投稿の情報に0〜1、残りは写真
      const nText = ri(R, 0, lv >= 2 ? 2 : 1), nMeta = R() < (lv === 0 ? 0.3 : 0.4) ? 1 : 0, nPhoto = shp.n - nText - nMeta;
      if (nPhoto < 1) continue;
      const slotOrder = pickN(R, sc.slots.map((_, i) => i), sc.slots.length);
      const used = new Set(), slots = sc.slots.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h, id: null, leak: false }));
      let ok = true, leakLeft = nPhoto;
      for (const i of slotOrder) {
        const can = sc.slots[i].can, leaks = can.filter((id) => LEAKS[id] && !used.has(id) && (lv > 0 || !LEAKS[id].sub)), safes = can.filter((id) => SAFE[id] && !used.has(id));
        let id;
        if (leakLeft > 0 && leaks.length) { id = pick(R, leaks); leakLeft--; } else if (safes.length) id = pick(R, safes); else { ok = false; break; }
        used.add(id); slots[i].id = id; slots[i].leak = !!LEAKS[id];
      }
      if (!ok || leakLeft > 0) continue;
      const tl = pickN(R, LEAK_IDS.filter((id) => LEAKS[id].kind === "text" && (lv > 0 || !LEAKS[id].sub)), nText);
      const ts = pickN(R, Object.keys(SAFE_TEXT), 3 - nText);
      const caps = pickN(R, [...tl, ...ts], 3).map((id) => ({ id, leak: !!LEAKS[id] }));
      const meta = [{ id: nMeta && R() < 0.5 ? "pin" : "gps" }];
      meta[0].leak = !!nMeta;
      if (!nMeta) meta[0].id = "gpsoff";
      const leakIds = [...slots.filter((s) => s.leak).map((s) => s.id), ...tl, ...(nMeta ? [meta[0].id] : [])];
      const nSub = leakIds.filter((id) => LEAKS[id].sub).length;
      if (leakIds.length !== shp.n || nSub < shp.sub || nSub > shp.maxSub) continue;
      const parts = [
        ...slots.map((s, i) => ({ uid: "s" + i, id: s.id, leak: s.leak, where: "photo", x: s.x, y: s.y, w: s.w, h: s.h })),
        ...caps.map((c, i) => ({ uid: "c" + i, id: c.id, leak: c.leak, where: "text" })),
        ...meta.map((c, i) => ({ uid: "m" + i, id: c.id, leak: c.leak, where: "meta" })),
      ];
      for (const p of parts) p.name = nameOf(p.id, t);
      const key = [m[2], ...slots.map((s) => s.id), ...caps.map((c) => c.id), meta[0].id].join(".");
      return { tag, lv, scene: m[2], sceneName: sc.name, t, parts, leaks: parts.filter((p) => p.leak).map((p) => p.uid), key };
    }
    return null;
  }
  function nameOf(id, t) { return LEAKS[id] ? LEAKS[id].name(t) : SAFE[id] || SAFE_TEXT[id] || (id === "gpsoff" ? GPS_OFF : id); }
  function okOf(id) { return id === "gpsoff" ? "位置情報がオフなら、写真に場所は残らない。" : SAFE_TEXT[id] ? "気持ちや感想だけなら、場所や人はわからない。" : safeWhy(SAFE[id] || id); }

  // 今日の5つ（やさしい2・ふつう2・むずかしい1）。場面は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), sc = pickN(R, SCENE_IDS, 5);
    return [0, 0, 1, 1, 2].map((lv, i) => `${lv}:${sc[i]}|${date}:d${i}`);
  }
  // 上級の3つ（手がかり4つ・見落としやすいもの2つ以上・ヒントなし）
  function hardTags(date) { const R = rng(seedOf("hard:" + date)), sc = pickN(R, SCENE_IDS, 3); return sc.map((s, i) => `3:${s}|${date}:h${i}`); }

  const DASHI = { LV, SRC, LEAKS, LEAK_IDS, SAFE, SAFE_TEXT, SCENES, SCENE_IDS, SHAPE, TOWNS, SURS, GIVEN, SHOPS, seedOf, rng, make, nameOf, okOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = DASHI; else root.DASHI = DASHI;
})(typeof self !== "undefined" ? self : this);
