-- Initial schema setup
create table if not exists achievements (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null,
    requirement_type text[] not null default array[]::text[],
    requirement_values bigint[] not null default array[]::bigint[],
    reward_multiplier double precision not null default 1.0,
    category text not null default 'general',
    rarity text not null default 'common',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_stats (
    user_id uuid primary key references auth.users(id),
    total_clicks bigint not null default 0,
    clicks_per_second integer not null default 0,
    prestige_count integer not null default 0,
    time_played integer not null default 0,
    fastest_prestige integer,
    max_click_speed integer not null default 0,
    current_multiplier double precision not null default 1.0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    achievement_id uuid references achievements(id),
    progress bigint[] not null default array[]::bigint[],
    unlocked_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, achievement_id)
);

create table if not exists achievement_collections (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null,
    achievement_ids uuid[] not null,
    reward_multiplier double precision not null default 1.0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    collection_id uuid references achievement_collections(id),
    progress integer not null default 0,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, collection_id)
);

create table if not exists achievement_challenges (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    requirements jsonb not null default '{}'::jsonb,
    rewards jsonb not null default '{}'::jsonb,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_challenges (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    challenge_id uuid references achievement_challenges(id),
    progress jsonb not null default '{}'::jsonb,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, challenge_id)
);

create table if not exists achievement_shop (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null,
    type text not null,
    cost integer not null,
    effects jsonb not null default '{}'::jsonb,
    rarity text not null default 'common',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_inventory (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    item_id uuid references achievement_shop(id),
    quantity integer not null default 1,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, item_id)
);

create table if not exists achievement_tiers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null,
    requirements jsonb not null default '{}'::jsonb,
    rewards jsonb not null default '{}'::jsonb,
    color text not null,
    icon text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists user_tiers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    tier_id uuid references achievement_tiers(id),
    progress jsonb not null default '{}'::jsonb,
    unlocked_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, tier_id)
);

create table if not exists achievement_social (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    type text not null,
    content jsonb not null,
    likes integer not null default 0,
    comments integer not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table if not exists social_interactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    post_id uuid references achievement_social(id),
    type text not null,
    content text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Insert initial achievement tiers
insert into achievement_tiers (name, description, requirements, rewards, color, icon) values
    ('Bronze', 'Starting tier for all players', 
     '{"achievements": 0}', 
     '{"multiplier": 1.0}',
     '#CD7F32', '🥉'),
    ('Silver', 'Reach 10 achievements', 
     '{"achievements": 10}',
     '{"multiplier": 1.2}',
     '#C0C0C0', '🥈'),
    ('Gold', 'Reach 25 achievements', 
     '{"achievements": 25}',
     '{"multiplier": 1.5}',
     '#FFD700', '🥇'),
    ('Platinum', 'Reach 50 achievements', 
     '{"achievements": 50}',
     '{"multiplier": 2.0}',
     '#E5E4E2', '💎'),
    ('Diamond', 'Reach 100 achievements', 
     '{"achievements": 100}',
     '{"multiplier": 3.0}',
     '#B9F2FF', '💠'),
    ('Master', 'Reach 200 achievements', 
     '{"achievements": 200}',
     '{"multiplier": 5.0}',
     '#FF4500', '👑');

-- Insert initial achievements
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, category, rarity) values
    -- Basic achievements
    ('First Click', 'Click for the first time', ARRAY['total_clicks'], ARRAY[1], 1.1, 'milestones', 'common'),
    ('Dedicated Clicker', 'Click 100 times', ARRAY['total_clicks'], ARRAY[100], 1.2, 'milestones', 'common'),
    ('Click Master', 'Click 1,000 times', ARRAY['total_clicks'], ARRAY[1000], 1.3, 'milestones', 'uncommon'),
    ('Click Champion', 'Click 10,000 times', ARRAY['total_clicks'], ARRAY[10000], 1.4, 'milestones', 'rare'),
    ('Click Legend', 'Click 100,000 times', ARRAY['total_clicks'], ARRAY[100000], 1.5, 'milestones', 'epic'),
    ('Click God', 'Click 1,000,000 times', ARRAY['total_clicks'], ARRAY[1000000], 2.0, 'milestones', 'legendary'),

    -- Speed achievements
    ('Lightning Fingers', 'Click 10 times in 1 second', ARRAY['click_speed'], ARRAY[10], 1.2, 'speed', 'uncommon'),
    ('Speed Demon Elite', 'Click 20 times in 1 second', ARRAY['click_speed'], ARRAY[20], 1.4, 'speed', 'rare'),
    ('Superhuman Clicker', 'Click 30 times in 1 second', ARRAY['click_speed'], ARRAY[30], 1.6, 'speed', 'epic'),

    -- Time played achievements
    ('Dedicated Player', 'Play for 1 hour', ARRAY['time_played'], ARRAY[3600], 1.1, 'dedication', 'common'),
    ('Veteran Player', 'Play for 24 hours', ARRAY['time_played'], ARRAY[86400], 1.3, 'dedication', 'rare'),
    ('Legendary Player', 'Play for 7 days', ARRAY['time_played'], ARRAY[604800], 1.5, 'dedication', 'epic'),

    -- Prestige achievements
    ('First Reset', 'Prestige for the first time', ARRAY['prestige_count'], ARRAY[1], 1.2, 'prestige', 'uncommon'),
    ('Reset Master', 'Prestige 5 times', ARRAY['prestige_count'], ARRAY[5], 1.4, 'prestige', 'rare'),
    ('Reset God', 'Prestige 10 times', ARRAY['prestige_count'], ARRAY[10], 1.6, 'prestige', 'epic'),

    -- Combo achievements
    ('Upgrade Collector', 'Own at least 1 of each upgrade', ARRAY['unique_upgrades'], ARRAY[1], 1.3, 'collection', 'uncommon'),
    ('Upgrade Hoarder', 'Own at least 10 of each upgrade', ARRAY['unique_upgrades'], ARRAY[10], 1.5, 'collection', 'rare'),
    ('Upgrade Emperor', 'Own at least 50 of each upgrade', ARRAY['unique_upgrades'], ARRAY[50], 1.7, 'collection', 'epic'),

    -- Speed milestones
    ('Sonic Speed', 'Reach 1,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[1000], 1.4, 'speed', 'rare'),
    ('Light Speed', 'Reach 10,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[10000], 1.6, 'speed', 'epic'),
    ('Quantum Speed', 'Reach 100,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[100000], 1.8, 'speed', 'legendary'),

    -- Click combo achievements
    ('Click Streak', 'Click 100 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[100], 1.3, 'combo', 'uncommon'),
    ('Ultra Streak', 'Click 500 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[500], 1.5, 'combo', 'rare'),
    ('Infinite Streak', 'Click 1000 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[1000], 1.7, 'combo', 'epic'),

    -- Multi-requirement achievements
    ('Speed and Endurance', 'Click 50 times in 1 second and maintain a 200 click streak', 
     ARRAY['click_speed', 'click_streak'], ARRAY[50, 200], 2.0, 'mastery', 'epic'),
    ('Ultimate Mastery', 'Reach prestige 5 and 50,000 clicks per second', 
     ARRAY['prestige_count', 'clicks_per_second'], ARRAY[5, 50000], 2.5, 'mastery', 'legendary');

-- Insert initial shop items
insert into achievement_shop (name, description, type, cost, effects, rarity) values
    ('Basic Multiplier', 'Increases click value by 10%', 'multiplier', 100, '{"multiplier": 1.1}', 'common'),
    ('Advanced Multiplier', 'Increases click value by 25%', 'multiplier', 500, '{"multiplier": 1.25}', 'uncommon'),
    ('Elite Multiplier', 'Increases click value by 50%', 'multiplier', 2000, '{"multiplier": 1.5}', 'rare'),
    ('Ultimate Multiplier', 'Doubles click value', 'multiplier', 10000, '{"multiplier": 2.0}', 'epic'),
    
    ('Bronze Badge', 'Shows your dedication', 'cosmetic', 50, '{"badge": "bronze"}', 'common'),
    ('Silver Badge', 'A mark of distinction', 'cosmetic', 200, '{"badge": "silver"}', 'uncommon'),
    ('Gold Badge', 'A symbol of mastery', 'cosmetic', 1000, '{"badge": "gold"}', 'rare'),
    ('Diamond Badge', 'The ultimate achievement', 'cosmetic', 5000, '{"badge": "diamond"}', 'epic'),
    
    ('Click Trail', 'Leaves a trail when clicking', 'effect', 150, '{"effect": "trail"}', 'common'),
    ('Click Sparkles', 'Adds sparkles to clicks', 'effect', 300, '{"effect": "sparkles"}', 'uncommon'),
    ('Click Rainbow', 'Rainbow effect on clicks', 'effect', 1500, '{"effect": "rainbow"}', 'rare'),
    ('Click Fireworks', 'Explosive click effects', 'effect', 7500, '{"effect": "fireworks"}', 'epic');

-- Create indexes for better query performance
create index if not exists idx_user_achievements_user_id on user_achievements(user_id);
create index if not exists idx_user_achievements_achievement_id on user_achievements(achievement_id);
create index if not exists idx_user_collections_user_id on user_collections(user_id);
create index if not exists idx_user_collections_collection_id on user_collections(collection_id);
create index if not exists idx_user_challenges_user_id on user_challenges(user_id);
create index if not exists idx_user_challenges_challenge_id on user_challenges(challenge_id);
create index if not exists idx_user_inventory_user_id on user_inventory(user_id);
create index if not exists idx_user_inventory_item_id on user_inventory(item_id);
create index if not exists idx_user_tiers_user_id on user_tiers(user_id);
create index if not exists idx_user_tiers_tier_id on user_tiers(tier_id);
create index if not exists idx_achievement_social_user_id on achievement_social(user_id);
create index if not exists idx_social_interactions_user_id on social_interactions(user_id);
create index if not exists idx_social_interactions_post_id on social_interactions(post_id);

-- Enable row level security
alter table user_stats enable row level security;
alter table user_achievements enable row level security;
alter table user_collections enable row level security;
alter table user_challenges enable row level security;
alter table user_inventory enable row level security;
alter table user_tiers enable row level security;
alter table achievement_social enable row level security;
alter table social_interactions enable row level security;

-- Create policies
create policy "Users can view their own stats"
    on user_stats for select
    using (auth.uid() = user_id);

create policy "Users can update their own stats"
    on user_stats for update
    using (auth.uid() = user_id);

create policy "Users can view their own achievements"
    on user_achievements for select
    using (auth.uid() = user_id);

create policy "Users can update their own achievements"
    on user_achievements for update
    using (auth.uid() = user_id);

create policy "Users can view their own collections"
    on user_collections for select
    using (auth.uid() = user_id);

create policy "Users can update their own collections"
    on user_collections for update
    using (auth.uid() = user_id);

create policy "Users can view their own challenges"
    on user_challenges for select
    using (auth.uid() = user_id);

create policy "Users can update their own challenges"
    on user_challenges for update
    using (auth.uid() = user_id);

create policy "Users can view their own inventory"
    on user_inventory for select
    using (auth.uid() = user_id);

create policy "Users can update their own inventory"
    on user_inventory for update
    using (auth.uid() = user_id);

create policy "Users can view their own tiers"
    on user_tiers for select
    using (auth.uid() = user_id);

create policy "Users can update their own tiers"
    on user_tiers for update
    using (auth.uid() = user_id);

create policy "Users can view all social posts"
    on achievement_social for select
    to authenticated
    using (true);

create policy "Users can create their own social posts"
    on achievement_social for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own social posts"
    on achievement_social for update
    using (auth.uid() = user_id);

create policy "Users can view all social interactions"
    on social_interactions for select
    to authenticated
    using (true);

create policy "Users can create their own social interactions"
    on social_interactions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own social interactions"
    on social_interactions for update
    using (auth.uid() = user_id);
