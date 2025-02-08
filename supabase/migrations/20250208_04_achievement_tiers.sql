-- Add tier-related columns to achievements
alter table achievements
    add column if not exists tier text not null default 'bronze',
    add column if not exists next_tier_id uuid references achievements(id),
    add column if not exists tier_level integer not null default 1,
    add column if not exists tier_color text not null default '#CD7F32';

-- Create tiered achievements
-- Total Clicks Achievements
with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color) values
    ('Click Novice', 'Click 1,000 times', ARRAY['total_clicks'], ARRAY[1000], 1.1, 'bronze', 1, '#CD7F32')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Click Expert', 'Click 10,000 times', ARRAY['total_clicks'], ARRAY[10000], 1.3, 'silver', 2, '#C0C0C0', id
from tiers;

with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color)
    select 'Click Expert', 'Click 10,000 times', ARRAY['total_clicks'], ARRAY[10000], 1.3, 'silver', 2, '#C0C0C0'
    where not exists (select 1 from achievements where name = 'Click Expert')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Click Master', 'Click 100,000 times', ARRAY['total_clicks'], ARRAY[100000], 1.5, 'gold', 3, '#FFD700', id
from tiers;

-- CPS Achievements
with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color) values
    ('Speed Initiate', 'Reach 10 clicks per second', ARRAY['clicks_per_second'], ARRAY[10], 1.1, 'bronze', 1, '#CD7F32')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Speed Adept', 'Reach 50 clicks per second', ARRAY['clicks_per_second'], ARRAY[50], 1.3, 'silver', 2, '#C0C0C0', id
from tiers;

with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color)
    select 'Speed Adept', 'Reach 50 clicks per second', ARRAY['clicks_per_second'], ARRAY[50], 1.3, 'silver', 2, '#C0C0C0'
    where not exists (select 1 from achievements where name = 'Speed Adept')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Speed Master', 'Reach 200 clicks per second', ARRAY['clicks_per_second'], ARRAY[200], 1.5, 'gold', 3, '#FFD700', id
from tiers;

-- Upgrade Achievements
with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color) values
    ('Upgrade Beginner', 'Own 5 total upgrades', ARRAY['upgrades_owned'], ARRAY[5], 1.1, 'bronze', 1, '#CD7F32')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Upgrade Professional', 'Own 25 total upgrades', ARRAY['upgrades_owned'], ARRAY[25], 1.3, 'silver', 2, '#C0C0C0', id
from tiers;

with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color)
    select 'Upgrade Professional', 'Own 25 total upgrades', ARRAY['upgrades_owned'], ARRAY[25], 1.3, 'silver', 2, '#C0C0C0'
    where not exists (select 1 from achievements where name = 'Upgrade Professional')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Upgrade Legend', 'Own 100 total upgrades', ARRAY['upgrades_owned'], ARRAY[100], 1.5, 'gold', 3, '#FFD700', id
from tiers;

-- Click Streak Achievements
with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color) values
    ('Streak Starter', 'Maintain a 50-click streak', ARRAY['click_streak'], ARRAY[50], 1.1, 'bronze', 1, '#CD7F32')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Streak Runner', 'Maintain a 200-click streak', ARRAY['click_streak'], ARRAY[200], 1.3, 'silver', 2, '#C0C0C0', id
from tiers;

with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color)
    select 'Streak Runner', 'Maintain a 200-click streak', ARRAY['click_streak'], ARRAY[200], 1.3, 'silver', 2, '#C0C0C0'
    where not exists (select 1 from achievements where name = 'Streak Runner')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Streak Master', 'Maintain a 1000-click streak', ARRAY['click_streak'], ARRAY[1000], 1.5, 'gold', 3, '#FFD700', id
from tiers;

-- Time Played Achievements
with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color) values
    ('Time Novice', 'Play for 30 minutes', ARRAY['time_played'], ARRAY[1800], 1.1, 'bronze', 1, '#CD7F32')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Time Enthusiast', 'Play for 4 hours', ARRAY['time_played'], ARRAY[14400], 1.3, 'silver', 2, '#C0C0C0', id
from tiers;

with tiers as (
    insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color)
    select 'Time Enthusiast', 'Play for 4 hours', ARRAY['time_played'], ARRAY[14400], 1.3, 'silver', 2, '#C0C0C0'
    where not exists (select 1 from achievements where name = 'Time Enthusiast')
    returning id
)
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, next_tier_id)
select 'Time Master', 'Play for 24 hours', ARRAY['time_played'], ARRAY[86400], 1.5, 'gold', 3, '#FFD700', id
from tiers;
