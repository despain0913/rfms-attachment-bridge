# RFMS Attachment Bridge

A Windows desktop app (Electron + React) for downloading and uploading attachments
to jobs in the RFMS Cloud environment.

## What it does

- **View & Download** — enter a document number, pick the type (Order or Quote),
  and list its attachments. Preview images and PDFs inline, download one file, or
  download all to a folder.
- **Upload** — enter a document number + type, drag & drop (or browse) one or more
  files, and upload them to that order/quote. Optional description.

## Requirements

- Windows 10/11
- Node.js 18+ and npm (for building only — end users just run the installer)

## Setup

```bash
npm install
```

Then fill in the shared company RFMS credentials in
[`src/main/default-credentials.js`](src/main/default-credentials.js):

```js
export const DEFAULT_USERNAME = 'your-rfms-username'
export const DEFAULT_API_KEY = 'your-rfms-api-key'
export const DEFAULT_BASE_URL = 'https://api.rfms.online'
export const SETTINGS_PASSWORD = 'weber' // password to open the Settings screen
```

This file is gitignored — it's meant to be edited locally on the build machine, not
committed or shared. Every installer you build from this point on ships with these
credentials baked in, so end users never see a login screen or need to configure
anything.

`SETTINGS_PASSWORD` guards the Settings screen so users can't accidentally change
the store credentials or API key — they must enter it before Settings will open.
Set it to `''` to disable the prompt. The password is verified in the main process
and is never included in the renderer bundle.

## Run in development

```bash
npm run dev
```

## Build a Windows installer

```bash
npm run build:win
```

The installer is written to `dist/` as `RFMS Attachment Bridge-Setup-<version>.exe`.

## Versioning & releasing a new version

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`)
and keeps a [CHANGELOG.md](CHANGELOG.md). The version number lives in
[`package.json`](package.json) (`"version"`) and is what the installer, the app's
title bar, and the update check all report.

To cut a release:

1. Update `"version"` in `package.json` (e.g. `1.0.0` → `1.1.0`).
2. Add a section to `CHANGELOG.md` describing what changed.
3. Run `npm run build:win` — the installer is named with the new version.
4. Copy the new installer to your distribution location (network share / intranet).
5. Update the `latest.json` manifest there (see below) so existing installs are
   notified.

## Update check

On startup the app reads its own version and compares it to a small JSON manifest
you host. If the manifest's version is newer, users see a banner with a **Download**
button. This is **opt-in** and off by default.

To turn it on, set `UPDATE_MANIFEST_URL` in
[`src/main/update-config.js`](src/main/update-config.js) to either an HTTPS URL or a
network-share path pointing at a JSON file shaped like
[`latest.json.example`](latest.json.example):

```json
{
  "version": "1.1.0",
  "url": "\\\\fileserver\\apps\\RFMS Attachment Bridge\\RFMS Attachment Bridge-Setup-1.1.0.exe",
  "notes": "What changed in this release."
}
```

Host `latest.json` (and the installer it points to) at your distribution location.
Each release, bump the manifest's `version`, `url`, and `notes`. When `url` is an
HTTPS link the Download button opens it in the browser; when it's a file/UNC path
it reveals the installer in Explorer so the user can run it. A failed or unreachable
manifest is ignored silently — it never disrupts the app.

## Credentials

The app ships with the company's RFMS username/API key baked in via
`default-credentials.js` (see Setup above) — end users don't need to enter anything.

The Settings dialog (gear icon) still exists as an escape hatch, in case someone
ever needs to point a single install at a different RFMS account or environment.
Anything entered there is encrypted at rest on that PC using Windows account
protection (Electron `safeStorage` / DPAPI) and overrides the built-in defaults on
that machine only. Use **Test Connection** to verify credentials before saving.

If you rotate the API key, update `default-credentials.js` and rebuild/redistribute
the installer — there's no remote update mechanism.

## How it works (for maintainers)

- **`src/main/`** — Electron main process. Holds all RFMS API logic and secrets.
  - `store.js` — encrypted settings storage.
  - `rfms.js` — API client: session begin + auto-refresh, list / get / upload.
  - `index.js` — window creation, IPC handlers, native file dialogs.
- **`src/preload/index.js`** — safe `window.api` bridge (context isolation on).
- **`src/renderer/`** — React UI. Never sees the API key or session token.

The RFMS API authenticates via HTTP Basic Auth: username + API key to
`POST /v2/session/begin` returns a `sessionToken`, which is then used as the Basic
Auth *password* on all subsequent calls. The client caches the token and
re-authenticates automatically before it expires (or on a 401/403).
