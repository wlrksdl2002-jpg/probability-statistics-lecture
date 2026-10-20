// 주차별 강의 PPT 생성기 (강의 정보는 content/course.js)
// 사용법: node build.js            → ../03_완성본/<course.fileName>
//        node build.js 1 3         → 1주차와 3주차만 (미리보기용)
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const JSZip = require("jszip");
const { applyTheme } = require("./apply_theme.js");

const ROOT = path.resolve(__dirname, "..");
const IMG_WEB = path.join(ROOT, "05_이미지", "인터넷");
const IMG_FIG = path.join(ROOT, "05_이미지", "그래프");
const OUT_DIR = path.join(ROOT, "03_완성본");
const COURSE_FILE = path.join(__dirname, "content", "course.js");
const COURSE = Object.assign(
  { title: "강의", audience: "", tagline: "", fileName: "강의자료.pptx", parts: [] },
  fs.existsSync(COURSE_FILE) ? require(COURSE_FILE) : {}
);

// ── 디자인 ────────────────────────────────────────────────
const COL = {
  ink: "26215C", ink2: "3A3380", coral: "FF6B4A", teal: "2EC4B6", gold: "FFB627",
  muted: "6E6E86", tint: "ECEAF8", tint2: "F6F5FC", text: "1E1E2A", white: "FFFFFF",
  grid: "DDDBEA", inkLight: "B9B4E3", onDark: "D4D0F2",
};
const FONT = "Malgun Gothic";
const PART_COLORS = [COL.ink, COL.teal, COL.coral, COL.gold, COL.ink2, COL.muted];
const W = 13.333, H = 7.5;
const THEME = {
  name: "Lecture",
  headFontFace: FONT, bodyFontFace: FONT,
  colors: {
    dk1: COL.text, lt1: COL.white, dk2: COL.ink, lt2: COL.tint,
    accent1: COL.ink, accent2: COL.coral, accent3: COL.teal, accent4: COL.gold,
    accent5: COL.ink2, accent6: COL.muted, hlink: COL.ink2, folHlink: COL.muted,
  },
};
const BODY = { x: 0.6, y: 1.55, w: 12.13, h: 5.3 };
const LEFT = { x: 0.6, y: 1.6, w: 5.9, h: 5.2 };
const RIGHT = { x: 6.9, y: 1.6, w: 5.83, h: 5.2 };

// ── 서식 문자열(**굵게**, _{아래}, ^{위}) → pptxgenjs 텍스트 조각 ─────────
function runs(str, base = {}) {
  const out = [];
  const s = String(str);
  let buf = "";
  const flush = (opts) => {
    if (!buf) return;
    pushText(out, keepFormulaTogether(buf), opts);
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    if (s.startsWith("**", i) && s.indexOf("**", i + 2) > 0) {
      flush(base);
      const j = s.indexOf("**", i + 2);
      out.push(...runs(s.slice(i + 2, j), { ...base, bold: true, color: base.emphColor || COL.coral }));
      i = j + 2;
    } else if ((s[i] === "_" || s[i] === "^") && s[i + 1] === "{") {
      flush(base);
      const j = matchBrace(s, i + 1);
      // 첨자 안의 첨자(예: e^{−(x−m)^{2}/2})는 유니코드 첨자로 펼침
      pushText(out, toScript(s.slice(i + 2, j), s[i] === "^"), { ...base, [s[i] === "^" ? "superscript" : "subscript"]: true });
      i = j + 1;
    } else buf += s[i++];
  }
  flush(base);
  out.forEach((r) => delete r.options.emphColor);
  return out.length ? out : [{ text: "", options: { ...base } }];
}
function matchBrace(s, open) {
  let depth = 0;
  for (let k = open; k < s.length; k++) {
    if (s[k] === "{") depth++;
    else if (s[k] === "}" && --depth === 0) return k;
  }
  return s.length - 1;
}
// X̄처럼 결합 문자(윗줄)가 붙은 글자는 맑은 고딕이 제대로 못 그리므로 Cambria Math로
function pushText(out, text, opts) {
  for (const part of text.split(/([A-Za-z]̄)/)) {
    if (!part) continue;
    out.push({ text: part, options: /̄/.test(part) ? { ...opts, fontFace: "Cambria Math" } : { ...opts } });
  }
}
// 수식 중간에서 줄이 바뀌지 않도록 연산자 주변·괄호 안의 공백을 줄바꿈 없는 공백으로
function keepFormulaTogether(t) {
  return t
    .replace(/ ([=+−×÷/~≤≥<>≈≠]) /g, " $1 ")
    .replace(/\(([^()]{0,14})\)/g, (m) => m.replace(/ /g, " "));
}
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "+": "⁺", "−": "⁻", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", r: "ʳ", x: "ˣ", k: "ᵏ", a: "ᵃ", b: "ᵇ", c: "ᶜ", m: "ᵐ", p: "ᵖ", t: "ᵗ" };
const SUB = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉", "+": "₊", "−": "₋", "-": "₋", n: "ₙ", r: "ᵣ", k: "ₖ", i: "ᵢ", x: "ₓ", m: "ₘ", p: "ₚ", t: "ₜ", a: "ₐ", e: "ₑ", o: "ₒ", s: "ₛ", h: "ₕ", l: "ₗ", j: "ⱼ" };
function toScript(inner, sup) {
  return inner.replace(/\*\*/g, "").replace(/([_^])\{([^{}]*)\}/g, (_, k, v) => [...v].map((c) => (k === "^" ? SUP : SUB)[c] || c).join(""));
}
// 차트 제목·축·범례용: 서식 문법을 유니코드 첨자로 바꾼 일반 문자열
function chartText(str) {
  if (str == null) return str;
  let s = String(str).replace(/\*\*/g, "").replace(/(^|[\s(])-(?=\d)/g, "$1−");
  for (let k = 0; k < 3; k++) s = s.replace(/([_^])\{([^{}]*)\}/g, (_, t, v) => [...v].map((c) => (t === "^" ? SUP : SUB)[c] || c).join(""));
  return s;
}
const plain = (str) => chartText(str);

// 글자 폭 추정(인치): 한글은 거의 정사각형, 영문·숫자는 그보다 좁음
function textWidth(str, pt) {
  let em = 0;
  const s = String(str);
  const sub = /[_^]\{([^}]*)\}/g;
  const small = [];
  let m;
  while ((m = sub.exec(s))) small.push(m[1]);
  const main = s.replace(sub, "").replace(/\*\*/g, "");
  const charEm = (ch) => {
    if (/[가-힣ㄱ-ㆎ一-鿿]/.test(ch)) return 1.0;
    if (/[A-Z0-9]/.test(ch)) return 0.62;
    if (/[a-z]/.test(ch)) return 0.53;
    if (ch === " ") return 0.3;
    if (/[.,:;'!|()\[\]]/.test(ch)) return 0.32;
    return 0.75;
  };
  for (const ch of main) em += charEm(ch);
  for (const ch of small.join("")) em += charEm(ch) * 0.8;
  return (em * pt) / 72;
}
const lineCount = (str, pt, w) => Math.max(1, Math.ceil(textWidth(str, pt) / (w * 0.88)));
const lineH = (pt) => (pt * 1.32) / 72;

// ── 애니메이션 태그: 도형 이름에 순서·효과를 기록하고, 저장 후 XML로 변환 ──────
class Anim {
  constructor() { this.seq = 0; }
  // trigger: click(클릭) | with(앞과 동시) | after(앞 효과 뒤 자동)
  tag(effect = "fade", trigger = "after", dur) {
    this.seq += 1;
    return `ANIM|${String(this.seq).padStart(3, "0")}|${effect}|${trigger}|${dur || ""}`;
  }
}

// ── 이미지 크기 읽기 (비율 유지용) ──────────────────────────
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  throw new Error("이미지 크기를 읽을 수 없음: " + file);
}
function webImage(name) {
  for (const ext of [".jpg", ".png", ".jpeg"]) {
    const f = path.join(IMG_WEB, name + ext);
    if (fs.existsSync(f)) return f;
  }
  throw new Error("인터넷 이미지 없음: " + name);
}
function figImage(name) {
  const f = path.join(IMG_FIG, name.endsWith(".png") ? name : name + ".png");
  if (!fs.existsSync(f)) throw new Error("그래프 이미지 없음: " + f);
  return f;
}
const usedCredits = new Set();

// ── 기본 도형 도우미 ──────────────────────────────────────
function txt(slide, str, o) {
  const base = { lang: "ko-KR", fontFace: FONT, fontSize: o.size || 18, color: o.color || COL.text, bold: !!o.bold, emphColor: o.emphColor };
  slide.addText(runs(str, base), {
    x: o.x, y: o.y, w: o.w, h: o.h, isTextBox: true, margin: o.margin ?? 0.04,
    align: o.align || "left", valign: o.valign || "top", objectName: o.anim,
    fill: o.fill ? { color: o.fill } : undefined, lineSpacingMultiple: o.lineSpacing || 1.12,
    fit: "none",
  });
}
function box(slide, o) {
  slide.addShape(o.shape || "roundRect", {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.radius ?? 0.12,
    fill: { color: o.fill || COL.tint, transparency: o.transparency || 0 },
    line: o.line ? { color: o.line, width: o.lineW || 1.25 } : { type: "none" },
    objectName: o.anim, shadow: o.shadow ? { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 } : undefined,
  });
}
function title(slide, s, week) {
  const size = textWidth(s, 30) > 10.3 ? (textWidth(s, 26) > 10.3 ? 22 : 26) : 30;
  txt(slide, s, { x: 0.6, y: 0.4, w: 10.5, h: 0.85, size, bold: true, color: COL.ink, valign: "middle" });
  box(slide, { x: 11.43, y: 0.58, w: 1.3, h: 0.48, fill: COL.tint, radius: 0.24 });
  txt(slide, `${week}주차`, { x: 11.43, y: 0.58, w: 1.3, h: 0.48, size: 14, bold: true, color: COL.ink, align: "center", valign: "middle" });
}

// 글머리표 목록: 산호색 점 + 문장, 클릭할 때마다 한 줄씩
function bulletList(slide, items, area, anim, o = {}) {
  const gap = 0.28;
  let size = o.size || 20;
  const textW = area.w - 0.38;
  const total = (pt) => items.reduce((a, it) => a + lineCount(it, pt, textW) * lineH(pt) + gap, 0);
  while (size > 15 && total(size) > area.h) size -= 1;
  let y = area.y + (o.center ? Math.max(0, (area.h - total(size)) / 2) : 0);
  for (const it of items) {
    const h = lineCount(it, size, textW) * lineH(size) + 0.06;
    const trig = o.trigger || "click";
    slide.addShape("ellipse", {
      x: area.x, y: y + lineH(size) / 2 - 0.07, w: 0.15, h: 0.15,
      fill: { color: o.dot || COL.coral }, line: { type: "none" }, objectName: anim.tag("fade", trig),
    });
    txt(slide, it, { x: area.x + 0.38, y, w: textW, h, size, color: o.color || COL.text, emphColor: o.emphColor, anim: anim.tag("fade", "with") });
    y += h + gap;
  }
}

// ── 그림(visual) 그리기 ───────────────────────────────────
function labelFreq(labels) {
  if (!labels) return 1;
  if (labels.some((l) => String(l).trim() === "")) return 1;
  return labels.length > 12 ? Math.ceil(labels.length / 10) : 1;
}
function chartBase(v) {
  return {
    showLegend: false, showTitle: !!v.title, title: chartText(v.title), titleFontSize: 16, titleColor: COL.ink, titleFontFace: FONT,
    catAxisLabelFontSize: 13, valAxisLabelFontSize: 12, catAxisLabelColor: COL.muted, valAxisLabelColor: COL.muted,
    catAxisLabelFontFace: FONT, valAxisLabelFontFace: FONT,
    valGridLine: { color: COL.grid, size: 0.75 }, catGridLine: { style: "none" },
    catAxisLineShow: true, valAxisLineShow: false, catAxisLineColor: COL.grid,
    showCatAxisTitle: !!v.xTitle, catAxisTitle: chartText(v.xTitle) || "", showValAxisTitle: !!v.yTitle, valAxisTitle: chartText(v.yTitle) || "",
    catAxisMajorTickMark: "none", catAxisLabelFrequency: labelFreq(v.labels),
    catAxisTitleFontSize: 13, valAxisTitleFontSize: 13, catAxisTitleColor: COL.muted, valAxisTitleColor: COL.muted,
    catAxisTitleFontFace: FONT, valAxisTitleFontFace: FONT,
    dataLabelFontFace: FONT, legendFontFace: FONT, legendFontSize: 13,
  };
}

function drawVisual(slide, v, b, anim, trig = "after") {
  const k = v.kind;
  if (k === "bar") {
    const n = v.values.length;
    const hl = new Set(v.highlight || []);
    const colors = v.values.map((_, i) => (hl.has(i) ? COL.coral : COL.ink));
    slide.addChart("bar", [{ name: chartText(v.title) || "값", labels: v.labels.map(chartText), values: v.values }], {
      x: b.x, y: b.y, w: b.w, h: b.h, barDir: "col", ...chartBase(v),
      chartColors: colors.length > 1 ? colors : [COL.ink, COL.ink], barGapWidthPct: n > 12 ? 25 : 45,
      showValue: n <= 12, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: COL.text,
      dataLabelFormatCode: v.fmt || "General", valAxisLabelFormatCode: "General",
      objectName: anim.tag("wipeUp", trig, 900),
    });
  } else if (k === "line" || k === "area") {
    const series = v.series.map((s) => ({ name: chartText(s.name), labels: v.labels.map(chartText), values: s.values }));
    const all = v.series.flatMap((s) => s.values);
    const isProb = Math.min(...all) >= 0 && Math.max(...all) <= 1 && Math.max(...all) > 0.8;
    const isArea = k === "area";
    slide.addChart(k, series, {
      x: b.x, y: b.y, w: b.w, h: b.h, ...chartBase(v),
      showLegend: series.length > 1 && series.some((s) => s.name), legendPos: "b",
      chartColors: isArea ? [COL.inkLight, COL.coral, COL.teal] : [COL.ink, COL.coral, COL.teal, COL.gold],
      chartColorsOpacity: isArea ? 85 : undefined,
      lineSize: 3, lineDataSymbol: v.labels.length <= 12 && !isArea ? "circle" : "none", lineDataSymbolSize: 8,
      valAxisMaxVal: isProb ? 1 : undefined,
      objectName: anim.tag("wipeRight", trig, 1200),
    });
  } else if (k === "image") {
    const file = v.name ? webImage(v.name) : figImage(v.fig);
    if (v.name) usedCredits.add(v.name);
    const sz = imageSize(file);
    const r = Math.min(b.w / sz.w, b.h / sz.h);
    const w = sz.w * r, h = sz.h * r;
    slide.addImage({ path: file, x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h, objectName: anim.tag("fade", trig, 700), altText: v.name || v.fig });
  } else if (k === "steps") {
    const n = v.figs.length;
    const cols = n === 4 ? 2 : n;
    const rows = Math.ceil(n / cols);
    const labH = v.labels ? 0.45 : 0;
    const cw = b.w / cols, ch = b.h / rows;
    v.figs.forEach((f, i) => {
      const file = figImage(f);
      const sz = imageSize(file);
      const cx = b.x + (i % cols) * cw, cy = b.y + Math.floor(i / cols) * ch;
      const r = Math.min((cw - 0.15) / sz.w, (ch - labH - 0.1) / sz.h);
      const w = sz.w * r, h = sz.h * r;
      const t = i === 0 ? trig : "click";
      slide.addImage({ path: file, x: cx + (cw - w) / 2, y: cy, w, h, objectName: anim.tag("fade", t, 600), altText: f });
      if (v.labels) txt(slide, v.labels[i], { x: cx, y: cy + h + 0.02, w: cw, h: labH, size: 15, bold: true, color: COL.ink, align: "center", anim: anim.tag("fade", "with") });
    });
  } else if (k === "formula") {
    const size = Math.min(40, Math.floor((b.w - 0.8) / (textWidth(v.text, 1) * 1.1 || 1)));
    const ch = Math.min(b.h, v.note ? 2.6 : 2.0);
    const y0 = b.y + (b.h - ch) / 2;
    box(slide, { x: b.x, y: y0, w: b.w, h: ch, fill: COL.tint, anim: anim.tag("fade", trig) });
    txt(slide, v.text, { x: b.x + 0.2, y: y0 + 0.25, w: b.w - 0.4, h: 1.2, size: Math.max(22, size), bold: true, color: COL.ink, align: "center", valign: "middle", anim: anim.tag("fade", "with") });
    if (v.note) txt(slide, v.note, { x: b.x + 0.3, y: y0 + 1.5, w: b.w - 0.6, h: 0.9, size: 16, color: COL.muted, align: "center", valign: "middle", anim: anim.tag("fade", "with") });
  } else if (k === "table") {
    const rows = v.rows;
    const nc = rows[0].length;
    const fs_ = rows.length > 8 || nc > 5 ? 14 : 16;
    const rh = Math.min(0.6, b.h / rows.length);
    const data = rows.map((r, ri) => r.map((c) => ({
      text: runs(String(c), { lang: "ko-KR", fontFace: FONT, fontSize: fs_, color: ri === 0 ? COL.white : COL.text, bold: ri === 0 }),
      options: { fill: { color: ri === 0 ? COL.ink : ri % 2 ? COL.white : COL.tint2 }, valign: "middle", align: "center" },
    })));
    const need = rows[0].map((_, ci) => Math.max(...rows.map((r) => textWidth(String(r[ci] ?? ""), fs_))) + 0.3);
    const sum = need.reduce((a, c) => a + c, 0);
    const colW = need.map((c) => (c / sum) * b.w);
    slide.addTable(data, { x: b.x, y: b.y + Math.max(0, (b.h - rh * rows.length) / 2), w: b.w, colW, rowH: rh, border: { type: "solid", pt: 0.75, color: COL.grid }, margin: 0.05 });
  } else if (k === "tree") drawTree(slide, v, b, anim, trig);
  else if (k === "grid") drawGrid(slide, v, b, anim, trig);
  else if (k === "pascal") drawPascal(slide, v, b, anim, trig);
  else if (k === "circle") drawCircle(slide, v, b, anim, trig);
  else if (k === "slots") drawSlots(slide, v, b, anim, trig);
  else throw new Error("알 수 없는 visual.kind: " + k);
}

function line(slide, x1, y1, x2, y2, color, width, name) {
  slide.addShape("line", {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipV: (y2 < y1) !== (x2 < x1), line: { color, width }, objectName: name,
  });
}

// 수형도: 왼쪽 뿌리 → 오른쪽 잎, 단계별로 뻗어 나옴
function drawTree(slide, v, b, anim, trig) {
  const levels = [];
  const leaves = [];
  (function walk(node, d) {
    node.depth = d;
    (levels[d] = levels[d] || []).push(node);
    if (node.children && node.children.length) node.children.forEach((c) => walk(c, d + 1));
    else leaves.push(node);
  })({ label: v.root || "", children: v.children, isRoot: true }, 0);
  const D = levels.length - 1;
  const hasResult = leaves.some((l) => l.result);
  const resW = hasResult ? Math.min(2.2, Math.max(...leaves.map((l) => textWidth(l.result || "", 14))) + 0.2) : 0;
  const nodeW = levels.map((lv) => Math.min(1.9, Math.max(0.8, ...lv.map((n) => textWidth(n.label, 15) + 0.3))));
  const free = b.w - resW - nodeW.reduce((a, c) => a + c, 0);
  const gapX = free / Math.max(1, D);
  const xs = [];
  let cx = b.x;
  for (let d = 0; d <= D; d++) { xs.push(cx); cx += nodeW[d] + gapX; }
  const nh = Math.min(0.48, (b.h / leaves.length) * 0.75);
  const step = b.h / leaves.length;
  leaves.forEach((l, i) => (l.y = b.y + step * (i + 0.5)));
  for (let d = D; d >= 0; d--) for (const n of levels[d]) if (n.children && n.children.length) n.y = n.children.reduce((a, c) => a + c.y, 0) / n.children.length;
  const node = (n, d, t) => {
    const fill = n.isRoot ? COL.ink : d === D ? COL.tint : COL.tint;
    box(slide, { x: xs[d], y: n.y - nh / 2, w: nodeW[d], h: nh, fill, radius: 0.1, anim: anim.tag("fade", t, 350) });
    txt(slide, n.label, { x: xs[d], y: n.y - nh / 2, w: nodeW[d], h: nh, size: 15, bold: true, color: n.isRoot ? COL.white : COL.ink, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
  };
  node(levels[0][0], 0, trig);
  for (let d = 1; d <= D; d++) {
    let first = true;
    for (const n of levels[d]) {
      const p = levels[d - 1].find((q) => q.children && q.children.includes(n));
      const x1 = xs[d - 1] + nodeW[d - 1], x2 = xs[d];
      line(slide, x1, p.y, x2, n.y, COL.inkLight, 2, anim.tag("wipeRight", first ? "after" : "with", 400));
      first = false;
      if (n.p) {
        const lx = x1 + (x2 - x1) * 0.6, ly = p.y + (n.y - p.y) * 0.6;
        const lw = textWidth(n.p, 14) + 0.16;
        txt(slide, n.p, { x: lx - lw / 2, y: ly - 0.14, w: lw, h: 0.28, fill: COL.white, size: 14, bold: true, color: COL.coral, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
      }
      node(n, d, "with");
      if (d === D && n.result) txt(slide, n.result, { x: xs[d] + nodeW[d] + 0.12, y: n.y - nh / 2, w: resW, h: nh, size: 14, color: COL.text, valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
    }
  }
}

// 격자 최단경로: 격자 → 출발/도착점 → 경로가 한 칸씩
function drawGrid(slide, v, b, anim, trig) {
  const s = Math.min((b.w - 0.8) / v.w, (b.h - 0.8) / v.h);
  const gx = b.x + (b.w - s * v.w) / 2, gy = b.y + (b.h - s * v.h) / 2;
  let first = true;
  for (let i = 0; i <= v.w; i++) { line(slide, gx + i * s, gy, gx + i * s, gy + v.h * s, COL.inkLight, 1.5, anim.tag("fade", first ? trig : "with", 400)); first = false; }
  for (let j = 0; j <= v.h; j++) line(slide, gx, gy + j * s, gx + v.w * s, gy + j * s, COL.inkLight, 1.5, anim.tag("fade", "with"));
  const pt = (x, y, label, color) => {
    slide.addShape("ellipse", { x: x - 0.13, y: y - 0.13, w: 0.26, h: 0.26, fill: { color }, line: { type: "none" }, objectName: anim.tag("fade", "with") });
    txt(slide, label, { x: x - 0.75, y: y - 0.05, w: 0.6, h: 0.4, size: 18, bold: true, color, align: "right", margin: 0, anim: anim.tag("fade", "with") });
  };
  pt(gx, gy + v.h * s, v.from || "A", COL.ink);
  slide.addShape("ellipse", { x: gx + v.w * s - 0.13, y: gy - 0.13, w: 0.26, h: 0.26, fill: { color: COL.ink }, line: { type: "none" }, objectName: anim.tag("fade", "with") });
  txt(slide, v.to || "B", { x: gx + v.w * s + 0.15, y: gy - 0.35, w: 0.6, h: 0.4, size: 18, bold: true, color: COL.ink, margin: 0, anim: anim.tag("fade", "with") });
  if (v.mark) {
    const [mx, my] = v.mark.at;
    const px = gx + mx * s, py = gy + (v.h - my) * s;
    slide.addShape("ellipse", { x: px - 0.13, y: py - 0.13, w: 0.26, h: 0.26, fill: { color: COL.teal }, line: { type: "none" }, objectName: anim.tag("fade", "with") });
    txt(slide, v.mark.label || "P", { x: px + 0.1, y: py - 0.45, w: 0.6, h: 0.4, size: 18, bold: true, color: COL.teal, margin: 0, anim: anim.tag("fade", "with") });
  }
  if (v.path) {
    let x = 0, y = 0;
    for (const c of v.path) {
      const nx = x + (c === "R" ? 1 : 0), ny = y + (c === "U" ? 1 : 0);
      line(slide, gx + x * s, gy + (v.h - y) * s, gx + nx * s, gy + (v.h - ny) * s, COL.coral, 5, anim.tag(c === "R" ? "wipeRight" : "wipeUp", "after", 250));
      x = nx; y = ny;
    }
  }
}

// 파스칼의 삼각형: 한 줄씩 등장
function drawPascal(slide, v, b, anim, trig) {
  const n = v.rows;
  const d = Math.min(b.h / n, b.w / n) * 0.9;
  const rowsVals = [[1]];
  for (let i = 1; i < n; i++) {
    const prev = rowsVals[i - 1];
    rowsVals.push(prev.map((_, j) => (j ? prev[j - 1] + prev[j] : 1)).concat(1));
  }
  const cx = b.x + b.w / 2;
  rowsVals.forEach((row, i) => {
    const y = b.y + (b.h - n * d) / 2 + i * d;
    row.forEach((val, j) => {
      const x = cx + (j - i / 2) * d - d * 0.45;
      const hl = v.highlight === "odd" && val % 2 === 1;
      const t = j === 0 ? (i === 0 ? trig : "after") : "with";
      slide.addShape("ellipse", { x, y, w: d * 0.9, h: d * 0.9, fill: { color: hl ? COL.coral : COL.tint }, line: { type: "none" }, objectName: anim.tag("fade", t, 300) });
      const fsz = Math.max(11, Math.min(20, d * 72 * 0.36 * (String(val).length > 2 ? 0.8 : 1)));
      txt(slide, String(val), { x, y, w: d * 0.9, h: d * 0.9, size: fsz, bold: true, color: hl ? COL.white : COL.ink, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
    });
  });
}

// 원형 배열(원탁)
function drawCircle(slide, v, b, anim, trig) {
  const n = v.items.length;
  const R = Math.min(b.w, b.h) / 2 - 0.55;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  slide.addShape("ellipse", { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, fill: { color: COL.tint2 }, line: { color: COL.inkLight, width: 2 }, objectName: anim.tag("fade", trig, 400) });
  const sw = Math.max(0.95, Math.max(...v.items.map((t) => textWidth(t, 15))) + 0.3);
  v.items.forEach((it, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const sh = 0.62;
    box(slide, { x: x - sw / 2, y: y - sh / 2, w: sw, h: sh, fill: i === 0 ? COL.coral : COL.ink, radius: 0.31, anim: anim.tag("fade", "after", 250) });
    txt(slide, it, { x: x - sw / 2, y: y - sh / 2, w: sw, h: sh, size: 15, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
  });
  txt(slide, "↻ 회전해도 같은 배열", { x: cx - 1.6, y: cy - 0.25, w: 3.2, h: 0.5, size: 15, color: COL.muted, align: "center", valign: "middle", anim: anim.tag("fade", "after") });
}

// 칸 채우기 그림
function drawSlots(slide, v, b, anim, trig) {
  const n = v.slots.length;
  const opW = v.op ? 0.45 : 0.15;
  const sw = Math.min(1.5, (b.w - opW * (n - 1)) / n);
  const total = sw * n + opW * (n - 1);
  let x = b.x + (b.w - total) / 2;
  const y = b.y + b.h / 2 - sw / 2 - 0.2;
  v.slots.forEach((s, i) => {
    const t = i === 0 ? trig : "after";
    const gap = s.top === "…";
    if (!gap) box(slide, { x, y, w: sw, h: sw, fill: COL.white, line: COL.ink, lineW: 2, radius: 0.1, anim: anim.tag("fade", t, 300) });
    const fsz = Math.min(30, Math.floor((sw - 0.15) / Math.max(0.01, textWidth(s.top, 1))));
    txt(slide, s.top, { x, y, w: sw, h: sw, size: gap ? 26 : Math.max(16, fsz), bold: true, color: gap ? COL.muted : COL.coral, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", gap ? t : "with", 300) });
    if (s.bottom) txt(slide, s.bottom, { x: x - 0.15, y: y + sw + 0.1, w: sw + 0.3, h: 0.45, size: 14, color: COL.muted, align: "center", margin: 0, anim: anim.tag("fade", "with") });
    x += sw;
    if (v.op && i < n - 1) txt(slide, v.op, { x, y, w: opW, h: sw, size: 22, bold: true, color: COL.ink, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
    x += opW;
  });
}

// ── 슬라이드 종류별 그리기 ─────────────────────────────────
function addSlide(pres, master, section) {
  return pres.addSlide({ masterName: master, sectionTitle: section });
}

function render(pres, s, wk, section) {
  const anim = new Anim();
  const t = s.type;
  let slide;
  if (t === "cover") {
    slide = addSlide(pres, "COVER", section);
    if (s.image) {
      const file = webImage(s.image);
      usedCredits.add(s.image);
      slide.addImage({ path: file, x: 7.33, y: 0, w: 6.0, h: H, sizing: { type: "cover", w: 6.0, h: H }, altText: s.image, objectName: anim.tag("fade", "after", 900) });
      creditTag(slide, s.image, 7.33, 6.0);
    }
    txt(slide, String(wk.week).padStart(2, "0"), { x: 0.75, y: 0.9, w: 3, h: 1.6, size: 88, bold: true, color: COL.coral, anim: anim.tag("fade", "with") });
    txt(slide, `${wk.week}주차`, { x: 0.8, y: 2.55, w: 3, h: 0.5, size: 20, bold: true, color: COL.gold });
    txt(slide, s.title, { x: 0.8, y: 3.1, w: 6.2, h: 1.9, size: textWidth(s.title, 40) > 6 ? 32 : 40, bold: true, color: COL.white, valign: "top" });
    if (s.subtitle) txt(slide, s.subtitle, { x: 0.8, y: 5.1, w: 6.2, h: 0.9, size: 18, color: COL.onDark });
    txt(slide, [COURSE.title, COURSE.audience].filter(Boolean).join(" · "), { x: 0.8, y: 6.55, w: 6, h: 0.4, size: 13, color: COL.onDark });
  } else if (t === "section") {
    slide = addSlide(pres, "DARK", section);
    slide.addShape("ellipse", { x: 8.6, y: 1.2, w: 5.2, h: 5.2, fill: { color: COL.ink2 }, line: { type: "none" } });
    slide.addShape("ellipse", { x: 10.4, y: 4.4, w: 2.2, h: 2.2, fill: { color: COL.coral }, line: { type: "none" }, objectName: anim.tag("fade", "after", 600) });
    txt(slide, `${wk.week}주차 · ${wk.title}`, { x: 0.9, y: 2.3, w: 8, h: 0.5, size: 18, bold: true, color: COL.gold });
    txt(slide, s.title, { x: 0.9, y: 2.9, w: 8.5, h: 1.6, size: textWidth(s.title, 40) > 8.3 ? 32 : 40, bold: true, color: COL.white });
    if (s.sub) txt(slide, s.sub, { x: 0.9, y: 4.6, w: 8, h: 0.6, size: 20, color: COL.onDark });
  } else if (t === "goals") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, "학습목표", wk.week);
    const n = s.items.length;
    const gap = 0.35, cw = (BODY.w - gap * (n - 1)) / n;
    s.items.forEach((it, i) => {
      const x = BODY.x + i * (cw + gap), y = 2.3;
      box(slide, { x, y, w: cw, h: 3.2, fill: COL.tint, anim: anim.tag("fade", i ? "after" : "after", 500) });
      slide.addShape("ellipse", { x: x + 0.4, y: y + 0.45, w: 0.9, h: 0.9, fill: { color: COL.coral }, line: { type: "none" }, objectName: anim.tag("fade", "with") });
      txt(slide, String(i + 1), { x: x + 0.4, y: y + 0.45, w: 0.9, h: 0.9, size: 30, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
      txt(slide, it, { x: x + 0.4, y: y + 1.6, w: cw - 0.8, h: 1.4, size: 22, bold: true, color: COL.ink, anim: anim.tag("fade", "with") });
    });
  } else if (t === "bullets") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    if (s.visual) {
      drawVisual(slide, s.visual, RIGHT, anim);
      bulletList(slide, s.bullets, LEFT, anim);
    } else bulletList(slide, s.bullets, { x: 1.0, y: 1.8, w: 11.3, h: 4.9 }, anim, { size: 24, center: true });
  } else if (t === "concept") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    const area = s.visual ? LEFT : { x: 1.4, y: 1.6, w: 10.5, h: 5.2 };
    if (s.visual) drawVisual(slide, s.visual, RIGHT, anim);
    const tw = area.w - 0.7;
    const defSize = lineCount(s.def, 18, tw) > 3 ? 16 : 18;
    const defH = lineCount(s.def, defSize, tw) * lineH(defSize);
    let termSize = 24;
    while (termSize > 18 && lineCount(s.term, termSize, tw) > 1) termSize -= 1;
    const termH = lineCount(s.term, termSize, tw) * lineH(termSize);
    const cardH = 0.3 + termH + 0.15 + defH + 0.35;
    box(slide, { x: area.x, y: area.y, w: area.w, h: cardH, fill: COL.ink, anim: anim.tag("fade", "click", 500) });
    txt(slide, s.term, { x: area.x + 0.35, y: area.y + 0.3, w: tw, h: termH, size: termSize, bold: true, color: COL.gold, emphColor: COL.gold, anim: anim.tag("fade", "with") });
    txt(slide, s.def, { x: area.x + 0.35, y: area.y + 0.3 + termH + 0.15, w: tw, h: defH + 0.1, size: defSize, color: COL.white, emphColor: COL.gold, anim: anim.tag("fade", "with") });
    let y = area.y + cardH + 0.3;
    if (s.formula) {
      const fsz = Math.max(20, Math.min(34, Math.floor((area.w - 0.7) / (textWidth(s.formula, 1) * 1.1 || 1))));
      box(slide, { x: area.x, y, w: area.w, h: 1.25, fill: COL.tint, anim: anim.tag("fade", "click", 500) });
      txt(slide, s.formula, { x: area.x + 0.2, y, w: area.w - 0.4, h: 1.25, size: fsz, bold: true, color: COL.ink, align: "center", valign: "middle", anim: anim.tag("fade", "with") });
      y += 1.45;
    }
    if (s.note) txt(slide, s.note, { x: area.x + 0.05, y, w: area.w, h: Math.max(0.5, area.y + area.h - y), size: 16, color: COL.muted, anim: anim.tag("fade", s.formula ? "with" : "click") });
  } else if (t === "example") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    const area = s.visual ? LEFT : { x: 0.6, y: 1.6, w: 12.1, h: 5.2 };
    if (s.visual) drawVisual(slide, s.visual, RIGHT, anim);
    const isTb = s.tag === "교과서";
    const tagTxt = isTb ? "교과서 예제" : "공학 예제";
    const tagW = textWidth(tagTxt, 14) + 0.4;
    box(slide, { x: area.x, y: area.y - 0.05, w: tagW, h: 0.4, fill: isTb ? COL.teal : COL.coral, radius: 0.2 });
    txt(slide, tagTxt, { x: area.x, y: area.y - 0.05, w: tagW, h: 0.4, size: 14, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0 });
    const pSize = 18;
    const pH = lineCount(s.problem, pSize, area.w - 0.5) * lineH(pSize) + 0.4;
    let y = area.y + 0.5;
    box(slide, { x: area.x, y, w: area.w, h: pH, fill: COL.tint });
    txt(slide, s.problem, { x: area.x + 0.25, y: y + 0.18, w: area.w - 0.5, h: pH - 0.3, size: pSize, bold: true, color: COL.ink });
    y += pH + 0.3;
    const ansH = 0.7;
    const stepSpace = area.y + area.h - ansH - 0.25 - y;
    let ss = 17;
    const stepsH = (pt) => s.steps.reduce((a, st) => a + lineCount(st, pt, area.w - 0.65) * lineH(pt) + 0.18, 0);
    while (ss > 14 && stepsH(ss) > stepSpace) ss -= 1;
    s.steps.forEach((st, i) => {
      const h = lineCount(st, ss, area.w - 0.65) * lineH(ss) + 0.04;
      slide.addShape("ellipse", { x: area.x, y: y + 0.02, w: 0.38, h: 0.38, fill: { color: COL.ink }, line: { type: "none" }, objectName: anim.tag("fade", "click") });
      txt(slide, String(i + 1), { x: area.x, y: y + 0.02, w: 0.38, h: 0.38, size: 13, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0, anim: anim.tag("fade", "with") });
      txt(slide, st, { x: area.x + 0.55, y, w: area.w - 0.6, h, size: ss, anim: anim.tag("fade", "with") });
      y += h + 0.18;
    });
    const ay = Math.min(y + 0.1, area.y + area.h - ansH);
    box(slide, { x: area.x, y: ay, w: area.w, h: ansH, fill: COL.coral, anim: anim.tag("fade", "click") });
    txt(slide, "답  " + s.answer, { x: area.x + 0.25, y: ay, w: area.w - 0.5, h: ansH, size: 20, bold: true, color: COL.white, emphColor: COL.white, valign: "middle", anim: anim.tag("fade", "with") });
  } else if (t === "visual") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    const capH = s.caption ? 0.7 : 0;
    drawVisual(slide, s.visual, { x: 0.9, y: 1.55, w: 11.5, h: 5.2 - capH }, anim);
    if (s.caption) {
      box(slide, { x: 0.9, y: 6.25, w: 11.5, h: 0.6, fill: COL.tint2, anim: anim.tag("fade", "click") });
      txt(slide, s.caption, { x: 1.1, y: 6.25, w: 11.1, h: 0.6, size: 17, color: COL.ink, valign: "middle", anim: anim.tag("fade", "with") });
    }
  } else if (t === "compare") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    const cw = (BODY.w - 0.4) / 2;
    [s.left, s.right].forEach((side, i) => {
      const need = Math.max(...[s.left, s.right].map((sd) => sd.items.reduce((a, it) => a + lineCount(it, 19, cw - 1.18) * lineH(19) + 0.28, 0)));
      const h = Math.min(5.0, Math.max(3.2, 1.35 + need + 0.4)), x = BODY.x + i * (cw + 0.4), y = 1.7 + (5.0 - h) / 2;
      box(slide, { x, y, w: cw, h, fill: i ? COL.tint2 : COL.tint, anim: anim.tag("fade", i ? "click" : "after", 500) });
      txt(slide, side.head, { x: x + 0.4, y: y + 0.35, w: cw - 0.8, h: 0.7, size: 22, bold: true, color: i ? COL.coral : COL.ink, emphColor: i ? COL.coral : COL.ink, anim: anim.tag("fade", "with") });
      bulletList(slide, side.items, { x: x + 0.4, y: y + 1.35, w: cw - 0.8, h: h - 1.6 }, anim, { size: 19, trigger: "with", dot: i ? COL.coral : COL.ink });
    });
  } else if (t === "metaphor") {
    slide = addSlide(pres, "CONTENT", section);
    const file = webImage(s.image);
    usedCredits.add(s.image);
    slide.addImage({ path: file, x: 0, y: 0, w: 6.2, h: H, sizing: { type: "cover", w: 6.2, h: H }, altText: s.image, objectName: anim.tag("fade", "after", 800) });
    creditTag(slide, s.image, 0, 6.2);
    box(slide, { x: 6.75, y: 0.62, w: 1.1, h: 0.42, fill: COL.gold, radius: 0.21 });
    txt(slide, "비유", { x: 6.75, y: 0.62, w: 1.1, h: 0.42, size: 14, bold: true, color: COL.ink, align: "center", valign: "middle", margin: 0 });
    txt(slide, s.title, { x: 6.75, y: 1.2, w: 6.0, h: 1.3, size: textWidth(s.title, 28) > 11.5 ? 24 : 28, bold: true, color: COL.ink, valign: "top" });
    bulletList(slide, s.lines, { x: 6.75, y: 2.85, w: 6.0, h: 4.0 }, anim, { size: 20 });
  } else if (t === "stats") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, s.title, wk.week);
    const n = s.items.length, gap = 0.35;
    const cw = (BODY.w - gap * (n - 1)) / n;
    s.items.forEach((it, i) => {
      const x = BODY.x + i * (cw + gap), y = 1.9;
      box(slide, { x, y, w: cw, h: 3.4, fill: COL.tint, anim: anim.tag("fade", i ? "click" : "after", 500) });
      const vs = Math.min(54, Math.floor(((cw - 0.4) * 72) / Math.max(1, textWidth(it.value, 1) * 72)));
      txt(slide, it.value, { x: x + 0.2, y: y + 0.45, w: cw - 0.4, h: 1.4, size: Math.max(28, vs), bold: true, color: COL.coral, align: "center", valign: "middle", anim: anim.tag("fade", "with") });
      txt(slide, it.label, { x: x + 0.3, y: y + 2.0, w: cw - 0.6, h: 1.2, size: 17, color: COL.ink, align: "center", valign: "top", anim: anim.tag("fade", "with") });
    });
    if (s.note) txt(slide, s.note, { x: BODY.x, y: 5.65, w: BODY.w, h: 0.8, size: 18, color: COL.muted, align: "center", valign: "middle", anim: anim.tag("fade", "click") });
  } else if (t === "quiz") {
    slide = addSlide(pres, "CONTENT", section);
    title(slide, "확인 퀴즈", wk.week);
    const n = s.questions.length;
    const rowH = 5.2 / n;
    s.questions.forEach((q, i) => {
      const y = 1.6 + i * rowH;
      box(slide, { x: BODY.x, y, w: BODY.w, h: rowH - 0.2, fill: COL.tint2 });
      slide.addShape("ellipse", { x: BODY.x + 0.25, y: y + 0.22, w: 0.62, h: 0.62, fill: { color: COL.ink }, line: { type: "none" } });
      txt(slide, `Q${i + 1}`, { x: BODY.x + 0.25, y: y + 0.22, w: 0.62, h: 0.62, size: 15, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0 });
      const qs = lineCount(q.q, 19, BODY.w - 1.5) > 1 ? 17 : 19;
      txt(slide, q.q, { x: BODY.x + 1.15, y: y + 0.18, w: BODY.w - 1.4, h: 0.75, size: qs, bold: true, color: COL.ink, valign: "middle" });
      txt(slide, "→ " + q.a, { x: BODY.x + 1.15, y: y + 0.92, w: BODY.w - 1.4, h: rowH - 1.2, size: 18, bold: true, color: COL.coral, valign: "top", anim: anim.tag("fade", "click") });
    });
  } else if (t === "summary") {
    slide = addSlide(pres, "DARK", section);
    txt(slide, `${wk.week}주차 정리`, { x: 0.8, y: 0.55, w: 10, h: 0.9, size: 34, bold: true, color: COL.white });
    const n = s.items.length, gap = 0.3;
    const cw = (W - 1.6 - gap * (n - 1)) / n;
    s.items.forEach((it, i) => {
      const x = 0.8 + i * (cw + gap);
      const bodyMax = Math.max(...s.items.map((q) => lineCount(q.body, 19, cw - 0.6) * lineH(19)));
      const ch = Math.min(3.8, Math.max(2.4, 1.2 + bodyMax + 0.4));
      box(slide, { x, y: 1.85, w: cw, h: ch, fill: COL.ink2, anim: anim.tag("fade", "after", 450) });
      txt(slide, it.head, { x: x + 0.3, y: 2.1, w: cw - 0.6, h: 0.9, size: 22, bold: true, color: COL.gold, emphColor: COL.gold, anim: anim.tag("fade", "with") });
      txt(slide, it.body, { x: x + 0.3, y: 3.0, w: cw - 0.6, h: bodyMax + 0.2, size: 19, color: COL.white, emphColor: COL.gold, anim: anim.tag("fade", "with") });
    });
    const cardsBottom = 1.85 + Math.min(3.8, Math.max(2.4, 1.2 + Math.max(...s.items.map((q) => lineCount(q.body, 19, cw - 0.6) * lineH(19))) + 0.4));
    if (s.next) txt(slide, s.next, { x: 0.8, y: cardsBottom + 0.6, w: 11.7, h: 0.7, size: 20, bold: true, color: COL.coral, emphColor: COL.gold, valign: "middle", anim: anim.tag("fade", "click") });
  } else throw new Error(`${wk.week}주차: 알 수 없는 slide.type ${t}`);
  return slide;
}

function creditTag(slide, name, x, w) {
  const f = path.join(IMG_WEB, "credits", name + ".json");
  if (!fs.existsSync(f)) return;
  const c = JSON.parse(fs.readFileSync(f, "utf8"));
  const label = `사진: ${c.author.slice(0, 40)} / ${c.license} / Wikimedia Commons`;
  txt(slide, label, { x: x + 0.15, y: H - 0.42, w: Math.min(w - 0.3, textWidth(label, 10) + 0.25), h: 0.3, size: 10, color: COL.white, fill: "000000", margin: 0.05 });
}

// ── 강의 전체 표지·목차·이미지 출처 ──────────────────────────
function courseCover(pres, weeks) {
  const s = addSlide(pres, "COVER", "표지");
  s.addShape("ellipse", { x: 8.3, y: -1.2, w: 6.5, h: 6.5, fill: { color: COL.ink2 }, line: { type: "none" } });
  s.addShape("ellipse", { x: 10.2, y: 4.3, w: 2.6, h: 2.6, fill: { color: COL.coral }, line: { type: "none" } });
  s.addShape("ellipse", { x: 8.9, y: 5.5, w: 1.1, h: 1.1, fill: { color: COL.teal }, line: { type: "none" } });
  txt(s, COURSE.audience, { x: 0.9, y: 2.0, w: 7, h: 0.5, size: 20, bold: true, color: COL.gold });
  txt(s, COURSE.title, { x: 0.9, y: 2.6, w: 8, h: 1.4, size: textWidth(COURSE.title, 60) > 8 ? 44 : 60, bold: true, color: COL.white });
  txt(s, [`${weeks.length}주 강의`, COURSE.tagline].filter(Boolean).join(" · "), { x: 0.9, y: 4.1, w: 8, h: 0.6, size: 22, color: COL.onDark });
}
function courseToc(pres, weeks) {
  const s = addSlide(pres, "CONTENT", "표지");
  txt(s, "강의 차례", { x: 0.6, y: 0.4, w: 10.5, h: 0.85, size: 30, bold: true, color: COL.ink, valign: "middle" });
  const cols = 5, gap = 0.25;
  const cw = (BODY.w - gap * (cols - 1)) / cols, ch = 2.35;
  weeks.forEach((wk, i) => {
    const x = BODY.x + (i % cols) * (cw + gap), y = 1.7 + Math.floor(i / cols) * (ch + 0.3);
    const pi = COURSE.parts.findIndex((p) => wk.week <= p.to);
    const part = PART_COLORS[Math.max(0, pi) % PART_COLORS.length];
    box(s, { x, y, w: cw, h: ch, fill: COL.tint2 });
    s.addShape("ellipse", { x: x + 0.25, y: y + 0.25, w: 0.7, h: 0.7, fill: { color: part }, line: { type: "none" } });
    txt(s, String(wk.week), { x: x + 0.25, y: y + 0.25, w: 0.7, h: 0.7, size: 20, bold: true, color: COL.white, align: "center", valign: "middle", margin: 0 });
    txt(s, wk.title, { x: x + 0.25, y: y + 1.1, w: cw - 0.45, h: 1.1, size: 16, bold: true, color: COL.ink });
  });
  const legend = COURSE.parts.map((p, i) => [p.name, PART_COLORS[i % PART_COLORS.length]]);
  legend.forEach(([name, c], i) => {
    s.addShape("ellipse", { x: 0.6 + i * 2.4, y: 6.82, w: 0.22, h: 0.22, fill: { color: c }, line: { type: "none" } });
    txt(s, name, { x: 0.9 + i * 2.4, y: 6.72, w: 2, h: 0.4, size: 14, color: COL.muted, valign: "middle" });
  });
}
function creditSlides(pres) {
  const names = [...usedCredits].sort();
  const per = 10;
  for (let p = 0; p * per < names.length; p++) {
    const s = addSlide(pres, "CONTENT", "이미지 출처");
    txt(s, "이미지 출처 (Wikimedia Commons)", { x: 0.6, y: 0.4, w: 11, h: 0.85, size: 28, bold: true, color: COL.ink, valign: "middle" });
    const rows = [["이미지", "제목", "작가", "라이선스"]];
    for (const n of names.slice(p * per, (p + 1) * per)) {
      const f = path.join(IMG_WEB, "credits", n + ".json");
      const c = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { title: "?", author: "?", license: "?" };
      const cut = (t, k) => (t.length > k ? t.slice(0, k - 1) + "…" : t);
      rows.push([n, cut(c.title.replace(/\.(jpe?g|png)$/i, ""), 70), cut(c.author, 32), c.license]);
    }
    const data = rows.map((r, ri) => r.map((c) => ({ text: c, options: { lang: "ko-KR", fontFace: FONT, fontSize: 11, color: ri ? COL.text : COL.white, bold: !ri, fill: { color: ri ? (ri % 2 ? COL.white : COL.tint2) : COL.ink } } })));
    s.addTable(data, { x: 0.6, y: 1.5, w: 12.1, colW: [1.9, 6.3, 2.3, 1.6], rowH: 0.45, border: { type: "solid", pt: 0.5, color: COL.grid }, margin: 0.05 });
  }
}

// ── 저장 후 애니메이션·전환 효과 XML 삽입 ──────────────────────
const EFFECTS = {
  fade: { preset: 10, sub: 0, filter: "fade", dur: 500 },
  wipeUp: { preset: 22, sub: 4, filter: "wipe(up)", dur: 800 },
  wipeRight: { preset: 22, sub: 8, filter: "wipe(right)", dur: 800 },
};
function timingXml(slideXml) {
  const re = /<p:cNvPr id="(\d+)" name="(ANIM\|[^"]*)"/g;
  const items = [];
  let m;
  while ((m = re.exec(slideXml))) {
    const [, id, name] = m;
    const [, seq, effect, trigger, dur] = name.split("|");
    const before = slideXml.slice(0, m.index);
    const kinds = { sp: before.lastIndexOf("<p:sp>"), pic: before.lastIndexOf("<p:pic>"), gf: before.lastIndexOf("<p:graphicFrame") };
    const kind = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0][0];
    items.push({ id, seq: +seq, effect, trigger, dur: dur ? +dur : EFFECTS[effect].dur, kind, name });
  }
  items.sort((a, b) => a.seq - b.seq);
  if (!items.length) return { xml: slideXml, timing: "" };

  // 클릭 묶음 → 단계(동시에 시작하는 효과들) 구조로 정리
  const groups = [];
  for (const it of items) {
    let g = groups[groups.length - 1];
    if (it.trigger === "click" || !g) {
      g = { start: it.trigger === "click" ? "click" : "begin", steps: [] };
      groups.push(g);
      g.steps.push({ delay: 0, effects: [it] });
    } else if (it.trigger === "with") {
      g.steps[g.steps.length - 1].effects.push(it);
    } else {
      const prev = g.steps[g.steps.length - 1];
      g.steps.push({ delay: prev.delay + Math.max(...prev.effects.map((e) => e.dur)), effects: [it] });
    }
  }
  let id = 2;
  const nid = () => ++id;
  let body = "";
  for (const g of groups) {
    const cond = g.start === "click"
      ? '<p:cond delay="indefinite"/>'
      : '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond>';
    let steps = "";
    g.steps.forEach((st, si) => {
      let effs = "";
      st.effects.forEach((e, ei) => {
        const E = EFFECTS[e.effect];
        const nodeType = ei > 0 ? "withEffect" : si === 0 && g.start === "click" ? "clickEffect" : "afterEffect";
        effs += `<p:par><p:cTn id="${nid()}" presetID="${E.preset}" presetClass="entr" presetSubtype="${E.sub}" fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>`
          + `<p:set><p:cBhvr><p:cTn id="${nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${e.id}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`
          + `<p:animEffect transition="in" filter="${E.filter}"><p:cBhvr><p:cTn id="${nid()}" dur="${e.dur}"/><p:tgtEl><p:spTgt spid="${e.id}"/></p:tgtEl></p:cBhvr></p:animEffect>`
          + `</p:childTnLst></p:cTn></p:par>`;
      });
      steps += `<p:par><p:cTn id="${nid()}" fill="hold"><p:stCondLst><p:cond delay="${st.delay}"/></p:stCondLst><p:childTnLst>${effs}</p:childTnLst></p:cTn></p:par>`;
    });
    body += `<p:par><p:cTn id="${nid()}" fill="hold"><p:stCondLst>${cond}</p:stCondLst><p:childTnLst>${steps}</p:childTnLst></p:cTn></p:par>`;
  }
  const bld = items.map((e) => (e.kind === "sp" ? `<p:bldP spid="${e.id}" grpId="0" animBg="1"/>` : e.kind === "gf" ? `<p:bldGraphic spid="${e.id}" grpId="0"><p:bldAsOne/></p:bldGraphic>` : "")).join("");
  const timing = `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>`
    + `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${body}</p:childTnLst></p:cTn>`
    + `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>`
    + `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`
    + `</p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ""}</p:timing>`;
  // 선택 창에 보이는 도형 이름을 읽기 쉽게 정리
  let xml = slideXml;
  for (const it of items) xml = xml.replace(`name="${it.name}"`, `name="${it.effect} ${it.seq}"`);
  return { xml, timing };
}

async function postProcess(buf, file) {
  const zip = await JSZip.loadAsync(buf);
  let animated = 0;
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml0 = await zip.file(name).async("string");
    const { xml, timing } = timingXml(xml0);
    if (timing) animated++;
    const transition = '<p:transition spd="med"><p:fade/></p:transition>';
    zip.file(name, xml.replace("</p:sld>", transition + timing + "</p:sld>"));
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  return animated;
}

// ── 실행 ─────────────────────────────────────────────────
async function main() {
  const only = process.argv.slice(2).map(Number).filter(Boolean);
  const files = fs.readdirSync(path.join(__dirname, "content")).filter((f) => /^week\d+\.js$/.test(f)).sort();
  const weeks = files.map((f) => require(path.join(__dirname, "content", f))).filter((w) => !only.length || only.includes(w.week));

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title = COURSE.title;
  pres.author = COURSE.title;
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  pres.defineSlideMaster({
    title: "DARK", background: { color: COL.ink },
    slideNumber: { x: 12.35, y: 6.95, w: 0.6, h: 0.35, fontFace: FONT, fontSize: 11, color: COL.onDark, align: "right" },
  });
  pres.defineSlideMaster({ title: "COVER", background: { color: COL.ink } });
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: COL.white },
    slideNumber: { x: 12.35, y: 6.95, w: 0.6, h: 0.35, fontFace: FONT, fontSize: 11, color: COL.muted, align: "right" },
  });

  pres.addSection({ title: "표지" });
  courseCover(pres, weeks);
  courseToc(pres, weeks);
  for (const wk of weeks) {
    const section = `${wk.week}주차 ${wk.title}`;
    pres.addSection({ title: section });
    wk.slides.forEach((s, i) => {
      try { render(pres, s, wk, section); } catch (e) { throw new Error(`${wk.week}주차 ${i + 1}번째 슬라이드(${s.type}): ${e.message}`); }
    });
  }
  pres.addSection({ title: "이미지 출처" });
  creditSlides(pres);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const name = only.length ? `미리보기_${only.join("-")}주차.pptx` : COURSE.fileName;
  const file = path.join(OUT_DIR, name);
  const buf = await pres.write({ outputType: "nodebuffer" });
  const animated = await postProcess(buf, file);
  await applyTheme(file, THEME);
  const total = weeks.reduce((a, w) => a + w.slides.length, 0);
  console.log(`완료: ${file}\n주차 ${weeks.length}개, 슬라이드 약 ${total + 2}장, 애니메이션 있는 슬라이드 ${animated}장`);
}
main().catch((e) => { console.error(e); process.exit(1); });
