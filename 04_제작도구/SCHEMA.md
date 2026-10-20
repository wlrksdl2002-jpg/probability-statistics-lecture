# 주차 내용 파일 규칙 (content/weekNN.js)

build.js 가 content/week01.js ~ week10.js 를 읽어 하나의 PPT(16:9, 13.33×7.5인치)로 만듦.
내용 작성자는 **데이터만** 작성. 위치·색·애니메이션은 build.js 가 처리.

```js
module.exports = {
  week: 2,
  title: "같은 것이 있는 순열과 중복조합",   // 주차 제목 (짧게)
  slides: [ /* 아래 슬라이드 객체들, 18~22장 */ ],
};
```

## 공통 규칙
- 말투: **명사형 종결** ("~이다/~합니다/~함/~임" 금지). 예: "회전하여 일치하는 배열은 같은 배열로 취급"
- 글머리표 1개 = 한 줄 분량(최대 약 40자). 슬라이드당 글머리표 최대 4개
- 수식 표기 미니 문법 (모든 텍스트 필드에서 사용 가능):
  - `_{...}` 아래첨자, `^{...}` 위첨자, `**...**` 굵게(강조색)
  - 예: `_{n}P_{r} = n!/(n−r)!`, `_{n}H_{r} = _{n+r−1}C_{r}`, `2^{10} = 1024`, `P(A|B)`, `σ^{2}`
  - 빼기는 `−`, 곱하기는 `×`, 나누기는 `/` 또는 분수는 `a/b`
- 교과서 예제는 `tag: "교과서"`, 추가 공학 예제는 `tag: "공학"`
- 수치는 반드시 직접 계산해서 검증 (python 으로 확인)

## 슬라이드 종류 (type)
| type | 필드 | 설명 |
|---|---|---|
| `cover` | title, subtitle, image? | 주차 표지(어두운 배경). image = 인터넷 이미지 이름 |
| `goals` | items[3] | 학습목표 카드 3개 |
| `section` | title, sub? | 주차 안의 소단원 구분(어두운 배경) |
| `bullets` | title, bullets[≤4], visual? | 왼쪽 글머리표 + 오른쪽 그림. visual 없으면 전체 폭 |
| `concept` | title, term, def, formula?, note?, visual? | 용어 정의 카드 + 큰 공식 상자 |
| `example` | title, tag, problem, steps[≤4], answer, visual? | 문제 → 풀이 단계(클릭마다 등장) → 답 |
| `visual` | title, visual, caption? | 그림 크게 1개 |
| `compare` | title, left{head, items[≤4]}, right{head, items[≤4]} | 좌우 비교 카드 |
| `metaphor` | title, image, lines[2~3] | 비유 그림(인터넷) 왼쪽 절반 + 설명 |
| `stats` | title, items[2~4]{value, label}, note? | 큰 숫자 강조 |
| `quiz` | questions[3]{q, a} | 확인 퀴즈, 클릭하면 정답 공개 |
| `summary` | items[2~4]{head, body}, next | 요약 + 다음 주 예고 |

## 그림 (visual.kind) — 모두 애니메이션 자동 적용
| kind | 필드 | 애니메이션 |
|---|---|---|
| `bar` | labels[], values[], title?, highlight?[idx], xTitle?, yTitle?, fmt? ("0", "0.00", "0%") | 막대 차트(네이티브) 아래→위 닦아내기 |
| `line` | labels[], series[{name, values}], title?, xTitle?, yTitle? | 꺾은선(네이티브) 왼→오 닦아내기 |
| `area` | labels[], series[{name, values}], title? | 영역 차트. 정규분포 넓이 표시용: 1번 전체 곡선, 2번 칠할 구간(구간 밖은 0) |
| `image` | name (인터넷 이미지) 또는 fig (그래프 png 파일명) | 서서히 나타나기 |
| `steps` | figs[2~4], labels? | 그래프 여러 장이 한 장씩 차례로 등장 (예: n=1,5,30) |
| `tree` | root, children[{label, p?, result?, children?}] | 수형도. 단계별로 가지가 뻗어 나옴. 최대 깊이 3, 잎 최대 8 |
| `grid` | w, h, path ("RRUR…", R=오른쪽, U=위), from?, to? | 격자 최단경로. 경로가 한 칸씩 그려짐 |
| `pascal` | rows (≤7), highlight? ("odd") | 파스칼의 삼각형 한 줄씩 등장 |
| `circle` | items[≤8] | 원형 배열(원탁) |
| `slots` | slots[{top, bottom}] (≤6), op? ("×") | 칸 채우기 그림. 칸이 하나씩 등장 |
| `formula` | text, note? | 큰 공식 카드 |
| `table` | rows[][] (첫 행 = 머리글) | 표 |

- 그래프 png(벤 다이어그램, 히스토그램, 시뮬레이션 등 네이티브로 못 그리는 것)는
  `figs/figs_weekNN.py` 로 만들고 `../05_이미지/그래프/wNN_이름.png` 에 저장. 반드시 `from figstyle import *` 사용
- 인터넷 이미지는 `python fetch_image.py "영문 검색어" wNN_이름` 으로 받기 (위키미디어 공용, 자유 라이선스만).
  받은 뒤 Read 로 그림을 직접 보고 비유에 맞는지 확인. 안 맞으면 `--list` 후 `--pick N`
- 이름 규칙: 주차 번호로 시작 (`w03_파스칼`)
- 확인: `node -e "require('./content/week03.js')"` 로 문법 오류 확인
