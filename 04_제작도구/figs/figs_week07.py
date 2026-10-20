"""7주차 그래프: n 변화에 따른 이항분포, 시뮬레이션 비교."""
from math import comb

from figstyle import *


def pmf(n, p):
    return np.array([comb(n, k) * p**k * (1 - p) ** (n - k) for k in range(n + 1)])


def by_n():
    for n in (5, 20, 50):
        fig, ax = plt.subplots(figsize=(5.5, 3.8))
        ax.bar(range(n + 1), pmf(n, 0.3), color=INK, width=0.75)
        ax.axvline(n * 0.3, color=CORAL, ls="--", lw=2)
        ax.text(n * 0.3, 1.01, f"평균 {n * 0.3:g}", transform=ax.get_xaxis_transform(), ha="center", va="bottom",
                color=CORAL, fontsize=17, weight="bold")
        ax.set_title(f"B({n}, 0.3)", color=INK, pad=34, fontsize=18)
        ax.tick_params(labelsize=16)
        ax.set_xlabel("X")
        save(fig, f"w07_n{n}")


def simulation():
    rng = np.random.default_rng(7)
    sims = rng.binomial(10, 0.1, size=1000)
    freq = np.bincount(sims, minlength=11)[:7] / 1000
    theory = pmf(10, 0.1)[:7]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.bar(range(7), freq, color=TEAL, width=0.6, label="시뮬레이션 1000회 (상대도수)")
    ax.plot(range(7), theory, "o", color=CORAL, ms=11, label="이론값 B(10, 0.1)")
    ax.set_xlabel("표본 10개 중 불량품 개수")
    ax.set_ylabel("비율")
    ax.legend(frameon=False)
    save(fig, "w07_시뮬레이션")
    print("sim freq", freq)


def by_p():
    for p, name in ((0.1, "p01"), (0.5, "p05"), (0.9, "p09")):
        fig, ax = plt.subplots(figsize=(5.5, 3.8))
        ax.bar(range(11), pmf(10, p), color=TEAL if p == 0.5 else INK, width=0.75)
        ax.axvline(10 * p, color=CORAL, ls="--", lw=2)
        ax.set_ylim(0, 0.42)
        ax.set_xticks(range(0, 11, 2))
        ax.text(10 * p, 1.01, f"평균 {10 * p:g}", transform=ax.get_xaxis_transform(), ha="center", va="bottom",
                color=CORAL, fontsize=17, weight="bold")
        ax.set_title(f"B(10, {p})", color=INK, pad=34, fontsize=18)
        ax.tick_params(labelsize=16)
        ax.set_xlabel("X")
        save(fig, f"w07_{name}")


by_n()
by_p()
simulation()
