// 5주차: 조건부확률, 곱셈정리, 독립, 독립시행
module.exports = {
  week: 5,
  title: "조건부확률과 독립",
  slides: [
    {
      type: "cover",
      title: "조건부확률과 독립",
      subtitle: "조건이 붙으면 확률이 바뀜",
      image: "w05_갈림길",
    },
    {
      type: "goals",
      items: [
        "조건부확률의 뜻과 계산",
        "확률의 곱셈정리와 수형도 활용",
        "사건의 독립과 독립시행의 확률",
      ],
    },
    { type: "section", title: "조건부확률", sub: "정보가 주어지면 표본공간이 줄어듦" },
    {
      type: "metaphor",
      title: "정보가 생기면 확률이 바뀜",
      image: "w05_우산",
      lines: [
        "아무 정보 없이 오늘 비가 올 확률: 30% (예시)",
        "먹구름이 낀 날로 한정하면 비가 올 확률: 70% (예시)",
        "'먹구름'이라는 조건이 붙은 확률 → **조건부확률**",
      ],
    },
    {
      type: "bullets",
      title: "두 공장에서 온 부품 100개",
      bullets: [
        "임의로 고른 부품이 불량일 확률: 7/100",
        "공장 A 부품 중에서 불량일 확률: 3/60 = 1/20",
        "기준(분모)이 전체 100개 → 공장 A의 60개로 축소",
        "**조건이 붙으면 분모가 바뀜**",
      ],
      visual: {
        kind: "table",
        rows: [
          ["", "정상", "불량", "합계"],
          ["공장 A", "57", "3", "60"],
          ["공장 B", "36", "4", "40"],
          ["합계", "93", "7", "100"],
        ],
      },
    },
    {
      type: "concept",
      title: "조건부확률의 정의",
      term: "조건부확률(conditional probability)",
      def: "사건 A가 일어났을 때 사건 B가 일어날 확률, 기호 P(B|A)",
      formula: "P(B|A) = P(A∩B) / P(A)   (단, P(A) > 0)",
      note: "A가 새로운 표본공간 역할",
      visual: { kind: "image", fig: "w05_조건부_벤.png" },
    },
    {
      type: "example",
      title: "불량품은 어느 공장 제품인가",
      tag: "공학",
      problem: "앞의 부품 100개 중 임의로 고른 부품이 불량품일 때, 이 부품이 공장 B 제품일 확률",
      steps: [
        "조건: 불량품 → 새 표본공간 = 불량품 7개",
        "그중 공장 B 제품: 4개",
        "P(B|불량) = (4/100) / (7/100)",
      ],
      answer: "4/7 ≈ 0.571",
      visual: {
        kind: "bar",
        labels: ["공장 A", "공장 B"],
        values: [3, 4],
        title: "불량품 7개의 출처",
        highlight: [1],
        fmt: "0",
      },
    },
    { type: "section", title: "확률의 곱셈정리", sub: "잇달아 일어나는 사건의 확률" },
    {
      type: "concept",
      title: "확률의 곱셈정리",
      term: "곱셈정리",
      def: "두 사건이 함께 일어날 확률 = 첫 사건의 확률 × 그 조건에서 두 번째 사건의 확률",
      formula: "P(A∩B) = P(A)P(B|A) = P(B)P(A|B)",
      note: "조건부확률 정의식의 양변에 P(A)를 곱한 형태",
      visual: {
        kind: "tree",
        root: "부품 10개",
        children: [
          {
            label: "불량",
            p: "2/10",
            children: [
              { label: "불량", p: "1/9", result: "1/45" },
              { label: "정상", p: "8/9", result: "8/45" },
            ],
          },
          {
            label: "정상",
            p: "8/10",
            children: [
              { label: "불량", p: "2/9", result: "8/45" },
              { label: "정상", p: "7/9", result: "28/45" },
            ],
          },
        ],
      },
    },
    {
      type: "example",
      title: "부품 2개를 차례로 꺼내기",
      tag: "공학",
      problem: "불량품 2개가 섞인 부품 10개에서 1개씩 2번 꺼낼 때(꺼낸 부품은 다시 넣지 않는 조건), 2개 모두 불량품일 확률",
      steps: [
        "A: 첫 번째가 불량 → P(A) = 2/10",
        "첫 번째가 불량일 때 두 번째도 불량 → P(B|A) = 1/9",
        "곱셈정리: P(A∩B) = 2/10 × 1/9 = 2/90",
      ],
      answer: "1/45",
      visual: {
        kind: "slots",
        slots: [
          { top: "2/10", bottom: "첫째 불량" },
          { top: "1/9", bottom: "둘째 불량" },
        ],
        op: "×",
      },
    },
    {
      type: "example",
      title: "검사기의 '불량' 판정",
      tag: "공학",
      problem: "불량률 2%인 생산 라인. 검사기는 불량품을 95% 확률로, 정상품을 5% 확률로 '불량'이라고 판정. 임의의 제품이 '불량' 판정을 받을 확률",
      steps: [
        "불량품 + 불량 판정: 0.02 × 0.95 = 0.019",
        "정상품 + 불량 판정(오판정): 0.98 × 0.05 = 0.049",
        "두 경우는 동시에 일어날 수 없는 배반 관계 → 합의 법칙",
      ],
      answer: "0.019 + 0.049 = 0.068",
      visual: {
        kind: "tree",
        root: "제품",
        children: [
          {
            label: "불량",
            p: "0.02",
            children: [
              { label: "불량 판정", p: "0.95", result: "0.019" },
              { label: "정상 판정", p: "0.05", result: "0.001" },
            ],
          },
          {
            label: "정상",
            p: "0.98",
            children: [
              { label: "불량 판정", p: "0.05", result: "0.049" },
              { label: "정상 판정", p: "0.95", result: "0.931" },
            ],
          },
        ],
      },
    },
    {
      type: "stats",
      title: "'불량' 판정 제품이 진짜 불량일 확률",
      items: [
        { value: "0.068", label: "'불량' 판정을 받을 확률" },
        { value: "0.019", label: "진짜 불량이면서 '불량' 판정" },
        { value: "약 28%", label: "P(진짜 불량 | '불량' 판정)" },
      ],
      note: "0.019 / 0.068 ≈ 0.279: 불량률이 낮으면 '불량' 판정의 대부분이 오판정",
    },
    { type: "section", title: "사건의 독립", sub: "서로 영향을 주지 않는 사건" },
    {
      type: "concept",
      title: "독립과 종속",
      term: "독립(independent)",
      def: "한 사건의 발생이 다른 사건의 확률에 영향을 주지 않는 관계",
      formula: "P(A∩B) = P(A)P(B)",
      note: "P(B|A) = P(B)와 같은 뜻. 독립이 아니면 종속(dependent)",
      visual: {
        kind: "table",
        rows: [
          ["관계", "조건부확률", "곱셈정리"],
          ["독립", "P(B|A) = P(B)", "P(A∩B) = P(A)P(B)"],
          ["종속", "P(B|A) ≠ P(B)", "P(A∩B) = P(A)P(B|A)"],
        ],
      },
    },
    {
      type: "compare",
      title: "복원 추출과 비복원 추출",
      left: {
        head: "복원 추출 → 독립",
        items: [
          "꺼낸 부품을 다시 넣고 다음 추출",
          "두 번째 불량 확률은 그대로: 2/10",
          "둘 다 불량: 2/10 × 2/10 = 1/25",
        ],
      },
      right: {
        head: "비복원 추출 → 종속",
        items: [
          "꺼낸 부품을 넣지 않고 다음 추출",
          "두 번째 불량 확률 변화: 1/9",
          "둘 다 불량: 2/10 × 1/9 = 1/45",
        ],
      },
    },
    {
      type: "metaphor",
      title: "줄줄이 연결된 전구",
      image: "w05_전구",
      lines: [
        "직렬 전구 줄: 전구 하나만 나가도 줄 전체가 꺼짐",
        "모든 부품이 작동해야 하는 구조 → 확률의 곱",
        "부품끼리 **독립**이라고 가정하면 계산이 간단",
      ],
    },
    {
      type: "visual",
      title: "직렬 회로와 병렬 회로의 신뢰도",
      visual: { kind: "steps", figs: ["w05_직렬.png", "w05_병렬.png"], labels: ["직렬", "병렬"] },
      caption: "각 부품의 작동 확률 0.9, 부품끼리 서로 독립",
    },
    {
      type: "bullets",
      title: "부품 수에 따른 시스템 신뢰도",
      bullets: [
        "직렬: 부품이 늘수록 신뢰도 감소 (0.9^{3} = 0.729)",
        "병렬: 부품이 늘수록 신뢰도 증가 (1 − 0.1^{3} = 0.999)",
        "항공기·서버의 **이중화(redundancy)** 설계 근거",
      ],
      visual: {
        kind: "bar",
        labels: ["부품 1개", "직렬 2개", "직렬 3개", "병렬 2개", "병렬 3개"],
        values: [0.9, 0.81, 0.729, 0.99, 0.999],
        title: "시스템이 작동할 확률",
        highlight: [3, 4],
        fmt: "0.000",
      },
    },
    {
      type: "concept",
      title: "독립시행의 확률",
      term: "독립시행",
      def: "같은 시행을 매번 독립적으로 반복하는 것. 한 번에 사건 A가 일어날 확률 p",
      formula: "n번 중 A가 r번 일어날 확률 = _{n}C_{r} p^{r} q^{n−r}",
      note: "q = 1 − p, _{n}C_{r} = A가 일어나는 r번의 자리를 고르는 방법의 수",
      visual: {
        kind: "tree",
        root: "시작",
        children: [
          {
            label: "앞",
            p: "1/2",
            children: [
              { label: "앞", p: "1/2", children: [{ label: "앞", p: "1/2", result: "앞 3번" }, { label: "뒤", p: "1/2", result: "앞 2번" }] },
              { label: "뒤", p: "1/2", children: [{ label: "앞", p: "1/2", result: "앞 2번" }, { label: "뒤", p: "1/2", result: "앞 1번" }] },
            ],
          },
          {
            label: "뒤",
            p: "1/2",
            children: [
              { label: "앞", p: "1/2", children: [{ label: "앞", p: "1/2", result: "앞 2번" }, { label: "뒤", p: "1/2", result: "앞 1번" }] },
              { label: "뒤", p: "1/2", children: [{ label: "앞", p: "1/2", result: "앞 1번" }, { label: "뒤", p: "1/2", result: "앞 0번" }] },
            ],
          },
        ],
      },
    },
    {
      type: "example",
      title: "5비트 전송 중 1비트 오류",
      tag: "공학",
      problem: "비트 하나가 잘못 전송될 확률 0.1인 통신 채널. 5비트를 보낼 때 정확히 1비트만 오류일 확률 (각 비트는 독립)",
      steps: [
        "오류 확률 p = 0.1, 정상 확률 q = 0.9",
        "오류가 난 비트의 위치 고르기: _{5}C_{1} = 5",
        "_{5}C_{1} × 0.1^{1} × 0.9^{4} = 5 × 0.1 × 0.6561",
      ],
      answer: "0.32805 ≈ 0.328",
      visual: {
        kind: "slots",
        slots: [
          { top: "0.9", bottom: "1번 정상" },
          { top: "0.1", bottom: "2번 오류" },
          { top: "0.9", bottom: "3번 정상" },
          { top: "0.9", bottom: "4번 정상" },
          { top: "0.9", bottom: "5번 정상" },
        ],
        op: "×",
      },
    },
    {
      type: "quiz",
      questions: [
        { q: "P(A) = 0.5, P(A∩B) = 0.2일 때 P(B|A)", a: "0.2 / 0.5 = 0.4" },
        { q: "작동 확률 0.8인 부품 2개를 병렬 연결한 시스템의 작동 확률 (독립)", a: "1 − 0.2 × 0.2 = 0.96" },
        { q: "동전 4번 던질 때 앞면이 정확히 2번 나올 확률", a: "_{4}C_{2} × (1/2)^{4} = 6/16 = 3/8" },
      ],
    },
    {
      type: "summary",
      items: [
        { head: "조건부확률", body: "P(B|A) = P(A∩B) / P(A)" },
        { head: "곱셈정리", body: "P(A∩B) = P(A)P(B|A)" },
        { head: "독립", body: "P(A∩B) = P(A)P(B), 직렬·병렬 신뢰도 계산" },
        { head: "독립시행", body: "_{n}C_{r} p^{r} q^{n−r}" },
      ],
      next: "다음 주: 확률변수와 확률분포, 기댓값과 분산",
    },
  ],
};
