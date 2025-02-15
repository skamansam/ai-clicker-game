import { writable } from 'svelte/store';
import type { Achievement } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ComboState {
    currentCombo: number;
    maxCombo: number;
    lastAchievementTime: number | null;
    comboMultiplier: number;
    loading: boolean;
    error: string | null;
}

function createComboStore() {
    const { subscribe, set, update } = writable<ComboState>({
        currentCombo: 0,
        maxCombo: 0,
        lastAchievementTime: null,
        comboMultiplier: 1,
        loading: false,
        error: null
    });

    return {
        subscribe,
        
        // Reset combo
        resetCombo: () => {
            update(state => ({
                ...state,
                currentCombo: 0,
                comboMultiplier: 1,
                lastAchievementTime: null
            }));
        },

        // Add to combo
        addToCombo: async (achievement: Achievement) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                const now = Date.now();
                const comboRef = collection(db, 'achievement_combos');
                
                // Add the achievement to the combo
                await addDoc(comboRef, {
                    userId: user.uid,
                    achievementId: achievement.id,
                    timestamp: serverTimestamp(),
                    comboCount: state.currentCombo + 1
                });

                // Update user's max combo if needed
                const userStatsRef = collection(db, 'user_stats');
                const userStatsQuery = query(userStatsRef, where('userId', '==', user.uid));
                const userStatsSnapshot = await getDocs(userStatsQuery);

                if (!userStatsSnapshot.empty) {
                    const userStats = userStatsSnapshot.docs[0];
                    const currentMaxCombo = userStats.data().maxCombo || 0;
                    if (state.currentCombo + 1 > currentMaxCombo) {
                        await updateDoc(userStats.ref, {
                            maxCombo: state.currentCombo + 1,
                            updatedAt: serverTimestamp()
                        });
                    }
                } else {
                    // Create new user stats document
                    await addDoc(userStatsRef, {
                        userId: user.uid,
                        maxCombo: state.currentCombo + 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                update(state => ({
                    ...state,
                    currentCombo: state.currentCombo + 1,
                    maxCombo: Math.max(state.maxCombo, state.currentCombo + 1),
                    lastAchievementTime: now,
                    comboMultiplier: Math.min(5, 1 + state.currentCombo * 0.2), // Cap at 5x
                    loading: false
                }));
            } catch (error) {
                console.error('Error updating combo:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to update combo'
                }));
            }
        },

        // Load combo stats
        loadComboStats: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                const userStatsRef = collection(db, 'user_stats');
                const userStatsQuery = query(userStatsRef, where('userId', '==', user.uid));
                const userStatsSnapshot = await getDocs(userStatsQuery);

                if (!userStatsSnapshot.empty) {
                    const userStats = userStatsSnapshot.docs[0].data();
                    update(state => ({
                        ...state,
                        maxCombo: userStats.maxCombo || 0,
                        loading: false
                    }));
                }
            } catch (error) {
                console.error('Error loading combo stats:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to load combo stats'
                }));
            }
        }
    };
}

export const comboStore = createComboStore();
