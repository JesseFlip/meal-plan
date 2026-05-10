# Security & Privacy

This is family food data. The bar is: **what would Dorys want?**

## Hard rules

1. **No third-party analytics.** No Google Analytics, Segment, Mixpanel, Amplitude, PostHog, Plausible, Fathom — none. Not even self-hosted. We do not measure user behavior.
2. **No error reporting SaaS.** No Sentry, Rollbar, Bugsnag, Datadog RUM. Errors log to the server (Railway's built-in log stream is enough).
3. **No marketing pixels.** Ever.
4. **No social login.** No "Sign in with Google", no OAuth providers.
5. **No telemetry pings.** The PWA does not phone home for any reason except to its own API.
6. **No CDN-hosted fonts that track.** Google Fonts is acceptable (it's already a dependency for Caveat), but be aware it sets cookies. Self-host the font file in `web/public/fonts/` if a spec requests it.

## Soft rules (defaults; override only via spec)

- **No file uploads.** Phase 3+ might allow meal photos; until then, no upload endpoints.
- **No PII beyond names.** Don't ask for email, phone, address, birthdate, weight, etc. The data model has slot text and timestamps. That's it.
- **No location data.** The PWA does not request geolocation permissions.
- **No microphone, camera, or sensors** unless a spec for handwriting / voice input requires them. When introduced, ask permission at use time, not on app load.

## Auth (planned future state)

The MVP has no auth — security comes from private deployment (Tailscale or unguessable URL). When auth is introduced:

- **PIN-based**, household-shared. Not per-user passwords.
- Server-side rate limiting on PIN attempts.
- PIN stored as `bcrypt` hash in env var, not in the database.
- Session stored as `httpOnly` cookie, `SameSite=Lax`, `Secure` in production.

Do not introduce JWT, OAuth, magic links, or user accounts in the MVP.

## Data retention

- Plan data is kept indefinitely. There's no "delete my account" because there are no accounts.
- The owner may add a manual data export feature later via spec. Until then, the database file is the source of truth and is the user's data.

## Logging

- Log HTTP method, path, status, and latency on every request.
- **Do not log request bodies or response bodies by default.** They contain meal text which is user data.
- Log exceptions with stack traces — these go to stderr → Railway logs.
- No structured logging service. Plain text is fine.

## Secrets

- All secrets via environment variables.
- Never commit `.env`, `.env.local`, or any file with credentials.
- Use `.env.example` to document required variables (with placeholder values).
- Railway and Netlify both have built-in secret management; use it.

## When in doubt

Default to less data, less third-party code, less surface area. Adding tracking or external services later is easy. Removing them after they've collected data is hard.
