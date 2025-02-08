-- Create tables with RLS (Row Level Security) enabled

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint username_length check (char_length(username) >= 3)
);

-- Create game_states table
create table if not exists game_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  clicks bigint default 0 not null,
  clicks_per_second double precision default 0 not null,
  total_clicks bigint default 0 not null,
  last_saved_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create upgrades table
create table if not exists upgrades (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  base_cost bigint not null,
  clicks_per_second double precision not null,
  description text,
  created_at timestamptz default now() not null
);

-- Create user_upgrades table (junction table for users and their purchased upgrades)
create table if not exists user_upgrades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  upgrade_id uuid references upgrades(id) on delete cascade not null,
  quantity integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, upgrade_id)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table game_states enable row level security;
alter table user_upgrades enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view their own game state"
  on game_states for select
  using ( auth.uid() = user_id );

create policy "Users can update their own game state"
  on game_states for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own game state"
  on game_states for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own upgrades"
  on user_upgrades for select
  using ( auth.uid() = user_id );

create policy "Users can update their own upgrades"
  on user_upgrades for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own upgrades"
  on user_upgrades for insert
  with check ( auth.uid() = user_id );

-- Create functions
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at();

create trigger update_game_states_updated_at
  before update on game_states
  for each row
  execute function update_updated_at();

create trigger update_user_upgrades_updated_at
  before update on user_upgrades
  for each row
  execute function update_updated_at();

-- Insert some initial upgrades
insert into upgrades (name, base_cost, clicks_per_second, description) values
  ('Cursor', 15, 0.1, 'Automatically clicks once every 10 seconds'),
  ('Grandma', 100, 0.5, 'Bakes cookies at a steady rate'),
  ('Farm', 1100, 4, 'Grows cookie plants'),
  ('Mine', 12000, 10, 'Mines cookie dough'),
  ('Factory', 130000, 40, 'Mass produces cookies');
