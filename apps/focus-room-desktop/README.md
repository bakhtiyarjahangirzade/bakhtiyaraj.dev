# Focus Room for Windows

Free offline Pomodoro app. Portable Windows x64 executable; no installer or account.
Both desktop and web use the same files from `public/apps/focus-room`.

```sh
npm ci
npm run package
```

The generated executable is in `release/`. It is not code-signed.
Timers and settings stay in Electron's local application storage. The app must be
open for alarm and rain audio. It uses locally synthesized sounds, no audio downloads.
Closing and reopening restores the deadline; a finished session is recorded once.

Electron renderer is sandboxed, with Node integration disabled and no preload IPC.
Only packaged assets are served through the `focus://app/` protocol. External
navigation is restricted to the BAKHY home page and the Focus Room release page.
