-- Contact details + allergy info collected on the RSVP form.
-- All optional: a guest who declines isn't forced to share them.
alter table public.rsvps
  add column if not exists company text,
  add column if not exists job_title text,
  add column if not exists phone text,
  add column if not exists email text,
  -- Allergies / sensitivities to ingredients in food or cosmetics.
  add column if not exists allergies text;
