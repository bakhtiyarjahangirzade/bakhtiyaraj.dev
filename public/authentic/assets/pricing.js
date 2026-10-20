// Monthly / yearly toggle on the pricing page.
const buttons = document.querySelectorAll('[data-period]');
buttons.forEach((b) => b.addEventListener('click', () => {
  const y = b.dataset.period === 'y';
  buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  document.querySelectorAll('[data-m]').forEach((el) => { el.textContent = y ? el.dataset.y : el.dataset.m; });
  document.querySelectorAll('[data-unit]').forEach((el) => { el.textContent = y ? '/ month, billed yearly' : '/ month'; });
}));
