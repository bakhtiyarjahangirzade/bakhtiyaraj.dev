# BAKHY

Free and open-source personal developer hub by Bakhtiyar. This is the minimal
working foundation: a responsive catalog, category filters, concept previews,
an experiments area, and source links.

## Project catalog

Browse All, Apps, Games, Tools, or Lab. The selected category is shareable in the
URL and works with browser back/forward. Focus Room is a working Pomodoro app at
`/apps/focus-room/`, also downloadable as a portable Windows x64 executable.
Pixel Lab, Color Riot, and Grid Run are labeled concepts, not released products.
Preview buttons open a project summary. Real applications can replace them as
they are built; the site does not pretend those products are already usable.

## Focus Room

- Custom focus, short-break and long-break durations; pause, resume and reset.
- Wall-clock deadlines restore correctly after sleep or a delayed timer callback.
- Soft bell or digital chime, adjustable volume and optional synthesized rain.
- Sessions and settings saved locally; no account or external service.
- Windows portable `.exe` is built from the exact same HTML/CSS/JS as the web app.
- Sounds require the app to be open. Closing/reopening restores the saved timer.

Desktop build instructions: [apps/focus-room-desktop](apps/focus-room-desktop).
Run `npm test` for timer-core tests. The unsigned Windows binary is distributed
through the `focus-room-v1.1.0` GitHub release, not committed to Git.

## Run locally

Requires Node.js 22 or newer. There are no runtime or build dependencies, API keys,
paid APIs, accounts, or environment variables required to run the site.

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
