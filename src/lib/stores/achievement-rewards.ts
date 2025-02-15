import { writable } from 'svelte/store';
import type { Achievement, AchievementReward } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, doc, getDoc, increment } from 'firebase/firestore';

interface RewardStore {
    rewards: AchievementReward[];
    claimedRewards: string[];
    loading: boolean;
    error: string | null;
}

function createRewardStore() {
    const { subscribe, set, update } = writable<RewardStore>({
        rewards: [],
        claimedRewards: [],
        loading: false,
        error: null
    });

    return {
        subscribe,

        // Load rewards
        loadRewards: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Load all rewards
                const rewardsRef = collection(db, 'achievement_rewards');
                const rewardsSnapshot = await getDocs(rewardsRef);
                const rewards = rewardsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AchievementReward[];

                // Load claimed rewards
                const claimedRewardsRef = collection(db, 'user_claimed_rewards');
                const claimedRewardsQuery = query(claimedRewardsRef, where('userId', '==', user.uid));
                const claimedRewardsSnapshot = await getDocs(claimedRewardsQuery);
                const claimedRewards = claimedRewardsSnapshot.docs.map(doc => doc.data().rewardId);

                update(state => ({
                    ...state,
                    rewards,
                    claimedRewards,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading rewards:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to load rewards'
                }));
            }
        },

        // Claim reward
        claimReward: async (achievement: Achievement) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Get reward details
                const rewardsRef = collection(db, 'achievement_rewards');
                const rewardQuery = query(rewardsRef, where('achievementId', '==', achievement.id));
                const rewardSnapshot = await getDocs(rewardQuery);

                if (rewardSnapshot.empty) {
                    throw new Error('No reward found for this achievement');
                }

                const reward = {
                    id: rewardSnapshot.docs[0].id,
                    ...rewardSnapshot.docs[0].data()
                } as AchievementReward;

                // Check if already claimed
                const claimedRewardsRef = collection(db, 'user_claimed_rewards');
                const claimedQuery = query(claimedRewardsRef,
                    where('userId', '==', user.uid),
                    where('rewardId', '==', reward.id)
                );
                const claimedSnapshot = await getDocs(claimedQuery);

                if (!claimedSnapshot.empty) {
                    throw new Error('Reward already claimed');
                }

                // Apply reward
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User not found');
                }

                // Update user data based on reward type
                switch (reward.type) {
                    case 'points':
                        await updateDoc(userRef, {
                            points: increment(reward.value)
                        });
                        break;
                    case 'multiplier':
                        await updateDoc(userRef, {
                            multiplier: increment(reward.value)
                        });
                        break;
                    case 'currency':
                        await updateDoc(userRef, {
                            currency: increment(reward.value)
                        });
                        break;
                    // Add more reward types as needed
                }

                // Record claimed reward
                await addDoc(claimedRewardsRef, {
                    userId: user.uid,
                    rewardId: reward.id,
                    achievementId: achievement.id,
                    timestamp: serverTimestamp()
                });

                // Record activity
                const activityRef = collection(db, 'achievement_activity');
                await addDoc(activityRef, {
                    userId: user.uid,
                    type: 'reward_claim',
                    achievementId: achievement.id,
                    rewardId: reward.id,
                    timestamp: serverTimestamp()
                });

                await rewardStore.loadRewards();
            } catch (error) {
                console.error('Error claiming reward:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: error.message || 'Failed to claim reward'
                }));
            }
        },

        // Check if reward is claimed
        isRewardClaimed: (rewardId: string) => {
            const store = get(rewardStore);
            return store.claimedRewards.includes(rewardId);
        },

        // Get available rewards
        getAvailableRewards: (achievement: Achievement) => {
            const store = get(rewardStore);
            return store.rewards.filter(r => 
                r.achievementId === achievement.id && 
                !store.claimedRewards.includes(r.id)
            );
        }
    };
}

export const rewardStore = createRewardStore();
