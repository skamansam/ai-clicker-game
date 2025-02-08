-- Add new tier types and completion rewards
alter type achievement_tier add value if not exists 'platinum';
alter type achievement_tier add value if not exists 'diamond';

alter table achievements
    add column if not exists tier_completion_reward jsonb,
    add column if not exists tier_effect jsonb;

-- Update existing achievements with tier effects
update achievements set tier_effect = jsonb_build_object(
    'type', 'glow',
    'color', tier_color,
    'intensity', 
    case 
        when tier = 'bronze' then 0.2
        when tier = 'silver' then 0.4
        when tier = 'gold' then 0.6
        when tier = 'platinum' then 0.8
        when tier = 'diamond' then 1.0
    end
);

-- Add tier completion rewards
update achievements set tier_completion_reward = jsonb_build_object(
    'type', 'multiplier_boost',
    'value',
    case 
        when tier = 'bronze' then 1.2
        when tier = 'silver' then 1.5
        when tier = 'gold' then 2.0
        when tier = 'platinum' then 3.0
        when tier = 'diamond' then 5.0
    end
);

-- Add platinum and diamond achievements
-- Mega Clicks
with tiers as (
    select id from achievements where name = 'Click Master' and tier = 'gold'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color, next_tier_id,
    tier_effect, tier_completion_reward
) select 
    'Click Grandmaster', 'Click 1,000,000 times', ARRAY['total_clicks'], ARRAY[1000000],
    2.0, 'platinum', 4, '#E5E4E2', id,
    '{"type": "particles", "color": "#E5E4E2", "intensity": 0.8}'::jsonb,
    '{"type": "multiplier_boost", "value": 3.0}'::jsonb
from tiers;

with tiers as (
    select id from achievements where name = 'Click Grandmaster' and tier = 'platinum'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color,
    tier_effect, tier_completion_reward
) select 
    'Click Deity', 'Click 10,000,000 times', ARRAY['total_clicks'], ARRAY[10000000],
    3.0, 'diamond', 5, '#B9F2FF',
    '{"type": "particles", "color": "#B9F2FF", "intensity": 1.0, "rainbow": true}'::jsonb,
    '{"type": "multiplier_boost", "value": 5.0}'::jsonb
from tiers;

-- Speed Demon
with tiers as (
    select id from achievements where name = 'Speed Master' and tier = 'gold'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color, next_tier_id,
    tier_effect, tier_completion_reward
) select 
    'Speed Grandmaster', 'Reach 1,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[1000],
    2.0, 'platinum', 4, '#E5E4E2', id,
    '{"type": "particles", "color": "#E5E4E2", "intensity": 0.8}'::jsonb,
    '{"type": "multiplier_boost", "value": 3.0}'::jsonb
from tiers;

with tiers as (
    select id from achievements where name = 'Speed Grandmaster' and tier = 'platinum'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color,
    tier_effect, tier_completion_reward
) select 
    'Speed Deity', 'Reach 5,000 clicks per second', ARRAY['clicks_per_second'], ARRAY[5000],
    3.0, 'diamond', 5, '#B9F2FF',
    '{"type": "particles", "color": "#B9F2FF", "intensity": 1.0, "rainbow": true}'::jsonb,
    '{"type": "multiplier_boost", "value": 5.0}'::jsonb
from tiers;

-- Upgrade Master
with tiers as (
    select id from achievements where name = 'Upgrade Legend' and tier = 'gold'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color, next_tier_id,
    tier_effect, tier_completion_reward
) select 
    'Upgrade Grandmaster', 'Own 500 total upgrades', ARRAY['upgrades_owned'], ARRAY[500],
    2.0, 'platinum', 4, '#E5E4E2', id,
    '{"type": "particles", "color": "#E5E4E2", "intensity": 0.8}'::jsonb,
    '{"type": "multiplier_boost", "value": 3.0}'::jsonb
from tiers;

with tiers as (
    select id from achievements where name = 'Upgrade Grandmaster' and tier = 'platinum'
)
insert into achievements (
    name, description, requirement_type, requirement_values, 
    reward_multiplier, tier, tier_level, tier_color,
    tier_effect, tier_completion_reward
) select 
    'Upgrade Deity', 'Own 2000 total upgrades', ARRAY['upgrades_owned'], ARRAY[2000],
    3.0, 'diamond', 5, '#B9F2FF',
    '{"type": "particles", "color": "#B9F2FF", "intensity": 1.0, "rainbow": true}'::jsonb,
    '{"type": "multiplier_boost", "value": 5.0}'::jsonb
from tiers;

-- Add columns to track tier completion rewards
alter table game_states
    add column if not exists active_tier_rewards jsonb default '[]'::jsonb;
