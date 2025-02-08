import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement, AchievementStats, AchievementLeaderboard } from '$lib/types';
import { achievementStore } from './achievements';

interface AchievementStatsStore {
    stats: AchievementStats[];
    leaderboards: Record<string, AchievementLeaderboard[]>;
    globalStats: {
        totalAchievements: number;
        totalPlayers: number;
        averageCompletion: number;
        topCategories: { category: string; count: number }[];
        recentUnlocks: { achievement: Achievement; player: string; time: string }[];
        mostRareAchievements: { achievement: Achievement; unlockPercentage: number }[];
        mostCommonAchievements: { achievement: Achievement; unlockPercentage: number }[];
        averageTimeToUnlock: { achievement: Achievement; time: string }[];
        bestStreaks: { player: string; streak: number }[];
        topMultipliers: { player: string; multiplier: number }[];
    };
    playerStats: {
        rank: number;
        percentile: number;
        totalUnlocked: number;
        completionRate: number;
        averageTimeToUnlock: string;
        bestStreak: number;
        currentStreak: number;
        favoriteCategory: string;
        rarest: Achievement;
        fastest: Achievement;
        recentActivity: {
            type: 'unlock' | 'combo' | 'challenge';
            achievement?: Achievement;
            description: string;
            time: string;
        }[];
        categoryProgress: Record<string, {
            completed: number;
            total: number;
            nextAchievement?: Achievement;
        }>;
    };
    loading: boolean;
    error: string | null;
}

function createAchievementStatsStore() {
    const { subscribe, set, update } = writable<AchievementStatsStore>({
        stats: [],
        leaderboards: {},
        globalStats: {
            totalAchievements: 0,
            totalPlayers: 0,
            averageCompletion: 0,
            topCategories: [],
            recentUnlocks: [],
            mostRareAchievements: [],
            mostCommonAchievements: [],
            averageTimeToUnlock: [],
            bestStreaks: [],
            topMultipliers: []
        },
        playerStats: {
            rank: 0,
            percentile: 0,
            totalUnlocked: 0,
            completionRate: 0,
            averageTimeToUnlock: '0',
            bestStreak: 0,
            currentStreak: 0,
            favoriteCategory: '',
            rarest: null,
            fastest: null,
            recentActivity: [],
            categoryProgress: {}
        },
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadStats() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                // Load global stats
                const { data: globalData, error: globalError } = await supabase
                    .rpc('get_global_achievement_stats');

                if (globalError) throw globalError;

                // Load player stats
                const { data: playerData, error: playerError } = await supabase
                    .rpc('get_player_achievement_stats');

                if (playerError) throw playerError;

                // Load category progress
                const { data: categoryData, error: categoryError } = await supabase
                    .rpc('get_category_progress');

                if (categoryError) throw categoryError;

                update(store => ({
                    ...store,
                    globalStats: {
                        ...store.globalStats,
                        ...globalData
                    },
                    playerStats: {
                        ...store.playerStats,
                        ...playerData,
                        categoryProgress: categoryData
                    },
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading achievement stats:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async loadLeaderboard(achievementId: string) {
            try {
                const { data, error } = await supabase
                    .from('achievement_leaderboard')
                    .select('*')
                    .eq('achievement_id', achievementId)
                    .order('time_to_unlock', { ascending: true })
                    .limit(100);

                if (error) throw error;

                update(store => ({
                    ...store,
                    leaderboards: {
                        ...store.leaderboards,
                        [achievementId]: data
                    }
                }));
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            }
        },

        async updateStreak() {
            try {
                const { data, error } = await supabase
                    .rpc('update_achievement_streak');

                if (error) throw error;

                update(store => ({
                    ...store,
                    playerStats: {
                        ...store.playerStats,
                        currentStreak: data.current_streak,
                        bestStreak: Math.max(store.playerStats.bestStreak, data.current_streak)
                    }
                }));
            } catch (error) {
                console.error('Error updating streak:', error);
            }
        },

        async recordActivity(type: 'unlock' | 'combo' | 'challenge', achievement?: Achievement, description?: string) {
            const activity = {
                type,
                achievement,
                description: description || `Unlocked ${achievement?.name}`,
                time: new Date().toISOString()
            };

            try {
                const { error } = await supabase
                    .from('achievement_activity')
                    .insert([activity]);

                if (error) throw error;

                update(store => ({
                    ...store,
                    playerStats: {
                        ...store.playerStats,
                        recentActivity: [activity, ...store.playerStats.recentActivity].slice(0, 50)
                    }
                }));
            } catch (error) {
                console.error('Error recording activity:', error);
            }
        },

        getAchievementRarity(achievementId: string) {
            return this.globalStats?.mostRareAchievements?.find(
                a => a.achievement.id === achievementId
            )?.unlockPercentage || 0;
        },

        getCategoryCompletion(category: string) {
            const progress = this.playerStats?.categoryProgress[category];
            if (!progress) return 0;
            return (progress.completed / progress.total) * 100;
        },

        getNextAchievementInCategory(category: string) {
            return this.playerStats?.categoryProgress[category]?.nextAchievement;
        }
    };
}

export const achievementStatsStore = createAchievementStatsStore();
