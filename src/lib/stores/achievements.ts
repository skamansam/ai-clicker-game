import { writable, derived, get } from 'svelte/store';
import type { Achievement, UserAchievement } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { gameStore } from './game';
import { notificationStore } from './notifications';
import { browser } from '$app/environment';
import { achievements as achievementData } from '$lib/data/achievements';

export type AchievementCategory = 'clicks' | 'speed' | 'upgrades' | 'streaks' | 'time' | 'prestige' | 'combos' | 'social' | 'dedication' | 'challenges';

interface AchievementStore {
    achievements: Achievement[];
    unlockedAchievements: UserAchievement[];
    categories: AchievementCategory[];
    selectedCategory: AchievementCategory | 'all';
    comboTimer: number | null;
    comboAchievements: Achievement[];
    recentUnlocks: Achievement[];
    loading: boolean;
    error: string | null;
}

const COMBO_TIMEOUT = 2000; // 2 seconds to chain achievements
const NOTIFICATION_DURATION = 5000; // 5 seconds for notifications
const COMBO_MULTIPLIERS = [1, 1.2, 1.5, 2, 3, 5]; // Multipliers for combo chains

function createAchievementStore() {
    const { subscribe, set, update } = writable<AchievementStore>({
        achievements: achievementData,
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
        recentUnlocks: [],
        loading: false,
        error: null
    });

    let comboTimeout: NodeJS.Timeout;

    return {
        subscribe,
        setCategory: (category: AchievementCategory | 'all') => {
            update(state => ({ ...state, selectedCategory: category }));
        },
        loadAchievements: async () => {
            if (!browser) return;
            
            // No need to load achievements from Firestore anymore
            // They're already loaded from local data
            return;
        },
        loadUserAchievements: async () => {
            if (!browser) return;
            
            const user = auth.currentUser;
            if (!user) {
                update(state => ({ ...state, unlockedAchievements: [] }));
                return;
            }

            try {
                const userAchievementsRef = collection(db, `users/${user.uid}/achievements`);
                const userAchievementsSnapshot = await getDocs(userAchievementsRef);
                const unlockedAchievements = userAchievementsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as UserAchievement[];

                update(state => ({ ...state, unlockedAchievements }));
            } catch (error) {
                console.error('Error loading user achievements:', error);
            }
        },
        resetProgress: async () => {
            if (!browser) return;
            
            try {
                // Stop all timers and auto-clickers
                if (comboTimeout) {
                    clearTimeout(comboTimeout);
                    comboTimeout = null;
                }

                // Stop game timers and auto-clickers
                // This will also reset game stats
                gameStore.stopAllTimers();

                // Delete user achievements if logged in
                const user = auth.currentUser;
                if (user) {
                    const userAchievementsRef = collection(db, `users/${user.uid}/achievements`);
                    const userAchievementsSnapshot = await getDocs(userAchievementsRef);
                    
                    const deletePromises = userAchievementsSnapshot.docs.map(doc => 
                        deleteDoc(doc.ref)
                    );
                    
                    await Promise.all(deletePromises);
                }

                // Reset store state - make sure to keep base achievements but clear everything else
                update(state => ({
                    ...state,
                    unlockedAchievements: [],
                    comboTimer: null,
                    comboAchievements: [],
                    recentUnlocks: [],
                    loading: false,
                    error: null
                }));

                // Show success notification
                notificationStore.notify({
                    type: 'challenge',
                    title: 'Reset Complete',
                    message: 'Achievement progress has been reset',
                    icon: '🔄',
                    color: '#10b981'
                });
            } catch (error) {
                console.error('Error resetting achievements:', error);
                notificationStore.notify({
                    type: 'challenge',
                    title: 'Reset Failed',
                    message: 'Failed to reset achievement progress',
                    icon: '⚠️',
                    color: '#ef4444'
                });
            }
        },
        checkAchievements: async () => {
            if (!browser) return;
            
            const state = get(achievementStore);
            const gameState = get(gameStore);
            const unlockedIds = new Set(state.unlockedAchievements.map(a => a.id));

            for (const achievement of state.achievements) {
                if (unlockedIds.has(achievement.id)) continue;

                let isUnlocked = false;
                switch (achievement.type) {
                    case 'clicks':
                        isUnlocked = gameState.totalClicks >= achievement.requirement;
                        break;
                    case 'speed':
                        isUnlocked = gameState.clicksPerSecond >= achievement.requirement;
                        break;
                    case 'upgrades':
                        isUnlocked = Object.keys(gameState.upgrades).length >= achievement.requirement;
                        break;
                    case 'streaks':
                        // Handled by streak store
                        break;
                    case 'time':
                        // Handled by time played store
                        break;
                    case 'prestige':
                        // Handled by prestige store
                        break;
                    case 'combos':
                        // Handled by combo store
                        break;
                    case 'social':
                        // Handled by social store
                        break;
                    case 'dedication':
                        // Handled by dedication store
                        break;
                    case 'challenges':
                        // Handled by challenge store
                        break;
                }

                if (isUnlocked) {
                    try {
                        const now = new Date();
                        update(state => ({
                            ...state,
                            unlockedAchievements: [...state.unlockedAchievements, {
                                id: achievement.id,
                                unlockedAt: now,
                                progress: 100
                            }],
                            recentUnlocks: [...state.recentUnlocks, achievement]
                        }));

                        // Remove from recent unlocks after duration
                        setTimeout(() => {
                            update(state => ({
                                ...state,
                                recentUnlocks: state.recentUnlocks.filter(a => a.id !== achievement.id)
                            }));
                        }, NOTIFICATION_DURATION);

                        const user = auth.currentUser;
                        if (user) {
                            const userAchievementRef = collection(db, `users/${user.uid}/achievements`);
                            await addDoc(userAchievementRef, {
                                achievementId: achievement.id,
                                unlockedAt: now,
                                progress: 100
                            }).catch(console.error);
                        }

                        notificationStore.achievementUnlocked(achievement);
                    } catch (error) {
                        console.error('Error unlocking achievement:', error);
                    }
                }
            }
        },
        unlockAchievement: async (achievement: Achievement) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userAchievementsRef = collection(db, `users/${user.uid}/achievements`);
                await addDoc(userAchievementsRef, {
                    achievementId: achievement.id,
                    unlockedAt: new Date(),
                    progress: 100
                });

                update(state => ({
                    ...state,
                    unlockedAchievements: [...state.unlockedAchievements, {
                        id: achievement.id,
                        unlockedAt: new Date(),
                        progress: 100
                    }],
                    recentUnlocks: [...state.recentUnlocks, achievement]
                }));

                // Remove from recent unlocks after duration
                setTimeout(() => {
                    update(state => ({
                        ...state,
                        recentUnlocks: state.recentUnlocks.filter(a => a.id !== achievement.id)
                    }));
                }, NOTIFICATION_DURATION);

                notificationStore.achievementUnlocked(achievement);

            } catch (error) {
                console.error('Error unlocking achievement:', error);
            }
        },
        unlockAchievementWithCombo: async (achievement: Achievement, progress: number[]) => {
            try {
                const { data: userAchievement, error } = await addDoc(collection(db, 'user_achievements'), {
                    userId: auth.currentUser.uid,
                    achievementId: achievement.id,
                    progress,
                    unlockedAt: new Date().toISOString()
                });

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
                        ua => tierAchievements.some(ta => ta.id === ua.achievementId)
                    );
                    if (unlockedInTier.length === tierAchievements.length) {
                        notificationStore.tierCompleted(achievement);
                    }

                    return {
                        ...store,
                        unlockedAchievements: [...store.unlockedAchievements, userAchievement],
                        comboTimer: Date.now(),
                        comboAchievements,
                        recentUnlocks: [...store.recentUnlocks, achievement]
                    };
                });
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        updateProgress: async (achievementId: string, progress: number[]) => {
            try {
                const userAchievementsRef = collection(db, `users/${auth.currentUser.uid}/achievements`);
                const q = query(userAchievementsRef, where('achievementId', '==', achievementId));
                const userAchievementsSnapshot = await getDocs(q);
                const userAchievementRef = userAchievementsSnapshot.docs[0].ref;
                await updateDoc(userAchievementRef, { progress });

                update(state => ({
                    ...state,
                    unlockedAchievements: state.unlockedAchievements.map(ua =>
                        ua.achievementId === achievementId ? { ...ua, progress } : ua
                    )
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        getAchievementsByCategory: (category: AchievementCategory) => {
            return achievementStore.achievements.filter(achievement => {
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
        }
    };
}

export const achievementStore = createAchievementStore();

// Derived store for filtered achievements
export const filteredAchievements = derived(
    [achievementStore],
    ([$achievementStore]) => {
        const { achievements, selectedCategory, unlockedAchievements, recentUnlocks } = $achievementStore;
        const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

        return achievements
            .filter(achievement => 
                selectedCategory === 'all' || achievement.type === selectedCategory
            )
            .map(achievement => ({
                ...achievement,
                unlocked: unlockedIds.has(achievement.id),
                recent: recentUnlocks.some(a => a.id === achievement.id)
            }));
    }
);
