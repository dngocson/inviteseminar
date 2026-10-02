-- Invitation emails (sent by an admin to guests.email) and RSVP confirmation
-- emails (sent automatically, once, to the email the guest typed in the RSVP
-- form) are tracked separately from here on.
alter table public.guests
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmation_sent_to text,
  add column if not exists confirmation_send_error text;

-- Move confirmations previously recorded in the invite_* columns.
update public.guests
set confirmation_sent_at = invite_sent_at,
    confirmation_sent_to = invite_sent_to,
    invite_sent_at = null,
    invite_sent_to = null
where invite_sent_kind = 'confirmation';

alter table public.guests drop column if exists invite_sent_kind;
