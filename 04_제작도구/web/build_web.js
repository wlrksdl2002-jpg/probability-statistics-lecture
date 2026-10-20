// 주차별 웹 슬라이드 생성기: content/weekNN.js → docs/weeks/weekNN.html
// 사용법: node web/build_web.js   (04_제작도구 폴더에서)
// 미리보기: docs/weeks/week01.html#5  (?all=1 을 붙이면 단계 공개를 모두 펼친 상태)
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TOOL = path.resolve(__dirname, "..");
const ROOT = path.resolve(TOOL, "..");
const DOCS = path.join(ROOT, "docs");
const IMG_WEB = path.join(ROOT, "05_이미지", "인터넷");
const IMG_FIG = path.join(ROOT, "05_이미지", "그래프");
const IMG_GEN = path.join(ROOT, "05_이미지", "플로우");
const COURSE = require(path.join(TOOL, "content", "course.js"));

// ── 서식 문자열(**굵게**, _{아래}, ^{위}) → HTML ─────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function md(str) {
  const s = String(str ?? "");
  let out = "", i = 0, buf = "";
  const flush = () => { out += esc(buf); buf = ""; };
  while (i < s.length) {
    if (s.startsWith("**", i) && s.indexOf("**", i + 2) > 0) {
      flush();
      const j = s.indexOf("**", i + 2);
      out += `<b>${md(s.slice(i + 2, j))}</b>`;
      i = j + 2;
    } else if ((s[i] === "_" || s[i] === "^") && s[i + 1] === "{") {
      flush();
      let depth = 0, j = i + 1;
      for (; j < s.length; j++) { if (s[j] === "{") depth++; else if (s[j] === "}" && --depth === 0) break; }
      const tag = s[i] === "^" ? "sup" : "sub";
      out += `<${tag}>${md(s.slice(i + 2, j))}</${tag}>`;
      i = j + 1;
    } else buf += s[i++];
  }
  flush();
  return out;
}
const plain = (s) => String(s ?? "").replace(/\*\*/g, "").replace(/[_^]\{([^{}]*)\}/g, "$1").replace(/[_^]\{([^{}]*)\}/g, "$1");
// SVG 안 글자 폭 추정(px): 한글은 정사각형에 가깝고 영문·숫자는 좁음
function tw(str, px) {
  let em = 0;
  for (const ch of plain(str)) em += /[가-힣ㄱ-ㆎ]/.test(ch) ? 1 : /[A-Z0-9]/.test(ch) ? 0.62 : /[a-z]/.test(ch) ? 0.53 : ch === " " ? 0.3 : 0.65;
  return em * px;
}

// ── 자산 복사 ────────────────────────────────────────────────────
const used = { web: new Set(), fig: new Set(), cover: new Set() };
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
function webImg(name) {
  used.web.add(name);
  return enc(`../img/web/${name}.jpg`);
}
function figImg(name) {
  const n = name.replace(/\.png$/, "");
  used.fig.add(n);
  return enc(`../img/fig/${n}.png`);
}
function coverImg(name) {
  used.cover.add(name);
  return enc(`../img/cover/${name}.jpg`);
}
function credit(name) {
  const f = path.join(IMG_WEB, "credits", name + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}
function copyAssets() {
  for (const d of ["img/web", "img/fig", "img/cover", "video"]) fs.mkdirSync(path.join(DOCS, d), { recursive: true });
  // 인터넷 사진은 큰 원본이 많아 긴 변 1400px JPEG로 줄여서 복사
  const jobs = [...used.web].map((n) => {
    const src = ["jpg", "png", "jpeg"].map((e) => path.join(IMG_WEB, `${n}.${e}`)).find(fs.existsSync);
    if (!src) throw new Error("인터넷 이미지 없음: " + n);
    return [src, path.join(DOCS, "img", "web", n + ".jpg")];
  });
  const py = `
import json, sys
from PIL import Image
for src, dst in json.loads(sys.argv[1]):
    im = Image.open(src).convert("RGB")
    im.thumbnail((1400, 1400))
    im.save(dst, quality=84, optimize=True)
`;
  if (jobs.length) execFileSync("python", ["-c", py, JSON.stringify(jobs)], { stdio: "inherit" });
  for (const n of used.fig) fs.copyFileSync(path.join(IMG_FIG, n + ".png"), path.join(DOCS, "img", "fig", n + ".png"));
  for (const n of used.cover) fs.copyFileSync(path.join(IMG_GEN, n + ".jpg"), path.join(DOCS, "img", "cover", n + ".jpg"));
  if (COURSE.intro) {
    fs.copyFileSync(path.join(IMG_GEN, COURSE.intro.video), path.join(DOCS, "video", "intro.mp4"));
    const poster = path.join(IMG_GEN, "intro_poster.jpg");
    if (fs.existsSync(poster)) fs.copyFileSync(poster, path.join(DOCS, "video", "intro_poster.jpg"));
  }
}

// ── 단계 공개(fragment) 카운터 ───────────────────────────────────
class Steps {
  constructor() { this.n = 0; }
  next() { return ++this.n; }
  attr(k) { return ` class="frag" data-f="${k}"`; }
}
const d = (sec) => `style="--d:${sec.toFixed(2)}s"`;

// ── 그림(visual) ────────────────────────────────────────────────
function niceTicks(max) {
  if (max <= 0) return { top: 1, step: 0.2 };
  const raw = max / 5;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  return { top: Math.ceil(max / step - 1e-9) * step, step };
}
function fmtVal(v, fmt) {
  if (fmt === "0%") return (v * 100).toFixed(0) + "%";
  if (fmt === "0.0%") return (v * 100).toFixed(1) + "%";
  const m = /^0\.(0+)$/.exec(fmt || "");
  if (m) return v.toFixed(m[1].length);
  if (fmt === "0") return Math.round(v).toLocaleString("en-US");
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  return String(+v.toPrecision(4));
}
const tickLabel = (v) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(+v.toPrecision(6)));
function labelSkip(labels) {
  if (labels.some((l) => String(l).trim() === "")) return 1;
  return labels.length > 12 ? Math.ceil(labels.length / 10) : 1;
}

function axesFrame(W, H, pad, top, step, v) {
  let g = "";
  for (let t = 0; t <= top + 1e-9; t += step) {
    const y = pad.t + (H - pad.t - pad.b) * (1 - t / top);
    g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" class="gl"/><text x="${pad.l - 10}" y="${y + 6}" class="tk" text-anchor="end">${tickLabel(t)}</text>`;
  }
  g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" class="ax"/>`;
  if (v.xTitle) g += `<text x="${(pad.l + W - pad.r) / 2}" y="${H - 8}" class="at" text-anchor="middle">${esc(plain(v.xTitle))}</text>`;
  if (v.yTitle) g += `<text transform="translate(18 ${(pad.t + H - pad.b) / 2}) rotate(-90)" class="at" text-anchor="middle">${esc(plain(v.yTitle))}</text>`;
  if (v.title) g += `<text x="${W / 2}" y="26" class="ct" text-anchor="middle">${esc(plain(v.title))}</text>`;
  return g;
}

function barChart(v) {
  const W = 720, H = 460, pad = { l: 70, r: 20, t: v.title ? 50 : 30, b: v.xTitle ? 70 : 46 };
  const n = v.values.length;
  const { top, step } = niceTicks(Math.max(...v.values));
  const cw = (W - pad.l - pad.r) / n, bw = cw * (n > 12 ? 0.78 : 0.62);
  const hl = new Set(v.highlight || []);
  const skip = labelSkip(v.labels);
  let g = axesFrame(W, H, pad, top, step, v);
  v.values.forEach((val, i) => {
    const h = (H - pad.t - pad.b) * (val / top);
    const x = pad.l + cw * i + (cw - bw) / 2, y = H - pad.b - h;
    g += `<rect class="bar${hl.has(i) ? " hl" : ""}" x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 0.5)}" rx="3" ${d(0.15 + i * (0.8 / n))}/>`;
    if (n <= 12) g += `<text x="${x + bw / 2}" y="${y - 8}" class="vl anim" text-anchor="middle" ${d(0.6 + i * (0.8 / n))}>${esc(fmtVal(val, v.fmt))}</text>`;
    if (i % skip === 0 && String(v.labels[i]).trim()) g += `<text x="${x + bw / 2}" y="${H - pad.b + 26}" class="tk" text-anchor="middle">${esc(plain(v.labels[i]))}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(plain(v.title || "막대그래프"))}">${g}</svg>`;
}

function lineChart(v, area) {
  const W = 720, H = 460, legend = v.series.length > 1 && v.series.some((s) => s.name);
  const pad = { l: 70, r: 24, t: v.title ? 50 : 30, b: (v.xTitle ? 70 : 46) + (legend ? 34 : 0) };
  const all = v.series.flatMap((s) => s.values);
  const isProb = Math.min(...all) >= 0 && Math.max(...all) <= 1 && Math.max(...all) > 0.8;
  const { top, step } = isProb ? { top: 1, step: 0.2 } : niceTicks(Math.max(...all));
  const n = v.labels.length;
  const X = (i) => pad.l + (W - pad.l - pad.r) * (n === 1 ? 0.5 : i / (n - 1));
  const Y = (val) => pad.t + (H - pad.t - pad.b) * (1 - val / top);
  let g = axesFrame(W, H, pad, top, step, v);
  const skip = labelSkip(v.labels);
  v.labels.forEach((l, i) => { if (i % skip === 0 && String(l).trim()) g += `<text x="${X(i)}" y="${H - pad.b + 26}" class="tk" text-anchor="middle">${esc(plain(l))}</text>`; });
  const colors = area ? ["#B9B4E3", "#FF6B4A", "#2EC4B6"] : ["#26215C", "#E8553A", "#1A9E92", "#C98A00"];
  let series = "";
  v.series.forEach((s, k) => {
    const pts = s.values.map((val, i) => `${X(i).toFixed(1)},${Y(val).toFixed(1)}`);
    if (area) series += `<path d="M${X(0)},${Y(0)} L${pts.join(" L")} L${X(n - 1)},${Y(0)} Z" fill="${colors[k % 3]}" fill-opacity="${k ? 0.9 : 0.75}"/>`;
    else {
      series += `<polyline points="${pts.join(" ")}" fill="none" stroke="${colors[k % 4]}" stroke-width="4" stroke-linejoin="round"/>`;
      if (n <= 12) s.values.forEach((val, i) => (series += `<circle cx="${X(i)}" cy="${Y(val)}" r="6" fill="${colors[k % 4]}"/>`));
    }
  });
  g += `<g class="reveal" ${d(0.2)}>${series}</g>`;
  if (legend) {
    let lx = pad.l;
    v.series.forEach((s, k) => {
      g += `<rect x="${lx}" y="${H - 30}" width="18" height="18" rx="4" fill="${colors[k % (area ? 3 : 4)]}"/><text x="${lx + 26}" y="${H - 15}" class="tk">${esc(plain(s.name || ""))}</text>`;
      lx += 50 + tw(s.name || "", 20);
    });
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(plain(v.title || (area ? "넓이 그래프" : "꺾은선 그래프")))}">${g}</svg>`;
}

function tree(v) {
  const levels = [], leaves = [];
  (function walk(node, dep) {
    (levels[dep] = levels[dep] || []).push(node);
    if (node.children && node.children.length) node.children.forEach((c) => walk(c, dep + 1));
    else leaves.push(node);
  })({ label: v.root || "", children: v.children, isRoot: true }, 0);
  const D = levels.length - 1, W = 720, H = 480, fs_ = 18;
  const hasRes = leaves.some((l) => l.result);
  const resW = hasRes ? Math.min(180, Math.max(...leaves.map((l) => tw(l.result || "", 16))) + 14) : 0;
  const nodeW = levels.map((lv) => Math.min(150, Math.max(64, ...lv.map((n) => tw(n.label, fs_) + 24))));
  const gapX = (W - 20 - resW - nodeW.reduce((a, c) => a + c, 0)) / Math.max(1, D);
  const xs = [];
  let cx = 10;
  for (let k = 0; k <= D; k++) { xs.push(cx); cx += nodeW[k] + gapX; }
  const step = H / leaves.length, nh = Math.min(40, step * 0.72);
  leaves.forEach((l, i) => (l.y = step * (i + 0.5)));
  for (let k = D; k >= 0; k--) for (const n of levels[k]) if (n.children && n.children.length) n.y = n.children.reduce((a, c) => a + c.y, 0) / n.children.length;
  let lines = "", nodes = "";
  const node = (n, k, delay) => {
    nodes += `<g class="anim" ${d(delay)}><rect x="${xs[k]}" y="${n.y - nh / 2}" width="${nodeW[k]}" height="${nh}" rx="9" class="${n.isRoot ? "nd root" : "nd"}"/><text x="${xs[k] + nodeW[k] / 2}" y="${n.y + 6}" text-anchor="middle" class="${n.isRoot ? "ndt root" : "ndt"}">${esc(plain(n.label))}</text></g>`;
  };
  node(levels[0][0], 0, 0.1);
  for (let k = 1; k <= D; k++) {
    const delay = 0.1 + k * 0.55;
    for (const n of levels[k]) {
      const p = levels[k - 1].find((q) => q.children && q.children.includes(n));
      const x1 = xs[k - 1] + nodeW[k - 1], x2 = xs[k];
      lines += `<line x1="${x1}" y1="${p.y}" x2="${x2}" y2="${n.y}" class="edge draw" pathLength="1" ${d(delay - 0.35)}/>`;
      if (n.p) {
        const lx = x1 + (x2 - x1) * 0.6, ly = p.y + (n.y - p.y) * 0.6, w = tw(n.p, 15) + 10;
        lines += `<g class="anim" ${d(delay)}><rect x="${lx - w / 2}" y="${ly - 11}" width="${w}" height="22" rx="5" fill="#fff"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" class="prob">${esc(plain(n.p))}</text></g>`;
      }
      node(n, k, delay);
      if (k === D && n.result) nodes += `<text x="${xs[k] + nodeW[k] + 10}" y="${n.y + 6}" class="res anim" ${d(delay + 0.2)}>${esc(plain(n.result))}</text>`;
    }
  }
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="수형도">${lines}${nodes}</svg>`;
}

function grid(v) {
  const W = 620, H = 480, s = Math.min((W - 100) / v.w, (H - 80) / v.h);
  const gx = (W - s * v.w) / 2, gy = (H - s * v.h) / 2;
  let g = "";
  for (let i = 0; i <= v.w; i++) g += `<line x1="${gx + i * s}" y1="${gy}" x2="${gx + i * s}" y2="${gy + v.h * s}" class="gridl"/>`;
  for (let j = 0; j <= v.h; j++) g += `<line x1="${gx}" y1="${gy + j * s}" x2="${gx + v.w * s}" y2="${gy + j * s}" class="gridl"/>`;
  g += `<circle cx="${gx}" cy="${gy + v.h * s}" r="10" class="pt"/><text x="${gx - 18}" y="${gy + v.h * s + 8}" text-anchor="end" class="ptl">${esc(v.from || "A")}</text>`;
  g += `<circle cx="${gx + v.w * s}" cy="${gy}" r="10" class="pt"/><text x="${gx + v.w * s + 18}" y="${gy + 8}" class="ptl">${esc(v.to || "B")}</text>`;
  if (v.path) {
    let x = 0, y = 0, k = 0;
    for (const c of v.path) {
      const nx = x + (c === "R" ? 1 : 0), ny = y + (c === "U" ? 1 : 0);
      g += `<line x1="${gx + x * s}" y1="${gy + (v.h - y) * s}" x2="${gx + nx * s}" y2="${gy + (v.h - ny) * s}" class="route draw" pathLength="1" ${d(0.4 + k * 0.28)}/>`;
      x = nx; y = ny; k++;
    }
  }
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="격자 최단경로">${g}</svg>`;
}

function pascal(v) {
  const n = v.rows, W = 620, H = 480, dd = Math.min(H / n, W / n) * 0.92;
  const rows = [[1]];
  for (let i = 1; i < n; i++) { const p = rows[i - 1]; rows.push(p.map((_, j) => (j ? p[j - 1] + p[j] : 1)).concat(1)); }
  let g = "";
  rows.forEach((row, i) => {
    const y = (H - n * dd) / 2 + i * dd + dd / 2;
    row.forEach((val, j) => {
      const x = W / 2 + (j - i / 2) * dd;
      const hl = v.highlight === "odd" && val % 2 === 1;
      g += `<g class="anim" ${d(0.1 + i * 0.3)}><circle cx="${x}" cy="${y}" r="${dd * 0.44}" class="${hl ? "pc hl" : "pc"}"/><text x="${x}" y="${y + dd * 0.13}" text-anchor="middle" class="${hl ? "pct hl" : "pct"}" style="font-size:${Math.min(26, dd * (String(val).length > 2 ? 0.3 : 0.38))}px">${val}</text></g>`;
    });
  });
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="파스칼의 삼각형">${g}</svg>`;
}

function circle(v) {
  const W = 560, H = 500, n = v.items.length, R = 175, cx = W / 2, cy = H / 2;
  const sw = Math.max(70, Math.max(...v.items.map((t) => tw(t, 20))) + 30);
  let g = `<circle cx="${cx}" cy="${cy}" r="${R}" class="table anim" ${d(0.05)}/><text x="${cx}" y="${cy + 7}" text-anchor="middle" class="tk anim" ${d(0.3 + n * 0.2)}>↻ 회전해도 같은 배열</text>`;
  v.items.forEach((it, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    g += `<g class="anim pop" ${d(0.25 + i * 0.18)}><rect x="${x - sw / 2}" y="${y - 22}" width="${sw}" height="44" rx="22" class="${i === 0 ? "seat first" : "seat"}"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="seatt">${esc(plain(it))}</text></g>`;
  });
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="원형 배열: ${esc(v.items.map(plain).join(", "))}">${g}</svg>`;
}

function slots(v) {
  return `<div class="slots">${v.slots.map((s, i) => {
    const gap = s.top === "…";
    const box = gap ? `<div class="slot gap">…</div>` : `<div class="slot"><span>${md(s.top)}</span></div>`;
    const op = v.op && i < v.slots.length - 1 ? `<div class="op anim" ${d(0.2 + i * 0.25)}>${esc(v.op)}</div>` : "";
    return `<div class="slotc anim up" ${d(0.1 + i * 0.25)}>${box}<div class="slotl">${md(s.bottom || "")}</div></div>${op}`;
  }).join("")}</div>`;
}

function visual(v, st, big) {
  const k = v.kind;
  if (k === "bar") return `<div class="vis">${barChart(v)}</div>`;
  if (k === "line" || k === "area") return `<div class="vis">${lineChart(v, k === "area")}</div>`;
  if (k === "tree") return `<div class="vis">${tree(v)}</div>`;
  if (k === "grid") return `<div class="vis">${grid(v)}</div>`;
  if (k === "pascal") return `<div class="vis">${pascal(v)}</div>`;
  if (k === "circle") return `<div class="vis">${circle(v)}</div>`;
  if (k === "slots") return `<div class="vis">${slots(v)}</div>`;
  if (k === "formula") return `<div class="vis"><div class="formula anim up" ${d(0.1)}><div class="f-main">${md(v.text)}</div>${v.note ? `<div class="f-note">${md(v.note)}</div>` : ""}</div></div>`;
  if (k === "table") {
    const [head, ...rows] = v.rows;
    return `<div class="vis"><table class="tbl anim up" ${d(0.1)}><thead><tr>${head.map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (k === "image") {
    const src = v.name ? webImg(v.name) : figImg(v.fig);
    const c = v.name ? credit(v.name) : null;
    return `<div class="vis"><figure class="img anim" ${d(0.1)}><img src="${src}" alt="${esc(plain(v.alt || v.name || v.fig))}" loading="lazy">${c ? `<figcaption>사진: ${esc(c.author)} / ${esc(c.license)}</figcaption>` : ""}</figure></div>`;
  }
  if (k === "steps") {
    const n = v.figs.length;
    return `<div class="vis"><div class="steps n${n}">${v.figs.map((f, i) => {
      const fr = i === 0 ? ` class="anim" ${d(0.1)}` : st.attr(st.next());
      return `<figure${fr}><img src="${figImg(f)}" alt="${esc(plain(v.labels ? v.labels[i] : f))}" loading="lazy">${v.labels ? `<figcaption>${md(v.labels[i])}</figcaption>` : ""}</figure>`;
    }).join("")}</div></div>`;
  }
  throw new Error("알 수 없는 visual.kind: " + k);
}

// ── 슬라이드 종류별 HTML ────────────────────────────────────────
function header(title, wk) {
  return `<header class="sh"><h2>${md(title)}</h2><span class="chip">${wk.week}주차</span></header>`;
}
function bulletList(items, st, cls = "") {
  return `<ul class="bl ${cls}">${items.map((b) => `<li${st.attr(st.next())}>${md(b)}</li>`).join("")}</ul>`;
}

function slide(s, wk) {
  const st = new Steps();
  let cls = "s-" + s.type, inner = "";
  switch (s.type) {
    case "cover": {
      const bg = s.bg ? `<img class="bg" src="${coverImg(s.bg)}" alt=""><div class="fade"></div>` : "";
      inner = `${bg}<div class="cover-txt"><div class="num anim" ${d(0.1)}>${String(wk.week).padStart(2, "0")}</div><div class="eyebrow">${wk.week}주차</div><h1>${md(s.title)}</h1>${s.subtitle ? `<p class="sub">${md(s.subtitle)}</p>` : ""}<p class="course">${esc([COURSE.title, COURSE.audience].filter(Boolean).join(" · "))}</p></div>${s.bg ? `<p class="gen">이미지: Google Flow로 생성</p>` : ""}`;
      break;
    }
    case "section":
      inner = `<div class="deco a"></div><div class="deco b anim pop" ${d(0.2)}></div><div class="sec-txt"><div class="eyebrow">${wk.week}주차 · ${md(wk.title)}</div><h1>${md(s.title)}</h1>${s.sub ? `<p class="sub">${md(s.sub)}</p>` : ""}</div>`;
      break;
    case "goals":
      inner = `${header("학습목표", wk)}<div class="cards">${s.items.map((it, i) => `<div class="goal anim up" ${d(0.1 + i * 0.25)}><span class="gn">${i + 1}</span><p>${md(it)}</p></div>`).join("")}</div>`;
      break;
    case "bullets":
      inner = header(s.title, wk) + (s.visual
        ? `<div class="two"><div class="col-t">${bulletList(s.bullets, st)}</div><div class="col-v">${visual(s.visual, st)}</div></div>`
        : `<div class="one">${bulletList(s.bullets, st, "big")}</div>`);
      break;
    case "concept": {
      const f1 = st.next();
      let left = `<div class="term"${st.attr(f1)}><div class="term-h">${md(s.term)}</div><p>${md(s.def)}</p></div>`;
      if (s.formula) left += `<div class="fbox"${st.attr(st.next())}>${md(s.formula)}</div>`;
      if (s.note) left += `<p class="note"${s.formula ? st.attr(st.n) : st.attr(st.next())}>${md(s.note)}</p>`;
      inner = header(s.title, wk) + (s.visual ? `<div class="two"><div class="col-t">${left}</div><div class="col-v">${visual(s.visual, st)}</div></div>` : `<div class="one narrow">${left}</div>`);
      break;
    }
    case "example": {
      const tb = s.tag === "교과서";
      let left = `<span class="tag ${tb ? "tb" : "eng"}">${tb ? "교과서 예제" : "공학 예제"}</span><div class="prob">${md(s.problem)}</div><ol class="stp">${s.steps.map((x) => `<li${st.attr(st.next())}>${md(x)}</li>`).join("")}</ol><div class="ans"${st.attr(st.next())}>답 ${md(s.answer)}</div>`;
      const vis = s.visual ? visual(s.visual, st) : "";
      inner = header(s.title, wk) + (s.visual ? `<div class="two"><div class="col-t">${left}</div><div class="col-v">${vis}</div></div>` : `<div class="one">${left}</div>`);
      break;
    }
    case "visual":
      inner = `${header(s.title, wk)}<div class="big">${visual(s.visual, st, true)}</div>${s.caption ? `<p class="cap"${st.attr(st.next())}>${md(s.caption)}</p>` : ""}`;
      break;
    case "compare": {
      const card = (side, i) => `<div class="cmp ${i ? "r" : "l"}"${i ? st.attr(st.next()) : ` class="anim up" ${d(0.1)}`}><h3>${md(side.head)}</h3><ul>${side.items.map((x) => `<li>${md(x)}</li>`).join("")}</ul></div>`;
      inner = `${header(s.title, wk)}<div class="cmps">${card(s.left, 0)}${card(s.right, 1)}</div>`;
      break;
    }
    case "metaphor": {
      const c = credit(s.image);
      inner = `<figure class="mimg"><img src="${webImg(s.image)}" alt="${esc(plain(s.title))}">${c ? `<figcaption>사진: ${esc(c.author)} / ${esc(c.license)} / Wikimedia Commons</figcaption>` : ""}</figure><div class="mtxt"><span class="pill">비유</span><h2>${md(s.title)}</h2>${bulletList(s.lines, st)}</div>`;
      break;
    }
    case "stats":
      inner = `${header(s.title, wk)}<div class="stats">${s.items.map((it, i) => `<div class="stat"${i ? st.attr(st.next()) : ` class="anim up" ${d(0.1)}`}><div class="sv">${md(it.value)}</div><div class="sl">${md(it.label)}</div></div>`).join("")}</div>${s.note ? `<p class="cap"${st.attr(st.next())}>${md(s.note)}</p>` : ""}`;
      break;
    case "quiz":
      inner = `${header("확인 퀴즈", wk)}<div class="quiz">${s.questions.map((q, i) => `<div class="qrow"><span class="qn">Q${i + 1}</span><div><p class="qq">${md(q.q)}</p><p class="qa"${st.attr(st.next())}>→ ${md(q.a)}</p></div></div>`).join("")}</div>`;
      break;
    case "summary":
      inner = `<h2 class="sum-h">${wk.week}주차 정리</h2><div class="sums">${s.items.map((it, i) => `<div class="sum anim up" ${d(0.1 + i * 0.2)}><h3>${md(it.head)}</h3><p>${md(it.body)}</p></div>`).join("")}</div>${s.next ? `<p class="next"${st.attr(st.next())}>${md(s.next)}</p>` : ""}`;
      break;
    default:
      throw new Error(`${wk.week}주차: 알 수 없는 slide.type ${s.type}`);
  }
  // compare/stats 의 첫 카드는 class 속성이 두 번 들어가지 않도록 정리
  inner = inner.replace(/class="(cmp [lr]|stat)" class="anim up"/g, 'class="$1 anim up"').replace(/class="(cmp [lr]|stat)" class="frag"/g, 'class="$1 frag"');
  const dark = ["cover", "section", "summary"].includes(s.type) ? " dark" : "";
  return `<section class="slide ${cls}${dark}" data-steps="${st.n}" aria-roledescription="slide">${inner}</section>`;
}

function introSlide() {
  const i = COURSE.intro;
  return `<section class="slide s-intro dark" data-steps="0"><video class="bgv" src="../video/intro.mp4" poster="../video/intro_poster.jpg" muted loop playsinline preload="metadata" aria-label="강의 인트로 영상"></video><div class="vfade"></div>${i.caption ? `<p class="vcap anim up" ${d(0.6)}>${esc(i.caption)}</p>` : ""}<p class="gen">영상: Google Flow로 생성</p></section>`;
}

function creditsSlide(wk, webNames, hasCover) {
  const rows = webNames.map((n) => {
    const c = credit(n) || {};
    return `<tr><td>${esc(c.title ? c.title.replace(/\.(jpe?g|png)$/i, "") : n)}</td><td>${esc(c.author || "?")}</td><td>${esc(c.license || "?")}</td></tr>`;
  }).join("");
  const gen = (hasCover ? `<tr><td>주차 표지 이미지${wk.week === 1 && COURSE.intro ? ", 인트로 영상" : ""}</td><td>Google Flow로 생성</td><td>AI 생성</td></tr>` : "");
  return `<section class="slide s-credits" data-steps="0">${header("이미지 출처", wk)}<div class="credits"><table class="tbl"><thead><tr><th>자료</th><th>작가</th><th>라이선스</th></tr></thead><tbody>${gen}${rows}</tbody></table><p class="cap">사진: Wikimedia Commons의 자유 라이선스 이미지 · 그래프: 직접 계산해 그림</p></div></section>`;
}

// ── 페이지 ──────────────────────────────────────────────────────
const CSS = fs.readFileSync(path.join(__dirname, "deck.css"), "utf8");
const JS = fs.readFileSync(path.join(__dirname, "deck.js"), "utf8");

function page(wk, slidesHtml, total) {
  const prev = wk.week > 1 ? `week${String(wk.week - 1).padStart(2, "0")}.html` : null;
  const next = wk.week < 10 ? `week${String(wk.week + 1).padStart(2, "0")}.html` : null;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${wk.week}주차 ${esc(plain(wk.title))} · ${esc(COURSE.title)}</title>
<link rel="stylesheet" href="../assets/theme.css">
<style>${CSS}</style>
</head>
<body class="deck-page">
<nav class="site-nav"><a class="brand" href="../index.html">확률과 통계</a><a class="nav-link" href="../index.html">강의 목록</a><a class="nav-link" href="../quiz.html">퀴즈</a><a class="nav-link" href="../playground.html">애니메이션 놀이터</a></nav>
<main class="viewport" aria-label="${wk.week}주차 슬라이드">
<div class="stage" id="stage">
${slidesHtml}
</div>
</main>
<div class="controls">
<a class="cbtn" ${prev ? `href="${prev}"` : 'aria-disabled="true"'} title="이전 주차">«</a>
<button class="cbtn" id="prevBtn" aria-label="이전">‹</button>
<span id="counter" aria-live="polite">1 / ${total}</span>
<button class="cbtn" id="nextBtn" aria-label="다음">›</button>
<a class="cbtn" ${next ? `href="${next}"` : 'aria-disabled="true"'} title="다음 주차">»</a>
<button class="cbtn" id="fsBtn" aria-label="전체 화면 (F)">⛶</button>
</div>
<div class="progress"><div id="bar"></div></div>
<script>${JS}</script>
</body>
</html>`;
}

function main() {
  const files = fs.readdirSync(path.join(TOOL, "content")).filter((f) => /^week\d+\.js$/.test(f)).sort();
  const weeks = files.map((f) => require(path.join(TOOL, "content", f)));
  fs.mkdirSync(path.join(DOCS, "weeks"), { recursive: true });
  const index = [];
  for (const wk of weeks) {
    const before = new Set(used.web);
    const parts = [];
    if (wk.week === 1 && COURSE.intro) parts.push(introSlide());
    wk.slides.forEach((s, i) => {
      try { parts.push(slide(s, wk)); } catch (e) { throw new Error(`${wk.week}주차 ${i + 1}번째 슬라이드(${s.type}): ${e.message}`); }
    });
    // 이 주차에서 쓴 인터넷 사진만 출처에 표기
    const deckWeb = [];
    const html0 = parts.join("\n");
    for (const n of used.web) if (html0.includes(enc(`../img/web/${n}.jpg`))) deckWeb.push(n);
    const hasCover = wk.slides.some((s) => s.type === "cover" && s.bg);
    parts.push(creditsSlide(wk, deckWeb, hasCover));
    const file = `week${String(wk.week).padStart(2, "0")}.html`;
    fs.writeFileSync(path.join(DOCS, "weeks", file), page(wk, parts.join("\n"), parts.length));
    const cover = wk.slides.find((s) => s.type === "cover") || {};
    index.push({ week: wk.week, title: plain(wk.title), subtitle: plain(cover.subtitle || ""), slides: parts.length, file: `weeks/${file}`, cover: cover.bg ? `img/cover/${cover.bg}.jpg` : null });
    console.log(`${file}: 슬라이드 ${parts.length}장 (내용 ${wk.slides.length} + ${parts.length - wk.slides.length})`);
  }
  copyAssets();
  fs.writeFileSync(path.join(DOCS, "weeks.json"), JSON.stringify({ course: { title: COURSE.title, audience: COURSE.audience, tagline: COURSE.tagline }, weeks: index }, null, 2));
  console.log("완료: docs/weeks.json, 이미지", used.web.size + used.fig.size + used.cover.size, "개");
}
main();
