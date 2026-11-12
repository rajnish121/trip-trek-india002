-- Run once in Supabase → SQL Editor: custom payment links created by the team.
create table if not exists payment_links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  trek text not null,
  sharing text not null,
  travellers int not null,
  name text not null,
  email text not null,
  phone text not null,
  travel_date date,
  price_per_person int not null,
  advance_per_person int not null default 2000,
  note text,
  created_by text,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  cancelled_at timestamptz,
  used_at timestamptz,
  razorpay_order_id text
);
alter table payment_links enable row level security;
-- No policies: only our server (service role) can read or write.
