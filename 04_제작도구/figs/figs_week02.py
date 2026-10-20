"""2주차 그래프: 같은 것이 있는 순열, 중복조합."""
from itertools import permutations

from figstyle import *

YEL = GOLD
BLU = TEAL


def balls(ax, seq, y, r=0.38, labels=None):
    for i, c in enumerate(seq):
        ax.add_patch(plt.Circle((i, y), r, color=YEL if c == "Y" else BLU, ec=INK, lw=1.5))
        if labels:
            ax.text(i, y, labels[i], ha="center", va="center", fontsize=13, color=INK, fontweight="bold")


# 1) 노란 공 3개, 파란 공 2개의 서로 다른 배열 10가지
arr = sorted(set(permutations("YYYBB")))
fig, ax = plt.subplots(figsize=(9, 5.2))
for k, seq in enumerate(arr):
    col, row = divmod(k, 5)
    y = -row * 1.1
    x0 = col * 6.5
    for i, c in enumerate(seq):
        ax.add_patch(plt.Circle((x0 + i, y), 0.4, color=YEL if c == "Y" else BLU, ec=INK, lw=1.5))
    ax.text(x0 - 1.0, y, f"{k + 1}", ha="center", va="center", color=MUTED, fontsize=13)
ax.set_xlim(-1.6, 11.5)
ax.set_ylim(-5.1, 0.7)
ax.set_aspect("equal")
ax.axis("off")
ax.set_title("노란 공 3개 + 파란 공 2개 → 서로 다른 배열 10가지")
save(fig, "w02_공배열10")

# 2) 구분하면 3!×2! = 12개가 하나로 묶임
fig, ax = plt.subplots(figsize=(9, 4.6))
ylabs = [("1", "2", "3"), ("1", "3", "2"), ("2", "1", "3"), ("2", "3", "1"), ("3", "1", "2"), ("3", "2", "1")]
for k, yl in enumerate(ylabs):
    for j, bl in enumerate([("1", "2"), ("2", "1")]):
        x0 = j * 6.3
        y = -k * 0.95
        lab = [f"Y{yl[0]}", f"Y{yl[1]}", f"B{bl[0]}", f"Y{yl[2]}", f"B{bl[1]}"]
        for i, c in enumerate("YYBYB"):
            ax.add_patch(plt.Circle((x0 + i, y), 0.4, color=YEL if c == "Y" else BLU, ec=INK, lw=1.2))
            ax.text(x0 + i, y, lab[i][1], ha="center", va="center", fontsize=11, color=INK, fontweight="bold")
ax.annotate("", xy=(12.6, -2.4), xytext=(11.0, -2.4), arrowprops=dict(arrowstyle="->", lw=2.5, color=CORAL))
ax.text(13.0, -1.7, "번호를 지우면", fontsize=13, color=CORAL, fontweight="bold")
for i, c in enumerate("YYBYB"):
    ax.add_patch(plt.Circle((13.0 + i * 0.9, -2.5), 0.36, color=YEL if c == "Y" else BLU, ec=INK, lw=1.5))
ax.text(14.8, -3.4, "1가지", fontsize=14, ha="center", color=INK, fontweight="bold")
ax.set_xlim(-0.8, 17.3)
ax.set_ylim(-5.5, 0.6)
ax.set_aspect("equal")
ax.axis("off")
ax.set_title("3! × 2! = 12가지가 하나의 배열로 겹침")
save(fig, "w02_구분과묶음")

# 3) 막대와 공: a, b, c 에서 중복을 허용하여 4개 택하기
fig, ax = plt.subplots(figsize=(9, 4.4))
cases = [("aabc", "○○|○|○"), ("bbbb", "|○○○○|"), ("accc", "○||○○○")]
for k, (pick, code) in enumerate(cases):
    y = -k * 1.3
    ax.text(0, y, pick, fontsize=22, va="center", fontweight="bold", color=INK, family="Consolas")
    ax.annotate("", xy=(3.6, y), xytext=(2.3, y), arrowprops=dict(arrowstyle="->", lw=2, color=MUTED))
    x = 4.0
    for ch in code:
        if ch == "○":
            ax.add_patch(plt.Circle((x + 0.3, y), 0.27, color=CORAL, ec=INK, lw=1.2))
            x += 0.7
        else:
            ax.plot([x + 0.12, x + 0.12], [y - 0.45, y + 0.45], color=INK, lw=4)
            x += 0.35
ax.set_xlim(-0.3, 10)
ax.set_ylim(-3.3, 0.7)
ax.set_aspect("equal")
ax.axis("off")
save(fig, "w02_막대와공")

# 4) 소화기 배치: 객실 10개 중 소화기 3대, 이웃하지 않게 (탐구, 수치는 재구성)
fig, ax = plt.subplots(figsize=(9, 2.8))
rooms = [0, 1, 0, 0, 1, 0, 0, 0, 1, 0]
for i, f in enumerate(rooms):
    ax.add_patch(plt.Rectangle((i * 1.05, 0), 0.95, 1.3, color=CORAL if f else TINT, ec=INK, lw=1.5))
    if f:
        ax.text(i * 1.05 + 0.475, 0.65, "▲", ha="center", va="center", fontsize=26, color="white")
    ax.text(i * 1.05 + 0.475, -0.4, f"{i + 1}", ha="center", va="center", fontsize=20, color=INK, fontweight="bold")
ax.text(0, 1.75, "▲ = 소화기 3대, 서로 이웃하지 않게", fontsize=20, color=INK, fontweight="bold", va="center")
ax.set_xlim(-0.2, 10.6)
ax.set_ylim(-0.8, 2.1)
ax.set_aspect("equal")
ax.axis("off")
save(fig, "w02_소화기")
