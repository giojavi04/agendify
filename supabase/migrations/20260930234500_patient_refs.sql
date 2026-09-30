-- Existing appointments have no patient reference; require an empty table rather than inventing identities.
do $$
begin
  if exists (select 1 from public.appointments) then
    raise exception 'patient reference migration requires zero existing appointments; migrate existing records explicitly first';
  end if;
end
$$;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  display_label text not null check (length(trim(display_label)) > 0),
  unique (organization_id, id)
);

alter table public.patients enable row level security;
create policy member_read on public.patients for select to authenticated
  using (exists (select 1 from public.memberships m where m.organization_id = patients.organization_id and m.user_id = (select auth.uid())));
revoke all on public.patients from anon, authenticated;
grant select on public.patients to authenticated;

alter table public.appointments add column patient_id uuid not null;
alter table public.appointments add constraint appointments_patient_tenant_fk
  foreign key (organization_id, patient_id) references public.patients(organization_id, id);
create index on public.appointments (organization_id, patient_id);
grant insert (patient_id) on public.appointments to authenticated;
-- No patient write grant and no appointment patient_id update grant: provisioning remains privileged.
