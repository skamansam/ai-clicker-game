import { writable, derived } from 'svelte/store';
import type { AchievementChallenge, UserChallenge, ChallengeStatus } from '$lib/types';
import { supabase } from '$lib/supabase';
import { gameStore } from './game';

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
                const { data: challenges, error } = await supabase
                    .from('achievement_challenges')
                    .select('*')
                    .gte('end_time', new Date().toISOString());
                
                if (error) throw error;

                const { data: userChallenges, error: userError } = await supabase
                    .from('user_challenges')
                    .select('*');
                
                if (userError) throw userError;

                update(store => ({
                    ...store,
                    activeChallenges: challenges || [],
                    userChallenges: userChallenges || [],
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

        // Join a challenge
        async joinChallenge(challengeId: string) {
            try {
                const { data: challenge, error: challengeError } = await supabase
                    .from('achievement_challenges')
                    .select('*')
                    .eq('id', challengeId)
                    .single();

                if (challengeError) throw challengeError;

                const { data: userChallenge, error } = await supabase
                    .from('user_challenges')
                    .insert({
                        challenge_id: challengeId,
                        status: 'active',
                        progress: new Array(challenge.requirement_type.length).fill(0),
                        start_time: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                update(store => ({
                    ...store,
                    userChallenges: [...store.userChallenges, userChallenge]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },

        // Update challenge progress
        async updateProgress(challengeId: string, progress: number[]) {
            try {
                const { data: challenge } = await supabase
                    .from('achievement_challenges')
                    .select('*')
                    .eq('id', challengeId)
                    .single();

                const isCompleted = progress.every((p, i) => p >= challenge.requirement_values[i]);
                const status: ChallengeStatus = isCompleted ? 'completed' : 'active';

                const { data: userChallenge, error } = await supabase
                    .from('user_challenges')
                    .update({
                        progress,
                        status,
                        completion_time: isCompleted ? new Date().toISOString() : null
                    })
                    .eq('challenge_id', challengeId)
                    .select()
                    .single();

                if (error) throw error;

                if (isCompleted) {
                    // Apply challenge reward
                    gameStore.addMultiplier(challenge.reward_multiplier);
                }

                update(store => ({
                    ...store,
                    userChallenges: store.userChallenges.map(uc =>
                        uc.challenge_id === challengeId ? userChallenge : uc
                    )
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },

        // Check for expired challenges
        async checkExpiredChallenges() {
            const now = new Date();
            
            update(store => {
                const updatedChallenges = store.userChallenges.map(uc => {
                    const challenge = store.activeChallenges.find(c => c.id === uc.challenge_id);
                    if (!challenge) return uc;

                    const endTime = new Date(challenge.end_time);
                    if (uc.status === 'active' && endTime < now) {
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
