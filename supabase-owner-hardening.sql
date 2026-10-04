-- Owner policy migration for the live portfolio database.
-- Review this file before one authorized run in the Supabase SQL editor.
-- It fails before policy changes unless exactly one auth user matches the
-- confirmed owner email.

begin;

-- Stop before changes when the owner is ambiguous or the live database has
-- policies outside the reviewed baseline. Inspect those policies first.
do $$
declare
  owner_count integer;
  unexpected_policies text;
begin
  select count(*)
    into owner_count
    from auth.users
   where lower(email) = lower('adamgemenez@gmail.com');

  if owner_count <> 1 then
    raise exception 'expected exactly one confirmed owner, found %', owner_count;
  end if;

  select string_agg(format('%I.%I:%I', schemaname, tablename, policyname), ', ' order by tablename, policyname)
    into unexpected_policies
    from pg_policies
   where schemaname = 'public'
     and tablename in ('projects', 'site_settings', 'leads')
     and policyname not in (
       'projects_public_read',
       'projects_owner_all',
       'projects_explicit_owner_all',
       'settings_public_read',
       'settings_owner_all',
       'settings_explicit_owner_all',
       'leads_public_insert',
       'leads_owner_read',
       'leads_explicit_owner_read'
     );

  if unexpected_policies is not null then
    raise exception 'review unexpected live policies before migration: %', unexpected_policies;
  end if;
end
$$;

alter table projects      enable row level security;
alter table site_settings enable row level security;
alter table leads         enable row level security;

-- Preserve the required public paths.
drop policy if exists projects_public_read on projects;
create policy projects_public_read on projects
  for select using (status <> 'hidden');

drop policy if exists settings_public_read on site_settings;
create policy settings_public_read on site_settings
  for select using (true);

drop policy if exists leads_public_insert on leads;
create policy leads_public_insert on leads
  for insert with check (true);

-- Replace policies that trust every authenticated account with policies that
-- bind the confirmed auth.users row by its immutable UUID.
drop policy if exists projects_owner_all on projects;
drop policy if exists projects_explicit_owner_all on projects;
drop policy if exists settings_owner_all on site_settings;
drop policy if exists settings_explicit_owner_all on site_settings;
drop policy if exists leads_owner_read on leads;
drop policy if exists leads_explicit_owner_read on leads;

do $$
declare
  owner_id uuid;
  owner_count integer;
begin
  select count(*)
    into owner_count
    from auth.users
   where lower(email) = lower('adamgemenez@gmail.com');

  if owner_count <> 1 then
    raise exception 'expected exactly one confirmed owner, found %', owner_count;
  end if;

  select id
    into owner_id
    from auth.users
   where lower(email) = lower('adamgemenez@gmail.com');

  execute format(
    'create policy projects_explicit_owner_all on projects for all to authenticated using (auth.uid() = %L::uuid) with check (auth.uid() = %L::uuid)',
    owner_id,
    owner_id
  );
  execute format(
    'create policy settings_explicit_owner_all on site_settings for all to authenticated using (auth.uid() = %L::uuid) with check (auth.uid() = %L::uuid)',
    owner_id,
    owner_id
  );
  execute format(
    'create policy leads_explicit_owner_read on leads for select to authenticated using (auth.uid() = %L::uuid)',
    owner_id
  );
end
$$;

commit;

-- Recovery statements for the prior policy behavior. Run only as a separate,
-- explicit rollback after review. These statements restore the broad baseline.
-- begin;
-- drop policy if exists projects_explicit_owner_all on projects;
-- create policy projects_owner_all on projects
--   for all to authenticated using (true) with check (true);
-- drop policy if exists settings_explicit_owner_all on site_settings;
-- create policy settings_owner_all on site_settings
--   for all to authenticated using (true) with check (true);
-- drop policy if exists leads_explicit_owner_read on leads;
-- create policy leads_owner_read on leads
--   for select to authenticated using (true);
-- commit;
