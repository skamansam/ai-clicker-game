import { writable } from 'svelte/store';
import type { Achievement, AchievementChallenge, UserAchievementChallenge } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';

interface Challenge {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    achievements: string[];
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title';
        value: number | string;
    }[];
    participants: number;
    leaderboard: {
        user_id: string;
        username: string;
        avatar_url: string;
        score: number;
        rank: number;
    }[];
    requirements: {
        type: 'achievements' | 'time' | 'combos' | 'perfect';
        value: number;
    }[];
}

interface Competition {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    type: 'speed' | 'collection' | 'streak' | 'points';
    target_achievements: string[];
    current_leader: {
        username: string;
        score: number;
    };
    participants: number;
    entry_fee: number;
    prize_pool: number;
    rewards: {
        rank: number;
        type: 'multiplier' | 'points' | 'badge' | 'title';
        value: number | string;
    }[];
}

interface ChallengeStore {
    activeChallenges: Challenge[];
    completedChallenges: Challenge[];
    activeCompetitions: Competition[];
    playerChallenges: {
        challenge_id: string;
        progress: number;
        completed: boolean;
        perfect: boolean;
        rewards_claimed: boolean;
    }[];
    playerCompetitions: {
        competition_id: string;
        rank: number;
        score: number;
        rewards_claimed: boolean;
    }[];
    loading: boolean;
    error: string | null;
}

function createChallengeStore() {
    const { subscribe, set, update } = writable<ChallengeStore>({
        activeChallenges: [],
        completedChallenges: [],
        activeCompetitions: [],
        playerChallenges: [],
        playerCompetitions: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadChallenges() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());

                // Load daily challenges
                const dailyChallengesRef = collection(db, 'achievement_challenges');
                const dailyChallengesQuery = query(dailyChallengesRef, 
                    where('type', '==', 'daily'),
                    where('startDate', '>=', startOfDay),
                    orderBy('startDate')
                );
                const dailyChallengesSnapshot = await getDocs(dailyChallengesQuery);
                const dailyChallenges = dailyChallengesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Challenge[];

                // Load weekly challenges
                const weeklyChallengesQuery = query(dailyChallengesRef,
                    where('type', '==', 'weekly'),
                    where('startDate', '>=', startOfWeek),
                    orderBy('startDate')
                );
                const weeklyChallengesSnapshot = await getDocs(weeklyChallengesQuery);
                const weeklyChallenges = weeklyChallengesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Challenge[];

                // Load user's challenge progress
                const userChallengesRef = collection(db, 'player_challenges');
                const userChallengesQuery = query(userChallengesRef,
                    where('userId', '==', auth.currentUser.uid),
                    where('startDate', '>=', startOfWeek)
                );
                const userChallengesSnapshot = await getDocs(userChallengesQuery);
                const userChallenges = userChallengesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as {
                    challenge_id: string;
                    progress: number;
                    completed: boolean;
                    perfect: boolean;
                    rewards_claimed: boolean;
                }[];

                update(store => ({
                    ...store,
                    activeChallenges: [...dailyChallenges, ...weeklyChallenges],
                    playerChallenges: userChallenges,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading challenges:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async joinChallenge(challengeId: string) {
            try {
                const userChallengesRef = collection(db, 'player_challenges');
                await addDoc(userChallengesRef, {
                    userId: auth.currentUser.uid,
                    challengeId,
                    progress: 0,
                    startDate: serverTimestamp(),
                    completed: false,
                    perfect: false,
                    rewards_claimed: false
                });

                await this.loadChallenges();
            } catch (error) {
                console.error('Error joining challenge:', error);
            }
        },

        async joinCompetition(competitionId: string) {
            try {
                const competitionsRef = collection(db, 'achievement_competitions');
                const competitionQuery = query(competitionsRef,
                    where('id', '==', competitionId)
                );
                const competitionSnapshot = await getDocs(competitionQuery);
                const competition = competitionSnapshot.docs[0].data();

                await addDoc(collection(db, 'player_competitions'), {
                    userId: auth.currentUser.uid,
                    competitionId,
                    rank: 0,
                    score: 0,
                    rewards_claimed: false
                });

                await this.loadChallenges();
            } catch (error) {
                console.error('Error joining competition:', error);
            }
        },

        async updateProgress(challengeId: string, progress: number) {
            try {
                const userChallengesRef = collection(db, 'player_challenges');
                const userChallengeQuery = query(userChallengesRef,
                    where('userId', '==', auth.currentUser.uid),
                    where('challengeId', '==', challengeId)
                );
                const userChallengeSnapshot = await getDocs(userChallengeQuery);

                if (!userChallengeSnapshot.empty) {
                    const userChallenge = userChallengeSnapshot.docs[0];
                    await updateDoc(userChallenge.ref, {
                        progress,
                        updatedAt: serverTimestamp()
                    });

                    update(store => ({
                        ...store,
                        playerChallenges: store.playerChallenges.map(pc =>
                            pc.challenge_id === challengeId
                                ? { ...pc, progress }
                                : pc
                        )
                    }));
                }
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        },

        async completeChallenge(challengeId: string, perfect: boolean) {
            try {
                const userChallengesRef = collection(db, 'player_challenges');
                const userChallengeQuery = query(userChallengesRef,
                    where('userId', '==', auth.currentUser.uid),
                    where('challengeId', '==', challengeId)
                );
                const userChallengeSnapshot = await getDocs(userChallengeQuery);

                if (!userChallengeSnapshot.empty) {
                    const userChallenge = userChallengeSnapshot.docs[0];
                    await updateDoc(userChallenge.ref, {
                        completed: true,
                        perfect,
                        progress: 100,
                        updatedAt: serverTimestamp()
                    });

                    await this.loadChallenges();
                }
            } catch (error) {
                console.error('Error completing challenge:', error);
            }
        },

        async claimRewards(challengeId: string) {
            try {
                const userChallengesRef = collection(db, 'player_challenges');
                const userChallengeQuery = query(userChallengesRef,
                    where('userId', '==', auth.currentUser.uid),
                    where('challengeId', '==', challengeId)
                );
                const userChallengeSnapshot = await getDocs(userChallengeQuery);

                if (!userChallengeSnapshot.empty) {
                    const userChallenge = userChallengeSnapshot.docs[0];
                    await updateDoc(userChallenge.ref, {
                        rewards_claimed: true,
                        updatedAt: serverTimestamp()
                    });

                    update(store => ({
                        ...store,
                        playerChallenges: store.playerChallenges.map(pc =>
                            pc.challenge_id === challengeId
                                ? { ...pc, rewards_claimed: true }
                                : pc
                        )
                    }));
                }
            } catch (error) {
                console.error('Error claiming rewards:', error);
            }
        },

        getChallenge(challengeId: string) {
            return this.activeChallenges.find(c => c.id === challengeId);
        },

        getCompetition(competitionId: string) {
            return this.activeCompetitions.find(c => c.id === competitionId);
        },

        getChallengeProgress(challengeId: string) {
            return this.playerChallenges.find(pc => pc.challenge_id === challengeId);
        },

        getCompetitionProgress(competitionId: string) {
            return this.playerCompetitions.find(pc => pc.competition_id === competitionId);
        }
    };
}

export const challengeStore = createChallengeStore();
