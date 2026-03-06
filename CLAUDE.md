# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Server (runs on port 3000)
cd server && npm run migrate   # Run DB migrations + seed admin user
cd server && npm run dev       # Start server with nodemon (hot reload)

# Client (runs on port 5173, proxies /api to localhost:3000)
cd client && npm run dev

# Build frontend for production
cd client && npm run build
```

### Production
```bash
./scripts/setup.sh             # Install deps, migrate DB, build frontend (non-root)
sudo ./scripts/setup.sh        # Also installs/updates systemd service
```

### Server env
Copy `server/.env.example` to `server/.env`. Required variables: `PORT`, `NODE_ENV`, `DB_PATH`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

## Architecture

This is a single-server app: in production, Express serves both the API and the built Vue frontend from `client/dist`.

### Backend (`server/`)
- **Framework**: Express with better-sqlite3 (synchronous, no async needed in DB calls)
- **Auth**: JWT stored in `localStorage` on the client; sent as `Bearer` token; decoded in `middleware/auth.js` which sets `req.userId`, `req.userRole`, `req.mustChangePassword`
- **DB**: SQLite at `server/data/weights.db` (created by migrate script). WAL mode, foreign keys enabled.
- **Migrations**: Plain SQL files in `server/src/db/migrations/`, run in filename order by `migrate.js`. Migrations use `CREATE TABLE IF NOT EXISTS` so they are idempotent and all run every time.
- **Structure**: `routes/` wires URLs to `controllers/`; controllers import `db` directly and use prepared statements inline.

**Data model** (5 tables):
- `users` — username, bcrypt password hash, role (`admin`/`user`), `must_change_password` flag
- `exercises` — global exercise library (name, muscle group, description)
- `workouts` — per-user workout sessions (name, date, notes)
- `workout_exercises` — join between workout and exercise, with `sort_order`, `default_reps`, `default_weight`
- `sets` — individual sets under a workout_exercise (reps, weight)

**API route hierarchy**:
```
POST   /api/auth/login
POST   /api/auth/change-password
GET/POST/PUT/DELETE  /api/exercises
GET/POST/PUT/DELETE  /api/users          (admin only)
GET/POST/PUT/DELETE  /api/workouts/:id
POST/PUT/DELETE      /api/workouts/:id/exercises/:weId
POST/PUT/DELETE      /api/workouts/:id/exercises/:weId/sets/:setId
GET                  /api/reports/exercise/:exerciseId  (?metric=max_weight|volume&from=&to=)
```

### Frontend (`client/`)
- **Framework**: Vue 3 (Composition API) + Vite + Pinia + Vue Router + Tailwind CSS v3 + Chart.js (via vue-chartjs)
- **API layer**: `src/api/client.js` — single axios instance with `baseURL: '/api'`; a request interceptor attaches the JWT from `localStorage`. Each resource has its own module in `src/api/`.
- **Stores** (Pinia): `auth` (token, user, login/logout/changePassword), `exercises` (global list), `workouts` (list + current workout), `ui` (modal/alert state)
- **Router guards** (`src/router/index.js`): redirects unauthenticated users to `/login`; redirects users with `mustChangePassword` to `/settings/password`; blocks non-admins from `/settings/users`
- **Views**: `TrackingView` (workout list) → `WorkoutView` (workout detail with exercises and sets); `ReportsView` (exercise progress chart); `SettingsView` with child routes for exercises, users (admin), and password

## Workflow Preferences
- Commit after every code change with a descriptive message so changes can be reverted if needed.
