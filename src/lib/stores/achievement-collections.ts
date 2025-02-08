import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';
import { shopStore } from './achievement-shop';

interface AchievementSet {
    id: string;
    name: string;
    description: string;
    achievements: string[];
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    theme?: {
        color: string;
        icon: string;
        background_url?: string;
    };
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master';
    completion_bonus: number;
    perfect_bonus: number;
    time_bonus?: {
        time: number; // in milliseconds
        bonus: number;
    };
}

interface Collection {
    id: string;
    name: string;
    description: string;
    sets: string[];
    theme: {
        color: string;
        icon: string;
        background_url?: string;
    };
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    completion_bonus: number;
    perfect_bonus: number;
    limited_time?: boolean;
    end_time?: string;
}

interface CollectionProgress {
    collection_id: string;
    sets_completed: number;
    total_sets: number;
    achievements_completed: number;
    total_achievements: number;
    perfect_sets: number;
    rewards_claimed: boolean;
    completion_time?: string;
}

interface SetProgress {
    set_id: string;
    achievements_completed: number;
    total_achievements: number;
    perfect: boolean;
    rewards_claimed: boolean;
    completion_time?: string;
    time_bonus_earned?: number;
}

interface CollectionStore {
    collections: Collection[];
    sets: AchievementSet[];
    collectionProgress: CollectionProgress[];
    setProgress: SetProgress[];
    activeCollection?: string;
    loading: boolean;
    error: string | null;
}

function createCollectionStore() {
    const { subscribe, set, update } = writable<CollectionStore>({
        collections: [],
        sets: [],
        collectionProgress: [],
        setProgress: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadCollections() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                // Load collections
                const { data: collections, error: collectionsError } = await supabase
                    .from('achievement_collections')
                    .select('*')
                    .or('limited_time.is.null,end_time.gt.now()');

                if (collectionsError) throw collectionsError;

                // Load sets
                const { data: sets, error: setsError } = await supabase
                    .from('achievement_sets')
                    .select('*');

                if (setsError) throw setsError;

                // Load progress
                const { data: collectionProgress, error: collectionError } = await supabase
                    .from('collection_progress')
                    .select('*');

                if (collectionError) throw collectionError;

                const { data: setProgress, error: setError } = await supabase
                    .from('set_progress')
                    .select('*');

                if (setError) throw setError;

                update(store => ({
                    ...store,
                    collections,
                    sets,
                    collectionProgress,
                    setProgress,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading collections:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async setActiveCollection(collectionId: string) {
            update(store => ({
                ...store,
                activeCollection: collectionId
            }));
        },

        async checkSetCompletion(setId: string) {
            const set = this.sets.find(s => s.id === setId);
            if (!set) return;

            const unlockedAchievements = achievementStore.getUnlockedAchievements();
            const completedAchievements = set.achievements.filter(id =>
                unlockedAchievements.some(ua => ua.id === id)
            );

            const perfect = completedAchievements.length === set.achievements.length;
            const progress = this.setProgress.find(sp => sp.set_id === setId);

            if (perfect && (!progress || !progress.rewards_claimed)) {
                await this.claimSetRewards(setId);
            }

            // Check if this completes any collections
            const collections = this.collections.filter(c =>
                c.sets.includes(setId)
            );

            for (const collection of collections) {
                await this.checkCollectionCompletion(collection.id);
            }
        },

        async checkCollectionCompletion(collectionId: string) {
            const collection = this.collections.find(c => c.id === collectionId);
            if (!collection) return;

            const progress = this.collectionProgress.find(cp =>
                cp.collection_id === collectionId
            );

            const setProgresses = this.setProgress.filter(sp =>
                collection.sets.includes(sp.set_id)
            );

            const perfect = setProgresses.every(sp => sp.perfect);
            const complete = setProgresses.every(sp =>
                sp.achievements_completed === sp.total_achievements
            );

            if (complete && (!progress || !progress.rewards_claimed)) {
                await this.claimCollectionRewards(collectionId, perfect);
            }
        },

        async claimSetRewards(setId: string) {
            try {
                const { error } = await supabase
                    .rpc('claim_set_rewards', {
                        set_id: setId
                    });

                if (error) throw error;

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Completed achievement set!`
                );

                await this.loadCollections();
            } catch (error) {
                console.error('Error claiming set rewards:', error);
            }
        },

        async claimCollectionRewards(collectionId: string, perfect: boolean) {
            try {
                const { error } = await supabase
                    .rpc('claim_collection_rewards', {
                        collection_id: collectionId,
                        perfect
                    });

                if (error) throw error;

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Completed achievement collection${perfect ? ' perfectly' : ''}!`
                );

                await this.loadCollections();
            } catch (error) {
                console.error('Error claiming collection rewards:', error);
            }
        },

        getCollection(collectionId: string) {
            return this.collections.find(c => c.id === collectionId);
        },

        getSet(setId: string) {
            return this.sets.find(s => s.id === setId);
        },

        getCollectionProgress(collectionId: string) {
            return this.collectionProgress.find(cp => cp.collection_id === collectionId);
        },

        getSetProgress(setId: string) {
            return this.setProgress.find(sp => sp.set_id === setId);
        },

        getCollectionSets(collectionId: string) {
            const collection = this.getCollection(collectionId);
            if (!collection) return [];
            return this.sets.filter(s => collection.sets.includes(s.id));
        },

        getSetAchievements(setId: string) {
            const set = this.getSet(setId);
            if (!set) return [];
            return achievementStore.achievements.filter(a => set.achievements.includes(a.id));
        },

        calculateSetCompletion(setId: string) {
            const progress = this.getSetProgress(setId);
            if (!progress) return 0;
            return (progress.achievements_completed / progress.total_achievements) * 100;
        },

        calculateCollectionCompletion(collectionId: string) {
            const progress = this.getCollectionProgress(collectionId);
            if (!progress) return 0;
            return (progress.achievements_completed / progress.total_achievements) * 100;
        },

        getTimeBonus(setId: string) {
            const progress = this.getSetProgress(setId);
            if (!progress || !progress.time_bonus_earned) return 0;
            return progress.time_bonus_earned;
        },

        getTotalRewards(collectionId: string) {
            const collection = this.getCollection(collectionId);
            if (!collection) return [];

            const sets = this.getCollectionSets(collectionId);
            const setRewards = sets.flatMap(s => s.rewards);
            
            return [...collection.rewards, ...setRewards].reduce((acc, reward) => {
                const existing = acc.find(r => r.type === reward.type);
                if (existing) {
                    if (typeof existing.value === 'number' && typeof reward.value === 'number') {
                        existing.value += reward.value;
                    }
                } else {
                    acc.push({ ...reward });
                }
                return acc;
            }, [] as typeof collection.rewards);
        }
    };
}

export const collectionStore = createCollectionStore();
