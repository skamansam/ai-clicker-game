import { writable, derived } from 'svelte/store';
import type { AchievementChallenge, UserChallenge, ChallengeStatus } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

interface ChallengesStore {
    activeChallenges: AchievementChallenge[];
    userChallenges: UserChallenge[];
    loading: boolean;
    error: string | null;
}

function createChallengesStore() {
    const { subscribe, set, update } = writable<ChallengesStore>({
        activeChallenges: [],
        userChallenges: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        
        // Load active challenges
        async loadChallenges() {
            update(store => ({ ...store, loading: true }));
            
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Get all challenges
                const challengesRef = collection(db, 'achievement_challenges');
                const challengesQuery = query(challengesRef, orderBy('startDate', 'desc'));
                const challengesSnapshot = await getDocs(challengesQuery);
                const challenges = challengesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AchievementChallenge[];

                // Get user's challenges
                const userChallengesRef = collection(db, 'user_challenges');
                const userChallengesQuery = query(userChallengesRef, 
                    where('userId', '==', user.uid),
                    orderBy('startedAt', 'desc')
                );
                const userChallengesSnapshot = await getDocs(userChallengesQuery);
                const userChallenges = userChallengesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as UserChallenge[];

                // Filter active challenges
                const now = new Date();
                const activeChallenges = challenges.filter(challenge => {
                    const startDate = new Date(challenge.startDate);
                    const endDate = new Date(challenge.endDate);
                    return now >= startDate && now <= endDate;
                });

                update(store => ({
                    ...store,
                    activeChallenges,
                    userChallenges,
                    loading: false,
                    error: null
                }));
            } catch (error) {
                console.error('Error loading challenges:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: 'Failed to load challenges'
                }));
            }
        },

        // Join a challenge
        async joinChallenge(challengeId: string) {
            try {
                const user = auth.currentUser;
                if (!user) return;

                const challengesRef = collection(db, 'achievement_challenges');
                const challengeQuery = query(challengesRef, where('id', '==', challengeId));
                const challengeSnapshot = await getDocs(challengeQuery);
                const challenge = challengeSnapshot.docs[0].data() as AchievementChallenge;

                const userChallengesRef = collection(db, 'user_challenges');
                await addDoc(userChallengesRef, {
                    userId: user.uid,
                    challengeId,
                    status: 'active',
                    progress: new Array(challenge.requirement_type.length).fill(0),
                    startedAt: serverTimestamp()
                });

                update(store => ({
                    ...store,
                    userChallenges: [...store.userChallenges, {
                        id: '',
                        userId: user.uid,
                        challengeId,
                        status: 'active',
                        progress: new Array(challenge.requirement_type.length).fill(0),
                        startedAt: serverTimestamp()
                    }]
                }));
            } catch (error) {
                console.error('Error joining challenge:', error);
                update(store => ({ ...store, error: 'Failed to join challenge' }));
            }
        },

        // Update challenge progress
        async updateProgress(challengeId: string, progress: number[]) {
            try {
                const user = auth.currentUser;
                if (!user) return;

                const challengesRef = collection(db, 'achievement_challenges');
                const challengeQuery = query(challengesRef, where('id', '==', challengeId));
                const challengeSnapshot = await getDocs(challengeQuery);
                const challenge = challengeSnapshot.docs[0].data() as AchievementChallenge;

                const userChallengesRef = collection(db, 'user_challenges');
                const userChallengeQuery = query(userChallengesRef,
                    where('userId', '==', user.uid),
                    where('challengeId', '==', challengeId),
                    where('status', '==', 'active'),
                    limit(1)
                );
                const userChallengeSnapshot = await getDocs(userChallengeQuery);

                if (!userChallengeSnapshot.empty) {
                    const userChallenge = userChallengeSnapshot.docs[0];
                    const isCompleted = progress.every((p, i) => p >= challenge.requirement_values[i]);
                    const status: ChallengeStatus = isCompleted ? 'completed' : 'active';

                    await updateDoc(userChallenge.ref, {
                        progress,
                        updatedAt: serverTimestamp(),
                        status
                    });

                    if (isCompleted) {
                        // Apply challenge reward
                        // gameStore.addMultiplier(challenge.reward_multiplier);
                    }

                    update(store => ({
                        ...store,
                        userChallenges: store.userChallenges.map(uc =>
                            uc.challengeId === challengeId ? {
                                ...uc,
                                progress,
                                status
                            } : uc
                        )
                    }));
                }
            } catch (error) {
                console.error('Error updating challenge progress:', error);
                update(store => ({ ...store, error: 'Failed to update challenge progress' }));
            }
        },

        // Check for expired challenges
        async checkExpiredChallenges() {
            const now = new Date();
            
            update(store => {
                const updatedChallenges = store.userChallenges.map(uc => {
                    const challenge = store.activeChallenges.find(c => c.id === uc.challengeId);
                    if (!challenge) return uc;

                    const endDate = new Date(challenge.endDate);
                    if (uc.status === 'active' && endDate < now) {
                        return { ...uc, status: 'expired' };
                    }
                    return uc;
                });

                return {
                    ...store,
                    userChallenges: updatedChallenges
                };
            });
        }
    };
}

export const challengesStore = createChallengesStore();
