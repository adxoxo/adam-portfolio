-- adyu portfolio schema. Run in a new Supabase project (SQL editor).
-- Then: Authentication > Providers > disable new signups, and invite your own
-- email so `authenticated` == you. See ARCHITECTURE.md / BUILD-PLAN.md.

-- ----------------------------------------------------------------------------
-- projects: the single source of truth. status drives placement everywhere.
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id          text primary key,                    -- slug, e.g. 'tq_chatbot'
  title       text not null default '',
  summary     text not null default '',
  outcome     text[] not null default '{}',         -- bullet outcomes
  cluster     text not null default 'fullstack'
              check (cluster in ('ai','fullstack','automation','embedded')),
  status      text not null default 'hidden'
              check (status in ('featured','archive','hidden')),
  stack       text[] not null default '{}',
  schematic   text[] not null default '{}',         -- architecture step labels
  github_url  text,
  loom_id     text,
  year        text not null default '',
  sort_order  int  not null default 100,
  map_x       numeric not null default 50,          -- % position on the map
  map_y       numeric not null default 50,
  source      text not null default 'manual'        -- 'manual' | 'github'
              check (source in ('manual','github')),
  synced_at   timestamptz,                          -- last github sync (source='github')
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_status_sort_idx on projects (status, sort_order);

-- Added after initial launch. Safe to re-run: upgrades an existing table.
alter table projects add column if not exists live_url text;

-- Detail-modal showcase content (added later). why = short motivation;
-- features = jsonb [{label, detail}] "how it works" list. Safe to re-run.
alter table projects add column if not exists why text;
alter table projects add column if not exists features jsonb not null default '[]'::jsonb;

-- Optional card cover image (used as the featured-card poster when a project
-- has no loom video). Safe to re-run.
alter table projects add column if not exists cover_image text;

-- ----------------------------------------------------------------------------
-- site_settings: single-row key/value for editable global copy (availability,
-- hero line, socials). Optional; the app has sensible defaults without it.
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  key   text primary key,
  value jsonb not null default '{}'
);

-- ----------------------------------------------------------------------------
-- leads: durable record of every contact submission. n8n does the rest.
-- ----------------------------------------------------------------------------
create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  source_ip  text,
  created_at timestamptz not null default now()
);

-- updated_at trigger for projects ------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--   public (anon): read visible projects + settings, insert leads.
--   authenticated (you): full control of projects + settings; read leads.
-- ----------------------------------------------------------------------------
alter table projects      enable row level security;
alter table site_settings enable row level security;
alter table leads         enable row level security;

-- projects: anyone can read the non-hidden rows
drop policy if exists projects_public_read on projects;
create policy projects_public_read on projects
  for select using (status <> 'hidden');

-- projects: the owner (any authenticated user, and signups are disabled) does everything
drop policy if exists projects_owner_all on projects;
create policy projects_owner_all on projects
  for all to authenticated using (true) with check (true);

-- settings: public read, owner write
drop policy if exists settings_public_read on site_settings;
create policy settings_public_read on site_settings for select using (true);
drop policy if exists settings_owner_all on site_settings;
create policy settings_owner_all on site_settings
  for all to authenticated using (true) with check (true);

-- leads: anyone can insert, only the owner can read
drop policy if exists leads_public_insert on leads;
create policy leads_public_insert on leads for insert with check (true);
drop policy if exists leads_owner_read on leads;
create policy leads_owner_read on leads for select to authenticated using (true);
