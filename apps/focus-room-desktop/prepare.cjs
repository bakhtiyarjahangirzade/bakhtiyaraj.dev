const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, 'renderer');
fs.mkdirSync(target, { recursive: true });
for (const file of ['index.html', 'focus.css', 'focus.js', 'timer-core.js', 'icon.svg']) {
  fs.copyFileSync(path.resolve(__dirname, '../../public/apps/focus-room', file), path.join(target, file));
}
fs.cpSync(path.resolve(__dirname, '../../public/apps/focus-room/assets'), path.join(target, 'assets'), { recursive: true });
fs.copyFileSync(path.resolve(__dirname, '../../LICENSE'), path.join(target, 'LICENSE.txt'));
