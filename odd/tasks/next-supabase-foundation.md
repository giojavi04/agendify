# Next.js and Supabase foundation

## Objective
Replace the provisional Node/SQLite pilot in this branch with a scalable, maintainable Next.js + Supabase foundation for Ecuador. Prepare technical controls for eventual real-patient use without claiming compliance or accepting real patient data before a separate go-live decision.

## Problem and rationale
The pilot has no authentication, tenant isolation, or operational controls. The user selected Next.js, Supabase, clean code, and separated development/staging/production, versioned migrations, CI tests of logic and permissions, and managed deployment. A production-region choice and real-data launch require legal and operational review under Ecuador's LOPDP and SPDP rules; Supabase São Paulo is a candidate, not an approved conclusion.

## Scope and constraints
- One modular TypeScript application with Next.js App Router and server-only data access, backed by Supabase Auth/Postgres and SQL row-level security. Do not expose service-role credentials to the browser or equate UI filtering with authorization.
- Org/site/professional/appointment domain and conflict prevention at the database layer; preserve tested synthetic booking/cancellation behavior while assumptions (slot length, timezone, roles) remain provisional.
- Explicit local synthetic development mode only until auth, RLS, isolated environments, privacy and security controls are verified. No real personal or health data in fixtures, commits, logs, CI, or cloud projects.
- Separate dev/staging/prod configurations, reproducible SQL migrations, tests of negative tenant access, CI, and documented deployment prerequisites. Do not provision cloud resources or turn on production without approved jurisdiction/processor/region assessment and credentials.
- Preserve ignored agendify.sqlite and unexpected untracked .codegraph/ intact; do not stage or delete them. Keep the existing pilot's task record as historical evidence.

## Tasks
- [x] N1 — Introduce a runnable Next.js/TypeScript branded synthetic-data shell and independent tests; keep existing pilot functional until migrated. Checks: install, 2/2 tests, TypeScript, Next.js build passed independently; lint not configured; browser check pending. Status: done. Commit: d46427d9d6c17a6835689624769b3a62eef953b8.
- [ ] N2 — Add Supabase versioned schema/membership/RLS and negative isolation tests with database-enforced booking conflict; use synthetic-only fixtures. Checks: local SQL migration and policy tests. Status: blocked pending N2a; no migration written. Commit: pending.
- [ ] N2a — Make a local Docker-compatible container runtime available for `supabase start` and database policy verification; do not reset an existing database. Checks: `docker info` and `supabase status` against the intended local project. Status: in progress (user action required). Commit: not applicable; environment prerequisite.
- [ ] N3 — Add server-only authenticated data layer and booking flows in Next.js, then retire tracked Node/SQLite pilot only after behavior parity and focused verification. Checks: valid/invalid booking, cancellation, tenant-denial, authenticated UI route tests. Status: pending. Commit: pending.
- [ ] N4 — Add CI and separate environment configuration/templates, deployment/runbook and explicit real-data go-live gates; no production provisioning or compliance claim. Checks: CI-equivalent local commands, secrets scan, docs review. Status: pending. Commit: pending.

## Progress and evidence
- 2026-09-30: User approved replacing the pilot in this branch, Ecuador real-patient readiness, and technical infrastructure direction. Current repository still has the provisional pilot and an independently created untracked .codegraph/ directory; both remain untouched. Official sources: https://spdp.gob.ec/wp-content/uploads/2024/12/03.pdf.pdf ; https://spdp.gob.ec/wp-content/uploads/2026/01/04.01.01-SPSP-SPD-2026-0004-R-Norma-general-de-transferencias-signed.pdf ; https://supabase.com/docs/guides/platform/regions . Legal conclusions and cloud region not approved.

- 2026-09-30: N1 installed Next.js 16.3.8 and produced a static synthetic dashboard. Independent 2/2 tests, typecheck and build passed; no browser check. The lockfile is large but generated, not hand-written.
- 2026-09-30: N2 stopped before SQL writes: Supabase CLI 2.119.0 is installed, but `docker info` and `supabase status` cannot reach `/Users/jmontalvo/.docker/run/docker.sock`. No local policy test can run until a Docker-compatible daemon is available; no database was reset.

## Next step
Resolve N2a with the user's preferred Docker-compatible runtime, then implement and verify N2. Do not handle real data.
