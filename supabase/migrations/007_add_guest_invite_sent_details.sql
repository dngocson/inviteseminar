-- Which address the last invitation-related email went to, and what kind it
-- was: 'invite' (sent by an admin) or 'confirmation' (sent automatically
-- after an attending RSVP, possibly to the email the guest typed in).
alter table public.guests
  add column if not exists invite_sent_to text,
  add column if not exists invite_sent_kind text
    check (invite_sent_kind in ('invite', 'confirmation'));
