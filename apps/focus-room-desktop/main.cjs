const { app, BrowserWindow, protocol, net, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
protocol.registerSchemesAsPrivileged([{ scheme: 'focus', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(() => {
    const base = path.join(__dirname, 'renderer');
    protocol.handle('focus', request => {
      const url = new URL(request.url);
      const file = path.resolve(base, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
      if (url.host !== 'app' || !file.startsWith(base + path.sep)) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(file).toString());
    });
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    window = new BrowserWindow({ width: 1140, height: 850, minWidth: 420, minHeight: 620, title: 'Focus Room', backgroundColor: '#e0e2e4', show: false, autoHideMenuBar: true, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, backgroundThrottling: false } });
    window.once('ready-to-show', () => window.show());
    window.setMenu(null);
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('focus://app/')) return;
      event.preventDefault();
      if (url === 'https://www.bakhtiyaraj.dev/' || url === 'https://github.com/bakhtiyarjahangirzade/bakhtiyaraj.dev/releases/tag/focus-room-v1.0.0') shell.openExternal(url);
    });
    window.webContents.on('did-fail-load', (_event, code, description) => console.error('Focus Room load failed:', code, description));
    window.loadURL('focus://app/').then(() => window.show()).catch(error => console.error(error.message));
  });
  app.on('window-all-closed', () => app.quit());
}
