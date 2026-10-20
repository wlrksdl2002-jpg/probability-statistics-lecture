"""모든 matplotlib 그래프가 같은 디자인으로 나오도록 하는 공통 스타일."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

# 강의 PPT 팔레트 (build.js 와 동일)
INK = "#26215C"      # 진한 남보라: 주 색
CORAL = "#FF6B4A"    # 강조색
TEAL = "#2EC4B6"     # 보조색
GOLD = "#FFB627"     # 보조색 2
MUTED = "#8A8AA0"    # 회색 글자
TINT = "#ECEAF8"     # 옅은 배경 칠
PALETTE = [INK, CORAL, TEAL, GOLD, MUTED]

OUT = Path(__file__).resolve().parent.parent.parent / "05_이미지" / "그래프"
OUT.mkdir(parents=True, exist_ok=True)

plt.rcParams.update({
    "font.family": "Malgun Gothic",
    "axes.unicode_minus": False,
    "font.size": 15,
    "axes.titlesize": 17,
    "axes.titleweight": "bold",
    "axes.edgecolor": MUTED,
    "axes.labelcolor": "#1E1E2A",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.prop_cycle": matplotlib.cycler(color=PALETTE),
    "xtick.color": "#44445A",
    "ytick.color": "#44445A",
    "figure.dpi": 100,
})


def save(fig, name):
    """05_이미지/그래프/<name>.png 로 저장 (투명 배경, 고해상도)."""
    path = OUT / f"{name}.png"
    fig.savefig(path, dpi=200, bbox_inches="tight", transparent=True)
    plt.close(fig)
    print("saved", path)
    return path
