# Travel Tracker

Plan trips, track journeys and collect passport stamps from around the world.
A MERN app (MongoDB, Express, React, Node) written in TypeScript and built only on free services.

**Current stage:** Phase 0 — project setup, design system and app shell.

## Project structure

```
travel-tracker/
├── client/   React app (Vite, Tailwind CSS, React Router, Motion)
├── server/   Express API
├── shared/   Types and constants used by both
└── .github/  Automatic checks (CI) on GitHub
```

## What you need

- [Node.js](https://nodejs.org) 20.19 or newer (22 LTS recommended)
- [Git](https://git-scm.com)
- [VS Code](https://code.visualstudio.com) (recommended)

## Getting started

```bash
# 1. Install everything (run in the travel-tracker folder)
npm install

# 2. Create the server's settings file
#    macOS / Linux:
cp server/.env.example server/.env
#    Windows (PowerShell):
copy server\.env.example server\.env

# 3. Start the API and the website together
npm run dev
```

Then open **http://localhost:5173**.
The API runs on http://localhost:4000. Check it at http://localhost:4000/api/health.

## Scripts (run from the travel-tracker folder)

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the client and the server with live reload |
| `npm run build` | Builds both for production |
| `npm start` | Runs the built server |
| `npm test` | Runs all tests |
| `npm run lint` | Checks code style and common mistakes |
| `npm run typecheck` | Checks TypeScript types |
| `npm run format` | Formats every file with Prettier |

## Useful pages

- `/` Explore, `/trips`, `/map`, `/community`, `/me`: the five main tabs
- `/login`, `/signup`: account screens (connected in Phase 1)
- `/styleguide`: every colour and component, plus a live API connection check

## Design system

Colours live as CSS variables in `client/src/styles/index.css`, with a dark-mode set under `.dark`.
Use them as Tailwind classes: `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-primary`,
`bg-accent-soft`, `text-sun` and so on. Headings use Fraunces and body text uses DM Sans.

Components are in `client/src/components/ui` and are imported from one place:

```tsx
import { Button, Card, Stamp } from '@/components/ui';
```
