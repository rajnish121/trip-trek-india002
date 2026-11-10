-- Run once in Supabase → SQL Editor (after the first script you already ran).
alter table bookings add column if not exists name text;
alter table bookings add column if not exists phone text;
alter table bookings add column if not exists trek_name text;
alter table bookings add column if not exists travel_date date;
alter table bookings add column if not exists advance_due int;
alter table bookings add column if not exists confirmed_at timestamptz;

-- Customers can read bookings made with the email they verified by OTP.
drop policy if exists "own bookings" on bookings;
create policy "own bookings by email" on bookings
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));
