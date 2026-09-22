-- Seminar invitation schema: admin_users, guests, rsvps.
-- RLS is enabled on every table; no public CRUD grants. All access happens
-- through server-side API routes using the service-role key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- admin_users: maps a Supabase Auth user to admin privileges.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- No policies: table is only read via the service-role key on the server.

-- ---------------------------------------------------------------------------
-- guests: one row per invited guest/household.
-- ---------------------------------------------------------------------------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  full_name text not null,
  max_attendees smallint not null default 5 check (max_attendees between 1 and 5),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guests enable row level security;
-- No public policies; service role only.

create index if not exists guests_invite_code_idx on public.guests (invite_code);
create index if not exists guests_updated_at_idx on public.guests (updated_at desc);

-- ---------------------------------------------------------------------------
-- rsvps: one response per guest. attendee_count = 0 means "not attending".
-- ---------------------------------------------------------------------------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests (id) on delete cascade,
  responder_name text not null,
  message text,
  attending boolean not null,
  attendee_count smallint not null default 0 check (attendee_count between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvps_attendee_count_consistency check (
    (attending = false and attendee_count = 0)
    or (attending = true and attendee_count between 1 and 5)
  )
);

alter table public.rsvps enable row level security;
-- No public policies; service role only.

create index if not exists rsvps_attending_idx on public.rsvps (attending);
create index if not exists rsvps_updated_at_idx on public.rsvps (updated_at desc);

-- Keep `updated_at` fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
  before update on public.guests
  for each row
  execute function public.set_updated_at();

drop trigger if exists rsvps_set_updated_at on public.rsvps;
create trigger rsvps_set_updated_at
  before update on public.rsvps
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed instructions (run manually, not part of the migration):
--
-- 1. Create the first admin user in Supabase Auth (dashboard or
--    `supabase.auth.admin.createUser`).
-- 2. Grant admin access:
--    insert into public.admin_users (user_id) values ('<auth-user-uuid>');
-- ---------------------------------------------------------------------------
