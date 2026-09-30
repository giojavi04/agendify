-- Provenance is supplied only by privileged provisioning; existing patients remain non-synthetic.
alter table public.patients add column is_synthetic boolean not null default false;

-- Do not infer historical professional/site assignments from appointments.
do $$
begin
  if exists (select 1 from public.appointments) then
    raise exception 'assignment migration requires zero existing appointments; associate existing records explicitly first';
  end if;
end
$$;

create table public.professional_sites (
  organization_id uuid not null references public.organizations(id),
  site_id uuid not null,
  professional_id uuid not null,
  primary key (organization_id, site_id, professional_id),
  foreign key (organization_id, site_id) references public.sites(organization_id, id),
  foreign key (organization_id, professional_id) references public.professionals(organization_id, id)
);
create index on public.professional_sites (organization_id, professional_id);

alter table public.professional_sites enable row level security;
create policy member_read on public.professional_sites for select to authenticated
  using (exists (select 1 from public.memberships m
    where m.organization_id = professional_sites.organization_id and m.user_id = (select auth.uid())));
revoke all on public.professional_sites from anon, authenticated;
grant select on public.professional_sites to authenticated;

alter table public.appointments add constraint appointments_assigned_professional_site_fk
  foreign key (organization_id, site_id, professional_id)
  references public.professional_sites(organization_id, site_id, professional_id);
