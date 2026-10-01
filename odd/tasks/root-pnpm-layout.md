# Root Next.js application and pnpm

## Objective
Move the tracked Next.js app from `apps/web/` to the repository root and make pnpm the sole documented, locked and CI-tested JavaScript package manager. Keep Supabase at root and preserve existing synthetic-only boundaries.

## Scope and constraints
- Relocate tracked app source, tests, scripts and Next configuration without changing booking/auth behavior. Update smoke-script root resolution, root ignores, and active setup references.
- Replace npm's package lock with a root pnpm lock and pinned pnpm version; update CI and current docs to install and run from root. Do not change runtime dependency versions intentionally.
- Preserve `agendify.sqlite` and historical `odd/tasks/agenda-pilot.md`. Do not move local secrets or generated output. The user subsequently authorized removal of the obsolete local `apps/web/` generated artifacts and `.codegraph/` after exact-path inspection; source writers must not touch them. No ignored app env file was present during exploration.
- Only fictional local fixtures. No cloud deployment, real patient data, production provisioning or claim of Ecuador compliance.

## Tasks
- [ ] R1 — Relocate tracked Next app/config/tests/scripts to root; merge root ignore rules; repair local smoke cwd assumptions and active setup/CI root references so the intermediate npm-layout commit remains runnable. Checks: root npm ci, 19 web tests, typecheck, build, local Auth/PostgREST and authenticated Chrome smoke, database 59 tests/lint, diff check, path inspection. Status: root npm layout implemented and independently verified; 28 tracked moves, merged ignores, fixed smoke cwd, root CI/docs. Generated old files remain untracked pending separately approved cleanup; do not stage them. Checks: npm ci, 19/19 tests, typecheck/build, both local synthetic smokes, 59/59 pgTAP, db lint and diff checks passed. Commit: pending.
- [ ] R2 — Convert root package/lock/CI/current docs from npm to pinned pnpm without dependency upgrades, then verify a frozen pnpm install and full local synthetic checks. Checks: pnpm install --frozen-lockfile, web tests/typecheck/build, both smokes, pgTAP/lint, diff/lock consistency; inspect no active npm or apps/web references. Status: pending; commit: pending.
- [ ] R3 — Remove only the user-selected obsolete local generated files under `apps/web/` and `.codegraph/` index, not project or database files. Checks: exact path/type readback before action, Git-tracked intersection empty, ignored SQLite retained, `git status` contains no unintended untracked files. Status: pending; local cleanup is not a Git work unit and needs no commit.

## Acceptance
At root, `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test:integration:local` and `pnpm test:browser:local` pass; `supabase test db` and `supabase db lint --local` pass. CI installs pnpm from the pinned version and uses root `pnpm-lock.yaml`. Active docs use root paths and pnpm. Ignored DB remains unchanged; only user-selected obsolete generated `apps/web/` files and `.codegraph/` are removed. Historical task evidence is not rewritten.

## Progress
- 2026-09-30: Mapped tracked tree, active docs, CI, root/path assumptions and local ignored state. No product decision outstanding. pnpm 12.8.1 is locally available; official pnpm docs describe `pnpm import`, pinned `packageManager` and frozen lockfile behavior. A file-heavy relocation and lockfile change impose review workload: keep the move and package-manager conversion as separate work-unit commits.

- 2026-09-30: R1 writer returned `interaction_required` before edits: its safety policy prohibits Git rename and deletion. Delegation trigger prevents inline parent execution; user may run exact tracked Git moves and remove the obsolete app-local ignore file, then the bounded writer can repair imports/paths/docs and verification can resume. No changes were made to application code by the worker.

- 2026-09-30: User's first directory Git move and ignore deletion succeeded. The second pasted command broke at a newline: Git treated apps/web/package.json as a directory destination and refused, then zsh tried to execute apps/web/package-lock.json (permission denied). This was not a file-permissions incident. User then ran all five remaining exact Git moves; parent confirmed 28 staged renames, one staged ignore deletion and no other tracked changes.
- 2026-09-30: User selected removal of both obsolete generated files under apps/web/ and the local .codegraph/ index. agendify.sqlite and this feature document are expressly excluded. Writer cannot delete, so cleanup must use a separately confirmed exact-path maintenance action; it is not part of source relocation.
- 2026-09-30: R1 writer repaired root ignore/CI/docs and smoke-script relative roots without altering auth/booking. Independent verifier ran npm ci, 19/19 tests, tsc/build, local Auth/PostgREST and authenticated Chrome smokes, 59/59 pgTAP, database lint and staged/unstaged diff checks; all passed. No hosted or real-data checks.

## Next step
Commit verified R1 root npm intermediate, record its hash and sync task state; then convert to pnpm (R2). Execute explicitly scoped generated/index cleanup (R3) separately without touching SQLite or tracked paths.
