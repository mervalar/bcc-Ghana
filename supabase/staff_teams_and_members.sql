-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- to create the tables backing the Staff & Committee page.

create table if not exists staff_teams (
  id          text primary key,
  name        text not null,
  description text,
  "order"     integer not null default 0
);

create table if not exists staff_members (
  id      text primary key,
  team_id text not null references staff_teams(id) on delete cascade,
  name    text not null,
  role    text
);

alter table staff_teams   enable row level security;
alter table staff_members enable row level security;

-- Matches the fully-open access the app already uses for its other tables
-- (the app has no server-side auth; the login screen is a client-side gate only).
create policy "public access" on staff_teams
  for all using (true) with check (true);

create policy "public access" on staff_members
  for all using (true) with check (true);
