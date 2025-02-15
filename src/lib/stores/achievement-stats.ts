import { writable } from 'svelte/store';
import type { Achievement, AchievementStats, ActivityLog } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, limit, increment } from 'firebase/firestore';

interface AchievementStatsStore {
    stats: AchievementStats[];
    leaderboards: Record<string, AchievementStats[]>;
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
                const globalStatsRef = collection(db, 'global_achievement_stats');
                const globalStatsSnapshot = await getDocs(globalStatsRef);
                const globalData = globalStatsSnapshot.docs[0].data();

                // Load player stats
                const user = auth.currentUser;
                if (!user) return;

                const userStatsRef = collection(db, 'user_achievement_stats');
                const userStatsQuery = query(userStatsRef, where('userId', '==', user.uid));
                const userStatsSnapshot = await getDocs(userStatsQuery);
                let playerData;

                if (!userStatsSnapshot.empty) {
                    playerData = {
                        id: userStatsSnapshot.docs[0].id,
                        ...userStatsSnapshot.docs[0].data()
                    };
                } else {
                    // Initialize stats if they don't exist
                    const newStatsRef = await addDoc(userStatsRef, {
                        userId: user.uid,
                        totalUnlocked: 0,
                        completionRate: 0,
                        averageTimeToUnlock: '0',
                        bestStreak: 0,
                        currentStreak: 0,
                        favoriteCategory: '',
                        rarest: null,
                        fastest: null,
                        recentActivity: [],
                        categoryProgress: {},
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    playerData = {
                        id: newStatsRef.id,
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
                    };
                }

                // Load category progress
                const categoryProgressRef = collection(db, 'category_progress');
                const categoryProgressQuery = query(categoryProgressRef, where('userId', '==', user.uid));
                const categoryProgressSnapshot = await getDocs(categoryProgressQuery);
                const categoryData = categoryProgressSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                update(store => ({
                    ...store,
                    globalStats: {
                        ...store.globalStats,
                        ...globalData
                    },
                    playerStats: {
                        ...store.playerStats,
                        ...playerData,
                        categoryProgress: categoryData.reduce((acc, curr) => ({ ...acc, [curr.category]: curr }), {})
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
                const leaderboardRef = collection(db, 'achievement_leaderboard');
                const leaderboardQuery = query(leaderboardRef, where('achievementId', '==', achievementId));
                const leaderboardSnapshot = await getDocs(leaderboardQuery);
                const data = leaderboardSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

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
                const user = auth.currentUser;
                if (!user) return;

                const userStatsRef = collection(db, 'user_achievement_stats');
                const userStatsQuery = query(userStatsRef, where('userId', '==', user.uid));
                const userStatsSnapshot = await getDocs(userStatsQuery);

                if (!userStatsSnapshot.empty) {
                    const statsDoc = userStatsSnapshot.docs[0];
                    const lastAchievement = statsDoc.data().lastAchievement?.toDate();
                    const now = new Date();
                    const daysSinceLastAchievement = lastAchievement 
                        ? Math.floor((now.getTime() - lastAchievement.getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                    await updateDoc(statsDoc.ref, {
                        currentStreak: daysSinceLastAchievement === 1 ? increment(1) : 1,
                        longestStreak: daysSinceLastAchievement === 1 
                            ? increment(0) // Will be updated in the next step if needed
                            : statsDoc.data().longestStreak,
                        lastAchievement: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });

                    // Update longest streak if needed
                    if (daysSinceLastAchievement === 1 && statsDoc.data().currentStreak + 1 > statsDoc.data().longestStreak) {
                        await updateDoc(statsDoc.ref, {
                            longestStreak: statsDoc.data().currentStreak + 1
                        });
                    }
                }

                await achievementStatsStore.loadStats();
            } catch (error) {
                console.error('Error updating streak:', error);
            }
        },

        async recordActivity(type: 'unlock' | 'combo' | 'challenge', achievement?: Achievement, description?: string) {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const activityRef = collection(db, 'achievement_activity');
                await addDoc(activityRef, {
                    userId: user.uid,
                    achievementId: achievement?.id,
                    type,
                    description: description || `Unlocked ${achievement?.name}`,
                    timestamp: serverTimestamp()
                });

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
