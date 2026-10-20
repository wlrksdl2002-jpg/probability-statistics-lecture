/* miniman.js — 브라우저에서 돌아가는 아주 작은 Manim 흉내 엔진
 * 좌표: 화면 가운데가 원점, 위쪽이 +y. 화면 크기 약 14.2 × 8 단위 (Manim과 같은 비율)
 * 사용: async function construct(scene) { const c = Circle(1); await scene.play(Create(c)); }
 */
(function (root) {
  "use strict";

  const W = 1280, H = 720, UNIT = 90;
  const FRAME_W = W / UNIT, FRAME_H = H / UNIT;
  const FONT = '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const BG = "#14112E";
  const COLORS = {
    WHITE: "#F6F5FB", BLACK: "#14112E", GRAY: "#8E8BA8", LIGHT_GRAY: "#CFCBEF", DARK_GRAY: "#4A4766",
    YELLOW: "#FFD15C", GOLD: "#FFB627", CORAL: "#FF6B4A", ORANGE: "#FF9F43", RED: "#FF5A6E",
    TEAL: "#2EC4B6", GREEN: "#5BD18B", BLUE: "#6C8CFF", PURPLE: "#A98BFF", PINK: "#FF8FB1", INK: "#26215C",
  };
  const PI = Math.PI, TAU = 2 * Math.PI;
  const UP = [0, 1], DOWN = [0, -1], LEFT = [-1, 0], RIGHT = [1, 0], ORIGIN = [0, 0];
  const UL = [-1, 1], UR = [1, 1], DL = [-1, -1], DR = [1, -1];

  // ── 색 ────────────────────────────────────────────────
  function parseColor(c) {
    if (Array.isArray(c)) return c;
    c = COLORS[c] || c || "#FFFFFF";
    if (c[0] === "#") {
      let h = c.slice(1);
      if (h.length === 3) h = h.split("").map((x) => x + x).join("");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = String(c).match(/\d+(\.\d+)?/g);
    return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
  }
  const toCss = (c, a = 1) => { const p = parseColor(c); return `rgba(${p[0] | 0},${p[1] | 0},${p[2] | 0},${a})`; };
  function lerpColor(a, b, t) {
    const A = parseColor(a), B = parseColor(b);
    return "#" + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0")).join("");
  }

  // ── 속도 곡선 ─────────────────────────────────────────
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const linear = (t) => t;
  const smooth = (t) => t * t * t * (10 - 15 * t + 6 * t * t);
  const thereAndBack = (t) => smooth(t < 0.5 ? 2 * t : 2 - 2 * t);
  const rushInto = (t) => 2 * smooth(t / 2);
  const rushFrom = (t) => 2 * smooth(t / 2 + 0.5) - 1;

  // ── 좌표 도우미 ───────────────────────────────────────
  const w2c = (p) => [W / 2 + p[0] * UNIT, H / 2 - p[1] * UNIT];
  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return pts.length ? [x0, y0, x1, y1] : [0, 0, 0, 0];
  }
  function toPoint(p) {
    if (p instanceof Mobject) return p.getCenter();
    if (Array.isArray(p)) return [Number(p[0]) || 0, Number(p[1]) || 0];
    throw new Error("좌표는 [x, y] 형태나 도형이어야 함: " + p);
  }
  const clone = (v) => (Array.isArray(v) ? v.map(clone) : v);

  // ── 글자 폭 측정 ──────────────────────────────────────
  let measureCtx = null;
  function measure(text, px, weight) {
    if (measureCtx === null) {
      try { measureCtx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : false; } catch (e) { measureCtx = false; }
    }
    if (measureCtx) { measureCtx.font = `${weight} ${px}px ${FONT}`; return measureCtx.measureText(text).width; }
    let em = 0;
    for (const ch of text) em += /[ㄱ-힣]/.test(ch) ? 1 : 0.6;
    return em * px;
  }

  // ── 도형 기본 클래스 ──────────────────────────────────
  let ID = 0;
  class Mobject {
    constructor(opts = {}) {
      this.id = ++ID;
      this.pos = [0, 0]; this.rotation = 0; this.sx = 1; this.sy = 1; this.opacity = 1;
      this.strokeColor = opts.color || opts.strokeColor || COLORS.WHITE;
      this.fillColor = opts.fillColor || opts.color || COLORS.WHITE;
      this.fillOpacity = opts.fillOpacity ?? 0;
      this.strokeWidth = opts.strokeWidth ?? 4;
      this.create = 1;
      this.children = [];
    }
    get keys() { return ["pos", "rotation", "sx", "sy", "opacity", "strokeColor", "fillColor", "fillOpacity", "strokeWidth", "create", ...this.extraKeys()]; }
    extraKeys() { return []; }
    family() { return [this]; }
    localBounds() { return [0, 0, 0, 0]; }
    toWorld(p) {
      const c = Math.cos(this.rotation), s = Math.sin(this.rotation);
      const x = p[0] * this.sx, y = p[1] * this.sy;
      return [this.pos[0] + x * c - y * s, this.pos[1] + x * s + y * c];
    }
    getBounds() {
      const [x0, y0, x1, y1] = this.localBounds();
      return bboxOf([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((p) => this.toWorld(p)));
    }
    getCenter() { const b = this.getBounds(); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
    get width() { const b = this.getBounds(); return b[2] - b[0]; }
    get height() { const b = this.getBounds(); return b[3] - b[1]; }
    getTop() { const b = this.getBounds(); return [(b[0] + b[2]) / 2, b[3]]; }
    getBottom() { const b = this.getBounds(); return [(b[0] + b[2]) / 2, b[1]]; }
    getLeft() { const b = this.getBounds(); return [b[0], (b[1] + b[3]) / 2]; }
    getRight() { const b = this.getBounds(); return [b[2], (b[1] + b[3]) / 2]; }

    shift(dx, dy) {
      if (Array.isArray(dx)) { dy = dx[1]; dx = dx[0]; }
      this.pos = [this.pos[0] + (dx || 0), this.pos[1] + (dy || 0)];
      return this;
    }
    moveTo(p) { const t = toPoint(p), c = this.getCenter(); return this.shift(t[0] - c[0], t[1] - c[1]); }
    scale(f, about) {
      about = about ? toPoint(about) : this.pos;
      this.sx *= f; this.sy *= f;
      this.pos = [about[0] + (this.pos[0] - about[0]) * f, about[1] + (this.pos[1] - about[1]) * f];
      return this;
    }
    stretch(fx, fy, about) {
      about = about ? toPoint(about) : this.pos;
      this.sx *= fx; this.sy *= fy;
      this.pos = [about[0] + (this.pos[0] - about[0]) * fx, about[1] + (this.pos[1] - about[1]) * fy];
      return this;
    }
    rotate(a, about, upright) {
      about = about ? toPoint(about) : this.pos;
      const c = Math.cos(a), s = Math.sin(a), dx = this.pos[0] - about[0], dy = this.pos[1] - about[1];
      this.pos = [about[0] + dx * c - dy * s, about[1] + dx * s + dy * c];
      if (!upright) this.rotation += a;
      return this;
    }
    setColor(c) { this.strokeColor = c; if (this.fillOpacity > 0) this.fillColor = c; return this; }
    setFill(c, op = 1) { if (c) this.fillColor = c; this.fillOpacity = op; return this; }
    setStroke(c, w) { if (c) this.strokeColor = c; if (w != null) this.strokeWidth = w; return this; }
    setOpacity(o) { this.opacity = o; return this; }
    nextTo(target, dir = RIGHT, buff = 0.25) {
      const b = target instanceof Mobject ? target.getBounds() : (() => { const p = toPoint(target); return [p[0], p[1], p[0], p[1]]; })();
      const me = this.getBounds(), hw = (me[2] - me[0]) / 2, hh = (me[3] - me[1]) / 2;
      let x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2;
      if (dir[0] > 0) x = b[2] + buff + hw; else if (dir[0] < 0) x = b[0] - buff - hw;
      if (dir[1] > 0) y = b[3] + buff + hh; else if (dir[1] < 0) y = b[1] - buff - hh;
      return this.moveTo([x, y]);
    }
    toEdge(dir = UP, buff = 0.5) {
      const me = this.getBounds(), c = this.getCenter();
      let x = c[0], y = c[1];
      if (dir[0] > 0) x = FRAME_W / 2 - buff - (me[2] - me[0]) / 2; else if (dir[0] < 0) x = -FRAME_W / 2 + buff + (me[2] - me[0]) / 2;
      if (dir[1] > 0) y = FRAME_H / 2 - buff - (me[3] - me[1]) / 2; else if (dir[1] < 0) y = -FRAME_H / 2 + buff + (me[3] - me[1]) / 2;
      return this.moveTo([x, y]);
    }
    toCorner(dir = UL, buff = 0.5) { return this.toEdge(dir, buff); }
    copy() {
      const o = Object.create(Object.getPrototypeOf(this));
      for (const k of Object.keys(this)) {
        const v = this[k];
        if (k === "children") o.children = v.map((c) => c.copy());
        else if (v instanceof Mobject) o[k] = v; // 참조는 그대로 (복사 후 재연결은 하위 클래스에서)
        else o[k] = clone(v);
      }
      o.id = ++ID;
      if (o._relink) o._relink(this);
      return o;
    }
    get animate() { return makeBuilder(this); }
    draw() {}
  }

  // 선·면으로 그리는 도형
  class VMobject extends Mobject {
    closed() { return true; }
    path() {}
    perimeter() { return 1; }
    _lw(base) { const s = Math.max(1e-3, (Math.abs(this.sx) + Math.abs(this.sy)) / 2); return (base * 0.75) / (UNIT * s); }
    draw(ctx, a) {
      if (this.create <= 0) return;
      ctx.save();
      const [X, Y] = w2c(this.pos);
      ctx.translate(X, Y); ctx.rotate(-this.rotation);
      ctx.scale(UNIT * (this.sx || 1e-4), -UNIT * (this.sy || 1e-4));
      ctx.beginPath(); this.path(ctx);
      const cr = this.create;
      if (this.fillOpacity > 0 && this.closed()) {
        const fa = this.fillOpacity * a * clamp01((cr - 0.35) / 0.65);
        if (fa > 0) { ctx.fillStyle = toCss(this.fillColor, fa); ctx.fill(); }
      }
      if (this.strokeWidth > 0) {
        ctx.lineWidth = this._lw(this.strokeWidth);
        ctx.strokeStyle = toCss(this.strokeColor, a);
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        if (cr < 1) { const L = this.perimeter(); ctx.setLineDash([L * cr, L + 1]); }
        else if (this.dashed) ctx.setLineDash(this.dashed);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  class Circle extends VMobject {
    constructor(r = 1, opts = {}) {
      if (typeof r === "object") { opts = r; r = opts.radius ?? 1; }
      super({ color: COLORS.CORAL, ...opts }); this.r = r;
    }
    extraKeys() { return ["r"]; }
    path(ctx) { ctx.moveTo(this.r, 0); ctx.arc(0, 0, this.r, 0, TAU); }
    perimeter() { return TAU * this.r; }
    localBounds() { return [-this.r, -this.r, this.r, this.r]; }
  }
  class Dot extends Circle {
    constructor(p = [0, 0], opts = {}) {
      if (!Array.isArray(p) && !(p instanceof Mobject)) { opts = p || {}; p = [0, 0]; }
      super(opts.radius ?? 0.08, { color: COLORS.WHITE, fillOpacity: 1, strokeWidth: 0, ...opts });
      this.moveTo(p);
    }
  }
  class Rectangle extends VMobject {
    constructor(w = 2, h = 1, opts = {}) {
      if (typeof w === "object") { opts = w; w = opts.width ?? 2; h = opts.height ?? 1; }
      super({ color: COLORS.BLUE, ...opts }); this.w = w; this.h = h; this.cornerRadius = opts.cornerRadius || 0;
    }
    extraKeys() { return ["w", "h"]; }
    path(ctx) {
      const w = this.w, h = this.h, r = Math.min(this.cornerRadius, Math.abs(w) / 2, Math.abs(h) / 2);
      if (!r) { ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(-w / 2, -h / 2); ctx.closePath(); return; }
      ctx.moveTo(-w / 2 + r, h / 2); ctx.arcTo(w / 2, h / 2, w / 2, -h / 2, r); ctx.arcTo(w / 2, -h / 2, -w / 2, -h / 2, r);
      ctx.arcTo(-w / 2, -h / 2, -w / 2, h / 2, r); ctx.arcTo(-w / 2, h / 2, w / 2, h / 2, r); ctx.closePath();
    }
    perimeter() { return 2 * (Math.abs(this.w) + Math.abs(this.h)); }
    localBounds() { return [-this.w / 2, -this.h / 2, this.w / 2, this.h / 2]; }
  }
  class Square extends Rectangle {
    constructor(s = 2, opts = {}) { if (typeof s === "object") { opts = s; s = opts.side ?? 2; } super(s, s, opts); }
  }
  class RoundedRectangle extends Rectangle {
    constructor(w = 2, h = 1, opts = {}) { super(w, h, { cornerRadius: 0.2, ...opts }); }
  }

  class Line extends VMobject {
    constructor(start = [-1, 0], end = [1, 0], opts = {}) {
      super({ color: COLORS.WHITE, ...opts });
      this.dashed = opts.dashed ? [0.12, 0.09] : null;
      this.setEnds(start, end);
    }
    extraKeys() { return ["a", "b"]; }
    setEnds(s, e) {
      s = toPoint(s); e = toPoint(e);
      this.pos = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2]; this.rotation = 0; this.sx = 1; this.sy = 1;
      this.a = [s[0] - this.pos[0], s[1] - this.pos[1]]; this.b = [-this.a[0], -this.a[1]];
      return this;
    }
    getStart() { return this.toWorld(this.a); }
    getEnd() { return this.toWorld(this.b); }
    closed() { return false; }
    path(ctx) { ctx.moveTo(this.a[0], this.a[1]); ctx.lineTo(this.b[0], this.b[1]); }
    perimeter() { return Math.hypot(this.b[0] - this.a[0], this.b[1] - this.a[1]) || 1e-6; }
    localBounds() { const b = bboxOf([this.a, this.b]); return [b[0] - 0.02, b[1] - 0.02, b[2] + 0.02, b[3] + 0.02]; }
  }
  class DashedLine extends Line { constructor(s, e, opts = {}) { super(s, e, { ...opts, dashed: true }); } }
  class Arrow extends Line {
    constructor(start = [-1, 0], end = [1, 0], opts = {}) { super(start, end, { color: COLORS.WHITE, ...opts }); this.tip = opts.tipLength ?? 0.25; }
    path(ctx) {
      const L = this.perimeter(), t = Math.min(this.tip, L * 0.5) / L;
      ctx.moveTo(this.a[0], this.a[1]);
      ctx.lineTo(this.b[0] - (this.b[0] - this.a[0]) * t * 0.9, this.b[1] - (this.b[1] - this.a[1]) * t * 0.9);
    }
    draw(ctx, a) {
      super.draw(ctx, a);
      if (this.create < 0.85) return;
      const L = this.perimeter(), ux = (this.b[0] - this.a[0]) / L, uy = (this.b[1] - this.a[1]) / L;
      const tl = Math.min(this.tip, L * 0.5), hw = tl * 0.55;
      const bx = this.b[0] - ux * tl, by = this.b[1] - uy * tl;
      ctx.save();
      const [X, Y] = w2c(this.pos);
      ctx.translate(X, Y); ctx.rotate(-this.rotation); ctx.scale(UNIT * (this.sx || 1e-4), -UNIT * (this.sy || 1e-4));
      ctx.beginPath(); ctx.moveTo(this.b[0], this.b[1]); ctx.lineTo(bx - uy * hw, by + ux * hw); ctx.lineTo(bx + uy * hw, by - ux * hw); ctx.closePath();
      ctx.fillStyle = toCss(this.strokeColor, a * clamp01((this.create - 0.85) / 0.15)); ctx.fill();
      ctx.restore();
    }
  }

  class Polyline extends VMobject {
    constructor(points = [], opts = {}) { super({ color: COLORS.BLUE, ...opts }); this.isClosed = !!opts.closed; this.setPoints(points); }
    extraKeys() { return ["pts"]; }
    setPoints(world) {
      const P = world.map(toPoint);
      const b = bboxOf(P.length ? P : [[0, 0]]);
      this.pos = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; this.rotation = 0; this.sx = 1; this.sy = 1;
      this.pts = P.map((p) => [p[0] - this.pos[0], p[1] - this.pos[1]]);
      return this;
    }
    getPoints() { return this.pts.map((p) => this.toWorld(p)); }
    closed() { return this.isClosed; }
    path(ctx) {
      if (!this.pts.length) return;
      ctx.moveTo(this.pts[0][0], this.pts[0][1]);
      for (let i = 1; i < this.pts.length; i++) ctx.lineTo(this.pts[i][0], this.pts[i][1]);
      if (this.isClosed) ctx.closePath();
    }
    perimeter() {
      let L = 0;
      for (let i = 1; i < this.pts.length; i++) L += Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1]);
      if (this.isClosed && this.pts.length > 1) { const p = this.pts[0], q = this.pts[this.pts.length - 1]; L += Math.hypot(p[0] - q[0], p[1] - q[1]); }
      return L || 1e-6;
    }
    localBounds() { return bboxOf(this.pts.length ? this.pts : [[0, 0]]); }
  }
  class Polygon extends Polyline { constructor(points = [], opts = {}) { super(points, { color: COLORS.TEAL, ...opts, closed: true }); } }
  class RegularPolygon extends Polygon {
    constructor(n = 6, r = 1, opts = {}) { super(Array.from({ length: n }, (_, i) => [r * Math.cos(PI / 2 + (TAU * i) / n), r * Math.sin(PI / 2 + (TAU * i) / n)]), opts); }
  }
  class Triangle extends RegularPolygon { constructor(r = 1, opts = {}) { super(3, r, opts); } }

  // ── 글자 ─────────────────────────────────────────────
  class Text extends Mobject {
    constructor(text = "", opts = {}) {
      super({ color: COLORS.WHITE, ...opts, strokeWidth: 0 });
      this.fillOpacity = 1;
      this.text = String(text);
      this.size = opts.size ?? 0.5;
      this.weight = opts.weight ?? (opts.bold ? 700 : 500);
      this.textLike = true;
    }
    extraKeys() { return ["size", "text"]; }
    runs() { return [{ t: this.text, k: 0 }]; }
    _layout(px) {
      let x = 0; const out = [];
      for (const r of this.runs()) {
        const f = r.k ? px * 0.62 : px, w = measure(r.t, f, this.weight);
        out.push({ ...r, x, w, f, dy: r.k === 1 ? -px * 0.36 : r.k === 2 ? px * 0.24 : 0 });
        x += w;
      }
      return { runs: out, width: x };
    }
    localBounds() { const w = this._layout(this.size * UNIT).width / UNIT / 2, h = this.size * 0.62; return [-w, -h, w, h]; }
    setText(t) { this.text = String(t); return this; }
    setColor(c) { this.fillColor = c; this.strokeColor = c; return this; }
    draw(ctx, a) {
      if (this.create <= 0) return;
      const s = (Math.abs(this.sx) + Math.abs(this.sy)) / 2, px = this.size * UNIT * s;
      if (px < 0.5) return;
      const L = this._layout(px), [X, Y] = w2c(this.pos);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(-this.rotation);
      if (this.create < 1) { ctx.beginPath(); ctx.rect(-L.width / 2 - 2, -px * 1.2, (L.width + 4) * this.create, px * 2.4); ctx.clip(); }
      ctx.fillStyle = toCss(this.fillColor, a); ctx.textBaseline = "middle"; ctx.textAlign = "left";
      for (const r of L.runs) { ctx.font = `${this.weight} ${r.f}px ${FONT}`; ctx.fillText(r.t, -L.width / 2 + r.x, r.dy + px * 0.04); }
      ctx.restore();
    }
  }
  // ^{위첨자}, _{아래첨자}, ^2, _n 을 해석하는 수식용 글자
  class MathText extends Text {
    runs() {
      const out = [], re = /\^\{([^}]*)\}|_\{([^}]*)\}|\^(\w)|_(\w)/g;
      let last = 0, m;
      while ((m = re.exec(this.text))) {
        if (m.index > last) out.push({ t: this.text.slice(last, m.index), k: 0 });
        const sup = m[1] ?? m[3], sub = m[2] ?? m[4];
        if (sup != null) out.push({ t: sup, k: 1 }); else out.push({ t: sub, k: 2 });
        last = m.index + m[0].length;
      }
      if (last < this.text.length) out.push({ t: this.text.slice(last), k: 0 });
      return out.length ? out : [{ t: "", k: 0 }];
    }
  }

  // ── 묶음 ─────────────────────────────────────────────
  class VGroup extends Mobject {
    constructor(...ms) { super(); this.isGroup = true; this.children = ms.flat().filter(Boolean); }
    get keys() { return ["opacity"]; }
    get length() { return this.children.length; }
    [Symbol.iterator]() { return this.children[Symbol.iterator](); }
    add(...ms) { this.children.push(...ms.flat().filter(Boolean)); return this; }
    remove(...ms) { this.children = this.children.filter((c) => !ms.includes(c)); return this; }
    family() { return this.children.flatMap((c) => c.family()); }
    getBounds() {
      if (!this.children.length) return [0, 0, 0, 0];
      const bs = this.children.map((c) => c.getBounds());
      return [Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])), Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))];
    }
    shift(dx, dy) { if (Array.isArray(dx)) { dy = dx[1]; dx = dx[0]; } this.children.forEach((c) => c.shift(dx, dy)); return this; }
    scale(f, about) { about = about ? toPoint(about) : this.getCenter(); this.children.forEach((c) => c.scale(f, about)); return this; }
    stretch(fx, fy, about) { about = about ? toPoint(about) : this.getCenter(); this.children.forEach((c) => c.stretch(fx, fy, about)); return this; }
    rotate(a, about, upright) { about = about ? toPoint(about) : this.getCenter(); this.children.forEach((c) => c.rotate(a, about, upright)); return this; }
    setColor(c) { this.children.forEach((ch) => ch.setColor(c)); return this; }
    setFill(c, o) { this.children.forEach((ch) => ch.setFill(c, o)); return this; }
    setStroke(c, w) { this.children.forEach((ch) => ch.setStroke(c, w)); return this; }
    arrange(dir = RIGHT, buff = 0.25) {
      const c = this.getCenter();
      for (let i = 1; i < this.children.length; i++) this.children[i].nextTo(this.children[i - 1], dir, buff);
      return this.moveTo(c);
    }
    arrangeInGrid(rows, cols, buff = 0.3) {
      const n = this.children.length;
      cols = cols || Math.ceil(n / (rows || Math.ceil(Math.sqrt(n))));
      const cw = Math.max(...this.children.map((m) => m.width)) + buff, ch = Math.max(...this.children.map((m) => m.height)) + buff;
      const r = Math.ceil(n / cols), c0 = this.getCenter();
      this.children.forEach((m, i) => m.moveTo([(i % cols - (cols - 1) / 2) * cw, ((r - 1) / 2 - Math.floor(i / cols)) * ch]));
      return this.moveTo(c0);
    }
  }

  // ── 축·수직선·막대그래프 ──────────────────────────────
  const fmtNum = (x) => String(Math.round(x * 1000) / 1000);
  class NumberLine extends VGroup {
    constructor(opts = {}) {
      super();
      const { xRange = [-5, 5, 1], length = 10, color = COLORS.GRAY, includeNumbers = true, numberSize = 0.3 } = opts;
      this.xRange = xRange;
      this.line = new Line([-length / 2, 0], [length / 2, 0], { color, strokeWidth: 3 });
      this.add(this.line);
      const [a, b, st] = xRange;
      for (let x = a, k = 0; x <= b + 1e-9 && k < 80; x += st, k++) {
        const px = -length / 2 + ((x - a) / (b - a)) * length;
        this.add(new Line([px, -0.08], [px, 0.08], { color, strokeWidth: 3 }));
        if (includeNumbers) this.add(new Text(fmtNum(x), { size: numberSize, color: COLORS.LIGHT_GRAY }).moveTo([px, -0.35]));
      }
    }
    _relink(src) { this.line = this.children[src.children.indexOf(src.line)]; }
    n2p(x) {
      const s = this.line.getStart(), e = this.line.getEnd(), t = (x - this.xRange[0]) / (this.xRange[1] - this.xRange[0]);
      return [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t];
    }
  }

  class Axes extends VGroup {
    constructor(opts = {}) {
      super();
      const { xRange = [-5, 5, 1], yRange = [-3, 3, 1], width = 10, height = 5.5, color = COLORS.GRAY,
        includeNumbers = true, numberSize = 0.26, tips = true, xLabel, yLabel, xNumbers, yNumbers } = opts;
      this.xRange = xRange; this.yRange = yRange;
      const xo = 0 >= yRange[0] && 0 <= yRange[1] ? 0 : yRange[0];
      const yo = 0 >= xRange[0] && 0 <= xRange[1] ? 0 : xRange[0];
      const X = (x) => -width / 2 + ((x - xRange[0]) / (xRange[1] - xRange[0])) * width;
      const Y = (y) => -height / 2 + ((y - yRange[0]) / (yRange[1] - yRange[0])) * height;
      const L = tips ? Arrow : Line;
      this.xAxis = new L([X(xRange[0]), Y(xo)], [X(xRange[1]), Y(xo)], { color, strokeWidth: 3, tipLength: 0.18 });
      this.yAxis = new L([X(yo), Y(yRange[0])], [X(yo), Y(yRange[1])], { color, strokeWidth: 3, tipLength: 0.18 });
      this.add(this.xAxis, this.yAxis);
      const ticks = (r, f) => { const out = []; for (let v = r[0], k = 0; v <= r[1] + 1e-9 && k < 60; v += r[2], k++) out.push(v); return out.filter(f); };
      if (xRange[2]) for (const x of ticks(xRange, (x) => Math.abs(x - yo) > 1e-9 || yo === xRange[0])) {
        this.add(new Line([X(x), Y(xo) - 0.07], [X(x), Y(xo) + 0.07], { color, strokeWidth: 2 }));
        if (includeNumbers && xNumbers !== false) this.add(new Text(fmtNum(x), { size: numberSize, color: COLORS.LIGHT_GRAY }).moveTo([X(x), Y(xo) - 0.32]));
      }
      if (yRange[2]) for (const y of ticks(yRange, (y) => Math.abs(y - xo) > 1e-9)) {
        this.add(new Line([X(yo) - 0.07, Y(y)], [X(yo) + 0.07, Y(y)], { color, strokeWidth: 2 }));
        if (includeNumbers && yNumbers !== false) { const t = new Text(fmtNum(y), { size: numberSize, color: COLORS.LIGHT_GRAY }); t.moveTo([X(yo) - 0.15 - t.width / 2, Y(y)]); this.add(t); }
      }
      if (xLabel) this.add(new MathText(xLabel, { size: 0.32, color: COLORS.LIGHT_GRAY }).moveTo([X(xRange[1]) + 0.1, Y(xo) - 0.65]));
      if (yLabel) this.add(new MathText(yLabel, { size: 0.32, color: COLORS.LIGHT_GRAY }).moveTo([X(yo), Y(yRange[1]) + 0.35]));
    }
    _relink(src) { this.xAxis = this.children[src.children.indexOf(src.xAxis)]; this.yAxis = this.children[src.children.indexOf(src.yAxis)]; }
    c2p(x, y) {
      const s = this.xAxis.getStart(), e = this.xAxis.getEnd(), ys = this.yAxis.getStart(), ye = this.yAxis.getEnd();
      const tx = (x - this.xRange[0]) / (this.xRange[1] - this.xRange[0]), ty = (y - this.yRange[0]) / (this.yRange[1] - this.yRange[0]);
      return [s[0] + (e[0] - s[0]) * tx, ys[1] + (ye[1] - ys[1]) * ty];
    }
    _clampY(y) { return Math.min(this.yRange[1], Math.max(this.yRange[0], y)); }
    plot(fn, opts = {}) {
      const [a, b] = opts.xRange || [this.xRange[0], this.xRange[1]], n = opts.samples || 160, pts = [];
      for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, y = fn(x); if (Number.isFinite(y)) pts.push(this.c2p(x, this._clampY(y))); }
      return new Polyline(pts, { color: opts.color || COLORS.YELLOW, strokeWidth: opts.strokeWidth ?? 5 });
    }
    area(fn, a, b, opts = {}) {
      const n = opts.samples || 100, base = this._clampY(0), top = [];
      for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; top.push(this.c2p(x, this._clampY(fn(x)))); }
      return new Polygon([this.c2p(a, base), ...top, this.c2p(b, base)], { color: opts.color || COLORS.TEAL, fillOpacity: opts.opacity ?? 0.55, strokeWidth: 0 });
    }
    vLine(x, y, opts = {}) { return new Line(this.c2p(x, this._clampY(0)), this.c2p(x, y), { color: COLORS.LIGHT_GRAY, strokeWidth: 3, dashed: true, ...opts }); }
    hLine(y, opts = {}) { return new Line(this.c2p(this.xRange[0], y), this.c2p(this.xRange[1], y), { color: COLORS.LIGHT_GRAY, strokeWidth: 3, dashed: true, ...opts }); }
  }

  class BarChart extends VGroup {
    constructor(values = [], opts = {}) {
      super();
      const { width = 9, height = 4.5, maxValue, labels, color = COLORS.TEAL, colors, barGap = 0.2, labelSize = 0.26, axisColor = COLORS.GRAY } = opts;
      this.n = values.length; this.maxValue = maxValue ?? Math.max(1e-9, ...values);
      this.Hc = height; this.Wc = width; this.slot = width / Math.max(1, this.n);
      this.baseline = new Line([-width / 2 - 0.1, -height / 2], [width / 2 + 0.1, -height / 2], { color: axisColor, strokeWidth: 3 });
      this.add(this.baseline);
      this.bars = values.map((v, i) => {
        const h = Math.max(1e-4, (v / this.maxValue) * height);
        const r = new Rectangle(this.slot * (1 - barGap), h, { color: colors ? colors[i % colors.length] : color, fillOpacity: 0.9, strokeWidth: 0 });
        return r.moveTo([-width / 2 + (i + 0.5) * this.slot, -height / 2 + h / 2]);
      });
      this.add(...this.bars);
      if (labels) {
        const step = Math.ceil(this.n / 14);
        labels.forEach((l, i) => { if (i % step === 0) this.add(new Text(l, { size: labelSize, color: COLORS.LIGHT_GRAY }).moveTo([-width / 2 + (i + 0.5) * this.slot, -height / 2 - 0.3])); });
      }
    }
    _relink(src) { this.baseline = this.children[src.children.indexOf(src.baseline)]; this.bars = src.bars.map((b) => this.children[src.children.indexOf(b)]); }
    setValues(values) {
      const s = this.baseline.getStart(), e = this.baseline.getEnd(), k = (e[0] - s[0]) / (this.Wc + 0.2), left = s[0] + 0.1 * k;
      values.forEach((v, i) => {
        const bar = this.bars[i]; if (!bar) return;
        const h = Math.max(1e-4, (v / this.maxValue) * this.Hc);
        bar.h = h; bar.sx = k; bar.sy = k; bar.pos = [left + (i + 0.5) * this.slot * k, s[1] + (h * k) / 2];
      });
      return this;
    }
  }

  class ValueTracker extends Mobject {
    constructor(v = 0) { super(); this.value = v; }
    extraKeys() { return ["value"]; }
    family() { return []; }
    get() { return this.value; }
    set(v) { this.value = v; return this; }
    increment(d) { this.value += d; return this; }
  }

  // ── 상태 저장·보간 ────────────────────────────────────
  function snap(m) { const s = {}; for (const k of m.keys) s[k] = clone(m[k]); s.__c = m.children.map(snap); return s; }
  function restore(m, s) { for (const k in s) if (k !== "__c") m[k] = clone(s[k]); m.children.forEach((c, i) => s.__c[i] && restore(c, s.__c[i])); }
  function lerpVal(k, a, b, t) {
    if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => lerpVal(k, x, b[i], t));
    if (/Color$/.test(k) && typeof a === "string" && typeof b === "string") return lerpColor(a, b, t);
    return t < 1 ? clone(a) : clone(b);
  }
  function lerpState(m, a, b, t) {
    for (const k in a) if (k !== "__c" && k in b) m[k] = lerpVal(k, a[k], b[k], t);
    m.children.forEach((c, i) => { if (a.__c[i] && b.__c[i]) lerpState(c, a.__c[i], b.__c[i], t); });
  }
  function compatible(a, b) {
    if (a.constructor !== b.constructor || a.children.length !== b.children.length) return false;
    if (a.textLike && a.text !== b.text) return false;
    if (a.pts && b.pts && a.pts.length !== b.pts.length) return false;
    return a.children.every((c, i) => compatible(c, b.children[i]));
  }
  function become(a, b) {
    const c = b.copy(), id = a.id;
    for (const k of Object.keys(a)) delete a[k];
    Object.setPrototypeOf(a, Object.getPrototypeOf(c));
    Object.assign(a, c); a.id = id;
    return a;
  }

  // ── 애니메이션 ────────────────────────────────────────
  class StopSignal extends Error { constructor() { super("정지됨"); this.isStop = true; } }

  class Animation {
    constructor(m, opts = {}) {
      this.m = m; this.runTime = opts.runTime; this.rateFunc = opts.rateFunc || smooth; this.opts = opts;
      if (m != null && !(m instanceof Mobject)) throw new Error("애니메이션에는 도형을 넣어야 함 (받은 값: " + m + ")");
    }
    begin(scene) { if (this.m && !scene.has(this.m)) scene.add(this.m); }
    update() {}
    finish() { this.update(1); }
    interpolate(t) { this.update(this.rateFunc(clamp01(t))); }
  }
  class CreateAnim extends Animation {
    constructor(m, opts = {}) { super(m, opts); this.lag = opts.lagRatio ?? 0; }
    begin(s) { super.begin(s); this.leaves = this.m.family(); this.leaves.forEach((l) => (l.create = 0)); }
    update(a) {
      const n = this.leaves.length, total = 1 + this.lag * Math.max(0, n - 1);
      this.leaves.forEach((l, i) => (l.create = clamp01(a * total - i * this.lag)));
    }
    finish() { this.leaves.forEach((l) => (l.create = 1)); }
  }
  class UncreateAnim extends CreateAnim {
    update(a) { super.update(1 - a); }
    finish(s) { this.leaves.forEach((l) => (l.create = 1)); s.remove(this.m); }
  }
  class StateAnim extends Animation {
    // prepare(m): 시작 상태로 만들기 / end는 현재 상태
    begin(s) {
      super.begin(s);
      const base = snap(this.m);
      if (this.toStart) { this.toStart(this.m); this.start = snap(this.m); restore(this.m, base); this.end = base; }
      else { this.start = base; this.toEnd(this.m); this.end = snap(this.m); restore(this.m, base); }
    }
    update(a) { lerpState(this.m, this.start, this.end, a); }
    finish() { restore(this.m, this.end); }
  }
  class FadeInAnim extends StateAnim {
    constructor(m, opts = {}) { super(m, opts); }
    toStart(m) { m.opacity = 0; if (this.opts.shift) m.shift(-this.opts.shift[0], -this.opts.shift[1]); if (this.opts.scale) m.scale(this.opts.scale); }
  }
  class FadeOutAnim extends StateAnim {
    toEnd(m) { m.opacity = 0; if (this.opts.shift) m.shift(this.opts.shift); if (this.opts.scale) m.scale(this.opts.scale); }
    finish(s) { restore(this.m, this.start); s.remove(this.m); }
  }
  class GrowAnim extends StateAnim {
    constructor(m, edge, opts = {}) { super(m, opts); this.edge = edge; }
    toStart(m) {
      const b = m.getBounds(), c = m.getCenter();
      if (!this.edge) { m.scale(1e-3, c); return; }
      const anchor = [this.edge[0] ? (this.edge[0] > 0 ? b[2] : b[0]) : c[0], this.edge[1] ? (this.edge[1] > 0 ? b[3] : b[1]) : c[1]];
      m.stretch(this.edge[0] ? 1e-3 : 1, this.edge[1] ? 1e-3 : 1, anchor);
    }
  }
  class ApplyMethods extends StateAnim {
    constructor(m, calls, opts = {}) { super(m, opts); this.calls = calls; }
    toEnd(m) {
      for (const [name, args] of this.calls) {
        if (typeof m[name] !== "function") throw new Error(`.animate 뒤에 쓸 수 없는 이름: ${name}`);
        m[name](...args);
      }
    }
  }
  class TransformAnim extends Animation {
    constructor(a, b, opts = {}, replace = false) {
      super(a, opts); this.b = b; this.replace = replace;
      if (!(b instanceof Mobject)) throw new Error("Transform(바꿀 도형, 목표 도형) 형태로 써야 함");
    }
    begin(s) {
      super.begin(s);
      const a = this.m, b = this.b;
      this.morph = compatible(a, b);
      if (this.morph) { this.start = snap(a); this.end = snap(b); return; }
      if (s.has(b)) s.remove(b);
      this.aStart = snap(a); a.moveTo(b.getCenter()); a.opacity = 0; this.aEnd = snap(a); restore(a, this.aStart);
      this.bEnd = snap(b); b.moveTo(a.getCenter()); b.opacity = 0; this.bStart = snap(b); restore(b, this.bEnd);
      s.addAfter(a, b);
    }
    update(t) {
      if (this.morph) return lerpState(this.m, this.start, this.end, t);
      lerpState(this.m, this.aStart, this.aEnd, t); lerpState(this.b, this.bStart, this.bEnd, t);
    }
    finish(s) {
      if (this.morph) restore(this.m, this.end); else { restore(this.m, this.aStart); restore(this.b, this.bEnd); }
      if (this.replace) { s.replace(this.m, this.b); return; }
      if (!this.morph) s.remove(this.b);
      become(this.m, this.b);
    }
  }
  class RotateAnim extends Animation {
    constructor(m, angle, opts = {}) { super(m, opts); this.angle = angle; }
    begin(s) { super.begin(s); this.base = snap(this.m); this.about = this.opts.about ? toPoint(this.opts.about) : this.m.getCenter(); }
    update(a) { restore(this.m, this.base); this.m.rotate(this.angle * a, this.about, this.opts.upright); }
  }
  class IndicateAnim extends Animation {
    constructor(m, opts = {}) { super(m, { rateFunc: thereAndBack, ...opts }); this.k = opts.scale ?? 1.2; this.color = opts.color || COLORS.YELLOW; }
    begin(s) { super.begin(s); this.base = snap(this.m); }
    update(a) {
      restore(this.m, this.base); this.m.scale(1 + (this.k - 1) * a, this.m.getCenter());
      for (const l of this.m.family()) { l.strokeColor = lerpColor(l.strokeColor, this.color, a); l.fillColor = lerpColor(l.fillColor, this.color, a); }
    }
    finish() { restore(this.m, this.base); }
  }
  class CustomAnim extends Animation {
    constructor(fn, opts = {}) { super(null, { rateFunc: linear, ...opts }); this.fn = fn; }
    begin() {}
    update(a) { this.fn(a); }
  }
  class AnimationGroup extends Animation {
    constructor(anims, opts = {}) {
      super(null, { rateFunc: linear, ...opts });
      this.anims = anims.map(toAnimation); this.lag = opts.lagRatio ?? 0;
      const n = this.anims.length;
      this.runTime = opts.runTime ?? Math.min(8, Math.max(1, ...this.anims.map((a) => a.runTime || 1)) * (1 + this.lag * Math.max(0, n - 1)));
    }
    begin(s) { this.anims.forEach((a) => a.begin(s)); this.interpolate(0); }
    interpolate(t) {
      const n = this.anims.length, total = 1 + this.lag * Math.max(0, n - 1);
      this.anims.forEach((a, i) => { const st = (i * this.lag) / total; a.interpolate((t - st) * total); });
    }
    finish(s) { this.anims.forEach((a) => a.finish(s)); }
  }
  class Succession extends AnimationGroup {
    constructor(anims, opts = {}) { super(anims, { ...opts, lagRatio: 1 }); }
    begin(s) { this.started = new Set(); this.s = s; }
    interpolate(t) {
      const n = this.anims.length, f = t * n;
      this.anims.forEach((a, i) => {
        if (f >= i && !this.started.has(i)) { this.started.add(i); a.begin(this.s); }
        if (this.started.has(i)) a.interpolate(f - i);
      });
    }
    finish(s) { this.anims.forEach((a, i) => { if (!this.started.has(i)) a.begin(s); a.finish(s); }); }
  }

  function makeBuilder(m) {
    const calls = [];
    const proxy = new Proxy({}, {
      get(_, name) {
        if (name === "__builder") return { m, calls };
        if (name === "then" || typeof name === "symbol") return undefined;
        return (...args) => { calls.push([name, args]); return proxy; };
      },
    });
    return proxy;
  }
  function toAnimation(x) {
    if (x instanceof Animation) return x;
    if (x && x.__builder) return new ApplyMethods(x.__builder.m, x.__builder.calls);
    if (x instanceof Mobject) throw new Error("play()에는 도형이 아니라 애니메이션을 넣어야 함. 예: scene.play(Create(c))");
    throw new Error("play()에 넣을 수 없는 값: " + x);
  }
  const isOpts = (o) => o && typeof o === "object" && !o.__builder && !(o instanceof Animation) && !(o instanceof Mobject) && !Array.isArray(o);

  // ── 장면 ─────────────────────────────────────────────
  class Scene {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d");
      this.headless = !!opts.headless; this.background = opts.background || BG;
      this.mobjects = []; this.updaters = []; this.time = 0; this.gen = 0; this.frames = 0;
      this.resize();
    }
    resize() {
      this.dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
      this.canvas.width = Math.round(W * this.dpr); this.canvas.height = Math.round(H * this.dpr);
      this.render();
    }
    reset() { this.gen++; this.mobjects = []; this.updaters = []; this.time = 0; this.render(); }
    abort() { this.gen++; }
    _walk(fn) { const go = (m, parent) => { fn(m, parent); m.children.forEach((c) => go(c, m)); }; this.mobjects.forEach((m) => go(m, null)); }
    has(m) { let f = false; this._walk((x) => { if (x === m) f = true; }); return f; }
    add(...ms) {
      for (const m of ms.flat()) {
        if (!(m instanceof Mobject)) throw new Error("scene.add()에는 도형만 넣을 수 있음");
        if (this.has(m)) continue;
        // 묶음을 넣을 때 이미 따로 들어가 있던 자식은 빼서 두 번 그려지지 않게
        const inside = new Set(); const walk = (x) => x.children.forEach((c) => { inside.add(c); walk(c); }); walk(m);
        this.mobjects = this.mobjects.filter((x) => !inside.has(x));
        this.mobjects.push(m);
      }
      this.render(); return this;
    }
    addAfter(a, b) { const i = this.mobjects.indexOf(a); if (i >= 0) this.mobjects.splice(i + 1, 0, b); else this.mobjects.push(b); }
    remove(...ms) {
      for (const m of ms.flat()) {
        this.mobjects = this.mobjects.filter((x) => x !== m);
        this._walk((x) => { if (x.isGroup && x.children.includes(m)) x.children = x.children.filter((c) => c !== m); });
      }
      this.render(); return this;
    }
    replace(a, b) {
      const i = this.mobjects.indexOf(a);
      if (i >= 0) { this.mobjects.splice(i, 1, b); this.mobjects = this.mobjects.filter((x, j) => x !== b || j === i); }
      else { let done = false; this._walk((x) => { if (!done && x.isGroup) { const j = x.children.indexOf(a); if (j >= 0) { x.children[j] = b; done = true; } } }); if (!done) this.mobjects.push(b); }
      this.render();
    }
    bringToFront(m) { this.mobjects = this.mobjects.filter((x) => x !== m); this.mobjects.push(m); this.render(); return this; }
    clear() { this.mobjects = []; this.updaters = []; this.render(); return this; }
    addUpdater(fn) { this.updaters.push(fn); return fn; }
    removeUpdater(fn) { this.updaters = this.updaters.filter((u) => u !== fn); }
    render() {
      const c = this.ctx; if (!c) return;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = this.background; c.fillRect(0, 0, W, H);
      const draw = (m, a) => { const al = a * m.opacity; if (al <= 0.002) return; if (m.isGroup) m.children.forEach((ch) => draw(ch, al)); else m.draw(c, al); };
      this.mobjects.forEach((m) => draw(m, 1));
      this.frames++;
    }
    _tick(dt) { this.time += dt; for (const u of this.updaters.slice()) u(dt, this.time); }
    _run(duration, onFrame) {
      const gen = this.gen;
      if (this.headless) {
        const dt = 1 / 30, steps = Math.max(1, Math.round(duration / dt));
        for (let i = 1; i <= steps; i++) { if (gen !== this.gen) return Promise.reject(new StopSignal()); this._tick(dt); onFrame(i / steps); this.render(); }
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        let start = null, last = null;
        const frame = (now) => {
          if (gen !== this.gen) { reject(new StopSignal()); return; }
          if (start === null) { start = now; last = now; }
          const dt = Math.min(0.1, (now - last) / 1000); last = now;
          const t = duration <= 0 ? 1 : Math.min(1, (now - start) / 1000 / duration);
          try { this._tick(dt); onFrame(t); this.render(); } catch (e) { reject(e); return; }
          if (t >= 1) resolve(); else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
    }
    async play(...args) {
      let opts = {};
      if (args.length && isOpts(args[args.length - 1])) opts = args.pop();
      if (!args.length) throw new Error("play()에 애니메이션을 하나 이상 넣어 주세요");
      if (this.gen !== this._gen0) { /* 실행 중 정지된 경우 */ }
      const anims = args.map(toAnimation);
      const anim = anims.length === 1 ? anims[0] : new AnimationGroup(anims);
      if (opts.rateFunc) anim.rateFunc = opts.rateFunc;
      const rt = opts.runTime ?? anim.runTime ?? 1;
      anim.begin(this);
      await this._run(rt, (t) => anim.interpolate(t));
      anim.finish(this);
      this.render();
    }
    wait(t = 1) { return this._run(t, () => {}); }
  }

  // ── 수학 도우미 ───────────────────────────────────────
  const factorial = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const comb = (n, r) => { if (r < 0 || r > n) return 0; r = Math.min(r, n - r); let v = 1; for (let i = 1; i <= r; i++) v = (v * (n - r + i)) / i; return Math.round(v); };
  const perm = (n, r) => { let v = 1; for (let i = 0; i < r; i++) v *= n - i; return v; };
  function erf(x) {
    const s = Math.sign(x); x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  const normalPdf = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(TAU));
  const normalCdf = (x, m = 0, s = 1) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));
  const binomPmf = (k, n, p) => comb(n, k) * p ** k * (1 - p) ** (n - k);
  let rngState = 42;
  const seed = (n) => { rngState = n >>> 0; };
  function random() { rngState |= 0; rngState = (rngState + 0x6d2b79f5) | 0; let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const randint = (a, b) => a + Math.floor(random() * (b - a + 1));
  const randn = () => { let u = 0; while (u === 0) u = random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * random()); };
  const range = (a, b, st = 1) => { if (b === undefined) { b = a; a = 0; } const o = []; for (let x = a; st > 0 ? x < b : x > b; x += st) o.push(x); return o; };
  const sum = (arr) => arr.reduce((p, c) => p + c, 0);
  const mean = (arr) => sum(arr) / arr.length;
  const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

  // ── 사용자 코드용 이름표 (new 없이도 호출 가능) ─────────────
  const wrap = (C) => { const f = function (...a) { return new C(...a); }; f.prototype = C.prototype; Object.defineProperty(f, "name", { value: C.name }); return f; };
  const lastOpts = (args) => (args.length && isOpts(args[args.length - 1]) ? args.pop() : {});
  const API = {
    Circle: wrap(Circle), Dot: wrap(Dot), Rectangle: wrap(Rectangle), Square: wrap(Square), RoundedRectangle: wrap(RoundedRectangle),
    Line: wrap(Line), DashedLine: wrap(DashedLine), Arrow: wrap(Arrow), Polyline: wrap(Polyline), Polygon: wrap(Polygon),
    RegularPolygon: wrap(RegularPolygon), Triangle: wrap(Triangle), Text: wrap(Text), MathText: wrap(MathText), VGroup: wrap(VGroup),
    NumberLine: wrap(NumberLine), Axes: wrap(Axes), BarChart: wrap(BarChart), ValueTracker: wrap(ValueTracker),
    Create: (m, o) => new CreateAnim(m, o), Write: (m, o = {}) => new CreateAnim(m, { lagRatio: m && m.isGroup ? 0.12 : 0, rateFunc: linear, ...o }),
    Uncreate: (m, o) => new UncreateAnim(m, o), FadeIn: (m, o) => new FadeInAnim(m, o), FadeOut: (m, o) => new FadeOutAnim(m, o),
    Transform: (a, b, o) => new TransformAnim(a, b, o, false), ReplacementTransform: (a, b, o) => new TransformAnim(a, b, o, true),
    MoveTo: (m, p, o) => new ApplyMethods(m, [["moveTo", [p]]], o),
    Shift: (m, dx, dy, o) => { if (Array.isArray(dx)) { o = dy; dy = dx[1]; dx = dx[0]; } return new ApplyMethods(m, [["shift", [dx, dy]]], o); },
    Scale: (m, f, o) => new ApplyMethods(m, [["scale", [f]]], o),
    Rotate: (m, angle, o) => new RotateAnim(m, angle, o), Indicate: (m, o) => new IndicateAnim(m, o),
    GrowFromCenter: (m, o) => new GrowAnim(m, null, o), GrowFromEdge: (m, edge = DOWN, o) => new GrowAnim(m, edge, o),
    AnimationGroup: (...a) => { const o = lastOpts(a); return new AnimationGroup(a.flat(), o); },
    LaggedStart: (...a) => { const o = lastOpts(a); return new AnimationGroup(a.flat(), { lagRatio: 0.15, ...o }); },
    Succession: (...a) => { const o = lastOpts(a); return new Succession(a.flat(), o); },
    Custom: (fn, o) => new CustomAnim(fn, o),
    linear, smooth, thereAndBack, rushInto, rushFrom,
    PI, TAU, UP, DOWN, LEFT, RIGHT, ORIGIN, UL, UR, DL, DR, FRAME_W, FRAME_H, ...COLORS,
    factorial, comb, perm, normalPdf, normalCdf, binomPmf, seed, random, randint, randn, range, sum, mean, round, lerpColor,
  };

  // 사용자 코드 실행: construct(scene) 를 찾아 호출
  function runCode(scene, code) {
    seed(42);
    const names = Object.keys(API);
    let fn;
    try { fn = new Function(...names, '"use strict";\n' + code + '\n;return (typeof construct === "function") ? construct : null;'); }
    catch (e) { e.friendly = "문법 오류: " + e.message; throw e; }
    const construct = fn(...names.map((n) => API[n]));
    if (!construct) throw new Error("construct 함수를 찾을 수 없음. async function construct(scene) { ... } 형태로 작성해 주세요.");
    return construct.call(scene, scene);
  }

  const Miniman = { Scene, API, runCode, StopSignal, W, H, UNIT, BG, COLORS };
  if (typeof module !== "undefined" && module.exports) module.exports = Miniman;
  else root.Miniman = Miniman;
})(typeof window !== "undefined" ? window : globalThis);
