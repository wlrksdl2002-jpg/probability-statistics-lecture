"""4주차 그래프: 확률의 뜻, 큰수의 법칙, 덧셈정리, 여사건."""
from matplotlib.patches import Circle, Rectangle

from figstyle import *

# 1) 큰수의 법칙: 동전 던지기 앞면 상대도수 (차례로 등장할 4장)
rng = np.random.default_rng(2026)
flips = rng.integers(0, 2, size=10000)
for n in (10, 100, 1000, 10000):
    x = np.arange(1, n + 1)
    rel = np.cumsum(flips[:n]) / x
    fig, ax = plt.subplots(figsize=(5, 3.6))
    ax.axhline(0.5, color=CORAL, lw=2, ls="--")
    ax.plot(x, rel, color=INK, lw=1.8)
    ax.set_ylim(0, 1)
    ax.set_xlim(1, n)
    ax.set_title(f"{n:,}번 던짐: 앞면 비율 {rel[-1]:.3f}")
    ax.set_xlabel("던진 횟수")
    ax.set_ylabel("앞면 상대도수")
    save(fig, f"w04_대수법칙_{n}")


# 2) 벤 다이어그램 4종
def venn(name, title, shade):
    """shade: 'union' | 'inter' | 'comp' | 'disjoint'"""
    fig, ax = plt.subplots(figsize=(5, 3.6))
    ax.add_patch(Rectangle((-3, -2), 6, 4, fill=shade == "comp", fc=TEAL if shade == "comp" else "none",
                           alpha=0.55 if shade == "comp" else 1, ec=INK, lw=2))
    if shade == "disjoint":
        ca, cb = (-1.3, 0), (1.3, 0)
        r = 1.05
    else:
        ca, cb = (-0.65, 0), (0.65, 0)
        r = 1.25
    if shade == "comp":
        ax.add_patch(Circle(ca, r, fc="white", ec=INK, lw=2))
    elif shade in ("union", "disjoint"):
        ax.add_patch(Circle(ca, r, fc=CORAL, alpha=0.75, ec="none"))
        ax.add_patch(Circle(cb, r, fc=CORAL, alpha=0.75, ec="none"))
    elif shade == "inter":
        ax.add_patch(Circle(ca, r, fc=TINT, ec="none"))
        ax.add_patch(Circle(cb, r, fc=TINT, ec="none"))
        clip = Circle(ca, r, transform=ax.transData)
        inter = Circle(cb, r, fc=CORAL, ec="none")
        ax.add_patch(inter)
        inter.set_clip_path(clip)
    ax.add_patch(Circle(ca, r, fill=False, ec=INK, lw=2))
    if shade != "comp":
        ax.add_patch(Circle(cb, r, fill=False, ec=INK, lw=2))
    ax.text(ca[0] - r * 0.55, r * 0.75, "A", fontsize=18, fontweight="bold", color=INK)
    if shade != "comp":
        ax.text(cb[0] + r * 0.4, r * 0.75, "B", fontsize=18, fontweight="bold", color=INK)
    ax.text(2.55, 1.55, "S", fontsize=18, fontweight="bold", color=INK)
    ax.set_xlim(-3.1, 3.1)
    ax.set_ylim(-2.1, 2.1)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(title)
    save(fig, name)


venn("w04_벤_합", r"$A \cup B$ (합사건)", "union")
venn("w04_벤_곱", r"$A \cap B$ (곱사건)", "inter")
venn("w04_벤_여사건", r"$A^c$ (여사건)", "comp")
venn("w04_벤_배반", r"$A \cap B = \emptyset$ (배반사건)", "disjoint")
