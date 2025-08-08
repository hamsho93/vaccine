# Contributing

- Create a feature branch from `main`.
- Push commits to your branch and open a PR to `main`.
- CI must be green (type-check, lint, build, tests with coverage) before merge.
- At least 1 approval is required. Direct pushes to `main` are blocked by workflow.

## Commands
- Install: `npm ci`
- Type-check: `npm run check`
- Lint: `npm run lint`
- Build frontend: `npm run build:frontend`
- Tests + coverage: `npm test -- --run`
