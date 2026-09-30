begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- Synthetic Auth identities; all fixture rows roll back.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member1@example.invalid', '', now(), now()),
 ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member2@example.invalid', '', now(), now()),
 ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@example.invalid', '', now(), now());
insert into public.organizations (id, name) values
 ('10000000-0000-4000-8000-000000000001', 'Synthetic A'),
 ('10000000-0000-4000-8000-000000000002', 'Synthetic B');
insert into public.memberships values
 ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
insert into public.sites values
 ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'A'),
 ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'B');
insert into public.professionals values
 ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'A'),
 ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'B');
insert into public.appointments (id, organization_id, site_id, professional_id, starts_at, ends_at) values
 ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '2030-01-01 10:00+00', '2030-01-01 11:00+00');

set local role anon;
select throws_ok($$select * from public.organizations$$, '42501', 'permission denied for table organizations', 'anonymous cannot read organizations');
select throws_ok($$select * from public.sites$$, '42501', 'permission denied for table sites', 'anonymous cannot read sites');
select throws_ok($$select * from public.appointments$$, '42501', 'permission denied for table appointments', 'anonymous cannot read appointments');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2030-01-02 10:00+00', '2030-01-02 11:00+00')$$, '42501', 'permission denied for table appointments', 'anonymous cannot book');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select is((select count(*) from public.organizations), 0::bigint, 'nonmember sees no organizations');
select is((select count(*) from public.memberships), 0::bigint, 'nonmember sees no memberships');
select is((select count(*) from public.professionals), 0::bigint, 'nonmember sees no professionals');
select is((select count(*) from public.appointments), 0::bigint, 'nonmember sees no appointments');
with changed as (update public.appointments set status = 'cancelled' where id = '40000000-0000-4000-8000-000000000002' returning id) select is((select count(*) from changed), 0::bigint, 'nonmember cannot cancel member B appointment');
select throws_ok($$update public.appointments set starts_at = '2030-01-03 10:00+00' where id = '40000000-0000-4000-8000-000000000002'$$, '42501', 'permission denied for table appointments', 'nonmember cannot change member B appointment');
select throws_ok($$insert into public.memberships values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003')$$, '42501', 'permission denied for table memberships', 'self-join denied');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2030-01-01 10:00+00', '2030-01-01 11:00+00')$$, '42501', null, 'nonmember booking denied');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select is((select count(*) from public.organizations), 1::bigint, 'member sees own organization');
select is((select count(*) from public.sites), 1::bigint, 'member sees own site');
select is((select count(*) from public.professionals), 1::bigint, 'member sees own professional');
select is((select count(*) from public.memberships), 1::bigint, 'member sees only own membership');
select throws_ok($$update public.sites set organization_id = '10000000-0000-4000-8000-000000000002'$$, '42501', 'permission denied for table sites', 'member cannot move site between organizations');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', '2030-01-02 10:00+00', '2030-01-02 11:00+00')$$, '23503', null, 'cross-tenant professional rejected by FK');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '2030-01-02 10:00+00', '2030-01-02 11:00+00')$$, '42501', null, 'member cannot book other organization');
select is((select count(*) from public.appointments), 0::bigint, 'member cannot see other appointments');
with changed as (update public.appointments set status = 'cancelled' where id = '40000000-0000-4000-8000-000000000002' returning id) select is((select count(*) from changed), 0::bigint, 'member A cannot cancel member B appointment');
select throws_ok($$update public.appointments set starts_at = '2030-01-03 10:00+00' where id = '40000000-0000-4000-8000-000000000002'$$, '42501', 'permission denied for table appointments', 'member A cannot change member B appointment');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '2030-01-01 10:00+00', '2030-01-01 11:00+00')$$, '23503', null, 'cross-tenant site rejected by FK');
select lives_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2030-01-01 10:00+00', '2030-01-01 11:00+00')$$, 'member books own organization');
select throws_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2030-01-01 10:30+00', '2030-01-01 11:30+00')$$, '23P01', null, 'confirmed conflict rejected');
select throws_ok($$update public.appointments set organization_id = '10000000-0000-4000-8000-000000000002' where organization_id = '10000000-0000-4000-8000-000000000001'$$, '42501', 'permission denied for table appointments', 'member cannot change own appointment organization');
select throws_ok($$update public.appointments set site_id = '20000000-0000-4000-8000-000000000002' where organization_id = '10000000-0000-4000-8000-000000000001'$$, '42501', 'permission denied for table appointments', 'member cannot change own appointment site');
select throws_ok($$update public.appointments set professional_id = '30000000-0000-4000-8000-000000000002' where organization_id = '10000000-0000-4000-8000-000000000001'$$, '42501', 'permission denied for table appointments', 'member cannot change own appointment professional');
select throws_ok($$update public.appointments set starts_at = '2030-01-03 10:00+00' where organization_id = '10000000-0000-4000-8000-000000000001'$$, '42501', 'permission denied for table appointments', 'member cannot change own appointment time');
select lives_ok($$update public.appointments set status = 'cancelled' where organization_id = '10000000-0000-4000-8000-000000000001'$$, 'member cancels');
select is((select count(*) from public.appointments where status = 'cancelled'), 1::bigint, 'cancelled appointment remains');
with changed as (update public.appointments set status = 'confirmed' where status = 'cancelled' returning id) select is((select count(*) from changed), 0::bigint, 'authenticated member cannot re-confirm cancelled appointment');
select lives_ok($$insert into public.appointments (organization_id, site_id, professional_id, starts_at, ends_at) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2030-01-01 10:00+00', '2030-01-01 11:00+00')$$, 'cancel releases slot');
select * from finish();
rollback;
