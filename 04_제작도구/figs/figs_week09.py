"""9주차 그래프: 표본평균의 분포와 이항분포의 정규근사."""
from figstyle import *

rng = np.random.default_rng(9)

# 1) 주사위 n개 눈의 평균: n이 커질수록 종 모양으로
for n in [1, 2, 5, 30]:
    means = rng.integers(1, 7, size=(20000, n)).mean(axis=1)
    fig, ax = plt.subplots(figsize=(6, 3.2))
    if n <= 2:
        vals, cnt = np.unique(means, return_counts=True)
        ax.bar(vals, cnt / cnt.sum(), width=0.8 / n, color=TEAL)
    else:
        ax.hist(means, bins=np.arange(0.95, 6.1, 0.1 if n == 30 else 0.2), density=True, color=TEAL, edgecolor="white")
    ax.axvline(3.5, color=CORAL, lw=2, ls="--")
    ax.set_xlim(0.5, 6.5)
    ax.set_xlabel(r"표본평균 $\bar{X}$")
    ax.set_yticks([])
    save(fig, f"w09_표본평균_n{n}")

# 2) 이항분포 B(n, 0.1)의 정규근사
def pdf(x, m, s):
    return np.exp(-((x - m) ** 2) / (2 * s * s)) / (s * np.sqrt(2 * np.pi))


from math import comb
for n in [10, 50, 400]:
    p = 0.1
    k = np.arange(0, n + 1)
    pk = np.array([comb(n, int(i)) * p**i * (1 - p) ** (n - i) for i in k])
    m, s = n * p, np.sqrt(n * p * (1 - p))
    lo, hi = max(0, int(m - 4 * s)), int(m + 4.5 * s) + 1
    fig, ax = plt.subplots(figsize=(5, 3.6))
    ax.bar(k[lo:hi], pk[lo:hi], color=TEAL, width=0.85)
    xs = np.linspace(lo - 0.5, hi, 300)
    ax.plot(xs, pdf(xs, m, s), color=CORAL, lw=2.5)
    ax.set_title(f"B({n}, 0.1)  vs  N({m:g}, {s:g}²)" if s == int(s) else f"B({n}, 0.1)", color=INK)
    ax.set_xlabel("불량품 개수")
    ax.set_yticks([])
    save(fig, f"w09_이항근사_n{n}")

# 3) 모집단과 표본 개념도
fig, ax = plt.subplots(figsize=(8, 4))
r = 1.9 * np.sqrt(rng.uniform(0, 1, 300))
t = rng.uniform(0, 2 * np.pi, 300)
pop = np.column_stack([2.1 + r * np.cos(t), 1.8 + r * np.sin(t)])
idx = rng.choice(300, 12, replace=False)
ax.add_patch(plt.Circle((2.1, 1.8), 2.05, color=TINT, zorder=0))
ax.scatter(pop[:, 0], pop[:, 1], s=14, color=MUTED, zorder=1)
ax.scatter(pop[idx, 0], pop[idx, 1], s=40, color=CORAL, zorder=2)
ax.add_patch(plt.Circle((6.6, 1.8), 1.0, color="#FFE3DC", zorder=0))
ang = np.linspace(0, 2 * np.pi, 12, endpoint=False)
ax.scatter(6.6 + 0.6 * np.cos(ang), 1.8 + 0.6 * np.sin(ang), s=60, color=CORAL)
ax.annotate("", xy=(5.45, 1.8), xytext=(4.35, 1.8), arrowprops=dict(arrowstyle="-|>", lw=2.5, color=INK))
ax.text(4.9, 2.0, "임의추출", ha="center", fontsize=13, color=INK)
ax.text(2.1, -0.55, "모집단: 생산된 부품 전체", ha="center", fontsize=14, color=INK, fontweight="bold")
ax.text(6.6, 0.25, "표본: 12개", ha="center", fontsize=14, color=CORAL, fontweight="bold")
ax.set_xlim(-0.2, 7.9)
ax.set_ylim(-0.9, 3.9)
ax.set_aspect("equal")
ax.axis("off")
save(fig, "w09_모집단표본")
