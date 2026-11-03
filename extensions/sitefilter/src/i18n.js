/* Fills data-i18n / data-i18n-placeholder / data-i18n-title from _locales. */
(function () {
  'use strict';
  const t = (k) => chrome.i18n.getMessage(k) || k;
  function translate(root) {
    for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  }
  document.documentElement.lang = chrome.i18n.getUILanguage();
  translate(document);
  globalThis.sfTranslate = translate;
})();
