// 8주차: 연속확률변수와 정규분포
const pdf = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const r4 = (v) => Math.round(v * 10000) / 10000;

// lo~hi 를 step 간격으로 나눈 x 값과, 정수일 때만 보이는 눈금 이름
function axis(lo, hi, step, labelEvery = 1) {
  const xs = [];
  for (let x = lo; x <= hi + 1e-9; x += step) xs.push(Math.round(x * 1000) / 1000);
  const labels = xs.map((x) => (Math.abs(x / labelEvery - Math.round(x / labelEvery)) < 1e-9 ? String(x) : ""));
  return { xs, labels };
}

// 곡선 전체(1번 계열) + 색칠 구간(2번 계열, 구간 밖은 0)
function shaded(lo, hi, step, f, inside, labelEvery = 1) {
  const { xs, labels } = axis(lo, hi, step, labelEvery);
  return {
    kind: "area",
    labels,
    series: [
      { name: "전체", values: xs.map((x) => r4(f(x))) },
      { name: "구하는 확률", values: xs.map((x) => (inside(x) ? r4(f(x)) : 0)) },
    ],
  };
}

const curves = axis(-6, 6, 0.25, 2);

module.exports = {
  week: 8,
  title: "연속확률변수와 정규분포",
  slides: [
    {
      type: "cover",
      title: "연속확률변수와 정규분포",
      subtitle: "측정값이 종 모양으로 모이는 이유",
      image: "w08_과녁",
    },
    {
      type: "goals",
      items: [
        "연속확률변수와 확률밀도함수의 뜻 이해",
        "정규분포 곡선의 성질과 모양 해석",
        "표준화와 표준정규분포표를 이용한 확률 계산",
      ],
    },
    { type: "section", title: "연속확률변수", sub: "셀 수 없이 많은 값을 갖는 확률변수" },
    {
      type: "compare",
      title: "이산확률변수와 연속확률변수",
      left: {
        head: "이산확률변수",
        items: ["하나하나 셀 수 있는 값", "예: 하루 고장 건수, 불량품 개수", "확률 = 막대의 높이"],
      },
      right: {
        head: "연속확률변수",
        items: ["어떤 구간의 모든 실수 값", "예: 저항값, 부품 수명, 측정 오차", "확률 = 곡선 아래의 넓이"],
      },
    },
    {
      type: "visual",
      title: "계급을 잘게 나누면 곡선",
      visual: {
        kind: "steps",
        figs: ["w08_밀도1.png", "w08_밀도2.png", "w08_밀도3.png"],
        labels: ["계급 폭 2Ω", "계급 폭 0.5Ω", "확률밀도함수"],
      },
      caption: "저항 2000개의 측정값 히스토그램: 계급 폭을 줄일수록 매끄러운 곡선에 가까워짐",
    },
    {
      type: "concept",
      title: "확률밀도함수",
      term: "확률밀도함수 f(x)",
      def: "연속확률변수 X의 확률을 그래프 아래의 넓이로 나타내는 함수",
      formula: "P(a ≤ X ≤ b) = 색칠한 부분의 넓이",
      note: "조건: f(x) ≥ 0, 그래프와 x축 사이 전체 넓이 = 1",
      visual: shaded(-3.5, 3.5, 0.1, (x) => pdf(x), (x) => x >= -0.5 && x <= 1.5),
    },
    {
      type: "bullets",
      title: "연속확률변수의 성질",
      bullets: [
        "모든 x에서 f(x) ≥ 0",
        "곡선과 x축 사이 전체 넓이 = 1",
        "한 점에서의 확률 P(X = a) = 0",
        "P(a ≤ X ≤ b) = P(a < X < b): 등호 유무와 무관",
      ],
      visual: { kind: "formula", text: "P(X = a) = 0", note: "폭이 0인 선분의 넓이 = 0" },
    },
    {
      type: "example",
      title: "균등한 대기 시간",
      tag: "공학",
      problem: "서버 응답 대기 시간 X(분)의 확률밀도함수 f(x) = 1/10 (0 ≤ x ≤ 10). P(2 ≤ X ≤ 5)?",
      steps: ["구하는 확률 = 직사각형의 넓이", "가로: 5 − 2 = 3, 세로: 1/10", "넓이 = 3 × 1/10"],
      answer: "P(2 ≤ X ≤ 5) = 0.3",
      visual: shaded(0, 10, 0.1, () => 0.1, (x) => x >= 2 - 1e-9 && x <= 5 + 1e-9, 1),
    },
    { type: "section", title: "정규분포", sub: "자연과 공학에서 가장 자주 만나는 분포" },
    {
      type: "metaphor",
      title: "과녁의 화살: 가운데로 모이는 오차",
      image: "w08_과녁",
      lines: [
        "중심 근처의 화살 다수, 크게 벗어난 화살 소수",
        "측정 오차도 같은 모양: 작은 오차 다수, 큰 오차 소수",
        "이 모양을 나타내는 분포가 정규분포",
      ],
    },
    {
      type: "concept",
      title: "정규분포",
      term: "정규분포 N(m, σ^{2})",
      def: "평균 m, 표준편차 σ인 종 모양의 연속확률분포",
      formula: "f(x) = 1/(√(2π) σ) × e^{−(x−m)^{2}/(2σ^{2})}",
      note: "핵심: 공식 암기보다 그래프 모양과 m, σ의 역할",
      visual: (() => {
        const { xs, labels } = axis(-3.5, 3.5, 0.1);
        return { kind: "area", labels, series: [{ name: "N(0, 1)", values: xs.map((x) => r4(pdf(x))) }] };
      })(),
    },
    {
      type: "bullets",
      title: "정규분포 곡선의 성질",
      bullets: [
        "직선 x = m에 대하여 대칭",
        "x = m에서 최댓값",
        "m이 커지면 곡선이 오른쪽으로 평행이동",
        "σ가 커지면 낮고 넓게 퍼진 모양",
      ],
      visual: {
        kind: "line",
        labels: curves.labels,
        xTitle: "x",
        series: [
          { name: "N(0, 1)", values: curves.xs.map((x) => r4(pdf(x, 0, 1))) },
          { name: "N(2, 1)", values: curves.xs.map((x) => r4(pdf(x, 2, 1))) },
          { name: "N(0, 2²)", values: curves.xs.map((x) => r4(pdf(x, 0, 2))) },
        ],
      },
    },
    {
      type: "visual",
      title: "68–95–99.7 규칙",
      visual: { kind: "image", fig: "w08_689599.png" },
      caption: "평균에서 표준편차의 1배, 2배, 3배 안에 들어갈 확률",
    },
    {
      type: "stats",
      title: "저항값의 공차 해석",
      items: [
        { value: "68%", label: "100 ± 2Ω 안 (±1σ)" },
        { value: "95%", label: "100 ± 4Ω 안 (±2σ)" },
        { value: "99.7%", label: "100 ± 6Ω 안 (±3σ)" },
      ],
      note: "저항값 X ~ N(100, 2^{2}), 단위 Ω: 공차 ±2σ면 약 5%가 불합격",
    },
    { type: "section", title: "표준화", sub: "모든 정규분포를 하나의 표로 계산하기" },
    {
      type: "concept",
      title: "표준화",
      term: "표준화",
      def: "평균을 빼고 표준편차로 나누어 N(0, 1)로 바꾸는 과정",
      formula: "Z = (X − m)/σ",
      note: "X ~ N(m, σ^{2}) 이면 Z ~ N(0, 1): 표준정규분포",
      visual: { kind: "image", fig: "w08_표준화.png" },
    },
    {
      type: "bullets",
      title: "표준정규분포표 읽기",
      bullets: [
        "표의 값: P(0 ≤ Z ≤ z), 0부터 z까지의 넓이",
        "대칭 이용: P(−z ≤ Z ≤ 0) = P(0 ≤ Z ≤ z)",
        "오른쪽 꼬리: P(Z ≥ z) = 0.5 − P(0 ≤ Z ≤ z)",
      ],
      visual: {
        kind: "table",
        rows: [
          ["z", "P(0 ≤ Z ≤ z)"],
          ["0.5", "0.1915"],
          ["1.0", "0.3413"],
          ["1.5", "0.4332"],
          ["2.0", "0.4772"],
          ["2.5", "0.4938"],
          ["3.0", "0.4987"],
        ],
      },
    },
    {
      type: "example",
      title: "저항값의 합격 비율",
      tag: "공학",
      problem: "저항값 X ~ N(100, 2^{2}) (단위 Ω). 98 ≤ X ≤ 104인 저항의 비율?",
      steps: [
        "표준화: Z = (X − 100)/2",
        "98 → Z = −1, 104 → Z = 2",
        "P(−1 ≤ Z ≤ 2) = P(0 ≤ Z ≤ 1) + P(0 ≤ Z ≤ 2)",
        "= 0.3413 + 0.4772",
      ],
      answer: "0.8185, 약 81.9%",
      visual: shaded(93, 107, 0.2, (x) => pdf(x, 100, 2), (x) => x >= 98 - 1e-9 && x <= 104 + 1e-9, 2),
    },
    {
      type: "example",
      title: "측정 오차가 클 확률",
      tag: "공학",
      problem: "길이 측정 오차 X ~ N(0, 0.5^{2}) (단위 mm). 오차의 크기가 1mm를 넘을 확률?",
      steps: [
        "|X| > 1: X < −1 또는 X > 1",
        "표준화: ±1 → Z = ±1/0.5 = ±2",
        "P(|Z| > 2) = 2 × (0.5 − 0.4772)",
      ],
      answer: "0.0456, 약 4.6%",
      visual: shaded(-3.5, 3.5, 0.1, (x) => pdf(x), (x) => Math.abs(x) >= 2 - 1e-9),
    },
    {
      type: "quiz",
      questions: [
        { q: "연속확률변수 X에 대하여 P(X = 3)의 값", a: "0 (한 점의 넓이 = 0)" },
        { q: "X ~ N(50, 4^{2})일 때 X = 58을 표준화한 값", a: "Z = (58 − 50)/4 = 2" },
        { q: "Z ~ N(0, 1)에서 P(Z ≥ 1)의 값 (P(0 ≤ Z ≤ 1) = 0.3413)", a: "0.5 − 0.3413 = 0.1587" },
      ],
    },
    {
      type: "summary",
      items: [
        { head: "연속확률변수", body: "확률 = 확률밀도함수 그래프 아래 넓이, P(X = a) = 0" },
        { head: "정규분포 N(m, σ^{2})", body: "x = m에 대칭인 종 모양, σ가 클수록 넓게 퍼짐" },
        { head: "표준화", body: "Z = (X − m)/σ로 바꾼 뒤 표준정규분포표 이용" },
      ],
      next: "다음 주: 모집단과 표본, 표본평균의 분포",
    },
  ],
};
