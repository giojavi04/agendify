# Deployment readiness (synthetic data only)

**Do not enter real patient data or provision production until the legal, security, and operational gates below are signed off.** This is a deployment plan, not a compliance claim. The existing Node/SQLite pilot remains provisional until N3c reaches tested booking/cancellation parity; do not retire or expose it publicly.

## Local development

Use Node.js 24, Docker, and the Supabase CLI. In `apps/web`, run `npm ci`; at repository root run `supabase start`, then in `apps/web` run `npm run dev`. Use fictional people and appointments only. Keep local configuration in ignored files, never in Git, CI logs, screenshots, or shared fixtures. `supabase start` prints local generated credentials: keep its output private and never paste it into issues or logs. Avoid `supabase status` when recording verification output; CI suppresses start output. Do not reset a populated local database.

Set these names in an ignored `apps/web/.env.local` using **local-only** values from your own CLI session (placeholders here are not credentials):

```text
NEXT_PUBLIC_SUPABASE_URL=<local-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

Never place a service-role key in `NEXT_PUBLIC_*` or browser code. Keep server secrets out of client bundles. Local SQL migrations and pgTAP fixtures must remain synthetic.

## Isolated environments and promotion

| Environment | Purpose | Boundary |
| --- | --- | --- |
| Local | Synthetic development and database policy tests | Local Docker project and ignored local configuration |
| Development | Future integration testing | Separate managed Next deployment and Supabase project, synthetic data only |
| Staging | Future release rehearsal | Separate managed deployments, credentials, access, and data; synthetic data only |
| Production | Not provisioned or authorized | Blocked until formal signoff and restore/security rehearsal |

For each future environment, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in that environment's managed Next settings, not repository files. Scope deployment credentials and Supabase project access separately by environment. Apply reviewed versioned migrations to the corresponding project only after backup and change approval; verify tenant-denial, conflict, and cancellation tests before promotion. CI runs only on ephemeral local services and **never deploys**. No production credentials belong in CI.

## Go-live decision gates

- [ ] Ecuador LOPDP and SPDP counsel/owner assessment covers health-data legal basis, notices, rights, transfers, contracts and processor/subprocessor terms, residency and cross-border safeguards. Document approval of the actual Supabase and Next hosting regions. Supabase São Paulo (`sa-east-1`) is a **candidate**, not legally approved.
- [ ] N3c staff-only behavior parity, authenticated tenant isolation, negative RLS tests, auditability, and live signed-in flow are verified. Remove or restrict provisional pilot only after parity.
- [ ] Access uses least privilege, separate accounts and MFA for cloud/admin users; review access regularly, rotate and revoke credentials, and audit privileged actions without logging health data.
- [ ] Define retention/deletion schedules and subject-rights workflow; minimize collected fields and prevent real patient data in logs, analytics, fixtures, and support tickets.
- [ ] Define encrypted backup frequency and retention, off-site protection, recovery objectives, and a tested restore into an isolated environment; never rehearse against production data without authorization.
- [ ] Assign incident owner, detection/escalation, containment, breach notification and regulatory timelines; rehearse response and record evidence.
- [ ] Independent legal, privacy, security, and operational owners sign off before any real patient data, production provisioning, or public launch.

## CI-equivalent checks

At repository root, after the local runtime is available: `supabase start`, `supabase test db`, `supabase db lint --local`. In `apps/web`: `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run build`. CI does not exercise a live cloud deployment, backup restore, regional/legal approval, or authenticated browser smoke testing. Lint for web is not configured yet; add a compatible ESLint/Next toolchain in a separately authorized dependency update rather than silently changing the application.
