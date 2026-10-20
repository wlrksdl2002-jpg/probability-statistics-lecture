// 10주차: 모평균의 추정과 10주 정리
const pdf = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const r2 = (v) => Math.round(v * 100) / 100;
const r4 = (v) => Math.round(v * 10000) / 10000;

// 표준정규분포 곡선(1번 계열) + −z ~ z 색칠(2번 계열)
function central(z) {
  const xs = [];
  for (let x = -3.5; x <= 3.5 + 1e-9; x += 0.04) xs.push(Math.round(x * 100) / 100);
  return {
    kind: "area",
    labels: xs.map((x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : "")),
    series: [
      { name: "전체", values: xs.map((x) => r4(pdf(x))) },
      { name: "신뢰도", values: xs.map((x) => (Math.abs(x) <= z + 1e-9 ? r4(pdf(x)) : 0)) },
    ],
  };
}

// 신뢰도 95% 신뢰구간 길이 = 2 × 1.96 × σ/√n (σ = 20시간)
const width = (n) => r2((2 * 1.96 * 20) / Math.sqrt(n));
const ns = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];

module.exports = {
  week: 10,
  title: "모평균의 추정과 10주 정리",
  slides: [
    {
      type: "cover", bg: "w10_cover",
      title: "모평균의 추정",
      subtitle: "표본으로 모평균의 범위를 말하는 방법",
      image: "w10_그물",
    },
    {
      type: "goals",
      items: [
        "점추정과 구간추정의 차이 이해",
        "신뢰도 95%, 99% 신뢰구간 계산",
        "표본의 크기와 신뢰구간 길이의 관계 이해",
      ],
    },
    { type: "section", title: "추정", sub: "모르는 모평균을 표본으로 짐작하기" },
    {
      type: "compare",
      title: "점추정과 구간추정",
      left: {
        head: "점추정",
        items: ["모평균을 값 하나로 추정", "예: 배터리 평균 수명 500시간", "간단하지만 정확도 정보 부재"],
      },
      right: {
        head: "구간추정",
        items: ["모평균이 들어 있을 범위로 추정", "예: 496.08 ~ 503.92시간", "정확도(신뢰도)를 함께 표현"],
      },
    },
    {
      type: "metaphor",
      title: "작살과 그물",
      image: "w10_그물",
      lines: [
        "점추정 = 작살: 한 점을 정확히 맞히기 어려운 방식",
        "구간추정 = 그물: 범위를 던져 잡을 가능성 증가",
        "넓은 그물(높은 신뢰도)일수록 잘 잡지만 위치는 덜 정밀",
      ],
    },
    { type: "section", title: "신뢰구간", sub: "표본평균의 분포에서 출발" },
    {
      type: "bullets",
      title: "신뢰구간의 유도",
      bullets: [
        "X̄ ~ N(m, σ^{2}/n) → Z = (X̄ − m)/(σ/√n) ~ N(0, 1)",
        "P(−1.96 ≤ Z ≤ 1.96) = 0.95",
        "괄호 안 부등식을 m에 대하여 정리",
        "X̄ − 1.96 σ/√n ≤ m ≤ X̄ + 1.96 σ/√n",
      ],
      visual: central(1.96),
    },
    {
      type: "concept",
      title: "모평균의 신뢰구간",
      term: "모평균 m의 신뢰구간",
      def: "모표준편차 σ인 모집단에서 크기 n인 표본의 표본평균 x̄ 이용",
      formula: "x̄ − 1.96 σ/√n ≤ m ≤ x̄ + 1.96 σ/√n",
      note: "신뢰도 95% 기준. 신뢰도 99%는 1.96 대신 2.58",
      visual: {
        kind: "table",
        rows: [
          ["신뢰도", "z 값", "의미"],
          ["95%", "1.96", "P(|Z| ≤ 1.96) = 0.95"],
          ["99%", "2.58", "P(|Z| ≤ 2.58) = 0.99"],
        ],
      },
    },
    {
      type: "example",
      title: "배터리 수명: 신뢰도 95%",
      tag: "공학",
      problem: "배터리 100개의 수명 표본평균 500시간, 모표준편차 20시간. 모평균 m의 신뢰도 95% 신뢰구간?",
      steps: ["σ/√n = 20/√100 = 2", "1.96 × 2 = 3.92", "500 − 3.92 ≤ m ≤ 500 + 3.92"],
      answer: "496.08 ≤ m ≤ 503.92 (시간)",
      visual: { kind: "formula", text: "x̄ ± 1.96 × σ/√n", note: "= 500 ± 3.92" },
    },
    {
      type: "example",
      title: "배터리 수명: 신뢰도 99%",
      tag: "공학",
      problem: "같은 자료(n = 100, x̄ = 500, σ = 20)로 신뢰도 99% 신뢰구간?",
      steps: ["σ/√n = 2", "2.58 × 2 = 5.16", "500 − 5.16 ≤ m ≤ 500 + 5.16"],
      answer: "494.84 ≤ m ≤ 505.16 (시간)",
      visual: {
        kind: "bar",
        labels: ["신뢰도 95%", "신뢰도 99%"],
        values: [7.84, 10.32],
        highlight: [1],
        yTitle: "구간 길이 (시간)",
        fmt: "0.00",
      },
    },
    {
      type: "visual",
      title: "신뢰구간 100개 시뮬레이션",
      visual: { kind: "image", fig: "w10_신뢰구간100.png" },
      caption: "표본을 100번 뽑아 만든 95% 신뢰구간: 청록 = m 포함(98개), 주황 = m 미포함(2개)",
    },
    {
      type: "bullets",
      title: "신뢰도 95%의 올바른 해석",
      bullets: [
        "같은 방법으로 신뢰구간을 100개 만들면 약 95개가 m을 포함",
        "m은 고정된 값, 표본마다 달라지는 것은 구간",
        "구간 하나의 m 포함 여부: 판단 불가",
      ],
      visual: { kind: "formula", text: "약 95개 / 100개", note: "모평균 m을 포함하는 구간의 비율" },
    },
    { type: "section", title: "표본의 크기와 구간 길이", sub: "더 정밀하게 추정하려면" },
    {
      type: "concept",
      title: "신뢰구간의 길이",
      term: "신뢰구간의 길이",
      def: "신뢰구간의 위 끝과 아래 끝의 차",
      formula: "길이 = 2 × 1.96 × σ/√n",
      note: "신뢰도 95% 기준. n을 4배로 하면 길이는 1/2배",
      visual: {
        kind: "bar",
        labels: ["n = 25", "n = 100", "n = 400", "n = 1600"],
        values: [width(25), width(100), width(400), width(1600)],
        yTitle: "구간 길이 (시간, σ = 20)",
        fmt: "0.00",
      },
    },
    {
      type: "stats",
      title: "신뢰도와 표본 크기의 효과",
      items: [
        { value: "7.84", label: "95%, n = 100" },
        { value: "10.32", label: "99%, n = 100: 신뢰도 ↑ → 길어짐" },
        { value: "3.92", label: "95%, n = 400: n ↑ → 짧아짐" },
      ],
      note: "배터리 수명 σ = 20시간, 신뢰구간 길이(단위: 시간)",
    },
    {
      type: "example",
      title: "필요한 표본의 크기",
      tag: "공학",
      problem: "배터리 수명 σ = 20시간. 신뢰도 95% 신뢰구간 길이를 4시간 이하로 하려면 n의 최솟값?",
      steps: ["2 × 1.96 × 20/√n ≤ 4", "√n ≥ 19.6", "n ≥ 384.16"],
      answer: "n = 385 (개)",
      visual: {
        kind: "line",
        labels: ns.map(String),
        xTitle: "표본의 크기 n",
        yTitle: "구간 길이 (시간)",
        series: [
          { name: "신뢰구간 길이", values: ns.map(width) },
          { name: "목표 4시간", values: ns.map(() => 4) },
        ],
      },
    },
    { type: "section", title: "10주 정리", sub: "경우의 수에서 통계적 추정까지" },
    {
      type: "visual",
      title: "10주 학습 지도",
      visual: {
        kind: "table",
        rows: [
          ["주차", "주제", "핵심 식"],
          ["1", "원순열, 중복순열", "(n − 1)!,  n^{r}"],
          ["2", "같은 것이 있는 순열, 중복조합", "n!/(p!q!r!),  _{n}H_{r}"],
          ["3", "이항정리, 파스칼의 삼각형", "(a + b)^{n}의 전개"],
          ["4", "확률의 뜻, 덧셈정리", "P(A∪B)"],
          ["5", "조건부확률, 독립", "P(B|A),  P(A∩B) = P(A)P(B)"],
          ["6", "이산확률변수, 기댓값", "E(X),  V(X)"],
          ["7", "이항분포", "B(n, p): np, npq"],
          ["8", "정규분포, 표준화", "Z = (X − m)/σ"],
          ["9", "표본평균의 분포", "E(X̄) = m,  V(X̄) = σ^{2}/n"],
          ["10", "모평균의 추정", "x̄ ± 1.96 σ/√n"],
        ],
      },
    },
    {
      type: "bullets",
      title: "한 줄로 잇는 확률과 통계",
      bullets: [
        "세는 방법(경우의 수)이 확률 계산의 기초",
        "확률변수와 확률분포로 불확실성을 모델링",
        "표본으로 모집단을 추정하는 것이 통계의 목표",
      ],
      visual: {
        kind: "slots",
        op: "→",
        slots: [
          { top: "경우의 수", bottom: "1~3주" },
          { top: "확률", bottom: "4~5주" },
          { top: "확률분포", bottom: "6~8주" },
          { top: "추정", bottom: "9~10주" },
        ],
      },
    },
    {
      type: "stats",
      title: "공학에서 다시 만날 확률과 통계",
      items: [
        { value: "품질관리", label: "불량률 관리 (이항·정규분포)" },
        { value: "신뢰성", label: "부품 고장 확률 (독립, 곱셈정리)" },
        { value: "측정", label: "측정 오차와 신뢰구간" },
        { value: "데이터", label: "표본 조사, 머신러닝" },
      ],
      note: "전공 과목(공학 통계, 품질공학, 신호처리, 인공지능)의 기초",
    },
    {
      type: "quiz",
      questions: [
        {
          q: "σ = 10, n = 25, x̄ = 80일 때 모평균 m의 신뢰도 95% 신뢰구간",
          a: "80 − 1.96 × 2 ≤ m ≤ 80 + 1.96 × 2 → 76.08 ≤ m ≤ 83.92",
        },
        { q: "다른 조건은 같고 신뢰도를 95%에서 99%로 높이면 구간 길이는?", a: "길어짐 (1.96 → 2.58)" },
        { q: "신뢰구간 길이를 1/3로 줄이려면 표본의 크기는 몇 배?", a: "9배 (길이는 1/√n에 비례)" },
      ],
    },
    {
      type: "summary",
      items: [
        { head: "구간추정", body: "모평균이 들어 있을 범위를 신뢰도와 함께 제시" },
        { head: "신뢰구간", body: "x̄ ± 1.96 σ/√n (95%), x̄ ± 2.58 σ/√n (99%)" },
        { head: "구간 길이", body: "신뢰도 ↑ → 길어짐, n ↑ → 짧아짐 (1/√n에 비례)" },
        { head: "10주 정리", body: "경우의 수 → 확률 → 확률분포 → 통계적 추정" },
      ],
      next: "다음 시간: 기말 정리와 질의응답",
    },
  ],
};
