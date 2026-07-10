# Changelog

All notable changes to RFMS Attachment Bridge are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR** — incompatible or big workflow changes
- **MINOR** — new features, backwards compatible
- **PATCH** — bug fixes and small tweaks

## [Unreleased]

## [1.0.1] - 2026-07-10

### Changed
- Installer now installs machine-wide (Program Files, all users) instead of
  per-user. Required so the app can be silently deployed/updated by an RMM
  tool running as SYSTEM — a per-user install run as SYSTEM would land in
  SYSTEM's own profile instead of the actual user's.

### Added
- `scripts/tacticalrmm-deploy.ps1` — silent install/update script for
  TacticalRMM (or any script-based RMM), driven by the same `latest.json`
  manifest used for the in-app update check.

## [1.0.0] - 2026-07-10

### Added
- View & Download tab: look up an Order or Quote by number, list its
  attachments, preview images/PDFs inline, download one file or download all.
- Upload tab: drag & drop (or browse) one or more files onto an Order or Quote,
  with an optional description.
- Order/Quote number validation on upload (`CG######` for Orders,
  `ES######` for Quotes).
- Company-wide RFMS credentials baked into the build so users never log in.
- Password-protected Settings screen to prevent accidental credential changes.
- In-app update check that notifies users when a newer version is available.
- Branded Windows installer (NSIS) with app icon and desktop/Start Menu shortcuts.
