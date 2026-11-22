# Travel Tracker

Plan trips, track journeys and collect passport stamps from around the world.
A MERN app (MongoDB, Express, React, Node) written in TypeScript and built only on free services.

**Current stage:** Phase 1 — real accounts: sign-up, login, email verification, password reset,
profiles, onboarding quiz and an admin dashboard.

## Project structure

```
travel-tracker/
├── client/   React app (Vite, Tailwind CSS, React Router, Motion)
├── server/   Express API
├── shared/   Types and constants used by both
└── .github/  Automatic checks (CI) on GitHub
```

## What you need

- [Node.js](https://nodejs.org) 22.12 or newer (22 or 24 LTS)
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

# 3. Fill in server/.env — at least MONGODB_URI and JWT_ACCESS_SECRET.
#    Step-by-step help: SETUP.md

# 4. Start the API and the website together
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
| `npm run make-admin -- you@example.com` | Gives an account the admin role |

## Useful pages

- `/` Explore, `/trips`, `/map`, `/community`, `/me`: the five main tabs
- `/login`, `/signup`, `/forgot-password`: account screens
- `/onboarding`: the 3-question welcome quiz
- `/me/settings`: edit profile, photo, password, delete account
- `/admin`: dashboard for admins
- `/styleguide`: every colour and component, plus a live API connection check

## Design system

Colours live as CSS variables in `client/src/styles/index.css`, with a dark-mode set under `.dark`.
Use them as Tailwind classes: `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-primary`,
`bg-accent-soft`, `text-sun` and so on. Headings use Fraunces and body text uses DM Sans.

Components are in `client/src/components/ui` and are imported from one place:

```tsx
import { Button, Card, Stamp } from '@/components/ui';
```

## API (Phase 1)

Every request that changes data must send the header `X-TT-Client` (the React app does this).

| Method | Path | Who | What |
| --- | --- | --- | --- |
| GET | `/api/health` | anyone | API and database status |
| POST | `/api/auth/signup` | visitors | Create an account and log in |
| POST | `/api/auth/login` | visitors | Log in |
| POST | `/api/auth/refresh` | logged in | Renew the 15-minute access token |
| POST | `/api/auth/logout` | logged in | Log out this device |
| GET | `/api/auth/me` | logged in | The current user |
| POST | `/api/auth/verify-email` | anyone | Confirm an email with the emailed token |
| POST | `/api/auth/resend-verification` | logged in | Send a new confirmation email |
| POST | `/api/auth/forgot-password` | anyone | Email a reset link |
| POST | `/api/auth/reset-password` | anyone | Set a new password with the emailed token |
| PATCH | `/api/users/me` | logged in | Update profile |
| POST | `/api/users/me/onboarding` | logged in | Save the welcome-quiz answers |
| POST / DELETE | `/api/users/me/avatar` | logged in | Upload or remove a profile photo |
| POST | `/api/users/me/password` | logged in | Change password |
| DELETE | `/api/users/me` | logged in | Delete the account |
| GET | `/api/admin/stats` | admins | Dashboard numbers |
| GET | `/api/admin/users` | admins | Search and page through users |

## How login works

- Passwords are hashed with bcrypt; the plain password is never stored.
- Logging in sets two **httpOnly** cookies that page scripts cannot read: a 15-minute access
  token and a 30-day refresh token (stored in the database only as a hash).
- When the access token expires, the app quietly calls `/api/auth/refresh` and retries.
- Logging out, resetting a password or changing it ends sessions on the server.

## Deploying

See **DEPLOY.md** for free hosting on Render.
