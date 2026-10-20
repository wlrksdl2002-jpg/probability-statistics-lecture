// 슬라이드 넘기기: ←/→/스페이스, 클릭, 스와이프, F(전체 화면), 주소 #번호
(function () {
  const stage = document.getElementById("stage");
  const slides = Array.from(stage.querySelectorAll(".slide"));
  const counter = document.getElementById("counter");
  const bar = document.getElementById("bar");
  const showAll = new URLSearchParams(location.search).has("all");
  let cur = -1, step = 0;

  function fit() {
    const vp = stage.parentElement;
    const s = Math.min(vp.clientWidth / 1600, vp.clientHeight / 900);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  const maxStep = (i) => +slides[i].dataset.steps || 0;
  function paint() {
    slides[cur].querySelectorAll(".frag").forEach((f) => f.classList.toggle("on", +f.dataset.f <= step));
  }
  function go(i, st) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i !== cur) {
      if (cur >= 0) {
        slides[cur].classList.remove("current", "active");
        slides[cur].querySelectorAll("video").forEach((v) => v.pause());
      }
      cur = i;
      const s = slides[cur];
      s.classList.add("current");
      // 표시된 다음 프레임에 active를 붙여야 등장 효과가 재생됨
      requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add("active")));
      s.querySelectorAll("video").forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
      history.replaceState(null, "", `${location.search}#${cur + 1}`);
    }
    step = showAll ? maxStep(cur) : st;
    paint();
    counter.textContent = `${cur + 1} / ${slides.length}`;
    bar.style.width = `${((cur + 1) / slides.length) * 100}%`;
  }
  const next = () => (step < maxStep(cur) ? go(cur, step + 1) : cur < slides.length - 1 && go(cur + 1, 0));
  const prev = () => (step > 0 ? go(cur, step - 1) : cur > 0 && go(cur - 1, maxStep(cur - 1)));

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(0, 0);
    else if (e.key === "End") go(slides.length - 1, maxStep(slides.length - 1));
    else if (e.key === "f" || e.key === "F") toggleFs();
  });
  stage.addEventListener("click", (e) => {
    if (e.target.closest("a, button, video")) return;
    const r = stage.getBoundingClientRect();
    (e.clientX - r.left < r.width * 0.25 ? prev : next)();
  });
  let tx = null;
  stage.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    tx = null;
  });
  document.getElementById("nextBtn").onclick = next;
  document.getElementById("prevBtn").onclick = prev;
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => document.body.classList.toggle("presenting"));
  }
  document.getElementById("fsBtn").onclick = toggleFs;
  document.addEventListener("fullscreenchange", () => setTimeout(fit, 50));
  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== cur) go(n - 1, 0);
  });
  fit();
  const start = parseInt(location.hash.slice(1), 10);
  go(start ? start - 1 : 0, 0);
})();
