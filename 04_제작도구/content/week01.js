// 1주차: 원순열과 중복순열 (교과서 Ⅰ-1, p.10~15)
module.exports = {
  week: 1,
  title: "원순열과 중복순열",
  slides: [
    { type: "cover", bg: "w01_cover", title: "원순열과 중복순열", subtitle: "경우의 수 (1) · 교과서 p.10~15", image: "w01_관람차" },
    {
      type: "bullets", title: "10주 강의 흐름",
      bullets: [
        "1~3주: 경우의 수, 확률 계산의 출발점",
        "4~5주: 확률, 불확실성을 수로 표현",
        "6~8주: 확률분포, 불확실성의 모양",
        "9~10주: 통계적 추정, 표본으로 전체 추측",
      ],
      visual: { kind: "table", rows: [["구간", "주차", "핵심 질문"], ["경우의 수", "1~3", "몇 가지?"], ["확률", "4~5", "얼마나 자주?"], ["확률분포", "6~8", "어떤 모양?"], ["통계", "9~10", "전체는 어떨까?"]] },
    },
    {
      type: "bullets", title: "왜 경우의 수부터인가",
      bullets: [
        "확률 = (원하는 경우의 수) / (전체 경우의 수)",
        "경우의 수 계산이 곧 확률 계산의 출발점",
        "공학 사례: 비밀번호 보안 강도, 테스트 조합 수",
        "공학 사례: 회로 배선 경우, 부품 배치 방법",
      ],
      visual: { kind: "formula", text: "P(A) = n(A) / n(S)", note: "분자·분모 모두 경우의 수" },
    },
    {
      type: "goals",
      items: [
        "원순열의 뜻 이해와 원순열의 수 계산",
        "중복순열의 뜻 이해와 중복순열의 수 계산",
        "두 개념의 공학 문제 적용",
      ],
    },

    { type: "section", title: "복습: 합·곱의 법칙, 순열, 조합", sub: "고등학교 수학에서 배운 내용" },
    {
      type: "bullets", title: "합의 법칙과 곱의 법칙",
      bullets: [
        "**합의 법칙**: 동시에 일어나지 않는 두 사건 → 경우의 수의 합",
        "**곱의 법칙**: 잇달아 일어나는 두 사건 → 경우의 수의 곱",
        "예: 상의 2벌, 하의 3벌 → 옷 입는 방법 2 × 3 = 6가지",
      ],
      visual: {
        kind: "tree", root: "시작",
        children: [
          { label: "상의1", children: [{ label: "하의1" }, { label: "하의2" }, { label: "하의3" }] },
          { label: "상의2", children: [{ label: "하의1" }, { label: "하의2" }, { label: "하의3" }] },
        ],
      },
    },
    {
      type: "concept", title: "순열과 계승(!)",
      term: "순열 _{n}P_{r}", def: "서로 다른 n개에서 r개를 택해 일렬로 배열하는 경우의 수",
      formula: "_{n}P_{r} = n!/(n−r)!", note: "0! = 1, n! = n × (n−1) × … × 2 × 1",
      visual: { kind: "slots", slots: [{ top: "n", bottom: "첫째" }, { top: "n−1", bottom: "둘째" }, { top: "n−2", bottom: "셋째" }, { top: "…", bottom: "" }, { top: "n−r+1", bottom: "r째" }], op: "×" },
    },
    {
      type: "compare", title: "순열과 조합의 차이",
      left: { head: "순열 _{n}P_{r}: 순서 고려", items: ["ABC, ACB, BAC, BCA, CAB, CBA", "모두 서로 다른 6가지", "_{3}P_{3} = 3! = 6"] },
      right: { head: "조합 _{n}C_{r}: 순서 무시", items: ["{A, B, C} 하나로 취급", "순열 3!가지가 조합 1가지", "_{n}C_{r} = n!/(r!(n−r)!)"] },
    },

    { type: "section", title: "원순열", sub: "회전하면 같은 배열" },
    { type: "metaphor", title: "생각 열기: 원탁의 기사", image: "w01_원탁", lines: ["상석도 말석도 없는 원탁", "모두가 한 칸씩 옮겨 앉아도 같은 배치", "의미 있는 것은 \"누구 옆에 누가\"라는 관계"] },
    {
      type: "metaphor", title: "생각 열기: 바람개비 [교과서 p.11]", image: "w01_바람개비",
      lines: ["날개 색 순서가 같으면 같은 바람개비", "90°씩 돌려도 같은 바람개비", "일렬 배열과 원형 배열의 결정적 차이: 회전"],
    },
    {
      type: "compare", title: "일렬 배열 vs 원형 배열",
      left: { head: "일렬 배열", items: ["ABCD, BCDA, CDAB, DABC", "맨 앞이 누구인지가 다름", "→ 서로 다른 4가지"] },
      right: { head: "원형 배열", items: ["네 배열 모두 회전하면 일치", "시작점이라는 개념의 부재", "→ 같은 1가지"] },
    },
    {
      type: "concept", title: "원순열의 뜻",
      term: "원순열", def: "서로 다른 것을 원 모양으로 배열하는 순열. 회전하여 일치하는 경우는 모두 같은 것으로 취급",
      visual: { kind: "circle", items: ["A", "B", "C", "D"] },
    },
    {
      type: "bullets", title: "원순열의 수 유도",
      bullets: [
        "일렬 배열 n!가지를 원 모양으로 배치",
        "회전하여 같아지는 배열이 n가지씩 존재",
        "따라서 원순열의 수 = n!/n = (n−1)!",
        "예: 4명 → 4!/4 = 24/4 = 6가지",
      ],
      visual: { kind: "formula", text: "n!/n = (n−1)!", note: "같은 것이 n개씩 묶여 있으므로 n으로 나눔" },
    },
    {
      type: "bullets", title: "다른 관점: 한 자리 고정",
      bullets: [
        "한 사람의 자리를 먼저 고정 → 회전의 기준점 생성",
        "나머지 (n−1)명을 일렬로 배열하는 문제로 변환",
        "결과는 같은 (n−1)!",
      ],
      visual: { kind: "slots", slots: [{ top: "A", bottom: "고정" }, { top: "3", bottom: "둘째 자리" }, { top: "2", bottom: "셋째 자리" }, { top: "1", bottom: "넷째 자리" }], op: "×" },
    },
    {
      type: "example", title: "원탁에 둘러앉기", tag: "교과서",
      problem: "A, B, C, D, E 5명이 원 모양의 탁자에 둘러앉는 방법의 수",
      steps: ["서로 다른 5개의 원순열", "(5−1)! = 4!", "4! = 4 × 3 × 2 × 1"],
      answer: "24가지",
      visual: { kind: "circle", items: ["A", "B", "C", "D", "E"] },
    },
    {
      type: "example", title: "부모가 이웃하여 앉기", tag: "교과서",
      problem: "아버지·어머니를 포함한 6명의 가족이 원탁에 앉을 때, 부모가 이웃하여 앉는 방법의 수",
      steps: ["부모를 한 묶음으로 보면 5명(묶음)의 원순열: (5−1)! = 24", "묶음 안에서 부모가 자리를 바꾸는 방법: 2! = 2", "곱의 법칙: 24 × 2"],
      answer: "48가지",
      visual: { kind: "circle", items: ["부모", "자녀1", "자녀2", "자녀3", "자녀4"] },
    },
    {
      type: "example", title: "원형 센서 배치", tag: "공학",
      problem: "서로 다른 센서 6개를 회전 대칭인 원형 측정 장치 둘레에 같은 간격으로 배치하는 방법의 수",
      steps: ["장치가 회전 대칭 → 회전하여 같은 배치는 같은 배치", "서로 다른 6개의 원순열", "(6−1)! = 5! = 120"],
      answer: "120가지",
      visual: { kind: "circle", items: ["온도", "압력", "습도", "진동", "가스", "조도"] },
    },

    { type: "section", title: "중복순열", sub: "같은 것을 여러 번 택할 수 있을 때" },
    {
      type: "metaphor", title: "생각 열기: 번호 자물쇠", image: "w01_자물쇠",
      lines: ["각 칸마다 0~9 중 아무 숫자나 선택 가능", "같은 숫자를 여러 번 써도 됨: 0000, 7777도 가능", "4칸 → 10 × 10 × 10 × 10 = 10,000가지"],
    },
    {
      type: "concept", title: "중복순열의 뜻과 수",
      term: "중복순열 _{n}Π_{r}", def: "서로 다른 n개에서 중복을 허용하여 r개를 택하는 순열",
      formula: "_{n}Π_{r} = n^{r}", note: "중복 허용 → r > n 도 가능",
      visual: { kind: "slots", slots: [{ top: "n", bottom: "첫째" }, { top: "n", bottom: "둘째" }, { top: "n", bottom: "셋째" }, { top: "…", bottom: "" }, { top: "n", bottom: "r째" }], op: "×" },
    },
    {
      type: "example", title: "편지와 우체통", tag: "교과서",
      problem: "서로 다른 편지 5통을 두 우체통 A, B에 넣는 방법의 수",
      steps: ["편지 한 통마다 우체통 A 또는 B 선택: 2가지", "편지 5통이 각자 선택 → 2에서 5개를 택하는 중복순열", "_{2}Π_{5} = 2^{5}"],
      answer: "32가지",
      visual: { kind: "slots", slots: [{ top: "2", bottom: "편지1" }, { top: "2", bottom: "편지2" }, { top: "2", bottom: "편지3" }, { top: "2", bottom: "편지4" }, { top: "2", bottom: "편지5" }], op: "×" },
    },
    {
      type: "bullets", title: "주의: 무엇이 무엇을 고르는가",
      bullets: [
        "\"선택하는 쪽\"의 개수가 지수 r",
        "\"선택지\"의 개수가 밑 n",
        "편지(5통)가 우체통(2개)을 고름 → 2^{5}, 5^{2} 아님",
        "헷갈리면 \"칸 = 선택하는 쪽\"으로 칸 그림 그리기",
      ],
      visual: { kind: "formula", text: "(선택지 수)^{(선택하는 쪽 수)}", note: "2^{5} = 32 ≠ 5^{2} = 25" },
    },
    {
      type: "visual", title: "이진 코드: 비트가 늘면 경우의 수는 2배씩", caption: "n비트 이진 코드의 개수 = _{2}Π_{n} = 2^{n}",
      visual: { kind: "bar", labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], values: [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], xTitle: "비트 수 n", yTitle: "코드 개수", highlight: [7], fmt: "0" },
    },
    {
      type: "example", title: "서버 작업 할당", tag: "공학",
      problem: "서로 다른 작업 5개를 서버 3대에 할당하는 방법의 수 (작업이 없는 서버 허용)",
      steps: ["작업 하나마다 서버 3대 중 하나 선택", "선택하는 쪽 = 작업(5개), 선택지 = 서버(3대)", "_{3}Π_{5} = 3^{5}"],
      answer: "243가지",
      visual: { kind: "slots", slots: [{ top: "3", bottom: "작업1" }, { top: "3", bottom: "작업2" }, { top: "3", bottom: "작업3" }, { top: "3", bottom: "작업4" }, { top: "3", bottom: "작업5" }], op: "×" },
    },
    {
      type: "stats", title: "비밀번호 길이와 보안 강도", note: "모두 중복순열: (문자 종류 수)^{(자릿수)}",
      items: [
        { value: "1만", label: "숫자 4자리: 10^{4}" },
        { value: "100만", label: "숫자 6자리 OTP: 10^{6}" },
        { value: "약 2.8조", label: "소문자+숫자 8자리: 36^{8}" },
      ],
    },

    {
      type: "quiz",
      questions: [
        { q: "서로 다른 7개의 구슬을 원형으로 배열하는 방법의 수", a: "(7−1)! = 6! = 720" },
        { q: "0과 1만 사용한 10자리 이진 코드의 개수", a: "_{2}Π_{10} = 2^{10} = 1024" },
        { q: "서로 다른 공 4개를 서로 다른 상자 3개에 넣는 방법의 수 (빈 상자 허용)", a: "_{3}Π_{4} = 3^{4} = 81" },
      ],
    },
    {
      type: "summary",
      items: [
        { head: "원순열", body: "회전하여 같은 배열은 하나로 취급, (n−1)!" },
        { head: "중복순열", body: "중복을 허용하는 순열, _{n}Π_{r} = n^{r}" },
        { head: "핵심 요령", body: "기준점 고정, 선택하는 쪽을 칸으로 그리기" },
      ],
      next: "다음 주: 같은 것이 있는 순열과 중복조합",
    },
  ],
};
