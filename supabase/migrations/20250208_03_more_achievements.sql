-- Add new achievement types
alter table achievements
    alter column requirement_type type text[] using array[requirement_type],
    add column if not exists requirement_values bigint[] not null default array[0];

-- Add new columns for tracking achievement progress
alter table user_achievements
    add column if not exists progress bigint[] not null default array[0];

-- Add new achievement categories
insert into achievements (name, description, requirement_type, requirement_values, reward_multiplier) values
    -- Speed achievements
    ('Lightning Fingers', 'Click 10 times in 1 second', ARRAY['click_speed'], ARRAY[10], 1.2),
    ('Speed Demon Elite', 'Click 20 times in 1 second', ARRAY['click_speed'], ARRAY[20], 1.4),
    ('Superhuman Clicker', 'Click 30 times in 1 second', ARRAY['click_speed'], ARRAY[30], 1.6),

    -- Time played achievements
    ('Dedicated Player', 'Play for 1 hour', ARRAY['time_played'], ARRAY[3600], 1.1),
    ('Veteran Player', 'Play for 24 hours', ARRAY['time_played'], ARRAY[86400], 1.3),
    ('Legendary Player', 'Play for 7 days', ARRAY['time_played'], ARRAY[604800], 1.5),

    -- Prestige achievements
    ('First Reset', 'Prestige for the first time', ARRAY['prestige_count'], ARRAY[1], 1.2),
    ('Reset Master', 'Prestige 5 times', ARRAY['prestige_count'], ARRAY[5], 1.4),
    ('Reset God', 'Prestige 10 times', ARRAY['prestige_count'], ARRAY[10], 1.6),

    -- Combo achievements
    ('Upgrade Collector', 'Own at least 1 of each upgrade', ARRAY['unique_upgrades'], ARRAY[1], 1.3),
    ('Upgrade Hoarder', 'Own at least 10 of each upgrade', ARRAY['unique_upgrades'], ARRAY[10], 1.5),
    ('Upgrade Emperor', 'Own at least 50 of each upgrade', ARRAY['unique_upgrades'], ARRAY[50], 1.7),

    -- Speed milestones
    ('Sonic Speed', 'Reach 1,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[1000], 1.4),
    ('Light Speed', 'Reach 10,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[10000], 1.6),
    ('Quantum Speed', 'Reach 100,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[100000], 1.8),

    -- Click combo achievements
    ('Click Streak', 'Click 100 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[100], 1.3),
    ('Ultra Streak', 'Click 500 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[500], 1.5),
    ('Infinite Streak', 'Click 1000 times without stopping for more than 1 second', ARRAY['click_streak'], ARRAY[1000], 1.7),

    -- Multi-requirement achievements
    ('Early Bird', 'Have 1000 CPS within 1 hour of playing', ARRAY['clicks_per_second', 'time_played'], ARRAY[1000, 3600], 1.5),
    ('Speed Runner', 'Prestige within 2 hours of playing', ARRAY['prestige_count', 'time_played'], ARRAY[1, 7200], 1.6),
    ('Perfect Start', 'Get 10 upgrades within 30 minutes', ARRAY['upgrades_owned', 'time_played'], ARRAY[10, 1800], 1.4);

-- Add columns to game_states for new achievement tracking
alter table game_states
    add column if not exists click_streak integer not null default 0,
    add column if not exists last_click_time timestamptz,
    add column if not exists time_played integer not null default 0,
    add column if not exists fastest_prestige integer,
    add column if not exists max_click_speed integer not null default 0;
