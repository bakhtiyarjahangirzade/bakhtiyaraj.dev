import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
console.log('BAKHY static build ready in dist/');
// Windows installers for the games (Neutralinojs + NSIS). Skipped with BAKHY_SKIP_DESKTOP=1.
if (!process.env.BAKHY_SKIP_DESKTOP) {
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('../apps/games-desktop/build.mjs', import.meta.url))], {
      stdio: 'inherit', env: { ...process.env, BAKHY_DOWNLOADS: fileURLToPath(new URL('downloads/', output)) }
    });
  } catch (e) {
    console.error('Desktop installers failed to build:', e.message);
    if (process.env.VERCEL) process.exit(1);
  }
  // Authentic desktop app: Windows installer + macOS app (same detector as the website, offline)
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('../apps/authentic-desktop/build.mjs', import.meta.url))], {
      stdio: 'inherit', env: { ...process.env, BAKHY_DOWNLOADS: fileURLToPath(new URL('downloads/', output)) }
    });
  } catch (e) {
    console.error('Authentic desktop build failed:', e.message);
    if (process.env.VERCEL) process.exit(1);
  }
}
