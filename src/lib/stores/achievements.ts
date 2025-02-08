import { writable, derived } from 'svelte/store';
import type { Achievement, UserAchievement } from '$lib/types';
import { supabase } from '$lib/supabase';
import { gameStore } from './game';
import { notificationStore } from './notifications';

export type AchievementCategory = 'clicks' | 'speed' | 'upgrades' | 'streaks' | 'time' | 'prestige' | 'combos' | 'social' | 'dedication' | 'challenges';

interface AchievementStore {
    achievements: Achievement[];
    unlockedAchievements: UserAchievement[];
    categories: AchievementCategory[];
    selectedCategory: AchievementCategory | 'all';
    comboTimer: number | null;
    comboAchievements: Achievement[];
    loading: boolean;
    error: string | null;
}

const COMBO_TIMEOUT = 2000; // 2 seconds to chain achievements
const COMBO_MULTIPLIERS = [1, 1.2, 1.5, 2, 3, 5]; // Multipliers for combo chains

function createAchievementStore() {
    const { subscribe, set, update } = writable<AchievementStore>({
        achievements: [],
        unlockedAchievements: [],
        categories: [
            'clicks',
            'speed',
            'upgrades',
            'streaks',
            'time',
            'prestige',
            'combos',
            'social',
            'dedication',
            'challenges'
        ],
        selectedCategory: 'all',
        comboTimer: null,
        comboAchievements: [],
        loading: false,
        error: null
    });

    let comboTimeout: NodeJS.Timeout;

    return {
        subscribe,

        // Load achievements from database
        async loadAchievements() {
            update(store => ({ ...store, loading: true }));
            
            try {
                const { data: achievements, error: achievementsError } = await supabase
                    .from('achievements')
                    .select('*')
                    .order('tier_level', { ascending: true });
                
                if (achievementsError) throw achievementsError;

                const { data: userAchievements, error: userError } = await supabase
                    .from('user_achievements')
                    .select('*');
                
                if (userError) throw userError;

                update(store => ({
                    ...store,
                    achievements: achievements || [],
                    unlockedAchievements: userAchievements || [],
                    loading: false,
                    error: null
                }));
            } catch (error) {
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        // Set selected category
        setCategory(category: AchievementCategory | 'all') {
            update(store => ({
                ...store,
                selectedCategory: category
            }));
        },

        // Get achievements by category
        getAchievementsByCategory(category: AchievementCategory) {
            return this.achievements.filter(achievement => {
                const types = achievement.requirement_type;
                switch (category) {
                    case 'clicks':
                        return types.includes('total_clicks');
                    case 'speed':
                        return types.includes('clicks_per_second');
                    case 'upgrades':
                        return types.includes('upgrades_owned') || types.includes('unique_upgrades');
                    case 'streaks':
                        return types.includes('click_streak');
                    case 'time':
                        return types.includes('time_played');
                    case 'prestige':
                        return types.includes('prestige_count');
                    case 'combos':
                        return types.includes('combo_count') || types.includes('max_combo_multiplier');
                    case 'social':
                        return types.includes('share_count') || types.includes('likes_received');
                    case 'dedication':
                        return types.includes('daily_streak');
                    case 'challenges':
                        return types.includes('perfect_challenge');
                    default:
                        return true;
                }
            });
        },

        // Handle achievement unlock with combos
        async unlockAchievement(achievement: Achievement, progress: number[]) {
            try {
                const { data: userAchievement, error } = await supabase
                    .from('user_achievements')
                    .insert({
                        achievement_id: achievement.id,
                        progress,
                        unlocked_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                update(store => {
                    // Add to combo if within timeout
                    const comboAchievements = store.comboTimer && Date.now() - store.comboTimer < COMBO_TIMEOUT
                        ? [...store.comboAchievements, achievement]
                        : [achievement];

                    // Calculate combo multiplier
                    const comboIndex = Math.min(comboAchievements.length - 1, COMBO_MULTIPLIERS.length - 1);
                    const comboMultiplier = COMBO_MULTIPLIERS[comboIndex];

                    // Clear existing timeout
                    if (comboTimeout) {
                        clearTimeout(comboTimeout);
                    }

                    // Set new timeout
                    comboTimeout = setTimeout(() => {
                        // When combo ends, apply the final multiplier
                        if (comboAchievements.length > 1) {
                            const totalBonus = comboAchievements.reduce(
                                (sum, a) => sum + (a.reward_multiplier - 1),
                                0
                            ) * comboMultiplier;
                            gameStore.addMultiplier(1 + totalBonus);
                            notificationStore.comboUnlock(comboAchievements, comboMultiplier);
                        } else {
                            // Single achievement, normal multiplier
                            gameStore.addMultiplier(achievement.reward_multiplier);
                        }

                        // Reset combo
                        update(s => ({
                            ...s,
                            comboTimer: null,
                            comboAchievements: []
                        }));
                    }, COMBO_TIMEOUT);

                    // Show achievement notification
                    notificationStore.achievementUnlocked(achievement, comboAchievements.length > 1);

                    // If it's the last achievement in a tier, show tier completion
                    const tierAchievements = store.achievements.filter(
                        a => a.tier === achievement.tier && 
                             a.name.split(' ')[0] === achievement.name.split(' ')[0]
                    );
                    const unlockedInTier = store.unlockedAchievements.filter(
                        ua => tierAchievements.some(ta => ta.id === ua.achievement_id)
                    );
                    if (unlockedInTier.length === tierAchievements.length) {
                        notificationStore.tierCompleted(achievement);
                    }

                    return {
                        ...store,
                        unlockedAchievements: [...store.unlockedAchievements, userAchievement],
                        comboTimer: Date.now(),
                        comboAchievements
                    };
                });
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },

        // Update achievement progress
        async updateProgress(achievementId: string, progress: number[]) {
            try {
                const { data: userAchievement, error } = await supabase
                    .from('user_achievements')
                    .update({ progress })
                    .eq('achievement_id', achievementId)
                    .select()
                    .single();

                if (error) throw error;

                update(store => ({
                    ...store,
                    unlockedAchievements: store.unlockedAchievements.map(ua =>
                        ua.achievement_id === achievementId ? userAchievement : ua
                    )
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const achievementStore = createAchievementStore();

// Derived store for filtered achievements
export const filteredAchievements = derived(
    achievementStore,
    $store => {
        if ($store.selectedCategory === 'all') {
            return $store.achievements;
        }
        return $store.achievements.filter(achievement => {
            const types = achievement.requirement_type;
            switch ($store.selectedCategory) {
                case 'clicks':
                    return types.includes('total_clicks');
                case 'speed':
                    return types.includes('clicks_per_second');
                case 'upgrades':
                    return types.includes('upgrades_owned') || types.includes('unique_upgrades');
                case 'streaks':
                    return types.includes('click_streak');
                case 'time':
                    return types.includes('time_played');
                case 'prestige':
                    return types.includes('prestige_count');
                case 'combos':
                    return types.includes('combo_count') || types.includes('max_combo_multiplier');
                case 'social':
                    return types.includes('share_count') || types.includes('likes_received');
                case 'dedication':
                    return types.includes('daily_streak');
                case 'challenges':
                    return types.includes('perfect_challenge');
                default:
                    return true;
            }
        });
    }
);
