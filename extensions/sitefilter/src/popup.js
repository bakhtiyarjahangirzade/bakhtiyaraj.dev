(async function () {
  'use strict';
  const SF = globalThis.SiteFilter;
  const { presetFor } = globalThis.SiteFilterPresets;
  const $ = (id) => document.getElementById(id);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = SF.hostFromUrl((tab && tab.url) || '');
  let settings = await SF.load();
  let peek = false;

  $('globalOn').checked = settings.enabled;
  $('globalOn').addEventListener('change', async (e) => {
    settings = await SF.load();
    settings.enabled = e.target.checked;
    await SF.save(settings);
    refreshSoon();
  });

  if (!host) {
    $('host').textContent = SF.t('noSite');
    $('main').hidden = true;
    $('unsupported').hidden = false;
    $('rescan').hidden = true;
    return;
  }
  $('host').textContent = host;

  async function tabMsg(msg) {
    try {
      return await chrome.tabs.sendMessage(tab.id, msg);
    } catch {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/lib.js', 'src/presets.js', 'src/content.js'] });
        return await chrome.tabs.sendMessage(tab.id, msg);
      } catch { return null; }
    }
  }

  const rule = () => SF.siteRule(settings, host);
  const edit = async (fn) => { settings = await SF.updateSite(host, fn); render(); refreshSoon(); };

  /* ---------- chips ---------- */

  function chipList(ul, items, onRemove) {
    ul.textContent = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = SF.t('emptyList');
      ul.appendChild(li);
      return;
    }
    for (const item of items) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = item;
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '×';
      x.title = SF.t('remove');
      x.setAttribute('aria-label', `${SF.t('remove')}: ${item}`);
      x.addEventListener('click', () => onRemove(item));
      li.append(span, x);
      ul.appendChild(li);
    }
  }

  function bindAdder(form, input, field) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = input.value.split(/\s*[,;\n]\s*/).map((v) => v.trim()).filter(Boolean);
      // Commas split entries, except inside /regex/
      const list = /^\/.+\/[a-z]*$/s.test(input.value.trim()) ? [input.value.trim()] : values;
      const bad = list.filter((v) => !SF.compileKeyword(v));
      if (bad.length) { input.setCustomValidity(SF.t('badPattern')); input.reportValidity(); return; }
      input.setCustomValidity('');
      if (!list.length) return;
      input.value = '';
      await edit((r) => { r[field].push(...list); });
      input.focus();
    });
    input.addEventListener('input', () => input.setCustomValidity(''));
  }
  bindAdder($('kwForm'), $('kwInput'), 'keywords');
  bindAdder($('allowForm'), $('allowInput'), 'allow');

  /* ---------- render ---------- */

  function render() {
    const r = rule();
    $('siteOn').checked = r.enabled;
    const preset = presetFor(host);
    $('preset').textContent = preset ? preset.name : SF.t('autoDetect');
    chipList($('kwList'), r.keywords, (v) => edit((x) => { x.keywords = x.keywords.filter((k) => k !== v); }));
    chipList($('allowList'), r.allow, (v) => edit((x) => { x.allow = x.allow.filter((k) => k !== v); }));
    for (const radio of document.querySelectorAll('input[name="mode"]')) radio.checked = radio.value === r.mode;
    $('onlyBox').hidden = r.mode !== 'only';
    if (document.activeElement !== $('priceMin')) $('priceMin').value = r.priceMin ?? '';
    if (document.activeElement !== $('priceMax')) $('priceMax').value = r.priceMax ?? '';
    $('adsOn').checked = r.ads ?? settings.hideAds;
    $('sponsoredOn').checked = r.sponsored ?? settings.hideSponsored;
    $('nLinks').textContent = r.hiddenLinks.length;
    $('nSelectors').textContent = r.selectors.length;
    $('clearLinks').hidden = !r.hiddenLinks.length;
    $('clearSelectors').hidden = !r.selectors.length;
    $('cardSel').textContent = r.cardSelector || (preset ? preset.cards.split(',')[0] : SF.t('autoDetect'));
    $('clearCard').hidden = !r.cardSelector;
    document.body.classList.toggle('off', !settings.enabled || !r.enabled);
  }

  async function refresh() {
    const state = await tabMsg({ type: 'sf:state' });
    if (!state) {
      $('nListings').textContent = $('nAds').textContent = $('nCards').textContent = '–';
      return;
    }
    $('nListings').textContent = state.listings;
    $('nAds').textContent = state.ads;
    $('nCards').textContent = state.cards;
    peek = state.peek;
    $('peek').setAttribute('aria-pressed', String(peek));
    $('peek').textContent = SF.t(peek ? 'peekOff' : 'peek');
    const why = Object.entries(state.reasons || {}).map(([k, v]) => `${SF.t('reason_' + k)}: ${v}`).join(' · ');
    $('nListings').parentElement.title = why;
  }
  let timer = 0;
  function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 450); }

  /* ---------- controls ---------- */

  $('siteOn').addEventListener('change', (e) => edit((r) => { r.enabled = e.target.checked; }));
  for (const radio of document.querySelectorAll('input[name="mode"]')) {
    radio.addEventListener('change', () => edit((r) => { r.mode = radio.value; }));
  }
  for (const id of ['priceMin', 'priceMax']) {
    let t = 0;
    $(id).addEventListener('input', (e) => {
      clearTimeout(t);
      const v = e.target.value;
      t = setTimeout(() => edit((r) => { r[id] = v === '' ? null : Number(v); }), 400);
    });
  }
  $('adsOn').addEventListener('change', (e) => edit((r) => { r.ads = e.target.checked; }));
  $('sponsoredOn').addEventListener('change', (e) => edit((r) => { r.sponsored = e.target.checked; }));
  $('clearLinks').addEventListener('click', () => { if (confirm(SF.t('confirmClear'))) edit((r) => { r.hiddenLinks = []; }); });
  $('clearSelectors').addEventListener('click', () => { if (confirm(SF.t('confirmClear'))) edit((r) => { r.selectors = []; }); });
  $('clearCard').addEventListener('click', () => edit((r) => { r.cardSelector = ''; }));
  $('peek').addEventListener('click', async () => { await tabMsg({ type: 'sf:peek', on: !peek }); refresh(); });
  $('pick').addEventListener('click', async () => { await tabMsg({ type: 'sf:pick' }); window.close(); });
  $('rescan').addEventListener('click', async () => { await tabMsg({ type: 'sf:rescan' }); refresh(); });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes[SF.STORAGE_KEY]) return;
    settings = await SF.load();
    render();
  });

  render();
  refresh();
})();
