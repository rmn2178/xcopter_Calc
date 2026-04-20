# Security and Reliability

## Dependency Security
- Versions are pinned in `package.json`.
- Run `npm run audit:deps` regularly and on CI.
- Review changelogs before upgrading critical runtime dependencies.

## Supply Chain Controls
- Use `npm ci` in CI for deterministic installs.
- Keep `package-lock.json` committed and reviewed.
- Prefer exact versions for all runtime/dev dependencies.

## Observability
- Optional Sentry integration via `VITE_SENTRY_DSN`.
- Global capture for window errors and unhandled promise rejections.
- Error boundary captures UI crashes.

## Profile Backup and Recovery
- Profiles are stored in `localStorage` (`xcopter_profiles`).
- Automatic rolling backups are stored in `xcopter_profiles_backup`.
- Last backups can be restored from UI using `Recover latest backup`.
- Keep at most 20 backup snapshots.

## Recommended Operations
- Export critical profiles before major upgrades.
- Validate key setups after dependency updates.
- Use `npm run check:full` before release tags.
