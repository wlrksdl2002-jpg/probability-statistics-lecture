"""10주차 그래프: 신뢰구간 시뮬레이션."""
from figstyle import *

rng = np.random.default_rng(10)
m, sigma, n = 500, 20, 100   # 배터리 수명: 모평균 500시간, 표준편차 20시간, 표본 100개
half = 1.96 * sigma / np.sqrt(n)

xbar = rng.normal(m, sigma / np.sqrt(n), 100)
miss = np.abs(xbar - m) > half
fig, ax = plt.subplots(figsize=(8, 4.6))
for i, (xb, bad) in enumerate(zip(xbar, miss)):
    ax.plot([xb - half, xb + half], [i, i], color=CORAL if bad else TEAL, lw=2.2 if bad else 1.4)
    ax.plot(xb, i, "o", ms=2.5, color=INK)
ax.axvline(m, color=INK, lw=2, ls="--")
ax.text(m + 0.3, 101, f"모평균 m = {m}", ha="left", va="bottom", fontsize=13, color=INK, fontweight="bold")
ax.set_ylim(-2, 108)
ax.set_yticks([])
ax.set_xlabel("배터리 수명 (시간)")
ax.spines["left"].set_visible(False)
save(fig, "w10_신뢰구간100")
print("miss", miss.sum())
