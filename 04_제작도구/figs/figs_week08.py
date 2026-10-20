"""8주차 그래프: 연속확률변수와 정규분포."""
from figstyle import *

rng = np.random.default_rng(8)
data = rng.normal(100, 2, 2000)  # 저항값 측정 2000개 (Ω)


def pdf(x, m, s):
    return np.exp(-((x - m) ** 2) / (2 * s * s)) / (s * np.sqrt(2 * np.pi))


# 1) 히스토그램 → 곡선: 계급 폭을 줄일수록 곡선에 가까워짐
xs = np.linspace(93, 107, 400)
for i, (bw, title) in enumerate([(2, "계급 폭 2Ω"), (0.5, "계급 폭 0.5Ω"), (None, "확률밀도함수 곡선")], 1):
    fig, ax = plt.subplots(figsize=(5, 3.6))
    if bw:
        bins = np.arange(92, 108 + bw, bw)
        ax.hist(data, bins=bins, density=True, color=TEAL, edgecolor="white")
    else:
        ax.hist(data, bins=np.arange(92, 108.25, 0.25), density=True, color=TINT, edgecolor="white")
        ax.plot(xs, pdf(xs, 100, 2), color=CORAL, lw=3)
    ax.set_xticks([94, 96, 98, 100, 102, 104, 106])
    ax.set_xlabel("저항값 (Ω)")
    ax.tick_params(labelsize=16)
    ax.set_yticks([])
    ax.set_xlim(93, 107)
    save(fig, f"w08_밀도{i}")

# 2) 68-95-99.7 규칙
fig, ax = plt.subplots(figsize=(8, 4))
z = np.linspace(-3.6, 3.6, 500)
ax.plot(z, pdf(z, 0, 1), color=INK, lw=2.5)
for lo, hi, col in [(-3, -2, "#FFE2A8"), (2, 3, "#FFE2A8"), (-2, -1, "#A8E6DF"), (1, 2, "#A8E6DF"), (-1, 1, "#FFB3A3")]:
    m = (z >= lo) & (z <= hi)
    ax.fill_between(z[m], pdf(z[m], 0, 1), color=col)
for k, txt, y in [(1, "약 68%", 0.43), (2, "약 95%", 0.50), (3, "약 99.7%", 0.57)]:
    ax.annotate("", xy=(-k, y), xytext=(k, y), arrowprops=dict(arrowstyle="<->", color=INK))
    ax.text(0, y + 0.008, txt, ha="center", va="bottom", fontsize=13, color=INK, fontweight="bold",
            bbox=dict(boxstyle="square,pad=0.1", fc="white", ec="none"))
ax.set_xticks(range(-3, 4))
ax.set_xticklabels(["m-3σ", "m-2σ", "m-σ", "m", "m+σ", "m+2σ", "m+3σ"])
ax.set_yticks([])
ax.set_ylim(0, 0.63)
ax.spines["left"].set_visible(False)
save(fig, "w08_689599")

# 3) 표준화: X축과 Z축 대응
fig, ax = plt.subplots(figsize=(8, 3.6))
xx = np.linspace(93, 107, 400)
ax.plot(xx, pdf(xx, 100, 2), color=INK, lw=2.5)
m = (xx >= 98) & (xx <= 104)
ax.fill_between(xx[m], pdf(xx[m], 100, 2), color=CORAL, alpha=0.55)
ax.set_xticks([94, 96, 98, 100, 102, 104, 106])
ax.set_xlabel("X: 저항값 (Ω)   X ~ N(100, 2²)")
ax.set_yticks([])
ax.spines["left"].set_visible(False)
sec = ax.secondary_xaxis(-0.32, functions=(lambda x: (x - 100) / 2, lambda t: 2 * t + 100))
sec.set_xticks([-3, -2, -1, 0, 1, 2, 3])
sec.set_xlabel("Z = (X - 100) / 2   Z ~ N(0, 1)", color=CORAL)
sec.tick_params(colors=CORAL)
sec.spines["bottom"].set_color(CORAL)
save(fig, "w08_표준화")
