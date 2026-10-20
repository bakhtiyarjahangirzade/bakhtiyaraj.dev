// Authentic shared behaviour: reveal-on-scroll and cookie consent. Loaded in <head> (classic script).
document.documentElement.classList.add('js');

(function () {
  const KEY = 'authentic.consent';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage blocked */ } },
  };
  const YEAR = 365 * 24 * 3600 * 1000;
  const consent = () => { const c = store.get(KEY); return c && Date.now() - c.at < YEAR ? c : null; };
  // Public helper for other scripts: may we keep optional preferences?
  window.authenticPrefs = {
    allowed: () => !!(consent() && consent().preferences),
    get: () => (window.authenticPrefs.allowed() ? store.get('authentic.prefs') || {} : {}),
    set: (p) => { if (window.authenticPrefs.allowed()) store.set('authentic.prefs', { ...store.get('authentic.prefs'), ...p }); },
  };

  function save(preferences) {
    store.set(KEY, { necessary: true, preferences, at: Date.now() });
    if (!preferences) store.del('authentic.prefs');
    document.querySelector('.consent')?.remove();
  }

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function banner() {
    if (document.querySelector('.consent')) return;
    const b = el(`<div class="consent" role="region" aria-label="Cookie consent">
      <p>We only store what Authentic needs to work. With your OK we also remember small preferences. No ads, no tracking. <a href="/authentic/cookies/">Cookie Policy</a></p>
      <div class="btns"><button type="button" class="pill secondary" data-c="custom">Customize</button><button type="button" class="pill secondary" data-c="necessary">Necessary only</button><button type="button" class="pill" data-c="all">Accept all</button></div></div>`);
    b.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]')?.dataset.c;
      if (c === 'all') save(true); else if (c === 'necessary') save(false); else if (c === 'custom') settings();
    });
    document.body.append(b);
  }

  function settings() {
    const cur = consent();
    const m = el(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ck-title"><div class="modal-box">
      <h2 id="ck-title">Cookie Settings</h2>
      <p>Choose what Authentic may store in your browser. You can change this any time from the footer.</p>
      <div class="opt"><div><h3>Strictly necessary</h3><p>Remembers your choices on this screen. Always on.</p></div><label class="switch"><input type="checkbox" checked disabled aria-label="Strictly necessary, always on"><span></span></label></div>
      <div class="opt"><div><h3>Preferences</h3><p>Remembers whether you upload files or paste text.</p></div><label class="switch"><input type="checkbox" id="ck-pref" aria-label="Preferences" ${cur?.preferences ? 'checked' : ''}><span></span></label></div>
      <div class="opt"><div><h3>Analytics</h3><p>Not used. If we add privacy-friendly analytics, it will stay off until you turn it on.</p></div><label class="switch"><input type="checkbox" disabled aria-label="Analytics, not used"><span></span></label></div>
      <div class="modal-actions"><button type="button" class="pill secondary" data-m="cancel">Cancel</button><button type="button" class="pill" data-m="save">Save</button></div>
    </div></div>`);
    const close = () => { m.remove(); document.removeEventListener('keydown', esc); last?.focus(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const last = document.activeElement;
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.dataset.m === 'cancel') close();
      if (e.target.dataset.m === 'save') { save(m.querySelector('#ck-pref').checked); close(); }
    });
    document.addEventListener('keydown', esc);
    document.body.append(m);
    m.querySelector('#ck-pref').focus();
  }

  function reveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); e.target.dispatchEvent(new CustomEvent('reveal')); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach((i) => io.observe(i));
  }

  document.addEventListener('DOMContentLoaded', () => {
    reveal();
    document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-settings]')) settings(); });
    if (!consent()) banner();
  });
})();
