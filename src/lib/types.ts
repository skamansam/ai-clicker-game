export interface Profile {
  id: string;
  username: string;
  prestige_level: number;
  prestige_multiplier: number;
  lifetime_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface GameState {
  id: string;
  user_id: string;
  clicks: number;
  clicks_per_second: number;
  total_clicks: number;
  click_streak: number;
  last_click_time: string | null;
  time_played: number;
  fastest_prestige: number | null;
  max_click_speed: number;
  active_tier_rewards: TierCompletionReward[];
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export interface Upgrade {
  id: string;
  name: string;
  base_cost: number;
  clicks_per_second: number;
  description: string | null;
  created_at: string;
}

export interface UserUpgrade {
  id: string;
  user_id: string;
  upgrade_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export type AchievementRequirementType = 
  | 'total_clicks'
  | 'clicks_per_second'
  | 'upgrades_owned'
  | 'click_speed'
  | 'time_played'
  | 'prestige_count'
  | 'unique_upgrades'
  | 'click_streak';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierEffect {
  type: 'glow' | 'particles';
  color: string;
  intensity: number;
  rainbow?: boolean;
}

export interface TierCompletionReward {
  type: 'multiplier_boost';
  value: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'clicks' | 'speed' | 'upgrades' | 'streaks' | 'time' | 'prestige' | 'combos' | 'social' | 'dedication' | 'challenges';
  requirement: number;
  icon: string;
  requirement_type: AchievementRequirementType[];
  requirement_values: number[];
  reward_multiplier: number;
  tier: AchievementTier;
  tier_level: number;
  tier_color: string;
  next_tier_id: string | null;
  tier_effect: TierEffect;
  tier_completion_reward: TierCompletionReward;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number[];
  unlocked_at: string;
  next_tier_progress?: number[];
}

// Achievement Stats and Leaderboards
export interface AchievementStats {
  id: string;
  user_id: string;
  achievement_id: string;
  unlock_time: string;
  time_to_unlock: string;
  percentile: number;
  global_rank: number;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  unlock_time: string;
  time_to_unlock: string;
  global_rank: number;
}

// Achievement Sharing
export interface AchievementShare {
  id: string;
  user_id: string;
  achievement_id: string;
  message: string;
  likes: number;
  created_at: string;
}

// Achievement Challenges
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'expired';

export interface AchievementChallenge {
  id: string;
  name: string;
  description: string;
  achievement_id: string | null;
  requirement_type: AchievementRequirementType[];
  requirement_values: number[];
  time_limit: string;
  reward_multiplier: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: ChallengeStatus;
  progress: number[];
  start_time: string;
  completion_time: string | null;
  created_at: string;
}

// Helper type for database operations
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      game_states: {
        Row: GameState;
        Insert: Omit<GameState, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GameState, 'id' | 'user_id'>>;
      };
      upgrades: {
        Row: Upgrade;
        Insert: Omit<Upgrade, 'id' | 'created_at'>;
        Update: never; // Upgrades are read-only
      };
      user_upgrades: {
        Row: UserUpgrade;
        Insert: Omit<UserUpgrade, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserUpgrade, 'id' | 'user_id' | 'upgrade_id'>>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, 'id' | 'created_at'>;
        Update: never; // Achievements are read-only
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: Omit<UserAchievement, 'id' | 'unlocked_at'>;
        Update: Partial<Omit<UserAchievement, 'id' | 'user_id' | 'achievement_id'>>;
      };
      achievement_stats: {
        Row: AchievementStats;
        Insert: Omit<AchievementStats, 'id' | 'created_at'>;
        Update: Partial<Omit<AchievementStats, 'id' | 'user_id' | 'achievement_id'>>;
      };
      achievement_shares: {
        Row: AchievementShare;
        Insert: Omit<AchievementShare, 'id' | 'created_at'>;
        Update: Partial<Omit<AchievementShare, 'id' | 'user_id' | 'achievement_id'>>;
      };
      achievement_challenges: {
        Row: AchievementChallenge;
        Insert: Omit<AchievementChallenge, 'id' | 'created_at'>;
        Update: Partial<Omit<AchievementChallenge, 'id'>>;
      };
      user_challenges: {
        Row: UserChallenge;
        Insert: Omit<UserChallenge, 'id' | 'created_at'>;
        Update: Partial<Omit<UserChallenge, 'id' | 'user_id' | 'challenge_id'>>;
      };
    };
  };
};
