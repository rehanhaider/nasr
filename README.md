# Nasr

Self-hosted two-track progress tracker for Raspberry Pi. TypeScript end-to-end.

Two modules in one app:

- **Daily** — 40-day practice cycle with checklist, streaks, adherence tracking, and journal
- **Pipeline** — 90-day opportunity tracker with follow-up discipline and outcome logging

Designed for LAN use. Zero external network calls at runtime.

## Quick Start (on the Pi)

### Prerequisites

- Raspberry Pi 4 or 5, running Raspberry Pi OS 64-bit (Bookworm)
- Network connectivity for initial setup only (package installation)

### Automated Install

```bash
git clone <your-repo-url> /opt/nasr
cd /opt/nasr
chmod +x install.sh
./install.sh
```

The installer:
1. Installs Node.js 22 and pnpm if missing
2. Installs dependencies
3. Runs database migrations
4. Prompts for your PIN (or reads `NASR_PIN` env var)
5. Builds the app
6. Installs and enables systemd services

Access the app at `http://<pi-ip>:8080`.

### Manual Setup

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Clone and install
cd /opt/nasr
pnpm install

# Run migrations
pnpm db:migrate

# Build
pnpm build

# Start
PORT=8080 HOST=0.0.0.0 pnpm start
```

## Build on Dev Machine, Deploy to Pi

If building on the Pi is slow, build on your dev machine and rsync:

```bash
# On dev machine
pnpm install
pnpm build

# Copy to Pi (exclude node_modules — reinstall on Pi for ARM64 native deps)
rsync -avz --exclude node_modules --exclude .git ./ pi@<pi-ip>:/opt/nasr/

# On the Pi
cd /opt/nasr
pnpm install --frozen-lockfile
pnpm db:migrate

# Install systemd units
sudo cp nasr.service /etc/systemd/system/
sudo cp nasr-backup.service /etc/systemd/system/
sudo cp nasr-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now nasr.service
sudo systemctl enable --now nasr-backup.timer
```

**Important:** `better-sqlite3` has native bindings. If you build on x86_64 and deploy to ARM64, you must run `pnpm install` on the Pi to get the correct prebuilds.

## Phone Access

Open `http://<pi-ip>:8080` in your phone browser. The app is mobile-first and all tap targets are sized for one-handed use.

A PWA manifest is included — on supported browsers, you can "Add to Home Screen" for an app-like experience.

## API

All data flows through a versioned JSON API at `/api/v1/*`. The web UI consumes this API exclusively.

### Authentication

PIN login returns a session token. The web client receives it as an httpOnly cookie. The API also accepts `Authorization: Bearer <token>` for programmatic access.

```bash
# Login
curl -X POST http://<pi-ip>:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'
# Response: {"token":"<hex-token>"}

# Use the token
curl http://<pi-ip>:8080/api/v1/settings \
  -H "Authorization: Bearer <token>"

# Check auth status
curl http://<pi-ip>:8080/api/v1/auth/status \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST http://<pi-ip>:8080/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with PIN |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/status` | Check auth |
| GET/PUT | `/api/v1/settings` | App settings |
| GET | `/api/v1/deen/days` | List day records |
| GET/PUT | `/api/v1/deen/day/:date` | Single day |
| GET/POST/DELETE | `/api/v1/deen/observations` | Observations |
| GET/POST | `/api/v1/deen/sadaqah` | Sadaqah log |
| GET/POST | `/api/v1/pipeline/opportunities` | Opportunities |
| GET/PUT/DELETE | `/api/v1/pipeline/opportunity/:id` | Single opportunity |
| GET/POST | `/api/v1/pipeline/touches` | Touch log |
| GET | `/api/v1/export` | Export data |

### Lockout

5 failed login attempts trigger a 10-minute lockout, persisted across restarts.

## Changing the PIN

Currently, update the PIN hash directly in SQLite:

```bash
cd /opt/nasr
node -e "
  const Database = require('better-sqlite3');
  const crypto = require('crypto');
  const db = new Database('./data/nasr.db');
  const pin = process.argv[1];
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(salt + ':' + hash, 'pin_hash');
  db.close();
  console.log('PIN updated.');
" "your-new-pin"
```

## Backup & Restore

The `nasr-backup.timer` runs nightly at 02:00, copying the SQLite file to `backups/` with 14-day retention.

**Manual backup:**
```bash
cp /opt/nasr/data/nasr.db /path/to/backup/nasr-$(date +%Y%m%d).db
```

**Restore:**
```bash
sudo systemctl stop nasr
cp /path/to/backup/nasr-YYYYMMDD.db /opt/nasr/data/nasr.db
rm -f /opt/nasr/data/nasr.db-wal /opt/nasr/data/nasr.db-shm
sudo systemctl start nasr
```

The `-wal` and `-shm` files must go with it — leaving a stale write-ahead log
next to a restored database will corrupt the restore.

## Reset

**Settings → Danger zone → Reset…**, then type `RESET` to confirm.

Clears every logged entry — deen days, opportunities, touches, observations,
sadaqah — and keeps your PIN and settings. Other sessions are revoked; the one
you reset from is kept, so you stay logged in.

A consistent backup (`VACUUM INTO`, so anything still in the `-wal` is
included) is written to `backups/pre-reset-<timestamp>.db` before a single row
is deleted, and the app shows you the path. Undoing a reset is a restore, and
that needs shell access:

```bash
sudo systemctl stop nasr
cp /opt/nasr/backups/pre-reset-<timestamp>.db /opt/nasr/data/nasr.db
rm -f /opt/nasr/data/nasr.db-wal /opt/nasr/data/nasr.db-shm
sudo systemctl start nasr
```

The same thing over the API:

```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"confirm":"RESET"}' \
  http://<pi-ip>:8080/api/v1/settings/reset
```

The `confirm` field is required — a stray POST cannot wipe the database.

There is deliberately no factory reset. Deleting the database would clear
`pin_hash`, and the login route treats a missing PIN as first-run setup: the
next PIN typed at the login screen would silently become the new one.

## Export

Visit `/export` in the app or use the API:

```bash
# Full JSON
curl -H "Authorization: Bearer <token>" \
  "http://<pi-ip>:8080/api/v1/export?format=json" -o nasr-export.json

# Deen CSV
curl -H "Authorization: Bearer <token>" \
  "http://<pi-ip>:8080/api/v1/export?format=csv&module=deen" -o deen.csv

# Pipeline CSV
curl -H "Authorization: Bearer <token>" \
  "http://<pi-ip>:8080/api/v1/export?format=csv&module=pipeline" -o pipeline.csv
```

## Development

```bash
pnpm install
pnpm dev          # Start dev server on :8080
pnpm test         # Run all tests
pnpm db:migrate   # Apply migrations
```

## Testing

```bash
pnpm test                         # All workspaces
pnpm --filter @nasr/shared test  # Shared domain logic
pnpm --filter @nasr/web test     # API-level tests
```

Tests cover:
- Cycle-day arithmetic and date handling
- Streak calculation (current and longest)
- Adherence % computation
- Ghosted eligibility (2 written outbound + 14 days rule)
- Auth (PIN hashing, token extraction, cookie/bearer)

## Project Structure

```
nasr/
├── packages/shared/       Pure TS domain logic + Zod schemas
│   ├── src/schemas/       Zod validation schemas
│   ├── src/domain/        Cycle, streaks, adherence, ghosted
│   └── tests/             Unit tests (vitest)
├── apps/web/              TanStack Start application
│   ├── src/db/            Drizzle ORM schema + migrations
│   ├── src/server/        Auth + service layer
│   ├── src/routes/        File-based routes (UI + API)
│   ├── src/data/          Client query/mutation hooks
│   └── migrations/        SQL migrations
├── nasr.service          systemd unit
├── nasr-backup.*         Backup service + timer
├── install.sh             One-shot installer
└── README.md
```

## Future: React Native (Expo) Mobile App

The architecture is designed for this:

1. **`packages/shared`** has zero React/Node-only imports. Add it as a dependency in your Expo project.

2. **`apps/web/src/data/`** contains the query-key factory, fetch functions, and TanStack Query hooks. These work identically in React Native — copy or symlink the directory.

3. **Auth:** Use `Authorization: Bearer <token>` instead of cookies. The login endpoint returns the token in the response body. Store it in secure storage (e.g., `expo-secure-store`).

4. **Base URL:** The fetch wrapper in `data/api.ts` uses relative URLs. For mobile, configure a base URL like `http://<pi-ip>:8080/api/v1`.

5. **CORS:** Not implemented yet — no CORS handling exists in the server. It will need to read `NASR_CORS_ORIGINS=http://<dev-machine>:8081` from the Pi's environment before the Expo dev client can talk to it.

## Stack

- Node.js 22, TypeScript strict
- TanStack Start (framework), Router, Query, Form, Table
- Drizzle ORM + better-sqlite3
- Tailwind CSS 4
- pnpm workspaces monorepo

## License

Private / personal use.
