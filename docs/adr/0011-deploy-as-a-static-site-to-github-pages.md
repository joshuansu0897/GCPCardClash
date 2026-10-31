# ADR-0011: Deploy as a static site to GitHub Pages

* **Status**: Accepted
* **Date**: 2026-10-31
* **Bounded Contexts**: composition-root
* **Supersedes**: None

## Context

The game is client-only (ADR-0002): the curriculum ships in the bundle, progress lives in `localStorage`, and nothing calls a server. It still had no published home. The code is already on GitHub, so the cheapest host is one that publishes straight from the repository without extra accounts or secrets.

## Considered Options

1. **GitHub Pages through GitHub Actions (chosen)**: the workflow tests, builds and publishes on every push to `main`.
   * Pros: no extra account, no secrets (OIDC `id-token`), free for public repositories, and a failing test or type error blocks the deploy.
   * Cons: a project site lives under `/GCPCardClash/`, so the build needs a base path. Private repositories need a paid GitHub plan.
2. **Firebase Hosting**: Pros: fits the Google Cloud theme, serves from a domain root, and works from a private repository. Cons: a Firebase project, a service-account key stored as a repository secret, and a second console to manage.
3. **Cloud Storage bucket with a load balancer**: Cons: the most setup and running cost for a static game.

## Decision

* `.github/workflows/deploy-pages.yml` runs `npm ci`, `npm test`, then `npm run build -- --base=<pages base path>/`, and deploys `dist/` with `actions/deploy-pages`.
* `vite.config.ts` keeps the default base `/`, so `npm run dev` and other hosts are unchanged. Only the Pages build passes `--base`.
* Runtime asset URLs (glTF models, audio) are built from `import.meta.env.BASE_URL`, never a hard-coded `/`.

## Consequences

* **Hexagonal Ring Placement**: no module changes. Deployment is outside `src/`, beside the composition root.
* **Positive**: every push to `main` that passes the tests is live within minutes. `docs/DEPLOYMENT.md` documents setup, local preview and troubleshooting.
* **Trade-offs**: progress in `localStorage` is per origin, so players start fresh on the Pages URL. A new file in `public/` that skips `BASE_URL` works locally and breaks on Pages. Option 2 stays available, because `dist/` is host-agnostic.

## Compliance

* Verified by building with `--base=/GCPCardClash/` and checking that `dist/index.html` references `/GCPCardClash/assets/...`.
