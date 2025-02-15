import { writable, get } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, doc, getDoc, increment } from 'firebase/firestore';

interface PrestigeLevel {
    level: number;
    name: string;
    description: string;
    requirements: {
        achievements: number;
        points: number;
        collections: number;
    };
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title';
        value: number | string;
    }[];
}

interface PrestigeStore {
    currentLevel: number;
    nextLevel: number;
    totalPrestige: number;
    prestigePoints: number;
    levels: PrestigeLevel[];
    loading: boolean;
    error: string | null;
}

function createPrestigeStore() {
    const { subscribe, set, update } = writable<PrestigeStore>({
        currentLevel: 0,
        nextLevel: 1,
        totalPrestige: 0,
        prestigePoints: 0,
        levels: [],
        loading: false,
        error: null
    });

    return {
        subscribe,

        // Load prestige data
        loadPrestigeData: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Load prestige levels
                const prestigeLevelsRef = collection(db, 'prestige_levels');
                const prestigeLevelsSnapshot = await getDocs(prestigeLevelsRef);
                const levels = prestigeLevelsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PrestigeLevel[];

                // Load user prestige data
                const userPrestigeRef = doc(db, 'user_prestige', user.uid);
                const userPrestigeDoc = await getDoc(userPrestigeRef);

                let prestigeData;
                if (userPrestigeDoc.exists()) {
                    prestigeData = userPrestigeDoc.data();
                } else {
                    // Initialize prestige data if it doesn't exist
                    prestigeData = {
                        currentLevel: 0,
                        nextLevel: 1,
                        totalPrestige: 0,
                        prestigePoints: 0
                    };
                    await updateDoc(userPrestigeRef, {
                        ...prestigeData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                update(state => ({
                    ...state,
                    ...prestigeData,
                    levels,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading prestige data:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to load prestige data'
                }));
            }
        },

        // Prestige up
        prestige: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                const store = get(prestigeStore);
                const nextLevelData = store.levels.find(l => l.level === store.nextLevel);

                if (!nextLevelData) {
                    throw new Error('Next prestige level not found');
                }

                // Check requirements
                const userStatsRef = doc(db, 'user_stats', user.uid);
                const userStatsDoc = await getDoc(userStatsRef);
                
                if (!userStatsDoc.exists()) {
                    throw new Error('User stats not found');
                }

                const stats = userStatsDoc.data();
                if (
                    stats.achievements < nextLevelData.requirements.achievements ||
                    stats.points < nextLevelData.requirements.points ||
                    stats.collections < nextLevelData.requirements.collections
                ) {
                    throw new Error('Requirements not met for prestige');
                }

                // Calculate prestige points
                const prestigePoints = Math.floor(
                    (stats.achievements * 0.5) +
                    (stats.points * 0.1) +
                    (stats.collections * 2)
                );

                // Update user prestige data
                const userPrestigeRef = doc(db, 'user_prestige', user.uid);
                await updateDoc(userPrestigeRef, {
                    currentLevel: store.nextLevel,
                    nextLevel: store.nextLevel + 1,
                    totalPrestige: increment(1),
                    prestigePoints: increment(prestigePoints),
                    updatedAt: serverTimestamp()
                });

                // Reset relevant stats
                await updateDoc(userStatsRef, {
                    points: 0,
                    multiplier: 1,
                    updatedAt: serverTimestamp()
                });

                // Record prestige event
                const prestigeHistoryRef = collection(db, 'prestige_history');
                await addDoc(prestigeHistoryRef, {
                    userId: user.uid,
                    level: store.nextLevel,
                    pointsGained: prestigePoints,
                    timestamp: serverTimestamp()
                });

                // Apply prestige rewards
                for (const reward of nextLevelData.rewards) {
                    switch (reward.type) {
                        case 'multiplier':
                            await updateDoc(userStatsRef, {
                                baseMultiplier: increment(reward.value)
                            });
                            break;
                        case 'badge':
                        case 'title':
                            const userRewardsRef = doc(db, 'user_rewards', user.uid);
                            await updateDoc(userRewardsRef, {
                                [`${reward.type}s`]: increment(reward.value),
                                updatedAt: serverTimestamp()
                            });
                            break;
                    }
                }

                await prestigeStore.loadPrestigeData();
            } catch (error) {
                console.error('Error prestiging:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: error.message || 'Failed to prestige'
                }));
            }
        },

        // Check if can prestige
        canPrestige: async () => {
            const user = auth.currentUser;
            if (!user) return false;

            try {
                const store = get(prestigeStore);
                const nextLevelData = store.levels.find(l => l.level === store.nextLevel);

                if (!nextLevelData) return false;

                const userStatsRef = doc(db, 'user_stats', user.uid);
                const userStatsDoc = await getDoc(userStatsRef);

                if (!userStatsDoc.exists()) return false;

                const stats = userStatsDoc.data();
                return (
                    stats.achievements >= nextLevelData.requirements.achievements &&
                    stats.points >= nextLevelData.requirements.points &&
                    stats.collections >= nextLevelData.requirements.collections
                );
            } catch (error) {
                console.error('Error checking prestige eligibility:', error);
                return false;
            }
        },

        // Get prestige level info
        getLevelInfo: (level: number) => {
            const store = get(prestigeStore);
            return store.levels.find(l => l.level === level);
        },

        // Get progress towards next level
        getNextLevelProgress: async () => {
            const user = auth.currentUser;
            if (!user) return null;

            try {
                const store = get(prestigeStore);
                const nextLevelData = store.levels.find(l => l.level === store.nextLevel);

                if (!nextLevelData) return null;

                const userStatsRef = doc(db, 'user_stats', user.uid);
                const userStatsDoc = await getDoc(userStatsRef);

                if (!userStatsDoc.exists()) return null;

                const stats = userStatsDoc.data();
                return {
                    achievements: {
                        current: stats.achievements,
                        required: nextLevelData.requirements.achievements
                    },
                    points: {
                        current: stats.points,
                        required: nextLevelData.requirements.points
                    },
                    collections: {
                        current: stats.collections,
                        required: nextLevelData.requirements.collections
                    }
                };
            } catch (error) {
                console.error('Error getting next level progress:', error);
                return null;
            }
        }
    };
}

export const prestigeStore = createPrestigeStore();
