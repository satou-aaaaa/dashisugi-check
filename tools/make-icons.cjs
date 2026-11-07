// アプリのアイコン（icon-192.png・icon-512.png）を作る。生成りの地に投稿のカード、朱の虫めがね。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f4efe6"/>
      <rect x="14" y="14" width="60" height="66" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="3"/>
      <rect x="20" y="22" width="48" height="32" rx="3" fill="#cfe8f7"/><rect x="20" y="42" width="48" height="12" fill="#b9b4ad"/>
      <rect x="28" y="28" width="18" height="10" rx="2" fill="#fffaf0" stroke="#6b5338" stroke-width="1.5"/>
      <rect x="20" y="60" width="34" height="5" rx="2" fill="#c9d3e3"/><rect x="20" y="69" width="24" height="5" rx="2" fill="#c9d3e3"/>
      <circle cx="62" cy="58" r="16" fill="#ffffffcc" stroke="#b8402a" stroke-width="6"/><line x1="73" y1="70" x2="88" y2="86" stroke="#b8402a" stroke-width="8" stroke-linecap="round"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
