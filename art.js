// 出しすぎチェックの絵（場面の背景と、物の絵）。すべて SVG の線と形で描く（写真・外の画像は使わない）。
// 物の絵は viewBox 0 0 100 100。字は作り話の名前だけ。人の顔は描かない（鏡は形だけ）。
(function (root) {
  "use strict";
  const F = `font-family="'Zen Maru Gothic','Hiragino Sans','Yu Gothic',sans-serif" font-weight="700"`;
  const txt = (x, y, s, size = 13, fill = "#1f2a44", extra = "") => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="${fill}" ${F} ${extra}>${s}</text>`;
  const fit = (s, max) => { const n = [...s].length; return n <= max ? 13 : Math.max(8, Math.floor((13 * max) / n)); };

  // 場面の背景（viewBox 0 0 300 200）
  const SCENE = {
    room: `<rect width="300" height="200" fill="#f3e6cf"/><rect y="104" width="300" height="96" fill="#c99b6d"/><rect y="104" width="300" height="10" fill="#a87b52"/>
      <rect x="10" y="10" width="96" height="76" rx="4" fill="#bfe0f5" stroke="#6b5338" stroke-width="5"/><line x1="58" y1="10" x2="58" y2="86" stroke="#6b5338" stroke-width="3"/>
      <rect x="0" y="180" width="300" height="20" fill="#8a6342"/>`,
    front: `<rect width="300" height="200" fill="#cfe8f7"/><rect x="96" y="20" width="110" height="100" fill="#efe1c7" stroke="#8a7458" stroke-width="2"/><path d="M86 26 L151 0 L216 26 Z" fill="#a6574a"/>
      <rect x="140" y="62" width="30" height="58" fill="#8a6342"/><rect y="118" width="300" height="82" fill="#b9b4ad"/><rect y="118" width="300" height="6" fill="#8f8a83"/>
      <rect x="226" y="0" width="12" height="122" fill="#9a958e"/>`,
    station: `<rect width="300" height="200" fill="#d8ecf7"/><rect y="70" width="300" height="20" fill="#7f8c99"/><rect y="90" width="300" height="20" fill="#e8d36b"/>
      <rect y="110" width="300" height="90" fill="#c9c4bb"/><line x1="0" y1="96" x2="300" y2="96" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/>
      <rect x="0" y="62" width="300" height="8" fill="#5c6670"/>`,
    cafe: `<rect width="300" height="200" fill="#efe2d0"/><rect x="8" y="8" width="134" height="80" rx="4" fill="#cde7f4" stroke="#6b5338" stroke-width="4"/>
      <rect y="104" width="300" height="96" fill="#8a6342"/><rect y="104" width="300" height="12" fill="#6b4b30"/><path d="M0 100 H300" stroke="#6b4b30" stroke-width="3"/>`,
    park: `<rect width="300" height="200" fill="#cfe8f7"/><ellipse cx="60" cy="130" rx="120" ry="40" fill="#a7d38b"/><rect y="124" width="300" height="76" fill="#9fcb7f"/>
      <path d="M0 160 Q150 140 300 160 V200 H0 Z" fill="#d8c29a"/><circle cx="270" cy="30" r="0" fill="none"/>`,
    school: `<rect width="300" height="200" fill="#d3eaf6"/><rect x="120" y="40" width="80" height="80" fill="#f1ead8" stroke="#8a7458" stroke-width="2"/>
      <rect x="132" y="52" width="16" height="14" fill="#bfe0f5"/><rect x="156" y="52" width="16" height="14" fill="#bfe0f5"/><rect x="180" y="52" width="12" height="14" fill="#bfe0f5"/>
      <rect y="120" width="300" height="80" fill="#bdb7ae"/><path d="M0 160 H300" stroke="#fff" stroke-width="3" stroke-dasharray="14 10"/><rect x="236" y="0" width="12" height="124" fill="#9a958e"/>`,
  };
  function scene(id) { return `<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true" class="bg">${SCENE[id] || ""}</svg>`; }

  // 物の絵
  function item(id, t) {
    const T = t || {};
    switch (id) {
      case "nameplate": return `<rect x="14" y="26" width="72" height="44" rx="5" fill="#fffaf0" stroke="#6b5338" stroke-width="4"/>${txt(50, 56, T.sur, 22)}`;
      case "addrplate": { const s = `${T.town}3-12`; return `<rect x="32" y="2" width="36" height="96" fill="#9a958e"/><rect x="22" y="20" width="56" height="60" rx="3" fill="#1d5a9e" stroke="#fff" stroke-width="2"/>${txt(50, 44, T.town, fit(T.town, 4), "#fff")}${txt(50, 66, "3-12", 15, "#fff")}<title>${s}</title>`; }
      case "stationsign": return `<rect x="4" y="26" width="92" height="48" rx="4" fill="#fff" stroke="#1d6b4a" stroke-width="5"/><rect x="4" y="60" width="92" height="14" fill="#1d6b4a"/>${txt(50, 54, T.station, fit(T.station, 6))}${txt(50, 71, "STATION", 9, "#fff")}`;
      case "busstop": return `<rect x="47" y="34" width="6" height="64" fill="#5c6670"/><circle cx="50" cy="30" r="26" fill="#fff" stroke="#c0392b" stroke-width="5"/>${txt(50, 26, T.town, fit(T.town, 4) - 2)}${txt(50, 42, "二丁目", 11)}<rect x="34" y="84" width="32" height="10" fill="#5c6670"/>`;
      case "schoolgate": return `<rect x="6" y="20" width="14" height="78" fill="#a8a29a"/><rect x="80" y="20" width="14" height="78" fill="#a8a29a"/><rect x="24" y="34" width="52" height="40" rx="3" fill="#fffaf0" stroke="#6b5338" stroke-width="3"/>${txt(50, 52, T.school ? T.school.replace(/(小学校|中学校|高校)$/, "") : "", fit(T.school || "", 5) - 1)}${txt(50, 68, T.school ? (T.school.match(/(小学校|中学校|高校)$/) || [""])[0] : "", 10)}`;
      case "uniform": return `<path d="M30 10 L50 18 L70 10 L92 30 L80 44 L74 38 L74 94 L26 94 L26 38 L20 44 L8 30 Z" fill="#24427a" stroke="#142a52" stroke-width="2"/><path d="M42 16 L50 40 L58 16" fill="#fff"/><path d="M50 40 L44 30 L56 30 Z" fill="#c0392b"/><circle cx="64" cy="52" r="7" fill="#e6b422" stroke="#fff" stroke-width="1.5"/><path d="M64 46 L66 51 L71 51 L67 54 L68 59 L64 56 L60 59 L61 54 L57 51 L62 51 Z" fill="#fff"/>`;
      case "nametag": return `<rect x="10" y="26" width="80" height="48" rx="6" fill="#fff" stroke="#c0392b" stroke-width="4"/><rect x="10" y="26" width="80" height="14" rx="4" fill="#c0392b"/>${txt(50, 37, "名札", 9, "#fff")}${txt(50, 64, `${T.g}年 ${T.sur}`, 16)}`;
      case "zekken": return `<path d="M28 12 L50 18 L72 12 L92 28 L80 40 L74 34 L74 94 L26 94 L26 34 L20 40 L8 28 Z" fill="#fff" stroke="#8a8f99" stroke-width="2"/><rect x="32" y="40" width="36" height="34" fill="#fffaf0" stroke="#1f2a44" stroke-width="1.5"/>${txt(50, 54, `${T.g}-${T.c}`, 11)}${txt(50, 69, T.sur, 12)}`;
      case "parcel": return `<rect x="8" y="28" width="84" height="62" fill="#c99b6d" stroke="#8a6342" stroke-width="2"/><rect x="8" y="28" width="84" height="12" fill="#b3855a"/><rect x="20" y="46" width="60" height="38" fill="#fff" stroke="#1f2a44" stroke-width="1"/>${txt(50, 58, "おところ", 8)}<line x1="26" y1="64" x2="74" y2="64" stroke="#1f2a44" stroke-width="2"/><line x1="26" y1="72" x2="66" y2="72" stroke="#1f2a44" stroke-width="2"/><line x1="26" y1="80" x2="58" y2="80" stroke="#1f2a44" stroke-width="2"/>`;
      case "letter": return `<rect x="8" y="24" width="84" height="56" rx="2" fill="#fff" stroke="#8a8f99" stroke-width="2"/><rect x="72" y="28" width="14" height="16" fill="#e8a0a0" stroke="#c0392b" stroke-width="1"/>${txt(46, 52, T.town, fit(T.town, 5) - 1)}${txt(46, 70, `${T.sur} 様`, 14)}`;
      case "studentid": return `<rect x="6" y="22" width="88" height="58" rx="6" fill="#eef3fb" stroke="#24427a" stroke-width="3"/><rect x="12" y="32" width="24" height="30" fill="#c9d3e3"/><circle cx="24" cy="42" r="6" fill="#8a96ab"/><path d="M14 62 Q24 50 34 62 Z" fill="#8a96ab"/>${txt(64, 40, "学生証", 10, "#24427a")}${txt(64, 56, T.school ? T.school.replace(/(小学校|中学校|高校)$/, "") : "", fit(T.school || "", 4) - 2)}${txt(64, 72, T.sur, 12)}`;
      case "carplate": return `<rect x="6" y="22" width="88" height="52" rx="10" fill="#d33c3c"/><rect x="14" y="58" width="72" height="30" rx="4" fill="#fff" stroke="#1d6b4a" stroke-width="3"/>${txt(50, 70, T.town, 9, "#1d6b4a")}${txt(50, 84, "12-34", 13, "#1d6b4a")}<circle cx="24" cy="78" r="0"/>`;
      case "parksign": return `<rect x="46" y="60" width="8" height="38" fill="#6b5338"/><rect x="6" y="24" width="88" height="40" rx="4" fill="#3d7a3a" stroke="#264d24" stroke-width="3"/>${txt(50, 44, T.town, fit(T.town, 5), "#fff")}${txt(50, 59, "公園", 12, "#fff")}`;
      case "landmark": return `<path d="M50 4 L58 70 L42 70 Z" fill="#c0392b"/><rect x="40" y="70" width="20" height="26" fill="#9a958e"/><rect x="43" y="28" width="14" height="8" fill="#fff"/><path d="M42 48 L58 48 L60 58 L40 58 Z" fill="#fff"/><rect x="10" y="80" width="20" height="18" fill="#b8c4cf"/><rect x="70" y="74" width="22" height="24" fill="#b8c4cf"/>`;
      case "manhole": return `<ellipse cx="50" cy="56" rx="44" ry="32" fill="#6f6a63" stroke="#4d4944" stroke-width="3"/><ellipse cx="50" cy="56" rx="34" ry="24" fill="#8a847c"/><path d="M30 60 Q40 40 50 56 Q60 72 70 52" fill="none" stroke="#e6b422" stroke-width="4"/><circle cx="36" cy="48" r="5" fill="#d36b6b"/><circle cx="66" cy="62" r="5" fill="#6bb0d3"/>`;
      case "receipt": return `<path d="M24 6 H76 V92 L70 86 L64 92 L58 86 L52 92 L46 86 L40 92 L34 86 L28 92 L24 88 Z" fill="#fff" stroke="#8a8f99" stroke-width="2"/>${txt(50, 24, T.shop, fit(T.shop, 4) - 1)}${txt(50, 38, T.town + "店", 8)}<line x1="32" y1="50" x2="68" y2="50" stroke="#8a8f99" stroke-width="2"/><line x1="32" y1="58" x2="62" y2="58" stroke="#8a8f99" stroke-width="2"/>${txt(50, 76, "15:42", 10)}`;
      case "phonenote": return `<rect x="24" y="4" width="52" height="92" rx="8" fill="#1f2a44"/><rect x="28" y="12" width="44" height="76" rx="3" fill="#dfe8f5"/><rect x="30" y="20" width="40" height="30" rx="4" fill="#fff"/>${txt(50, 31, T.given + "さん", 8)}${txt(50, 44, "あした" + (T.station || "").replace(/駅$/, "") + "駅で", 6)}`;
      case "mirror": return `<ellipse cx="50" cy="48" rx="34" ry="44" fill="#d3dbe3" stroke="#a8875a" stroke-width="6"/><path d="M30 66 Q50 40 70 66 L70 84 L30 84 Z" fill="#8a96ab"/><circle cx="50" cy="44" r="12" fill="#8a96ab"/><rect x="58" y="16" width="14" height="22" fill="#bfe0f5" stroke="#fff" stroke-width="1"/><path d="M28 22 L40 14" stroke="#fff" stroke-width="3"/>`;
      case "calendar": return `<rect x="10" y="10" width="80" height="82" rx="4" fill="#fff" stroke="#8a8f99" stroke-width="2"/><rect x="10" y="10" width="80" height="16" fill="#c0392b"/>${txt(50, 22, "8月", 11, "#fff")}<rect x="18" y="42" width="64" height="16" fill="#ffe08a"/>${txt(50, 54, "8日〜14日", 10)}${txt(50, 78, "旅行", 15, "#c0392b")}`;
      case "shopsign": return `<rect x="4" y="22" width="92" height="44" rx="4" fill="#fff6e0" stroke="#a8730f" stroke-width="4"/>${txt(50, 42, T.shop, fit(T.shop, 4))}${txt(50, 58, T.town + "店", fit(T.town + "店", 6) - 2)}<path d="M8 66 L92 66 L84 80 L16 80 Z" fill="#c0392b"/>`;
      // 大丈夫なもの
      case "cat": return `<ellipse cx="54" cy="70" rx="30" ry="20" fill="#e3a35a"/><circle cx="30" cy="52" r="16" fill="#e3a35a"/><path d="M18 44 L20 28 L30 38 Z M42 44 L40 28 L30 38 Z" fill="#e3a35a"/><circle cx="25" cy="52" r="2.5" fill="#1f2a44"/><circle cx="36" cy="52" r="2.5" fill="#1f2a44"/><path d="M82 66 Q96 50 88 38" stroke="#e3a35a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      case "cake": return `<path d="M20 50 L80 50 L80 84 L20 84 Z" fill="#fff4e6" stroke="#d9b48a" stroke-width="2"/><path d="M20 50 Q50 38 80 50" fill="#fff"/><rect x="20" y="62" width="60" height="6" fill="#f2a5b0"/><circle cx="50" cy="38" r="8" fill="#d33c3c"/><rect x="14" y="84" width="72" height="6" rx="3" fill="#c9d3e3"/>`;
      case "mug": return `<rect x="24" y="30" width="44" height="54" rx="6" fill="#6bb0d3" stroke="#3e7fa3" stroke-width="2"/><path d="M68 42 Q86 42 86 56 Q86 70 68 70" fill="none" stroke="#3e7fa3" stroke-width="6"/><path d="M36 22 Q40 14 36 8 M50 22 Q54 14 50 8" stroke="#a8b4c0" stroke-width="3" fill="none"/>`;
      case "book": return `<rect x="18" y="16" width="60" height="74" rx="3" fill="#3d7a3a"/><rect x="18" y="16" width="10" height="74" fill="#264d24"/><rect x="36" y="32" width="34" height="8" fill="#e6d48a"/><rect x="36" y="46" width="24" height="4" fill="#e6d48a"/>`;
      case "plant": return `<path d="M30 62 L70 62 L64 94 L36 94 Z" fill="#c4683e"/><path d="M50 62 Q30 40 22 24 Q44 30 50 56 Q56 26 76 20 Q70 44 50 62" fill="#4f9a49"/>`;
      case "flower": return `<path d="M50 54 V96" stroke="#4f9a49" stroke-width="5"/><path d="M50 80 Q36 70 30 76 Q40 86 50 84" fill="#4f9a49"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${50 + 14 * Math.cos((a * Math.PI) / 180)}" cy="${40 + 14 * Math.sin((a * Math.PI) / 180)}" r="11" fill="#f2a5b0"/>`).join("")}<circle cx="50" cy="40" r="9" fill="#e6b422"/>`;
      case "cloud": return `<circle cx="80" cy="22" r="12" fill="#ffd65a"/><path d="M18 70 Q14 52 32 52 Q36 34 56 40 Q72 34 78 52 Q94 54 88 70 Z" fill="#fff" stroke="#c9d3e3" stroke-width="2"/>`;
      case "tree": return `<rect x="44" y="56" width="12" height="42" fill="#7a5530"/><circle cx="50" cy="38" r="30" fill="#5aa04f"/><circle cx="34" cy="48" r="18" fill="#4f9a49"/><circle cx="66" cy="48" r="18" fill="#4f9a49"/>`;
      case "ball": return `<circle cx="50" cy="62" r="30" fill="#fff" stroke="#1f2a44" stroke-width="2"/><path d="M50 44 L64 54 L58 70 L42 70 L36 54 Z" fill="#1f2a44"/>`;
      case "plush": return `<circle cx="50" cy="66" r="26" fill="#c9a27a"/><circle cx="50" cy="38" r="20" fill="#c9a27a"/><circle cx="34" cy="22" r="8" fill="#c9a27a"/><circle cx="66" cy="22" r="8" fill="#c9a27a"/><circle cx="43" cy="36" r="2.5" fill="#1f2a44"/><circle cx="57" cy="36" r="2.5" fill="#1f2a44"/><ellipse cx="50" cy="44" rx="6" ry="4" fill="#efd8bf"/>`;
      case "poster": return `<rect x="10" y="8" width="80" height="84" fill="#1d2b4f" stroke="#e6d48a" stroke-width="3"/>${[[26, 26], [60, 20], [74, 44], [40, 50], [30, 74], [66, 72], [50, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff6c8"/>`).join("")}<path d="M26 26 L50 34 L60 20 M50 34 L40 50 L74 44" stroke="#fff6c8" stroke-width="1" fill="none" opacity=".7"/>`;
      case "clock": return `<circle cx="50" cy="50" r="38" fill="#fff" stroke="#6b5338" stroke-width="5"/><line x1="50" y1="50" x2="50" y2="24" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="68" y2="58" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#1f2a44"/>`;
      case "bird": return `<path d="M20 58 Q36 40 52 56 Q66 40 82 52 Q66 50 52 62 Q38 50 20 58 Z" fill="#4f6a8f"/><path d="M40 30 Q48 24 56 30 Q64 24 72 30" stroke="#4f6a8f" stroke-width="3" fill="none"/>`;
      case "moon": return `<path d="M62 14 A36 36 0 1 0 82 74 A28 28 0 1 1 62 14 Z" fill="#ffd65a"/><circle cx="24" cy="24" r="2" fill="#fff6c8"/><circle cx="84" cy="30" r="2" fill="#fff6c8"/>`;
      case "umbrella": return `<path d="M10 50 Q50 0 90 50 Z" fill="#d36b6b"/><path d="M50 50 V84 Q50 92 42 92" stroke="#5c6670" stroke-width="4" fill="none"/>`;
    }
    return "";
  }
  const ART = { scene, item };
  if (typeof module !== "undefined" && module.exports) module.exports = ART; else root.ART = ART;
})(typeof self !== "undefined" ? self : this);
