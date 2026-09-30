-- Appointment instants are UTC timestamptz; clients choose and display their own timezone.
create extension if not exists btree_gist with schema extensions;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0)
);
create table public.memberships (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  primary key (organization_id, user_id)
);
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  unique (organization_id, id)
);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  unique (organization_id, id)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  site_id uuid not null,
  professional_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  check (ends_at > starts_at),
  foreign key (organization_id, site_id) references public.sites(organization_id, id),
  foreign key (organization_id, professional_id) references public.professionals(organization_id, id),
  constraint no_confirmed_professional_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed')
);

create index on public.memberships (user_id, organization_id);
create index on public.appointments (organization_id);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.sites enable row level security;
alter table public.professionals enable row level security;
alter table public.appointments enable row level security;

create policy member_read on public.organizations for select to authenticated
  using (exists (select 1 from public.memberships m where m.organization_id = id and m.user_id = (select auth.uid())));
create policy member_read on public.memberships for select to authenticated
  using (user_id = (select auth.uid()));
create policy member_read on public.sites for select to authenticated
  using (exists (select 1 from public.memberships m where m.organization_id = sites.organization_id and m.user_id = (select auth.uid())));
create policy member_read on public.professionals for select to authenticated
  using (exists (select 1 from public.memberships m where m.organization_id = professionals.organization_id and m.user_id = (select auth.uid())));
create policy member_read on public.appointments for select to authenticated
  using (exists (select 1 from public.memberships m where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid())));
create policy member_insert on public.appointments for insert to authenticated
  with check (status = 'confirmed' and exists (select 1 from public.memberships m where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid())));
create policy member_cancel on public.appointments for update to authenticated
  using (status = 'confirmed' and exists (select 1 from public.memberships m where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid())))
  with check (status = 'cancelled' and exists (select 1 from public.memberships m where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid())));

-- Column-level grants prevent changing tenant identity or appointment timing during cancellation.
revoke all on public.organizations, public.memberships, public.sites, public.professionals, public.appointments from anon, authenticated;
grant select on public.organizations, public.memberships, public.sites, public.professionals, public.appointments to authenticated;
grant insert (organization_id, site_id, professional_id, starts_at, ends_at) on public.appointments to authenticated;
grant update (status) on public.appointments to authenticated;
