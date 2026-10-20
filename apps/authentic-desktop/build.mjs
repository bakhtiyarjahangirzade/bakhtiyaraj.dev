// Builds the Authentic desktop app (offline AI-writing checker) with Neutralinojs.
// Output in $BAKHY_DOWNLOADS (default public/downloads):
//   Authentic-Setup.exe        per-user Windows installer (NSIS, WebView2)
//   Authentic-macOS.zip        Authentic.app, universal (Apple silicon + Intel), unsigned
import { cp, mkdir, rm, writeFile, readFile, readdir, chmod } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const work = path.join(here, 'work');
const out = process.env.BAKHY_DOWNLOADS || path.join(root, 'public', 'downloads');
const VERSION = '1.0.0', NAME = 'Authentic', ID = 'dev.bakhy.authentic';
const dir = path.join(work, 'app'), res = path.join(dir, 'resources');

await rm(dir, { recursive: true, force: true });
await mkdir(path.join(res, 'fonts'), { recursive: true });
await mkdir(out, { recursive: true });

// 1. Web resources: bundled app + the website design system
await build({ entryPoints: [path.join(here, 'app/main.js')], bundle: true, format: 'iife', platform: 'browser', target: ['chrome100', 'safari15'], minify: true, outfile: path.join(res, 'app.js'), loader: { '.json': 'json' }, logLevel: 'warning' });
const site = path.join(root, 'public/authentic/assets');
await cp(path.join(site, 'authentic.css'), path.join(res, 'authentic.css'));
await cp(path.join(site, 'fonts/inter-var.woff2'), path.join(res, 'fonts/inter-var.woff2'));
await cp(path.join(here, 'app/index.html'), path.join(res, 'index.html'));
await cp(path.join(here, 'app/app.css'), path.join(res, 'app.css'));
await cp(path.join(here, 'icons/icon-256.png'), path.join(res, 'icon.png'));

// 2. Neutralino build (all platforms)
const cfg = {
  applicationId: ID, version: VERSION, defaultMode: 'window', port: 0,
  documentRoot: '/resources/', url: '/', enableServer: true, enableNativeAPI: false, tokenSecurity: 'one-time',
  logging: { enabled: false, writeToLogFile: false },
  modes: { window: { title: NAME, width: 1240, height: 820, minWidth: 820, minHeight: 560, center: true, icon: '/resources/icon.png', enableInspector: false, useSavedState: true, exitProcessOnClose: true } },
  cli: { binaryName: NAME, resourcesPath: '/resources/', extensionsPath: '/extensions/', binaryVersion: '6.3.0', clientVersion: '6.3.0' },
};
await writeFile(path.join(dir, 'neutralino.config.json'), JSON.stringify(cfg, null, 2));
const neuBin = path.join(root, 'node_modules/.bin/neu');
const neu = (...a) => execFileSync(neuBin, a, { cwd: dir, stdio: 'inherit' });
neu('update');
neu('build');
const dist = path.join(dir, 'dist', NAME);
const files = await readdir(dist);

// 3. Windows: icon + version info, then the NSIS installer shared with the games
{
  const R = (await import('resedit')).default ?? (await import('resedit'));
  const exe = path.join(dist, NAME + '.exe');
  await cp(path.join(dist, files.find((f) => f.endsWith('win_x64.exe'))), exe);
  const icoPath = path.join(here, 'icons/authentic.ico');
  const bin = R.NtExecutable.from(await readFile(exe), { ignoreCert: true });
  const rs = R.NtExecutableResource.from(bin);
  const ico = R.Data.IconFile.from(await readFile(icoPath));
  const grp = R.Resource.IconGroupEntry.fromEntries(rs.entries);
  R.Resource.IconGroupEntry.replaceIconsForResource(rs.entries, grp[0]?.id ?? 1, grp[0]?.lang ?? 1033, ico.icons.map((i) => i.data));
  const vi = R.Resource.VersionInfo.fromEntries(rs.entries)[0] || R.Resource.VersionInfo.createEmpty();
  const [a, b, c] = VERSION.split('.').map(Number);
  vi.setFileVersion(a, b, c, 0, 1033); vi.setProductVersion(a, b, c, 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, { ProductName: NAME, FileDescription: 'Authentic: offline AI-writing checker', CompanyName: 'BAKHY', OriginalFilename: NAME + '.exe', LegalCopyright: 'MIT · Bakhtiyar Jahangirzade' });
  vi.outputToResourceEntries(rs.entries); rs.outputResource(bin);
  await writeFile(exe, Buffer.from(bin.generate()));
  const nsis = await findMakensis();
  execFileSync(nsis.bin, ['-V2', `-DNAME=${NAME}`, `-DID=${ID}`, `-DEXE=${NAME}.exe`, `-DSRC=${dist}`, `-DICON=${icoPath}`, `-DVERSION=${VERSION}`, `-DOUT=${path.join(out, 'Authentic-Setup.exe')}`, path.join(root, 'apps/games-desktop/installer.nsi')], { stdio: 'inherit', env: nsis.env });
  console.log('built Authentic-Setup.exe');
}

// 4. macOS: Authentic.app around the universal binary, zipped with permissions kept
{
  const app = path.join(work, 'mac', `${NAME}.app`), contents = path.join(app, 'Contents');
  await rm(path.join(work, 'mac'), { recursive: true, force: true });
  await mkdir(path.join(contents, 'MacOS'), { recursive: true });
  await mkdir(path.join(contents, 'Resources'), { recursive: true });
  const macBin = files.find((f) => f.endsWith('mac_universal')) || files.find((f) => f.endsWith('mac_arm64'));
  await cp(path.join(dist, macBin), path.join(contents, 'MacOS', NAME));
  await chmod(path.join(contents, 'MacOS', NAME), 0o755);
  // Neutralino resolves resources.neu next to the binary or in Contents/Resources depending on version: ship both.
  await cp(path.join(dist, 'resources.neu'), path.join(contents, 'MacOS', 'resources.neu'));
  await cp(path.join(dist, 'resources.neu'), path.join(contents, 'Resources', 'resources.neu'));
  await cp(path.join(here, 'icons/authentic.icns'), path.join(contents, 'Resources', 'Authentic.icns'));
  await writeFile(path.join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>${NAME}</string>
<key>CFBundleDisplayName</key><string>${NAME}</string>
<key>CFBundleIdentifier</key><string>${ID}</string>
<key>CFBundleVersion</key><string>${VERSION}</string>
<key>CFBundleShortVersionString</key><string>${VERSION}</string>
<key>CFBundleExecutable</key><string>${NAME}</string>
<key>CFBundleIconFile</key><string>Authentic</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>11.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>LSApplicationCategoryType</key><string>public.app-category.education</string>
</dict></plist>
`);
  const zl = (await import('zip-lib')).default ?? (await import('zip-lib'));
  await zl.archiveFolder(path.join(work, 'mac'), path.join(out, 'Authentic-macOS.zip'));
  console.log('built Authentic-macOS.zip');
}

async function findMakensis() {
  try { execFileSync('makensis', ['-VERSION'], { stdio: 'ignore' }); return { bin: 'makensis', env: process.env }; } catch {}
  const nd = path.join(root, 'apps/games-desktop/work/nsis'), base = path.join(nd, 'nsis-3.0.4.1');
  try { await readdir(path.join(base, 'linux')); } catch {
    await mkdir(nd, { recursive: true });
    const r = await fetch('https://github.com/electron-userland/electron-builder-binaries/releases/download/nsis-3.0.4.1/nsis-3.0.4.1.7z');
    if (!r.ok) throw new Error('NSIS download failed: ' + r.status);
    const archive = path.join(nd, 'nsis.7z'); await writeFile(archive, Buffer.from(await r.arrayBuffer()));
    const { path7za } = await import('7zip-bin');
    try { execFileSync('chmod', ['+x', path7za]); } catch {}
    execFileSync(path7za, ['x', '-y', '-o' + base, archive], { stdio: 'ignore' });
  }
  const bin = path.join(base, 'linux', 'makensis');
  execFileSync('chmod', ['+x', bin]);
  return { bin, env: { ...process.env, NSISDIR: base } };
}
