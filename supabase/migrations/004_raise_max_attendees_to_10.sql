-- Raises the per-guest attendee cap from 5 to 10.
alter table public.guests
  drop constraint if exists guests_max_attendees_check;
alter table public.guests
  add constraint guests_max_attendees_check check (max_attendees between 1 and 10);

alter table public.rsvps
  drop constraint if exists rsvps_attendee_count_check;
alter table public.rsvps
  add constraint rsvps_attendee_count_check check (attendee_count between 0 and 10);

alter table public.rsvps
  drop constraint if exists rsvps_attendee_count_consistency;
alter table public.rsvps
  add constraint rsvps_attendee_count_consistency check (
    (attending = false and attendee_count = 0)
    or (attending = true and attendee_count between 1 and 10)
  );
