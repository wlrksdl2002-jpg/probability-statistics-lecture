/* 애니메이션 놀이터 예제 모음 (강의 주제와 연결) */
(function (root) {
  const P = [];
  const add = (name, code) => P.push({ name, code: code.trim() + "\n" });

  add("기본 사용법: 도형과 애니메이션", `
// 도형을 만들고 scene.play(...)로 애니메이션 재생
async function construct(scene) {
  const title = Text("Manim 스타일 놀이터", { size: 0.6, bold: true }).toEdge(UP);
  await scene.play(Write(title));

  const c = Circle(1.2, { color: CORAL, fillOpacity: 0.3 }).shift(-3, -0.5);
  const s = Square(2, { color: TEAL, fillOpacity: 0.3 }).shift(3, -0.5);
  await scene.play(Create(c), Create(s));

  // .animate 뒤에 메서드를 이어 쓰면 그 변화가 애니메이션이 됨
  await scene.play(s.animate.rotate(PI / 4).scale(0.8));
  await scene.play(Transform(c, s.copy().shift(-6, 0)));
  await scene.play(Indicate(title));
}
`);

  add("1주차 · 원순열: 회전해도 같은 배열", `
// 4명이 원탁에 앉을 때: 한 칸씩 돌려도 같은 배열 → 4!/4 = 3! = 6
async function construct(scene) {
  const title = Text("원순열: 회전해도 같은 배열", { size: 0.5, bold: true }).toEdge(UP);
  await scene.play(Write(title));

  const center = [-3.2, -0.3];
  const table = Circle(1.7, { color: GRAY, fillOpacity: 0.15 }).moveTo(center);
  const seats = VGroup(...["A", "B", "C", "D"].map((n, i) => {
    const ang = PI / 2 - i * TAU / 4;
    const disk = Circle(0.42, { color: i === 0 ? CORAL : TEAL, fillOpacity: 1, strokeWidth: 0 });
    const label = Text(n, { size: 0.42, color: BLACK, bold: true });
    return VGroup(disk, label).moveTo([center[0] + 1.7 * Math.cos(ang), center[1] + 1.7 * Math.sin(ang)]);
  }));
  await scene.play(Create(table));
  await scene.play(LaggedStart(...seats.children.map(s => GrowFromCenter(s)), { lagRatio: 0.25 }));

  const info = Text("한 칸씩 돌려도 이웃 관계는 그대로", { size: 0.32, color: LIGHT_GRAY }).nextTo(table, DOWN, 0.45);
  await scene.play(FadeIn(info, { shift: [0, 0.2] }));
  for (let k = 0; k < 4; k++) {
    await scene.play(Rotate(seats, -TAU / 4, { about: center, upright: true }), { runTime: 0.8 });
  }

  const f1 = MathText("일렬 배열: 4! = 24가지", { size: 0.42 });
  const f2 = MathText("회전해서 같은 배열: 4개씩", { size: 0.42 });
  const f3 = MathText("원순열의 수: 4!/4 = 3! = 6", { size: 0.5, color: GOLD, bold: true });
  const formulas = VGroup(f1, f2, f3).arrange(DOWN, 0.45).moveTo([3.2, -0.2]);
  await scene.play(LaggedStart(...formulas.children.map(f => FadeIn(f, { shift: [0.3, 0] })), { lagRatio: 0.5 }));
  await scene.play(Indicate(f3));
}
`);

  add("1주차 · 중복순열: 칸 채우기 2^5", `
// 서로 다른 편지 5통을 우체통 2개에 넣는 방법: 칸마다 2가지 → 2^5
async function construct(scene) {
  const title = Text("중복순열: 칸마다 선택지가 그대로", { size: 0.5, bold: true }).toEdge(UP);
  await scene.play(Write(title));

  const boxes = VGroup(), nums = VGroup(), labels = VGroup();
  for (let i = 0; i < 5; i++) {
    const b = Square(1.3, { color: WHITE, strokeWidth: 4 }).shift(-4.4 + i * 2.2, 0.3);
    boxes.add(b);
    nums.add(Text("2", { size: 0.7, color: CORAL, bold: true }).moveTo(b));
    labels.add(Text("편지" + (i + 1), { size: 0.3, color: LIGHT_GRAY }).nextTo(b, DOWN, 0.25));
  }
  const times = VGroup(...range(4).map(i => Text("×", { size: 0.5 }).moveTo([-3.3 + i * 2.2, 0.3])));

  await scene.play(LaggedStart(...boxes.children.map(b => Create(b)), { lagRatio: 0.2 }), FadeIn(labels));
  await scene.play(LaggedStart(...nums.children.map(n => FadeIn(n, { scale: 1.6 })), { lagRatio: 0.3 }), FadeIn(times));

  const result = MathText("₂Π₅ = 2^{5} = 32", { size: 0.7, color: GOLD, bold: true }).shift(0, -2.3);
  await scene.play(Write(result));
  await scene.play(Indicate(result));
}
`);

  add("3주차 · 파스칼의 삼각형", `
// 위 두 수를 더해 아래 수를 만듦 (값 = 조합 nCr). 홀수만 색칠
async function construct(scene) {
  const title = Text("파스칼의 삼각형", { size: 0.5, bold: true }).toEdge(UP);
  await scene.play(Write(title));

  const rows = 8, dx = 0.85, dy = 0.72;
  for (let n = 0; n < rows; n++) {
    const row = VGroup();
    for (let r = 0; r <= n; r++) {
      const v = comb(n, r), odd = v % 2 === 1;
      const bubble = Circle(0.33, { color: odd ? CORAL : DARK_GRAY, fillOpacity: odd ? 0.85 : 0.6, strokeWidth: 0 });
      const t = Text(String(v), { size: v > 9 ? 0.26 : 0.32, color: WHITE, bold: true });
      row.add(VGroup(bubble, t).moveTo([(r - n / 2) * dx, 2.4 - n * dy]));
    }
    await scene.play(LaggedStart(...row.children.map(c => FadeIn(c, { shift: [0, -0.2] })), { lagRatio: 0.1 }), { runTime: 0.6 });
  }
  const note = Text("홀수만 색칠하면 시에르핀스키 삼각형 무늬", { size: 0.32, color: GOLD }).toEdge(DOWN, 0.35);
  await scene.play(FadeIn(note));
}
`);

  add("7주차 · 갈턴 보드: 이항분포", `
// 공이 못에 부딪힐 때마다 왼쪽/오른쪽(확률 1/2) → 오른쪽으로 간 횟수 X ~ B(8, 1/2)
async function construct(scene) {
  const n = 8, gap = 0.42, top = 3.0, cx = -3.2;
  const pegs = VGroup();
  for (let r = 0; r < n; r++)
    for (let k = 0; k <= r; k++)
      pegs.add(Dot([(k - r / 2) * gap + cx, top - 0.35 - r * 0.32], { radius: 0.05, color: LIGHT_GRAY }));
  const chart = BarChart(range(n + 1).map(() => 0), { width: 4.6, height: 2.6, maxValue: 0.3, labels: range(n + 1).map(String), color: TEAL }).moveTo([cx, -2.0]);
  const title = Text("갈턴 보드 → 이항분포", { size: 0.45, bold: true }).moveTo([3.2, 2.8]);
  await scene.play(Write(title), Create(pegs), Create(chart));

  const counts = range(n + 1).map(() => 0);
  const label = Text("공 0개", { size: 0.4, color: GOLD }).moveTo([3.2, 1.8]);
  scene.add(label);
  for (let b = 1; b <= 300; b++) {
    let k = 0;
    const path = [[cx, top]];
    for (let r = 0; r < n; r++) {
      if (random() < 0.5) k++;
      path.push([(k - (r + 1) / 2) * gap + cx, top - 0.51 - r * 0.32]);
    }
    if (b <= 6) {   // 처음 6개는 떨어지는 모습을 보여 줌
      const ball = Dot(path[0], { radius: 0.09, color: GOLD });
      scene.add(ball);
      for (const p of path.slice(1)) await scene.play(ball.animate.moveTo(p), { runTime: 0.09, rateFunc: linear });
      await scene.play(FadeOut(ball), { runTime: 0.15 });
    }
    counts[k]++;
    if (b <= 6 || b % 15 === 0) {
      label.setText("공 " + b + "개");
      await scene.play(chart.animate.setValues(counts.map(c => c / b)), { runTime: b <= 6 ? 0.3 : 0.15 });
    }
  }
  const theory = MathText("이론: P(X = k) = ₈C_{k} (1/2)^{8}", { size: 0.36, color: LIGHT_GRAY }).moveTo([3.2, 0.8]);
  const peak = Text("k = 4일 확률 ≈ " + round(binomPmf(4, 8, 0.5), 3), { size: 0.36, color: WHITE }).moveTo([3.2, 0.1]);
  await scene.play(FadeIn(theory), FadeIn(peak));
}
`);

  add("4주차 · 큰수의 법칙: 동전 던지기", `
// 동전을 많이 던질수록 앞면 비율(상대도수)이 0.5에 가까워짐
async function construct(scene) {
  const title = Text("큰수의 법칙", { size: 0.5, bold: true }).toEdge(UP, 0.3);
  const axes = Axes({ xRange: [0, 500, 100], yRange: [0, 1, 0.25], width: 10.5, height: 5, xLabel: "던진 횟수", yLabel: "앞면 비율" }).shift(0, -0.5);
  await scene.play(Write(title), Create(axes));
  const half = axes.hLine(0.5, { color: GOLD });
  await scene.play(Create(half));

  const curve = Polyline([axes.c2p(0, 0.5)], { color: CORAL, strokeWidth: 4 });
  const readout = Text("", { size: 0.36, color: WHITE }).moveTo([3.2, 2.7]);
  scene.add(curve, readout);
  let heads = 0;
  const pts = [];
  for (let i = 1; i <= 500; i++) {
    if (random() < 0.5) heads++;
    pts.push(axes.c2p(i, heads / i));
    if (i % 4 === 0) {
      curve.setPoints(pts);
      readout.setText(i + "번 중 앞면 " + heads + "번 → " + round(heads / i, 3));
      await scene.wait(1 / 30);
    }
  }
  await scene.play(Indicate(readout));
}
`);

  add("8주차 · 정규분포: 확률 = 넓이", `
// 표준정규분포에서 P(a ≤ Z ≤ b)는 곡선 아래 넓이
async function construct(scene) {
  const title = Text("정규분포: 확률 = 곡선 아래 넓이", { size: 0.48, bold: true }).toEdge(UP, 0.3);
  const axes = Axes({ xRange: [-4, 4, 1], yRange: [0, 0.45, 0.1], width: 10, height: 4.8, xLabel: "z" }).shift(0, -0.6);
  const curve = axes.plot(x => normalPdf(x), { color: GOLD });
  await scene.play(Write(title), Create(axes));
  await scene.play(Create(curve), { runTime: 1.5 });

  let area = null, label = null;
  for (const [a, b] of [[-1, 1], [-1.96, 1.96], [0, 2.5]]) {
    const nextArea = axes.area(x => normalPdf(x), a, b, { color: TEAL, opacity: 0.55 });
    const p = normalCdf(b) - normalCdf(a);
    const nextLabel = MathText("P(" + a + " ≤ Z ≤ " + b + ") = " + round(p, 4), { size: 0.44 }).moveTo([0, 2.6]);
    if (!area) {
      area = nextArea; label = nextLabel;
      await scene.play(FadeIn(area));
      await scene.play(Write(label));
    } else {
      await scene.play(Transform(area, nextArea), Transform(label, nextLabel), { runTime: 1.2 });
    }
    scene.bringToFront(curve);
    await scene.wait(0.8);
  }
}
`);

  add("9주차 · 중심극한정리: 표본평균", `
// 주사위 n개를 던진 평균의 분포: n이 커질수록 3.5 근처의 종 모양
async function construct(scene) {
  const bins = range(21).map(i => 1 + i * 0.25);   // 1.00, 1.25, ..., 6.00
  const hist = (n) => {
    const c = bins.map(() => 0), T = 4000;
    for (let t = 0; t < T; t++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += randint(1, 6);
      c[Math.min(20, Math.round((s / n - 1) / 0.25))]++;
    }
    return c.map(v => v / T);
  };
  const title = Text("중심극한정리: 표본평균의 분포", { size: 0.48, bold: true }).toEdge(UP, 0.3);
  const chart = BarChart(hist(1), { width: 10, height: 4.4, maxValue: 0.4, labels: bins.map(b => (b % 1 === 0 ? String(b) : "")), color: TEAL, barGap: 0.12 }).shift(0, -0.7);
  const nLabel = Text("n = 1", { size: 0.5, color: GOLD, bold: true }).moveTo([4, 2.4]);
  await scene.play(Write(title));
  await scene.play(Create(chart), FadeIn(nLabel));
  for (const n of [2, 5, 10, 30]) {
    await scene.wait(0.6);
    const next = Text("n = " + n, { size: 0.5, color: GOLD, bold: true }).moveTo([4, 2.4]);
    await scene.play(chart.animate.setValues(hist(n)), Transform(nLabel, next), { runTime: 1.2 });
  }
  const note = Text("평균 3.5 주변으로 모이고, 퍼짐은 1/√n 비율로 줄어듦", { size: 0.32, color: LIGHT_GRAY }).toEdge(DOWN, 0.25);
  await scene.play(FadeIn(note));
}
`);

  add("10주차 · 신뢰구간 100개", `
// 같은 방법으로 95% 신뢰구간을 100번 만들면 약 95개가 진짜 평균을 포함
async function construct(scene) {
  const title = Text("95% 신뢰구간 100개", { size: 0.48, bold: true }).toEdge(UP, 0.3);
  await scene.play(Write(title));
  const mu = 0, se = 1, z = 1.96, k = 0.62, baseY = -0.6;
  const muLine = DashedLine([-6.4, baseY], [6.4, baseY], { color: GOLD, strokeWidth: 3 });
  const muLabel = Text("진짜 평균 m", { size: 0.3, color: GOLD }).nextTo(muLine, UP, 0.1).shift(5.2, 0);
  await scene.play(Create(muLine), FadeIn(muLabel));

  const lines = [];
  let miss = 0;
  for (let i = 0; i < 100; i++) {
    const xbar = mu + se * randn();
    const lo = xbar - z * se, hi = xbar + z * se, hit = lo <= mu && mu <= hi;
    if (!hit) miss++;
    const x = -6.2 + i * 0.125;
    lines.push(Line([x, baseY + lo * k], [x, baseY + hi * k], { color: hit ? TEAL : CORAL, strokeWidth: hit ? 3 : 5 }));
  }
  await scene.play(LaggedStart(...lines.map(l => Create(l)), { lagRatio: 0.05 }), { runTime: 5 });
  const result = Text("포함 " + (100 - miss) + "개 / 놓침 " + miss + "개", { size: 0.42 }).toEdge(DOWN, 0.4);
  await scene.play(Write(result));
  for (const l of lines) if (l.strokeColor === CORAL) await scene.play(Indicate(l, { color: CORAL }), { runTime: 0.4 });
}
`);

  if (typeof module !== "undefined" && module.exports) module.exports = P;
  else root.MINIMAN_PRESETS = P;
})(typeof window !== "undefined" ? window : globalThis);
