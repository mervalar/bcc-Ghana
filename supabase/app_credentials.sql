-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- to let admin login credentials sync across every device instead of being
-- stored only in each browser's localStorage.

create table if not exists app_credentials (
  id       text primary key default 'admin',
  username text not null,
  password text not null
);

alter table app_credentials enable row level security;

-- Matches the fully-open access the app already uses for its other tables
-- (the app has no server-side auth; the login screen is a client-side gate only).
create policy "public access" on app_credentials
  for all using (true) with check (true);
