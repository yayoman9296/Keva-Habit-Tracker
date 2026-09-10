# Keva — Habit Tracker for Frum Life

**Building better keva (consistency) with kavana (intention) for the Orthodox Jewish community.**

Keva is a habit tracking app designed specifically for frum Jews who want to build consistent routines in learning, tefillah, mitzvot, and personal growth — while staying grounded in Jewish values and calendar.

---

## Current Status (July 2026)

**Early development stage.**  
A basic functional version was built quickly using AI-assisted development. Currently exploring Claude-powered features to make the app more intelligent and personalized. Project is active but moving slowly while I focus on income and skill development.

---

## The Problem

Most habit tracking apps are built for general audiences and ignore the specific rhythms, values, and constraints of Orthodox Jewish life. People struggle to maintain consistency in learning, davening, and mitzvot because existing tools don’t understand the Jewish calendar, chabura accountability, or the balance between keva and kavana.

---

## What Keva Does

- Jewish calendar integration (Shabbos, Yom Tov, fast days, learning cycles)
- Habit categories tailored to frum life (learning, tefillah, chessed, personal growth, etc.)
- Simple streak tracking with meaningful reflections
- Future: Claude-powered personalized habit suggestions and accountability messages

---

## Why This Matters

Consistency (keva) is a core value in Jewish life, but modern tools often fail to support it in a culturally relevant way. Keva aims to close that gap by building technology that respects and understands the lifestyle it serves.

---

## Tech & AI Direction

- Built with AI-assisted development (Claude)
- Exploring Claude agents for personalized habit coaching
- Future focus on clean, simple UX that respects Shabbos and minimalism

---

## About

Built by [Yeshayahu Salzman](https://www.linkedin.com/in/yayosalzman9296). A practical project combining product thinking, cultural understanding, and AI tooling.

---

## License

MIT

---

## Setup

1. Copy env vars into a local `.env` (never commit this file):

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# Optional — production RevenueCat keys (dev/preview use the built-in test key)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=...
```

2. Install and typecheck:

```bash
npm install
npm run typecheck
npx expo start
```

## EAS Build

`eas.json` and `app.json` include EAS project id `51bff123-2ea6-4b8d-86f3-43b8b330a5c7`. Config plugins for notifications, location, and secure store are set for Expo SDK 56.

**One-time (interactive) — required on your machine:**

```bash
npm install -g eas-cli   # if needed
npx expo login           # or: eas login
eas whoami
```

**First builds:**

```bash
# Development client (internal)
npm run eas:build:development -- --platform ios
npm run eas:build:development -- --platform android

# Internal preview
npm run eas:build:preview -- --platform all

# Store production (auto-increments version)
npm run eas:build:production -- --platform all
```

On the first iOS/Android build, EAS will prompt interactively for Apple/Google credentials unless you already stored them with `eas credentials`. Do not put API keys or store secrets into git.

