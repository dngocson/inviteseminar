-- Adds the guest's invitation display language. Used only as the default
-- `l` value when the admin generates/copies that guest's invite link — the
-- guest can still switch language on the card itself afterwards.
alter table public.guests
  add column if not exists locale text not null default 'vi'
    check (locale in ('vi', 'en'));
