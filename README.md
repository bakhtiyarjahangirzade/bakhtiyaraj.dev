# BAKHY

Free and open-source personal developer hub by Bakhtiyar. This is the minimal
working foundation: a responsive home page, project area, notes area, and source links.

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
