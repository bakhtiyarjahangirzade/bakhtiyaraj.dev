/* SiteFilter service worker: toolbar badge, right-click menu and keyboard shortcuts. */
importScripts('lib.js');
const SF = globalThis.SiteFilter;

const MENU = {
  link: 'sf-hide-link',
  text: 'sf-block-text',
  pick: 'sf-pick',
  site: 'sf-toggle-site'
};

function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU.link, title: SF.t('menuHideLink'), contexts: ['link'] });
    chrome.contextMenus.create({ id: MENU.text, title: SF.t('menuBlockText'), contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU.pick, title: SF.t('menuPick'), contexts: ['page', 'image', 'link'] });
    chrome.contextMenus.create({ id: MENU.site, title: SF.t('menuToggleSite'), contexts: ['page'] });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  buildMenus();
  // Write defaults on first install only, so every context reads the same shape.
  const got = await chrome.storage.local.get(SF.STORAGE_KEY);
  if (!got[SF.STORAGE_KEY]) await SF.save({});
});
chrome.runtime.onStartup.addListener(buildMenus);

async function toggleSite(host) {
  if (!host) return;
  await SF.updateSite(host, (rule) => { rule.enabled = !rule.enabled; });
}

async function sendToTab(tabId, msg) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    // Page was open before install/update: inject the scripts, then retry.
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['src/lib.js', 'src/presets.js', 'src/content.js'] });
      return await chrome.tabs.sendMessage(tabId, msg);
    } catch { return null; }
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const host = SF.hostFromUrl(info.pageUrl || (tab && tab.url) || '');
  if (!host) return;
  if (info.menuItemId === MENU.link && info.linkUrl) {
    const link = SF.normalizeLink(info.linkUrl);
    if (link) await SF.updateSite(host, (rule) => { rule.hiddenLinks.push(link); });
  } else if (info.menuItemId === MENU.text && info.selectionText) {
    const text = info.selectionText.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (text) await SF.updateSite(host, (rule) => { rule.keywords.push(text); });
  } else if (info.menuItemId === MENU.pick && tab) {
    await sendToTab(tab.id, { type: 'sf:pick' });
  } else if (info.menuItemId === MENU.site) {
    await toggleSite(host);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (command === 'toggle-site') await toggleSite(SF.hostFromUrl(tab.url || ''));
  if (command === 'start-picker') await sendToTab(tab.id, { type: 'sf:pick' });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg) return;
  if (msg.type === 'sf:count' && sender.tab) {
    const tabId = sender.tab.id;
    const n = msg.count;
    chrome.action.setBadgeBackgroundColor({ tabId, color: n < 0 ? '#6b6b70' : '#c2410c' });
    chrome.action.setBadgeText({ tabId, text: n < 0 ? 'off' : n > 0 ? (n > 999 ? '999+' : String(n)) : '' });
  } else if (msg.type === 'sf:inject' && typeof msg.tabId === 'number') {
    sendToTab(msg.tabId, msg.payload).then(reply);
    return true;
  }
});
