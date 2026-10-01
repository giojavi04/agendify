# Deployment readiness (synthetic data only)

**Do not enter real patient data or provision production until the legal, region, privacy, security, and operational gates below are signed off.** This is a deployment plan, not a compliance claim. The Next.js/Supabase synthetic staff flow has passed independent 19/19 unit and 59/59 database tests, local Auth/PostgREST, and authenticated Chrome book/cancel smoke. These local results do not authorize production or real data. The nine tracked Node/SQLite pilot files are retired in this work unit; Next.js + Supabase is the primary staff flow. The old local `agendify.sqlite` is not tracked, required, or migrated; the historical `odd/tasks/agenda-pilot.md` remains. Neither local checks nor pilot retirement authorize public exposure.

## Local development

Tailwind CSS v4 uses the root PostCSS plugin and theme/utility imports in `app/globals.css`; Preflight is intentionally omitted to preserve existing demo styles and browser defaults.

Use Node.js 24, Docker, and the Supabase CLI. At the repository root, run `pnpm install --frozen-lockfile` and `supabase start`, then run `pnpm dev` there. Use fictional people and appointments only. Keep local configuration in ignored files, never in Git, CI logs, screenshots, or shared fixtures. `supabase start` prints local generated credentials: keep its output private and never paste it into issues or logs. Avoid `supabase status` when recording verification output; CI suppresses start output. Do not reset a populated local database.

Set these names in an ignored root `.env.local` using **local-only** values from your own CLI session (placeholders here are not credentials):

```text
NEXT_PUBLIC_SUPABASE_URL=<local-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
AGENDIFY_SYNTHETIC_ONLY=true
```

`AGENDIFY_SYNTHETIC_ONLY` must be `true` for local synthetic-only scheduling; unset or any other value fails closed. This is not a production enablement switch. The staff agenda uses fictional patient labels and UTC slots 08:00–17:30; timezone-by-site and real patient accounts are deferred. No real patient data is permitted.

For a live, local-only synthetic Auth/PostgREST check, start the local stack at repository root, then run `pnpm test:integration:local` at the repository root. The script captures `supabase status --output env` privately, rejects non-loopback API or database endpoints, provisions uniquely tagged fictional fixtures, and removes only its created IDs. Do not redirect or share Supabase CLI credential output. If cleanup fails, remove the reported synthetic IDs manually in the same local stack before rerunning. This exercises local Auth, tenant denial, booking conflict, and cancellation, **not** the Next authenticated browser flow, cloud environments, or production readiness.

For an automated local authenticated Next browser check, run `pnpm test:browser:local` at the repository root after starting the local Supabase stack. This uses installed Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; override with an absolute local executable via `AGENDIFY_CHROME_PATH`), headless isolated browser context, a temporary local Next dev child, and uniquely scoped synthetic fixtures. It rejects non-loopback Supabase endpoints and external browser requests, and attempts ID-scoped cleanup even on failure. Keep CLI output private; if cleanup fails, inspect the local synthetic fixtures before rerunning. This does not prove cloud behavior, production readiness, or legal compliance.

Never place a service-role key in `NEXT_PUBLIC_*` or browser code. Keep server secrets out of client bundles. Local SQL migrations and pgTAP fixtures must remain synthetic.

## Isolated environments and promotion

| Environment | Purpose | Boundary |
| --- | --- | --- |
| Local | Synthetic development and database policy tests | Local Docker project and ignored local configuration |
| Development | Future integration testing | Separate managed Next deployment and Supabase project, synthetic data only |
| Staging | Future release rehearsal | Separate managed deployments, credentials, access, and data; synthetic data only |
| Production | Not provisioned or authorized | Blocked until formal signoff and restore/security rehearsal |

For each future environment, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in that environment's managed Next settings, not repository files. Scope deployment credentials and Supabase project access separately by environment. Apply reviewed versioned migrations to the corresponding project only after backup and change approval; verify tenant-denial, conflict, and cancellation tests before promotion. CI runs only on ephemeral local services and **never deploys**. No production credentials belong in CI. Local Auth/PostgREST and browser smoke are separate checks, not evidence of cloud behavior or legal approval.

## Go-live decision gates

- [ ] Ecuador LOPDP and SPDP counsel/owner assessment covers health-data legal basis, notices, rights, transfers, contracts and processor/subprocessor terms, residency and cross-border safeguards. Document approval of the actual Supabase and Next hosting regions. Supabase São Paulo (`sa-east-1`) is a **candidate**, not legally approved.
- [ ] Confirm N3c staff-only behavior parity, authenticated tenant isolation, negative RLS tests, auditability, and live signed-in flow against release criteria. Local synthetic tests and smoke have passed, but do not establish deployment readiness. The tracked Node/SQLite pilot is retired in this work unit; verify the removal before any public exposure.
- [ ] Access uses least privilege, separate accounts and MFA for cloud/admin users; review access regularly, rotate and revoke credentials, and audit privileged actions without logging health data.
- [ ] Define retention/deletion schedules and subject-rights workflow; minimize collected fields and prevent real patient data in logs, analytics, fixtures, and support tickets.
- [ ] Define encrypted backup frequency and retention, off-site protection, recovery objectives, and a tested restore into an isolated environment; never rehearse against production data without authorization.
- [ ] Assign incident owner, detection/escalation, containment, breach notification and regulatory timelines; rehearse response and record evidence.
- [ ] Independent legal, privacy, security, and operational owners sign off before any real patient data, production provisioning, or public launch.

## CI-equivalent checks

At repository root, after the local runtime is available: `supabase start`, `supabase test db`, `supabase db lint --local`. At the repository root: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`. CI does not exercise a live cloud deployment, backup restore, regional/legal approval, or authenticated browser smoke testing. Lint for web is not configured yet; add a compatible ESLint/Next toolchain in a separately authorized dependency update rather than silently changing the application.
