"""3주차 그래프: 이항정리, 파스칼의 삼각형."""
from math import comb

from figstyle import *

# 1) 파스칼의 삼각형에서 홀수 칸 색칠 → 시에르핀스키 삼각형
N = 32
fig, ax = plt.subplots(figsize=(8, 7))
for n in range(N):
    for k in range(n + 1):
        odd = comb(n, k) % 2 == 1
        ax.add_patch(plt.Circle((k - n / 2, -n * 0.866), 0.42, color=CORAL if odd else TINT, lw=0))
ax.set_xlim(-N / 2 - 1, N / 2 + 1)
ax.set_ylim(-N * 0.866, 1)
ax.set_aspect("equal")
ax.axis("off")
ax.set_title("파스칼의 삼각형 32줄: 홀수만 색칠")
save(fig, "w03_시에르핀스키")

# 2) n 이 커질수록 이항계수 모양 (차례로 등장할 4장)
for n in (2, 4, 8, 16):
    fig, ax = plt.subplots(figsize=(5, 3.6))
    ks = list(range(n + 1))
    vals = [comb(n, k) for k in ks]
    ax.bar(ks, vals, color=INK, width=0.75)
    ax.bar([n // 2], [vals[n // 2]], color=CORAL, width=0.75)
    ax.set_title(f"n = {n}:  합 = $2^{{{n}}}$ = {2 ** n}")
    ax.set_xlabel("r")
    ax.set_ylabel(f"$_{{{n}}}C_r$")
    if n <= 8:
        ax.set_xticks(ks)
    save(fig, f"w03_계수_n{n}")

# 3) 골턴 보드 시뮬레이션: 못 10줄, 공 2000개
rng = np.random.default_rng(7)
rows, balls = 10, 2000
pos = rng.integers(0, 2, size=(balls, rows)).sum(axis=1)
counts = np.bincount(pos, minlength=rows + 1)
fig, ax = plt.subplots(figsize=(8, 4.4))
ax.bar(range(rows + 1), counts, color=TEAL, width=0.8, label="시뮬레이션 (공 2000개)")
expected = [balls * comb(rows, k) / 2 ** rows for k in range(rows + 1)]
ax.plot(range(rows + 1), expected, "o-", color=CORAL, lw=2.5, label=r"이론값 $2000 \times {}_{10}C_k \,/\, 2^{10}$")
ax.set_xticks(range(rows + 1))
ax.set_xlabel("오른쪽으로 튄 횟수 k")
ax.set_ylabel("공의 개수")
ax.legend(frameon=False, fontsize=12)
ax.set_title("골턴 보드: 못 10줄을 지난 공의 위치")
save(fig, "w03_골턴시뮬")
