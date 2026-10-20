"""5주차 그래프: 조건부확률 벤 다이어그램, 직렬·병렬 회로."""
from matplotlib.patches import Circle, Rectangle, FancyBboxPatch

from figstyle import *


def venn_conditional():
    # 왼쪽: 전체 표본공간 S / 오른쪽: A가 새 표본공간이 됨
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    for i, ax in enumerate(axes):
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 7)
        ax.set_aspect("equal")
        ax.axis("off")
        ax.add_patch(Rectangle((0.3, 0.3), 9.4, 6.4, fill=(i == 0), fc=TINT, ec=INK if i == 0 else MUTED,
                               lw=2, ls="-" if i == 0 else "--"))
        a = Circle((4, 3.5), 2.3, fc=(CORAL if i == 1 else "none"), alpha=0.25 if i == 1 else 1, ec=CORAL, lw=3)
        b = Circle((6.2, 3.5), 2.3, fc="none", ec=TEAL, lw=3)
        ax.add_patch(a)
        ax.add_patch(b)
        # A∩B 강조
        clip = Circle((4, 3.5), 2.3, transform=ax.transData)
        ab = Circle((6.2, 3.5), 2.3, fc=INK, alpha=0.55, ec="none")
        ab.set_clip_path(clip)
        ax.add_patch(ab)
        ax.text(2.6, 5.9, "A", fontsize=22, color=CORAL, weight="bold")
        ax.text(7.3, 5.9, "B", fontsize=22, color=TEAL, weight="bold")
        ax.text(5.1, 3.4, "A∩B", fontsize=15, color="white", ha="center", weight="bold")
        ax.text(0.6, 6.1, "S", fontsize=20, color=INK if i == 0 else MUTED, weight="bold")
    axes[0].set_title("P(B): 전체 S 안에서 B의 비율", color=INK)
    axes[1].set_title("P(B|A): A 안에서 A∩B의 비율", color=CORAL)
    save(fig, "w05_조건부_벤")


def circuit(kind):
    fig, ax = plt.subplots(figsize=(6, 3.4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")

    def part(x, y, label):
        ax.add_patch(FancyBboxPatch((x - 0.9, y - 0.5), 1.8, 1.0, boxstyle="round,pad=0.05",
                                    fc=TINT, ec=INK, lw=2.5))
        ax.text(x, y, label, ha="center", va="center", fontsize=16, color=INK, weight="bold")

    if kind == "직렬":
        ax.plot([0.3, 9.7], [3, 3], color=INK, lw=3, zorder=0)
        part(3.2, 3, "0.9")
        part(6.8, 3, "0.9")
        ax.text(5, 0.9, "둘 다 작동해야 작동\n0.9 × 0.9 = 0.81", ha="center", fontsize=15, color=CORAL, weight="bold")
    else:
        ax.plot([0.3, 2.2], [3, 3], color=INK, lw=3)
        ax.plot([7.8, 9.7], [3, 3], color=INK, lw=3)
        ax.plot([2.2, 2.2], [1.9, 4.9], color=INK, lw=3)
        ax.plot([7.8, 7.8], [1.9, 4.9], color=INK, lw=3)
        for y in (4.9, 1.9):
            ax.plot([2.2, 7.8], [y, y], color=INK, lw=3, zorder=0)
            part(5, y, "0.9")
        ax.text(5, 0.1, "하나만 작동해도 작동\n1 - 0.1 × 0.1 = 0.99", ha="center", fontsize=15, color=TEAL, weight="bold")
    ax.text(0.3, 3.3, "입력", fontsize=13, color=MUTED)
    ax.text(9.7, 3.3, "출력", fontsize=13, color=MUTED, ha="right")
    ax.set_title(f"{kind} 연결", color=INK)
    save(fig, f"w05_{kind}")


venn_conditional()
circuit("직렬")
circuit("병렬")
