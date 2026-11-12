-- Run once in Supabase → SQL Editor (after the earlier scripts).
-- Customer reviews. A traveller submits one review per booking; it stays "pending"
-- until a team member approves it in the admin portal.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique not null,
  trek text not null,
  email text not null,
  display_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  approved_at timestamptz
);
create index if not exists reviews_trek_status on reviews (trek, status);
alter table reviews enable row level security;
-- No policies on purpose: only our server (service role) can read or write reviews.
