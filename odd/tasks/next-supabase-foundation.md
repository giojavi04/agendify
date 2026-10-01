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
- [x] N2 — Add Supabase versioned schema/membership/RLS and negative isolation tests with database-enforced booking conflict; use synthetic-only fixtures. Checks: `supabase test db` 33/33 and `supabase db lint --local` passed independently. Status: done. Commit: 667ed5e48b77d41037b2594eafbe933092b5e9b9.
- [x] N2a — Make a local Docker-compatible container runtime available for `supabase start` and database policy verification; do not reset an existing database. Checks: `docker info` reports daemon 29.8.1; `supabase status` initially reported no existing `supabase_db_agendify` container. Status: done. Commit: not applicable; environment prerequisite.
- [x] N3a — Resolve the first-release actor model. User selected authenticated clinic staff only; no patient portal or public signup in this increment. Status: done. Commit: not applicable; product decision.
- [x] N3b — Add Supabase SSR staff sign-in and a server-only organization-aware access boundary in Next.js; no self-signup or admin service key in app. Checks: 7/7 tests, typecheck and build passed independently; live signed-in smoke not run; `.env.example` unavailable under writer safety policy, so configuration guidance deferred to N4. Status: done for scoped auth boundary, not production-ready. Commit: 719d3702142b3596a5cdbc14d2300c791078595a.
- [x] N3c.1 — Add tenant-scoped patient references and appointment association through a new migration plus negative RLS tests using synthetic fixtures only. Checks: local migration applied, 43/43 pgTAP and db lint passed independently; populated-table migration guard untested. Status: done. Commit: a614cf25fd07d4b7e76b5674fd40f059b108cd3c.
- [x] N3c.2a — Implement server-only staff scheduling reads and validated create/cancel actions against org-scoped synthetic patients/assigned site-professional combinations with a synthetic-only gate. Checks: independent 15/15 web tests, typecheck/build and 59/59 DB policy tests; live signed-in integration not run. Status: done. Commits: be7b32e4cb13f8437692c7fa4fadbda8ddb0d074, 6b8a670532c3e9568190b3f26cae6cfc4a779f84, 5cade7557ec83566d05fa5972f6b94e10ecffbcb.
- [x] N3c.2b — Build authenticated staff booking interface using fixed fictional patients and explicit UTC labeling; no free-text patient fields. Checks: independent 19/19 web tests, typecheck/build, source readback; no browser or live signed-in test yet. Status: done for UI code; parity unproven. Commit: 536892a4e2a5eca9bc45992dd3cc9cfb05344245.
- [x] N3c.3a — Run local-only synthetic Auth/PostgREST staff booking/conflict/cancellation and outsider isolation smoke with ID-scoped fixture cleanup. Checks: independent smoke pass after fixing false-positive overlap risk; 19/19 web tests, 59/59 DB tests, build/typecheck. Status: done; Next browser flow not exercised. Commit: f643403f99342227f6cf487422730aa358ba221f.
- [x] N3c.3b — Retire tracked Node/SQLite pilot after authenticated Next browser parity; preserve ignored local DB without touching it. Nine exact legacy deletions committed; independent final web 19/19, DB 59/59, typecheck/build, local Auth/PostgREST and Chrome smokes, lint and diff checks pass. README/deployment updated. Status: done. Evidence commits: aa4fe1ee2faa6f51cdd70b82ef7dd9fd0986f645 (browser smoke), a00eb60d064ac56b7a6fcaa822cd9fba6bc1e6b4 (docs), f743a8158cd664ef11fb6b1f69a4a666cba889d0 (retirement).
- [x] N3c.3c — User executed the exact tracked legacy file removal because the delegated writer refuses deletion. Checks: nine staged deletions confirmed, ignored agendify.sqlite still exists, independent checks pass. Status: done; cleanup commit will close N3c.3b.
- [x] N4 — Add CI and separate environment configuration/templates, deployment/runbook and explicit real-data go-live gates; no production provisioning or compliance claim. Checks: independent 7/7 web tests, build/typecheck, 33/33 pgTAP, db lint, and diff checks pass; cloud CI, lint and hosted deployment not run/configured. Status: done for CI/runbook scope. Commit: 682b5654c6edd3a1f77b6124ad08363e724e46d3.

## Progress and evidence
- 2026-09-30: User approved replacing the pilot in this branch, Ecuador real-patient readiness, and technical infrastructure direction. Current repository still has the provisional pilot and an independently created untracked .codegraph/ directory; both remain untouched. Official sources: https://spdp.gob.ec/wp-content/uploads/2024/12/03.pdf.pdf ; https://spdp.gob.ec/wp-content/uploads/2026/01/04.01.01-SPSP-SPD-2026-0004-R-Norma-general-de-transferencias-signed.pdf ; https://supabase.com/docs/guides/platform/regions . Legal conclusions and cloud region not approved.

- 2026-09-30: N1 installed Next.js 16.3.8 and produced a static synthetic dashboard. Independent 2/2 tests, typecheck and build passed; no browser check. The lockfile is large but generated, not hand-written.
- 2026-09-30: N2 stopped before SQL writes because Docker daemon was unavailable. User chose Docker Desktop; `docker info` now reports 29.8.1, while `supabase status` reports no existing local project container. No database was reset.

- 2026-09-30: N2 local migration, RLS and 33 pgTAP assertions passed independently with lint clean. Existing model has no patient identity or clinic actor roles beyond organization membership; it does not yet support real-patient workflows.
- 2026-09-30: User chose staff-only scheduling for the first version; patient accounts and public booking are out of scope. Split N3 into auth boundary and booking parity to keep review units focused. Patient identity fields and role granularity remain future product decisions.

- 2026-09-30: N3b staff sign-in and RLS-backed membership boundary passed independent mock tests, typecheck and build. Missing env config redirects to login; no live authenticated session, cookie-refresh integration or real-patient check has been verified. Configuration template blocked by writer safety; do not expose local CLI keys.

- 2026-09-30: N4 local CI-equivalent checks passed independently and deployment gates documented. CI has not run on GitHub; no web lint, cloud resources or real-data deployment. Web docs use publishable-key env name matching code.

- 2026-09-30: N3c.1 patient reference migration and negative isolation assertions passed 43/43 locally and independently. Guard against pre-existing appointments was not exercised; production has not been provisioned. No clinic patient identifiers or contact fields chosen.

- 2026-09-30: N3c.2a hardened schema provenance and site/pro assignments, server-only booking gate and data actions. Independently 15/15 web tests, build/typecheck and 59/59 DB assertions pass. Live signed-in flow remains unverified, and direct authenticated DB writes are not constrained by the UI's fictional-label or office-hour validator.

- 2026-09-30: N3c.2b staff-only agenda UI uses fictional patient choices and explicit UTC. Independent 19/19 web tests, typecheck and build passed; no authenticated browser parity or responsive manual check. The provisional Node pilot is intentionally retained until parity is observed.

- 2026-09-30: N3c.3a independent local Auth/PostgREST smoke passed with nonoverlapping outsider denial (42501) and created-ID-only cleanup checks. It does not exercise the Next sign-in UI, Server Actions or browser rendering.

- 2026-09-30: Local authenticated Chrome book/cancel smoke passed independently with ID-scoped synthetic cleanup. Next dev-generated next-env.d.ts, AGENTS.md and CLAUDE.md are now ignored/local with explicit user approval (e467fa6). Worker safety blocked deletion of nine tracked legacy files despite user's selection to replace the pilot; no deletion attempted. README now presents Next as primary but accurately says legacy code remains.

- 2026-09-30: User removed all nine exact tracked Node pilot files. Parent confirmed ignored agendify.sqlite still exists. Independent verifier ran npm ci, 19/19 web tests, typecheck/build, Auth/PostgREST and Chrome smokes, 59/59 pgTAP, db lint, staged/unstaged diff checks; all passed. Production remains blocked.

- 2026-09-30: Cleanup commit f743a8158cd664ef11fb6b1f69a4a666cba889d0 removes nine tracked pilot files and leaves ignored agendify.sqlite untouched. The historical odd/tasks/agenda-pilot.md remains. The deletion is a cohesive 667-line removal, above the usual 400-line review target; review it as a distinct retirement work unit rather than combining it with other implementation diffs.

- 2026-09-30: Native review INSPECT and explicit committed-range START for the retirement work unit returned `empty_candidate_base_ref_required` on a clean worktree; no lineage or receipt was created. This is a pending review check, not approval. Untracked .codegraph/ was excluded from review scope and left untouched.

## Next step
Resolve the native committed-range base-ref selection before claiming a review receipt; independently obtain Ecuador legal/privacy, region and operational signoff before any real patient data or production rollout. Patient identity/contact, site timezone, audit and legal/region signoff remain future go-live decisions. Do not handle real data.
