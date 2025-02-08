import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';

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
                const { data: challenges, error: challengesError } = await supabase
                    .from('achievement_challenges')
                    .select('*')
                    .gte('end_time', new Date().toISOString());

                if (challengesError) throw challengesError;

                const { data: competitions, error: competitionsError } = await supabase
                    .from('achievement_competitions')
                    .select('*')
                    .gte('end_time', new Date().toISOString());

                if (competitionsError) throw competitionsError;

                const { data: playerProgress, error: progressError } = await supabase
                    .from('player_challenges')
                    .select('*');

                if (progressError) throw progressError;

                update(store => ({
                    ...store,
                    activeChallenges: challenges,
                    activeCompetitions: competitions,
                    playerChallenges: playerProgress,
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
                const { error } = await supabase
                    .from('player_challenges')
                    .insert({
                        challenge_id: challengeId,
                        progress: 0,
                        completed: false,
                        perfect: false,
                        rewards_claimed: false
                    });

                if (error) throw error;

                await this.loadChallenges();
            } catch (error) {
                console.error('Error joining challenge:', error);
            }
        },

        async joinCompetition(competitionId: string) {
            try {
                const { data: competition } = await supabase
                    .from('achievement_competitions')
                    .select('entry_fee')
                    .eq('id', competitionId)
                    .single();

                const { error } = await supabase
                    .rpc('join_competition', {
                        competition_id: competitionId,
                        entry_fee: competition.entry_fee
                    });

                if (error) throw error;

                await this.loadChallenges();
            } catch (error) {
                console.error('Error joining competition:', error);
            }
        },

        async updateProgress(challengeId: string, progress: number) {
            try {
                const { error } = await supabase
                    .from('player_challenges')
                    .update({ progress })
                    .eq('challenge_id', challengeId);

                if (error) throw error;

                update(store => ({
                    ...store,
                    playerChallenges: store.playerChallenges.map(pc =>
                        pc.challenge_id === challengeId
                            ? { ...pc, progress }
                            : pc
                    )
                }));
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        },

        async completeChallenge(challengeId: string, perfect: boolean) {
            try {
                const { error } = await supabase
                    .from('player_challenges')
                    .update({
                        completed: true,
                        perfect,
                        progress: 100
                    })
                    .eq('challenge_id', challengeId);

                if (error) throw error;

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Completed challenge${perfect ? ' perfectly' : ''}!`
                );

                await this.loadChallenges();
            } catch (error) {
                console.error('Error completing challenge:', error);
            }
        },

        async claimRewards(challengeId: string) {
            try {
                const { error } = await supabase
                    .rpc('claim_challenge_rewards', {
                        challenge_id: challengeId
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    playerChallenges: store.playerChallenges.map(pc =>
                        pc.challenge_id === challengeId
                            ? { ...pc, rewards_claimed: true }
                            : pc
                    )
                }));
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
