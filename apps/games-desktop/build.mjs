// Builds small Windows apps for the games with Neutralinojs (WebView2) and wraps each in an NSIS installer.
// Requires: npx @neutralinojs/neu@11.3.1, resedit, makensis. Output: public/downloads/BAKHY-<Game>-Setup.exe
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const pub = path.join(root, 'public');
const work = path.join(here, 'work');
const out = process.env.BAKHY_DOWNLOADS || path.join(pub, 'downloads');
const VERSION = '1.0.0';
const GAMES = [
  { id: 'chess', title: 'BAKHY Chess', file: 'BAKHY-Chess' },
  { id: 'last-one', title: 'BAKHY Last One', file: 'BAKHY-Last-One' },
  { id: 'durak', title: 'BAKHY Durak', file: 'BAKHY-Durak' },
  { id: 'domino', title: 'BAKHY Domino', file: 'BAKHY-Domino' }
];
const only = process.argv[2];
await mkdir(out, { recursive: true });

// makensis: use the system one, or fetch the portable Linux build that electron-builder publishes.
async function findMakensis() {
  try { execFileSync('makensis', ['-VERSION'], { stdio: 'ignore' }); return { bin: 'makensis', env: process.env }; } catch {}
  const dir = path.join(work, 'nsis'), base = path.join(dir, 'nsis-3.0.4.1');
  try { await readdir(path.join(base, 'linux')); } catch {
    await mkdir(dir, { recursive: true });
    const url = 'https://github.com/electron-userland/electron-builder-binaries/releases/download/nsis-3.0.4.1/nsis-3.0.4.1.7z';
    const res = await fetch(url); if (!res.ok) throw new Error('NSIS download failed: ' + res.status);
    const archive = path.join(dir, 'nsis.7z'); await writeFile(archive, Buffer.from(await res.arrayBuffer()));
    const { path7za } = await import('7zip-bin');
    try { execFileSync('chmod', ['+x', path7za]); } catch {}
    execFileSync(path7za, ['x', '-y', '-o' + base, archive], { stdio: 'ignore' });
  }
  const bin = path.join(base, 'linux', 'makensis');
  execFileSync('chmod', ['+x', bin]);
  return { bin, env: { ...process.env, NSISDIR: base } };
}
const nsis = await findMakensis();
const neuBin = path.join(here, '../../node_modules/.bin/neu');

for (const g of GAMES.filter(x => !only || x.id === only)) {
  const dir = path.join(work, g.id), res = path.join(dir, 'resources');
  await rm(dir, { recursive: true, force: true });
  await mkdir(res, { recursive: true });
  for (const p of ['assets', 'vendor', 'favicon.svg', 'games/shared', `games/${g.id}`]) await cp(path.join(pub, p), path.join(res, p), { recursive: true });
  { // window icon: the 256px PNG frame inside the .ico
    const R0 = (await import('resedit')).default ?? (await import('resedit'));
    const icoFile = R0.Data.IconFile.from(await readFile(path.join(here, 'icons', g.id + '.ico')));
    const big = icoFile.icons.reduce((a, b) => ((b.width || 256) > (a.width || 256) ? b : a));
    const raw = big.data.bin ?? big.data.rawData ?? big.data;
    await writeFile(path.join(res, 'icon.png'), Buffer.from(raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw));
  }
  await writeFile(path.join(res, 'desktop.js'), 'window.BAKHY_DESKTOP = true;\n');
  await writeFile(path.join(res, 'index.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/games/${g.id}/"><title>${g.title}</title>`);
  const gameHtml = path.join(res, 'games', g.id, 'index.html');
  await writeFile(gameHtml, (await readFile(gameHtml, 'utf8')).replace('<script type="module"', '<script src="/desktop.js"></script>\n<script type="module"'));
  const cfg = {
    applicationId: 'dev.bakhy.' + g.id.replace(/-/g, ''), version: VERSION, defaultMode: 'window', port: 0,
    documentRoot: '/resources/', url: `/games/${g.id}/`, enableServer: true, enableNativeAPI: false, tokenSecurity: 'one-time',
    logging: { enabled: false, writeToLogFile: false },
    modes: { window: { title: g.title, width: 1200, height: 900, minWidth: 420, minHeight: 560, center: true, icon: '/resources/icon.png', enableInspector: false, useSavedState: true, exitProcessOnClose: true } },
    cli: { binaryName: g.file, resourcesPath: '/resources/', extensionsPath: '/extensions/', binaryVersion: '6.3.0', clientVersion: '6.3.0' }
  };
  await writeFile(path.join(dir, 'neutralino.config.json'), JSON.stringify(cfg, null, 2));
  const neu = (...a) => execFileSync(neuBin, a, { cwd: dir, stdio: 'inherit' });
  neu('update');
  neu('build');
  const dist = path.join(dir, 'dist', g.file);
  const exeName = (await readdir(dist)).find(f => f.endsWith('win_x64.exe'));
  const exe = path.join(dist, g.file + '.exe');
  await cp(path.join(dist, exeName), exe);
  // icon + version info, without wine
  const R = (await import('resedit')).default ?? (await import('resedit'));
  const bin = R.NtExecutable.from(await readFile(exe), { ignoreCert: true });
  const rs = R.NtExecutableResource.from(bin);
  const ico = R.Data.IconFile.from(await readFile(path.join(here, 'icons', g.id + '.ico')));
  const grp = R.Resource.IconGroupEntry.fromEntries(rs.entries);
  R.Resource.IconGroupEntry.replaceIconsForResource(rs.entries, grp[0]?.id ?? 1, grp[0]?.lang ?? 1033, ico.icons.map(i => i.data));
  const vi = R.Resource.VersionInfo.fromEntries(rs.entries)[0] || R.Resource.VersionInfo.createEmpty();
  const [a, b, c] = VERSION.split('.').map(Number);
  vi.setFileVersion(a, b, c, 0, 1033); vi.setProductVersion(a, b, c, 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, { ProductName: g.title, FileDescription: g.title, CompanyName: 'BAKHY', OriginalFilename: g.file + '.exe', LegalCopyright: 'MIT · Bakhtiyar Jahangirzade' });
  vi.outputToResourceEntries(rs.entries); rs.outputResource(bin);
  await writeFile(exe, Buffer.from(bin.generate()));
  execFileSync(nsis.bin, ['-V2', `-DNAME=${g.title}`, `-DID=${cfg.applicationId}`, `-DEXE=${g.file}.exe`, `-DSRC=${dist}`, `-DICON=${path.join(here, 'icons', g.id + '.ico')}`, `-DVERSION=${VERSION}`, `-DOUT=${path.join(out, g.file + '-Setup.exe')}`, path.join(here, 'installer.nsi')], { stdio: 'inherit', env: nsis.env });
  console.log('built', g.file + '-Setup.exe');
}
