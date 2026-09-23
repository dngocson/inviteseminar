-- Internal admin note about a guest (e.g. dietary needs, how they were
-- invited). Never surfaced on the public invitation card.
alter table public.guests
  add column if not exists note text;
