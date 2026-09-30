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
- [ ] T1 — Implement local scheduling API, seed synthetic sites/professionals, persistence, conflict validation, and focused tests. Acceptance: list/create/cancel work; invalid input and double booking fail predictably. Checks: automated API tests and syntax/runtime smoke. Status: in progress. Commit: pending.
- [ ] T2 — Build responsive agenda UI with brand tokens and creation/cancellation flow against API. Acceptance: desktop/mobile users can view by day and site and book/cancel using fake names; empty/error states clear. Checks: focused UI checks and manual HTTP/browser smoke as available. Status: pending. Commit: pending.
- [ ] T3 — Document pilot setup, limitations, and end-to-end verification. Acceptance: clean checkout can run pilot and tests; no suggestion it is safe for real patient data. Checks: fresh install/run/build or equivalent. Status: pending. Commit: pending.

## Progress and evidence
- 2026-09-30: User chose an operational agenda MVP, then synthetic-data pilot. No source implementation yet. Brand Book v1.0 reviewed; repository initially has no commits.

## Next step
Implement T1 in a bounded writer; verify and close its work unit before T2.
