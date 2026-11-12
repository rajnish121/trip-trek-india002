-- Run once in Supabase → SQL Editor (after the earlier scripts).
alter table bookings add column if not exists balance_paid_at timestamptz;
alter table bookings add column if not exists balance_paid_amount int default 0;
alter table bookings add column if not exists balance_order_id text;
alter table bookings add column if not exists balance_payment_id text;
alter table bookings add column if not exists cancel_requested_at timestamptz;
alter table bookings add column if not exists cancel_reason text;
alter table bookings add column if not exists admin_notes text;
alter table bookings add column if not exists reminders_sent jsonb default '{}'::jsonb;

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,
  created_at timestamptz default now(),
  unsubscribed_at timestamptz
);
alter table subscribers enable row level security;
-- No policies on purpose: only our server (service role) can read or write subscribers.
