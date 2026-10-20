"""6주차 그래프: 기댓값 = 무게중심, 분산 비교."""
from figstyle import *


def balance():
    x = np.array([0, 1, 2, 3])
    p = np.array([0.5, 0.3, 0.15, 0.05])
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.bar(x, p, width=0.6, color=INK)
    for xi, pi in zip(x, p):
        ax.text(xi, pi + 0.015, f"{pi:.2f}", ha="center", fontsize=17, color=INK)
    ax.plot([-0.5, 3.5], [0, 0], color=MUTED, lw=3)
    ax.plot([0.75, 0.62, 0.88, 0.75], [0, -0.09, -0.09, 0], color=CORAL, lw=2.5)
    ax.fill([0.62, 0.88, 0.75], [-0.09, -0.09, 0], color=CORAL)
    ax.annotate("E(X) = 0.75 (받침점 = 무게중심)", xy=(0.95, -0.06), xytext=(1.25, -0.065),
                fontsize=17, color=CORAL, weight="bold", va="center",
                arrowprops=dict(arrowstyle="->", color=CORAL, lw=2))
    ax.set_ylim(-0.13, 0.58)
    ax.tick_params(labelsize=16)
    ax.set_yticks([0, 0.1, 0.2, 0.3, 0.4, 0.5])
    ax.spines["left"].set_bounds(0, 0.55)
    ax.set_xticks(x)
    ax.set_xlabel("하루 고장 건수 X")
    ax.set_ylabel("P(X = x)")
    ax.spines["bottom"].set_visible(False)
    save(fig, "w06_무게중심")


def spread(name, xs, ps, color, title):
    fig, ax = plt.subplots(figsize=(5.5, 4))
    ax.bar(xs, ps, width=0.6, color=color)
    ax.axvline(10, color=CORAL, ls="--", lw=2)
    ax.text(10, 1.01, "평균 10", transform=ax.get_xaxis_transform(), ha="center", va="bottom",
            color=CORAL, fontsize=17, weight="bold")
    ax.set_xlim(7.3, 12.7)
    ax.set_ylim(0, 0.9)
    ax.set_xticks(range(8, 13))
    ax.set_xlabel("부품 길이 (mm)")
    ax.set_title(title, color=INK, pad=34, fontsize=18)
    ax.tick_params(labelsize=16)
    ax.xaxis.label.set_size(17)
    save(fig, name)


balance()
spread("w06_기계A", [9, 10, 11], [0.1, 0.8, 0.1], INK, "기계 A: V(X) = 0.2")
spread("w06_기계B", [8, 9, 10, 11, 12], [0.2] * 5, TEAL, "기계 B: V(X) = 2")
