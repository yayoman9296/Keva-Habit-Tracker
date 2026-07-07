# Keva — Habit Tracker for Frum Life

**Building better keva (consistency) with kavana (intention) for the Orthodox Jewish community.**

[![CI](https://github.com/yayoman9296/keva-habit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/yayoman9296/keva-habit-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)

Keva is a habit tracking app designed specifically for frum Jews who want to build consistent routines in learning, tefillah, mitzvot, and personal growth — while staying grounded in Jewish values and calendar.

---

## Table of Contents

- [The Problem](#the-problem)
- [What Keva Does](#what-keva-does)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [About](#about)
- [License](#license)

---

## The Problem

Most habit tracking apps are built for general audiences and ignore the specific rhythms, values, and constraints of Orthodox Jewish life. People struggle to maintain consistency in learning, davening, and mitzvot because existing tools don't understand the Jewish calendar, chabura accountability, or the balance between keva and kavana.

---

## What Keva Does

- ✅ Habit tracking with streaks, scoped to categories that matter for frum life (learning, tefillah, chessed, personal growth)
- ✅ Shabbos-aware UI (a "Gut Shabbos" greeting on Friday/Saturday)
- ✅ Local-first — your data stays on your device, no account required
- 🔜 Full Jewish calendar integration (Yom Tov, fast days, learning cycles like Daf Yomi)
- 🔜 Claude-powered personalized habit suggestions and accountability messages
- 🔜 Chabura (accountability group) sharing

---

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Available scripts

| Script             | Description                          |
| ------------------ | ------------------------------------- |
| `npm run dev`       | Start the local dev server            |
| `npm run build`     | Type-check and build for production   |
| `npm run preview`   | Preview the production build locally  |
| `npm run lint`      | Run ESLint                            |
| `npm run typecheck` | Run the TypeScript compiler (no emit) |
| `npm run format`    | Format the codebase with Prettier     |

---

## Tech Stack

- **React 18** + **TypeScript** — UI and type safety
- **Vite** — dev server and build tooling
- **Tailwind CSS** — styling
- **localStorage** — persistence for the current local-first MVP
- **Netlify** — hosting/deploys (see `netlify.toml`)

---

## Project Structure

```
src/
  components/   Reusable UI pieces (HabitCard, HabitForm, Header, StreakBadge)
  pages/        Top-level views (Dashboard)
  hooks/        Stateful logic (useHabits)
  types/        Shared TypeScript types
  utils/        Pure helpers (date/calendar logic)
```

---

## Roadmap

- [x] Project scaffolding (React + TypeScript + Vite + Tailwind)
- [x] Basic habit CRUD with streak tracking
- [ ] Jewish calendar integration (Shabbos, Yom Tov, fast days)
- [ ] Reflections / journaling per habit
- [ ] Claude-powered personalized coaching
- [ ] Chabura (group accountability) features
- [ ] Persistent backend + sync across devices

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines. Please open an issue before starting on anything large, since this project is scoped intentionally around frum-life use cases.

---

## About

Built by [Yeshayahu Salzman](https://www.linkedin.com/in/yayosalzman9296). A practical project combining product thinking, cultural understanding, and AI tooling.

---

## License

[MIT](LICENSE)
