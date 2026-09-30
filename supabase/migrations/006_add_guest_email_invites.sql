-- Guest email + invitation email delivery status (sent via Resend from the
-- admin dashboard).
alter table public.guests
  add column if not exists email text,
  add column if not exists invite_sent_at timestamptz,
  add column if not exists invite_send_error text;
