-- Go-live gate: authenticated booking and cancellation are restricted to synthetic patients.
-- Redesign these policies only after real-data approval and an explicit provisioning workflow.
-- The lookup reads patients (not appointments), avoiding appointment-policy recursion.
drop policy member_insert on public.appointments;
create policy member_insert on public.appointments for insert to authenticated
  with check (
    status = 'confirmed'
    and exists (select 1 from public.memberships m
      where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.patients p
      where p.id = appointments.patient_id
        and p.organization_id = appointments.organization_id
        and p.is_synthetic = true)
  );

drop policy member_cancel on public.appointments;
create policy member_cancel on public.appointments for update to authenticated
  using (
    status = 'confirmed'
    and exists (select 1 from public.memberships m
      where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.patients p
      where p.id = appointments.patient_id
        and p.organization_id = appointments.organization_id
        and p.is_synthetic = true)
  )
  with check (
    status = 'cancelled'
    and exists (select 1 from public.memberships m
      where m.organization_id = appointments.organization_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.patients p
      where p.id = appointments.patient_id
        and p.organization_id = appointments.organization_id
        and p.is_synthetic = true)
  );
