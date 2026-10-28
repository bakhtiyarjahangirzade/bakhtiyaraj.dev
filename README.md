# BAKHY Workbench

Free and open-source developer hub by Bakhtiyar. The whole site is designed as one
piece of equipment: a charcoal rack of modules with amber VFD screens, latching radio
keys, screws and status LEDs (`public/assets/rack.css`). Each module is a real app,
game or extension, or is clearly marked **On the bench** while it is being built.

## Modules

| Module | Status | Where |
| --- | --- | --- |
| Chess | Live | `/games/chess/` · Windows installer |
| Last One (Uno-style) | Live | `/games/last-one/` · Windows installer |
| Durak | Live | `/games/durak/` · Windows installer |
| Domino | Live | `/games/domino/` · Windows installer |
| Serpent Zone | Live | `/games/serpent/` · snake battle royale, shrinking arena |
| Blackjack, Roulette, Poker, Slots | Live | `/games/blackjack/` · `/games/roulette/` · `/games/poker/` · `/games/slots/` |
| Focus Room | Live | `/apps/focus-room/` · Windows release |
| Authentic (beta) | Live | `/authentic/` · AI-writing checker for assignments, Edge Function `authentic` |
| PreviewMaster | On the bench | Windows Explorer preview handler |
| ColorPicker, Color+, SiteFilter | On the bench | Chrome extensions |

## Accounts and play chips

- Sign in / register with email and password (Supabase Auth). New accounts get 5,000 play chips, plus a daily +1,000 bonus.
- Balances live in `public.profiles.chips` and only change through RPCs (`set_chips`, `claim_bonus`, `admin_update_user`), each logged in `chip_log`.
- Guests keep a local 5,000-chip wallet in their browser. Chips are play money only: they can't be bought or cashed out.
- Casino tables seat players with their wallet balance and write the table stack back after each round. Game results are reported by the client, so balances are not cheat-proof.
- `/admin/` lets admins edit chips, roles and bans. The account registered with bakhtiyaraj@code.edu.az becomes admin automatically.

## Games

- Shared shell in `public/games/shared/`: lobby, match controller, bots, deal/FLIP card motion, card-room table, seats with avatars, confetti and sound.
- Table art (felt, wood rail, card back, robot avatars) was generated with ChatGPT image generation and converted with `scripts/convert-game-assets.py`. Chess pieces and the board are hand-drawn SVG/CSS.
- Modes: vs bots, same screen (chess), and **online rooms** with a 4-character code or invite link.
- Online play uses Supabase Realtime broadcast + presence on the `bakhy-dev` project
  (`public/games/shared/net.js`). No tables, accounts or stored data. The room creator's
  browser runs the rules engine and sends state to everyone; if a player leaves, a bot takes the seat.
  Hands are sent to every client, so this is meant for friendly games, not anti-cheat play.
- Rules engines are plain JSON-in/JSON-out modules (`engine.js`) and are covered by
  bot-vs-bot simulations in `tests/games.test.mjs`. Chess rules come from chess.js (BSD-2).

### Windows builds

`apps/games-desktop/build.mjs` wraps each game in a ~2.6 MB Neutralinojs app (uses the
WebView2 runtime that ships with Windows 10/11) and a per-user NSIS installer (~1 MB) with
Start menu and desktop shortcuts and an uninstaller. `npm run build` produces them in
`dist/downloads/`, so every Vercel deploy rebuilds the installers. Installers are unsigned,
so Windows SmartScreen shows a warning on first run.

## Focus Room

- Custom focus, short-break and long-break durations; pause, resume and reset.
- Wall-clock deadlines restore correctly after sleep or a delayed timer callback.
- Soft bell or digital chime, adjustable volume and optional synthesized rain.
- Sessions and settings saved locally; no account or external service.
- Windows portable `.exe` is built from the exact same HTML/CSS/JS as the web app.
- Sounds require the app to be open. Closing/reopening restores the saved timer.

Desktop build instructions: [apps/focus-room-desktop](apps/focus-room-desktop).
Run `npm test` for timer-core tests. The unsigned Windows binary is distributed
through the `focus-room-v1.3.0` GitHub release, not committed to Git.

The Instrument edition uses local fonts and material textures. Font and icon
licenses are included under `public/apps/focus-room/assets/`. See `design-qa.md`
for comparison evidence and the deliberate native-control/chrome adaptations.
Duration controls use animated split flaps with keyboard-editable values and
mechanical step keys. Button clicks play a short radio-style effect, controlled
by the master volume. The bundled MIT sample is reproducible with
`python scripts/generate-click.py`; no third-party recording or network is needed.

## Run locally

Requires Node.js 22 or newer. Dev dependencies (chess.js, supabase-js, Neutralinojs CLI,
resedit, 7zip-bin) are installed by `npm ci`; no API keys or environment variables are needed.
Use `npm run build:web` to skip the Windows installers.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Run `npm run build` to generate the static `dist/` directory.
Any static web server can host that directory.

## Structure

- `public/`: semantic HTML, shared CSS tokens, and favicon.
- `scripts/`: dependency-free build and local development server.
- `.github/`: issue and pull request templates.
- `vercel.json`: static deployment configuration and response headers.

## Deployment

The dedicated Vercel project is `bakhtiyaraj-dev` in the existing `BakhtiyarAjPro`
team (`bakhtiyaraj-pro-updated`). GitHub integration deploys pushes to `main`
to production and branches/pull requests to previews. No Vercel token is stored in GitHub.
Vercel runs the build on every deployment. A separate GitHub Actions workflow is
not enabled because the current GitHub login does not have the `workflow` scope.

Target domain: https://bakhtiyaraj.dev. Domain activation is separate from the build;
check Vercel Domains for the current verified assignment before moving it.

The source and local runtime are free. Hosting uses the owner's existing Vercel Pro
team; hosting and domain renewal remain subject to that provider's billing.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Features are early-stage; do not infer an
existing backend, login system, or published notes from the placeholder sections.

## License

[MIT](LICENSE).

## Game server and fair play

Card games, casino tables and slot spins run on a Supabase Edge Function (`play`), not in the browser.

- `server/core.mjs` runs tables: seats, bots, turn timers, chips moving between wallet and table. Each player only ever receives `engine.viewFor(state, seat)`; the full state stays in the `game_tables` table, which clients cannot read.
- Every card, tile, wheel and reel comes from `HMAC-SHA256(server seed, client seed : counter)` (`public/games/shared/rng.js`). The server publishes the SHA-256 of its seed before a hand and reveals the seed after it; `/fair/` re-deals revealed hands in the browser.
- Serpent Zone solo runs are deterministic (`public/games/serpent/sim.js`); the server replays the input log before a score reaches the leaderboard.
- `npm run build:function` bundles `server/function.mjs` with the engines into `supabase/functions/play/index.js`. The deployed function imports that file from GitHub pinned to a commit.
- `npm run dev:play` runs the same server core in memory for local play and testing (no Supabase needed).

## Authentic

AI-writing analysis for student assignments at `/authentic/` (landing, features, pricing, checker).

- Pages are generated by `python3 scripts/authentic-pages.py` into `public/authentic/`; checker logic is `public/authentic/assets/check.js`.
- The Supabase Edge Function `authentic` (`supabase/functions/authentic/`) reads .docx/.pptx/.pdf/.txt in memory,
  scores each paragraph with a hashed-feature logistic regression (`model.json`, int8), returns a split-conformal
  98% range for the AI share, and scans for hidden text, ChatGPT leftovers, prompt injections and metadata. Nothing is stored.
- The deployed function imports these files from GitHub pinned to a commit, like `play`.
- Training pipeline and measured accuracy: `ml/authentic/README.md`. Tests: `tests/authentic.test.mjs`.

## Storefront redesign

The production landing page and service configurator are built from `storefront/` with Vite, after the existing apps build. The old workbench is retained at `/lab/`; games, tools, downloads and account routes remain available. `npm run build:web` skips desktop installers for web-only verification. Push `main` to publish to the existing `bakhtiyaraj-dev` Vercel project at https://www.bakhtiyaraj.dev.
