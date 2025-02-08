-- Create achievements table
create table if not exists achievements (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text not null,
    requirement_type text not null, -- 'total_clicks', 'clicks_per_second', 'upgrades_owned'
    requirement_value bigint not null,
    reward_multiplier double precision not null default 1.0,
    created_at timestamptz default now() not null
);

-- Create user_achievements junction table
create table if not exists user_achievements (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    achievement_id uuid references achievements(id) on delete cascade not null,
    unlocked_at timestamptz default now() not null,
    unique(user_id, achievement_id)
);

-- Add prestige-related columns to profiles
alter table profiles add column if not exists prestige_level integer default 0 not null;
alter table profiles add column if not exists prestige_multiplier double precision default 1.0 not null;
alter table profiles add column if not exists lifetime_clicks bigint default 0 not null;

-- Enable RLS on new tables
alter table user_achievements enable row level security;

-- Create policies for user_achievements
create policy "Users can view their own achievements"
    on user_achievements for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own achievements"
    on user_achievements for insert
    with check ( auth.uid() = user_id );

-- Insert some achievements
insert into achievements (name, description, requirement_type, requirement_value, reward_multiplier) values
    ('Beginner Clicker', 'Click 100 times', 'total_clicks', 100, 1.1),
    ('Dedicated Clicker', 'Click 1,000 times', 'total_clicks', 1000, 1.2),
    ('Click Master', 'Click 10,000 times', 'total_clicks', 10000, 1.3),
    ('Click God', 'Click 100,000 times', 'total_clicks', 100000, 1.5),
    ('Speed Demon', 'Reach 10 clicks per second', 'clicks_per_second', 10, 1.2),
    ('Factory Owner', 'Reach 100 clicks per second', 'clicks_per_second', 100, 1.4),
    ('Industrial Empire', 'Reach 1000 clicks per second', 'clicks_per_second', 1000, 1.6),
    ('Upgrade Enthusiast', 'Own 10 total upgrades', 'upgrades_owned', 10, 1.2),
    ('Upgrade Master', 'Own 50 total upgrades', 'upgrades_owned', 50, 1.4),
    ('Upgrade God', 'Own 100 total upgrades', 'upgrades_owned', 100, 1.6);
