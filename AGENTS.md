# AGENTS.md — POSH (Polar Observing Site Hub)

Monorepo with two services: `angular/` (Angular 19 SPA) and `backend/` (Python 3.13 data engine), deployed as Docker images via `deploy/`.

## Branching and PR flow (enforced — do not work around it)

- `dev` is the **default branch**. All work happens on feature branches off `dev`.
- Feature PRs → `dev` are **squash-merged**. This is enforced by the GitHub ruleset *Protect dev* — the UI offers no other merge method.
- `main` receives **only** promotions from `dev`, via a PR merged with a **merge commit** (ruleset *Protect main*, merge-only). Never open a PR to `main` from any other branch: the required `main-source-check` job in `.github/workflows/ci.yml` fails unless the head branch is `dev`.
- Never squash or rebase a `dev` → `main` promotion: rewriting SHAs permanently diverges `main` from `dev` and breaks future promotion diffs.
- Direct pushes, force pushes, and branch deletion are blocked on both `main` and `dev` (no bypass actors). Rebase-merge is disabled repo-wide. Merged feature branches are auto-deleted.
- After a promotion, `dev` shows as "out of sync" with `main` — this is cosmetic (the promotion merge commits live only on `main`). Ignore it; do **not** back-merge.
- Branch protection lives in GitHub rulesets (repo Settings → Rules), not in files in this repo. Changing the flow means editing those rulesets via the API/UI, not just workflows.

## CI

- Single workflow: `.github/workflows/ci.yml` (*CI Gate*) on PRs and pushes to `main`/`dev`.
- `dorny/paths-filter` selects which reusable build runs: `angular/**` + `deploy/frontend/**` → `angular-build.yml`; `backend/**` + `deploy/backend/**` → `backend-build.yml`.
- The `gate` job is the required status check (strict: branch must be up to date). Skipped builds are fine; failed/cancelled ones block.
- On push to `main`/`dev`, images are pushed to `arcticportal.azurecr.io` (`posh/angular`, `posh/dataengine`); `latest` and the production Angular build only happen on `main`.
- Workflow jobs declare minimal `permissions:` — keep it that way; the repo default token is read-only.

## Secrets and env files

- Never commit `.env` / `.env.*` files — they are gitignored; only `deploy/.env_example` is tracked. `deploy/.env.dev` / `.env.prd` are local-only files.
- ACR credentials live in GitHub Actions secrets (`ACR_USERNAME` / `ACR_PASSWORD`), used only on push builds.

## Local development

- Full stack: `cp deploy/.env_example .env`, then `docker compose -f deploy/docker-compose.dev.yml up` (backend first on a fresh volume).
- Frontend only: `cd angular && npm install && npm start`.
- Backend only: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -e .` then run with `PYTHONPATH=src/posh`.
