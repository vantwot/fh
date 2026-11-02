# AGENTS.md

## Stack & layout
- Frontend: React 19 + Vite 8 + React Router 7 (`src/`), dev server on port **5173**.
- Backend: Express 4 on port **3001** (`server/`), SQLite via **Bun** (`bun:sqlite`), scheduled email reports (`node-schedule` + `nodemailer`), PDFs (`pdfkit`/`jspdf`).
- One SQLite DB at `server/database.sqlite` (path is `__dirname`-relative, not cwd).

## Run (non-obvious)
- Backend **must run with Bun, not Node**: `server/db.js` starts with `require('bun:sqlite')`, so `node index.js` fails.
  - `cd server && bun index.js`
- Frontend: `npm run dev` (Vite, port 5173). Dev API base is hardcoded to `http://localhost:3001/api` in `src/utils/api.js` unless `VITE_API_URL` is set.
- Login is `POST /api/login`; seeded users `admin` / `fh2026` and `mariana` / `fh2026` (plaintext passwords in `users`).

## Fingerprint subsystem (high-risk, easy to break)
- Reader: DigitalPersona U.are.U (USB). Windows helper: `server/fingerprint/bin/dpuareu.exe`.
- **The helper must be compiled x86 (32-bit).** The DigitalPersona One Touch SDK is 32-bit; an x64 build enumerates the reader (`available` OK) but never emits samples (`OnFingerTouch`/`OnComplete` never fire).
- Rebuild helper: `powershell -ExecutionPolicy Bypass -File server/fingerprint/build-helper.ps1`. Requires the SDK at `C:\Program Files\DigitalPersona\One Touch SDK\.NET\Bin`. Commands/protocol are in `server/fingerprint/README.md`.
- `server/fingerprint.js` spawns the helper and parses JSON from **stdout**; helper logs go to **stderr**. Keep stdout JSON-only for every command except `auto-identify` (NDJSON phases).
- Templates are SDK-native base64 stored as BLOB in `Affiliates.FingerPrint` and `employees.fingerprint`. `toFmdBase64` in `server/index.js` accepts any binary template; do not re-add the old `FMR`/`FIR` header check (it rejects templates produced by this SDK).
- Endpoints: `POST /api/fingerprint/scan` (enroll, 4 samples), `POST /api/fingerprint/identify`, `GET /api/fingerprint/auto-identify` (NDJSON stream), `/status`, `/wait`, `/available`.
- `src/components/FingerprintReader.jsx` polls `auto-identify` continuously. Keep its main effect dependency list empty and pass the callback through a ref to avoid restarting the loop on every render.

## Database gotchas
- `server/index.js` queries **`Affiliates`** (capital A), not `members`. `server/db.js` creates `Affiliates`; do not switch back to the old `members` schema.
- `server/db.js` runs destructive migrations at startup (drops/recreates tables inside try/catch). Back up `server/database.sqlite` before schema changes.
- Known non-fatal warning at startup: `membership_payments` migration (13 vs 15 columns) leaves a `membership_payments_backup` table; the server still runs.

## Build / packaging
- Root: `npm run build` (Vite), `npm run build:win` / `build:linux` (Vite build + `bun build --compile` in `server/`).
- Compiled `fh.exe` serves `server/public/` and opens `http://localhost:3001`.
- `server/config.js` loads `.env` from the process cwd, then falls back to hardcoded email credentials. Do not commit new real secrets.

## Conventions / checks
- Lint: `npm run lint` (ESLint). No test suite is configured.
- UI text and most identifiers are Spanish; keep new user-facing strings in Spanish.
