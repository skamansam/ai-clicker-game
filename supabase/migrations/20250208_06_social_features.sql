-- Achievement statistics and leaderboards
create table if not exists achievement_stats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    achievement_id uuid references achievements not null,
    unlock_time timestamp with time zone not null,
    time_to_unlock interval not null, -- Time taken from first progress to unlock
    percentile float, -- Updated by a cron job
    global_rank integer, -- Updated by a cron job
    created_at timestamp with time zone default now(),
    unique(user_id, achievement_id)
);

-- Achievement sharing
create table if not exists achievement_shares (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    achievement_id uuid references achievements not null,
    message text,
    likes integer default 0,
    created_at timestamp with time zone default now()
);

-- Achievement challenges
create type challenge_status as enum ('active', 'completed', 'failed', 'expired');

create table if not exists achievement_challenges (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text not null,
    achievement_id uuid references achievements,
    requirement_type achievement_requirement_type[] not null,
    requirement_values integer[] not null,
    time_limit interval not null,
    reward_multiplier float not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    created_at timestamp with time zone default now()
);

create table if not exists user_challenges (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    challenge_id uuid references achievement_challenges not null,
    status challenge_status not null default 'active',
    progress integer[] not null default array[]::integer[],
    start_time timestamp with time zone not null,
    completion_time timestamp with time zone,
    created_at timestamp with time zone default now(),
    unique(user_id, challenge_id)
);

-- RLS Policies
alter table achievement_stats enable row level security;
alter table achievement_shares enable row level security;
alter table achievement_challenges enable row level security;
alter table user_challenges enable row level security;

-- View own stats
create policy "Users can view their own achievement stats"
    on achievement_stats for select
    using (auth.uid() = user_id);

-- Insert own stats
create policy "Users can insert their own achievement stats"
    on achievement_stats for insert
    with check (auth.uid() = user_id);

-- View all shares
create policy "Anyone can view achievement shares"
    on achievement_shares for select
    using (true);

-- Create own shares
create policy "Users can create their own achievement shares"
    on achievement_shares for insert
    with check (auth.uid() = user_id);

-- View active challenges
create policy "Anyone can view active challenges"
    on achievement_challenges for select
    using (true);

-- View own challenge progress
create policy "Users can view their own challenge progress"
    on user_challenges for select
    using (auth.uid() = user_id);

-- Join own challenges
create policy "Users can join challenges"
    on user_challenges for insert
    with check (auth.uid() = user_id);

-- Update own challenge progress
create policy "Users can update their own challenge progress"
    on user_challenges for update
    using (auth.uid() = user_id);

-- Functions for leaderboards
create or replace function get_achievement_leaderboard(achievement_id uuid)
returns table (
    user_id uuid,
    username text,
    unlock_time timestamp with time zone,
    time_to_unlock interval,
    global_rank integer
)
language sql
security definer
as $$
    select 
        s.user_id,
        p.username,
        s.unlock_time,
        s.time_to_unlock,
        s.global_rank
    from achievement_stats s
    join profiles p on p.id = s.user_id
    where s.achievement_id = $1
    order by s.global_rank asc
    limit 100;
$$;
