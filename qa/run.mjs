// 出しすぎチェックの検査。投稿の作り方（4つの難しさ×6場面×1500投稿）・今日の5つと上級の組み方（3年分）・とことんの並び（何百回）・
// 通しで遊ぶ・大丈夫な物を押す・ヒント・続きから・上級・練習・とことん・手がかり帳・実績・カレンダー・あとから・古いタブ・
// 出典・スマホ幅・PWA・引き継ぎコード・見やすさを確かめる。
// 使い方: node qa/run.mjs   失敗があれば終了コード 1。結果は qa-report/report.md。
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkTransfer } from "./transfer-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: String(detail).slice(0, 400) });
const req = createRequire(import.meta.url);
const G = req(path.join(root, "gen.js")), ART = req(path.join(root, "art.js"));

// ---- 1. 投稿の作り方（ブラウザを使わない）----
{
  const bad = [], keys = [new Set(), new Set(), new Set(), new Set()], seenLeak = new Set(), N = 1500;
  for (let lv = 0; lv < 4; lv++) for (const sc of G.SCENE_IDS) for (let s = 0; s < N; s++) {
    const tag = `${lv}:${sc}|qa${s}`, P = G.make(tag), why = [];
    if (!P) { bad.push(tag + " 作れない"); continue; }
    const leaks = P.parts.filter((p) => p.leak), ids = P.parts.map((p) => p.id);
    if (leaks.length !== G.SHAPE[lv].n || P.leaks.length !== leaks.length) why.push(`手がかりが${leaks.length}つ`);
    const nSub = leaks.filter((p) => G.LEAKS[p.id].sub).length;
    if (nSub < G.SHAPE[lv].sub || nSub > G.SHAPE[lv].maxSub) why.push(`見落としやすいものが${nSub}つ`);
    if (lv === 0 && nSub) why.push("やさしいに見落としやすいもの");
    if (new Set(ids).size !== ids.length) why.push("同じ物が2つ");
    if (P.parts.some((p) => p.leak !== !!G.LEAKS[p.id] || !p.name || /undefined|NaN|null/.test(p.name))) why.push("名前・印がおかしい");
    const photos = P.parts.filter((p) => p.where === "photo");
    if (photos.length !== G.SCENES[sc].slots.length || photos.some((p, i) => !G.SCENES[sc].slots[i].can.includes(p.id))) why.push("場所に置けない物");
    if (photos.some((p) => !ART.item(p.id, P.t))) why.push("絵の無い物");
    if (P.parts.filter((p) => p.where === "text").length !== 3 || P.parts.filter((p) => p.where === "meta").length !== 1) why.push("文・投稿の情報の数");
    if (P.parts.some((p) => p.where !== "photo" && p.leak && G.LEAKS[p.id].kind !== p.where)) why.push("手がかりの出る所がちがう");
    if (JSON.stringify(G.make(tag)) !== JSON.stringify(P)) why.push("同じ種で同じ投稿にならない");
    leaks.forEach((p) => seenLeak.add(p.id));
    keys[lv].add(P.key);
    if (why.length && bad.length < 5) bad.push(tag + " " + why.join("・"));
  }
  check(`投稿：4つの難しさ×6場面×${N}で、手がかりの数・見落としやすいものの数・置き場所・絵がそろう`, bad.length === 0, bad.join(" / "));
  check(`手がかりの${G.LEAK_IDS.length}種類が全部どこかで出る（手がかり帳を全部集められる）`, G.LEAK_IDS.every((id) => seenLeak.has(id)), G.LEAK_IDS.filter((id) => !seenLeak.has(id)).join(","));
  check("投稿の組み合わせは難しさごとに300通りより多い（同じ投稿ばかりにならない）", keys.every((k) => k.size > 300), keys.map((k) => k.size).join(","));
  const longs = G.LEAK_IDS.filter((id) => [...G.LEAKS[id].why].length > 40 || [...G.LEAKS[id].fix].length > 30 || !G.SRC[G.LEAKS[id].src]);
  check("手がかりの説明は40字以内・直し方は30字以内・出典がある（やさしい日本語）", longs.length === 0, longs.join(","));
  check("場面のどの場所にも、手がかりと大丈夫な物の両方を置ける（大丈夫な物の無い場所は手がかりが決まってしまう）", G.SCENE_IDS.every((sc) => G.SCENES[sc].slots.every((s) => s.can.some((id) => G.SAFE[id]) && s.can.some((id) => G.LEAKS[id]))));
  check("作り話の名前だけを使う（電話番号は 0000 の並び）", (() => { const tels = ["gen.js", "art.js", "index.html"].flatMap((f) => readFileSync(path.join(root, f), "utf8").match(/\d{2,4}-\d{2,4}-\d{3,4}/g) || []); return tels.includes("090-0000-0000") && tels.every((t) => t === "090-0000-0000"); })());
}
{
  // 今日の5つ・上級の組み方（3年分）
  const bad = [], cover = new Set();
  const d0 = Date.parse("2026-11-07");
  for (let i = 0; i < 365 * 3; i++) {
    const d = new Date(d0 + i * 864e5).toISOString().slice(0, 10), dl = G.dailyTags(d), hl = G.hardTags(d);
    if (dl.length !== 5 || dl.map((t) => t[0]).join() !== "0,0,1,1,2" || new Set(dl.map((t) => t.split(/[:|]/)[1])).size !== 5 || dl.some((t) => !G.make(t))) bad.push(d + " 今日");
    if (hl.length !== 3 || hl.some((t) => t[0] !== "3" || !G.make(t)) || new Set(hl.map((t) => t.split(/[:|]/)[1])).size !== 3) bad.push(d + " 上級");
    if (JSON.stringify(dl) !== JSON.stringify(G.dailyTags(d))) bad.push(d + " 同じにならない");
    if (i < 30) [...dl, ...hl].forEach((t) => G.make(t).parts.filter((p) => p.leak).forEach((p) => cover.add(p.id)));
  }
  check("今日の5つ（やさしい2・ふつう2・むずかしい1、場面は重ねない）と上級（3つ）を3年分作れる", bad.length === 0, bad.slice(0, 5).join(","));
  check("ひと月のうちに、手がかりの種類が25以上出る", cover.size >= 25, cover.size + "種類");
}

// ---- 2. ファイルの中身 ----
const html = readFileSync(path.join(root, "index.html"), "utf8"), gen = readFileSync(path.join(root, "gen.js"), "utf8"), art = readFileSync(path.join(root, "art.js"), "utf8");
const ext = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.googleapis\.com(\/|$)|^https:\/\/ko-fi\.com\/satouaaaaa$|^https:\/\/(www\.ihaho\.jp|www\.gov-online\.go\.jp)\/$/.test(u));
check("外から読むのは文字（Google Fonts）だけ。スクリプト・広告・解析を入れない（出典のリンクは押したときに開くだけ）", ext.length === 0 && ![...html.matchAll(/<script[^>]+src="([^"]+)"/g)].some((m) => /^(https?:)?\/\//.test(m[1])), ext.join(","));
check("CSP で通信先を自分だけにしている", (html.match(/connect-src([^;"]*)/) || [])[1]?.trim() === "'self'");
check("Math.random は練習・とことんの種だけ（今日の5つ・上級は日付の乱数。gen.js・art.js には無い）", (html.match(/Math\.random/g) || []).length === 2 && !/Math\.random/.test(gen + art));
check("乱数は sort の比較の中で引かない（ブラウザで引く回数が変わる）", !/\.sort\(\s*\([^)]*\)\s*=>[^\n;]*\b(R|rng|rand|Math\.random)\s*\(/.test(html + gen));
check("一行の式の途中にコメント // を足さない（行の残りが消える。rosen-hitofude 2026-11-04）", !/;\s*\/\/[^\n]*;\s*\w/.test((gen + art).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n")));
check("画面にお笑いの言葉を入れない（本物っぽく）", !/お笑い|ギャグ|ツッコミ|なんでやねん|（うそ）/.test(html + gen));
check("チケット・回数制限・鍵で開くモードを入れない（好きなだけ遊べる）", !/🎫|チケット|すると開く|🔒/.test(html + gen));
check("出典：公的な資料のリンクが gen.js にあり、このゲームについてに出す", Object.values(G.SRC).every((S) => /^https:\/\/www\.(soumu\.go\.jp|pref\.kyoto\.jp|city\.kitakyushu\.lg\.jp)\//.test(S.u)) && /#9110/.test(html) && /違法・有害情報相談センター/.test(html));
check("画面の HTML に ${ が出ない書き方（'…' の中に ${ を書かない）", !/'[^'\n]*\$\{[^'\n]*'/.test(html.split("<script>").pop()));
check("引き継ぎ：transfer.js をゲームの script より前に、このゲームの記録のキーだけで読む", /<script src="transfer\.js" data-game="dashisugi-check" data-keys="dashisugi-v1"><\/script>\s*<\/head>/.test(html) && html.indexOf('src="transfer.js"') < html.indexOf('src="gen.js"') && /data-hk/.test(html) && existsSync(path.join(root, "transfer.js")));
{ const og = (k) => (html.match(new RegExp(`<meta (?:property|name)="${k}" content="([^"]+)"`)) || [])[1] || "";
  const png = readFileSync(path.join(root, "og.png"));
  check("SNS で貼ると絵と題が出る（OGP・1200×630・絶対URL）", og("og:title") && og("og:description") && og("og:image") === "https://satou-aaaaa.github.io/dashisugi-check/og.png" && og("twitter:card") === "summary_large_image" && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630); }
{ const fy = readFileSync(path.join(root, ".github/ISSUE_TEMPLATE/feedback.yml"), "utf8");
  check("感想フォームの name が3字以上（2字だとフォームが出ない。shared-workflows incidents/2026-11-05-feedback-form-not-shown.md）", [...((fy.match(/^name:\s*(.+)$/m) || [])[1] || "").trim()].length >= 3);
  check("感想フォームは名前・メールを聞かない", /id: fun/.test(fy) && !/id: (name|email|mail)/.test(fy) && /labels: \["感想"\]/.test(fy)); }
check("README の URL のすぐ後ろに全角の字を続けない（Link check が URL の一部と読む）", !/https?:\/\/[\x21-\x7e]*[^\x00-\x7f]/.test(readFileSync(path.join(root, "README.md"), "utf8").replace(/\]\(https?:\/\/[^)\s]+\)/g, "").replace(/<https?:\/\/[^>\s]+>/g, "")));
{ const sw = readFileSync(path.join(root, "sw.js"), "utf8"), mf = JSON.parse(readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  const shell = JSON.parse(sw.match(/SHELL = (\[[^\]]+\])/)[1]);
  check("PWA：sw.js は画面のファイルを全部保存し（引き継ぎの transfer.js も）、取り直しで古い画面を入れず、外へ何も送らない", ["./index.html", "./gen.js", "./art.js", "./transfer.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"].every((f) => shell.includes(f)) && /cache: "reload"/.test(sw) && !/https?:\/\//.test(sw.replace(/^\/\/.*$/gm, "")));
  check("PWA：manifest にアイコン2つと名前がある", mf.name === "出しすぎチェック" && mf.icons.length >= 2 && mf.start_url === "./"); }

// ---- 3. ブラウザで遊ぶ ----
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = createServer((rq, res) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname), f = path.join(root, p === "/" ? "index.html" : p);
  if ((f !== root && !f.startsWith(root + path.sep)) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const dayBefore = (n) => new Date(Date.parse(TODAY) - n * 864e5).toISOString().slice(0, 10);
async function newPage(w = 390, ctx) {
  const c = ctx || await browser.newContext({ viewport: { width: w, height: 800 } });
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(200);
  return p;
}
const closeHow = async (p) => { if (await p.locator("#howto[open]").count()) await p.click("#howto-ok"); };
const leaksOf = (p) => p.evaluate(() => { const c = __dc.cur(); return c.P.leaks.filter((u) => !c.found.includes(u)); });
const safeOf = (p) => p.evaluate(() => { const c = __dc.cur(); return c.P.parts.filter((x) => !x.leak && !c.wrong.includes(x.uid)).map((x) => x.uid); });
const mem = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("dashisugi-v1") || "{}"));
async function solve(p, { wrong = 0 } = {}) {
  for (let i = 0; i < wrong; i++) await p.click(`[data-u="${(await safeOf(p))[0]}"]`);
  for (const u of await leaksOf(p)) await p.click(`[data-u="${u}"]`);
  await p.waitForSelector(".verdict");
}

try {
  const p = await newPage();
  check("はじめて開くと遊び方が出る", await p.locator("#howto[open]").count() === 1);
  await p.click("#howto-ok");
  check("「わかった」を押したその場で遊び方を見た記録が残る", (await mem(p)).tut === true);
  {
    // Esc を押した直後に読み直しても出ない（close の知らせは遅れて届くので cancel でも残す。10回）
    let ok = 0;
    for (let i = 0; i < 10; i++) {
      const q = await newPage();
      await q.keyboard.press("Escape");
      if ((await mem(q)).tut === true) ok++;
      await q.context().close();
    }
    check("遊び方を Esc で閉じた直後に記録が残る（10回）", ok === 10, ok + "/10");
  }
  {
    // Esc で閉じても「見た」を覚える（2026-11-07 okane-kihon で見つけた不具合。shared-workflows #186）
    const e = await newPage();
    await e.keyboard.press("Escape"); await e.waitForTimeout(100);
    const shut = await e.locator("#howto[open]").count() === 0;
    await e.reload(); await e.waitForTimeout(200);
    check("遊び方を Esc で閉じたあと、開き直しても遊び方が出ない", shut && await e.locator("#howto[open]").count() === 0 && (await mem(e)).tut === true);
    await e.context().close();
  }
  check("ホームに今日の心がけ・上級・とことん・練習が最初から出る（鍵なし）", (await p.textContent("#tip")).includes("今日の心がけ") && await p.locator("#go-h:not([disabled])").count() === 1 && await p.locator("#go-e").count() === 1 && await p.locator("#go-p").count() === 1);

  // 今日の5つ：1つ目は大丈夫な物を押す、2つ目はヒント2回、ほかはそのまま
  await p.click("#go-d");
  const tags = await p.evaluate(() => __dc.load().runs.d.list);
  check("今日の5つは日付から決まる（gen.js の dailyTags と同じ）", JSON.stringify(tags) === JSON.stringify(G.dailyTags(TODAY)));
  check("投稿の画面：写真の物6つ（5つの場面も）・文3つ・投稿の情報1つ、押す所は名前つきで44px以上", await p.locator(".photo .obj").count() >= 5 && await p.locator(".cap .pt").count() === 3 && await p.locator(".pt.meta").count() === 1 && (await p.$$eval("[data-u]", (b) => b.filter((x) => !x.getAttribute("aria-label") || x.getBoundingClientRect().height < 44 || x.getBoundingClientRect().width < 44).length)) === 0);
  check("写真の絵は文字を作り話の名前で描く（絵がある）", (await p.$$eval(".photo .obj svg", (s) => s.filter((x) => x.innerHTML.length < 40).length)) === 0);
  const s0 = (await safeOf(p))[0];
  await p.click(`[data-u="${s0}"]`);
  check("大丈夫な物を押すと「○ 大丈夫」の印と点線・理由の知らせ（色だけで分けない）・role=status", await p.locator(".safe").count() === 1 && (await p.evaluate(() => getComputedStyle(document.querySelector(".safe"), "::before").content)).includes("大丈夫") && (await p.textContent("#msg")).includes("大丈夫") && await p.getAttribute("#msg", "role") === "status");
  const l0 = (await leaksOf(p))[0];
  await p.click(`[data-u="${l0}"]`);
  check("手がかりを押すと「✓ 手がかり」の印・なぜ・どうするのカード", await p.locator(".hit").count() === 1 && (await p.evaluate(() => getComputedStyle(document.querySelector(".hit"), "::after").content)).includes("手がかり") && await p.locator(".fc").count() === 1 && (await p.textContent(".fc")).includes("👉"));
  await p.reload(); await p.waitForTimeout(150); await p.click("#go-d");
  check("途中で閉じても続きから（見つけた印・大丈夫の印のまま）", await p.locator(".hit").count() === 1 && await p.locator(".safe").count() === 1 && await p.evaluate(() => __dc.cur().i) === 0);
  await solve(p);
  check("全部見つけると、手がかりをかくした投稿・直し方・★2（まちがい1回）", await p.locator(".post.fixed").count() === 1 && await p.locator(".verdict li").count() === 2 && (await p.getAttribute(".verdict .stars", "aria-label")) === "星2つ");
  await p.click("#next");
  await p.click("#hint");
  check("ヒント1は写真・文・投稿の情報ごとの残りの数（どれかは言わない）", /写真に \d+つ・文に \d+つ・投稿の情報に \d+つ/.test(await p.textContent("#hintbox")) && await p.locator(".hl").count() === 0);
  await p.click("#hint");
  check("ヒント2は残りの1つを光らせる・ヒントは2回まで", await p.locator(".hl").count() === 1 && await p.locator("#hint:disabled").count() === 1);
  await solve(p);
  check("ヒント2回は★2（1〜2回）", (await p.getAttribute(".verdict .stars", "aria-label")) === "星2つ");
  await p.click("#next");
  for (let i = 2; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const s1 = await mem(p);
  check("5つで結果：今日の記録に投稿ごとのまちがい（1・2・0・0・0）・チェックした投稿 5", JSON.stringify(s1.days[TODAY]?.m) === "[1,2,0,0,0]" && s1.posts === 5);
  const share = await p.textContent(".share");
  const names = G.dailyTags(TODAY).flatMap((t) => G.make(t).parts.map((x) => x.name));
  check("シェアの文に投稿の中身（答え）を出さない（印だけ）", /第\d+回/.test(share) && /🟢/.test(share) && !names.some((n) => share.includes(n)) && !/表札|電柱|駅|学校/.test(share), share);
  check("まちがいのある日は Ko-fi の一言を出さない", await p.locator(".kofi").count() === 0);
  check("結果に「あと少しの実績」と、続けて遊ぶ・上級のボタン", await p.locator("#achnext").count() === 1 && await p.locator("#go-e").count() === 1 && await p.locator("#go-h").count() === 1);
  check("手がかり帳に見つけた種類が載る", Object.keys(s1.dex).length >= 5);
  await p.click("#back");
  check("今日を終えたら、ホームは「今日の結果を見る」", (await p.textContent("#go-d")).includes("結果"));
  // 上級：ヒントなし・3つ・手がかり4つ
  await p.click("#go-h");
  check("上級はヒントのボタンが無い・3つ・手がかり4つ", await p.locator("#hint").count() === 0 && (await p.evaluate(() => __dc.load().runs.h.list.length)) === 3 && (await leaksOf(p)).length === 4);
  for (let i = 0; i < 3; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  check("上級の記録は hdays に入る", (await mem(p)).hdays[TODAY]?.m.length === 3);
  // 練習：記録を増やさない
  await p.click("#back"); await p.click("#go-p"); await p.click('.lv button[data-t="2"]');
  const before = await mem(p);
  for (let i = 0; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const after = await mem(p);
  check("練習は今日の記録を増やさない（手がかり帳・チェックした投稿はふえる）", JSON.stringify(after.days) === JSON.stringify(before.days) && after.posts === before.posts + 5 && after.recent.length === 5);
  // 手がかり帳：見つけたものは説明と出典、まだのものは名前を出さない
  await p.click("#back"); await p.click("#go-dex");
  check("手がかり帳：見つけた種類は「なぜ・どうする・出典」、まだの種類は名前を出さない", await p.locator(".bk[data-id]").count() >= 5 && await p.locator(".bk[data-id] .src a").count() >= 5 && await p.locator(".bk.no").count() === G.LEAK_IDS.length - await p.locator(".bk[data-id]").count() && !(await p.textContent(".bk.no")).includes("「"));
  // とことん：まちがえても終わらない・ヒントも何度でも・ここで降りるで終わる
  await p.click("#back"); await p.click("#go-e");
  check("とことんは、鍵もライフも無く始まる", await p.evaluate(() => __dc.load().runs.e.list.length) > 40 && !(await p.textContent("header")).match(/🌸|🎫|❤/));
  await solve(p); await p.click("#next");
  await solve(p, { wrong: 3 }); await p.click("#next");
  await p.click("#hint"); await p.click("#hint"); await solve(p); await p.click("#next");
  check("とことん：まちがい3回・ヒント2回でも終わらず続く", await p.locator(".post").count() === 1 && await p.evaluate(() => __dc.cur().i) === 3);
  await p.reload(); await p.waitForTimeout(150);
  check("とことんは開き直すと続きから", (await p.textContent("#go-e")).includes("続きから"));
  await p.click("#go-e"); await p.click("#quit"); await p.waitForTimeout(150);
  check("「ここで降りる」で終わり、まちがいなしの数が自己ベストに残る（1こ）", (await mem(p)).ebest === 1 && (await p.textContent("#eres")).includes("3投稿") && !(await mem(p)).runs.e);
  await p.click("#back"); await p.click("#go-e"); await solve(p);
  check("とことん：見つけ終えた直後でも「ここで降りる」で終われる（数も今の投稿まで）", (await p.textContent("#quit")).includes("1投稿") && (await p.click("#quit"), await p.waitForTimeout(150), (await p.textContent("#eres")).includes("1投稿")));
  {
    // 引き継ぎで形のおかしい記録が入っても、画面を止めない（2026-11-07 CodeRabbit）
    const bad = await p.evaluate((d) => { const k = "dashisugi-v1", o = JSON.parse(localStorage.getItem(k)); const keepS = localStorage.getItem(k);
      o.days[d] = { m: [] }; o.hdays[d] = { m: [0, 0] }; o.runs.x = { date: d, id: "z", list: [], res: [] }; o.runs.y = { mode: "d", date: d, id: "z", list: ["0:room|a"], res: [{ m: 0 }, { m: 0 }] }; o.runs.z = { mode: "d", date: d, id: "z", list: ["0:constructor|a"], res: [] };
      localStorage.setItem(k, JSON.stringify(o)); const s = __dc.load(); localStorage.setItem(k, keepS);
      return [!s.days[d] || s.days[d].m.length === 5, !s.hdays[d], !s.runs.x, !s.runs.y, !s.runs.z]; }, dayBefore(20));
    check("引き継ぎ：投稿の数と合わない結果・mode の無い回・知らない場面の回は読まない", bad.every(Boolean), JSON.stringify(bad));
  }
  {
    // 引き継ぎコードなどで数の所に文字が入っても、画面に HTML として出さない
    const q = await newPage(); await closeHow(q);
    await q.evaluate(() => { const s = JSON.parse(localStorage.getItem("dashisugi-v1")) || { v: 1 }; s.ebest = '<img id="xss" src=x>'; s.posts = '"><b id="xss2">'; s.dex = { nameplate: '"><i id="xss3">', "<x>": 3 }; s.recent = ['"><u id="xss4">']; s.runs = { e: { mode: "e", id: "x", date: "2026-11-07", list: ["0:room|1"], res: [], life: 2, cur: { i: 0, tag: "0:room|1", found: ['"><s id="xss5">'], wrong: [], hints: 0 } }, h: { list: "bad", res: [] }, p: { mode: "p", id: "y", date: "2026-11-07", list: ["9:room|1"], res: [] }, d: { mode: "d", id: "z", date: "x", list: ["0:room|1"], res: [] } }; s.days = { "2026-11-07": { m: "x" }, bad: { m: [0] }, "2026-02-30": { m: [0] } }; localStorage.setItem("dashisugi-v1", JSON.stringify(s)); });
    await q.reload(); await q.waitForTimeout(250);
    const st = await q.evaluate(() => __dc.load());
    check("記録の形を直す：数の所の文字は0に・知らない手がかり・形のちがう途中経過と日ごとの記録は捨てる・前の版のライフは読まない", st.ebest === 0 && st.posts === 0 && st.dex.nameplate === 0 && !("<x>" in st.dex) && st.recent.length === 0 && st.runs.e && st.runs.e.cur === null && !("life" in st.runs.e) && !("h" in st.runs) && !("p" in st.runs) && !("d" in st.runs) && Object.keys(st.days).length === 0);
    await q.click("#go-e").catch(() => {}); await q.waitForTimeout(150);
    check("記録の文字を HTML として出さない", await q.locator("#xss, #xss2, #xss3, #xss4, #xss5").count() === 0);
    await q.context().close();
  }
  await p.click("#back"); await p.click("#go-ach");
  check("実績は13個で、腕前・集める・続けるの3つの組", await p.locator(".ach").count() === 13 && await p.locator(".agrp").count() === 3 && await p.locator(".ach.got").count() >= 2);
  check("達成した実績は ✓ の文字も付く（色だけで分けない）", (await p.textContent(".ach.got b")).startsWith("✓"));
  await p.click("#back"); await p.click("#f-about");
  check("このゲームについて：作り話であること・相談先・出典のリンク", (await p.textContent("#about")).includes("作り話") && (await p.textContent("#about")).includes("#9110") && await p.locator("#about a").count() >= 7);
  await p.context().close();

  // 全部まちがいなしの日は Ko-fi を1回だけ
  {
    const q = await newPage(); await closeHow(q); await q.click("#go-d");
    for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
    await q.waitForTimeout(150);
    check("全部まちがいなしで初めて終えたときだけ Ko-fi の一言", await q.locator(".kofi").count() === 1 && (await q.textContent(".big")).includes("見のがしゼロ"));
    await q.click("#back"); await q.click("#go-d");
    check("結果をもう一度見ても Ko-fi は出さない", await q.locator(".kofi").count() === 0);
    await q.context().close();
  }

  // とことんの並び：何百回作っても、1回の中で同じ投稿が出ない・続けて同じ場面が出ない・最近の投稿を避ける
  {
    const q = await newPage(); await closeHow(q);
    const r = await q.evaluate(() => { let dup = 0, sameScene = 0, len = 1e9, hitRecent = 0; const recent = __dc.endlessList([]).slice(0, 30).map((t) => __dc.G.make(t).key);
      for (let n = 0; n < 300; n++) { const L = __dc.endlessList(recent), keys = L.map((t) => __dc.G.make(t).key); len = Math.min(len, L.length); if (new Set(keys).size !== keys.length) dup++; for (let i = 1; i < L.length; i++) if (L[i].split(/[:|]/)[1] === L[i - 1].split(/[:|]/)[1]) sameScene++; hitRecent += keys.filter((k) => recent.includes(k)).length; }
      return { dup, sameScene, len, hitRecent }; });
    check("とことんの並びを300回作って、1回の中で同じ投稿なし・続けて同じ場面なし・最近の投稿を出さない・50投稿", r.dup === 0 && r.sameScene === 0 && r.hitRecent === 0 && r.len === 50, JSON.stringify(r));
    await q.context().close();
  }

  // カレンダー・あとから：過去の日の記録を置いて見る
  {
    const q = await newPage();
    await q.evaluate(([d2, d3]) => { localStorage.setItem("dashisugi-v1", JSON.stringify({ v: 1, tut: true, days: { [d2]: { m: [0, 0, 0, 0, 0] }, [d3]: { m: [1, 0, 0, 2, 0] } }, hdays: {}, adays: {}, dex: {}, runs: {}, kofi: {}, ach: {}, ebest: 0, posts: 0, recent: [] })); }, [dayBefore(2), dayBefore(3)]);
    await q.reload(); await q.waitForTimeout(150);
    check("ホームの「続けて」は、きのうを休んだら — （休んだ日を責めない）", (await q.textContent(".stats")).includes("—"));
    await q.click("#go-cal");
    const lateList = await q.evaluate(() => __dc.lateDays(__dc.load()));
    const exp = [1, 4, 5, 6, 7].map(dayBefore).filter((d) => d >= "2026-11-07");
    check("カレンダー：取りこぼした過去7日（第1回より後）を押せる", JSON.stringify(lateList) === JSON.stringify(exp), lateList.join(","));
    if (lateList.length) {
      const d = lateList[0];
      if (!(await q.locator(`.cal .miss[data-k="${d}"]`).count())) await q.click("#prev");
      await q.click(`.cal .miss[data-k="${d}"]`);
      check("あとから：その日の今日の5つと同じ投稿", JSON.stringify(await q.evaluate((d) => __dc.load().runs["a:" + d].list, d)) === JSON.stringify(G.dailyTags(d)));
      for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
      await q.waitForTimeout(150);
      const s = await mem(q);
      check("あとからは adays に入り、今日の記録・続けた日には数えない", s.adays[d] && !s.days[d] && (await q.locator(".share").count()) === 0 && (await q.locator(".kofi").count()) === 0);
    } else check("あとから：第1回の日（2026-11-07）より後に取りこぼした日が無いうちは、押せる日が出ない", (await q.locator(".cal .miss").count()) === 0);
    await q.context().close();
  }

  // 古いタブ：同じ投稿を2つのタブで開き、片方で終えたら、もう片方は二重に入れない
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const a = await newPage(390, ctx); await closeHow(a); await a.click("#go-d");
    const b = await ctx.newPage(); b.on("pageerror", (e) => errors.push(e.message)); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    const ls = await leaksOf(b);
    await solve(a);
    await b.click(`[data-u="${ls[0]}"]`);
    await b.waitForTimeout(200);
    const s = await mem(a);
    check("古いタブで同じ投稿を押しても二重に数えない", s.runs.d.res.length === 1 && s.posts === 1);
    await a.click("#next"); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    await a.click("#hint"); await a.click("#hint");
    await b.click("#hint");
    check("別のタブで使ったヒントの数を減らさない", (await mem(a)).runs.d.cur.hints === 2);
    await ctx.close();
  }

  // スマホ幅でもはみ出さない・押す所は44px以上
  {
    const bad = [], small = [];
    for (const w of [320, 390]) {
      const q = await newPage(w); await closeHow(q);
      for (const go of [null, "#go-d", "solve", "#go-cal", "#go-dex", "#go-ach", "#go-e", "#go-p"]) {
        if (go === "solve") { await solve(q); }
        else if (go) { await q.goto(url); await q.waitForTimeout(100); await q.click(go); }
        await q.waitForTimeout(100);
        const ov = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (ov > 0) bad.push(`${w}px ${go || "ホーム"} ${ov}px`);
        small.push(...(await q.$$eval("button:not([disabled]), a[href]", (bs) => bs.filter((b) => b.checkVisibility() && !b.closest(".cal")).filter((b) => b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44).map((b) => (b.id || b.className || b.textContent).slice(0, 20)))).map((x) => `${w}/${go}:${x}`));
      }
      await q.context().close();
    }
    check("幅320pxでも横にはみ出さない", bad.length === 0, bad.join(" / "));
    check("押せる所は高さ・幅44px以上（写真の中の物も）", small.length === 0, [...new Set(small)].slice(0, 8).join(","));
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 700 } });
    await ctx.addInitScript(() => localStorage.setItem("a11y-v1", JSON.stringify({ read: true, cvd: true, calm: true, say: true, ruby: true })));
    const q = await newPage(390, ctx); await closeHow(q);
    const r = await q.evaluate(() => { window.scrollTo(0, 1e5); const f = document.querySelector("footer").getBoundingClientRect(); return [scrollY, Math.round(f.bottom), innerHeight, getComputedStyle(document.documentElement).position]; });
    check("見やすさの設定を全部入れても、いちばん下まで動ける（html が固定されない）", r[0] > 0 && r[1] <= r[2] && r[3] === "static", r.join(","));
    await ctx.close();
  }
  // キーボードだけで遊べる（Tab と Enter）
  {
    const q = await newPage(); await closeHow(q);
    await q.focus("#go-d"); await q.keyboard.press("Enter"); await q.waitForTimeout(100);
    for (const u of await leaksOf(q)) { await q.focus(`[data-u="${u}"]`); await q.keyboard.press("Enter"); }
    await q.waitForTimeout(100);
    check("キーボードだけで手がかりを選んで終えられる", await q.locator(".verdict").count() === 1);
    await q.context().close();
  }
} catch (e) { check("ブラウザでの検査が最後まで動く", false, e.stack.split("\n").slice(0, 3).join(" ")); }

// 引き継ぎコード（shared-workflows template/qa/transfer-check.mjs）
try {
  const sample = { "dashisugi-v1": JSON.stringify({ v: 1, tut: true, days: { "2026-11-07": { m: [0, 1, 0, 0, 2] } }, hdays: {}, adays: {}, dex: { nameplate: 2, gps: 1, trip: 1 }, runs: {}, kofi: {}, ach: {}, ebest: 7, posts: 12, recent: [], t: 1 }) };
  await checkTransfer({ browser, url, game: "dashisugi-check", sample, check, open: async (pg) => { if (await pg.locator("#howto[open]").count()) await pg.click("#howto-ok"); } });
} catch (e) { check("引き継ぎの検査が最後まで動く", false, e.message.split("\n")[0]); }
await browser.close();
server.close();
check("画面のエラーが無い", errors.length === 0, errors.slice(0, 3).join(" | "));

{ // 見やすさ・読みやすさ・偏り（shared-workflows template/qa/a11y.mjs の写し）
  const { spawnSync } = await import("node:child_process");
  const a = spawnSync(process.execPath, [path.join(root, "qa", "a11y.mjs")], { encoding: "utf8", env: process.env });
  check("見やすさ・読みやすさの検査（qa/a11y.mjs。中身は qa-report/a11y.md）", a.status === 0, (a.stdout.match(/^- ❌.*$/gm) || []).join(" / ") || (a.status ? a.stderr.slice(-300) : ""));
}

const ng = results.filter((r) => !r.ok);
const md = `# 出しすぎチェック QA\n\n${results.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? `（${r.detail}）` : ""}`).join("\n")}\n\n${ng.length ? `❌ ${ng.length}件` : `✅ ${results.length}項目すべて通過`}\n`;
mkdirSync(path.join(root, "qa-report"), { recursive: true });
writeFileSync(path.join(root, "qa-report/report.md"), md);
console.log(md);
process.exit(ng.length ? 1 : 0);
