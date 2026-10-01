# Agendify

**Local synthetic staff scheduling only.** The current Next.js + Supabase app supports a signed-in staff booking and cancellation flow for fictional appointments. Local unit, database, Auth/PostgREST, and authenticated Chrome checks have passed; this is neither production-ready nor approved for real patient data. The tracked Node/SQLite pilot files are retired in this work unit; the ignored local `agendify.sqlite` remains untouched and has not been migrated. See [deployment readiness](docs/deployment.md) for legal, region, privacy, and operational gates.

## Run the Next.js app locally

Requires Node.js 24+, Docker, and the Supabase CLI. Use only fictional identities and appointments. Do not paste CLI-generated credentials into issues, logs, or shared files.

1. At the repository root, start local Supabase Docker services: `supabase start`.
2. At the repository root, run `pnpm install --frozen-lockfile`. Set these names in ignored root `.env.local` with **local-only** values from your own Supabase CLI session (no credentials are provided here):

   ```text
   NEXT_PUBLIC_SUPABASE_URL=<local-project-url>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
   AGENDIFY_SYNTHETIC_ONLY=true
   ```

3. At the repository root, run `pnpm dev` and open the local Next.js URL shown by the command. Sign in with a **local test staff account**: authentication is required for the staff agenda. Use only synthetic fixture identities; do not use real patient or staff information. The synthetic gate must be exactly `true`; unset or other values fail closed. It is not a production enablement switch.

## Verify locally

From the repository root, with local Supabase running:

```sh
supabase test db
supabase db lint --local
```

From the repository root after `pnpm install --frozen-lockfile`:

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm test:integration:local
pnpm test:browser:local
```

The integration smoke tests local Auth/PostgREST, tenant denial, booking conflict, and cancellation. The browser smoke tests the authenticated Next.js book/cancel flow using installed Chrome; `AGENDIFY_CHROME_PATH` can point to an absolute local Chrome executable. Both require local Supabase and synthetic fixtures, reject non-loopback endpoints, and attempt scoped cleanup. Keep Supabase CLI output private; see [deployment readiness](docs/deployment.md) for cleanup cautions and check limitations. The observed independent checks passed 19/19 web unit tests and 59/59 database tests, plus local Auth/PostgREST and authenticated browser book/cancel smoke; rerun them in your environment rather than treating those results as release approval.

## Legacy pilot and boundaries

Next.js + Supabase is the primary staff workflow. The tracked Node/SQLite pilot files are retired in this work unit; the ignored local `agendify.sqlite` remains untouched and has not been migrated. The historical task record remains at `odd/tasks/agenda-pilot.md`; it is not an active setup guide. Do not use the retired pilot's unauthenticated API as a staff workflow. Neither implementation is authorized for real data, cloud deployment, or production. The synthetic-only usage rule cannot itself detect fictional versus real information. Legal basis, hosting region, privacy controls, security, operations, and independent signoff are outstanding: see [deployment readiness](docs/deployment.md).
