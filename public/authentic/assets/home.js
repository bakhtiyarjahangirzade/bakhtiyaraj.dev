// Overview page: animated report demo and training-data bars.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

async function demo(root) {
  const doc = root.querySelector('.doc'), scan = root.querySelector('.scan');
  const paras = [...doc.querySelectorAll('p')];
  const num = root.querySelector('[data-num]'), band = root.querySelector('.band'), dot = root.querySelector('.dot');
  const flags = [...root.querySelectorAll('[data-flag]')];
  for (;;) {
    paras.forEach((p) => p.classList.remove('hot', 'warm', 'found'));
    flags.forEach((f) => f.classList.remove('show'));
    band.style.left = '0%'; band.style.width = '0%'; dot.style.left = '0%'; num.textContent = '0–0';
    await wait(700);
    scan.style.opacity = '1';
    for (const p of paras) {
      scan.style.transform = `translateY(${p.offsetTop + p.offsetHeight - 64}px)`;
      scan.style.transition = reduced ? 'none' : 'transform .7s cubic-bezier(.28,.11,.32,1), opacity .4s';
      await wait(750);
      if (p.hasAttribute('data-hot')) p.classList.add('hot');
      if (p.hasAttribute('data-warm')) p.classList.add('warm');
      if (p.hasAttribute('data-ghost')) { p.classList.add('found'); flags[0].classList.add('show'); }
    }
    scan.style.opacity = '0';
    flags[1].classList.add('show');
    const lo = 41, hi = 79, est = 60;
    band.style.left = `${lo}%`; band.style.width = `${hi - lo}%`; dot.style.left = `${est}%`;
    const t0 = performance.now();
    await new Promise((res) => {
      const step = (t) => {
        const k = reduced ? 1 : Math.min(1, (t - t0) / 900);
        num.textContent = `${Math.round(lo * k)}–${Math.round(hi * k)}`;
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    if (reduced) return;
    await wait(5200);
  }
}

const win = document.getElementById('demo');
if (win) {
  let started = false;
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && !started) { started = true; demo(win); } }, { threshold: 0.3 });
  io.observe(win);
}

const bars = document.querySelector('[data-bars]');
if (bars) {
  const fill = () => bars.querySelectorAll('[data-w]').forEach((b) => { b.style.width = `${b.dataset.w}%`; });
  if (reduced || !('IntersectionObserver' in window)) fill();
  else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { fill(); o.disconnect(); } }, { threshold: 0.2 }).observe(bars);
}
