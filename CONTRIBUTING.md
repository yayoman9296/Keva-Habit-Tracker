# Contributing to Keva

Thanks for your interest in helping build Keva! This project is early-stage and moving deliberately, so please open an issue before starting on anything large.

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:5173`.

## Before submitting a PR

```bash
npm run lint
npm run typecheck
npm run build
```

All three should pass. CI runs the same checks on every pull request.

## Code style

- TypeScript everywhere, strict mode on.
- Prettier handles formatting — run `npm run format` before committing.
- Keep components small and focused; prefer composition over configuration.

## Reporting issues

Use the issue templates for bugs and feature requests. For feature ideas, explain the frum-life use case — Keva is scoped intentionally, not a general-purpose habit tracker.
