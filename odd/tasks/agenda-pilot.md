# Agenda pilot

## Objective
Build the first locally runnable Agendify scheduling pilot for synthetic patient data, following Brand Book v1.0. This is not a production clinical system.

## Problem and rationale
The repository is empty and the brand book defines visual identity and broad product intent, not scheduling rules. Establish one small vertical slice that can be exercised before attempting messaging, SaaS tenancy, or clinical workflows.

## Scope and constraints
- Single local organization, multiple sites and professionals; synthetic patients only.
- Create/list/cancel appointments with explicit date, time, site, professional, patient name, and service; prevent double booking of an active professional/time slot.
- Persist locally; no external API, WhatsApp, payments, clinical records, authentication, or production deployment.
- Brand palette #2563EB, #0EA5E9, #14B8A6, #08204F, #F0F7FE, #64748B; clear, human Spanish UI copy.
- Treat pilot assumptions as provisional: fixed-duration slots and local timezone; production security, consent, privacy, permissions, audit, multi-user concurrency, and jurisdiction remain future decisions.

## Tasks
- [x] T1 — Implement local scheduling API, seed synthetic sites/professionals, persistence, conflict validation, and focused tests. Acceptance: list/create/cancel work; invalid input and double booking fail predictably. Checks: four API/domain tests pass; syntax checks pass; independent verifier confirmed persisted SQLite and conflict handling. Status: done. Commit: f143eb920c42a8a7a6962dfdac052ba29b5202bb.
- [x] T2 — Build responsive agenda UI with brand tokens and creation/cancellation flow against API. Acceptance: desktop/mobile layout, day/site filter, booking/cancellation, and clear empty/error states. Checks: `npm test` 9/9, syntax and diff checks passed; independent verifier found startup timing issue, corrected with regression. Browser interaction smoke pending T3. Status: done. Commit: 9c77f746de7519874445f9f82cb817dfad204386.
- [ ] T3 — Document pilot setup, limitations, and end-to-end verification. Acceptance: clean checkout can run pilot and tests; no suggestion it is safe for real patient data. Checks: fresh install/run/build or equivalent. Status: in progress. Commit: pending.

## Progress and evidence
- 2026-09-30: User chose an operational agenda MVP, then synthetic-data pilot. Brand Book v1.0 reviewed; repository initially had no commits.
- 2026-09-30: T1 implemented and independently verified (`npm test`: 4/4; `node --check` passed). SQLite accepts arbitrary entered names; synthetic-only is an explicit usage boundary, not an enforced detector. No production use.
- 2026-09-30: T2 UI implemented and corrected after independent review (`npm test`: 9/9); responsive browser rendering and end-to-end smoke have not yet been checked. Its 423-line cohesive work-unit commit exceeds the usual 400-line review target by 23 lines; evaluate a review slice before PR delivery.

## Next step
Document startup and boundaries; run final end-to-end smoke and independent checks for T3.
