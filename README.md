# Agendify

**Synthetic data only.** The Node/SQLite scheduling pilot below is provisional and remains available until N3c delivers tested behavior parity. A separate Next.js/Supabase foundation is under development; neither is approved for real patient data or production use. See [deployment readiness](docs/deployment.md) for isolated local/dev/staging/prod configuration names, CI checks, managed deployment plan, and Ecuador legal and operational signoff gates.

Run a local scheduling pilot for **synthetic patients only**. It lets you view appointments by day and site, book a 30-minute slot with a professional, and cancel a booking. The interface follows the Agendify Brand Book v1.0.

## Run it

Requires Node.js 24 or newer. No package installation or external service is needed.

```sh
npm test
npm start
```

Open <http://127.0.0.1:3000>. The app seeds two fictional sites and one fictional professional per site. Choose a date and site, enter a **fictional** patient name and service, then confirm or cancel a turn. Appointments are saved to `agendify.sqlite` in the working directory (ignored by Git); restart the server to check persistence. Set `PORT` and `DB_PATH` to use another local port or database path, e.g. `PORT=3001 DB_PATH=demo.sqlite npm start`.

## Pilot rules

- One local organization with two seed sites and professionals. Slots are 30 minutes, from 08:00 through 17:30, in local wall-clock time; the last slot ends at 18:00.
- One **confirmed** appointment per professional, date, and time. Cancelling keeps a cancelled record and releases the slot for another booking.
- The API accepts nonempty names up to 120 characters after trimming; it cannot tell fictional names from real ones. **The synthetic-data-only boundary is a usage rule, not a technical guarantee. Never enter real names, medical details, or other patient information.** Any user of this machine who can access the local database may read it.
- This is not production software: no authentication, authorization, encryption, audit trail, consent management, medical privacy controls, multi-user workflow, WhatsApp, payments, clinical records, or hosted deployment. A production version needs explicit jurisdiction, privacy, access-control, backup, availability, concurrency, and integration decisions.

## API for local exploration

`GET /api/sites`, `GET /api/professionals?siteId=1`, and `GET /api/appointments?date=YYYY-MM-DD&siteId=1` return JSON. `POST /api/appointments` accepts `{ "siteId": 1, "professionalId": 1, "date": "2026-10-01", "time": "09:00", "patientName": "Demo Patient", "service": "Demo visit" }`. `PATCH /api/appointments/1/cancel` cancels that booking. Invalid input returns `400`, absent records `404`, and an occupied slot `409`. HTTP startup binds to `127.0.0.1` only.

## Verify and next step

`npm test` runs domain, HTTP, and UI-contract tests. Browser layout and interaction still need hands-on checks at desktop and mobile sizes; the tests do not prove clinical readiness. See [`odd/tasks/agenda-pilot.md`](odd/tasks/agenda-pilot.md) for work units, evidence, and deferred decisions.
