(async function () {
  'use strict';
  const SF = globalThis.SiteFilter;
  const $ = (id) => document.getElementById(id);
  const lines = (text) => SF.cleanList(String(text || '').split('\n'));
  let settings = await SF.load();
  let openHost = null;

  function flash(el) {
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1400);
  }

  /* ---------- general ---------- */

  function renderGeneral() {
    $('enabled').checked = settings.enabled;
    $('display').value = settings.display;
    $('hideAds').checked = settings.hideAds;
    $('hideSponsored').checked = settings.hideSponsored;
    if (document.activeElement !== $('globalKeywords')) $('globalKeywords').value = settings.globalKeywords.join('\n');
    if (document.activeElement !== $('sponsorLabels')) $('sponsorLabels').value = settings.sponsorLabels.join('\n');
  }

  async function patch(fn) {
    settings = await SF.load();
    fn(settings);
    await SF.save(settings);
    settings = await SF.load();
  }

  for (const id of ['enabled', 'hideAds', 'hideSponsored']) {
    $(id).addEventListener('change', (e) => patch((s) => { s[id] = e.target.checked; }));
  }
  $('display').addEventListener('change', (e) => patch((s) => { s.display = e.target.value; }));

  $('saveGlobal').addEventListener('click', async () => {
    const kws = lines($('globalKeywords').value);
    const bad = kws.filter((k) => !SF.compileKeyword(k));
    if (bad.length) { alert(`${SF.t('badPattern')}\n\n${bad.join('\n')}`); return; }
    await patch((s) => { s.globalKeywords = kws; s.sponsorLabels = lines($('sponsorLabels').value); });
    flash($('savedGlobal'));
  });
  $('resetLabels').addEventListener('click', () => {
    $('sponsorLabels').value = SF.DEFAULT_SPONSOR_LABELS.join('\n');
  });

  /* ---------- sites ---------- */

  function cell(text, cls) {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    td.textContent = text;
    return td;
  }

  function priceText(r) {
    if (r.priceMin === null && r.priceMax === null) return '—';
    return `${r.priceMin ?? '0'} – ${r.priceMax ?? '∞'}`;
  }

  function renderSites() {
    const tbody = $('sites');
    tbody.textContent = '';
    const hosts = Object.keys(settings.sites).sort();
    if (!hosts.length) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = cell(SF.t('noSites'));
      td.colSpan = 7;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    for (const host of hosts) {
      const r = settings.sites[host];
      const tr = document.createElement('tr');
      const name = cell('');
      const strong = document.createElement('strong');
      strong.textContent = host;
      name.appendChild(strong);

      const on = document.createElement('td');
      const sw = document.createElement('label');
      sw.className = 'switch small';
      sw.innerHTML = '<input type="checkbox"><span></span>';
      const box = sw.querySelector('input');
      box.checked = r.enabled;
      box.setAttribute('aria-label', `${SF.t('colOn')}: ${host}`);
      box.addEventListener('change', () => patch((s) => { s.sites[host].enabled = box.checked; }));
      on.appendChild(sw);

      const actions = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'link';
      editBtn.type = 'button';
      editBtn.textContent = SF.t('edit');
      editBtn.addEventListener('click', () => { openHost = openHost === host ? null : host; renderSites(); });
      const delBtn = document.createElement('button');
      delBtn.className = 'link';
      delBtn.type = 'button';
      delBtn.style.color = 'var(--red)';
      delBtn.textContent = SF.t('delete');
      delBtn.addEventListener('click', async () => {
        if (!confirm(SF.t('confirmDelete', [host]))) return;
        await patch((s) => { delete s.sites[host]; });
        if (openHost === host) openHost = null;
        renderSites();
      });
      wrap.append(editBtn, delBtn);
      actions.appendChild(wrap);

      tr.append(
        name, on,
        cell(SF.t(r.mode === 'only' ? 'modeOnlyShort' : 'modeBlockShort')),
        cell(String(r.keywords.length + r.allow.length), 'num'),
        cell(String(r.hiddenLinks.length), 'num'),
        cell(priceText(r), 'num'),
        actions
      );
      tbody.appendChild(tr);
      if (openHost === host) tbody.appendChild(editor(host, r));
    }
  }

  function editor(host, r) {
    const frag = $('editorTpl').content.cloneNode(true);
    globalThis.sfTranslate(frag);
    const row = frag.querySelector('tr');
    const f = (name) => row.querySelector(`[data-f="${name}"]`);
    for (const k of ['keywords', 'allow', 'hiddenLinks', 'selectors']) f(k).value = r[k].join('\n');
    f('mode').value = r.mode;
    f('cardSelector').value = r.cardSelector;
    f('priceMin').value = r.priceMin ?? '';
    f('priceMax').value = r.priceMax ?? '';
    f('ads').value = r.ads === null ? '' : String(r.ads);
    f('sponsored').value = r.sponsored === null ? '' : String(r.sponsored);

    row.querySelector('[data-act="close"]').addEventListener('click', () => { openHost = null; renderSites(); });
    row.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const kws = [...lines(f('keywords').value), ...lines(f('allow').value)];
      const bad = kws.filter((k) => !SF.compileKeyword(k));
      if (bad.length) { alert(`${SF.t('badPattern')}\n\n${bad.join('\n')}`); return; }
      const sel = f('cardSelector').value.trim();
      const badSel = [...lines(f('selectors').value), sel].filter(Boolean).filter((s) => {
        try { document.createDocumentFragment().querySelector(s); return false; } catch { return true; }
      });
      if (badSel.length) { alert(`${SF.t('badSelector')}\n\n${badSel.join('\n')}`); return; }
      const tri = (v) => (v === '' ? null : v === 'true');
      await patch((s) => {
        s.sites[host] = SF.normalizeSite({
          ...s.sites[host],
          keywords: lines(f('keywords').value),
          allow: lines(f('allow').value),
          hiddenLinks: lines(f('hiddenLinks').value),
          selectors: lines(f('selectors').value),
          mode: f('mode').value,
          cardSelector: sel,
          priceMin: f('priceMin').value,
          priceMax: f('priceMax').value,
          ads: tri(f('ads').value),
          sponsored: tri(f('sponsored').value)
        });
      });
      flash(row.querySelector('.saved'));
    });
    return frag;
  }

  $('addSite').addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = $('newSite').value.trim();
    const host = SF.hostFromUrl(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    if (!host || !host.includes('.')) { $('newSite').setCustomValidity(SF.t('badHost')); $('newSite').reportValidity(); return; }
    $('newSite').setCustomValidity('');
    await patch((s) => { if (!s.sites[host]) s.sites[host] = SF.normalizeSite({}); });
    $('newSite').value = '';
    openHost = host;
    renderSites();
  });
  $('newSite').addEventListener('input', () => $('newSite').setCustomValidity(''));

  /* ---------- backup ---------- */

  $('export').addEventListener('click', async () => {
    const data = JSON.stringify({ app: 'SiteFilter', exported: new Date().toISOString(), settings: await SF.load() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitefilter-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const incoming = SF.normalizeSettings(json.settings || json);
      const merge = confirm(SF.t('confirmImportMerge'));
      await patch((s) => {
        if (!merge) { Object.assign(s, incoming); return; }
        s.globalKeywords = SF.cleanList([...s.globalKeywords, ...incoming.globalKeywords]);
        for (const [host, rule] of Object.entries(incoming.sites)) {
          const cur = s.sites[host];
          s.sites[host] = !cur ? rule : {
            ...cur,
            keywords: [...cur.keywords, ...rule.keywords],
            allow: [...cur.allow, ...rule.allow],
            hiddenLinks: [...cur.hiddenLinks, ...rule.hiddenLinks],
            selectors: [...cur.selectors, ...rule.selectors]
          };
        }
      });
      $('backupMsg').textContent = SF.t('importDone', [String(Object.keys(incoming.sites).length)]);
    } catch {
      $('backupMsg').textContent = SF.t('importFailed');
    }
  });

  $('resetAll').addEventListener('click', async () => {
    if (!confirm(SF.t('confirmReset'))) return;
    await SF.save({});
    settings = await SF.load();
    openHost = null;
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes[SF.STORAGE_KEY]) return;
    settings = await SF.load();
    renderGeneral();
    if (!document.querySelector('.editor')) renderSites();
  });

  renderGeneral();
  renderSites();
})();
