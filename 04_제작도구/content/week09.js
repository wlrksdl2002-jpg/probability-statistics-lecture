// 9주차: 모집단과 표본, 표본평균의 분포
const pdf = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const r4 = (v) => Math.round(v * 10000) / 10000;

// lo~hi 를 step 간격으로 나눈 곡선(1번 계열) + 색칠 구간(2번 계열)
function shaded(lo, hi, step, f, inside, labelEvery = 1) {
  const xs = [];
  for (let x = lo; x <= hi + 1e-9; x += step) xs.push(Math.round(x * 1000) / 1000);
  const labels = xs.map((x) => (Math.abs(x / labelEvery - Math.round(x / labelEvery)) < 1e-9 ? String(x) : ""));
  return {
    kind: "area",
    labels,
    series: [
      { name: "전체", values: xs.map((x) => r4(f(x))) },
      { name: "구하는 확률", values: xs.map((x) => (inside(x) ? r4(f(x)) : 0)) },
    ],
  };
}

module.exports = {
  week: 9,
  title: "모집단과 표본, 표본평균의 분포",
  slides: [
    {
      type: "cover", bg: "w09_cover",
      title: "모집단과 표본",
      subtitle: "일부만 보고 전체를 아는 방법",
      image: "w09_갈톤보드",
    },
    {
      type: "goals",
      items: [
        "모집단, 표본, 임의추출의 뜻 이해",
        "표본평균의 평균·분산·표준편차 계산",
        "표본평균의 분포와 이항분포의 정규근사 활용",
      ],
    },
    { type: "section", title: "모집단과 표본", sub: "전체를 다 조사할 수 없을 때" },
    {
      type: "concept",
      title: "모집단과 표본",
      term: "모집단 · 표본",
      def: "조사 대상 전체 = 모집단, 모집단에서 뽑은 일부 = 표본",
      note: "표본의 크기 n: 뽑은 자료의 개수",
      visual: { kind: "image", fig: "w09_모집단표본.png" },
    },
    {
      type: "compare",
      title: "전수조사와 표본조사",
      left: {
        head: "전수조사",
        items: ["모집단 전체를 조사", "정확하지만 큰 시간과 비용", "예: 인구 총조사"],
      },
      right: {
        head: "표본조사",
        items: ["모집단의 일부만 조사", "빠르고 경제적", "예: 전구 수명 시험(파괴 검사)", "예: 반도체 웨이퍼 샘플 검사"],
      },
    },
    {
      type: "bullets",
      title: "임의추출",
      bullets: [
        "임의추출: 모든 대상이 뽑힐 확률이 같도록 추출",
        "복원추출: 뽑은 것을 되돌려 놓고 다시 추출",
        "비복원추출: 되돌려 놓지 않고 추출",
        "생산 라인: 난수로 검사할 부품 번호 선택",
      ],
      visual: { kind: "formula", text: "임의추출 = 공정한 추첨", note: "치우친 표본 → 잘못된 결론" },
    },
    {
      type: "bullets",
      title: "모수와 통계량",
      bullets: [
        "모수: 모집단의 특성값 (모평균 m, 모표준편차 σ)",
        "통계량: 표본에서 계산한 값 (표본평균 X̄)",
        "모수는 고정된 값, 통계량은 표본마다 달라지는 확률변수",
      ],
      visual: {
        kind: "table",
        rows: [
          ["구분", "모집단", "표본"],
          ["평균", "모평균 m", "표본평균 X̄"],
          ["분산", "모분산 σ^{2}", "표본분산 S^{2}"],
          ["표준편차", "모표준편차 σ", "표본표준편차 S"],
        ],
      },
    },
    { type: "section", title: "표본평균의 분포", sub: "표본평균도 확률변수" },
    {
      type: "visual",
      title: "주사위 2개 눈의 평균 X̄의 분포",
      visual: {
        kind: "bar",
        labels: ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6"],
        values: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1],
        highlight: [5],
        xTitle: "표본평균 X̄",
        yTitle: "경우의 수 (전체 36)",
      },
      caption: "모집단: 주사위 눈 1~6 (m = 3.5). 36가지 중 X̄ = 3.5가 6가지로 최다",
    },
    {
      type: "concept",
      title: "표본평균의 평균과 분산",
      term: "표본평균 X̄의 평균·분산",
      def: "모평균 m, 모분산 σ^{2}인 모집단에서 크기 n인 표본을 임의추출할 때",
      formula: "E(X̄) = m,  V(X̄) = σ^{2}/n,  σ(X̄) = σ/√n",
      note: "n이 커질수록 m 근처로 더 모이는 X̄",
      visual: {
        kind: "bar",
        labels: ["n = 1", "n = 4", "n = 16", "n = 64"],
        values: [4, 2, 1, 0.5],
        yTitle: "σ(X̄) (σ = 4일 때)",
        fmt: "0.0",
      },
    },
    {
      type: "visual",
      title: "n이 커지면 X̄의 분포는 종 모양",
      visual: {
        kind: "steps",
        figs: ["w09_표본평균_n1.png", "w09_표본평균_n2.png", "w09_표본평균_n5.png", "w09_표본평균_n30.png"],
        labels: ["n = 1", "n = 2", "n = 5", "n = 30"],
      },
      caption: "주사위를 n개 던져 구한 눈의 평균, 20000번 시뮬레이션 (점선: 모평균 3.5)",
    },
    {
      type: "metaphor",
      title: "갈톤 보드: 작은 우연이 모여 종 모양",
      image: "w09_갈톤보드",
      lines: [
        "못을 만날 때마다 왼쪽 또는 오른쪽으로 이동하는 구슬",
        "우연한 이동이 여러 번 더해진 결과 → 가운데에 가장 많은 구슬",
        "많은 값의 합과 평균은 정규분포에 가까워지는 성질",
      ],
    },
    {
      type: "concept",
      title: "표본평균의 분포",
      term: "표본평균의 분포",
      def: "모집단이 정규분포면 X̄도 정규분포, 정규분포가 아니어도 n이 충분히 크면 근사적으로 정규분포",
      formula: "X̄ ~ N(m, σ^{2}/n)",
      note: "보통 n ≥ 30이면 충분히 큰 것으로 취급",
      visual: { kind: "image", fig: "w09_표본평균_n30.png" },
    },
    {
      type: "example",
      title: "부품 무게의 표본평균",
      tag: "공학",
      problem: "부품 무게: 모평균 50g, 모표준편차 4g. 16개를 임의추출할 때 표본평균이 52g 이상일 확률?",
      steps: [
        "X̄ ~ N(50, 4^{2}/16) = N(50, 1^{2})",
        "표준화: Z = (52 − 50)/1 = 2",
        "P(X̄ ≥ 52) = P(Z ≥ 2) = 0.5 − 0.4772",
      ],
      answer: "0.0228, 약 2.3%",
      visual: shaded(46.5, 53.5, 0.1, (x) => pdf(x, 50, 1), (x) => x >= 52 - 1e-9),
    },
    { type: "section", title: "이항분포의 정규근사", sub: "n이 크면 이항분포도 종 모양" },
    {
      type: "visual",
      title: "n이 커지면 이항분포는 정규분포 모양",
      visual: {
        kind: "steps",
        figs: ["w09_이항근사_n10.png", "w09_이항근사_n50.png", "w09_이항근사_n400.png"],
        labels: ["n = 10", "n = 50", "n = 400"],
      },
      caption: "B(n, 0.1): 불량률 10%인 부품 n개 중 불량품 개수 (곡선: 근사 정규분포)",
    },
    {
      type: "concept",
      title: "이항분포의 정규근사",
      term: "이항분포의 정규근사",
      def: "n이 충분히 크면 이항분포 B(n, p)를 정규분포로 근사",
      formula: "B(n, p) ≈ N(np, npq),  q = 1 − p",
      note: "n이 충분히 큰 기준: 보통 np ≥ 5, nq ≥ 5",
      visual: { kind: "image", fig: "w09_이항근사_n400.png" },
    },
    {
      type: "example",
      title: "불량품 개수의 근사 확률",
      tag: "공학",
      problem: "불량률 10%인 공정에서 부품 400개 검사. 불량품이 46개 이하일 확률?",
      steps: [
        "X ~ B(400, 0.1): 평균 400 × 0.1 = 40",
        "분산 400 × 0.1 × 0.9 = 36, 표준편차 6",
        "X ≈ N(40, 6^{2}), Z = (46 − 40)/6 = 1",
        "P(Z ≤ 1) = 0.5 + 0.3413",
      ],
      answer: "0.8413, 약 84%",
      visual: shaded(22, 58, 0.5, (x) => pdf(x, 40, 6), (x) => x <= 46 + 1e-9, 6),
    },
    {
      type: "quiz",
      questions: [
        { q: "모평균 20, 모표준편차 6인 모집단에서 크기 9인 표본: E(X̄)와 σ(X̄)", a: "E(X̄) = 20, σ(X̄) = 6/√9 = 2" },
        { q: "표본의 크기를 4배로 늘리면 σ(X̄)는 몇 배?", a: "1/2배 (σ/√n에서 √4 = 2)" },
        { q: "X ~ B(100, 0.5)를 근사하는 정규분포", a: "N(50, 5^{2}) (np = 50, npq = 25)" },
      ],
    },
    {
      type: "summary",
      items: [
        { head: "모집단과 표본", body: "모집단의 일부를 임의추출한 것이 표본" },
        { head: "표본평균의 평균·분산", body: "E(X̄) = m, V(X̄) = σ^{2}/n" },
        { head: "표본평균의 분포", body: "n이 크면 X̄ ~ N(m, σ^{2}/n)" },
        { head: "정규근사", body: "n이 크면 B(n, p) ≈ N(np, npq)" },
      ],
      next: "다음 주: 모평균의 추정과 신뢰구간, 10주 정리",
    },
  ],
};
