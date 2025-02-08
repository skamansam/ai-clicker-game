-- Add new achievement categories and types
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'combo_count';
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'max_combo_multiplier';
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'share_count';
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'likes_received';
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'daily_streak';
ALTER TYPE achievement_requirement_type ADD VALUE IF NOT EXISTS 'perfect_challenge';

-- Add new achievements for combos
INSERT INTO achievements (name, description, requirement_type, requirement_values, reward_multiplier, tier, tier_level, tier_color, tier_effect, tier_completion_reward)
VALUES
    -- Combo achievements
    ('Bronze Combo Master', 'Chain 3 achievements together', ARRAY['combo_count'], ARRAY[3], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Combo Master', 'Chain 5 achievements together', ARRAY['combo_count'], ARRAY[5], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Combo Master', 'Chain 7 achievements together', ARRAY['combo_count'], ARRAY[7], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Combo Master', 'Chain 10 achievements together', ARRAY['combo_count'], ARRAY[10], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Combo Master', 'Chain 15 achievements together', ARRAY['combo_count'], ARRAY[15], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}'),

    -- Combo multiplier achievements
    ('Bronze Multiplier', 'Reach a 2x combo multiplier', ARRAY['max_combo_multiplier'], ARRAY[2], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Multiplier', 'Reach a 3x combo multiplier', ARRAY['max_combo_multiplier'], ARRAY[3], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Multiplier', 'Reach a 4x combo multiplier', ARRAY['max_combo_multiplier'], ARRAY[4], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Multiplier', 'Reach a 5x combo multiplier', ARRAY['max_combo_multiplier'], ARRAY[5], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Multiplier', 'Reach a 7x combo multiplier', ARRAY['max_combo_multiplier'], ARRAY[7], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}'),

    -- Social achievements
    ('Bronze Socializer', 'Share 5 achievements', ARRAY['share_count'], ARRAY[5], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Socializer', 'Share 15 achievements', ARRAY['share_count'], ARRAY[15], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Socializer', 'Share 30 achievements', ARRAY['share_count'], ARRAY[30], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Socializer', 'Share 50 achievements', ARRAY['share_count'], ARRAY[50], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Socializer', 'Share 100 achievements', ARRAY['share_count'], ARRAY[100], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}'),

    -- Like achievements
    ('Bronze Influencer', 'Receive 10 likes on your shares', ARRAY['likes_received'], ARRAY[10], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Influencer', 'Receive 50 likes on your shares', ARRAY['likes_received'], ARRAY[50], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Influencer', 'Receive 100 likes on your shares', ARRAY['likes_received'], ARRAY[100], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Influencer', 'Receive 500 likes on your shares', ARRAY['likes_received'], ARRAY[500], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Influencer', 'Receive 1000 likes on your shares', ARRAY['likes_received'], ARRAY[1000], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}'),

    -- Daily streak achievements
    ('Bronze Dedication', 'Maintain a 3-day login streak', ARRAY['daily_streak'], ARRAY[3], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Dedication', 'Maintain a 7-day login streak', ARRAY['daily_streak'], ARRAY[7], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Dedication', 'Maintain a 14-day login streak', ARRAY['daily_streak'], ARRAY[14], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Dedication', 'Maintain a 30-day login streak', ARRAY['daily_streak'], ARRAY[30], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Dedication', 'Maintain a 100-day login streak', ARRAY['daily_streak'], ARRAY[100], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}'),

    -- Challenge achievements
    ('Bronze Challenger', 'Complete 1 perfect challenge', ARRAY['perfect_challenge'], ARRAY[1], 1.1, 'bronze', 1, '#cd7f32', 'glow', '{"type": "multiplier", "value": 1.05}'),
    ('Silver Challenger', 'Complete 3 perfect challenges', ARRAY['perfect_challenge'], ARRAY[3], 1.2, 'silver', 2, '#c0c0c0', 'particles', '{"type": "multiplier", "value": 1.1}'),
    ('Gold Challenger', 'Complete 5 perfect challenges', ARRAY['perfect_challenge'], ARRAY[5], 1.3, 'gold', 3, '#ffd700', 'rainbow', '{"type": "multiplier", "value": 1.15}'),
    ('Platinum Challenger', 'Complete 10 perfect challenges', ARRAY['perfect_challenge'], ARRAY[10], 1.5, 'platinum', 4, '#e5e4e2', 'starfield', '{"type": "multiplier", "value": 1.2}'),
    ('Diamond Challenger', 'Complete 20 perfect challenges', ARRAY['perfect_challenge'], ARRAY[20], 2.0, 'diamond', 5, '#b9f2ff', 'cosmic', '{"type": "multiplier", "value": 1.5}');
